import { expect, test } from "@playwright/test";

/**
 * THE SECOND-ENGINE SMOKE RUN.
 *
 * Everything else in this suite runs on Chromium, and Chromium is not what a
 * guest on a Greek beach is holding. Safari is, and this site leans on a stack
 * of features that were new when it was built: cascade layers, `:has()`,
 * `text-wrap: balance`, `svh` units, `clamp()` type scales, `content-visibility`.
 * Every one of those is a place where a page can be *correct* in one engine and
 * wrong in another, and no amount of Chromium testing will say so.
 *
 * This is deliberately a SMOKE run and not a second full suite. It asserts the
 * things that would be catastrophic and silent in another engine — a page that
 * scrolls sideways on a phone, a booking link that leads nowhere, type that
 * fell back to Georgia because a font did not load, a layer that did not apply
 * — and nothing that Chromium already proves once.
 *
 * It is tagged `@smoke` so `npm run qa:webkit` can select it, and it runs under
 * Chromium too: a smoke test that only ever runs on the engine you are checking
 * cannot tell you whether a failure is a WebKit difference or a real defect.
 */

const ROUTES = [
  "/",
  "/en/the-estate",
  "/en/villas/villa-thoi",
  "/en/villas/villa-pueblo",
  "/en/gallery",
  "/en/experiences",
  "/en/weddings",
  "/en/location",
  "/en/contact",
  "/en/terms",
];

/** The widths where a layout failure is worst and least likely to be noticed. */
const WIDTHS = [
  { w: 390, h: 844 },
  { w: 768, h: 1024 },
  { w: 1440, h: 900 },
];

