import { expect, test } from "@playwright/test";

/**
 * VISUAL REGRESSION — approved pixels, so a change has to be intended.
 *
 * Everything else in this suite asserts a fact: a figure matches the registry,
 * a link resolves, a contrast clears AA. None of it can see that a section has
 * collapsed, that a photograph is stretched, or that a heading now sits on top
 * of a rule. The taste audit measures some of that; a baseline sees all of it.
 *
 * It is worth having only now. A baseline taken over a design still being
 * argued about is a machine for producing false failures, and a suite that
 * fails for uninteresting reasons is a suite people stop reading. Direction D
 * has been stable for two tranches.
 *
 * FOUR DECISIONS, because a flaky visual test is worse than none:
 *
 *   VIEWPORT, NOT FULL PAGE. The homepage is 19,000 px tall and the estate
 *   loads 144 photographs; a `fullPage` baseline is a 40-megapixel bitmap, and
 *   thirty of those already killed this runner once. Each shot is one viewport
 *   at a named position, which is also what a visitor actually sees.
 *
 *   REDUCED MOTION, EMULATED. This site has scroll reveals, a smooth-scroll
 *   layer, a contextual cursor and a preloader. Under `prefers-reduced-motion`
 *   it renders its final state directly — which is both stable and a real
 *   rendering path the site supports, rather than a special test mode.
 *
 *   deviceScaleFactor 1. A retina baseline is four times the bytes for no extra
 *   signal — a layout collapse is not subtle at 1x.
 *
 *   A SMALL PIXEL TOLERANCE. Font rasterisation and image decoding differ by a
 *   pixel or two between runs on the same machine. The tolerance is set to
 *   absorb that and nothing more: it is a fraction of a percent, far below any
 *   change a person would notice, so a real regression still fails.
 *
 * Baselines live in `tests/visual.spec.ts-snapshots/` and are committed. To
 * approve an intended change: `npx playwright test tests/visual.spec.ts -u`,
 * then LOOK at the diff before committing it. A baseline updated without being
 * looked at is worse than no baseline, because it launders the regression.
 */

const ROUTES: [name: string, path: string][] = [
  ["home", "/"],
  ["estate", "/en/the-estate"],
  ["villa-thoi", "/en/villas/villa-thoi"],
  ["villa-pueblo", "/en/villas/villa-pueblo"],
  ["gallery", "/en/gallery"],
  ["experiences", "/en/experiences"],
  ["weddings", "/en/weddings"],
  ["location", "/en/location"],
  ["careers", "/en/careers"],
  ["contact", "/en/contact"],
  ["terms", "/en/terms"],
];

const WIDTHS: [label: string, width: number, height: number][] = [
  ["1440", 1440, 900],
  ["390", 390, 844],
];

/** Absorbs rasterisation noise, nothing a person could see. */
const TOLERANCE = { maxDiffPixelRatio: 0.002, threshold: 0.2 } as const;

test.describe("visual baselines", () => {
  for (const [name, route] of ROUTES) {
    for (const [label, width, height] of WIDTHS) {
      test(`${name} @ ${label}`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.setViewportSize({ width, height });
        await page.goto(route, { waitUntil: "load" });

        /*
         * Walk the whole page once so lazy images decode and any reveal that
         * still runs has run, then return to the top. Without the walk the
         * baseline captures a page mid-load, and a baseline of a loading state
         * fails whenever the load is a few milliseconds faster.
         */
        const total = await page.evaluate(() => document.body.scrollHeight);
        for (let y = 0; y <= total; y += Math.round(height * 0.8)) {
          await page.evaluate((v) => window.scrollTo(0, v), y);
          await page.waitForTimeout(40);
        }
        await page.evaluate(() => window.scrollTo(0, 0));

        /*
         * Give every image a chance to decode — but BOUNDED.
         *
         * The unbounded version hung the homepage for the full 30-second test
         * timeout while every other route passed in three seconds. Twelve
         * images are left permanently incomplete by a scroll-through: they are
         * `loading="lazy"`, their requests are abandoned when they leave the
         * viewport, and `img.decode()` on an abandoned request **never
         * settles** — `.catch()` does not help, because it never rejects
         * either. That is a hang, not a slow test, and no amount of raising
         * the timeout fixes a promise that will not resolve.
         *
         * A race is the right shape. `toHaveScreenshot` already waits for two
         * consecutive identical frames, so decoding is an optimisation that
         * makes it settle sooner, not the thing the assertion depends on.
         */
        await page.evaluate(async () => {
          const bounded = (p: Promise<unknown>) =>
            Promise.race([p.catch(() => {}), new Promise((r) => setTimeout(r, 1500))]);
          await Promise.all(
            [...document.images].filter((i) => !i.complete).map((i) => bounded(i.decode()))
          );
        });
        await page.waitForTimeout(600);

        /*
         * PHOTOGRAPHS ARE MASKED, and this is the decision that makes the whole
         * thing affordable and sharper at the same time.
         *
         * Unmasked, twenty-two baselines came to **13.4 MB** — and losslessly
         * recompressing them saved 3%, because a PNG of a photograph is already
         * about as small as a PNG of a photograph gets. Committing 13 MB of
         * JPEG noise into a repository that just had 167 MB reclaimed from it
         * would be a poor trade.
         *
         * It is also the wrong thing to store. **The photography is already
         * guarded**: `tests/images.spec.ts` asserts every image the page asks
         * for serves 200 and that no alias resolves to a missing file, and
         * `tests/alt-text.spec.ts` asserts every one is described. What nothing
         * guarded was LAYOUT — a collapsed section, a heading landing on a
         * rule, a grid losing a column — and a masked baseline is about type,
         * spacing and structure and nothing else.
         *
         * The mask paints each image a flat colour, so its BOX is still
         * compared. An image that changes aspect ratio or loses its container
         * still moves the pixels around it and still fails.
         */
        await expect(page).toHaveScreenshot(`${name}-${label}.png`, {
          animations: "disabled",
          caret: "hide",
          scale: "css",
          mask: [page.locator("img"), page.locator("video")],
          ...TOLERANCE,
        });
      });
    }
  }
});
