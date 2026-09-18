#!/usr/bin/env node
/**
 * THE 3D ESTATE MAP, PHOTOGRAPHED — from the local review build, for review.
 *
 *   npm run build:estate3d && npm run start:estate3d     # :3035
 *   node scripts/estate3d-shots.mjs [--base http://localhost:3035] [--out qa/estate3d]
 *
 * D-028: "Seeing the diagram: screenshots into qa/ are enough for now — no
 * public preview of an unverified map." This takes them. It is evidence, not a
 * test: nothing here asserts the diagram is right, only that what was
 * photographed is the review build, drawn and laid out.
 *
 *  - It refuses to write anything unless the diagram's note reads "Preview —
 *    unverified": a screenshot of the diagram must say on its face that the
 *    positions are unverified (D-022), and a public build never says it.
 *  - The diagram loads only after a reader's first interaction (D-028), so each
 *    page gets one: a click, or a tap on a phone, on a list number, which does
 *    nothing else. Then it waits for the swap (`data-state="ready"`), the
 *    placed buttons (`data-placed`) and the fonts.
 *  - The site's custom cursor is hidden and the mouse parked at 0,0, so no dot
 *    stands on the drawing. The frame is scrolled to the middle of the
 *    viewport, and any fixed or sticky page chrome over it (the site's bar) is
 *    hidden for the shot and named in the index; a shot in which the note is
 *    covered or out of sight is refused.
 *  - Each shot is the diagram's frame with a 16 px margin: at rest at 390
 *    (touch, DPR 2), 768, 1024, 1440 and 1920 px; with Villa Thoi's card open
 *    at each; and with the helipad's card open at 1440.
 *  - `README.md` beside them names the commit, the BUILD_ID the server
 *    reported, and each shot's viewport, DPR and date.
 *
 * The repository is public, so shots committed from here are visible on GitHub;
 * the note on each is what says what they are.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { chromium } from "@playwright/test";

const ROUTE = "/en/the-estate";
const PREVIEW = "Preview — unverified";
const MARGIN = 16;
const READY_TIMEOUT = 60_000;

function option(name, fallback) {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === `--${name}`) return args[i + 1] ?? fallback;
    if (args[i]?.startsWith(`--${name}=`)) return args[i].slice(name.length + 3);
  }
  return fallback;
}

const BASE = option("base", "http://localhost:3035").replace(/\/+$/, "");
const OUT = path.resolve(option("out", path.join("qa", "estate3d")));

const VIEWS = [
  { name: "390", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, touch: true, helipad: false },
  { name: "768", viewport: { width: 768, height: 1024 }, deviceScaleFactor: 1, touch: false, helipad: false },
  { name: "1024", viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1, touch: false, helipad: false },
  { name: "1440", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, touch: false, helipad: true },
  { name: "1920", viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, touch: false, helipad: false },
];

function git(...args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

/** The page, triggered, swapped and laid out; throws unless it is the review build's diagram. */
async function openDiagram(page, touch) {
  const res = await page.goto(BASE + ROUTE, { waitUntil: "load", timeout: 90_000 });
  if (!res || res.status() !== 200) throw new Error(`${BASE + ROUTE} answered ${res?.status() ?? "nothing"}`);
  const html = await res.text();
  const buildId = /\\"b\\":\\"([A-Za-z0-9_-]+)\\"/.exec(html)?.[1] ?? null;
  if ((await page.locator(".estate-map-stage").count()) !== 1) {
    throw new Error("the page has no 3D stage: this is not a review build (or the gate is closed)");
  }
  await page.locator("section.estate-map").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const trigger = page.locator(".estate-map-list-index").first();
  if (touch) await trigger.tap();
  else await trigger.click();
  await page.waitForFunction(
    () => document.querySelector(".estate-map-stage")?.getAttribute("data-state") === "ready" && !!document.querySelector(".estate-map-frame--3d[data-placed]"),
    null,
    { timeout: READY_TIMEOUT }
  );
  await page.evaluate(() => document.fonts.ready);
  const note = (await page.locator(".estate-map-frame--3d .estate-map-3d-note").innerText()).trim();
  if (!note.includes(PREVIEW)) throw new Error(`the diagram's note does not read "${PREVIEW}" (it reads "${note}"); refusing to photograph it`);
  await page.addStyleTag({ content: ".cursor, .cursor * { visibility: hidden !important; }" });
  if (!touch) await page.mouse.move(0, 0);
  await page.locator(".estate-map-frame--3d").evaluate((el) => el.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(800);
  /*
   * Page chrome that stays on screen wherever the page is scrolled — the site's
   * bar, and nothing else — would stand over the frame and over its note. Only
   * a `fixed` or `sticky` box can: everything else scrolls away with the page,
   * and the frame is scrolled to the middle of the viewport. Decorative
   * overlays that take no pointer (the page grain, which covers every shot
   * equally and is part of the look) stay. Each one hidden is named in the
   * index, so a shot never quietly leaves something out.
   */
  const hidden = await page.evaluate((margin) => {
    const frame = document.querySelector(".estate-map-frame--3d");
    const f = frame.getBoundingClientRect();
    const names = [];
    for (const el of document.querySelectorAll("body *")) {
      if (frame.contains(el) || el.contains(frame)) continue;
      const s = getComputedStyle(el);
      if (s.position !== "fixed" && s.position !== "sticky") continue;
      if (s.pointerEvents === "none") continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || r.right <= f.left - margin || r.left >= f.right + margin || r.bottom <= f.top - margin || r.top >= f.bottom + margin) continue;
      el.style.setProperty("visibility", "hidden", "important");
      names.push(el.tagName.toLowerCase() + (typeof el.className === "string" && el.className.trim() ? `.${el.className.trim().split(/\s+/).join(".")}` : ""));
    }
    return names;
  }, MARGIN);
  return { buildId, note, hidden };
}

