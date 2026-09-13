import { test, expect } from "@playwright/test";

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
 */

const HEADER_ROUTES = ["/", "/en/villas/villa-thoi", "/en/the-estate", "/en/contact"];
const POLICY_ROUTES = ["/", "/en/villas/villa-thoi", "/en/the-estate", "/en/experiences", "/en/weddings", "/en/gallery", "/en/contact"];

test.describe("security — response headers", () => {
  for (const route of HEADER_ROUTES) {
    test(`${route} is sent the full header set`, async ({ request }) => {
      const h = (await request.get(route)).headers();
      expect(h["x-content-type-options"]).toBe("nosniff");
      expect(h["x-frame-options"]).toBe("DENY");
      expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
      expect(h["cross-origin-opener-policy"]).toBe("same-origin");
      for (const feature of ["camera=()", "microphone=()", "geolocation=()", "payment=()"]) {
        expect(h["permissions-policy"]).toContain(feature);
      }
      expect(h["strict-transport-security"]).toMatch(/^max-age=(\d+); includeSubDomains$/);
      expect(Number(/max-age=(\d+)/.exec(h["strict-transport-security"] ?? "")?.[1])).toBeGreaterThanOrEqual(31_536_000);

      const csp = h["content-security-policy"] ?? "";
      for (const directive of [
        "default-src 'self'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self'",
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
    test.setTimeout(180_000);
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
    for (const route of POLICY_ROUTES) {
      await page.goto(route, { waitUntil: "load" });
      const height = await page.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y < height; y += 900) {
        await page.mouse.wheel(0, 900);
        await page.waitForTimeout(60);
      }
      await page.waitForTimeout(600);
      const seen = await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);
      expect(seen, `violations on ${route}`).toEqual([]);
    }
    expect(console).toEqual([]);
  });
});

test.describe("security — links and embeds", () => {
  for (const route of ["/", "/en/villas/villa-thoi", "/en/contact", "/en/weddings"]) {
    test(`${route}: every new-tab link is noopener noreferrer; any frame is privacy-enhanced`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const links = await page.$$eval("a[target=_blank]", (as) => as.map((a) => ({ href: a.getAttribute("href"), rel: a.getAttribute("rel") ?? "" })));
      for (const l of links) {
        expect(l.rel, l.href ?? "").toContain("noopener");
        expect(l.rel, l.href ?? "").toContain("noreferrer");
      }
      /* There are no embeds today. If a video frame is ever added, it must be
         YouTube's privacy-enhanced host — the ordinary one sets cookies on load. */
      const frames = await page.$$eval("iframe", (fs) => fs.map((f) => f.getAttribute("src") ?? ""));
      for (const src of frames) expect(new URL(src, "https://x.invalid").hostname).toBe("www.youtube-nocookie.com");
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
