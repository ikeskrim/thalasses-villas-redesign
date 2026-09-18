import { test, expect, type APIResponse } from "@playwright/test";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { createRateLimiter } from "../src/lib/rate-limit";

/**
 * THE SECURITY AUDIT, AS ASSERTIONS (`SECURITY-NOTES.md` §4).
 *
 * Headers are asserted on the served build rather than read out of
 * next.config.ts, because a header that is configured and not sent — a matcher
 * that misses, a platform that strips it — protects nobody. The policy is then
 * exercised: every route the audit names is loaded and scrolled with the
 * policy on, and a single violation fails, because a CSP that breaks the page
 * is the kind that gets switched off in a hurry.
 *
 * Two policies ship. The prerendered routes get next.config.ts's static one;
 * /en/contact, which is rendered per request anyway, gets a per-request nonce
 * from src/proxy.ts. The nonce is only worth anything if Next actually stamps
 * it on every script it writes and never repeats it, so both are asserted on
 * the raw HTML — a browser hides `nonce` from the DOM once the page has loaded.
 *
 * WHAT A RUN AGAINST `next start` CANNOT SHOW: the two policies stacking. Next
 * collects config headers and proxy headers under differently-cased keys and
 * writes them with Node's case-insensitive `setHeader`, so the proxy's CSP
 * replaces the config's and a response carries one either way. The
 * one-policy assertions below catch a MISSING policy, or the wrong one; they
 * cannot catch a doubled one. That the two sources never overlap is checked by
 * `node scripts/check-headers.mjs --compile` (Next's own route compilers), and
 * what a deployment really sends by `node scripts/check-headers.mjs <url>`,
 * which counts raw header lines.
 */

const HEADER_ROUTES = ["/", "/en/villas/villa-thoi", "/en/the-estate", "/en/contact"];
const POLICY_ROUTES = ["/", "/en/villas/villa-thoi", "/en/the-estate", "/en/experiences", "/en/weddings", "/en/gallery", "/en/contact"];
/* Prerendered in the build (`.next/prerender-manifest.json`), so they keep the static policy. */
const STATIC_POLICY_ROUTES = ["/", "/en/villas/villa-thoi", "/en/the-estate", "/en/weddings"];
/*
 * Spellings src/proxy.ts's matcher admits besides the page, where next.config.ts
 * sends no policy. Before the matcher took every letter case and every `.…`/`/…`
 * tail these went out with none — a gap a local run CAN show. They are 404s, so
 * they must get the static policy: Next does not stamp a nonce on a 404, and a
 * nonce policy would refuse its scripts. /en/contacts is on the config's side.
 * `/en/%63ontact` is no longer here: a config redirect answers it before either
 * policy source applies (the percent-encoded block below), and `next start`
 * sends no config headers on a config redirect. `/en/%63ontact.html` takes its
 * place as the spelling the proxy admits only through the decoded path.
 */
const OTHER_CONTACT_SPELLINGS = ["/en/contact.html", "/en/contact.txt", "/en/contact.check-headers", "/en/contact/x", "/EN/contact", "/en/Contact", "/en/contacts", "/en/%63ontact.html"];

/* The pattern Next itself reads the nonce with (server/app-render/get-script-nonce-from-header). */
const NONCE_SOURCE = /'nonce-([A-Za-z0-9+/_-]+={0,2})'/;

/* Every Content-Security-Policy header Playwright reports. Under `next start` one or none — never two; see the top of the file. */
function cspHeaders(res: APIResponse): string[] {
  return res
    .headersArray()
    .filter((h) => h.name.toLowerCase() === "content-security-policy")
    .map((h) => h.value);
}

function directives(csp: string): Record<string, string> {
  return Object.fromEntries(
    csp
      .split(";")
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => [d.split(/\s+/)[0], d])
  );
}

