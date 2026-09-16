#!/usr/bin/env node
/**
 * INP ON THE ESTATE PAGE, WITH THE 3D MAP ACTIVE — the measurement D-021 asks
 * for ("INP is measured on the estate page with the map active, so that the
 * decision carries its full cost"), designed in step B (B9).
 *
 *   node scripts/estate-inp.mjs --a http://localhost:3005 --b http://localhost:3035
 *        [--profiles phone,desktop] [--scenarios all | place-open,keyboard,visit,list-link,canvas,load-window]
 *        [--runs 10] [--trials 20] [--out qa/perf/INP-estate3d.md] [--json <file>]
 *
 *   A = the public build (`npm run build`, `next start` on :3005): the gate is
 *       closed, so the page is the 2D map.
 *   B = the local review build (`npm run build:estate3d`, :3035): the gate is
 *       opened by ESTATE_3D_PREVIEW=1, so the page mounts the 3D diagram.
 *
 * WHY A SCRIPT OF ITS OWN, NOT hotel-cwv. hotel-cwv's INP stand-in was one
 * number, the longest Event Timing entry, starting at 0. On this route it drove
 * nothing Event Timing records, so every one of its twelve A/B runs printed
 * "0 ms", which was the observer's starting value and not a reading (D-020).
 * This script records every entry, groups them into interactions, counts what
 * it dispatched, and never prints a missing reading as a number.
 *
 * WHAT IT DOES, IN ORDER:
 *
 *  1. CALIBRATION, before anything is believed. A 300 ms busy loop runs in the
 *     page; 50 ms after it starts (signalled by a console message, which the
 *     DevTools protocol delivers while the page is still busy) a CDP input is
 *     fired WITHOUT awaiting it. If the browser stamps the event when the
 *     input arrives, Event Timing shows processingStart − startTime ≈ 250 ms. If
 *     it reads near 0, CDP input does not record queueing delay on this machine,
 *     and the load-window scenario cannot be measured this way: its figures are
 *     withheld and the report says so.
 *
 *  2. THE GPU PATH, per profile: WEBGL_debug_renderer_info's unmasked renderer.
 *     Headless Chromium may draw WebGL in software (SwiftShader), which makes
 *     the diagram's first frame much slower than a phone's GPU would.
 *
 *  3. THE RECORDER, installed before any page script (addInitScript): every
 *     Event Timing entry at the 16 ms floor, buffered, plus first-input, a
 *     per-document sentinel and `performance.interactionCount` where the browser
 *     has it. INP is the worst interaction after grouping entries by
 *     interactionId (the 98th percentile from 50 interactions up, as INP
 *     defines it). An interaction the harness dispatched that left no entry was
 *     under 16 ms, and is printed as "<16 ms", never as 0. A trial whose
 *     document changed (a hard navigation) is recorded as LOST.
 *
 *  4. FIXED SCENARIOS, phone (390×844, 4× CPU, Slow 4G, touch) and desktop
 *     (1440×900, 2× CPU): a place's button (B) or marker (A) opening its card;
 *     Tab to the first place, Enter, Escape; the card's Visit link, a soft
 *     navigation and the figure of record for "hotspots link to the villa
 *     pages"; a list link; an empty part of the frame. A 2D marker hidden below
 *     768 px is recorded as not applicable, not as a pass.
 *
 *  5. THE LOAD WINDOW. On B the three.js chunk arrives while the reader scrolls
 *     towards the map, then two long tasks follow: evaluating it, then building
 *     the renderer and drawing the first frame (qa/perf/ESTATE3D-cost.md). The
 *     chunk is found once per profile by its body (it is the only script with
 *     `WebGLRenderer`), and each trial fires a non-awaited tap or click at a
 *     fixed offset (0–400 ms) after that request's Network.loadingFinished. A
 *     has no chunk, so its trials fire at the same offsets after the scroll plus
 *     B's measured scroll-to-chunk delay. Nothing is classified by timing
 *     alone: each interaction's input-delay window is looked up in a Chrome
 *     trace and marked "chunk-evaluate", "first-render", "other-task" or
 *     "outside" by the main-thread task that held it up.
 *      - chunk-evaluate: the task holds EvaluateScript (or its compile) for the
 *        three.js chunk's URL.
 *      - first-render: the task holds the performance mark a MutationObserver
 *        writes when `canvas.estate-map-3d-canvas` is inserted. EstateMap3D
 *        inserts the canvas and draws the first frame in the same effect, and a
 *        MutationObserver callback runs at that task's microtask checkpoint, so
 *        the mark lands inside the renderer-and-first-frame task. A trace
 *        without the CPU sampler cannot say which script a nested call belongs
 *        to (a FunctionCall event names only the outermost script, here React's
 *        scheduler), which is why the mark is needed. The observer is installed
 *        for load-window trials only, on both builds alike, so the fixed
 *        scenarios never pay for it.
 *
 *  6. BUILDS AND ORDER: A and B alternate, AB then BA (ABBA), a fresh browser
 *     context (cold cache) per trial. Tracing uses hotel-cwv's categories and no
 *     CPU sampler, which inflates task durations; traces are taken for the
 *     load-window trials only, where the classification needs them.
 *
 *  7. THE REPORT: every trial in the order measured, medians and worst per
 *     scenario, the input delay / processing / presentation split, pass or fail
 *     against 200 ms on the WORST figure, and the limits.
 *
 * A TRIAL COUNTS ONLY IF ITS SCENARIO HAPPENED. A tap that did not open the
 * card, a Tab that did not reach the place, an Enter that opened nothing, a
 * Visit or list link that did not arrive at its route, or an input the browser
 * never counted as an interaction is recorded as INVALID, with the reason, and
 * is left out of the medians, the worst figures and the verdict. Otherwise the
 * figure of record could be the latency of a tap that missed the link. The
 * browser's interaction count is read at the moment just before the measured
 * dispatch, not before the scenario's setup (the Visit scenario's first tap
 * opens the card, and counting it would confirm a Visit tap that registered
 * nothing).
 *
 * A MEASUREMENT OF RECORD needs at least 10 VALID runs per scenario per profile
 * and build, and at least 20 valid trials per load-window offset, on a machine
 * doing nothing else. Fewer valid ones than that, whatever was requested, and
 * the report's first line says SMOKE and lists the shortfall. It is lab data
 * from Chromium with synthetic CDP input: necessary, not sufficient, and no
 * substitute for field INP.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const ROUTE = "/en/the-estate";
const BUDGET_MS = 200;
const MIN_RUNS = 10;
const MIN_TRIALS = 20;
const OFFSETS = [0, 25, 50, 75, 100, 150, 200, 250, 300, 400];
const TRACE_CATEGORIES = ["devtools.timeline", "disabled-by-default-devtools.timeline", "loading", "blink.user_timing"];
const PROFILES = {
  phone: { width: 390, height: 844, mobile: true, cpu: 4, latency: 150, down: 1.6, up: 0.75 },
  desktop: { width: 1440, height: 900, mobile: false, cpu: 2, latency: 40, down: 10, up: 5 },
};
const FIXED = ["place-open", "keyboard", "visit", "list-link", "canvas"];

/* ---- arguments -------------------------------------------------------- */
const argv = process.argv.slice(2);
const opt = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
};
const A = opt("a");
const B = opt("b");
if (!A && !B) {
  console.error("usage: node scripts/estate-inp.mjs --a <public build origin> --b <review build origin> [--profiles phone,desktop] [--scenarios all] [--runs 10] [--trials 20] [--out file.md] [--json file.json]");
  process.exit(2);
}
const profiles = (opt("profiles", "phone,desktop") ?? "").split(",").filter((p) => PROFILES[p]);
const scenarioArg = opt("scenarios", "all");
const scenarios = scenarioArg === "all" ? [...FIXED, "load-window"] : scenarioArg.split(",");
/* A whole number of 1 or more, or the script stops: `Number("ten")` is NaN, which ran nothing and was not labelled SMOKE. */
const intOpt = (name, fallback) => {
  const raw = opt(name, String(fallback));
  if (!/^[1-9]\d*$/.test(raw)) {
    console.error(`--${name} must be a whole number of 1 or more, not ${JSON.stringify(raw)}`);
    process.exit(2);
  }
  return Number(raw);
};
const RUNS = intOpt("runs", MIN_RUNS);
const TRIALS = intOpt("trials", MIN_TRIALS);
const OUT = opt("out", path.join("qa", "perf", "INP-estate3d.md"));
const JSON_OUT = opt("json", OUT.replace(/\.md$/, "") + ".json");
const builds = [A && { label: "A", base: A.replace(/\/+$/, ""), expect3d: false }, B && { label: "B", base: B.replace(/\/+$/, ""), expect3d: true }].filter(Boolean);

