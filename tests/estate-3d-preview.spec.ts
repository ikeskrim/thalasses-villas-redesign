import fs from "node:fs";
import path from "node:path";

import { test, expect, type Locator, type Page } from "@playwright/test";

import { HOTSPOTS } from "../src/app/home-data";
import type { EstatePlan } from "../src/lib/estate-plan-gate";

/**
 * THE 3D ESTATE MAP ITSELF — against the local review build only.
 *
 * Run with `npm run build:estate3d` then `npm run qa:estate3d`
 * (playwright.estate3d.config.ts, :3035). That build opens the provenance gate
 * with ESTATE_3D_PREVIEW=1, which the gate refuses on Vercel; the public build's
 * closed gate is tested by tests/estate-3d.spec.ts under `npm run qa`.
 *
 * What must hold for the diagram:
 *  - it occupies exactly the 2D frame's box, so nothing on the page moves;
 *  - it says on its face that this build is a preview of unverified positions;
 *  - its places keep the 2D map's contract (step B, B4): real buttons in the
 *    numbered list's order and then the extras, each opening a card whose copy
 *    is the list's own, with the Visit link as the only way to navigate;
 *  - on a phone a tap opens and never navigates, and nothing depends on hover (B5);
 *  - reduced motion (at load or turned on later), no WebGL, or data saver: the
 *    2D map, and three.js never fetched where it can be avoided (B1, B6);
 *  - at 768, 1024, 1440 and 1920 px no two places overlap and none leaves the
 *    frame (B7); the ground renders the limestone token (B2);
 *  - the places the plan does not place are absent from the drawing, named in
 *    the note, and present in the numbered list, which is identical either way.
 */

const ROUTE = "/en/the-estate";
const plan = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content", "estate-plan.json"), "utf-8")) as EstatePlan;
const drawn = plan.elements.filter((e) => e.position !== null);
const drawnIds = new Set(drawn.map((e) => e.id));
const unplaced = plan.elements.filter((e) => e.position === null);

/*
 * THE PLACES THE DIAGRAM MUST OFFER, restated from the rules rather than
 * imported from the component, so a change to the component's rules shows up
 * here as a failure instead of a test that silently agrees with it.
 *  - A list hotspot is a place when an element carrying it is drawn. The beach
 *    is never one: the shoreline has no name on record (DECISIONS.md D-022).
 *  - Then every drawn element with a route that the list does not carry, except
 *    the context kinds.
 */
const LIST_ELEMENTS: Record<string, string[]> = {
  thoi: ["thoi"],
  persi: ["persi"],
  eeanthe: ["eeanthe"],
  melia: ["melia"],
  pueblo: ["pueblo"],
  pools: ["thoi-pool", "persi-pool", "melia-pool", "eeanthe-pool"],
  table: ["long-table"],
  garden: ["vegetable-garden"],
};
const listPlaces = HOTSPOTS.filter((h) => (LIST_ELEMENTS[h.id] ?? []).some((id) => drawnIds.has(id)));
const carried = new Set(Object.values(LIST_ELEMENTS).flat());
const extras = drawn.filter((e) => e.href && !carried.has(e.id) && !["lane", "apron", "compound", "shore", "pool"].includes(e.kind));
const EXPECTED_ORDER = [...listPlaces.map((h) => h.label), ...extras.map((e) => e.name)];

async function recordThree(page: Page) {
  const fetched: string[] = [];
  page.on("response", async (r) => {
    if (r.request().resourceType() !== "script") return;
    const body = await r.text().catch(() => "");
    if (body.includes("WebGLRenderer")) fetched.push(r.url());
  });
  return fetched;
}

async function scrollToMap(page: Page) {
  await page.locator("section.estate-map").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
}