test.describe("security — response headers", () => {
  for (const route of HEADER_ROUTES) {
    test(`${route} is sent the full header set`, async ({ request }) => {
      const res = await request.get(route);
      const h = res.headers();
      expect(h["x-content-type-options"]).toBe("nosniff");
      expect(h["x-frame-options"]).toBe("DENY");
      expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
      expect(h["cross-origin-opener-policy"]).toBe("same-origin");
      for (const feature of ["camera=()", "microphone=()", "geolocation=()", "payment=()", "usb=()", "browsing-topics=()"]) {
        expect(h["permissions-policy"]).toContain(feature);
      }
      expect(h["strict-transport-security"]).toMatch(/^max-age=(\d+); includeSubDomains$/);
      expect(Number(/max-age=(\d+)/.exec(h["strict-transport-security"] ?? "")?.[1])).toBeGreaterThanOrEqual(31_536_000);

      expect(cspHeaders(res), "a policy is sent (a doubled one cannot show here — see the top of the file)").toHaveLength(1);
      const csp = h["content-security-policy"] ?? "";
      for (const directive of [
        "default-src 'self'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self'",
        /* No frames at all — see the links-and-embeds guard below. */
        "frame-src 'none'",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ]) {
        expect(csp, directive).toContain(directive);
      }
      /* The one concession is named in SECURITY-NOTES; 'unsafe-eval' never is. */
      expect(csp).not.toContain("unsafe-eval");
    });
  }

  test("the policy blocks nothing the site actually uses", async ({ page }) => {
    test.setTimeout(240_000);
    await page.addInitScript(() => {
      (window as unknown as { __csp: string[] }).__csp = [];
      document.addEventListener("securitypolicyviolation", (e) => {
        (window as unknown as { __csp: string[] }).__csp.push(`${e.violatedDirective} ${e.blockedURI}`);
      });
    });
    const console: string[] = [];
    page.on("console", (m) => {
      if (/Content Security Policy|Refused to (load|execute|apply|connect|frame)/i.test(m.text())) console.push(m.text());
    });
    const scrollThrough = async () => {
      const height = await page.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y < height; y += 900) {
        await page.mouse.wheel(0, 900);
        await page.waitForTimeout(60);
      }
      await page.waitForTimeout(600);
    };
    const violations = () => page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);

    for (const route of POLICY_ROUTES) {
      await page.goto(route, { waitUntil: "load" });
      await scrollThrough();
      expect(await violations(), `violations on ${route}`).toEqual([]);
    }

    /*
     * Every goto above is a new document, and a policy belongs to the document
     * it arrived with. So the loop proves each route clean under the policy it
     * is SENT, and nothing about a page rendered client-side under a policy it
     * inherited. Two client-side navigations cover that:
     *
     *  1. Land on /en/contact (the nonce policy), open the estate from the nav,
     *     come back. The estate page and the re-rendered contact page load every
     *     chunk they need under 'strict-dynamic' with no script 'unsafe-inline' —
     *     what a guest who arrives at the contact page directly and browses on
     *     actually runs.
     *  2. Land on a villa (the static policy) and follow its Enquire link. The
     *     contact page renders under the VILLA's document policy. That is not the
     *     nonce policy — it is what a guest gets on the contact page after any of
     *     the site's own `next/link` CTAs — and this proves the page's client code
     *     is clean under it.
     *
     * A marker set on the landing document must survive each step; if it is gone
     * the step was a full reload, and proves nothing about a soft navigation.
     */
    const markDocument = () => page.evaluate(() => void ((window as unknown as { __landed?: boolean }).__landed = true));
    const sameDocument = () => page.evaluate(() => (window as unknown as { __landed?: boolean }).__landed === true);

    await page.goto("/en/contact", { waitUntil: "load" });
    await markDocument();
    await page.locator('.nav-register a[href="/en/the-estate"]').click();
    await page.waitForURL("**/en/the-estate");
    await scrollThrough();
    await page.goBack();
    await page.waitForURL("**/en/contact");
    await scrollThrough();
    expect(await sameDocument(), "contact → estate → back reloaded the page; it was not a client-side navigation").toBe(true);
    expect(await violations(), "violations after client-side navigation from a /en/contact document").toEqual([]);

    await page.goto("/en/villas/villa-thoi", { waitUntil: "load" });
    await markDocument();
    /* By href, not class alone: the villa page has two `.d-villa-cta-secondary`
       elements, the Enquire link and the fact-sheet download. */
    await page.locator('a.d-villa-cta-secondary[href="/en/contact?villa=villa-thoi"]').click();
    await page.waitForURL(/\/en\/contact\?villa=villa-thoi$/);
    await scrollThrough();
    expect(await sameDocument(), "villa → Enquire reloaded the page; it was not a client-side navigation").toBe(true);
    expect(await violations(), "violations on /en/contact reached client-side from a villa").toEqual([]);

    expect(console).toEqual([]);
  });
});