const sleep = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));
const round = (n) => (n === null || n === undefined || Number.isNaN(n) ? null : Math.round(n));

for (const b of builds) {
  try {
    const r = await fetch(b.base + ROUTE, { method: "HEAD" });
    if (r.status >= 500) throw new Error(`HTTP ${r.status}`);
  } catch (err) {
    console.error(`No server at ${b.base} (${err.message}). Start it first.`);
    process.exit(1);
  }
}

/* ---- the in-page recorder --------------------------------------------- */
function recorder() {
  const sel = (n) => {
    if (!n || !n.tagName) return null;
    let s = n.tagName.toLowerCase();
    if (n.id) s += `#${n.id}`;
    if (typeof n.className === "string" && n.className.trim()) s += `.${n.className.trim().split(/\s+/).slice(0, 2).join(".")}`;
    return s;
  };
  window.__inp = { doc: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()), entries: [], first: null };
  performance.mark("estate-inp:origin");
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        window.__inp.entries.push({
          name: e.name,
          interactionId: e.interactionId || 0,
          startTime: e.startTime,
          processingStart: e.processingStart,
          processingEnd: e.processingEnd,
          duration: e.duration,
          target: sel(e.target),
        });
      }
    }).observe({ type: "event", durationThreshold: 16, buffered: true });
    new PerformanceObserver((list) => {
      const e = list.getEntries()[0];
      if (e && !window.__inp.first) window.__inp.first = { name: e.name, startTime: e.startTime, processingStart: e.processingStart, duration: e.duration };
    }).observe({ type: "first-input", buffered: true });
  } catch (err) {
    window.__inp.error = String(err);
  }
}

/** Load-window trials only: a performance mark inside the task that inserts the diagram's canvas (see the header, item 5). */
function canvasMark() {
  const mo = new MutationObserver((records) => {
    for (const r of records) {
      for (const n of r.addedNodes) {
        if (n.nodeType === 1 && n.matches && n.matches("canvas.estate-map-3d-canvas")) {
          performance.mark("estate-inp:canvas");
          mo.disconnect();
          return;
        }
      }
    }
  });
  mo.observe(document, { childList: true, subtree: true });
}

const readRecorder = (page) =>
  page.evaluate(() => ({
    doc: window.__inp?.doc ?? null,
    entries: window.__inp?.entries ?? [],
    first: window.__inp?.first ?? null,
    error: window.__inp?.error ?? null,
    interactionCount: typeof performance.interactionCount === "number" ? performance.interactionCount : null,
    origin: performance.getEntriesByName("estate-inp:origin")[0]?.startTime ?? null,
    path: location.pathname,
    now: performance.now(),
  }));

/**
 * Entries grouped into interactions, each with its latency and the split of its longest entry.
 *
 * `startTime` is the interaction's first entry (pointerdown or keydown) and
 * `dispatchStart` is the moment its WORST entry began processing. A tap's worst
 * entry is usually its pointerup or click, dispatched in a later task than the
 * pointerdown, so a long task that starts between the two inflates the figure
 * without touching the pointerdown's own wait. The trace classification looks
 * at the whole window from one to the other, so the class describes the same
 * event the figure does.
 */
