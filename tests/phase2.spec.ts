import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * F+ PHASE 2 — the wedding deck, the villa morph, Discover Crete.
 *
 * Every assertion here is a promise the motion layer makes to something that
 * is not motion: content that stays true, focus that still lands, scroll that
 * still restores, a booking control that is never touched, and a page that is
 * complete with the effect switched off. The effects are asserted where they
 * can be measured; where they cannot (a View Transition's pseudo-elements are
 * not scriptable), the *consequences* are asserted instead.
 */

const ROOT = process.cwd();
const REGISTRY = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "verified-facts.json"), "utf-8")) as {
  distances: { name: string; value: string }[];
};
const STOCK_DIR = "/images/_stock/";

test.describe("Phase 2 — the wedding deck", () => {
  test("four frames of the property's own, in order, and never stock", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    const cards = await page.evaluate(() =>
      [...document.querySelectorAll("#weddings .ho-deck-card")].map((c) => {
        const img = c.querySelector("img");
        const s = img?.getAttribute("src") ?? "";
        const m = /url=([^&]+)/.exec(s);
        return {
          src: m?.[1] ? decodeURIComponent(m[1]) : s,
          alt: img?.getAttribute("alt") ?? "",
          caption: c.querySelector("figcaption")?.textContent?.replace(/\s+/g, " ").trim() ?? "",
        };
      })
    );
    expect(cards.length, "the deck has four frames").toBe(4);
    for (const c of cards) {
      expect(c.src.startsWith(STOCK_DIR), `${c.src} is stock on a Tier A subject`).toBe(false);
      expect(c.alt.length, "every deck frame carries its graded subject as alt").toBeGreaterThan(10);
      expect(c.caption).toContain(c.alt);
    }
    /* Distinct frames — a deck of the same photograph is a bug, not a set-piece. */
    expect(new Set(cards.map((c) => c.src)).size).toBe(4);
  });

  test("stacks by CSS on a fine pointer, and is a plain column under reduced motion", async ({ browser }) => {
    const fine = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await fine.newPage();
    await p.goto("/", { waitUntil: "load" });
    const sticky = await p.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("#weddings .ho-deck-card")].map((c) => getComputedStyle(c).position)
    );
    expect(sticky.every((s) => s === "sticky"), `deck cards are ${sticky.join(",")}`).toBe(true);

    /* Scroll so the third card has arrived over the second: the second must
       have settled back (scaled down and dimmed), the third must be full. */
    await p.evaluate(() => document.querySelectorAll("#weddings .ho-deck-card")[2]?.scrollIntoView({ block: "start" }));
    await p.waitForTimeout(900);
    const [second, third] = await p.evaluate(() => {
      const cs = [...document.querySelectorAll<HTMLElement>("#weddings .ho-deck-card")];
      const read = (el: HTMLElement) => {
        const s = getComputedStyle(el);
        const m = new DOMMatrixReadOnly(s.transform === "none" ? "" : s.transform);
        return { scale: m.a, opacity: parseFloat(s.opacity) };
      };
      return [read(cs[1]!), read(cs[2]!)];
    });
    expect(second!.scale, "the covered card eased back").toBeLessThan(0.995);
    expect(second!.scale, "but by no more than the directive's 4%").toBeGreaterThanOrEqual(0.955);
    /*
     * The third card is on top of the second, so it must be the larger and the
     * brighter of the pair — but it may already have BEGUN its own settle,
     * because the fourth card enters the viewport bottom at this scroll and
     * that is where its trigger starts. "Untouched" was the wrong expectation;
     * "in front" is the right one.
     */
    expect(third!.scale).toBeGreaterThan(second!.scale);
    expect(third!.scale).toBeGreaterThanOrEqual(0.955);
    expect(third!.opacity).toBeGreaterThan(second!.opacity);
    await fine.close();

    const reduced = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
    const r = await reduced.newPage();
    await r.goto("/", { waitUntil: "load" });
    await r.waitForTimeout(600);
    const still = await r.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("#weddings .ho-deck-card")].map((c) => ({
        position: getComputedStyle(c).position,
        transform: getComputedStyle(c).transform,
        opacity: getComputedStyle(c).opacity,
        visible: c.getBoundingClientRect().height > 0,
      }))
    );
    for (const s of still) {
      expect(s.position).toBe("static");
      expect(s.transform).toBe("none");
      expect(s.opacity).toBe("1");
      expect(s.visible).toBe(true);
    }
    await reduced.close();
  });
});