test.describe("security — the nonce policy on /en/contact", () => {
  test("script-src is a nonce with 'strict-dynamic'; every other directive is the static policy's", async ({ request }) => {
    const contact = cspHeaders(await request.get("/en/contact"));
    const home = cspHeaders(await request.get("/"));
    expect(contact, "a policy on /en/contact (a doubled one cannot show here — see the top of the file)").toHaveLength(1);
    const strict = directives(contact[0] ?? "");
    const scriptSrc = strict["script-src"] ?? "";
    expect(scriptSrc).toMatch(NONCE_SOURCE);
    expect(scriptSrc).toContain("'strict-dynamic'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");

    /* The proxy writes its own copy of the policy; this is what keeps it honest. */
    const rest = (d: Record<string, string>) => Object.entries(d).filter(([name]) => name !== "script-src");
    expect(rest(strict)).toEqual(rest(directives(home[0] ?? "")));
  });

  test("every script tag in the HTML carries the header's nonce", async ({ request }) => {
    const res = await request.get("/en/contact");
    const nonce = NONCE_SOURCE.exec(cspHeaders(res)[0] ?? "")?.[1];
    expect(nonce, "no nonce in the policy").toBeTruthy();
    const tags = (await res.text()).match(/<script\b[^>]*>/g) ?? [];
    /* A check over zero scripts proves nothing, so it cannot pass. */
    expect(tags.length, "no script tags found — the pattern is wrong, not the page clean").toBeGreaterThan(0);
    expect(tags.filter((t) => /\bnonce="([^"]*)"/.exec(t)?.[1] !== nonce)).toEqual([]);
  });

  test("the nonce is fresh on every request", async ({ request }) => {
    const nonces: (string | undefined)[] = [];
    for (let i = 0; i < 2; i++) {
      const res = await request.get("/en/contact");
      nonces.push(NONCE_SOURCE.exec(cspHeaders(res)[0] ?? "")?.[1]);
      /* The page's scripts must follow the header, not a nonce cached from an earlier render. */
      expect(await res.text()).toContain(`nonce="${nonces[i]}"`);
    }
    expect(nonces[0]).toBeTruthy();
    expect(nonces[1]).not.toBe(nonces[0]);
  });

  test("the prerendered routes keep the static policy, without a nonce", async ({ request }) => {
    for (const route of STATIC_POLICY_ROUTES) {
      const csp = cspHeaders(await request.get(route));
      expect(csp, `a policy on ${route}`).toHaveLength(1);
      expect(directives(csp[0] ?? "")["script-src"], route).toBe("script-src 'self' 'unsafe-inline'");
      expect(csp[0], route).not.toMatch(NONCE_SOURCE);
    }
  });

  test("every other spelling of the contact path gets the static policy", async ({ request }) => {
    for (const path of OTHER_CONTACT_SPELLINGS) {
      const csp = cspHeaders(await request.get(path, { maxRedirects: 0 }));
      expect(csp, `a policy on ${path}`).toHaveLength(1);
      expect(directives(csp[0] ?? "")["script-src"], path).toBe("script-src 'self' 'unsafe-inline'");
    }
  });
});