function interactionsOf(entries) {
  const groups = new Map();
  for (const e of entries) {
    if (!e.interactionId) continue;
    groups.set(e.interactionId, [...(groups.get(e.interactionId) ?? []), e]);
  }
  return [...groups.entries()]
    .map(([id, es]) => {
      const worst = es.reduce((a, b) => (b.duration > a.duration ? b : a));
      const first = es.reduce((a, b) => (b.startTime < a.startTime ? b : a));
      return {
        id,
        latency: worst.duration,
        types: [...new Set(es.map((e) => e.name))],
        target: worst.target,
        startTime: first.startTime,
        /* The first entry's own dispatch: what the calibration measures (how long the input itself waited). */
        firstProcessingStart: first.processingStart,
        dispatchStart: worst.processingStart,
        window: `${first.name} start → ${worst.name} dispatch`,
        split: {
          inputDelay: worst.processingStart - worst.startTime,
          processing: worst.processingEnd - worst.processingStart,
          presentation: worst.startTime + worst.duration - worst.processingEnd,
        },
      };
    })
    .sort((a, b) => a.startTime - b.startTime);
}

/** INP over a set of interactions: the worst, or the 98th percentile from 50 up. */
function inpOf(list) {
  if (!list.length) return null;
  const sorted = [...list].sort((a, b) => b.latency - a.latency);
  return sorted[Math.min(Math.floor(list.length / 50), sorted.length - 1)];
}

/* ---- input, through CDP ----------------------------------------------- */
const tap = (cdp, x, y) =>
  Promise.all([
    cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] }),
    cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }),
  ]);
const click = (cdp, x, y) =>
  Promise.all([
    cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y }),
    cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 }),
    cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 }),
  ]);
const KEYS = {
  Tab: { key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 },
  Enter: { key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" },
  Escape: { key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 },
};
const press = (cdp, name) => {
  const k = KEYS[name];
  return Promise.all([
    cdp.send("Input.dispatchKeyEvent", { type: k.text ? "keyDown" : "rawKeyDown", ...k }),
    cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: k.key, code: k.code, windowsVirtualKeyCode: k.windowsVirtualKeyCode }),
  ]);
};

async function openContext(browser, name) {
  const p = PROFILES[name];
  const context = await browser.newContext({ viewport: { width: p.width, height: p.height }, deviceScaleFactor: 1, isMobile: p.mobile, hasTouch: p.mobile });
  await context.addInitScript(recorder);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  /* A mid-range phone and a throttled desktop, as hotel-cwv measures them. */
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: p.cpu });
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: p.latency,
    downloadThroughput: (p.down * 1024 * 1024) / 8,
    uploadThroughput: (p.up * 1024 * 1024) / 8,
  });
  return { context, page, cdp, input: p.mobile ? tap : click, profile: p };
}

async function readTrace(cdp) {
  const complete = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
  await cdp.send("Tracing.end");
  const { stream } = await complete;
  const parts = [];
  for (;;) {
    const { data, eof, base64Encoded } = await cdp.send("IO.read", { handle: stream, size: 8 * 1024 * 1024 });
    parts.push(base64Encoded ? Buffer.from(data, "base64") : Buffer.from(data, "utf8"));
    if (eof) break;
  }
  await cdp.send("IO.close", { handle: stream });
  const parsed = JSON.parse(Buffer.concat(parts).toString("utf8"));
  return Array.isArray(parsed) ? parsed : parsed.traceEvents;
}

const centre = async (locator) => {
  await locator.scrollIntoViewIfNeeded();
  const b = await locator.boundingBox();
  return b ? { x: b.x + b.width / 2, y: b.y + b.height / 2 } : null;
};

/** Load, settle as hotel-cwv does, bring the map into range, and wait for the diagram when this build should mount it. */
async function loadAndSettle(page, build) {
  await page.goto(build.base + ROUTE, { waitUntil: "load", timeout: 120_000 });
  await page.waitForTimeout(2500);
  await page.evaluate(() => document.querySelector(".estate-map-frame")?.scrollIntoView({ block: "center" }));
  let mode = "2d";
  if (build.expect3d) {
    mode = await page
      .locator(".estate-map-frame--3d[data-placed]")
      .waitFor({ state: "visible", timeout: 60_000 })
      .then(() => "3d")
      .catch(() => "2d");
  }
  await page.waitForTimeout(1500);
  return mode;
}

/* ---- fixed scenarios ---------------------------------------------------- */
const placeControl = (page, mode) => page.locator(mode === "3d" ? ".estate-map-3d-button" : ".estate-map-marker").first();
/** Just before a measured dispatch: the page's clock, and the browser's interaction count at that moment. */
const mark = (page) =>
  page.evaluate(() => ({ since: performance.now(), countBefore: typeof performance.interactionCount === "number" ? performance.interactionCount : null }));
const pathOf = (page) => new URL(page.url()).pathname;

/*
 * Each scenario returns what it dispatched and, when the thing it exists to
 * measure did not happen, `invalid` with the reason (see "A trial counts only
 * if its scenario happened" in the header).
 */
