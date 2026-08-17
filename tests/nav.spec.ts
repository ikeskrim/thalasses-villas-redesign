import { expect, test } from "@playwright/test";

const ROUTES = ["/", "/en/the-estate", "/en/villas/villa-eeanthe", "/en/villas/villa-pueblo"];

/*
 * `load`, not `networkidle`.
 *
 * The nav adds ten <Link>s that are in the viewport from the first frame, and
 * Next prefetches every one of them. The network therefore never goes idle for
 * the 500ms window `networkidle` requires, and page.goto times out on a page
 * that has in fact rendered perfectly — verified: status 200, nav present, five
 * register items, zero page errors, zero pending resources.
 *
 * `networkidle` was always the wrong instrument here; it measures the absence
 * of requests, not the presence of content.
 */

test.describe("navigation", () => {
  for (const route of ROUTES) {
    test(`nav renders and books from ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route, { waitUntil: "load" });

      await expect(page.locator(".nav")).toHaveCount(1);
      await expect(page.locator(".nav-register li")).toHaveCount(5);

      // The booking affordance is always reachable, never behind the toggle.
      const book = page.locator(".nav-book");
      await expect(book).toBeVisible();
      const href = await book.getAttribute("href");
      expect(href).toContain("thalassesvillas.reserve-online.net");
      expect(href, "room preselect is inert on this host (T-156)").not.toContain("room=");
      expect(href, "the engine defaults to Greek (T-159)").toContain("lang=en");
    });
  }

  test("the glass switches on only after the hero", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    await page.waitForTimeout(300);

    const over = await page.locator(".nav").getAttribute("class");
    expect(over, "nav must be transparent over the hero").not.toContain("is-solid");

    await page.evaluate(() => window.scrollTo(0, window.innerHeight));
    // The glass transitions over 600ms; reading at 400ms returns "none"
    // mid-transition, which is the transition working, not the glass missing.
    await page.waitForTimeout(1000);
    const after = await page.locator(".nav").getAttribute("class");
    expect(after, "nav must gain the glass after the hero").toContain("is-solid");

    const blur = await page.evaluate(
      () => getComputedStyle(document.querySelector(".nav")!).backdropFilter
    );
    expect(blur).toContain("blur");
  });

  test("nav is keyboard complete", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 900 }); // toggle visible
    await page.goto("/", { waitUntil: "load" });

    const toggle = page.locator(".nav-toggle");
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#nav-panel")).toBeVisible();

    // Escape closes and returns focus to the toggle.
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
  });

  test("the skip link is the first focusable thing on the page", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.className ?? "");
    expect(focused).toContain("skip-link");
    await expect(page.locator("#main")).toHaveCount(1);
  });

  /**
   * THE FIXED-LAYER OVERFLOW GUARD (T-213).
   *
   * `qa.spec.ts` asserts documentElement.scrollWidth === clientWidth at six
   * widths on five routes, and it passed the whole time the Menu button was
   * sitting off the right edge of every phone: the nav is `position: fixed`, and
   * a fixed element contributes nothing to the document's scroll width. The
   * mobile menu was unreachable at 320, 360, 390 and 430 — measured, all four —
   * and no assertion in the suite could see it.
   *
   * So the fixed layer gets its own measurement, in its own coordinate space:
   * every interactive child of the bar must lie inside the viewport.
   */
  for (const width of [320, 360, 390, 430, 768, 1024, 1440]) {
    test(`every nav control is inside the viewport @ ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/en/villas/villa-eeanthe", { waitUntil: "load" });
      await page.waitForSelector(".nav-inner");

      const strays = await page.evaluate(() => {
        const out: { sel: string; left: number; right: number }[] = [];
        const bar = document.querySelector(".nav-inner")!;
        for (const el of bar.querySelectorAll<HTMLElement>("a, button")) {
          if (getComputedStyle(el).display === "none") continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) continue;
          if (r.left < -0.5 || r.right > window.innerWidth + 0.5) {
            out.push({
              sel: el.className || el.tagName,
              left: Math.round(r.left),
              right: Math.round(r.right),
            });
          }
        }
        return out;
      });

      expect(
        strays,
        `nav controls outside the viewport at ${width}px: ${JSON.stringify(strays)}`
      ).toEqual([]);
    });
  }

  test("the mobile booking affordance keeps a real accessible name", async ({ page }) => {
    // The narrow label is a display swap, not an aria-label override: exactly
    // one of the two spans is displayed, so the accessible name and the visible
    // text can never disagree (WCAG 2.5.3).
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/", { waitUntil: "load" });
      await expect(page.locator(".nav-book")).toBeVisible();

      // Assert the invariant, not the glyphs: `.micro` applies
      // text-transform: uppercase, so innerText reads "BOOK", and asserting the
      // rendered string would be asserting the styling of the label rather than
      // which label exists.
      const state = await page.evaluate(() => {
        const d = (s: string) => {
          const e = document.querySelector(s);
          return e ? getComputedStyle(e).display : "absent";
        };
        return { full: d(".nav-book-full"), short: d(".nav-book-short") };
      });

      const shown = [
        state.full !== "none" ? "full" : null,
        state.short !== "none" ? "short" : null,
      ].filter(Boolean);

      expect(shown, `exactly one label must be in the a11y tree at ${width}: ${JSON.stringify(state)}`)
        .toEqual([width < 768 ? "short" : "full"]);
    }
  });

  test("the nav cannot re-break a sticky pin (T-203 regression)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    // backdrop-filter lives on the nav ONLY, which is fixed and has no sticky
    // descendants. If it ever moves onto an ancestor of .acts-sticky the pin dies.
    const navIsAncestorOfSticky = await page.evaluate(() => {
      const nav = document.querySelector(".nav");
      const sticky = document.querySelector(".acts-sticky");
      return Boolean(nav && sticky && nav.contains(sticky));
    });
    expect(navIsAncestorOfSticky).toBe(false);
  });
});

test.describe("the estate page carries the map at full depth", () => {
  test("map, ledger and concierge CTA all present", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/the-estate", { waitUntil: "load" });

    await expect(page.locator(".estate-map")).toHaveCount(1);
    const markers = await page.locator(".estate-map-marker").count();
    expect(markers).toBeGreaterThanOrEqual(6);
    expect(await page.locator(".estate-map-list-item").count()).toBe(markers);

    const values = (await page.locator(".ledger-spec-value").allTextContents()).map((s) => s.trim());
    for (const v of ["9", "6", "18", "4", "240"]) expect(values).toContain(v);

    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toContain("enquire — we design your stay");
    expect(body).not.toContain("cannot be booked");
  });
});