test.describe("security — percent-encoded spellings of a page: 301 to the literal page (D-028)", () => {
  /*
   * The platform decodes a path before it looks for the page. On Vercel every
   * spelling that decodes once to a prerendered page answered 200 with that page
   * (one page at many URLs), and every one that decodes to /en/contact answered
   * 500 until D-025 sent it on with a 308 (qa/security/ENCODING-tranche13.md).
   * The owner's ruling, DECISIONS.md D-028, is a 301 to the canonical spelling.
   * next.config.ts carries one generated rule per page for it
   * (scripts/build-encoded-redirects.mjs). Config redirects are matched before
   * the proxy and the filesystem, against the raw path, so no function runs in
   * front of any URL.
   *
   * The Location is asserted exactly (the literal page plus the request's own
   * query) because nothing a request carries may steer it. No policy count is
   * asserted on these redirects: `next start` sends none of next.config.ts's
   * headers on a config redirect (server/lib/router-server.js, `resHeaders:
   * null`), while Vercel does. `node scripts/check-headers.mjs <url>` reports
   * what a deployment sends.
   */
  const ROUTES = ["/en/contact", "/en/the-estate", "/en/villas/villa-thoi", "/en/experiences/boat-trip"];

  type Rule = { source: string; destination: string; statusCode?: number; permanent?: boolean };
  const readRules = (file: string) =>
    (JSON.parse(fs.readFileSync(path.join(process.cwd(), "src", "generated", file), "utf-8")) as { redirects: Rule[] }).redirects;
  const ENCODED_RULES = readRules("encoded-redirects.json");
  const LEGACY_RULES = readRules("redirects.json");

  const hex = (c: string) => c.charCodeAt(0).toString(16);

  /** The six spellings in the production table that decode once to the page. */
  function decodeOnce(route: string): string[] {
    const cut = route.lastIndexOf("/");
    const prefix = route.slice(0, cut);
    const last = route.slice(cut + 1);
    /* A character whose escape holds a hex LETTER, so the two escape cases differ. */
    const at = [...last].findIndex((c) => /[a-f]/.test(hex(c)));
    if (at < 0) throw new Error(`${route}: no character with a hex letter in its escape`);
    const escapedAt = (e: string) => `${prefix}/${last.slice(0, at)}%${e}${last.slice(at + 1)}`;
    return [
      `${prefix}/%${hex(last[0]!)}${last.slice(1)}`,
      escapedAt(hex(last[at]!).toLowerCase()),
      escapedAt(hex(last[at]!).toUpperCase()),
      route.replace(/^\/en\//, "/%65n/"),
      `${prefix}%2F${last}`,
      `${route}%2F`,
    ];
  }

  const firstEscaped = (route: string) => decodeOnce(route)[0]!;

  /** A GET with the path exactly as written, and any Host header: Playwright's request API sends neither. */
  async function raw(baseURL: string | undefined, rawPath: string, headers: Record<string, string> = {}) {
    const http = await import("node:http");
    const base = new URL(baseURL ?? "");
    return new Promise<{ status?: number; location?: string; dataRedirect?: string; csp: string[] }>((resolve, reject) => {
      http
        .get({ hostname: base.hostname, port: base.port, path: rawPath, headers }, (r) => {
          r.resume();
          const csp: string[] = [];
          for (let i = 0; i < r.rawHeaders.length; i += 2) if (r.rawHeaders[i]!.toLowerCase() === "content-security-policy") csp.push(r.rawHeaders[i + 1]!);
          const dataRedirect = r.headers["x-nextjs-redirect"];
          resolve({ status: r.statusCode, location: r.headers.location, dataRedirect: Array.isArray(dataRedirect) ? dataRedirect[0] : dataRedirect, csp });
        })
        .on("error", reject);
    });
  }

  for (const route of ROUTES) {
    for (const spelling of decodeOnce(route)) {
      test(`${spelling} is sent to ${route} with its query`, async ({ request }) => {
        for (const [query, location] of [["", route], ["?enquiry=estate", `${route}?enquiry=estate`]]) {
          const res = await request.get(`${spelling}${query}`, { maxRedirects: 0 });
          expect(res.status(), `${spelling}${query}`).toBe(301);
          expect(res.headers()["location"], `${spelling}${query}`).toBe(location);
        }
      });
    }

    test(`${route}: the flight-data forms are redirected too, never a 5xx`, async ({ request }) => {
      const spelling = firstEscaped(route);
      for (const [p, headers] of [[`${spelling}.rsc`, {}], [spelling, { RSC: "1" }]] as const) {
        const res = await request.get(p, { maxRedirects: 0, headers });
        expect(res.status(), p).toBe(301);
        expect(res.headers()["location"], p).toBe(route);
      }
    });
  }

  test("the query is kept whole: several parameters, a repeated key, escaped values", async ({ request }) => {
    const query = "?villa=villa-thoi&note=a%20b%26c&a=1&a=2";
    for (const route of ROUTES) {
      const spelling = firstEscaped(route);
      const res = await request.get(`${spelling}${query}`, { maxRedirects: 0 });
      expect(res.status(), spelling).toBe(301);
      const location = res.headers()["location"] ?? "";
      expect(location, `${spelling}: a relative Location`).toMatch(/^\/(?!\/)/);
      const sent = new URL(location, "http://site.invalid");
      expect(sent.pathname, spelling).toBe(route);
      expect([...sent.searchParams], spelling).toEqual([...new URLSearchParams(query)]);
    }
  });

  test("followed, the redirect lands on the page under the page's own policy", async ({ request }) => {
    for (const [spelling, landedAt, policy] of [
      ["/en/%63ontact?enquiry=estate", "/en/contact?enquiry=estate", "nonce"],
      ["/en/%74he-estate?enquiry=estate", "/en/the-estate?enquiry=estate", "static"],
    ] as const) {
      const res = await request.get(spelling);
      expect(res.status(), spelling).toBe(200);
      const landed = new URL(res.url());
      expect(`${landed.pathname}${landed.search}`).toBe(landedAt);
      const csp = cspHeaders(res);
      expect(csp, spelling).toHaveLength(1);
      if (policy === "nonce") expect(csp[0]).toMatch(NONCE_SOURCE);
      else expect(directives(csp[0] ?? "")["script-src"], spelling).toBe("script-src 'self' 'unsafe-inline'");
    }
  });

  test("an escape in any letter case goes to the lower-case page; without an escape, no redirect", async ({ request }) => {
    /* Next matches config sources case-insensitively. D-025's proxy left `/EN/%63ontact` a 404; the config rule redirects it, always to the fixed literal. */
    for (const [spelling, location] of [
      ["/EN/%63ontact", "/en/contact"],
      ["/EN/%74he-estate", "/en/the-estate"],
      ["/en/%74HE-ESTATE", "/en/the-estate"],
    ]) {
      const res = await request.get(spelling!, { maxRedirects: 0 });
      expect(res.status(), spelling).toBe(301);
      expect(res.headers()["location"], spelling).toBe(location);
    }
    for (const spelling of ["/EN/contact", "/EN/the-estate", "/en/The-Estate"]) {
      expect((await request.get(spelling, { maxRedirects: 0 })).status(), spelling).toBe(404);
    }
  });

  test("neither the query, the Host header nor a `//host` spelling steers the Location off the site", async ({ request, baseURL }) => {
    for (const route of ["/en/contact", "/en/the-estate"]) {
      const res = await request.get(`${firstEscaped(route)}?next=https://evil.example`, { maxRedirects: 0 });
      expect(res.status(), route).toBe(301);
      const location = res.headers()["location"] ?? "";
      expect(location, route).toMatch(new RegExp(`^${route}\\?`));
      expect(new URL(location, "http://site.invalid").searchParams.get("next"), route).toBe("https://evil.example");

      /* Playwright's request API sends its own Host, so the forged one goes through node:http. */
      const forged = await raw(baseURL, firstEscaped(route), { host: "evil.example" });
      expect({ status: forged.status, location: forged.location }, `${route}, forged Host`).toEqual({ status: 301, location: route });
    }

    /* Next answers a doubled leading slash itself (308, before any rule): the Location must stay a path on this site. */
    const base = new URL(baseURL ?? "");
    for (const spelling of ["//evil.example/en/%63ontact", "//evil.example/en/%74he-estate"]) {
      const r = await raw(baseURL, spelling);
      expect(r.status, spelling).not.toBe(301);
      if (r.location !== undefined) {
        expect(r.location, spelling).toMatch(/^\/(?!\/)/);
        expect(new URL(r.location, base).origin, spelling).toBe(base.origin);
      }
    }
    /* Every rule starts at `/` plus the page's first character, so an encoded `//host` never matches one. */
    for (const spelling of ["/%2F%2Fevil.example/en/contact", "/%2F%2Fevil.example/en/the-estate", "/%2f%2fevil.example/en/%74he-estate"]) {
      const r = await raw(baseURL, spelling);
      expect({ status: r.status, location: r.location }, spelling).toEqual({ status: 404, location: undefined });
    }
  });

  test("spellings that do not decode once to a page are not redirected", async ({ request }) => {
    for (const spelling of [
      "/en/%2563ontact",
      "/en/%63ontacts",
      "/en/%63ontact%2Fx",
      "/en/%2574he-estate",
      "/en/the-estate%20",
      "/en/the-estate%C3%A9",
      "/en/%74he-estate%2Fx",
      "/en/%74he-estate%2F%2F",
      "/en/%74he-estate.rsc%2F",
      "/en/villas/%2576illa-thoi",
      /*
       * An escaped capital decodes to another path (routes are lower-case). Only
       * static routes are requested here. The dynamic `[slug]` equivalent,
       * `/en/villas/%56illa-thoi`, is deliberately NOT requested: under
       * `next start` on Windows it makes Next write the 404 render over the
       * canonical page's prerendered files (`.next/server/app/en/villas/
       * villa-thoi.html` fell from 180 KB to 16 KB), after which the canonical
       * URL answers 404 until the next build. Measured 2026-09-18; on the Vercel
       * deployment the canonical page stayed 200 before and after the same
       * request. The loop-guard test below checks that spelling against the
       * compiled rules instead, which needs no request.
       */
      "/en/%43ontact",
      "/en/%54he-estate",
    ]) {
      const res = await request.get(spelling, { maxRedirects: 0 });
      expect(res.status(), spelling).toBe(404);
    }
  });

  test("the _next/data spelling of the contact page is the proxy's, at 301 too", async ({ baseURL }) => {
    /*
     * Next keeps config redirects off `/_next/**`, so src/proxy.ts's class branch
     * still answers this one. Under `next start` the adapter moves the target
     * into `x-nextjs-redirect` and drops the Location; the proxy sends the
     * static policy with it.
     */
    const r = await raw(baseURL, "/_next/data/security-spec/en/%63ontact.json");
    expect(r.status).toBe(301);
    expect(r.location).toBeUndefined();
    expect(r.dataRedirect).toBe("/_next/data/security-spec/en/contact.json");
    expect(r.csp).toHaveLength(1);
    expect(directives(r.csp[0] ?? "")["script-src"]).toBe("script-src 'self' 'unsafe-inline'");
  });

  test("the rule list is the site's page inventory: /sitemap.xml without `/`, plus the sitemap's declared exclusions", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const listed = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname);
    expect(listed.length, "the sitemap is empty").toBeGreaterThan(20);
    expect(listed, "the sitemap lists `/`, which has no rule").toContain("/");

    /* The generator walks src/app without the sitemap's exclusions, so those pages have rules too. */
    const sitemapSource = fs.readFileSync(path.join(process.cwd(), "src", "app", "sitemap.ts"), "utf-8");
    const excludedBlock = /const EXCLUDED\b[^=]*=\s*\{([\s\S]*?)\n\};/.exec(sitemapSource)?.[1] ?? "";
    const excluded = [...excludedBlock.matchAll(/^\s*"(\/[^"]*)":/gm)].map((m) => m[1]!);
    expect(excluded.length, "no exclusions read from src/app/sitemap.ts: the pattern is wrong, not the list empty").toBeGreaterThan(0);

    const destinations = ENCODED_RULES.map((r) => r.destination);
    expect(new Set(destinations).size, "two rules for one page").toBe(destinations.length);
    const expected = [...new Set([...listed.filter((p) => p !== "/"), ...excluded])].sort();
    expect([...destinations].sort()).toEqual(expected);
  });

  test("no destination matches any rule, and each rule catches its own page and no other (the loop guard)", () => {
    /*
     * Compiled with Next's own code: the routes-manifest regex (with the
     * `(?!/_next)` guard `next build` adds) in both letter-case sensitivities, and
     * the matcher `next start` builds. A destination that matched a rule would
     * be redirected to itself, forever. The generator refuses such a list; this
     * checks the file that was actually written.
     */
    const nextRequire = createRequire(path.join(process.cwd(), "package.json"));
    const { buildCustomRoute } = nextRequire("next/dist/lib/build-custom-route") as {
      buildCustomRoute: (type: "redirect", route: Rule, restricted: string[]) => { regex: string };
    };
    const { getPathMatch } = nextRequire("next/dist/shared/lib/router/utils/path-match") as {
      getPathMatch: (source: string, options: object) => (pathname: string) => false | object;
    };
    const { modifyRouteRegex } = nextRequire("next/dist/lib/redirect-status") as {
      modifyRouteRegex: (regex: string, restricted?: string[]) => string;
    };
    const compiled = [...LEGACY_RULES, ...ENCODED_RULES].map((r) => {
      const regex = buildCustomRoute("redirect", r, ["/_next"]).regex;
      const runtime = getPathMatch(r.source, {
        strict: true,
        removeUnnamedParams: true,
        regexModifier: (s: string) => modifyRouteRegex(s, ["/_next"]),
        sensitive: undefined,
      });
      return { source: r.source, matches: (p: string) => new RegExp(regex).test(p) || new RegExp(regex, "i").test(p) || runtime(p) !== false };
    });
    const hits = (p: string) => compiled.filter((c) => c.matches(p)).map((c) => c.source);

    expect(ENCODED_RULES.length, "no encoded rules: the generator found no pages").toBeGreaterThan(20);
    for (const r of ENCODED_RULES) {
      expect(r.statusCode, r.destination).toBe(301);
      expect(r.destination, "a canonical path is lower-case ASCII, so it holds no `%`").toMatch(/^\/[a-z0-9\-/]+$/);
      for (const p of [r.destination, `${r.destination}.rsc`, `${r.destination}/`, `${r.destination}.segments/_tree.segment.rsc`]) {
        expect(hits(p), `${p} matches a redirect rule: a request for it would loop`).toEqual([]);
      }
      const escaped = `/%${hex(r.destination[1]!).toUpperCase()}${r.destination.slice(2)}`;
      expect(hits(escaped), `${escaped} must match exactly its own rule`).toEqual([r.source]);
      /* A rule too broad in its escapes would let a fully escaped spelling match every page of that length. */
      const allEscaped = `/${[...r.destination.slice(1)].map((c) => `%${hex(c).toUpperCase()}`).join("")}`;
      expect(hits(allEscaped), `${allEscaped} must match exactly its own rule`).toEqual([r.source]);
      /* An escape that decodes to another character — the next byte, or the capital — is another path. */
      const first = r.destination[1]!;
      const others = [String.fromCharCode(first.charCodeAt(0) + 1), ...(first !== first.toUpperCase() ? [first.toUpperCase()] : [])];
      for (const c of others) {
        const p = `/%${hex(c).toUpperCase()}${r.destination.slice(2)}`;
        expect(hits(p), `${p} decodes to another path and must match no rule`).toEqual([]);
      }
    }
  });

  test("every destination answers 200 itself, never a redirect", async ({ request }) => {
    for (const r of ENCODED_RULES) {
      const res = await request.get(r.destination, { maxRedirects: 0 });
      expect(res.status(), `${r.destination} answered ${res.status()} ${res.headers()["location"] ?? ""}`).toBe(200);
    }
  });
});