const SCENARIOS = {
  "place-open": {
    title: "a place's button (B) or marker (A), opening its card",
    async run({ page, cdp, input, mode }) {
      const el = placeControl(page, mode);
      if (!(await el.isVisible())) return { skipped: "no visible place control at this width (the 2D markers are hidden below 768 px)" };
      const at = await centre(el);
      const m = await mark(page);
      await input(cdp, at.x, at.y);
      const opened = await el
        .evaluate((n) => new Promise((r) => setTimeout(() => r(n.getAttribute("aria-expanded") === "true"), 300)))
        .catch(() => false);
      return { dispatched: 1, ...m, invalid: opened ? null : "the card did not open", notes: opened ? "card opened" : "" };
    },
  },
  keyboard: {
    title: "Tab to the first place, Enter, Escape",
    async run({ page, cdp, mode }) {
      const el = placeControl(page, mode);
      if (!(await el.isVisible())) return { skipped: "no visible place control at this width" };
      /* Focus the tabbable element before it by script: that is setup, not an interaction. */
      const ready = await el.evaluate((target) => {
        const all = [...document.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')].filter(
          (n) => n.tabIndex >= 0 && n.getClientRects().length > 0 && getComputedStyle(n).visibility !== "hidden"
        );
        const i = all.indexOf(target);
        if (i <= 0) return false;
        all[i - 1].focus({ preventScroll: true });
        return document.activeElement === all[i - 1];
      });
      if (!ready) return { skipped: "could not focus the element before the first place" };
      const m = await mark(page);
      await press(cdp, "Tab");
      const onPlace = await el.evaluate((n) => document.activeElement === n);
      await page.waitForTimeout(300);
      await press(cdp, "Enter");
      await page.waitForTimeout(600);
      const opened = await el.evaluate((n) => n.getAttribute("aria-expanded") === "true");
      await press(cdp, "Escape");
      await page.waitForTimeout(300);
      const invalid = !onPlace ? "Tab did not reach the first place" : !opened ? "Enter did not open its card" : null;
      return { dispatched: 3, ...m, invalid, notes: invalid ? "" : "Tab reached the first place; Enter opened" };
    },
  },
  visit: {
    title: "the card's Visit link (soft navigation) — figure of record",
    async run({ page, cdp, input, mode }) {
      const el = placeControl(page, mode);
      if (!(await el.isVisible())) return { skipped: "no visible place control at this width" };
      const at = await centre(el);
      await input(cdp, at.x, at.y);
      const card = page.locator(`#${await el.getAttribute("aria-controls")}`);
      await card.waitFor({ state: "visible", timeout: 10_000 });
      await page.waitForTimeout(600);
      const link = card.locator("a[href]").first();
      const href = await link.getAttribute("href");
      const l = await centre(link);
      const m = await mark(page);
      await input(cdp, l.x, l.y);
      await page.waitForURL((u) => u.pathname === href, { timeout: 30_000 }).catch(() => {});
      const at2 = pathOf(page);
      return { dispatched: 1, ...m, navigatedTo: at2, invalid: at2 === href ? null : `the Visit link did not arrive at ${href} (the page is at ${at2})`, notes: `Visit → ${href}` };
    },
  },
  "list-link": {
    title: "a link in the numbered list (soft navigation)",
    async run({ page, cdp, input }) {
      const link = page.locator(".estate-map-list-name a").first();
      const href = await link.getAttribute("href");
      const at = await centre(link);
      const m = await mark(page);
      await input(cdp, at.x, at.y);
      await page.waitForURL((u) => u.pathname === href, { timeout: 30_000 }).catch(() => {});
      const at2 = pathOf(page);
      return { dispatched: 1, ...m, navigatedTo: at2, invalid: at2 === href ? null : `the list link did not arrive at ${href} (the page is at ${at2})`, notes: `list → ${href}` };
    },
  },
  canvas: {
    title: "an empty part of the frame (the canvas on B, the photograph on A)",
    async run({ page, cdp, input, mode }) {
      const frame = page.locator(mode === "3d" ? ".estate-map-frame--3d" : ".estate-map-frame").first();
      await frame.scrollIntoViewIfNeeded();
      const point = await frame.evaluate((f, is3d) => {
        const r = f.getBoundingClientRect();
        for (const [fx, fy] of [[0.08, 0.9], [0.5, 0.92], [0.92, 0.55], [0.08, 0.55], [0.5, 0.5]]) {
          const x = r.left + r.width * fx;
          const y = r.top + r.height * fy;
          const hit = document.elementFromPoint(x, y);
          if (hit && (is3d ? hit.tagName === "CANVAS" : hit.tagName === "IMG") && !hit.closest("a, button")) return { x, y };
        }
        return null;
      }, mode === "3d");
      if (!point) return { skipped: "no empty point found in the frame" };
      const m = await mark(page);
      await input(cdp, point.x, point.y);
      return { dispatched: 1, ...m };
    },
  },
};

async function fixedTrial(browser, profileName, build, scenario) {
  const { context, page, cdp, input } = await openContext(browser, profileName);
  const rec = { kind: "fixed", profile: profileName, build: build.label, scenario, status: "ok" };
  try {
    rec.mode = await loadAndSettle(page, build);
    if (build.expect3d && rec.mode !== "3d") {
      rec.status = "invalid";
      rec.reason = "the 3D diagram did not mount on the review build";
      return rec;
    }
    const before = await readRecorder(page);
    const r = await SCENARIOS[scenario].run({ page, cdp, input, mode: rec.mode });
    if (r.skipped) {
      rec.status = "n/a";
      rec.reason = r.skipped;
      return rec;
    }
    await page.waitForTimeout(1500);
    const after = await readRecorder(page).catch(() => null);
    if (!after || after.doc !== before.doc) {
      rec.status = "lost";
      rec.reason = after ? "the document changed (a hard navigation or a reload)" : "the recorder could not be read";
      return rec;
    }
    const list = interactionsOf(after.entries.filter((e) => e.startTime >= r.since - 1));
    const worst = inpOf(list);
    const countDelta = after.interactionCount !== null && r.countBefore !== null ? after.interactionCount - r.countBefore : null;
    Object.assign(rec, {
      dispatched: r.dispatched,
      recorded: list.length,
      under16: Math.max(0, r.dispatched - list.length),
      interactionCountDelta: countDelta,
      inp: worst ? round(worst.latency) : null,
      worst: worst ? { types: worst.types, target: worst.target, split: mapSplit(worst.split) } : null,
      interactions: list.map((i) => ({ latency: round(i.latency), types: i.types, target: i.target, split: mapSplit(i.split) })),
      navigatedTo: r.navigatedTo ?? null,
      notes: r.notes ?? "",
    });
    const invalid = r.invalid ?? (countDelta !== null && countDelta < r.dispatched ? `the browser counted ${countDelta} of the ${r.dispatched} interaction(s) dispatched` : null);
    if (invalid) {
      rec.status = "invalid";
      rec.reason = invalid;
    }
  } catch (err) {
    rec.status = "error";
    rec.reason = String(err.message).split("\n")[0];
  } finally {
    await context.close();
  }
  return rec;
}

/*
 * Presentation is derived, startTime + duration − processingEnd, and Event
 * Timing rounds `duration` to 8 ms while the other two are precise, so a fast
 * paint can come out a millisecond or two below zero (the first phone smoke
 * printed "−1"). It is floored at 0, which is what it is within that rounding.
 */
const mapSplit = (s) => ({ inputDelay: round(s.inputDelay), processing: round(s.processing), presentation: round(Math.max(0, s.presentation)) });

