import fs from "node:fs";
import path from "node:path";

import { test, expect, type CDPSession, type Locator, type Page } from "@playwright/test";

import { HOTSPOTS } from "../src/app/home-data";
import type { EstatePlan } from "../src/lib/estate-plan-gate";
import { ESTATE3D_MARK, ESTATE3D_MARK_ORDER, ESTATE3D_MARK_PREFIX, WINDOW_ANCHOR } from "../src/components/sections/estate-map-3d-marks";

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
 *
 * And how it arrives (D-028: "defer the three.js load until idle and after first
 * interaction, split the first-frame work into yielding tasks"):
 *  - nothing is fetched until the reader has tapped, clicked or pressed a key,
 *    AND the map is within range; scrolling, the wheel and a touch swipe are
 *    not interactions;
 *  - the fetch waits for a quiet period and an idle moment after both;
 *  - the diagram is built hidden, and the 2D frame stays on screen until the
 *    diagram is drawn and placed; the swap moves nothing and waits while the
 *    reader is using the 2D map;
 *  - a failure, reduced motion or leaving the page while it is being built
 *    leaves the 2D map, with no errors.
 * So every test that expects the diagram sends that first interaction, and
 * every test that expects none sends it too: "never fetched" means nothing
 * when nothing asked for it.
 */

const ROUTE = "/en/the-estate";
const plan = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content", "estate-plan.json"), "utf-8")) as EstatePlan;
const drawn = plan.elements.filter((e) => e.position !== null);
const drawnIds = new Set(drawn.map((e) => e.id));
const unplaced = plan.elements.filter((e) => e.position === null);

/*
 * The loader's waits, read from its source so the waits here follow them. A
 * missing constant fails here rather than leaving a wait of zero.
 */
const GATE_SOURCE = fs.readFileSync(path.join(process.cwd(), "src", "components", "sections", "estate-map-3d-gate.ts"), "utf-8");
const gateConstant = (name: string) => {
  const m = new RegExp(`export const ${name} = (\\d+);`).exec(GATE_SOURCE);
  if (!m) throw new Error(`estate-map-3d-gate.ts no longer declares ${name}; this spec's waits must be decided again`);
  return Number(m[1]);
};
const QUIET_MS = gateConstant("QUIET_MS");
/** After the last activity: the quiet period, the idle timeout, and 3 s for a request to be made. */
const LOAD_ALLOWANCE_MS = QUIET_MS + gateConstant("IDLE_TIMEOUT_MS") + 3000;
/** From a trigger to the swap: the same wait, plus the fetch and the build on a loaded machine. */
const READY_TIMEOUT = 30_000;
/*
 * THE FLOOR ON HOW MANY TASKS A LAYOUT IS SPLIT INTO, counted at the page's own
 * yield (a posted message — see `slowYields`). Measured on this build: twelve
 * tasks for the build's own label search and thirteen for a layout that answers
 * a resize, against two when the search is put back into one task.
 *
 * WHY NOT WALL CLOCK. A chain of yields is reported by Chrome as ONE `longtask`
 * entry (measured on this build: a 191–200 ms "long task" spanning 13 separate
 * yielded steps), so that instrument cannot tell a split layout from a single
 * task. What can be measured exactly is the split itself.
 *
 * AND WHY THE SPLIT IS NOT THE WHOLE STORY. Splitting only helps if the browser
 * lets input in BETWEEN the steps, and that depends on how the page yields, not
 * on how finely it splits: with `scheduler.yield()` a tap at the start of this
 * same, equally split phase waited 241 ms, because its continuations keep the
 * caller's priority and outrank a pending input. `src/lib/schedule.ts` carries
 * the measurement and yields through a posted message instead, which brought
 * the same tap to 20 ms. So this count is necessary and not sufficient, and the
 * INP record (D-033) is what says the tap is actually served.
 */
const SPLIT_TASKS_MIN = 8;

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

/** Uncaught exceptions and console errors, both of which "no errors" rules out. */
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
  });
  return errors;
}

/**
 * The page hydrated and its effects run, so the loader is listening before a
 * test interacts: React tags the nodes it hydrates, and an idle callback comes
 * after the tasks that run the effects.
 */
async function hydrated(page: Page) {
  await expect
    .poll(() => page.evaluate(() => Object.keys(document.querySelector("section.estate-map") ?? {}).some((k) => k.startsWith("__reactFiber"))))
    .toBe(true);
  await page.evaluate(() => new Promise<void>((resolve) => requestIdleCallback(() => resolve(), { timeout: 2000 })));
}

async function scrollToMap(page: Page) {
  await hydrated(page);
  await page.locator("section.estate-map").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
}

const stage = (page: Page) => page.locator(".estate-map-stage");

/** The page's `estate3d:*` marks, by phase, in ms since navigation. */
const phaseMarks = (page: Page) =>
  page.evaluate(() =>
    Object.fromEntries(
      performance
        .getEntriesByType("mark")
        .filter((m) => m.name.startsWith("estate3d:"))
        .map((m) => [m.name.slice("estate3d:".length), m.startTime])
    )
  ) as Promise<Record<string, number>>;

/**
 * The reader's first interaction: a click, or a tap on a touch screen, on a
 * list number, which does nothing else (it is not a link and not in the frame).
 */
async function sendTrigger(page: Page) {
  const target = page.locator(".estate-map-list-index").first();
  const url = page.url();
  /*
   * Everything the build yields through is made after this point, so a
   * `slowYields` installed for this page slows the build's own channel and not
   * React's (see `slowYields`). Harmless when it was not installed.
   */
  await page.evaluate(() => {
    (window as unknown as { __yieldSlow?: boolean }).__yieldSlow = true;
  });
  if (await page.evaluate(() => navigator.maxTouchPoints > 0)) await target.tap();
  else await target.click();
  expect(page.url(), "the trigger navigated").toBe(url);
}

/** The diagram, swapped in and laid out (its buttons measured and placed). */
async function openDiagram(page: Page): Promise<Locator> {
  await page.goto(ROUTE);
  await scrollToMap(page);
  await sendTrigger(page);
  await expect(stage(page)).toHaveAttribute("data-state", "ready", { timeout: READY_TIMEOUT });
  const frame3d = page.locator(".estate-map-frame--3d[data-placed]");
  await expect(frame3d).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  return frame3d;
}