/** Refuses a shot in which the note is not what a reader would see at its place. */
async function noteInSight(page) {
  const clear = await page.evaluate(() => {
    const note = document.querySelector(".estate-map-frame--3d .estate-map-3d-note");
    const text = [...note.querySelectorAll("span")].find((s) => s.getClientRects().length) ?? note;
    const r = text.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + Math.min(24, r.width / 2), r.top + r.height / 2);
    return r.top >= 0 && r.bottom <= window.innerHeight && !!hit && note.contains(hit);
  });
  if (!clear) throw new Error("the note is covered or out of sight; refusing the shot");
}

/** The frame and a margin, clipped to the viewport. */
async function shoot(page, file) {
  await noteInSight(page);
  const box = await page.locator(".estate-map-frame--3d").boundingBox();
  const vp = page.viewportSize();
  if (!box || !vp) throw new Error("the diagram has no box");
  const x = Math.max(0, box.x - MARGIN);
  const y = Math.max(0, box.y - MARGIN);
  const clip = { x, y, width: Math.min(vp.width, box.x + box.width + MARGIN) - x, height: Math.min(vp.height, box.y + box.height + MARGIN) - y };
  await page.screenshot({ path: file, clip });
}

async function openPlace(page, key, touch) {
  const button = page.locator(`.estate-map-3d-place[data-place="${key}"] .estate-map-3d-button`);
  if ((await button.count()) !== 1) throw new Error(`the diagram has no place "${key}"`);
  if (touch) await button.tap();
  else await button.click();
  await page.waitForFunction((k) => document.querySelector(`.estate-map-3d-place[data-place="${k}"] .estate-map-3d-button`)?.getAttribute("aria-expanded") === "true", key);
  if (!touch) await page.mouse.move(0, 0);
  await page.waitForTimeout(500);
}

const browser = await chromium.launch();
const rows = [];
let buildId = null;
const notes = new Set();
let exit = 0;
try {
  for (const view of VIEWS) {
    const context = await browser.newContext({
      viewport: view.viewport,
      deviceScaleFactor: view.deviceScaleFactor,
      hasTouch: view.touch,
      isMobile: view.touch,
    });
    const page = await context.newPage();
    const shots = [];
    const opened = await openDiagram(page, view.touch);
    if (buildId && opened.buildId !== buildId) throw new Error(`the server's BUILD_ID changed during the run (${buildId} → ${opened.buildId})`);
    buildId = opened.buildId;
    notes.add(`${opened.note} (${view.name} px)`);
    /* Only now, with the first page proven to be the review build, is anything written. */
    fs.mkdirSync(OUT, { recursive: true });

    shots.push({ file: `estate3d-${view.name}-rest.png`, state: "at rest" });
    await shoot(page, path.join(OUT, shots.at(-1).file));
    await openPlace(page, "thoi", view.touch);
    shots.push({ file: `estate3d-${view.name}-thoi-open.png`, state: "Villa Thoi's card open" });
    await shoot(page, path.join(OUT, shots.at(-1).file));
    if (view.helipad) {
      await openPlace(page, "helipad", view.touch);
      shots.push({ file: `estate3d-${view.name}-helipad-open.png`, state: "the helipad's card open" });
      await shoot(page, path.join(OUT, shots.at(-1).file));
    }
    const date = new Date().toISOString();
    for (const s of shots) rows.push({ ...s, view, date, hidden: opened.hidden });
    for (const s of shots) console.log(path.join(OUT, s.file));
    await context.close();
  }
} catch (err) {
  console.error(`estate3d-shots: ${err instanceof Error ? err.message : err}`);
  exit = 1;
} finally {
  await browser.close();
}

if (rows.length) {
  const commit = git("rev-parse", "HEAD") ?? "unknown";
  const dirty = (git("status", "--porcelain") ?? "") !== "";
  const lines = [
    "# The 3D estate map, review build: screenshots",
    "",
    "Taken by `node scripts/estate3d-shots.mjs` from the local review build (`ESTATE_3D_PREVIEW=1`), never a public page (DECISIONS.md D-022, D-028).",
    "The plan is unverified: positions are inferred from the estate's aerial photographs, and the note on every shot says so.",
    "",
    `- Server: ${BASE}${ROUTE}`,
    `- Commit: \`${commit}\`${dirty ? " (the working tree had uncommitted changes)" : ""}`,
    `- BUILD_ID (as the server reported it): \`${buildId ?? "not found in the page"}\``,
    ...[...notes].map((n) => `- The note read: ${n}`),
    exit ? "- **The run stopped early**: the shots below are all it took." : "- The run completed.",
    "",
    "Each shot is the diagram's frame with a 16 px margin, scrolled to the middle of the viewport. The site's custom cursor is hidden, and so is any fixed page chrome that takes the pointer and would stand over the frame (named per shot). A shot is refused if the note is covered.",
    "",
    "| File | Viewport | DPR | Touch | State | Hidden for the shot | Taken |",
    "|---|---|---|---|---|---|---|",
    ...rows.map(
      (r) =>
        `| [${r.file}](${r.file}) | ${r.view.viewport.width}×${r.view.viewport.height} | ${r.view.deviceScaleFactor} | ${r.view.touch ? "yes" : "no"} | ${r.state} | ${r.hidden.length ? r.hidden.map((h) => `\`${h}\``).join(", ") : "nothing"} | ${r.date} |`
    ),
    "",
  ];
  fs.writeFileSync(path.join(OUT, "README.md"), lines.join("\n"));
  console.log(path.join(OUT, "README.md"));
}
process.exit(exit);