/* ---- calibration -------------------------------------------------------- */
async function calibrate(browser, profileName, build) {
  const { context, page, cdp, input } = await openContext(browser, profileName);
  const rec = { profile: profileName, build: build.label };
  try {
    await page.goto(build.base + ROUTE, { waitUntil: "load", timeout: 120_000 });
    await page.waitForTimeout(2500);
    /* The target: the map section's heading, which has no handler of its own. */
    const at = await centre(page.locator(".estate-map-heading").first());
    const started = new Promise((resolve) => {
      const onConsole = (m) => {
        if (m.text() === "estate-inp:busy") {
          page.off("console", onConsole);
          resolve(Date.now());
        }
      };
      page.on("console", onConsole);
    });
    await page.evaluate(() => {
      window.__busy = null;
      setTimeout(() => {
        const start = performance.now();
        console.log("estate-inp:busy");
        const end = start + 300;
        while (performance.now() < end) {
          /* a synchronous 300 ms task */
        }
        window.__busy = { start, end: performance.now() };
      }, 100);
    });
    const t = await Promise.race([started, sleep(10_000).then(() => null)]);
    if (t === null) throw new Error("the busy loop never signalled its start");
    await sleep(t + 50 - Date.now());
    /* NOT awaited: awaiting would wait for the renderer to acknowledge, i.e. for the loop to end. */
    const pending = input(cdp, at.x, at.y);
    pending.catch(() => {});
    await sleep(1500);
    await pending.catch(() => {});
    const r = await readRecorder(page);
    const busy = await page.evaluate(() => window.__busy);
    const list = interactionsOf(r.entries.filter((e) => e.startTime >= busy.start - 50));
    const first = list[0];
    if (!first) {
      Object.assign(rec, { pass: false, reason: "no Event Timing entry for the calibration input" });
    } else {
      const measured = first.firstProcessingStart - first.startTime;
      const expected = busy.end - first.startTime;
      /*
       * The question is whether the input's timestamp was taken when it
       * ARRIVED, so that it waited at least as long as the loop held the main
       * thread. It may wait longer: once the loop ends, a throttled main thread
       * finishes that task and can run other queued work before dispatching the
       * event (the first smoke measured 267 ms against 232 ms on the phone
       * profile). What it must not do is wait noticeably less, which is what an
       * event stamped at dispatch would show.
       */
      Object.assign(rec, {
        inputIntoLoopMs: round(first.startTime - busy.start),
        expectedInputDelayMs: round(expected),
        measuredInputDelayMs: round(measured),
        latencyMs: round(first.latency),
        pass: measured >= 150 && measured >= expected - 15 && first.startTime >= busy.start && first.startTime <= busy.end,
      });
    }
    rec.gpu = await page.evaluate(() => {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl2");
      if (!gl) return { webgl2: false };
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      const out = {
        webgl2: true,
        vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
        renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        unmasked: !!ext,
      };
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      return out;
    });
    rec.gpu.software = rec.gpu.webgl2 ? /swiftshader|llvmpipe|software|basic render/i.test(`${rec.gpu.renderer} ${rec.gpu.vendor}`) : null;
  } catch (err) {
    Object.assign(rec, { pass: false, reason: String(err.message).split("\n")[0] });
  } finally {
    await context.close();
  }
  return rec;
}

/* ---- the load window ---------------------------------------------------- */

/** Find the three.js chunk on B: the only script whose body carries WebGLRenderer. Also B's scroll-to-arrival delay. */
async function pinChunk(browser, profileName, build) {
  const { context, page, cdp } = await openContext(browser, profileName);
  try {
    const scripts = new Map();
    cdp.on("Network.responseReceived", (e) => {
      if (e.type === "Script" || /\.js(\?|$)/.test(e.response.url)) scripts.set(e.requestId, { url: e.response.url });
    });
    const finished = [];
    cdp.on("Network.loadingFinished", (e) => {
      if (scripts.has(e.requestId)) finished.push({ requestId: e.requestId, at: Date.now(), bytes: e.encodedDataLength });
    });
    await page.goto(build.base + ROUTE, { waitUntil: "load", timeout: 120_000 });
    await page.waitForTimeout(2500);
    const before = finished.length;
    const scrolledAt = Date.now();
    await page.evaluate(() => document.querySelector(".estate-map-frame")?.scrollIntoView({ block: "center" }));
    await page.locator(".estate-map-frame--3d[data-placed]").waitFor({ state: "visible", timeout: 60_000 });
    for (const f of finished.slice(before)) {
      const { body, base64Encoded } = await cdp.send("Network.getResponseBody", { requestId: f.requestId }).catch(() => ({ body: "" }));
      const text = base64Encoded ? Buffer.from(body, "base64").toString("utf8") : body;
      if (text.includes("WebGLRenderer")) {
        const url = scripts.get(f.requestId).url;
        return { file: new URL(url).pathname.split("/").pop(), transferBytes: f.bytes, decodedBytes: Buffer.byteLength(text), scrollToArrivalMs: f.at - scrolledAt };
      }
    }
    return null;
  } finally {
    await context.close();
  }
}

/** Main-thread tasks from a trace, and a mapping from page time to trace time. */
function traceModel(events, base, originStart) {
  const key = (e) => `${e.pid}:${e.tid}`;
  const urlOf = (e) => String(e.args?.data?.url ?? e.args?.beginData?.url ?? "");
  const counts = new Map();
  for (const e of events) {
    if ((e.name === "EvaluateScript" || e.name === "v8.compile" || e.name === "ParseHTML") && urlOf(e).startsWith(base)) counts.set(key(e), (counts.get(key(e)) ?? 0) + 1);
  }
  const main = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const mark = events.find((e) => e.name === "estate-inp:origin" && (e.cat ?? "").includes("blink.user_timing"));
  const nav = events.find((e) => e.name === "navigationStart" && key(e) === main);
  let toTrace = null;
  if (mark && originStart !== null) toTrace = (ms) => mark.ts + (ms - originStart) * 1000;
  else if (nav) toTrace = (ms) => nav.ts + ms * 1000;
  const onMain = events.filter((e) => key(e) === main && e.ph === "X" && typeof e.dur === "number");
  const renderMarks = events.filter((e) => e.name === "estate-inp:canvas" && (e.cat ?? "").includes("blink.user_timing"));
  return { main, toTrace, tasks: onMain.filter((e) => e.name === "RunTask"), onMain, urlOf, renderMarks };
}