test.describe("Phase 2 — the villa morph", () => {
  test("card to villa page: arrives, focus lands on #main, nothing is left named", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    await page.evaluate(() => document.querySelector("#villas .ho-card")?.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(700);

    const supported = await page.evaluate(() => "startViewTransition" in document);
    await page.locator("#villas .ho-card .ho-card-link").first().click();
    await page.waitForURL("**/en/villas/villa-thoi");
    await page.waitForTimeout(supported ? 1200 : 400);

    const landed = await page.evaluate(() => ({
      path: location.pathname,
      focus: document.activeElement?.id ?? "",
      heroNamed: !!document.querySelector<HTMLElement>(".d-villa-hero img")?.style.viewTransitionName,
      vtAttr: document.documentElement.getAttribute("data-vt"),
      wipe: document.querySelectorAll(".d-wipe").length,
      heroVisible: !!document.querySelector(".d-villa-hero img"),
    }));
    expect(landed.path).toBe("/en/villas/villa-thoi");
    expect(landed.focus, "the hand-off to #main survived the morph").toBe("main");
    expect(landed.heroNamed, "the transition name was cleared after the morph").toBe(false);
    expect(landed.vtAttr, "data-vt was removed when the morph finished").toBeNull();
    expect(landed.heroVisible).toBe(true);
    if (supported) expect(landed.wipe, "the pelagos wipe stood down for the morph").toBe(0);
  });

  test("scroll restoration survives: back returns to the card", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    await page.evaluate(() => document.querySelector("#villas .ho-card")?.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(700);
    const before = await page.evaluate(() => Math.round(window.scrollY));
    expect(before).toBeGreaterThan(300);

    await page.locator("#villas .ho-card .ho-card-link").first().click();
    await page.waitForURL("**/en/villas/villa-thoi");
    await page.waitForTimeout(1200);
    const onVilla = await page.evaluate(() => Math.round(window.scrollY));
    expect(onVilla, "the villa page opens at its top").toBeLessThan(80);

    await page.goBack();
    await page.waitForURL("**/");
    await page.waitForTimeout(900);
    const after = await page.evaluate(() => Math.round(window.scrollY));
    expect(Math.abs(after - before), `scroll was ${before} before and ${after} after back`).toBeLessThan(120);
  });

  test("reduced motion: no wipe, no morph name, an instant arrival", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto("/", { waitUntil: "load" });
    await page.evaluate(() => document.querySelector("#villas .ho-card")?.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(300);
    const t0 = Date.now();
    await page.locator("#villas .ho-card .ho-card-link").first().click();
    await page.waitForURL("**/en/villas/villa-thoi");
    await page.waitForSelector(".d-villa-hero img");
    const elapsed = Date.now() - t0;
    await page.waitForTimeout(300);
    const state = await page.evaluate(() => ({
      wipe: document.querySelectorAll(".d-wipe").length,
      vtAttr: document.documentElement.getAttribute("data-vt"),
      named: !!document.querySelector<HTMLElement>(".d-villa-hero img")?.style.viewTransitionName,
      focus: document.activeElement?.id ?? "",
    }));
    expect(state.wipe).toBe(0);
    expect(state.vtAttr).toBeNull();
    expect(state.named, "reduced motion names no group — cross-fade only").toBe(false);
    expect(state.focus).toBe("main");
    /* A generous bound: the cross-fade is 120ms; the rest is the route. */
    expect(elapsed, "reduced motion must not hold the page").toBeLessThan(2500);
    await ctx.close();
  });

  test("the reduced-motion cross-fade is declared at 150ms or under", () => {
    /*
     * `::view-transition-*` pseudo-elements cannot be read from script, so the
     * brief's ≤150ms is asserted on the stylesheet that declares it.
     */
    const css = fs.readFileSync(path.join(ROOT, "src", "app", "direction-d.css"), "utf-8");
    const m = /html\[data-vt="reduced"\]::view-transition-old\(root\),\s*html\[data-vt="reduced"\]::view-transition-new\(root\)\s*\{\s*animation-duration:\s*(\d+)ms/.exec(css);
    expect(m, "the reduced-motion root rule is missing").toBeTruthy();
    expect(Number(m![1])).toBeLessThanOrEqual(150);
  });
});

test.describe("Phase 2 — Discover Crete", () => {
  test("every distance is printed true on the server, and lands true after counting", async ({ page }) => {
    /* Server HTML first — what a crawler and a reader without JS receive. */
    const html = await (await page.request.get("/")).text();
    for (const d of REGISTRY.distances) {
      expect(html, `server HTML does not state "${d.value}" for ${d.name}`).toContain(`>${d.value}<`);
    }
    expect(html).not.toContain(">0 km<");

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    await page.evaluate(() => document.querySelector(".ho-distances")?.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(1400);
    const shown = await page.evaluate(() =>
      [...document.querySelectorAll(".ho-distances b")].map((b) => ({
        shown: (b.textContent ?? "").trim(),
        truth: b.getAttribute("data-distance"),
      }))
    );
    expect(shown.length).toBe(REGISTRY.distances.length);
    for (const s of shown) expect(s.shown, "a count-up did not land on the registry value").toBe(s.truth);
  });

  test("the aerial drifts by at most 8% on a fine pointer, and not at all on touch or under reduce", async ({ browser }) => {
    const fine = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await fine.newPage();
    await p.goto("/", { waitUntil: "load" });
    await p.evaluate(() => document.querySelector(".ho-crete-figure")?.scrollIntoView({ block: "end" }));
    await p.waitForTimeout(600);
    const a = await p.evaluate(() => {
      const img = document.querySelector<HTMLElement>(".ho-crete-figure img")!;
      const m = new DOMMatrixReadOnly(getComputedStyle(img).transform === "none" ? "" : getComputedStyle(img).transform);
      return { y: m.f, h: img.getBoundingClientRect().height };
    });
    await p.evaluate(() => document.querySelector(".ho-crete-figure")?.scrollIntoView({ block: "start" }));
    await p.waitForTimeout(600);
    const b = await p.evaluate(() => {
      const img = document.querySelector<HTMLElement>(".ho-crete-figure img")!;
      const m = new DOMMatrixReadOnly(getComputedStyle(img).transform === "none" ? "" : getComputedStyle(img).transform);
      return { y: m.f };
    });
    const travel = Math.abs(a.y - b.y) / a.h;
    expect(travel, `travel was ${(travel * 100).toFixed(1)}% of the image height`).toBeGreaterThan(0.005);
    expect(travel).toBeLessThanOrEqual(0.085);
    await fine.close();

    for (const opts of [{ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } }, { reducedMotion: "reduce" as const }]) {
      const ctx = await browser.newContext(opts);
      const q = await ctx.newPage();
      await q.goto("/", { waitUntil: "load" });
      await q.evaluate(() => document.querySelector(".ho-crete-figure")?.scrollIntoView({ block: "center" }));
      await q.waitForTimeout(600);
      const t = await q.evaluate(() => {
        const img = document.querySelector<HTMLElement>(".ho-crete-figure img")!;
        const fig = img.parentElement!.getBoundingClientRect();
        return { transform: getComputedStyle(img).transform, h: img.getBoundingClientRect().height, figH: fig.height };
      });
      expect(t.transform).toBe("none");
      expect(Math.abs(t.h - t.figH), "the still frame fills its figure exactly").toBeLessThan(2);
      await ctx.close();
    }
  });
});

test.describe("Phase 2 — the constitution still holds", () => {
  test("the homepage throws no uncaught error, at load or on a full scroll", async ({ page }) => {
    /*
     * A ReferenceError inside the motion layer's setup silently disabled
     * everything after the line that threw, and every other test still passed
     * because none of them listened. This one listens. It is the difference
     * between "the effects were absent" and "the effects were absent BECAUSE".
     */
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    await page.waitForTimeout(1500);
    await page.evaluate(async () => {
      const h = document.documentElement.scrollHeight;
      for (let y = 0; y <= h; y += 500) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
    });
    await page.waitForTimeout(800);
    /* next/image's dev-only warnings are not errors of this page. */
    const real = errors.filter((e) => !/Image with src|was preloaded using link preload/i.test(e));
    expect(real, `uncaught on /:\n  ${real.join("\n  ")}`).toEqual([]);
  });

  test("Book Now is untouched by any of it", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    for (const sel of ["#weddings .ho-deck", ".ho-crete-figure", ".ho-distances", "#villas"]) {
      await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: "center" }), sel);
      await page.waitForTimeout(500);
      const book = await page.evaluate(() => {
        const a = document.querySelector<HTMLElement>(".ho-book")!;
        const r = a.getBoundingClientRect();
        const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return {
          onTop: top === a || a.contains(top),
          transform: getComputedStyle(a).transform,
          opacity: getComputedStyle(a).opacity,
          inView: r.top >= 0 && r.top < 120,
          href: a.getAttribute("href") ?? "",
        };
      });
      expect(book.onTop, `Book Now is covered while ${sel} is in view`).toBe(true);
      expect(book.transform).toBe("none");
      expect(book.opacity).toBe("1");
      expect(book.inView).toBe(true);
      expect(book.href).toContain("thalassesvillas.reserve-online.net");
    }
  });

  test("display type stays under the 96px ceiling with the new sections in", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/", { waitUntil: "load" });
    const max = await page.evaluate(() =>
      Math.max(...[...document.querySelectorAll("h1,h2,h3,.ho-mark,figcaption b")].map((e) => parseFloat(getComputedStyle(e).fontSize)))
    );
    expect(max).toBeLessThanOrEqual(96);
  });
});