test.describe("@smoke second engine", () => {
  for (const route of ROUTES) {
    test(`${route} — renders, does not scroll sideways, keeps its type`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("console", (m) => {
        if (m.type() === "error") consoleErrors.push(m.text());
      });
      const failed: string[] = [];
      page.on("requestfailed", (r) => {
        /* Analytics and beacons are not installed; anything failing is ours. */
        failed.push(`${r.failure()?.errorText} ${r.url()}`);
      });

      const res = await page.goto(route, { waitUntil: "load" });
      expect(res?.status(), `${route} did not serve`).toBe(200);

      /* The page has real content, not a shell that failed to hydrate. */
      await expect(page.locator("main")).toBeVisible();
      const h1 = page.locator("h1");
      expect(await h1.count(), `${route} has no h1`).toBeGreaterThan(0);

      for (const { w, h } of WIDTHS) {
        await page.setViewportSize({ width: w, height: h });
        await page.waitForTimeout(250);
        const overflow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect(
          overflow.scrollWidth,
          `${route} scrolls sideways at ${w}px (${overflow.scrollWidth} > ${overflow.clientWidth})`
        ).toBeLessThanOrEqual(overflow.clientWidth + 1);
      }

      expect(failed, `${route} had failed requests:\n  ${failed.join("\n  ")}`).toEqual([]);
      expect(
        consoleErrors,
        `${route} logged console errors:\n  ${consoleErrors.join("\n  ")}`
      ).toEqual([]);
    });
  }

  test("@smoke the display face loaded — the page is not silently set in Georgia", async ({
    page,
  }) => {
    /*
     * The single most damaging cross-engine failure available here, and the one
     * that looks like nothing: a woff2 that does not load leaves every heading
     * in the fallback. The page still renders, still passes contrast, still has
     * the right sizes — and is not the brand.
     */
    await page.goto("/");
    /*
     * Wait for the hero to have a box before measuring. Evaluating on `load`
     * finds every display element at zero width — which reads as "no display
     * type on this page" and is really "the page has not painted yet". A
     * locator wait retries; a fixed sleep would pass on a fast machine and fail
     * on a slow one.
     *
     * THE FACE IS LITERATA, NOT MARCELLUS. The homepage is Direction F
     * (`DECISIONS.md` D-001) and its serif is Literata — vendored, variable and
     * Greek-capable. Marcellus is Direction D's and still dresses the inner
     * pages; it is deliberately NOT asserted here, because it is not used on
     * this page and `document.fonts.check` would report it unloaded whether the
     * woff2 was reachable or not.
     */
    await page.locator(".ho-hero-copy h1").first().waitFor({ state: "visible" });
    const loaded = await page.evaluate(async () => {
      await document.fonts.ready;
      /*
       * NOT `h1`. The Clause's h1 is a flex wrapper holding a `.display` span
       * and a `.clause-tail` span, and the wrapper itself inherits the body
       * face — so asserting on the h1 reports Inter on a page whose headline is
       * correctly Marcellus. The honest question is "what face is the biggest
       * type on this page set in", so that is what is measured.
       */
      let biggest: Element | null = null;
      let size = 0;
      for (const el of document.querySelectorAll("h1, h2, .display, .c1, .c2, .ho-hero-copy h1")) {
        if (!(el.textContent || "").trim()) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs > size) {
          size = fs;
          biggest = el;
        }
      }
      return {
        literata: document.fonts.check('56px "Literata"'),
        inter: document.fonts.check('16px "Inter"'),
        size,
        used: biggest ? getComputedStyle(biggest).fontFamily : null,
      };
    });
    expect(loaded.literata, "Literata did not load — headings are in the fallback").toBe(true);
    expect(loaded.inter, "Inter did not load — body copy is in the fallback").toBe(true);
    expect(loaded.size, "no display type found — this assertion is not looking at anything").toBeGreaterThan(40);
    expect(loaded.used?.toLowerCase(), "the largest type on the page is not the brand face").toContain(
      "literata"
    );
  });

  test("@smoke cascade layers applied — the layered import really reached the page", async ({
    page,
  }) => {
    /*
     * `@layer` is the mechanism the whole cascade depends on (T-274), and this
     * asserts the OUTCOME rather than trusting that the feature parsed.
     *
     * It used to read Direction D's hero tail, which rendered only on D's
     * homepage and now renders nowhere. It reads Direction F's homepage
     * instead, and the thing it reads is a stronger test than the one it
     * replaced: `hotel.css` reaches the browser ONLY through
     * `@import "./hotel.css" layer(components)` in globals.css. An engine that
     * ignored layered imports would drop the entire stylesheet, and the page
     * would fall back to the site's limestone body ground with an unstyled
     * link where Book Now should be.
     *
     * (It was imported from `layout.tsx` for one commit, which put it OUTSIDE
     * every layer — the precise defect globals.css's own header documents twice.
     * This is the guard that would have caught it.)
     */
    await page.goto("/");
    const styled = await page.evaluate(() => {
      const root = document.querySelector('[data-look="hotel"]');
      const book = document.querySelector(".ho-book");
      return {
        ground: root ? getComputedStyle(root).backgroundColor : null,
        book: book ? getComputedStyle(book).backgroundColor : null,
      };
    });
    expect(styled.ground, "no Direction F root found — this assertion is not looking at anything").toBeTruthy();
    /* --ho-ivory, set in hotel.css and reachable only through the layered import. */
    expect(styled.ground, "the components layer did not apply hotel.css").toBe("rgb(251, 248, 242)");
    /* --ho-terracotta on Book Now, the one control that must never be unstyled. */
    expect(styled.book, "Book Now lost its ground — hotel.css did not apply").toBe("rgb(168, 68, 42)");
  });

  test("@smoke every booking affordance leads to the real engine", async ({ page }) => {
    /*
     * The one thing on this site that must never be a redesign artefact. A
     * booking link that 404s in Safari is a lost sale that nobody reports.
     */
    await page.goto("/en/villas/villa-thoi");
    const hrefs = await page
      .locator('a[href*="reserve-online.net"]')
      .evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).href));
    expect(hrefs.length, "no booking links found on a villa page").toBeGreaterThan(0);
    for (const h of hrefs) {
      expect(h).toContain("thalassesvillas.reserve-online.net");
      expect(h).toContain("lang=en");
    }
  });

  test("@smoke the operating licence is displayed", async ({ page }) => {
    /* Legally required on the live site, and a footer is easy to break. */
    await page.goto("/");
    await expect(page.locator("footer")).toContainText("1041K91003163701");
  });
});