function classify(model, interaction, chunkFile) {
  if (!model.main || !model.toTrace) return "unclassified (no main thread or time origin in the trace)";
  /* From the first entry's start to the worst entry's dispatch: see interactionsOf. */
  const start = model.toTrace(interaction.startTime);
  const proc = model.toTrace(interaction.dispatchStart);
  if (proc - start < 8_000) return "outside";
  /* The tasks that held the input up: overlapping its wait, and not the task that finally dispatched it. */
  const blockers = model.tasks.filter((t) => t.ts < proc - 1_000 && t.ts + t.dur > start);
  if (!blockers.length) return "outside";
  const labels = new Set();
  for (const t of blockers) {
    const within = (ts) => ts >= t.ts && ts <= t.ts + t.dur;
    const inside = model.onMain.filter((e) => within(e.ts));
    const inChunk = (e) => chunkFile && model.urlOf(e).includes(chunkFile);
    if (inside.some((e) => (e.name === "EvaluateScript" || e.name === "v8.compile" || e.name === "v8.evaluateModule") && inChunk(e))) labels.add("chunk-evaluate");
    else if (model.renderMarks.some((m) => within(m.ts))) labels.add("first-render");
    else if (t.dur >= 30_000) labels.add("other-task");
  }
  return labels.size ? [...labels].join("+") : "outside";
}

async function loadWindowTrial(browser, profileName, build, offset, chunk) {
  const { context, page, cdp, input } = await openContext(browser, profileName);
  const rec = { kind: "load-window", profile: profileName, build: build.label, offset, status: "ok" };
  try {
    await context.addInitScript(canvasMark);
    await cdp.send("Tracing.start", { transferMode: "ReturnAsStream", traceConfig: { recordMode: "recordAsMuchAsPossible", includedCategories: TRACE_CATEGORIES } });
    const ids = new Set();
    let arrived = null;
    const arrival = new Promise((resolve) => {
      cdp.on("Network.requestWillBeSent", (e) => {
        if (chunk && e.request.url.includes(chunk.file)) ids.add(e.requestId);
      });
      cdp.on("Network.loadingFinished", (e) => {
        if (ids.has(e.requestId)) {
          arrived = Date.now();
          resolve(arrived);
        }
      });
    });
    await page.goto(build.base + ROUTE, { waitUntil: "load", timeout: 120_000 });
    await page.waitForTimeout(2500);
    const before = await readRecorder(page);
    const point = await page.evaluate(() => {
      const f = document.querySelector(".estate-map-frame");
      f.scrollIntoView({ block: "center" });
      const r = f.getBoundingClientRect();
      return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.92 };
    });
    const scrolledAt = Date.now();
    let anchor;
    if (build.expect3d) {
      anchor = await Promise.race([arrival, sleep(60_000).then(() => null)]);
      if (anchor === null) {
        rec.status = "invalid";
        rec.reason = "the three.js chunk never arrived";
        return rec;
      }
      rec.anchor = "three.js loadingFinished";
    } else {
      anchor = scrolledAt + (chunk?.scrollToArrivalMs ?? 0);
      rec.anchor = `scroll + ${chunk?.scrollToArrivalMs ?? 0} ms (B's measured scroll-to-chunk delay)`;
    }
    await sleep(anchor + offset - Date.now());
    rec.firedAfterAnchorMs = Date.now() - anchor;
    const pending = input(cdp, point.x, point.y);
    pending.catch(() => {});
    await page.waitForTimeout(4000);
    await pending.catch(() => {});
    const after = await readRecorder(page).catch(() => null);
    const events = await readTrace(cdp);
    if (!after || after.doc !== before.doc) {
      rec.status = "lost";
      rec.reason = after ? "the document changed" : "the recorder could not be read";
      return rec;
    }
    const list = interactionsOf(after.entries);
    const worst = inpOf(list);
    const model = traceModel(events, build.base, after.origin);
    /*
     * No setup interaction happens between `before` (read before the scroll, which
     * is not an interaction) and the one input, so the count's change is that
     * input's. With no entry AND no count, the page never registered it: it was
     * dropped, or landed off target while the page moved. That is not a fast
     * interaction, and it is not counted as one.
     */
    const countDelta = after.interactionCount !== null && before.interactionCount !== null ? after.interactionCount - before.interactionCount : null;
    Object.assign(rec, {
      dispatched: 1,
      recorded: list.length,
      under16: list.length ? 0 : countDelta ? 1 : 0,
      interactionCountDelta: countDelta,
      inp: worst ? round(worst.latency) : null,
      worst: worst ? { types: worst.types, target: worst.target, split: mapSplit(worst.split) } : null,
      class: worst ? classify(model, worst, build.expect3d ? chunk?.file : null) : "under 16 ms (no entry; the input was counted)",
      classWindow: worst ? worst.window : null,
      mounted3d: await page.locator(".estate-map-frame--3d").count().then((n) => n > 0).catch(() => null),
    });
    if (!worst && !countDelta) {
      rec.status = "invalid";
      rec.reason = countDelta === 0 ? "input not registered: no Event Timing entry and no interaction counted" : "no Event Timing entry, and this browser has no interaction count to confirm the input landed";
      delete rec.class;
    }
  } catch (err) {
    rec.status = "error";
    rec.reason = String(err.message).split("\n")[0];
  } finally {
    await context.close();
  }
  return rec;
}

/* ---- run ---------------------------------------------------------------- */
const browser = await chromium.launch();
const started = new Date();
const calibration = [];
const chunks = {};
const rows = [];
const log = (r) => {
  const figure = r.status !== "ok" ? `${r.status.toUpperCase()}${r.reason ? ` (${r.reason})` : ""}` : r.inp === null ? `<16 ms ×${r.under16}` : `${r.inp} ms`;
  console.log(`[${rows.length}] ${r.profile} ${r.kind === "load-window" ? `load-window +${r.offset}ms` : r.scenario} ${r.build}${r.mode ? `/${r.mode}` : ""}: ${figure}${r.class ? ` [${r.class}]` : ""}${r.notes ? ` — ${r.notes}` : ""}`);
};

