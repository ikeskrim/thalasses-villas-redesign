import { expect, test } from "@playwright/test";

/** The five breakpoints named in DESIGN-PLAN §5.4. */
const BREAKPOINTS = [
  { name: "360", width: 360, height: 780 },
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1440", width: 1440, height: 900 },
  { name: "1920", width: 1920, height: 1080 },
];

const ROUTES = [
  { name: "home", path: "/" },
  { name: "styleguide", path: "/styleguide" },
  { name: "estate", path: "/en/the-estate" },
  // The best-covered villa (104 images) and the worst (5) — the two ends the
  // gallery system has to serve without looking sparse or wasteful.
  { name: "villa-eeanthe", path: "/en/villas/villa-eeanthe" },
  { name: "villa-pueblo", path: "/en/villas/villa-pueblo" },
];

/*
 * SCREENSHOTS LEFT THIS FILE — see scripts/capture.mjs.
 *
 * They were killing the runner, and the reason was structural rather than
 * flaky: evidence generation is not a correctness gate. A screenshot proves
 * nothing about behaviour; it exists so a person can look at it. Keeping it
 * here meant a memory ceiling could fail a build with nothing wrong in it —
 * the homepage is 22,165px tall and the estate page loads 144 photographs.
 *
 * Assertions stay here and stay cheap. Evidence is produced by a script that
 * launches a fresh browser per route so memory is released between them.
 */

for (const route of ROUTES) {
  for (const bp of BREAKPOINTS) {
    test(`overflow — ${route.name} @ ${bp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto(route.path, { waitUntil: "load" });

      const metrics = await page.evaluate(() => {
        const de = document.documentElement;
        return {
          scrollWidth: de.scrollWidth,
          clientWidth: de.clientWidth,
          bodyScrollWidth: document.body.scrollWidth,
        };
      });

      // The one assertion that protects the signature element's overrun.
      expect(
        metrics.scrollWidth,
        `horizontal page scroll at ${bp.width}px on ${route.path} ` +
          `(scrollWidth ${metrics.scrollWidth} vs clientWidth ${metrics.clientWidth})`
      ).toBe(metrics.clientWidth);
    });

  }
}

test("no broken images on the homepage", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "load" });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);

  const broken = await page.evaluate(() =>
    [...document.querySelectorAll("img")]
      .filter((i) => i.complete && i.naturalWidth === 0)
      .map((i) => i.currentSrc || i.src)
  );
  expect(broken, `broken images: ${broken.join(", ")}`).toEqual([]);
});

test("reduced motion renders the clause at final tracking", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "load" });

  // Under reduced motion no character span may carry a translate.
  const moved = await page.evaluate(() =>
    [...document.querySelectorAll(".clause-char")].filter((el) => {
      const t = getComputedStyle(el).transform;
      return t && t !== "none" && !t.includes("matrix(1, 0, 0, 1, 0, 0)");
    }).length
  );
  expect(moved).toBe(0);

  // And the clause is still fully readable.
  const label = await page.locator(".clause").first().getAttribute("aria-label");
  expect(label).toBe("Living UNLIMITED");
  await ctx.close();
});
