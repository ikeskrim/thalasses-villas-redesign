import { test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Viewport captures of the pinned acts.
 *
 * A fullPage screenshot cannot represent a `position: sticky` section — it
 * paints the sticky child once and leaves the rest of the tall container empty,
 * which reads as a broken block to anyone reviewing the image. These are what a
 * visitor actually sees, one frame per act.
 */
const DIR = path.join(process.cwd(), "qa", "acts");

test("capture each act as seen", async ({ page }) => {
  fs.mkdirSync(DIR, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "load" });
  await page.waitForSelector(".acts-sticky", { timeout: 15000 });

  /*
   * Document offsets, not viewport ones. boundingBox().y is relative to the
   * CURRENT viewport, so using it as a scroll target lands somewhere arbitrary
   * — in the first version it landed past the end of the pinned run, where the
   * sticky child has already released. The screenshots showed a half-empty
   * section and a cut-off heading, and I nearly "fixed" a layout that was fine.
   * Measure in document space.
   */
  const rect = await page.evaluate(() => {
    const el = document.querySelector(".acts") as HTMLElement | null;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top + window.scrollY, height: r.height };
  });
  if (!rect) throw new Error("acts section not found — is the viewport wide enough to pin?");

  for (let i = 0; i < 3; i++) {
    // Land in the middle of each third of the pinned run.
    const y = rect.top + (rect.height / 3) * i + rect.height / 6;
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(DIR, `act-${i + 1}.png`) });
  }

  // And the estate map, in place.
  await page.locator(".estate-map-frame").scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await page.locator(".estate-map-marker").first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(DIR, "estate-map.png") });

  // The litany, mid-list.
  await page.locator(".litany-line").nth(2).scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(DIR, "litany.png") });
});