for (const profileName of profiles) {
  const cal = await calibrate(browser, profileName, builds[0]);
  calibration.push(cal);
  console.log(`calibration ${profileName}: ${JSON.stringify(cal)}`);

  for (const scenario of scenarios.filter((s) => FIXED.includes(s))) {
    for (let run = 0; run < RUNS; run++) {
      for (const build of run % 2 === 0 ? builds : [...builds].reverse()) {
        const r = await fixedTrial(browser, profileName, build, scenario);
        rows.push(r);
        log(r);
      }
    }
  }

  if (scenarios.includes("load-window") && !cal.pass) {
    /*
     * Not run at all, rather than run and hidden. The figures a failed
     * calibration makes meaningless then exist nowhere: not in the per-offset
     * table, the every-trial table, the console or the JSON.
     */
    console.log(`load window ${profileName}: NOT RUN — calibration failed, so CDP input is not shown to record queueing delay here`);
  } else if (scenarios.includes("load-window")) {
    const bBuild = builds.find((b) => b.expect3d);
    chunks[profileName] = bBuild ? await pinChunk(browser, profileName, bBuild).catch((err) => ({ error: String(err.message).split("\n")[0] })) : null;
    console.log(`three.js chunk ${profileName}: ${JSON.stringify(chunks[profileName])}`);
    let flip = 0;
    for (const offset of OFFSETS) {
      for (let t = 0; t < TRIALS; t++) {
        for (const build of flip++ % 2 === 0 ? builds : [...builds].reverse()) {
          const r = await loadWindowTrial(browser, profileName, build, offset, chunks[profileName]?.file ? chunks[profileName] : null);
          rows.push(r);
          log(r);
        }
      }
    }
  }
}
await browser.close();

/* ---- report -------------------------------------------------------------- */
const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const fmt = (n) => (n === null ? "—" : `${Math.round(n)} ms`);
const splitText = (w) => (w ? `${w.split.inputDelay} / ${w.split.processing} / ${w.split.presentation}` : "—");

/* SMOKE is decided by the VALID runs and trials that came back, not by what was requested (see the header). */
const shortfalls = [];
if (RUNS < MIN_RUNS) shortfalls.push(`${RUNS} run(s) requested per scenario per profile, against ${MIN_RUNS}`);
if (scenarios.includes("load-window") && TRIALS < MIN_TRIALS) shortfalls.push(`${TRIALS} trial(s) requested per load-window offset, against ${MIN_TRIALS}`);
if (!shortfalls.length) {
  for (const p of profiles) {
    for (const scenario of scenarios.filter((s) => FIXED.includes(s))) {
      for (const b of builds) {
        const set = rows.filter((r) => r.kind === "fixed" && r.profile === p && r.scenario === scenario && r.build === b.label);
        if (set.length && set.every((r) => r.status === "n/a")) continue;
        const ok = set.filter((r) => r.status === "ok").length;
        if (ok < MIN_RUNS) shortfalls.push(`${p} ${scenario} ${b.label}: ${ok} valid run(s) of ${set.length}`);
      }
    }
    if (scenarios.includes("load-window") && calibration.find((c) => c.profile === p)?.pass) {
      for (const offset of OFFSETS) {
        for (const b of builds) {
          const ok = rows.filter((r) => r.kind === "load-window" && r.profile === p && r.offset === offset && r.build === b.label && r.status === "ok").length;
          if (ok < MIN_TRIALS) shortfalls.push(`${p} load-window +${offset} ms ${b.label}: ${ok} valid trial(s)`);
        }
      }
    }
  }
}
const smoke = shortfalls.length > 0;

let md = `# INP on \`${ROUTE}\`, with the 3D map active\n\n`;
md += smoke
  ? `**SMOKE — NOT A MEASUREMENT OF RECORD.** A measurement of record needs ${MIN_RUNS} valid runs per scenario, profile and build, and ${MIN_TRIALS} valid trials per load-window offset. Short: ${shortfalls.join("; ")}. Other work may have been running on the machine. These figures show that the harness works; they measure nothing.\n\n`
  : `Runs: ${RUNS} per scenario per profile; ${TRIALS} trials per load-window offset; every scenario, profile and build has at least ${MIN_RUNS} valid runs. Lab only (see Limits).\n\n`;
md += `Generated ${started.toISOString()} by \`node scripts/estate-inp.mjs\`. Builds: ${builds.map((b) => `**${b.label}** ${b.base} (${b.expect3d ? "review build, 3D" : "public build, gate closed, 2D"})`).join("; ")}. Order ABBA, a fresh context per trial.\n\n`;

md += `## Calibration (CDP input behind a 300 ms busy loop)\n\n| profile | input into the loop | expected input delay | measured input delay | result |\n|---|---|---|---|---|\n`;
for (const c of calibration) md += `| ${c.profile} | ${fmt(c.inputIntoLoopMs ?? null)} | ${fmt(c.expectedInputDelayMs ?? null)} | ${fmt(c.measuredInputDelayMs ?? null)} | ${c.pass ? "PASS: CDP input records queueing delay" : `FAIL${c.reason ? ` (${c.reason})` : ""}: the load window is not measurable this way`} |\n`;

md += `\n## GPU path\n\n| profile | WebGL2 | vendor | renderer | software |\n|---|---|---|---|---|\n`;
for (const c of calibration) md += `| ${c.profile} | ${c.gpu?.webgl2 ?? "—"} | ${c.gpu?.vendor ?? "—"} | ${c.gpu?.renderer ?? "—"} | ${c.gpu?.software ?? "—"} |\n`;