test.describe("security — links and embeds", () => {
  for (const route of ["/", "/en/villas/villa-thoi", "/en/contact", "/en/weddings"]) {
    test(`${route}: every new-tab link is noopener noreferrer; there is no frame`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const links = await page.$$eval("a[target=_blank]", (as) => as.map((a) => ({ href: a.getAttribute("href"), rel: a.getAttribute("rel") ?? "" })));
      for (const l of links) {
        expect(l.rel, l.href ?? "").toContain("noopener");
        expect(l.rel, l.href ?? "").toContain("noreferrer");
      }
      /*
       * There are no embeds, and the policy says so: frame-src 'none'. A video
       * frame, if one is ever added, needs BOTH halves at once — YouTube's
       * privacy-enhanced host, www.youtube-nocookie.com (the ordinary one sets
       * cookies on load), and frame-src opened to exactly that host in
       * next.config.ts and src/proxy.ts. This guard then becomes a check that
       * every frame is on that host. Markup changed alone gets a frame the
       * browser refuses; the policy loosened alone lets nothing in yet.
       */
      const frames = await page.$$eval("iframe", (fs) => fs.map((f) => f.getAttribute("src") ?? ""));
      expect(frames).toEqual([]);
    });
  }
});

test.describe("security — the enquiry form's abuse surface", () => {
  test("posts, never GETs, and caps every field", async ({ page }) => {
    await page.goto("/en/contact");
    const form = page.locator("form.d-form");
    await expect(form).toHaveAttribute("method", "post");
    await expect(page.locator("#f-name")).toHaveAttribute("maxlength", "120");
    await expect(page.locator("#f-email")).toHaveAttribute("maxlength", "254");
    await expect(page.locator("#f-message")).toHaveAttribute("maxlength", "5000");
    /* The honeypot is still there, still out of the tab order. */
    await expect(page.locator("#f-company")).toHaveAttribute("tabindex", "-1");
  });

  test("an unknown ?enquiry= value is never printed on the page", async ({ page, request }) => {
    const spoof = "Your booking is cancelled - call +00 000 000";
    const url = `/en/contact?enquiry=${encodeURIComponent(spoof)}`;
    await page.goto(url);
    await expect(page.locator("#f-subject")).toHaveCount(0);
    expect(await page.locator("body").innerText()).not.toContain("Your booking is cancelled");

    /*
     * Next keeps the query in its router state — the page segment's key in the
     * inline flight payload reads `__PAGE__?{"enquiry":"…"}`. That is framework
     * state, JSON-escaped inside a script, and never rendered. The spoofing
     * finding was about what a guest SEES, so the raw HTML may carry the string
     * only inside a <script>, and nowhere a reader could.
     */
    const html = await (await request.get(url)).text();
    for (let i = html.indexOf("Your booking is cancelled"); i !== -1; i = html.indexOf("Your booking is cancelled", i + 1)) {
      expect(html.lastIndexOf("<script", i), "spoof text outside a script").toBeGreaterThan(html.lastIndexOf("</script>", i));
    }
  });

  test("a query value cannot break out of the payload script", async ({ page, request }) => {
    const probe = `</script><script>window.__pwned=1</script>`;
    const url = `/en/contact?enquiry=${encodeURIComponent(probe)}`;
    const html = await (await request.get(url)).text();
    expect(html).not.toContain("<script>window.__pwned=1</script>");
    await page.goto(url);
    expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();
  });

  test("the subjects the site's own CTAs send still resolve", async ({ page }) => {
    await page.goto("/en/contact?villa=villa-thoi");
    await expect(page.locator("#f-subject")).toHaveValue(/thoi/i);
    await page.goto("/en/contact?enquiry=estate");
    await expect(page.locator("#f-subject")).toHaveValue("The Entire Estate");
    await page.goto("/en/weddings");
    const weddings = await page.locator('a[href^="/en/contact?enquiry="]').first().getAttribute("href");
    await page.goto(weddings!);
    await expect(page.locator("#f-subject")).toHaveValue("Weddings & Events");
    await page.goto("/en/experiences/boat-trip");
    const experience = await page.locator('a[href^="/en/contact?enquiry="]').first().getAttribute("href");
    await page.goto(experience!);
    await expect(page.locator("#f-subject")).not.toHaveValue("");
  });

  test.describe("with scripting off", () => {
    test.use({ javaScriptEnabled: false });
    test("a submitted enquiry never lands in the address bar", async ({ page }) => {
      await page.goto("/en/contact");
      await page.fill("#f-name", "Test Guest");
      await page.fill("#f-email", "guest@example.com");
      await page.fill("#f-message", "A question about September.");
      await Promise.all([page.waitForLoadState("load"), page.click("form.d-form button[type=submit]")]);
      expect(page.url()).not.toContain("example.com");
      expect(page.url()).not.toContain("name=");
    });
  });

  test("the rate-limit stub admits the limit and refuses the rest of the window", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 });
    const t0 = 1_000_000;
    expect([1, 2, 3].map((i) => limiter.check("guest", t0 + i).allowed)).toEqual([true, true, true]);
    expect(limiter.check("guest", t0 + 4).allowed).toBe(false);
    expect(limiter.check("someone-else", t0 + 5).allowed).toBe(true);
    expect(limiter.check("guest", t0 + 60_001).allowed).toBe(true);
  });
});
