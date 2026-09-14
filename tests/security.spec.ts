import { test, expect, type APIResponse } from "@playwright/test";

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
 * tail these went out with none — a gap a local run CAN show. They are 404s (bar
 * `/en/%63ontact`, now a 308 to the page: see the percent-encoded block below),
 * so they must get the static policy: Next does not stamp a nonce on a 404, and
 * a nonce policy would refuse its scripts. /en/contacts is on the config's side.
 */
const OTHER_CONTACT_SPELLINGS = ["/en/contact.html", "/en/contact.txt", "/en/contact.check-headers", "/en/contact/x", "/EN/contact", "/en/Contact", "/en/contacts", "/en/%63ontact"];

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

test.describe("security — the contact path, percent-encoded", () => {
  /*
   * On Vercel every spelling that decodes to /en/contact returned 500
   * (qa/security/ENCODING-tranche13.md); src/proxy.ts sends each one to the
   * literal page with a 308. The Location is asserted exactly — the page plus
   * the request's own query — because nothing a request carries may steer it.
   */
  const ENCODED_CONTACT = ["/en/%63ontact", "/en/c%6Fntact", "/en/c%6fntact", "/%65n/contact", "/en%2Fcontact", "/en/contact%2F"];

  for (const path of ENCODED_CONTACT) {
    test(`${path} is sent to /en/contact with its query`, async ({ request }) => {
      for (const [query, location] of [["", "/en/contact"], ["?enquiry=estate", "/en/contact?enquiry=estate"]]) {
        const res = await request.get(`${path}${query}`, { maxRedirects: 0 });
        expect(res.status(), `${path}${query}`).toBe(308);
        expect(res.headers()["location"], `${path}${query}`).toBe(location);
        expect(cspHeaders(res), `a policy on ${path}${query}`).toHaveLength(1);
      }
    });
  }

  test("the flight-data forms are redirected too, never a 5xx", async ({ request }) => {
    for (const [path, headers] of [["/en/%63ontact.rsc", {}], ["/en/%63ontact", { RSC: "1" }]] as const) {
      const res = await request.get(path, { maxRedirects: 0, headers });
      expect(res.status(), path).toBe(308);
      expect(res.headers()["location"], path).toBe("/en/contact");
    }
  });

  test("followed, the redirect lands on the page under its nonce policy", async ({ request }) => {
    const res = await request.get("/en/%63ontact?enquiry=estate");
    expect(res.status()).toBe(200);
    const landed = new URL(res.url());
    expect(`${landed.pathname}${landed.search}`).toBe("/en/contact?enquiry=estate");
    const csp = cspHeaders(res);
    expect(csp).toHaveLength(1);
    expect(csp[0]).toMatch(NONCE_SOURCE);
  });

  test("neither the query nor the Host header steers the Location off the page", async ({ request, baseURL }) => {
    const res = await request.get("/en/%63ontact?next=https://evil.example", { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers()["location"]).toMatch(/^\/en\/contact\?/);

    /* Playwright's request API sends its own Host, so the forged one goes through node:http. */
    const http = await import("node:http");
    const base = new URL(baseURL ?? "");
    const forged = await new Promise<{ status?: number; location?: string }>((resolve, reject) => {
      http
        .get({ hostname: base.hostname, port: base.port, path: "/en/%63ontact", headers: { host: "evil.example" } }, (r) => {
          r.resume();
          resolve({ status: r.statusCode, location: r.headers.location });
        })
        .on("error", reject);
    });
    expect(forged).toEqual({ status: 308, location: "/en/contact" });
  });

  test("spellings that do not decode to the page are not redirected", async ({ request }) => {
    for (const path of ["/en/%2563ontact", "/EN/%63ontact", "/en/%63ontacts", "/en/%63ontact%2Fx", "/%2F%2Fevil.example/en/contact"]) {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status(), path).toBe(404);
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
