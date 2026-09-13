import { test, expect } from "@playwright/test";

/**
 * THE PERFORMANCE PASS, GUARDED (`DECISIONS.md` D-012).
 *
 * The phone-profile blocking time fell because of three structural facts about
 * the served HTML, not because of a threshold anyone could quietly relax. Each
 * is cheap to lose — a `loading.tsx` added back at the root, a client
 * component imported into the 404 tree, a static import of a library — and none
 * would fail a build. So they are asserted directly.
 */

const ROUTES = ["/", "/en/villas/villa-thoi", "/en/the-estate", "/en/experiences", "/en/weddings"];

/*
 * Every script the HTML asks for, by its real attribute — not by guessing the
 * chunk path. `next start` serves `/_next/static/chunks/…` and Vercel serves
 * `/_next/static/immutable/chunks/…?dpl=…`; a pattern written for one finds
 * nothing on the other, and a guard that finds nothing passes. So this reads
 * `<script src>` and script preloads, and the caller asserts it found some.
 */
async function scriptsOf(request: import("@playwright/test").APIRequestContext, html: string) {
  const urls = [
    ...new Set(
      [...html.matchAll(/<script[^>]*\bsrc="([^"]+)"/g), ...html.matchAll(/<link[^>]*\bas="script"[^>]*\bhref="([^"]+)"/g)].map((m) =>
        (m[1] ?? "").replace(/&amp;/g, "&")
      )
    ),
  ];
  return Promise.all(
    urls.map(async (u) => {
      const res = await request.get(u);
      return { url: u, ok: res.ok(), body: await res.text() };
    })
  );
}

test.describe("performance structure", () => {
  for (const route of ROUTES) {
    test(`${route} streams its page in place, not inside a hidden Suspense segment`, async ({ request }) => {
      const html = await (await request.get(route)).text();
      /* A root loading boundary serves the fallback first and the whole page
         in `<div hidden id="S:0">`, moved into place by script in one long
         task — measured at 250–340 ms on the phone profile. */
      expect(html).not.toMatch(/<div hidden id="S:\d+"/);
      expect(html).not.toContain("d-loading");
    });
  }

  test("the Direction F homepage loads neither framer-motion nor Lenis up front", async ({ request }) => {
    const html = await (await request.get("/")).text();
    const scripts = await scriptsOf(request, html);
    /* A check over zero scripts proves nothing, so it cannot pass. */
    expect(scripts.length, "no scripts found in the HTML — the pattern is wrong, not the page clean").toBeGreaterThan(0);
    expect(scripts.filter((s) => !s.ok).map((s) => s.url), "scripts that did not load").toEqual([]);
    const framer = scripts.filter((s) => /framerAppearId|MotionConfigContext|You have Reduced Motion enabled/.test(s.body));
    const lenis = scripts.filter((s) => /\blenis\b/i.test(s.body));
    expect(framer.map((s) => s.url), "framer-motion reached / through the root 404 tree").toEqual([]);
    expect(lenis.map((s) => s.url), "Lenis is statically imported again").toEqual([]);
  });

  test("Lenis still arrives where it runs: a fine pointer, motion allowed", async ({ page }) => {
    await page.goto("/en/villas/villa-thoi");
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains("lenis")), { timeout: 10_000 }).toBe(true);
  });

  test.describe("under reduced motion", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });
    test("Lenis is never fetched", async ({ page }) => {
      const fetched: string[] = [];
      page.on("response", async (r) => {
        if (r.request().resourceType() !== "script") return;
        const body = await r.text().catch(() => "");
        if (/\blenis\b/i.test(body)) fetched.push(r.url());
      });
      await page.goto("/en/villas/villa-thoi", { waitUntil: "load" });
      await page.waitForTimeout(1500);
      expect(fetched).toEqual([]);
    });
  });
});
