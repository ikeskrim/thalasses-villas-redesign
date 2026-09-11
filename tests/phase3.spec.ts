import { expect, test } from "@playwright/test";

/**
 * F+ PHASE 3 — the colour ground, the two curtain seams, the easing pass.
 *
 * Section cinema is the easiest place in the directive to break a page quietly:
 * a colour layer can sit over text, a pinned section can strand content under
 * another, and a transparent section can show whatever happens to be behind it.
 * So each effect is asserted by what it must NOT do as much as by what it does:
 * text stays AA on every blend the ground passes through, the sheet that rises
 * over a pinned section covers it completely, Book Now stays on top, nothing
 * shifts, and with reduced motion every section is exactly the page it was.
 */

const IVORY = [251, 248, 242];
const SAND = [241, 233, 220];

function lum([r, g, b]: number[]): number {
  const c = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * c(r!) + 0.7152 * c(g!) + 0.0722 * c(b!);
}
function contrast(a: number[], b: number[]): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}
function parseRgb(s: string): number[] {
  return (s.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);
}

async function motionReady(page: import("@playwright/test").Page) {
  await page.goto("/", { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector("[data-look='hotel']")?.classList.contains("ho-motion"), null, {
    timeout: 6000,
  });
  await page.waitForTimeout(400);
}

/** Put an element's top at a fraction of the viewport, through the page's own scroll. */
async function placeTop(page: import("@playwright/test").Page, selector: string, fraction: number) {
  await page.evaluate(
    ({ s, f }) => {
      const el = document.querySelector(s)!;
      const y = el.getBoundingClientRect().top + window.scrollY - window.innerHeight * f;
      window.scrollTo(0, y);
    },
    { s: selector, f: fraction }
  );
  await page.waitForTimeout(700);
}

test.describe("Phase 3 — the colour ground", () => {
  test("the ground warms to sand across the sand sections and back, by opacity alone", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await motionReady(page);

    const read = () =>
      page.evaluate(() => {
        const pin = document.querySelector<HTMLElement>(".ho-ground-pin")!;
        const r = pin.getBoundingClientRect();
        return {
          opacity: parseFloat(getComputedStyle(pin).opacity),
          inline: pin.getAttribute("style") ?? "",
          coversViewport: Math.abs(r.top) < 2 && Math.abs(r.height - window.innerHeight) < 2,
        };
      });

    await placeTop(page, "#villas", 0.1);
    const atVillas = await read();
    expect(atVillas.opacity, "the ground is sand over the villas").toBeLessThan(0.05);

    await placeTop(page, "#experiences", 0.05);
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(700);
    const inExperiences = await read();
    expect(inExperiences.opacity, "the ground did not warm inside Experiences").toBeGreaterThan(0.95);
    expect(inExperiences.coversViewport, "the ground pane does not cover the viewport").toBe(true);

    /* Transform and opacity only: the pane's colour never animates. */
    const props = inExperiences.inline
      .split(";")
      .map((d) => d.split(":")[0]?.trim())
      .filter(Boolean);
    for (const p of props) expect(["opacity", "will-change", "transform", "translate", "rotate", "scale"]).toContain(p);

    await placeTop(page, "#crete", 0.05);
    expect((await read()).opacity, "the ground did not warm inside Discover Crete").toBeGreaterThan(0.95);
  });

  test("every text colour stays AA on every blend the ground passes through", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await motionReady(page);
    const colours = await page.evaluate(() => {
      const out = new Set<string>();
      for (const sel of [".ho-lede", ".ho-eyebrow", ".ho-distances span", ".ho-distances b", ".ho-mantinada figcaption", "#experiences h2", ".ho-group > h3"])
        for (const e of document.querySelectorAll(sel)) out.add(getComputedStyle(e).color);
      return [...out];
    });
    expect(colours.length).toBeGreaterThan(2);
    for (const c of colours) {
      const fg = parseRgb(c);
      for (let a = 0; a <= 1.0001; a += 0.1) {
        const bg = IVORY.map((v, i) => v * (1 - a) + SAND[i]! * a);
        expect(contrast(fg, bg), `${c} on a ${(a * 100).toFixed(0)}% sand blend`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

test.describe("Phase 3 — the curtain seams", () => {
  test("manifesto → villas: the hero holds and the villas rise over it", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await motionReady(page);
    await placeTop(page, "#villas", 0.5);
    const s = await page.evaluate(() => {
      const hero = document.querySelector(".ho-hero")!.getBoundingClientRect();
      const at = (y: number) => document.elementFromPoint(window.innerWidth / 2, window.innerHeight * y);
      return {
        heroTop: Math.round(hero.top),
        heroPosition: getComputedStyle(document.querySelector(".ho-hero")!).position,
        lowerIsVillas: !!at(0.8)?.closest("#villas"),
        upperIsHero: !!at(0.3)?.closest(".ho-hero"),
      };
    });
    expect(s.heroPosition).toBe("sticky");
    expect(Math.abs(s.heroTop), "the hero is not holding still").toBeLessThan(4);
    expect(s.lowerIsVillas, "the villas sheet is not over the lower half").toBe(true);
    expect(s.upperIsHero, "the hero is not visible above the rising sheet").toBe(true);
  });

  test("the curtain covers the photograph, never the words — phone and desktop", async ({ browser }) => {
    /*
     * The first build of this seam held the WHOLE hero, and its copy sits on
     * the hero's bottom edge — the first thing the rising sheet reaches. On a
     * phone at 150px of scroll the paragraph was half under the villas while
     * still mid-screen. The legibility gate caught it; this pins it.
     */
    for (const opts of [
      { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
      { viewport: { width: 1440, height: 900 } },
    ]) {
      const ctx = await browser.newContext(opts);
      const page = await ctx.newPage();
      await motionReady(page);
      for (const y of [60, 150, 300, 450]) {
        await page.evaluate((v) => window.scrollTo(0, v), y);
        await page.waitForTimeout(500);
        const s = await page.evaluate(() => {
          const copy = [...document.querySelectorAll(".ho-hero-copy h1, .ho-hero-copy p, .ho-dots")];
          const lowest = Math.max(...copy.map((e) => e.getBoundingClientRect().bottom));
          const sheet = document.querySelector("#villas")!.getBoundingClientRect().top;
          return { lowest: Math.round(lowest), sheet: Math.round(sheet) };
        });
        expect(
          s.lowest,
          `at ${y}px the hero's copy reaches ${s.lowest}px and the villas sheet's edge is at ${s.sheet}px`
        ).toBeLessThanOrEqual(s.sheet + 2);
      }
      await ctx.close();
    }
  });

  test("into weddings: Experiences holds its last screen and Weddings rises over it", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await motionReady(page);
    await placeTop(page, "#weddings", 0.5);
    const s = await page.evaluate(() => {
      const ex = document.querySelector("#experiences")!.getBoundingClientRect();
      const at = (y: number) => document.elementFromPoint(window.innerWidth / 2, window.innerHeight * y);
      return {
        exBottom: Math.round(ex.bottom),
        vh: window.innerHeight,
        lowerIsWeddings: !!at(0.8)?.closest("#weddings"),
        upperIsExperiences: !!at(0.3)?.closest("#experiences"),
      };
    });
    expect(Math.abs(s.exBottom - s.vh), "Experiences' last screen is not holding").toBeLessThan(4);
    expect(s.lowerIsWeddings).toBe(true);
    expect(s.upperIsExperiences).toBe(true);
  });

  test("when a seam has passed, the pinned section is gone — nothing is stranded behind the page", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await motionReady(page);
    for (const [after, pinned] of [["#experiences", ".ho-hero"], ["#crete", "#experiences"]] as const) {
      await placeTop(page, after, 0.2);
      const visible = await page.evaluate((sel) => {
        const pts = [0.3, 0.5, 0.7, 0.9].map((y) => document.elementFromPoint(window.innerWidth / 2, window.innerHeight * y));
        return pts.some((e) => !!e?.closest(sel));
      }, pinned);
      expect(visible, `${pinned} is still showing once the page has moved past it`).toBe(false);
    }
  });

  test("Book Now stays on top of every seam", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await motionReady(page);
    for (const [sel, f] of [["#villas", 0.5], ["#weddings", 0.5], ["#crete", 0.5]] as const) {
      await placeTop(page, sel, f);
      const ok = await page.evaluate(() => {
        const a = document.querySelector<HTMLElement>(".ho-book")!;
        const r = a.getBoundingClientRect();
        const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return (top === a || a.contains(top)) && getComputedStyle(a).transform === "none" && getComputedStyle(a).opacity === "1";
      });
      expect(ok, `Book Now is covered or moved at ${sel}`).toBe(true);
    }
  });
});

test.describe("Phase 3 — the constitution", () => {
  test("reduced motion is a plain cut: no ground, no pins, the sections' own grounds", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto("/", { waitUntil: "load" });
    await page.waitForTimeout(2500);
    const s = await page.evaluate(() => ({
      motion: document.querySelector("[data-look='hotel']")!.classList.contains("ho-motion"),
      heroPos: getComputedStyle(document.querySelector(".ho-hero")!).position,
      exPos: getComputedStyle(document.querySelector("#experiences")!).position,
      groundShown: getComputedStyle(document.querySelector(".ho-ground")!).display !== "none",
      sandBg: getComputedStyle(document.querySelector("#experiences")!).backgroundColor,
    }));
    expect(s.motion).toBe(false);
    expect(s.heroPos).not.toBe("sticky");
    expect(s.exPos).not.toBe("sticky");
    expect(s.groundShown).toBe(false);
    expect(s.sandBg).toBe("rgb(241, 233, 220)");
    await ctx.close();
  });

  test("a full scroll shifts nothing and throws nothing", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.addInitScript(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((l) => {
        for (const e of l.getEntries() as unknown as { value: number; hadRecentInput: boolean }[])
          if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await motionReady(page);
    await page.mouse.move(720, 450);
    for (let i = 0; i < 40; i++) {
      await page.mouse.wheel(0, 700);
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(1200);
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    expect(cls, "Phase 3 introduced layout shift").toBeLessThan(0.02);
    expect(errors).toEqual([]);
  });
});