/**
 * Counts the page's yields, and slows them by `ms` so the diagram's build (a
 * chain of yields) lasts long enough for something to happen in the middle of
 * it.
 *
 * IT INSTRUMENTS `MessageChannel`, NOT `scheduler.yield()`. `yieldToMain`
 * posts a message and never calls `scheduler.yield()` — deliberately, because a
 * continuation resumed by that keeps the caller's priority and outranks a
 * pending input (`src/lib/schedule.ts` carries the measurement: 241 ms of input
 * delay against 20 ms). Instrumenting the function the page stopped calling
 * would have left every test below counting zero yields and asserting nothing.
 *
 * REACT'S SCHEDULER ALSO USES A MessageChannel, so posts are recorded per
 * channel and the caller takes the busiest one: `src/lib/schedule.ts` makes its
 * channel lazily, at the first yield of the build, which is after the trigger,
 * and `sendTrigger` raises `__yieldSlow` just before it — so only the build's
 * channel is slowed, and React's hydration is left at full speed.
 */
async function slowYields(page: Page, ms = 150) {
  await page.addInitScript((delay) => {
    const w = window as unknown as { __yields: { id: number; t: number }[]; __yieldSlow: boolean };
    w.__yields = [];
    w.__yieldSlow = false;
    const Real = window.MessageChannel;
    let next = 0;
    class Counted extends Real {
      constructor() {
        super();
        const id = next++;
        /* Read at construction: channels made before the trigger are React's, and are not slowed. */
        const slow = w.__yieldSlow;
        const port = this.port2;
        const real = port.postMessage.bind(port);
        port.postMessage = ((...args: [unknown]) => {
          w.__yields.push({ id, t: performance.now() });
          if (slow && delay > 0) {
            window.setTimeout(() => real(...args), delay);
            return;
          }
          real(...args);
        }) as typeof port.postMessage;
      }
    }
    window.MessageChannel = Counted;
  }, ms);
}

/** Posts in `[after, until]` on the single busiest channel — the build's, not React's. */
function yieldsBetween(yields: { id: number; t: number }[], after: number, until: number): number {
  const counts = new Map<number, number>();
  for (const y of yields) if (y.t > after && y.t <= until) counts.set(y.id, (counts.get(y.id) ?? 0) + 1);
  return counts.size ? Math.max(...counts.values()) : 0;
}

type EventCounts = Record<"pointerdown" | "pointerup" | "pointercancel" | "keydown" | "scroll" | "wheel" | "touchmove" | "click", number>;

/** Counts of the events the loader listens for, from the page's own listeners. */
async function countEvents(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __events: Record<string, number> };
    w.__events = { pointerdown: 0, pointerup: 0, pointercancel: 0, keydown: 0, scroll: 0, wheel: 0, touchmove: 0, click: 0 };
    for (const t of Object.keys(w.__events)) window.addEventListener(t, () => w.__events[t]!++, { capture: true, passive: true });
  });
  return () => page.evaluate(() => (window as unknown as { __events: EventCounts }).__events);
}

/** A touch swipe by CDP: a scroll, which ends in pointercancel and never in pointerup. */
async function swipe(cdp: CDPSession, x: number, y: number, dy: number) {
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let k = 1; k <= 8; k++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y + (dy * k) / 8 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

const inRange = (page: Page) =>
  page.evaluate(() => {
    const r = document.querySelector("section.estate-map")!.getBoundingClientRect();
    return r.top < window.innerHeight + 600 && r.bottom > -600;
  });

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
    await expect(stage(page), "the diagram came before any interaction").toHaveAttribute("data-state", "2d");
    await sendTrigger(page);
    const frame3d = page.locator(".estate-map-frame--3d");
    await expect(frame3d).toBeVisible({ timeout: READY_TIMEOUT });
    await expect(stage(page)).toHaveAttribute("data-state", "ready");
    await expect(frame3d.locator("canvas.estate-map-3d-canvas")).toHaveCount(1);
    await expect(page.locator(".estate-map-frame--preview")).toHaveCount(1);
    /* The 2D frame has gone: the diagram is the only frame in the stage, and it is not hidden from anyone. */
    await expect(page.locator(".estate-map-stage > .estate-map-frame")).toHaveCount(1);
    await expect(frame3d).not.toHaveAttribute("inert", /.*/);
    await expect(frame3d).not.toHaveAttribute("aria-hidden", /.*/);

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
     * rather than read at mount (React tags the nodes it has hydrated). The
     * reader has already interacted (a key press), so the range is all the
     * loader still waits for.
     */
    const distance = await page.evaluate(() => document.querySelector("section.estate-map")!.getBoundingClientRect().top - window.innerHeight);
    expect(distance, "the map starts within the gate's range; this test would prove nothing").toBeGreaterThan(900);
    await expect
      .poll(() => page.evaluate(() => Object.keys(document.querySelector("section.estate-map")!).some((k) => k.startsWith("__reactFiber"))))
      .toBe(true);
    /* Hydration tags the nodes before the loader's effect has run, so the key is pressed until the loader has heard it. */
    await expect
      .poll(
        async () => {
          await page.keyboard.press("Shift");
          return Object.keys(await phaseMarks(page));
        },
        { message: "the key press did not reach the loader" }
      )
      .toEqual(["trigger"]);
    await page.waitForTimeout(500);
    expect(threeFetched).toEqual([]);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await scrollToMap(page);
    await sendTrigger(page);
    await page.waitForTimeout(LOAD_ALLOWANCE_MS);
    await expect(page.locator(".estate-map-frame--3d")).toHaveCount(0);
    await expect(page.locator(".estate-map-frame .estate-map-marker").first()).toBeAttached();
    await expect(stage(page)).toHaveAttribute("data-state", "failed");
    expect(threeFetched, "the loader outlived the preference and fetched three.js anyway").toEqual([]);
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
    await sendTrigger(page);
    await page.waitForTimeout(LOAD_ALLOWANCE_MS);
    await expect(page.locator(".estate-map-frame--3d")).toHaveCount(0);
    await expect(page.locator(".estate-map-frame .estate-map-marker").first()).toBeAttached();
    /* The loader got as far as the probe, which is what kept three.js away. */
    expect(Object.keys(await phaseMarks(page)), "the loader never reached the probe; this test proved nothing").toEqual(["trigger", "idle", "probe"]);
    await expect(stage(page)).toHaveAttribute("data-state", "failed");
    expect(threeFetched).toEqual([]);
  });

  test("data saver: the 2D map, and three.js is never fetched", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "connection", { configurable: true, value: { saveData: true, effectiveType: "4g" } });
    });
    const threeFetched = await recordThree(page);
    await page.goto(ROUTE);
    await scrollToMap(page);
    await sendTrigger(page);
    await page.waitForTimeout(LOAD_ALLOWANCE_MS);
    await expect(page.locator(".estate-map-frame--3d")).toHaveCount(0);
    await expect(page.locator(".estate-map-frame .estate-map-marker").first()).toBeAttached();
    await expect(stage(page), "the stage (and so a plan) must be there, or this proves nothing").toHaveAttribute("data-state", "2d");
    expect(threeFetched).toEqual([]);
  });

  test.describe("under reduced motion", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });
    test("the 2D map stays, and three.js is never fetched", async ({ page }) => {
      const threeFetched = await recordThree(page);
      await page.goto(ROUTE);
      await scrollToMap(page);
      await sendTrigger(page);
      await page.keyboard.press("Shift");
      await page.waitForTimeout(LOAD_ALLOWANCE_MS);
      await expect(page.locator(".estate-map-frame--3d")).toHaveCount(0);
      await expect(page.locator(".estate-map-frame .estate-map-marker").first()).toBeAttached();
      await expect(stage(page), "the stage (and so a plan) must be there, or this proves nothing").toHaveAttribute("data-state", "2d");
      expect(threeFetched).toEqual([]);
    });
  });
});