/** The diagram, mounted and laid out (its buttons measured and placed). */
async function openDiagram(page: Page): Promise<Locator> {
  await page.goto(ROUTE);
  await scrollToMap(page);
  const frame3d = page.locator(".estate-map-frame--3d[data-placed]");
  await expect(frame3d).toBeVisible({ timeout: 15_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  return frame3d;
}

type Rect = { x: number; y: number; width: number; height: number };
const intersects = (a: Rect, b: Rect) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/** The place buttons' real boxes, against each other, the frame and the note. */
async function measurePlaces(frame3d: Locator) {
  return frame3d.evaluate((el) => {
    const f = el.getBoundingClientRect();
    const note = el.querySelector(".estate-map-3d-note")!.getBoundingClientRect();
    const items = [...el.querySelectorAll<HTMLElement>(".estate-map-3d-button")].map((b) => ({
      name: b.querySelector(".estate-map-3d-name")?.textContent ?? "",
      r: b.getBoundingClientRect(),
      nameShown: getComputedStyle(b.querySelector(".estate-map-3d-name")!).position !== "absolute",
    }));
    const hit = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    const overlaps: string[] = [];
    for (let i = 0; i < items.length; i++)
      for (let j = i + 1; j < items.length; j++) if (hit(items[i]!.r, items[j]!.r)) overlaps.push(`${items[i]!.name} × ${items[j]!.name}`);
    return {
      count: items.length,
      overlaps,
      outside: items
        .filter(({ r }) => r.left < f.left - 0.5 || r.right > f.right + 0.5 || r.top < f.top - 0.5 || r.bottom > f.bottom + 0.5)
        .map((i) => i.name),
      small: items.filter(({ r }) => r.width < 44 || r.height < 44).map((i) => i.name),
      overNote: items.filter(({ r }) => hit(r, note)).map((i) => i.name),
      namesHidden: items.filter((i) => !i.nameShown).map((i) => i.name),
    };
  });
}

test.describe("3D estate map — review build", () => {
  test("the diagram replaces the frame in the same box, and says it is unverified", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(ROUTE);
    const frame2d = page.locator(".estate-map-frame").first();
    await frame2d.scrollIntoViewIfNeeded();
    const box2d = await frame2d.boundingBox();
    const listBefore = await page.locator(".estate-map-list").innerText();

    await scrollToMap(page);
    const frame3d = page.locator(".estate-map-frame--3d");
    await expect(frame3d).toBeVisible({ timeout: 15_000 });
    await expect(frame3d.locator("canvas.estate-map-3d-canvas")).toHaveCount(1);
    await expect(page.locator(".estate-map-frame--preview")).toHaveCount(1);

    const box3d = await frame3d.boundingBox();
    expect(Math.abs((box3d?.width ?? 0) - (box2d?.width ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((box3d?.height ?? 0) - (box2d?.height ?? 0))).toBeLessThanOrEqual(1);

    await expect(frame3d.locator(".estate-map-3d-note-long")).toContainText("Preview — unverified.");
    await expect(frame3d.locator(".estate-map-3d-note-long")).toContainText("The list below carries every place.");
    await expect(frame3d.locator(".estate-map-3d-note-short")).toContainText("Preview — unverified positions.");

    /* Every drawn place with a route reaches it, through its card's Visit link and nowhere else. */
    const buttons = frame3d.locator(".estate-map-3d-button");
    await expect(buttons).toHaveCount(EXPECTED_ORDER.length);
    for (const e of drawn.filter((x) => x.href && ["villa", "helipad", "venue"].includes(x.kind))) {
      await expect(frame3d.locator(`.estate-map-3d-card a[href="${e.href}"]`), e.id).toHaveCount(1);
    }
    await expect(frame3d.locator(`a:not(.estate-map-3d-card a)`), "a link outside a card navigates on the first tap").toHaveCount(0);

    /* The shoreline is drawn but is no place; "The private beach" stays in the list only. */
    const places = frame3d.locator(".estate-map-3d-place");
    await expect(places.filter({ hasText: "The private beach" })).toHaveCount(0);
    await expect(places.filter({ hasText: "Shoreline" })).toHaveCount(0);

    for (const e of unplaced) {
      await expect(places.filter({ hasText: e.name }), `${e.id} has no position, so no place`).toHaveCount(0);
      if (["pueblo", "long-table", "vegetable-garden"].includes(e.id)) {
        await expect(frame3d.locator(".estate-map-3d-note-long")).toContainText(e.name);
      }
    }

    const listItems = page.locator(".estate-map-list-item");
    await expect(listItems).toHaveCount(HOTSPOTS.length);
    for (const [i, h] of HOTSPOTS.entries()) {
      await expect(listItems.nth(i).locator(".estate-map-list-name")).toHaveText(h.label);
    }
    expect(await page.locator(".estate-map-list").innerText()).toBe(listBefore);
    expect(errors).toEqual([]);
  });

  test("keyboard: the list's order then the extras; Enter opens the list's own card; Escape from inside it closes and returns focus; Tab out closes", async ({ page }) => {
    const frame3d = await openDiagram(page);
    const buttons = frame3d.locator(".estate-map-3d-button");
    await expect(buttons).toHaveCount(EXPECTED_ORDER.length);

    await buttons.first().focus();
    for (const [i, name] of EXPECTED_ORDER.entries()) {
      if (i > 0) await page.keyboard.press("Tab");
      await expect(page.locator(":focus"), `tab stop ${i + 1}`).toHaveAccessibleName(name);
      await expect(page.locator(":focus")).toHaveClass(/estate-map-3d-button/);
    }

    const first = buttons.first();
    const hotspot = listPlaces[0]!;
    expect(hotspot.href, "the first place needs a Visit link, or focus cannot move into its card").toBeTruthy();
    await first.focus();
    await expect(first).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Enter");
    await expect(first).toHaveAttribute("aria-expanded", "true");
    const card = page.locator(`#${await first.getAttribute("aria-controls")}`);
    const visit = card.getByRole("link", { name: "Visit" });
    await expect(card).toBeVisible();
    await expect(card).toContainText(hotspot.label);
    await expect(card).toContainText(hotspot.line);
    await expect(visit).toHaveAttribute("href", hotspot.href!);
    const cardBox = await card.boundingBox();
    const frameBox = await frame3d.boundingBox();
    expect(cardBox!.x).toBeGreaterThanOrEqual(frameBox!.x - 0.5);
    expect(cardBox!.x + cardBox!.width).toBeLessThanOrEqual(frameBox!.x + frameBox!.width + 0.5);
    expect(cardBox!.y).toBeGreaterThanOrEqual(frameBox!.y - 0.5);
    expect(cardBox!.y + cardBox!.height).toBeLessThanOrEqual(frameBox!.y + frameBox!.height + 0.5);

    /*
     * Escape returns focus only if focus has left the button, so it is moved
     * into the card first: the Visit link follows the button in the DOM. With
     * focus still on the button, "the button is focused afterwards" would pass
     * whether or not anything returned it.
     */
    await page.keyboard.press("Tab");
    await expect(visit, "Tab from an open place's button goes into its card").toBeFocused();
    await page.keyboard.press("Escape");
    await expect(first).toHaveAttribute("aria-expanded", "false");
    await expect(card).toBeHidden();
    await expect(first, "Escape from inside the card did not return focus to its button").toBeFocused();

    /* Focus leaving the place closes its card, so the next stop is never under it. */
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    await expect(visit).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(buttons.nth(1)).toBeFocused();
    await expect(first, "focus left the place and its card stayed open").toHaveAttribute("aria-expanded", "false");
    await expect(card).toBeHidden();

    /* Opening one closes any other. */
    await first.focus();
    await page.keyboard.press("Enter");
    await buttons.nth(1).click();
    await expect(buttons.nth(1)).toHaveAttribute("aria-expanded", "true");
    await expect(first).toHaveAttribute("aria-expanded", "false");
    await expect(frame3d.locator(".estate-map-3d-card:visible")).toHaveCount(1);
  });

  test("opening a place tints its massing in one re-render, and closing it restores the drawing", async ({ page }) => {
    /*
     * Renders are counted, not assumed. three.js clears the drawing buffer once
     * per render() (three.module.js, WebGLBackground.render), so each call to
     * the WebGL2 context's clear is one frame drawn. The pixel comparisons below
     * could not tell one re-render from an animation loop over a static scene.
     */
    await page.addInitScript(() => {
      const w = window as unknown as { __clears: number };
      w.__clears = 0;
      const clear = WebGL2RenderingContext.prototype.clear;
      WebGL2RenderingContext.prototype.clear = function (this: WebGL2RenderingContext, mask: number) {
        w.__clears++;
        return clear.call(this, mask);
      };
    });
    const clears = () => page.evaluate(() => (window as unknown as { __clears: number }).__clears);
    const frame3d = await openDiagram(page);
    await page.mouse.move(0, 0);
    expect(await clears(), "the counter saw no render at all: it is not counting").toBeGreaterThan(0);
    const idle = await clears();
    await page.waitForTimeout(1000);
    expect((await clears()) - idle, "the diagram drew frames while nothing changed: render on demand is broken").toBe(0);
    const canvas = frame3d.locator("canvas");
    /*
     * Only the canvas is compared, so everything the page draws over it is
     * hidden for the moment of each screenshot and shown again straight after
     * (a hidden button cannot be clicked): the buttons, leaders, note and card,
     * and the site's custom cursor, a dot that follows the mouse onto the button
     * and would otherwise read as a change in the drawing.
     */
    const OVER_CANVAS = ".estate-map-3d-place, .estate-map-3d-leaders, .estate-map-3d-note, .cursor { visibility: hidden !important; }";
    const shot = async () => {
      const hide = await page.addStyleTag({ content: OVER_CANVAS });
      const png = (await canvas.screenshot()).toString("base64");
      await hide.evaluate((n) => (n as HTMLStyleElement).remove());
      return png;
    };
    /*
     * The edges are 1 px antialiased lines, so no pixel reaches the pelagos
     * token itself; each blends it with the wall or ground beneath. What an
     * opened place does to a pixel is pull it toward pelagos: bluer against
     * red, and darker. Measured on this build: 624 pixels move that way when
     * Villa Thoi opens, and 0 between two shots of an unchanged diagram.
     */
    const compare = (fromPng: string, toPng: string) =>
      page.evaluate(
        async ([a, b]) => {
          const decode = async (b64: string) => {
            const img = new Image();
            img.src = `data:image/png;base64,${b64}`;
            await img.decode();
            const c = document.createElement("canvas");
            c.width = img.width;
            c.height = img.height;
            const ctx = c.getContext("2d", { willReadFrequently: true })!;
            ctx.drawImage(img, 0, 0);
            return ctx.getImageData(0, 0, c.width, c.height).data;
          };
          const [from, to] = await Promise.all([decode(a!), decode(b!)]);
          let towardPelagos = 0;
          let differing = 0;
          for (let i = 0; i < from.length; i += 4) {
            const cast = to[i + 2]! - to[i]! - (from[i + 2]! - from[i]!);
            if (cast >= 12 && from[i]! - to[i]! >= 12) towardPelagos++;
            if (from[i] !== to[i] || from[i + 1] !== to[i + 1] || from[i + 2] !== to[i + 2]) differing++;
          }
          return { towardPelagos, differing };
        },
        [fromPng, toPng]
      );

    const before = await shot();
    const again = await shot();
    expect((await compare(before, again)).differing, "two shots of an unchanged diagram differ: the comparison would prove nothing").toBe(0);

    const beforeOpen = await clears();
    await frame3d.locator(".estate-map-3d-button").first().click();
    await page.waitForTimeout(400);
    expect((await clears()) - beforeOpen, "opening a place did not draw exactly one frame").toBe(1);
    const opened = await shot();
    expect((await compare(before, opened)).towardPelagos, "opening Villa Thoi drew no pelagos edges").toBeGreaterThan(100);

    const beforeClose = await clears();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    expect((await clears()) - beforeClose, "closing a place did not draw exactly one frame").toBe(1);
    const closed = await shot();
    expect((await compare(before, closed)).differing, "closing the card did not restore the drawing").toBe(0);
  });

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });

    test("the list's places are numbered discs whose names carry the number; the extras keep their names; none overlaps, leaves the frame or covers the note", async ({ page }) => {
      const frame3d = await openDiagram(page);
      const buttons = frame3d.locator(".estate-map-3d-button");
      await expect(buttons).toHaveCount(EXPECTED_ORDER.length);

      for (const [i, h] of listPlaces.entries()) {
        const number = String(HOTSPOTS.indexOf(h) + 1).padStart(2, "0");
        await expect(buttons.nth(i).locator(".estate-map-3d-index")).toHaveText(number);
        /* WCAG 2.5.3: the number is the only text shown on the disc, so the name must contain it. */
        await expect(buttons.nth(i)).toHaveAccessibleName(`${number} ${h.label}`);
      }
      for (const [j, e] of extras.entries()) {
        await expect(buttons.nth(listPlaces.length + j)).toHaveAccessibleName(e.name);
      }

      const r = await measurePlaces(frame3d);
      expect(r.count).toBe(EXPECTED_ORDER.length);
      expect(r.overlaps, "places overlapping").toEqual([]);
      expect(r.outside, "places outside the frame").toEqual([]);
      expect(r.small, "places under 44 px").toEqual([]);
      expect(r.overNote, "places covering the note").toEqual([]);
      /* Only the list's places hide their names behind a number; a place with no number shows its name. */
      expect([...r.namesHidden].sort(), "names hidden at this width").toEqual(listPlaces.map((h) => h.label).sort());
    });

    test("a tap opens the card as a band that leaves its own disc in sight; a swipe keeps it; a tap outside closes; only the Visit link navigates; nothing depends on hover", async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const frame3d = await openDiagram(page);
      const frameBox = (await frame3d.boundingBox())!;
      const noteBox = (await frame3d.locator(".estate-map-3d-note").boundingBox())!;
      const noteFoot = noteBox.y + noteBox.height;
      const buttons = frame3d.locator(".estate-map-3d-button");
      await expect(buttons).toHaveCount(EXPECTED_ORDER.length);
      const listTop = (await page.locator(".estate-map-list").boundingBox())!.y;

      for (const [i, name] of EXPECTED_ORDER.entries()) {
        const b = buttons.nth(i);
        await b.tap();
        await expect(b, name).toHaveAttribute("aria-expanded", "true");
        expect(new URL(page.url()).pathname, `the first tap on ${name} navigated`).toBe(ROUTE);
        const id = await b.getAttribute("aria-controls");
        const card = page.locator(`#${id}`);
        await expect(card).toBeVisible();
        if (i < listPlaces.length) await expect(card).toContainText(listPlaces[i]!.line);

        const band = (await card.boundingBox())!;
        const own = (await b.boundingBox())!;
        expect(band.x, name).toBeGreaterThanOrEqual(frameBox.x - 0.5);
        expect(band.x + band.width, name).toBeLessThanOrEqual(frameBox.x + frameBox.width + 0.5);
        expect(band.y, name).toBeGreaterThanOrEqual(frameBox.y - 0.5);
        expect(band.y + band.height, name).toBeLessThanOrEqual(frameBox.y + frameBox.height + 0.5);
        const onBottom = Math.abs(band.y + band.height - (frameBox.y + frameBox.height)) <= 1;
        const onTop = Math.abs(band.y - noteFoot) <= 1;
        expect(onBottom || onTop, `${name}: the band is on neither the bottom edge nor the top edge under the note`).toBe(true);
        /* Whenever a band on one of the two edges would leave the disc clear, the band stands there. */
        const clearOfTop = own.y >= noteFoot + band.height - 0.5;
        const clearOfBottom = own.y + own.height <= frameBox.y + frameBox.height - band.height + 0.5;
        if (clearOfTop || clearOfBottom) expect(intersects(band, own), `${name}: the band covers the disc that opened it`).toBe(false);
        /* And the open disc is always what a finger at its centre hits, so it can be seen and tapped again. */
        const chip = (await b.locator(".estate-map-3d-chip").boundingBox())!;
        const hit = await page.evaluate(
          ([x, y]) => document.elementFromPoint(x!, y!)?.closest(".estate-map-3d-button")?.getAttribute("aria-controls") ?? null,
          [chip.x + chip.width / 2, chip.y + chip.height / 2]
        );
        expect(hit, `${name}: the open disc is hidden under its band`).toBe(id);
        expect((await page.locator(".estate-map-list").boundingBox())!.y, "opening a card moved the list").toBe(listTop);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

        /* A second tap on the open disc closes it. */
        await b.tap();
        await expect(b, `${name}: a second tap did not close its card`).toHaveAttribute("aria-expanded", "false");
      }

      /* A tap outside closes. */
      const first = buttons.first();
      const hotspot = listPlaces[0]!;
      await first.tap();
      await expect(first).toHaveAttribute("aria-expanded", "true");
      await page.locator(".estate-map-list-index").first().tap();
      await expect(first).toHaveAttribute("aria-expanded", "false");

      /* No hover-only affordance: every estate-map-3d :hover rule the page was served sits inside (hover: hover) and (pointer: fine). */
      const hover = await page.evaluate(() => {
        const bad: string[] = [];
        let count = 0;
        const walk = (rules: CSSRuleList, media: string[]) => {
          for (const r of Array.from(rules)) {
            if (r instanceof CSSMediaRule) walk(r.cssRules, [...media, r.conditionText]);
            else if (r instanceof CSSStyleRule) {
              if (r.selectorText.includes("estate-map-3d") && r.selectorText.includes(":hover")) {
                count++;
                if (!media.some((m) => /hover:\s*hover/.test(m) && /pointer:\s*fine/.test(m))) bad.push(`${r.selectorText} @ ${media.join(" & ") || "no media"}`);
              }
            } else if ("cssRules" in r) walk((r as CSSGroupingRule).cssRules, media);
          }
        };
        for (const s of Array.from(document.styleSheets)) {
          try {
            walk(s.cssRules, []);
          } catch {
            /* a cross-origin sheet: this site serves none */
          }
        }
        return { bad, count };
      });
      expect(hover.count, "the walker saw none of the served estate-map-3d :hover rules: it inspected nothing").toBeGreaterThan(0);
      expect(hover.bad).toEqual([]);

      /* The Visit link is what navigates. */
      expect(hotspot.href).toBeTruthy();
      await first.tap();
      const card = page.locator(`#${await first.getAttribute("aria-controls")}`);
      await expect(card).toBeVisible();
      await card.getByRole("link", { name: "Visit" }).tap();
      await page.waitForURL(`**${hotspot.href}`);
      expect(errors).toEqual([]);
    });

    /*
     * On its own page, and last: after a synthetic CDP swipe, Chromium drops
     * the click of the next synthetic tap (pointerdown, pointerup and touchend
     * arrive; click does not), so nothing that needs a tap to click can follow
     * it in the same page.
     */
    test("a swipe that begins outside the place is a scroll, not a tap, and its card stays open", async ({ page }) => {
      const frame3d = await openDiagram(page);
      const frameBox = (await frame3d.boundingBox())!;
      const first = frame3d.locator(".estate-map-3d-button").first();
      await first.tap();
      await expect(first).toHaveAttribute("aria-expanded", "true");

      /* A touch lands as a pointerdown before the browser knows it is a scroll, which is why closing on pointerdown was wrong. */
      const viewport = page.viewportSize()!;
      const startY = frameBox.y + frameBox.height + 40 <= viewport.height - 20 ? frameBox.y + frameBox.height + 40 : frameBox.y - 40;
      const startX = viewport.width / 2;
      const direction = startY > viewport.height / 2 ? -1 : 1;
      const scrollBefore = await page.evaluate(() => window.scrollY);
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: startX, y: startY }] });
      for (let k = 1; k <= 8; k++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: startX, y: startY + direction * k * 20 }] });
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await page.waitForTimeout(500);
      expect(await page.evaluate(() => window.scrollY), "the swipe did not scroll the page: it proved nothing").not.toBe(scrollBefore);
      await expect(first, "a swipe that began outside the place closed the card").toHaveAttribute("aria-expanded", "true");
    });
  });

  for (const [w, h] of [
    [768, 1024],
    [1024, 768],
    [1440, 900],
    [1920, 1080],
  ] as const) {
    test(`at ${w} px no two places overlap, none leaves the frame, and none covers the note`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      const frame3d = await openDiagram(page);
      const r = await measurePlaces(frame3d);
      expect(r.count).toBe(EXPECTED_ORDER.length);
      expect(r.overlaps, "places overlapping").toEqual([]);
      expect(r.outside, "places outside the frame").toEqual([]);
      expect(r.small, "places under 44 px").toEqual([]);
      expect(r.overNote, "places covering the note").toEqual([]);
      expect(r.namesHidden, "names not visible at this width").toEqual([]);
    });

    test(`at ${w} px an open card hides no other place, and keyboard focus never lands under a card`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      const frame3d = await openDiagram(page);
      const buttons = frame3d.locator(".estate-map-3d-button");
      await expect(buttons).toHaveCount(EXPECTED_ORDER.length);

      /* Pointer: each place opened in turn; no other place's visible label may be under its card. */
      const hidden: string[] = [];
      for (const [i, name] of EXPECTED_ORDER.entries()) {
        await buttons.nth(i).click();
        await expect(buttons.nth(i), name).toHaveAttribute("aria-expanded", "true");
        const under = await frame3d.evaluate((el, open) => {
          const card = [...el.querySelectorAll<HTMLElement>(".estate-map-3d-card")].find((c) => !c.hidden)!.getBoundingClientRect();
          const hit = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
          return [...el.querySelectorAll<HTMLElement>(".estate-map-3d-button")]
            .filter((b, j) => j !== open && hit(b.querySelector(".estate-map-3d-chip")!.getBoundingClientRect(), card))
            .map((b) => b.querySelector(".estate-map-3d-name")?.textContent ?? "");
        }, i);
        for (const u of under) hidden.push(`${name}'s card over ${u}`);
        await page.keyboard.press("Escape");
        await expect(buttons.nth(i)).toHaveAttribute("aria-expanded", "false");
      }
      expect(hidden, "open cards covering other places").toEqual([]);

      /* Keyboard (WCAG 2.4.11): from each open place, three Tabs and three Shift+Tabs; no focused place may be under a card. */
      const obscured: string[] = [];
      for (const [i, name] of EXPECTED_ORDER.entries()) {
        for (const key of ["Tab", "Shift+Tab"]) {
          await buttons.nth(i).focus();
          await page.keyboard.press("Enter");
          await expect(buttons.nth(i), name).toHaveAttribute("aria-expanded", "true");
          for (let step = 1; step <= 3; step++) {
            await page.keyboard.press(key);
            const bad = await page.evaluate(() => {
              const a = document.activeElement;
              if (!(a instanceof HTMLElement) || !a.classList.contains("estate-map-3d-button")) return null;
              const r = a.getBoundingClientRect();
              const covered = [...document.querySelectorAll<HTMLElement>(".estate-map-3d-card")]
                .filter((c) => !c.hidden)
                .some((c) => {
                  const k = c.getBoundingClientRect();
                  return r.left < k.right && k.left < r.right && r.top < k.bottom && k.top < r.bottom;
                });
              return covered ? (a.querySelector(".estate-map-3d-name")?.textContent ?? "") : null;
            });
            if (bad) obscured.push(`${key} ×${step} from ${name}: ${bad} is under a card`);
          }
          await page.keyboard.press("Escape");
        }
      }
      expect(obscured, "focused places under an open card").toEqual([]);
    });
  }

  test("the ground renders the limestone token, within ±3 per channel", async ({ page }) => {
    const frame3d = await openDiagram(page);
    await page.mouse.move(0, 0);
    const png = (await frame3d.locator("canvas").screenshot()).toString("base64");
    const token = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--color-limestone").trim());
    const modal = await page.evaluate(async (b64) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      const counts = new Map<number, number>();
      for (let i = 0; i < d.length; i += 4) {
        const k = (d[i]! << 16) | (d[i + 1]! << 8) | d[i + 2]!;
        counts.set(k, (counts.get(k) ?? 0) + 1);
      }
      const [k, n] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]!;
      return { rgb: [(k >> 16) & 255, (k >> 8) & 255, k & 255], share: n / (d.length / 4) };
    }, png);
    const want = [1, 3, 5].map((i) => parseInt(token.slice(i, i + 2), 16));
    /* The ground is the largest single colour in the frame; step A's rig rendered it at #D9DBD4. */
    expect(modal.share, "the modal colour is not the ground").toBeGreaterThan(0.15);
    for (const [i, c] of modal.rgb.entries()) expect(Math.abs(c - want[i]!), `channel ${i}: ${modal.rgb} vs ${token}`).toBeLessThanOrEqual(3);
  });

  test("reduced motion turned on after the diagram mounts: the 2D map, for good, focus kept on the same place, with no errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const frame3d = await openDiagram(page);
    /* A keyboard reader on the first place when the preference changes. */
    await frame3d.locator(".estate-map-3d-button").first().focus();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator(".estate-map-frame--3d")).toHaveCount(0);
    await expect(page.locator("section.estate-map canvas")).toHaveCount(0);
    await expect(page.locator(".estate-map-frame .estate-map-marker").first()).toBeAttached();
    /* The focused button was removed with the diagram; focus goes to the same place's 2D marker, not to the body. */
    await expect(page.locator(`.estate-map-marker[aria-controls="spot-${listPlaces[0]!.id}"]`)).toBeFocused();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.waitForTimeout(1500);
    await expect(page.locator(".estate-map-frame--3d"), "the diagram came back").toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("reduced motion turned on before the map is in range: the 2D map, and three.js is never fetched", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const threeFetched = await recordThree(page);
    await page.goto(ROUTE);
    /*
     * The preconditions that make a pass mean something. The map must start
     * well outside the gate's 600 px range, or the chunk is requested before the
     * preference changes. And the page must be hydrated, so the preference
     * changes after the gate's effect has run and is caught by its listener
     * rather than read at mount (React tags the nodes it has hydrated).
     */
    const distance = await page.evaluate(() => document.querySelector("section.estate-map")!.getBoundingClientRect().top - window.innerHeight);
    expect(distance, "the map starts within the gate's range; this test would prove nothing").toBeGreaterThan(900);
    await expect
      .poll(() => page.evaluate(() => Object.keys(document.querySelector("section.estate-map")!).some((k) => k.startsWith("__reactFiber"))))
      .toBe(true);
    await page.waitForTimeout(500);
    expect(threeFetched).toEqual([]);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await scrollToMap(page);
    await page.waitForTimeout(1500);
    await expect(page.locator(".estate-map-frame--3d")).toHaveCount(0);
    await expect(page.locator(".estate-map-frame .estate-map-marker").first()).toBeAttached();
    expect(threeFetched, "the observer outlived the preference and fetched three.js anyway").toEqual([]);
    expect(errors).toEqual([]);
  });

  test("no WebGL: the 2D map, and three.js is never fetched", async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
        configurable: true,
        value: function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
          if (type === "webgl2" || type === "webgl" || type === "experimental-webgl") return null;
          return (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
        },
      });
    });
    const threeFetched = await recordThree(page);
    await page.goto(ROUTE);
    await scrollToMap(page);
    await page.waitForTimeout(1500);
    await expect(page.locator(".estate-map-frame--3d")).toHaveCount(0);
    await expect(page.locator(".estate-map-frame .estate-map-marker").first()).toBeAttached();
    expect(threeFetched).toEqual([]);
  });

  test("data saver: the 2D map, and three.js is never fetched", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "connection", { configurable: true, value: { saveData: true, effectiveType: "4g" } });
    });
    const threeFetched = await recordThree(page);
    await page.goto(ROUTE);
    await scrollToMap(page);
    await page.waitForTimeout(1500);
    await expect(page.locator(".estate-map-frame--3d")).toHaveCount(0);
    await expect(page.locator(".estate-map-frame .estate-map-marker").first()).toBeAttached();
    expect(threeFetched).toEqual([]);
  });

  test.describe("under reduced motion", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });
    test("the 2D map stays, and three.js is never fetched", async ({ page }) => {
      const threeFetched = await recordThree(page);
      await page.goto(ROUTE);
      await scrollToMap(page);
      await page.waitForTimeout(1500);
      await expect(page.locator(".estate-map-frame--3d")).toHaveCount(0);
      await expect(page.locator(".estate-map-frame .estate-map-marker").first()).toBeAttached();
      expect(threeFetched).toEqual([]);
    });
  });
});