const scenarioRows = [];
for (const profileName of profiles) {
  for (const scenario of scenarios.filter((s) => FIXED.includes(s))) {
    for (const build of builds) {
      const set = rows.filter((r) => r.kind === "fixed" && r.profile === profileName && r.scenario === scenario && r.build === build.label);
      const ok = set.filter((r) => r.status === "ok");
      const numeric = ok.filter((r) => r.inp !== null);
      const worstRun = numeric.reduce((a, b) => (!a || b.inp > a.inp ? b : a), null);
      const medianRun = numeric.length ? [...numeric].sort((a, b) => a.inp - b.inp)[Math.floor((numeric.length - 1) / 2)] : null;
      const under = ok.filter((r) => r.inp === null).length;
      const confirmed = ok.filter((r) => r.inp === null).every((r) => (r.interactionCountDelta ?? 0) >= r.dispatched);
      let verdict;
      if (!ok.length) verdict = set.some((r) => r.status === "n/a") ? "not applicable" : "no valid run";
      else if (worstRun) verdict = worstRun.inp <= BUDGET_MS ? "pass" : "FAIL";
      else verdict = confirmed ? "pass (every interaction under 16 ms)" : "not established (no entry, interaction count unconfirmed)";
      scenarioRows.push({ profileName, scenario, build: build.label, set, ok, numeric, worstRun, medianRun, under, verdict });
    }
  }
}
md += `\n## Fixed scenarios\n\nINP per run is the worst interaction in that run. "<16 ms" counts runs whose interactions all stayed under Event Timing's 16 ms floor. Split = input delay / processing / presentation, in ms. The verdict is on the WORST run against ${BUDGET_MS} ms.\n\n`;
md += `| profile | scenario | build | ok / lost / n/a / invalid / error | median INP | worst INP | runs <16 ms | median split | worst split | verdict |\n|---|---|---|---|---|---|---|---|---|---|\n`;
for (const s of scenarioRows) {
  const count = (st) => s.set.filter((r) => r.status === st).length;
  md += `| ${s.profileName} | ${s.scenario} | ${s.build} | ${count("ok")} / ${count("lost")} / ${count("n/a")} / ${count("invalid")} / ${count("error")} | ${fmt(median(s.numeric.map((r) => r.inp)))} | ${fmt(s.worstRun?.inp ?? null)} | ${s.under} | ${splitText(s.medianRun?.worst)} | ${splitText(s.worstRun?.worst)} | ${s.verdict} |\n`;
}

if (scenarios.includes("load-window")) {
  md += `\n## The load window\n\n`;
  md += `| profile | three.js chunk | transfer | decoded | scroll → loadingFinished (pin run) |\n|---|---|---|---|---|\n`;
  for (const p of profiles) {
    const c = chunks[p];
    md += `| ${p} | ${c?.file ?? c?.error ?? "—"} | ${c?.transferBytes ?? "—"} B | ${c?.decodedBytes ?? "—"} B | ${fmt(c?.scrollToArrivalMs ?? null)} |\n`;
  }
  for (const p of profiles) {
    const cal = calibration.find((c) => c.profile === p);
    if (!cal?.pass) {
      md += `\n**${p}: not measurable.** Calibration failed, so CDP input is not shown to record queueing delay on this machine. No load-window trial was run on this profile, so there are no figures to report.\n`;
      continue;
    }
    md += `\n### ${p}\n\nThe class covers each interaction from its first entry's start to its worst entry's dispatch (see the every-trial table for which entries those were). Invalid trials (an input the page never registered) are counted in the every-trial table only.\n\n| offset | build | class (from the trace) | n | median INP | worst INP | <16 ms |\n|---|---|---|---|---|---|---|\n`;
    for (const offset of OFFSETS) {
      for (const build of builds) {
        const set = rows.filter((r) => r.kind === "load-window" && r.profile === p && r.offset === offset && r.build === build.label && r.status === "ok");
        const classes = [...new Set(set.map((r) => r.class))];
        for (const cls of classes) {
          const c = set.filter((r) => r.class === cls);
          const nums = c.filter((r) => r.inp !== null).map((r) => r.inp);
          md += `| +${offset} ms | ${build.label} | ${cls} | ${c.length} | ${fmt(median(nums))} | ${fmt(nums.length ? Math.max(...nums) : null)} | ${c.length - nums.length} |\n`;
        }
      }
    }
  }
}

md += `\n## Every trial, in the order measured\n\n| # | profile | scenario | build | status | INP | worst interaction | split | dispatched / recorded / <16 | interactionCount Δ | notes |\n|---|---|---|---|---|---|---|---|---|---|---|\n`;
rows.forEach((r, i) => {
  const name = r.kind === "load-window" ? `load-window +${r.offset} ms` : r.scenario;
  const inp = r.status !== "ok" ? "—" : r.inp === null ? "<16 ms" : `${r.inp} ms`;
  const notes = [r.mode, r.class, r.classWindow && `class over ${r.classWindow}`, r.notes, r.navigatedTo && `→ ${r.navigatedTo}`, r.reason, r.anchor].filter(Boolean).join("; ");
  md += `| ${i + 1} | ${r.profile} | ${name} | ${r.build} | ${r.status} | ${inp} | ${r.worst ? `${r.worst.types.join("+")} on \`${r.worst.target}\`` : "—"} | ${splitText(r.worst)} | ${r.dispatched ?? "—"} / ${r.recorded ?? "—"} / ${r.under16 ?? "—"} | ${r.interactionCountDelta ?? "—"} | ${notes.replace(/\|/g, "\\|")} |\n`;
});

md += `\n## Limits\n\n- Lab only: Chromium through Playwright, synthetic CDP input, throttled CPU and network. Not field INP, and not Safari or Firefox.\n- Event Timing's floor is 16 ms and its durations are rounded to 8 ms; an interaction under the floor leaves no entry and is printed as "<16 ms".\n- The GPU path above decides the first frame's cost; software WebGL overstates it against a phone's GPU.\n- Traces use hotel-cwv's categories without the CPU sampler, and are taken for the load-window trials only.\n- ${smoke ? "The machine was not isolated. This is a smoke run: no figure here is a measurement of record." : "Figures of record need an otherwise idle machine. The harness cannot check that, so the record that cites these figures states the conditions they were taken under."}\n`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, md);
fs.writeFileSync(JSON_OUT, JSON.stringify({ started, smoke, runs: RUNS, trials: TRIALS, builds, calibration, chunks, rows }, null, 2) + "\n");
console.log(`-> ${OUT}\n-> ${JSON_OUT}${smoke ? "\nSMOKE: not a measurement of record." : ""}`);