test.describe("3D estate map — when it loads, and how it is swapped in (D-028)", () => {
  test("scrolling and the wheel are not an interaction: nothing is fetched or mounted for 10 s; a click then loads the diagram", async ({ page }) => {
    test.setTimeout(120_000);
    const errors = watchErrors(page);
    const events = await countEvents(page);
    const threeFetched = await recordThree(page);
    await page.goto(ROUTE);
    await scrollToMap(page);
    await expect(stage(page)).toHaveAttribute("data-state", "2d");

    /* Ten seconds of reading by scrolling: the wheel, over and around the map, and the page scrolled to it by script. */
    const started = Date.now();
    for (let k = 0; Date.now() - started < 10_000; k++) {
      await page.mouse.wheel(0, k % 2 ? -280 : 320);
      await page.waitForTimeout(600);
      if (k % 4 === 3) await scrollToMap(page);
    }
    await scrollToMap(page);
    expect(await inRange(page), "the map was not in range: this proved nothing").toBe(true);
    await page.waitForTimeout(LOAD_ALLOWANCE_MS);

    const seen = await events();
    expect(seen.wheel, "no wheel event reached the page").toBeGreaterThan(5);
    expect(seen.scroll, "the page never scrolled").toBeGreaterThan(5);
    expect(seen.pointerup + seen.keydown, "the page saw an interaction; the test is not what it says").toBe(0);
    expect(threeFetched, "three.js was fetched with no interaction").toEqual([]);
    expect(await phaseMarks(page), "the loader started with no interaction").toEqual({});
    await expect(stage(page)).toHaveAttribute("data-state", "2d");
    await expect(page.locator(".estate-map-frame--3d")).toHaveCount(0);

    /* The positive control: the same page, one click, and the diagram arrives. */
    await sendTrigger(page);
    await expect(stage(page)).toHaveAttribute("data-state", "ready", { timeout: READY_TIMEOUT });
    expect(threeFetched, "the click did not load three.js: the 10 s above proved nothing").toHaveLength(1);
    expect(errors).toEqual([]);
  });

  test("an interaction before the map is in range fetches nothing until it is in range", async ({ page }) => {
    test.setTimeout(90_000);
    const errors = watchErrors(page);
    const threeFetched = await recordThree(page);
    await page.goto(ROUTE);
    const distance = await page.evaluate(() => document.querySelector("section.estate-map")!.getBoundingClientRect().top - window.innerHeight);
    expect(distance, "the map starts within range; this test would prove nothing").toBeGreaterThan(900);
    await expect
      .poll(() => page.evaluate(() => Object.keys(document.querySelector("section.estate-map")!).some((k) => k.startsWith("__reactFiber"))))
      .toBe(true);

    /* A click on the page's first heading and a key press, far above the map (pressed until the loader has heard it). */
    await page.locator("h1").first().click();
    await expect
      .poll(async () => {
        await page.keyboard.press("Shift");
        return Object.keys(await phaseMarks(page));
      })
      .toContain("trigger");
    await page.waitForTimeout(LOAD_ALLOWANCE_MS);
    expect(await inRange(page), "the map came into range by itself").toBe(false);
    expect(Object.keys(await phaseMarks(page)), "the interaction did not reach the loader, or the loader did not wait for range").toEqual(["trigger"]);
    expect(threeFetched, "three.js was fetched before the map was in range").toEqual([]);
    await expect(stage(page)).toHaveAttribute("data-state", "2d");

    const reachedAt = await page.evaluate(() => performance.now());
    await scrollToMap(page);
    await expect(stage(page)).toHaveAttribute("data-state", "ready", { timeout: READY_TIMEOUT });
    const m = await phaseMarks(page);
    expect(m["import-start"]!, "the fetch did not follow the range").toBeGreaterThan(reachedAt);
    expect(m.idle! - reachedAt, "the loader did not wait a quiet period after the map came into range").toBeGreaterThanOrEqual(QUIET_MS);
    expect(threeFetched).toHaveLength(1);
    expect(errors).toEqual([]);
  });

  test("the fetch waits for a quiet period after the reader's last activity, and the build's phases run in order", async ({ page }) => {
    test.setTimeout(90_000);
    const errors = watchErrors(page);
    await page.addInitScript(() => {
      const w = window as unknown as { __activity: number[] };
      w.__activity = [];
      for (const t of ["pointerdown", "keydown", "wheel", "touchmove", "scroll"]) {
        window.addEventListener(t, () => w.__activity.push(performance.now()), { capture: true, passive: true });
      }
    });
    await page.goto(ROUTE);
    await scrollToMap(page);
    await sendTrigger(page);
    /* Busy for three seconds after the trigger: a small wheel movement every quarter second. */
    for (let k = 0; k < 12; k++) {
      await page.mouse.wheel(0, k % 2 ? -60 : 60);
      await page.waitForTimeout(250);
    }
    const busyEnded = await page.evaluate(() => performance.now());
    await expect(stage(page)).toHaveAttribute("data-state", "ready", { timeout: READY_TIMEOUT });

    const m = await phaseMarks(page);
    const activity = await page.evaluate(() => (window as unknown as { __activity: number[] }).__activity);
    expect(activity.filter((t) => t > m.trigger!).length, "the busy period left no activity after the trigger").toBeGreaterThan(8);
    const lastBefore = Math.max(...activity.filter((t) => t < m.idle!));
    expect(m.idle! - lastBefore, "the loader went idle less than a quiet period after the last activity").toBeGreaterThanOrEqual(QUIET_MS);
    expect(m.idle!, "the loader went idle while the reader was still busy").toBeGreaterThan(busyEnded);

    /*
     * THE ORDER COMES FROM THE ONE PLACE THE NAMES DO
     * (src/components/sections/estate-map-3d-marks.ts), and this is the test
     * that keeps the page and the INP harness agreeing about them: the harness
     * anchors its eight window families on six of these marks, so a name the
     * page stops emitting must turn something red here rather than leave the
     * harness waiting for an anchor that never comes.
     */
    const order = ESTATE3D_MARK_ORDER.map((phase) => ESTATE3D_MARK[phase].slice(ESTATE3D_MARK_PREFIX.length));
    for (const name of order) expect(m[name], `no ${ESTATE3D_MARK_PREFIX}${name} mark`).toBeDefined();
    for (const [family, anchor] of Object.entries(WINDOW_ANCHOR)) {
      if (anchor === null) continue;
      expect(m[anchor.slice(ESTATE3D_MARK_PREFIX.length)], `the INP harness anchors its ${family} window family on ${anchor}, which this page did not emit`).toBeDefined();
    }
    for (let i = 1; i < order.length; i++) {
      expect(m[order[i]!]!, `${ESTATE3D_MARK_PREFIX}${order[i]} came before ${ESTATE3D_MARK_PREFIX}${order[i - 1]}`).toBeGreaterThanOrEqual(m[order[i - 1]!]!);
    }
    expect(errors).toEqual([]);
  });

  test("the 2D frame stays on screen until the diagram is drawn and placed, and they change places in one frame", async ({ page }) => {
    test.setTimeout(90_000);
    const errors = watchErrors(page);
    /*
     * The yields are slowed so the ORDER is observable. This is a test of order,
     * not of speed: on an unthrottled desktop the whole build takes about 50 ms
     * (renderer to swap), and a headless browser produces frames on demand, so a
     * rAF sampler is not guaranteed to tick inside a window that short — the
     * sampler then never sees the diagram being prepared and the check passes
     * for the wrong reason, or fails for one. Slowed, the preparation spans
     * seconds and every frame in it must show the 2D map. The swap itself is one
     * task and is not slowed, so "they change places in one frame" still means
     * between two consecutive samples. `the swap shifts nothing` runs the same
     * swap at full speed.
     */
    await slowYields(page);
    await page.addInitScript(() => {
      type Sample = { t: number; state: string | null; twoD: boolean; threeD: boolean; staged: boolean; placed: boolean; clears: number };
      const w = window as unknown as { __clears: number; __samples: Sample[] };
      w.__clears = 0;
      w.__samples = [];
      const clear = WebGL2RenderingContext.prototype.clear;
      WebGL2RenderingContext.prototype.clear = function (this: WebGL2RenderingContext, mask: number) {
        w.__clears++;
        return clear.call(this, mask);
      };
      const shows = (el: Element | null) => {
        if (!el) return false;
        const s = getComputedStyle(el);
        return s.display !== "none" && s.visibility === "visible";
      };
      const sample = () => {
        const box = document.querySelector(".estate-map-stage");
        if (box) {
          const two = box.querySelector(":scope > .estate-map-frame:not(.estate-map-frame--3d)");
          const three = box.querySelector(":scope > .estate-map-frame--3d");
          w.__samples.push({
            t: performance.now(),
            state: box.getAttribute("data-state"),
            twoD: shows(two),
            threeD: shows(three),
            staged: !!three && !shows(three),
            placed: three?.getAttribute("data-placed") === "true",
            clears: w.__clears,
          });
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.goto(ROUTE);
    await scrollToMap(page);
    await sendTrigger(page);
    await expect(stage(page)).toHaveAttribute("data-state", "ready", { timeout: READY_TIMEOUT });
    await page.waitForTimeout(500);
    const samples = await page.evaluate(
      () => (window as unknown as { __samples: { t: number; state: string | null; twoD: boolean; threeD: boolean; staged: boolean; placed: boolean; clears: number }[] }).__samples
    );

    expect(samples.length, "the sampler barely ran").toBeGreaterThan(30);
    const prepared = samples.filter((s) => s.staged && s.twoD);
    expect(prepared.length, "the sampler never saw the diagram being prepared behind the 2D frame").toBeGreaterThan(0);
    const empty = samples.filter((s) => !s.twoD && !s.threeD);
    expect(empty, "a frame showed neither map").toEqual([]);
    const both = samples.filter((s) => s.twoD && s.threeD);
    expect(both, "a frame showed both maps").toEqual([]);
    const early = samples.filter((s) => s.threeD && (!s.placed || s.clears === 0));
    expect(early, "the diagram was shown before it was drawn and placed").toEqual([]);
    /*
     * Last, because it is about the instrument and not about the page: the
     * slowed yields must have been in force, or a fast build could have slipped
     * between two frames and the checks above would have proved nothing.
     */
    expect(prepared.at(-1)!.t - prepared[0]!.t, "the preparation was too short to have been sampled reliably: is slowYields in force?").toBeGreaterThan(300);
    const first = samples.findIndex((s) => s.threeD);
    expect(first, "the sampler never saw the diagram").toBeGreaterThan(0);
    expect(samples[first - 1]!.twoD, "the frame before the swap did not show the 2D map").toBe(true);
    expect(samples.slice(first).every((s) => s.threeD), "the 2D map came back after the swap").toBe(true);
    expect(errors).toEqual([]);
  });

  test("the swap shifts nothing: no layout-shift entries, the same box, and the list does not move", async ({ page }) => {
    test.setTimeout(90_000);
    const errors = watchErrors(page);
    await page.addInitScript(() => {
      const w = window as unknown as { __shifts: { t: number; value: number; recent: boolean }[] };
      w.__shifts = [];
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
          w.__shifts.push({ t: e.startTime, value: e.value, recent: e.hadRecentInput });
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(ROUTE);
    await scrollToMap(page);
    await page.waitForTimeout(1500);
    const boxes = () =>
      page.evaluate(() => {
        const onPage = (el: Element | null) => {
          const r = el!.getBoundingClientRect();
          return { x: r.x + window.scrollX, y: r.y + window.scrollY, width: r.width, height: r.height };
        };
        return {
          frame: onPage(document.querySelector(".estate-map-stage > .estate-map-frame")),
          stage: onPage(document.querySelector(".estate-map-stage")),
          list: onPage(document.querySelector(".estate-map-list")),
          cta: onPage(document.querySelector(".estate-map-cta")),
        };
      });
    const before = await boxes();
    await sendTrigger(page);
    await expect(stage(page)).toHaveAttribute("data-state", "ready", { timeout: READY_TIMEOUT });
    await page.waitForTimeout(1000);
    const after = await boxes();
    const m = await phaseMarks(page);
    const shifts = await page.evaluate(() => (window as unknown as { __shifts: { t: number; value: number; recent: boolean }[] }).__shifts);

    expect(shifts.filter((s) => s.t >= m.trigger! && s.value > 0), "layout shifts after the trigger").toEqual([]);
    for (const k of ["stage", "list", "cta"] as const) {
      for (const p of ["x", "y", "width", "height"] as const) expect(Math.abs(after[k][p] - before[k][p]), `${k}.${p} moved across the swap`).toBeLessThanOrEqual(0.5);
    }
    const frame3d = await page.evaluate(() => {
      const r = document.querySelector(".estate-map-frame--3d")!.getBoundingClientRect();
      return { x: r.x + window.scrollX, y: r.y + window.scrollY, width: r.width, height: r.height };
    });
    for (const p of ["x", "y", "width", "height"] as const) expect(Math.abs(frame3d[p] - before.frame[p]), `the diagram's ${p} is not the 2D frame's`).toBeLessThanOrEqual(0.5);
    expect(errors).toEqual([]);
  });

  test("the swap waits while a 2D card is open, while focus stays on its marker, and while the card is open with focus elsewhere", async ({ page }) => {
    test.setTimeout(180_000);
    const errors = watchErrors(page);
    await page.goto(ROUTE);
    await scrollToMap(page);
    const marker = page.locator(".estate-map-frame .estate-map-marker").first();
    /* The trigger is this click: it opens a card. */
    await marker.click();
    await expect(marker).toHaveAttribute("aria-expanded", "true");
    const card = page.locator(`#${await marker.getAttribute("aria-controls")}`);
    await expect(card).toBeVisible();

    await expect(page.locator(".estate-map-frame--3d[data-placed]"), "the diagram was never built").toHaveCount(1, { timeout: READY_TIMEOUT });
    await page.waitForTimeout(3000);
    await expect(stage(page), "the swap went ahead over an open card").toHaveAttribute("data-state", "preparing");
    await expect(card, "the open card was lost").toBeVisible();
    let m = await phaseMarks(page);
    expect(m.swap, "the diagram did not signal ready").toBeDefined();
    expect(m.shown, "the diagram was shown over an open card").toBeUndefined();

    /*
     * THE STAGED DIAGRAM WHILE IT WAITS: inert and out of the accessibility
     * tree, as well as invisible. `visibility: hidden` in patterns.css takes it
     * out of both on its own, so without these assertions neither attribute is
     * pinned by anything and one CSS line changed to `opacity: 0` would expose
     * a hidden frame carrying the preview note and eleven place buttons.
     */
    const staged3d = page.locator(".estate-map-frame--3d");
    expect(await staged3d.getAttribute("inert"), "the staged diagram is not inert").not.toBeNull();
    await expect(staged3d, "the staged diagram is not hidden from the accessibility tree").toHaveAttribute("aria-hidden", "true");
    expect(await page.locator("section.estate-map").ariaSnapshot(), "the staged diagram's note is in the section's accessible content").not.toContain("Preview");

    /*
     * THE OPEN CARD ON ITS OWN. Tab out of the 2D frame, past the card's own
     * Visit link: nothing in the 2D map closes a card but its own marker, so
     * the card is still open with focus outside the frame, and the hold now
     * rests on the card alone. Each Tab is also a `keyup`, which is what ends a
     * hold — the swap is retried and must find the card. Without this the two
     * halves of the hold are never separated: the click that opened the card
     * also focused its marker.
     */
    let left = false;
    for (let k = 0; k < 16 && !left; k++) {
      await page.keyboard.press("Tab");
      left = await page.evaluate(() => {
        const f = document.querySelector(".estate-map-stage > .estate-map-frame:not(.estate-map-frame--3d)");
        return !!f && !f.contains(document.activeElement);
      });
    }
    expect(left, "focus never left the 2D frame: the open card was not isolated").toBe(true);
    await expect(card, "the card closed when focus left it: the open-card hold was not isolated").toBeVisible();
    await page.waitForTimeout(3000);
    await expect(stage(page), "the swap went ahead over an open card with focus elsewhere").toHaveAttribute("data-state", "preparing");
    expect((await phaseMarks(page)).shown, "the diagram was shown over an open card with focus elsewhere").toBeUndefined();

    /* Closed with the marker, which keeps focus: held on focus alone. */
    await marker.click();
    await expect(card).toBeHidden();
    await expect(marker).toBeFocused();
    await page.waitForTimeout(3000);
    await expect(stage(page), "the swap took the focused marker away").toHaveAttribute("data-state", "preparing");

    /* Focus leaves the 2D map (a click on a list number sends it to the page): the swap follows. */
    await page.locator(".estate-map-list-index").first().click();
    await expect(stage(page)).toHaveAttribute("data-state", "ready", { timeout: 10_000 });
    m = await phaseMarks(page);
    expect(m.shown).toBeDefined();
    await expect(page.locator(".estate-map-frame--3d")).toBeVisible();
    /* And now the diagram IS part of the section's accessible content: the check made while it waited was a live one. */
    expect(await page.locator("section.estate-map").ariaSnapshot(), "the diagram's note never reached the accessible content").toContain("Preview");
    expect(errors).toEqual([]);
  });

  test("keyboard: the swap waits while a marker has focus, and after a Tab out focus stays where the reader put it", async ({ page }) => {
    test.setTimeout(120_000);
    const errors = watchErrors(page);
    await page.goto(ROUTE);
    await scrollToMap(page);
    const last = page.locator(".estate-map-frame .estate-map-marker").last();
    await last.focus();
    /* The trigger is a key press, with focus on the marker. */
    await page.keyboard.press("Shift");
    await expect(page.locator(".estate-map-frame--3d[data-placed]"), "the diagram was never built").toHaveCount(1, { timeout: READY_TIMEOUT });
    await page.waitForTimeout(3000);
    await expect(stage(page), "the swap took the focused marker away").toHaveAttribute("data-state", "preparing");
    await expect(last).toBeFocused();

    /* Out of the 2D frame: past the hidden diagram (inert) to the list's first link. */
    await page.keyboard.press("Tab");
    const firstLink = page.locator(".estate-map-list a").first();
    await expect(firstLink, "Tab from the last marker went somewhere other than the list").toBeFocused();
    await expect(stage(page)).toHaveAttribute("data-state", "ready", { timeout: 10_000 });
    await expect(firstLink, "the swap moved focus").toBeFocused();
    expect(errors).toEqual([]);
  });

  test("reduced motion turned on while the diagram is being prepared: the 2D map, nothing shown, focus not moved, no errors", async ({ page }) => {
    test.setTimeout(90_000);
    const errors = watchErrors(page);
    await slowYields(page);
    await page.goto(ROUTE);
    await scrollToMap(page);
    await sendTrigger(page);
    await expect.poll(async () => Object.keys(await phaseMarks(page)), { timeout: READY_TIMEOUT }).toContain("scene");
    await expect(page.locator(".estate-map-frame--3d canvas.estate-map-3d-canvas"), "the renderer was not being built").toHaveCount(1);
    const focused = await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 80) ?? null);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(stage(page)).toHaveAttribute("data-state", "failed");
    await expect(page.locator(".estate-map-frame--3d")).toHaveCount(0);
    await expect(page.locator("section.estate-map canvas")).toHaveCount(0);
    await expect(page.locator(".estate-map-frame .estate-map-marker").first()).toBeAttached();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.waitForTimeout(3000);
    await expect(page.locator(".estate-map-frame--3d"), "the diagram came back").toHaveCount(0);
    expect(Object.keys(await phaseMarks(page)), "the build went on after reduced motion").not.toContain("swap");
    expect(await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 80) ?? null), "focus was moved").toBe(focused);
    expect(errors).toEqual([]);
  });

  test("a context lost while the diagram is being prepared: the 2D map, nothing shown, no errors", async ({ page }) => {
    test.setTimeout(90_000);
    const errors = watchErrors(page);
    await slowYields(page);
    await page.addInitScript(() => {
      const w = window as unknown as { __lost: boolean };
      w.__lost = false;
      new PerformanceObserver((list) => {
        if (!list.getEntries().some((e) => e.name === "estate3d:compile")) return;
        const canvas = document.querySelector<HTMLCanvasElement>("canvas.estate-map-3d-canvas");
        const gl = canvas?.getContext("webgl2");
        const ext = gl?.getExtension("WEBGL_lose_context");
        if (!ext) return;
        ext.loseContext();
        w.__lost = true;
      }).observe({ type: "mark" });
    });
    await page.goto(ROUTE);
    await scrollToMap(page);
    await sendTrigger(page);
    await expect(stage(page)).toHaveAttribute("data-state", "failed", { timeout: READY_TIMEOUT });
    expect(await page.evaluate(() => (window as unknown as { __lost: boolean }).__lost), "the context was never lost: this proved nothing").toBe(true);
    await expect(page.locator(".estate-map-frame--3d")).toHaveCount(0);
    await expect(page.locator("section.estate-map canvas")).toHaveCount(0);
    await expect(page.locator(".estate-map-frame .estate-map-marker").first()).toBeAttached();
    await page.waitForTimeout(2000);
    expect(Object.keys(await phaseMarks(page)), "the build went on after the context was lost").not.toContain("swap");
    expect(errors).toEqual([]);
  });

  test("leaving the page while the diagram is being prepared: no errors, and the build stops", async ({ page }) => {
    test.setTimeout(120_000);
    const errors = watchErrors(page);
    await slowYields(page);
    /* At the start of the compile phase, a client-side navigation by the list's first link. */
    await page.addInitScript(() => {
      new PerformanceObserver((list) => {
        if (!list.getEntries().some((e) => e.name === "estate3d:compile")) return;
        /* Kept from before the navigation, because the cleanup detaches it: the context outlives the element. */
        (window as unknown as { __canvas: HTMLCanvasElement | null }).__canvas = document.querySelector("canvas.estate-map-3d-canvas");
        document.querySelector<HTMLAnchorElement>(".estate-map-list a")?.click();
      }).observe({ type: "mark" });
    });
    const href = HOTSPOTS.find((h) => h.href)!.href!;
    await page.goto(ROUTE);
    await scrollToMap(page);
    await sendTrigger(page);
    await page.waitForURL(`**${href}`, { timeout: READY_TIMEOUT });
    await expect(page.locator("section.estate-map")).toHaveCount(0);
    /*
     * Long enough for a build that ignored the reader to have finished: with the
     * yields slowed, a build that runs on reaches its swap about four seconds
     * after the navigation (measured on a mutant that has every stop removed),
     * and writes into a detached frame as it goes. Three seconds let that mutant
     * through.
     */
    await page.waitForTimeout(10_000);
    const names = Object.keys(await phaseMarks(page));
    expect(names, "the navigation did not come during the build").toContain("compile");
    expect(names, "the build went on after the page was left").not.toContain("swap");
    expect(await page.locator("canvas.estate-map-3d-canvas").count()).toBe(0);
    /*
     * THE CONTEXT WAS RELEASED, not merely detached. A canvas gone from the DOM
     * says only that React removed the element; a cleanup that dropped
     * `renderer.forceContextLoss()` would leave a live context behind on every
     * visit, and a browser keeps only a handful before it reclaims the oldest.
     */
    expect(
      await page.evaluate(() => {
        const c = (window as unknown as { __canvas?: HTMLCanvasElement | null }).__canvas;
        return c ? (c.getContext("webgl2")?.isContextLost() ?? null) : null;
      }),
      "the GL context of the abandoned build was not released"
    ).toBe(true);
    expect(errors).toEqual([]);
  });

  test("leaving a page whose diagram was finished: the context is released and its geometries and materials are disposed", async ({ page }) => {
    test.setTimeout(120_000);
    const errors = watchErrors(page);
    /*
     * The GL deletes three.js makes when a geometry or a material is disposed:
     * a disposed geometry's attribute buffers and a disposed material's last
     * program. Counted from the driver's own calls, because the component keeps
     * no handle anyone can ask. Nothing else in the cleanup makes them:
     * `renderer.dispose()` does not, and `forceContextLoss()` takes the context
     * away without deleting anything through it.
     */
    await page.addInitScript(() => {
      const w = window as unknown as { __gl: { buffers: number; programs: number } };
      w.__gl = { buffers: 0, programs: 0 };
      const proto = WebGL2RenderingContext.prototype;
      const deleteBuffer = proto.deleteBuffer;
      proto.deleteBuffer = function (this: WebGL2RenderingContext, b: WebGLBuffer | null) {
        w.__gl.buffers++;
        return deleteBuffer.call(this, b);
      };
      const deleteProgram = proto.deleteProgram;
      proto.deleteProgram = function (this: WebGL2RenderingContext, p: WebGLProgram | null) {
        w.__gl.programs++;
        return deleteProgram.call(this, p);
      };
    });
    await openDiagram(page);
    const counts = () => page.evaluate(() => ({ ...(window as unknown as { __gl: { buffers: number; programs: number } }).__gl }));
    const before = await counts();
    await page.evaluate(() => {
      (window as unknown as { __canvas: HTMLCanvasElement | null }).__canvas = document.querySelector("canvas.estate-map-3d-canvas");
    });
    expect(await page.evaluate(() => !!(window as unknown as { __canvas?: HTMLCanvasElement | null }).__canvas), "there was no canvas to keep").toBe(true);

    /* A client-side navigation out of the page, which unmounts the diagram. */
    const href = HOTSPOTS.find((h) => h.href)!.href!;
    await page.locator(".estate-map-list a").first().click();
    await page.waitForURL(`**${href}`);
    await expect(page.locator("section.estate-map")).toHaveCount(0);
    await expect(page.locator("canvas.estate-map-3d-canvas")).toHaveCount(0);
    await page.waitForTimeout(500);

    const after = await counts();
    expect(after.buffers - before.buffers, "no geometry was disposed: its attribute buffers are still the driver's").toBeGreaterThan(10);
    expect(after.programs - before.programs, "no material was disposed: its programs are still the driver's").toBeGreaterThan(0);
    expect(
      await page.evaluate(() => {
        const c = (window as unknown as { __canvas?: HTMLCanvasElement | null }).__canvas;
        return c ? (c.getContext("webgl2")?.isContextLost() ?? null) : null;
      }),
      "the finished diagram's GL context was not released"
    ).toBe(true);
    expect(errors).toEqual([]);
  });

  test("a resize while the diagram is being laid out: laid out again a task at a time, and fitted to the box it lands in", async ({ page }) => {
    test.setTimeout(180_000);
    const errors = watchErrors(page);
    /*
     * THE CASE. A frame that changes size while the diagram is being built is
     * ordinary, not exotic: Chrome Android collapses its URL bar as the reader
     * scrolls, which resizes the layout viewport, and the reader has the whole
     * build to do it in. It used to be handled by nothing at all until the
     * build's last task absorbed it whole - measure, fit, project every anchor
     * and every hull, the entire label search, render, write and place the card,
     * about 150 ms of it on a phone against the 200 ms the INP gate allows, and
     * that last task is the one the gate's record claims to have measured.
     *
     * THE INSTRUMENTS. The yields are counted (see SPLIT_TASKS_MIN) and slowed,
     * so the resize can be timed into the middle of the label search: the
     * resize is taken in a rendering frame once the `layout` mark is on the
     * timeline, because a `PerformanceObserver` callback is outranked by the
     * build's own yielded continuations and does not run until the chain ends
     * (measured: it fired 180-240 ms after the swap). The resize itself is the
     * stage's box, narrowed by 120 px.
     */
    await slowYields(page, 80);
    await page.addInitScript(() => {
      /* `slowYields` above already counts every yield, per channel. */
      const w = window as unknown as { __resize: { at: number; from: number; to: number } | null };
      w.__resize = null;
      const look = () => {
        const stage = document.querySelector<HTMLElement>(".estate-map-stage");
        if (!w.__resize && stage && performance.getEntriesByName("estate3d:layout").length) {
          const from = stage.getBoundingClientRect().width;
          stage.style.maxWidth = `${Math.round(from - 120)}px`;
          w.__resize = { at: performance.now(), from, to: stage.getBoundingClientRect().width };
        }
        requestAnimationFrame(look);
      };
      requestAnimationFrame(look);
    });
    await page.goto(ROUTE);
    await scrollToMap(page);
    await sendTrigger(page);
    await expect(stage(page)).toHaveAttribute("data-state", "ready", { timeout: READY_TIMEOUT });
    const frame3d = page.locator(".estate-map-frame--3d[data-placed]");
    await expect(frame3d).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    const m = await phaseMarks(page);
    const read = () =>
      page.evaluate(() => ({
        yields: (window as unknown as { __yields: { id: number; t: number }[] }).__yields,
        resize: (window as unknown as { __resize: { at: number; from: number; to: number } | null }).__resize,
        width: document.querySelector(".estate-map-frame--3d")!.getBoundingClientRect().width,
        /*
         * The drawing buffer, not the CSS box: the box changes the moment the
         * stage is narrowed, while this is written by `renderer.setSize` in the
         * final task of the layout that answers it. It is the one signal that
         * says the answer has landed. (The renderer's pixel ratio is 1 here.)
         */
        canvas: document.querySelector<HTMLCanvasElement>("canvas.estate-map-3d-canvas")?.width ?? null,
      }));
    /* The layout that answers the resize runs after the reveal, a task at a time: wait for the drawing to be the new box. */
    await expect
      .poll(async () => (await read()).canvas, { timeout: 60_000, message: "the diagram was never redrawn at the resized box" })
      .toBe(Math.round((await read()).resize!.to));
    const { yields, resize, width } = await read();

    /* The instrument: the frame really was resized, and in the middle of the label search. */
    expect(resize, "the resize never happened: this proved nothing").not.toBeNull();
    expect(resize!.from - resize!.to, "the stage's box did not change: this proved nothing").toBeGreaterThan(100);
    expect(resize!.at, "the resize did not come after the layout began").toBeGreaterThan(m.layout!);
    expect(resize!.at, "the resize came after the search had finished: it was not laid out under the search").toBeLessThan(m.swap!);

    /* The build's own label search was split into tasks, so its final task cannot have contained it. */
    expect(yieldsBetween(yields, m.layout!, m.swap!), "the build's label search ran in too few tasks to have been split").toBeGreaterThanOrEqual(
      SPLIT_TASKS_MIN
    );
    /* And so was the layout that answered the resize, which is the path that used to run in one task. */
    expect(
      yieldsBetween(yields, m.swap!, yields.at(-1)!.t + 1),
      "the resize was laid out in too few tasks: it was absorbed by one of them"
    ).toBeGreaterThanOrEqual(SPLIT_TASKS_MIN);

    /* The diagram is fitted to the box it ended up in, not to the one it started in. */
    expect(Math.abs(width - resize!.to), "the diagram did not end up in the resized box").toBeLessThanOrEqual(1);
    const places = await measurePlaces(frame3d);
    expect(places.outside, "places outside the frame after the resize").toEqual([]);
    expect(places.overlaps, "places overlapping after the resize").toEqual([]);
    expect(places.overNote, "places over the note after the resize").toEqual([]);
    expect(errors).toEqual([]);
  });

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });

    test("a touch swipe is a scroll, not an interaction: nothing is fetched or mounted for 10 s", async ({ page }) => {
      test.setTimeout(120_000);
      const errors = watchErrors(page);
      const events = await countEvents(page);
      const threeFetched = await recordThree(page);
      await page.goto(ROUTE);
      await scrollToMap(page);
      const cdp = await page.context().newCDPSession(page);
      const viewport = page.viewportSize()!;
      const scrollBefore = await page.evaluate(() => window.scrollY);
      const started = Date.now();
      for (let k = 0; Date.now() - started < 10_000; k++) {
        await swipe(cdp, viewport.width / 2, viewport.height / 2, k % 2 ? 160 : -160);
        await page.waitForTimeout(400);
        if (k === 0) expect(await page.evaluate(() => window.scrollY), "the swipe did not scroll the page: it proved nothing").not.toBe(scrollBefore);
      }
      await scrollToMap(page);
      expect(await inRange(page), "the map was not in range: this proved nothing").toBe(true);
      await page.waitForTimeout(LOAD_ALLOWANCE_MS);

      const seen = await events();
      expect(seen.pointerdown, "the swipes produced no pointerdown").toBeGreaterThan(5);
      expect(seen.touchmove, "the swipes produced no touchmove").toBeGreaterThan(5);
      expect(seen.pointerup + seen.keydown + seen.click, "a swipe counted as a tap").toBe(0);
      expect(threeFetched, "three.js was fetched after swipes alone").toEqual([]);
      expect(await phaseMarks(page), "the loader started after swipes alone").toEqual({});
      await expect(stage(page)).toHaveAttribute("data-state", "2d");
      await expect(page.locator(".estate-map-frame--3d")).toHaveCount(0);
      expect(errors).toEqual([]);
    });

    test("a tap on the photograph loads the diagram, which then replaces it in the same box", async ({ page }) => {
      test.setTimeout(90_000);
      const errors = watchErrors(page);
      const threeFetched = await recordThree(page);
      await page.goto(ROUTE);
      await scrollToMap(page);
      const frame2d = page.locator(".estate-map-stage > .estate-map-frame").first();
      const box2d = (await frame2d.boundingBox())!;
      await frame2d.tap({ position: { x: box2d.width / 2, y: box2d.height / 2 } });
      await expect(stage(page)).toHaveAttribute("data-state", "ready", { timeout: READY_TIMEOUT });
      const box3d = (await page.locator(".estate-map-frame--3d").boundingBox())!;
      expect(Math.abs(box3d.width - box2d.width)).toBeLessThanOrEqual(1);
      expect(Math.abs(box3d.height - box2d.height)).toBeLessThanOrEqual(1);
      expect(threeFetched).toHaveLength(1);
      expect(errors).toEqual([]);
    });
  });
});
