import { expect, test } from "@playwright/test";

/**
 * THE BAKE-OFF GUARD.
 *
 * A comparison is only worth anything if the three routes differ in DESIGN and
 * in nothing else. The failure mode is obvious and quiet: three pages drift into
 * three slightly different sets of claims, and the owner picks a direction
 * partly on copy he only saw on one of them.
 *
 * So: same facts, same booking links, same photographs — asserted. And then the
 * opposite assertion, because a bake-off whose options are not visibly distinct
 * is also a failed bake-off.
 */
const ROUTES = ["/a", "/b", "/c"];
const FIGURES = ["9", "6", "18", "4", "240"];

test.describe("three directions — same content", () => {
  for (const route of ROUTES) {
    test(`${route} states the locked capacity table`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route, { waitUntil: "load" });
      await page.evaluate(async () => {
        const s = Math.round(window.innerHeight * 0.85);
        for (let y = 0; y <= document.body.scrollHeight; y += s) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 90));
        }
      });
      const body = await page.locator("main").innerText();
      for (const f of FIGURES) {
        expect(body, `${route} is missing estate figure ${f}`).toContain(f);
      }
      // All five villas, by name, on every direction.
      for (const n of ["Villa Thoi", "Villa Persi", "Villa Eeanthe", "Villa Melia", "Villa Pueblo"]) {
        expect(body, `${route} is missing ${n}`).toContain(n);
      }
    });

    test(`${route} books against the real engine, dates only`, async ({ page }) => {
      await page.goto(route, { waitUntil: "load" });
      const hrefs = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLAnchorElement>('a[href*="reserve-online.net"]')].map(
          (a) => a.href
        )
      );
      expect(hrefs.length, `${route} has no link to the booking engine`).toBeGreaterThan(0);
      for (const h of hrefs) {
        expect(h).toContain("thalassesvillas.reserve-online.net");
        expect(h, "room preselect is inert on this host (T-156)").not.toContain("room=");
        expect(h, "the engine defaults to Greek (T-159)").toContain("lang=en");
      }
    });

    test(`${route} renders no ruled-off frame`, async ({ page }) => {
      await page.goto(route, { waitUntil: "load" });
      await page.evaluate(async () => {
        const s = Math.round(window.innerHeight * 0.85);
        for (let y = 0; y <= document.body.scrollHeight; y += s) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 90));
        }
      });
      const html = await page.content();
      for (const h of [
        "bc870bf24a014973d25acd877b7cf856",
        "635d506527ac868f8d19826ccd2cd581",
        "d75844e8e4b2b9664d2eb3e2103373e5",
        "d46d74613184883ec42184d66d1eef0a",
        "fafea700c4a888003811c8139e89ec87",
        "4088b922635567e2a388c664796a8760",
        "9e80231c072456bb5f5b0de3f1943b64",
        "89b9b7d0649de8eaf9e70763e3b9c2f5",
      ]) {
        expect(html, `${h} rendered on ${route}`).not.toContain(h);
      }
    });

    for (const width of [390, 1440]) {
      test(`${route} does not scroll sideways @ ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 844 });
        await page.goto(route, { waitUntil: "load" });
        const m = await page.evaluate(() => ({
          sw: document.documentElement.scrollWidth,
          cw: document.documentElement.clientWidth,
        }));
        expect(m.sw, `${route} overflows at ${width} (${m.sw} vs ${m.cw})`).toBe(m.cw);
      });
    }
  }

  test("the three are visibly distinct, not one page with three middles", async ({ page }) => {
    const ground: string[] = [];
    const heroType: number[] = [];
    for (const route of ROUTES) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route, { waitUntil: "load" });
      await page.waitForSelector(".dir");
      const r = await page.evaluate(() => {
        const dir = document.querySelector(".dir")!;
        const h1 = document.querySelector("h1, .c-mega");
        return {
          bg: getComputedStyle(dir).backgroundColor,
          size: h1 ? parseFloat(getComputedStyle(h1).fontSize) : 0,
        };
      });
      ground.push(r.bg);
      heroType.push(r.size);
    }
    // A is on a near-black ground; B and C are not.
    expect(new Set(ground).size, `all three share a ground colour: ${ground.join(", ")}`)
      .toBeGreaterThan(1);
    // And the hero type is not the same size on all three.
    expect(new Set(heroType).size, `identical hero type scale: ${heroType.join(", ")}`)
      .toBeGreaterThan(1);
  });

  test("/choose links to all three and to production", async ({ page }) => {
    await page.goto("/choose", { waitUntil: "load" });
    for (const r of ROUTES) {
      await expect(page.locator(`a[href="${r}"]`)).toHaveCount(1);
    }
    // Scoped to main — the nav wordmark also links to "/".
    await expect(page.locator('main a[href="/"]')).toHaveCount(1);
  });

  test("the comparison routes are excluded from search", async ({ page }) => {
    for (const route of [...ROUTES, "/choose"]) {
      await page.goto(route, { waitUntil: "load" });
      const robots = await page
        .locator('meta[name="robots"]')
        .first()
        .getAttribute("content");
      expect(robots, `${route} is indexable`).toContain("noindex");
    }
  });
});
