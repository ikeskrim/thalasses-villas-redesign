import { expect, test } from "@playwright/test";

/**
 * DIRECTION D — the four rules, asserted.
 *
 * The design language was rejected twice on the same thing: type too large to
 * read, and compositions too congested to breathe. Those are not taste
 * questions, they are measurable, so they are measured here rather than left to
 * the next reviewer's eye.
 */

const ROUTES = ["/", "/en/the-estate", "/en/villas/villa-eeanthe", "/styleguide"];
const WIDTHS = [360, 390, 768, 1024, 1440, 1920];
const CEILING = 96;

test.describe("D1 — the display ceiling", () => {
  for (const width of WIDTHS) {
    test(`no legible type exceeds ${CEILING}px @ ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const over: string[] = [];
      for (const route of ROUTES) {
        await page.goto(route, { waitUntil: "load" });
        const hits = await page.evaluate((ceil) => {
          const out: string[] = [];
          for (const el of document.querySelectorAll<HTMLElement>("*")) {
            const cs = getComputedStyle(el);
            const size = parseFloat(cs.fontSize);
            if (size <= ceil) continue;
            // The ghost numeral is TEXTURE: aria-hidden and under 10% ink. It is
            // deliberately oversized and carries no information, so the ceiling
            // — which is about legibility — does not apply to it.
            const ghost =
              el.getAttribute("aria-hidden") === "true" && parseFloat(cs.opacity) < 0.1;
            if (ghost) continue;
            if (!(el.textContent ?? "").trim()) continue;
            out.push(`${el.tagName}.${String(el.className).slice(0, 32)} = ${Math.round(size)}px`);
          }
          return out;
        }, CEILING);
        for (const h of hits) over.push(`${route} — ${h}`);
      }
      expect(over, `type above the ${CEILING}px ceiling:\n  ${over.join("\n  ")}`).toEqual([]);
    });
  }
});

test.describe("D2 — one idea per viewport, and air between beats", () => {
  test("no beat is butted against the next", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    await page.waitForSelector(".d-plate");
    // Consecutive villa plates must be separated, not stacked edge to edge —
    // the "μπουκωμένο" failure of the previous round.
    const gaps = await page.evaluate(() => {
      const plates = [...document.querySelectorAll(".d-plate")];
      const out: number[] = [];
      for (let i = 1; i < plates.length; i++) {
        const prev = plates[i - 1]!.getBoundingClientRect();
        const cur = plates[i]!.getBoundingClientRect();
        out.push(Math.round(cur.top - prev.bottom));
      }
      return out;
    });
    expect(gaps.length).toBe(4);
    for (const g of gaps) {
      expect(g, `two villa plates are butted together (${g}px)`).toBeGreaterThan(48);
    }
  });

  test("a villa plate leaves the viewport room to end", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    const h = await page.locator(".d-plate-frame").first().evaluate((e) => e.getBoundingClientRect().height);
    expect(h, "a plate fills or overfills the viewport").toBeLessThan(900);
  });
});

test.describe("D3 — a name never sits over-and-larger than its photograph", () => {
  test("every villa name is below its frame, and smaller than it", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    await page.waitForSelector(".d-plate");
    const bad = await page.evaluate(() =>
      [...document.querySelectorAll(".d-plate")].flatMap((p) => {
        const frame = p.querySelector(".d-plate-frame")?.getBoundingClientRect();
        const name = p.querySelector(".d-plate-name");
        if (!frame || !name) return [`missing frame or name`];
        const n = name.getBoundingClientRect();
        const out: string[] = [];
        // Below, not over.
        if (n.top < frame.bottom - 1) out.push(`${name.textContent} overlaps its frame`);
        // And not wider than the thing it names.
        if (n.width > frame.width) out.push(`${name.textContent} is wider than its frame`);
        return out;
      })
    );
    expect(bad, bad.join("; ")).toEqual([]);
  });
});

test.describe("D4 — the ground, and the rarity of the dark", () => {
  test("the page is light, with exactly two deep interludes", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    await page.waitForSelector(".acts-sticky", { timeout: 15000 });

    const deep = await page.evaluate(() => {
      const PELAGOS = "rgb(20, 83, 95)";
      return [...document.querySelectorAll<HTMLElement>("main section, main > div > section, main .litany")]
        .filter((e) => getComputedStyle(e).backgroundColor === PELAGOS)
        .map((e) => String(e.className).slice(0, 40));
    });
    expect(
      deep.length,
      `deep-ground sections: ${deep.join(" | ")} — the direction allows one or two`
    ).toBeLessThanOrEqual(2);

    // And the acts, which used to be a long dark run, are now on limestone.
    const actsBg = await page.locator(".acts, .acts-stack").first().evaluate(
      (e) => getComputedStyle(e).backgroundColor
    );
    expect(actsBg, "the three acts are still on the deep ground").not.toBe("rgb(20, 83, 95)");
  });

  test("no horizontal overflow at any width", async ({ page }) => {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/", { waitUntil: "load" });
      const m = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth,
      }));
      expect(m.sw, `homepage overflows at ${width} (${m.sw} vs ${m.cw})`).toBe(m.cw);
    }
  });
});

test.describe("D5 — conversion", () => {
  test("a booking or enquiry affordance recurs down the page", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    const n = await page.evaluate(
      () =>
        document.querySelectorAll(
          'main a[href*="reserve-online.net"], main a[href*="/en/contact"], main a[href^="/en/weddings"]'
        ).length
    );
    expect(n, "too few decision points down a very long page").toBeGreaterThanOrEqual(5);
  });

  test("press proof is off the hero", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    const inHero = await page.evaluate(() => {
      const hero = document.querySelector(".d-hero");
      return /Cond/i.test(hero?.textContent ?? "");
    });
    expect(inHero, "the press mark is back in the hero").toBe(false);
    await expect(page.locator(".d-proof")).toHaveCount(1);
  });
});

test.describe("D6 — every image goes through the single resolver", () => {
  test("no raw inventory URL reaches an <img> on any route", async ({ page }) => {
    // The first build of the villa plates passed `gallery.heroImage` — a Loggia
    // CDN address — straight to next/image. Five plates rendered as five empty
    // rectangles, and worse, bypassing `localImage` bypasses the ruled-off list.
    // Same shape as T-185, so it gets the same kind of guard.
    for (const route of ROUTES) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route, { waitUntil: "load" });
      await page.evaluate(async () => {
        const s = Math.round(window.innerHeight * 0.85);
        for (let y = 0; y <= document.body.scrollHeight; y += s) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 90));
        }
      });
      const bad = await page.evaluate(() =>
        [...document.querySelectorAll("img")]
          .map((i) => decodeURIComponent(i.currentSrc || i.getAttribute("src") || ""))
          .filter((u) => /loggia-cdn|amazonaws\.com|^https?:\/\/(?!localhost)/.test(u))
      );
      expect(bad, `${route} renders a remote inventory URL: ${bad.join(", ")}`).toEqual([]);
    }
  });

  test("every villa plate actually paints a photograph", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    await page.evaluate(async () => {
      const s = Math.round(window.innerHeight * 0.8);
      for (let y = 0; y <= document.body.scrollHeight; y += s) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 130));
      }
    });
    await page.waitForTimeout(1200);
    const loaded = await page.evaluate(
      () =>
        [...document.querySelectorAll<HTMLImageElement>(".d-plate-frame img")].filter(
          (i) => i.complete && i.naturalWidth > 0
        ).length
    );
    expect(loaded, "a villa plate is an empty rectangle").toBe(5);
  });
});

test.describe("D7 — text over photography is legible by construction", () => {
  test("the hero copy band carries enough scrim for AA", async ({ page }) => {
    // Limestone needs the ground at or below sRGB ~105 for 4.5:1, which over a
    // pure-white sky means alpha >= 0.68. Asserted against the declared stops
    // rather than a sampled pixel, because the worst case is a frame we may not
    // have shot yet — the scrim has to be right for any photograph, not for
    // the one currently in the slot.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    const bg = await page.locator(".d-hero-scrim").evaluate(
      (e) => getComputedStyle(e).backgroundImage
    );
    const alphas = [...bg.matchAll(/rgba?\([^)]*?([01](?:\.\d+)?)\s*\)/g)].map((m) =>
      parseFloat(m[1]!)
    );
    expect(alphas.length, "no scrim gradient found").toBeGreaterThan(2);
    expect(
      Math.max(...alphas),
      `strongest scrim stop is ${Math.max(...alphas)}; AA over a white sky needs >= 0.68`
    ).toBeGreaterThanOrEqual(0.68);

    // And the copy must actually sit in the strong part of the ramp.
    const pos = await page.evaluate(() => {
      const hero = document.querySelector(".d-hero")!.getBoundingClientRect();
      const copy = document.querySelector(".d-hero-copy")!.getBoundingClientRect();
      return (copy.top - hero.top) / hero.height;
    });
    expect(pos, "the hero copy starts above the strong half of the scrim").toBeGreaterThan(0.45);
  });
});
