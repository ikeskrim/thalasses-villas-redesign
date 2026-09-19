#!/usr/bin/env node
/**
 * INP ON THE ESTATE PAGE, WITH THE 3D MAP ACTIVE — the measurement D-021 asks
 * for ("INP is measured on the estate page with the map active, so that the
 * decision carries its full cost"), designed in step B (B9).
 *
 *   node scripts/estate-inp.mjs --a http://localhost:3005 --b http://localhost:3035
 *        [--profiles phone,desktop]
 *        [--cells all | control,trigger,place-open,keyboard,visit,list-link,canvas-tap,window]
 *        [--families all | trigger,request,arrival,renderer,scene,compile,layout,swap]
 *        [--offsets arrival=0,50 --offsets layout=0,60 ...]
 *        [--runs 10] [--trials 20] [--trace-trials 2] [--control-wait 12000]
 *        [--out qa/perf/INP-estate3d.md] [--json <file>]
 *        [--gate-json qa/perf/INP-estate3d-gate.json] [--no-gate-json]
 *
 * IT WRITES THE GATE'S RECORD (D-033). `qa/perf/INP-estate3d-gate.json`,
 * schema `estate3d-inp-gate/1`, is the file `decideInpCondition` in
 * `src/lib/estate-plan-gate.ts` reads to decide the map's second condition.
 * The rules for building it, and the harness's refusal to write one its own
 * reader would reject, are in `scripts/estate-inp-record.mjs`. The
 * fingerprint is computed by `src/lib/estate-3d-fingerprint.ts` — imported,
 * never re-implemented, because a second implementation of a fingerprint is a
 * fingerprint that can disagree with itself.
 *
 * THE CELLS D-033 REQUIRES, all of which this measures:
 *  - the NO-INTERACTION CONTROL: a page view that dispatches nothing at all,
 *    scrolled into range and left for at least ten seconds, which must record
 *    no Event Timing entry, no counted interaction and no three.js request.
 *    It is the cell that proves the deferred loader defers: with it, a record
 *    full of fast taps cannot be a record of a page that loaded three.js
 *    without being asked.
 *  - the TRIGGER: since 25f4e51 the reader's first completed interaction is
 *    what starts the load, so its own latency is a cell of its own.
 *  - the five FIXED scenarios, on a page whose diagram is already shown.
 *  - EIGHT WINDOW FAMILIES, each at two or more offsets. A window trial
 *    triggers the load, waits for that family's anchor, and fires ONE
 *    non-awaited input a fixed number of milliseconds after it.
 *
 * WHERE A WINDOW FAMILY'S ANCHOR COMES FROM, and why not from timing. Six of
 * the eight are the page's own `estate3d:*` marks
 * (`src/components/sections/estate-map-3d-marks.ts`, the one place those names
 * are spelled). The other two are the chunk's `Network.requestWillBeSent` and
 * `Network.loadingFinished`. Nothing is anchored on "so many milliseconds
 * after the trigger", because the phases move by tens of milliseconds from run
 * to run: an offset chosen to land inside the chunk's evaluation would land
 * somewhere else on the next trial, and the record would say it measured a
 * window it did not.
 *
 * HOW A MARK IS LEARNED WHILE THE MAIN THREAD IS BLOCKED, which is the whole
 * difficulty. Each of `renderer`, `scene`, `compile`, `layout` and `swap` is
 * written at the START of the task that does that step's work. A
 * PerformanceObserver callback for it cannot run until that task ENDS, which is
 * exactly too late — the input would be fired after the step it was meant to
 * land in. So a window trial replaces `performance.mark` (before any page
 * script) with a wrapper that calls the original and then `console.log`s the
 * name SYNCHRONOUSLY, in the same task: the DevTools protocol carries that
 * message out of the renderer while the renderer is still busy, which is the
 * mechanism the calibration below already depends on. The wrapper is installed
 * on window trials only, and on both builds alike.
 *
 * WHAT EACH TRIAL'S FIGURE IS. `inpMs` is the worst interaction of the trial's
 * OWN measurement window — from the measured dispatch onward, grouped by
 * interactionId so an interaction is never split. The trigger that started the
 * load is an interaction too, and it is measured in its own cell; counting it
 * again inside every other cell would make every cell a trigger measurement.
 * Each row also carries `pageWorstMs`, the worst interaction anywhere in that
 * page view, so a stricter reading is available to the record's reader without
 * measuring again.
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
 *     and the window families cannot be measured this way: their figures are
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
 *  5. THE WINDOW FAMILIES. On B the load starts at the trigger and then runs
 *     through the phases above; the chunk is found once per profile by its body
 *     (it is the only script with `WebGLRenderer`) in a PIN RUN that also reads
 *     every `estate3d:*` mark and the chunk's own Resource Timing, and REFUSES
 *     to measure a family whose anchor mark the page did not emit — naming the
 *     mark, so a rename fails loudly instead of measuring nothing. A has no
 *     chunk and no marks, so its trials fire at the same offsets after the
 *     trigger plus the pin run's measured delay to that anchor, which is the
 *     only thing A can be compared on. Nothing is classified by timing alone:
 *     each interaction's input-delay window is looked up in a Chrome trace and
 *     marked "chunk-evaluate", "first-render", "other-task" or "outside" by the
 *     main-thread task that held it up.
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
 *        for window trials only, on both builds alike, so the fixed
 *        scenarios never pay for it.
 *
 *  6. BUILDS AND ORDER: A and B alternate, AB then BA (ABBA), a fresh browser
 *     context (cold cache) per trial. Tracing uses hotel-cwv's categories and no
 *     CPU sampler, which INFLATES TASK DURATIONS — measured on this machine at
 *     +18.7 % on a comparable workload — and Event Timing's `duration` runs to
 *     the next paint, so a traced trial reports a larger INP than the same tap
 *     untraced. The figure of record is therefore measured UNTRACED; a few
 *     trials per window cell (`--trace-trials`, default 2) are traced for the
 *     classification alone and are written to the record as `na`, never as a
 *     figure.
 *
 *  6b. WHERE A WINDOW TRIAL'S OFFSET IS MEASURED FROM, AND CHECKED AGAINST.
 *     The anchor is when the phase HAPPENED, not when this process heard of it:
 *     a mark's console message arrives 1–15 ms late and a CDP network event
 *     later still, and sleeping the offset from the arrival fired every trial
 *     late on every family and never early — which flatters the figure, because
 *     later means waiting for less of the phase. The mark carries its own
 *     `startTime` and `Network.requestWillBeSent` carries `wallTime`, so both
 *     are corrected, and every row records the latency it subtracted. A trial
 *     that still lands further than the tolerance from its declared offset, or
 *     outside the phase its family names, is recorded INVALID: a cell called
 *     `window:renderer:0` is a claim about where the tap was.
 *
 *  6c. THE OFFSETS ARE THIS PROFILE'S. They are derived from the profile's own
 *     pin run (0, and about half the phase it measured), not from one table
 *     written from phone figures — on the unthrottled desktop the same phases
 *     are five to ten times shorter, so a phone offset lands in a later phase
 *     or on an idle page while the cell id still names the phase it missed.
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
 * A MEASUREMENT OF RECORD needs at least 10 VALID REVIEW-BUILD (B) trials per
 * control, trigger and fixed cell per profile, and at least 20 per window cell,
 * on a machine doing nothing else. Fewer than that and the report's first line
 * says SMOKE, the record carries `smoke: true`, and the exit code is non-zero.
 * SMOKE IS ARM B's ALONE, because the gate reads only arm B: `smoke: true`
 * makes the gate reject the record outright, and one transient invalid among a
 * full run's ~780 arm-A trials should not hand back a dead record. Arm A's own
 * shortfalls are reported beside it. It is lab data from Chromium with
 * synthetic CDP input: necessary, not sufficient, and no substitute for field
 * INP.
 *
 * EXIT CODES. 0: the gate record was written and the gate's own reader accepts
 * it AS WRITTEN — `smoke` and all, not a copy with the flag cleared. 1: the
 * record was written and the reader would reject it on the MEASUREMENT — too
 * few valid trials, a trial at or over 200 ms, or (the harness's own rule) a
 * window cell that did not catch the phase its id names — with every reason
 * printed. 2: nothing was written, either because a PRE-FLIGHT or a PIN RUN
 * refused (no server, an origin not serving this tree's build, a source newer
 * than the build, a mark the page does not emit, a chunk that could not be
 * pinned) or because the reader could not read the record as the schema at all
 * (a cell never measured, a calibration that failed, a malformed row). A
 * refusal stops the run WHERE IT IS RAISED rather than after the trials: with
 * no pinned chunk every control trial is invalid by construction and every
 * `request`/`arrival` trial waits out a 90 s timeout, about four hours across
 * the grid for rows that were doomed before they started. The markdown report
 * and the raw JSON are still written, so nothing measured is lost, but a file
 * the gate cannot parse is never put in `qa/perf/`.
 */
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";

import { ESTATE3D_MARK, ESTATE3D_MARK_PREFIX, WINDOW_ANCHOR } from "../src/components/sections/estate-map-3d-marks.ts";
import { estate3dFingerprint, mountPathFiles } from "../src/lib/estate-3d-fingerprint.ts";
import {
  DEFAULT_OFFSETS,
  FIXED_SCENARIOS,
  INP_MIN_OK_TRIALS,
  INP_TRIGGER_TARGET,
  INP_WINDOW_FAMILIES,
  OFFSET_TOLERANCE_MS,
  buildGateRecord,
  cellIdFor,
  checkGateRecord,
  derivedOffsets,
  hitAControl,
  isTriggerTarget,
  phaseEndMarkOf,
  plannedCells,
} from "./estate-inp-record.mjs";

const ROUTE = "/en/the-estate";
const BUDGET_MS = 200;
const MIN_RUNS = INP_MIN_OK_TRIALS.fixed;
const MIN_TRIALS = INP_MIN_OK_TRIALS.window;
const TRACE_CATEGORIES = ["devtools.timeline", "disabled-by-default-devtools.timeline", "loading", "blink.user_timing"];
const PROFILES = {
  phone: { width: 390, height: 844, mobile: true, cpu: 4, latency: 150, down: 1.6, up: 0.75 },
  desktop: { width: 1440, height: 900, mobile: false, cpu: 2, latency: 40, down: 10, up: 5 },
};
const FIXED = FIXED_SCENARIOS;
/** The trigger: a list number, which is not a link and not inside the frame, so the tap does nothing but start the load. Spelled in estate-inp-record.mjs, where the spec can reach it. */
const TRIGGER_TARGET = INP_TRIGGER_TARGET;
/**
 * HOW MANY OF A WINDOW CELL'S TRIALS ARE TRACED, AND WHY NOT ALL OF THEM.
 *
 * Tracing is only needed for `class`, and it is not free: measured on this
 * machine (5 interleaved pairs, phone profile, 4× CPU, a DOM+JS workload of 40
 * yielded steps, these same categories and `recordAsMuchAsPossible`) a traced
 * run was slower in all five pairs, median 4811 ms against 4055 ms — +18.7 %.
 * Event Timing's `duration` runs to the next paint, so a slower main thread
 * makes a LARGER INP: on the phone's own phases that is about +20 ms on a
 * 105–135 ms label search and +16 to +32 ms on an 83–168 ms chunk evaluation.
 * The eight window families are the cells that decide the gate, and until now
 * they alone carried an instrumentation cost that field INP does not.
 *
 * So the figure of record is measured UNTRACED, and each cell additionally runs
 * this many traced trials for the classification. A traced row is written to
 * the record as `na` with the reason, never as a figure: it is evidence about
 * the phase, not a measurement of the tap.
 */
const TRACE_TRIALS = 2;
/** A control trial waits this long after the scroll before it is believed (D-033: "wait at least 10 s"). */
const CONTROL_WAIT_MS = 12_000;
const GATE_RECORD_DEFAULT = path.join("qa", "perf", "INP-estate3d-gate.json");

/* ---- arguments -------------------------------------------------------- */
const argv = process.argv.slice(2);
const opt = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
};
const A = opt("a");
const B = opt("b");
if (!A && !B) {
  console.error("usage: node scripts/estate-inp.mjs --a <public build origin> --b <review build origin> [--profiles phone,desktop] [--cells all] [--families all] [--offsets family=a,b] [--runs 10] [--trials 20] [--trace-trials 2] [--control-wait 12000] [--out file.md] [--json file.json] [--gate-json file.json | --no-gate-json]");
  process.exit(2);
}
const profiles = (opt("profiles", "phone,desktop") ?? "").split(",").filter((p) => PROFILES[p]);
const die = (message) => {
  console.error(message);
  process.exit(2);
};

/*
 * WHICH CELLS TO MEASURE. `--cells all` is the grid D-033 requires and is the
 * default; anything narrower is for debugging the instrument, and the record it
 * produces will be REFUSED (a record missing a cell is one the gate cannot
 * read). `--scenarios` is kept as an alias for the fixed names only, so an
 * older command line still means what it meant.
 */
const ALL_CELLS = ["control", "trigger", ...FIXED, "window"];
const cellArg = opt("cells", opt("scenarios", "all"));
const cellNames =
  cellArg === "all"
    ? ALL_CELLS
    : cellArg
        .split(",")
        .map((s) => s.trim())
        /* The load window's old name, and the fifth fixed scenario's. */
        .map((s) => (s === "load-window" ? "window" : s === "canvas" ? "canvas-tap" : s));
for (const name of cellNames) if (!ALL_CELLS.includes(name)) die(`--cells: ${JSON.stringify(name)} is not one of ${ALL_CELLS.join(", ")}`);
const wantControl = cellNames.includes("control");
const wantTrigger = cellNames.includes("trigger");
const fixedWanted = FIXED.filter((s) => cellNames.includes(s));
const wantWindow = cellNames.includes("window");

const familyArg = opt("families", "all");
const families = familyArg === "all" ? [...INP_WINDOW_FAMILIES] : familyArg.split(",").map((s) => s.trim());
for (const f of families) if (!INP_WINDOW_FAMILIES.includes(f)) die(`--families: ${JSON.stringify(f)} is not one of ${INP_WINDOW_FAMILIES.join(", ")}`);

/* `--offsets family=0,50`, repeatable; the defaults and their reasons are in scripts/estate-inp-record.mjs. */
const OFFSETS = Object.fromEntries(Object.entries(DEFAULT_OFFSETS).map(([k, v]) => [k, [...v]]));
/** Families the command line pinned: their offsets are used as given on every profile, instead of the pin run's. */
const OFFSET_OVERRIDES = new Set();
for (let i = 0; i < argv.length; i++) {
  if (argv[i] !== "--offsets") continue;
  const spec = argv[i + 1] ?? "";
  const [family, list] = spec.split("=");
  if (!INP_WINDOW_FAMILIES.includes(family)) die(`--offsets: ${JSON.stringify(spec)} must be <family>=<ms>[,<ms>...], the family one of ${INP_WINDOW_FAMILIES.join(", ")}`);
  const values = (list ?? "").split(",").map((s) => s.trim());
  /*
   * A WHOLE NUMBER OF MILLISECONDS, 0 OR MORE. The gate spells a window cell's
   * id "window:<family>:<offsetMs>" by template, so 50.0 would become
   * "window:arrival:50" while offsetMs stayed 50 — a cell whose id and offset
   * disagree is a cell the gate rejects, and it would be rejected an hour of
   * measurement later.
   */
  if (!values.length || !values.every((v) => /^(0|[1-9]\d*)$/.test(v))) die(`--offsets ${family}: every offset must be a whole number of milliseconds, 0 or more`);
  const offsets = [...new Set(values.map(Number))].sort((a, b) => a - b);
  OFFSETS[family] = offsets;
  OFFSET_OVERRIDES.add(family);
}
/* A whole number of 1 or more, or the script stops: `Number("ten")` is NaN, which ran nothing and was not labelled SMOKE. */
const intOpt = (name, fallback) => {
  const raw = opt(name, String(fallback));
  if (!/^[1-9]\d*$/.test(raw)) {
    console.error(`--${name} must be a whole number of 1 or more, not ${JSON.stringify(raw)}`);
    process.exit(2);
  }
  return Number(raw);
};
/* Like intOpt, but 0 is allowed: `--trace-trials 0` runs no traced trials at all. */
const countOpt = (name, fallback) => {
  const raw = opt(name, String(fallback));
  if (!/^(0|[1-9]\d*)$/.test(raw)) die(`--${name} must be a whole number of 0 or more, not ${JSON.stringify(raw)}`);
  return Number(raw);
};
const RUNS = intOpt("runs", MIN_RUNS);
const TRIALS = intOpt("trials", MIN_TRIALS);
const TRACED = countOpt("trace-trials", TRACE_TRIALS);
const CONTROL_WAIT = intOpt("control-wait", CONTROL_WAIT_MS);
if (CONTROL_WAIT < 10_000) die(`--control-wait must be at least 10000 ms (D-033: a control trial waits at least ten seconds), not ${CONTROL_WAIT}`);
const OUT = opt("out", path.join("qa", "perf", "INP-estate3d.md"));
const JSON_OUT = opt("json", OUT.replace(/\.md$/, "") + ".json");
const GATE_JSON = argv.includes("--no-gate-json") ? null : opt("gate-json", GATE_RECORD_DEFAULT);
const ROOT = process.cwd();
const builds = [A && { label: "A", base: A.replace(/\/+$/, ""), expect3d: false }, B && { label: "B", base: B.replace(/\/+$/, ""), expect3d: true }].filter(Boolean);

const sleep = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));
const round = (n) => (n === null || n === undefined || Number.isNaN(n) ? null : Math.round(n));

/*
 * THE FINGERPRINT AND THE COMMIT, read before anything is measured: a record
 * whose fingerprint cannot be computed is a record the gate will refuse, and
 * finding that out now costs nothing while finding it out afterwards costs the
 * whole run. `estate3dFingerprint` is imported from the module that owns it
 * (src/lib/estate-3d-fingerprint.ts), never re-implemented here.
 */
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "estate-plan.json"), "utf8"));
let FINGERPRINT;
try {
  FINGERPRINT = estate3dFingerprint(ROOT, plan).fingerprint;
} catch (err) {
  die(`the tree's fingerprint could not be computed (${String(err.message).split("\n")[0]}). Run from the repository root with node_modules installed.`);
}
const COMMIT = (() => {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
})();
console.log(`tree ${FINGERPRINT} at ${COMMIT.slice(0, 7) || "(no commit)"}; gate record ${GATE_JSON ?? "(not written: --no-gate-json)"}`);

/*
 * THE BUILD ID EACH ARM SERVED. The App Router's HTML does not carry it (its
 * script URLs are content-hashed chunk names, not `/_next/static/<id>/...`), so
 * it is read from the distDir this harness's own two builds write: `.next` for
 * the public arm, `.next-estate3d` for the review arm, which is what
 * `scripts/estate3d-preview.mjs` builds.
 *
 * READING IT IS NOT KNOWING IT. This is a local file; the arm is an origin. The
 * pre-flight below asks the ORIGIN for the one file that only that dist dir
 * can serve, and refuses unless it answers — so the id in the record names a
 * build the arm demonstrably serves, rather than whatever this working tree
 * happens to have lying in `.next-estate3d`.
 */
function buildIdOf(build) {
  const file = path.join(ROOT, build.expect3d ? ".next-estate3d" : ".next", "BUILD_ID");
  try {
    return fs.readFileSync(file, "utf8").trim() || "unknown";
  } catch {
    return "unknown";
  }
}
const distOf = (build) => path.join(ROOT, build.expect3d ? ".next-estate3d" : ".next");

/*
 * IS THE BUILD OLDER THAN THE SOURCES IT WAS MADE FROM?
 *
 * The record's fingerprint is taken from the WORKING TREE, and then checked
 * against itself, so D-033's requirement 7 ("the fingerprint matches the tree")
 * was satisfied tautologically: edit a mount-path source, `content/estate-plan.json`
 * or one of the four fingerprinted packages after the review build is made and
 * before the hours-long run starts, and the committed record claims a
 * fingerprint for a tree that was never built and never measured. That is the
 * fingerprint the gate then opens on.
 *
 * An mtime is a floor and not a proof — a restored file keeps its old mtime,
 * which this repository has been bitten by before — but it catches the
 * realistic case for the cost of a few stats, and the alternative is nothing.
 */
function stalerThanBuild(build) {
  const buildIdFile = path.join(distOf(build), "BUILD_ID");
  let builtAt;
  try {
    builtAt = fs.statSync(buildIdFile).mtimeMs;
  } catch {
    return [`${path.relative(ROOT, buildIdFile)} is not there, so this arm was not built from this working tree`];
  }
  const sources = [
    ...mountPathFiles(ROOT),
    path.join("content", "estate-plan.json"),
    ...["three", "react", "react-dom", "next"].map((pkg) => path.join("node_modules", pkg, "package.json")),
  ];
  const newer = [];
  for (const rel of sources) {
    try {
      if (fs.statSync(path.join(ROOT, rel)).mtimeMs > builtAt) newer.push(rel);
    } catch {
      newer.push(`${rel} (cannot be read)`);
    }
  }
  return newer;
}

/*
 * A PRE-FLIGHT REQUEST, THROUGH `node:http` AND NOT `fetch`.
 *
 * `process.exit()` after a successful `fetch` ABORTS this process on this
 * machine instead of exiting: node 24 on Windows dies with
 * "Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), src\\win\\async.c"
 * and an exit code of 0xC0000409, because the keep-alive socket undici left in
 * its pool is torn down while it is still closing. Every refusal below is a
 * `die()` immediately after a request that succeeded, so every one of them
 * would have handed back a crash code instead of 2 — and the landed
 * "No server" branch, which exits after a 5xx, had the same fault. Reproduced
 * and isolated: two `fetch` calls then `process.exit(2)` aborts; the same two
 * through `node:http` exits 2.
 */
/* An AggregateError from happy-eyeballs has an empty `message` and its reasons in `errors`; "No server at … ()" says nothing. */
const why = (err) => [err?.message, ...(Array.isArray(err?.errors) ? err.errors.map((e) => e?.message || e?.code) : []), err?.code].filter(Boolean).join("; ") || String(err);
const probe = (url, method) =>
  new Promise((resolve, reject) => {
    const request = (url.startsWith("https:") ? https : http).request(url, { method }, (r) => {
      r.resume();
      r.on("end", () => resolve(r.statusCode ?? 0));
    });
    request.on("error", reject);
    request.end();
  });

for (const b of builds) {
  /*
   * NO SERVER IS A REFUSAL (2), NOT A MEASUREMENT (1). Nothing was measured and
   * nothing was written, so exiting 1 — which this file's own header defines as
   * "the record was written and the reader would reject it on the MEASUREMENT"
   * — told a wrapper the opposite of what happened. Every other pre-flight
   * refusal uses `die`. And only 5xx used to count as "no server", so an arm
   * answering 404 for the route passed the check and then failed trial by
   * trial for an hour.
   */
  let status;
  try {
    status = await probe(b.base + ROUTE, "HEAD");
  } catch (err) {
    die(`No server at ${b.base} (${why(err)}). Start it first.`);
  }
  if (!(status >= 200 && status < 300)) die(`No usable server at ${b.base}: ${ROUTE} answered HTTP ${status}, not 2xx.`);

  /*
   * THE ORIGIN MUST SERVE THE DIST DIR THE RECORD NAMES. `_buildManifest.js`
   * lives at `/_next/static/<BUILD_ID>/` in both dist dirs, so a 200 here is
   * the arm's own word that it is serving the build this tree just made — and
   * a `next start` another worktree left on this port answers 404. This
   * repository's memory is explicit that a port holder is never proof of
   * ownership; before this check the instrument had only a procedure.
   */
  const id = buildIdOf(b);
  if (id === "unknown") die(`arm ${b.label}: ${path.relative(ROOT, path.join(distOf(b), "BUILD_ID"))} could not be read, so nothing can say which build ${b.base} serves. Build it in this working tree first.`);
  const manifest = `${b.base}/_next/static/${id}/_buildManifest.js`;
  let served;
  try {
    served = await probe(manifest, "GET");
  } catch (err) {
    die(`arm ${b.label}: ${manifest} could not be fetched (${why(err)}), so ${b.base} cannot be shown to serve build ${id}.`);
  }
  if (!(served >= 200 && served < 300)) {
    die(
      `arm ${b.label}: ${b.base} answered HTTP ${served} for ${manifest}. It is not serving build ${id} from this working tree — check what is holding that port before measuring against it.`
    );
  }

  const stale = stalerThanBuild(b);
  if (stale.length) {
    die(
      `arm ${b.label}: ${stale.length} source(s) are newer than ${b.expect3d ? ".next-estate3d" : ".next"}/BUILD_ID, so the record's fingerprint would describe a tree this arm was not built from: ${stale.slice(0, 8).join(", ")}${stale.length > 8 ? `, and ${stale.length - 8} more` : ""}. Rebuild before measuring.`
    );
  }
}

/* ---- the in-page recorder --------------------------------------------- */
function recorder() {
  const sel = (n) => {
    if (!n || !n.tagName) return null;
    let s = n.tagName.toLowerCase();
    if (n.id) s += `#${n.id}`;
    /*
     * EVERY CLASS, NOT THE FIRST TWO. A window trial tells its trigger from its
     * measured input by this string: while it kept two classes,
     * `<span className="tabular estate-map-list-index">` was recognised only
     * because it happens to carry exactly two, and one more class on that span
     * would have made the trigger look like the measured interaction — in a
     * trial whose measured tap left no entry, the TRIGGER's latency would then
     * have been written as the window cell's figure, with status ok.
     */
    if (typeof n.className === "string" && n.className.trim()) s += `.${n.className.trim().split(/\s+/).join(".")}`;
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

/**
 * WINDOW TRIALS ONLY: every `estate3d:*` mark, reported to the harness
 * SYNCHRONOUSLY, in the task that wrote it.
 *
 * `performance.mark` is replaced before any page script with a wrapper that
 * calls the original and then logs the name and the mark's own `startTime`.
 * A PerformanceObserver cannot be used for this: each of the build's marks is
 * written at the TOP of the task that does that step's work, so an observer
 * callback would not run until the step was over, and an input fired "20 ms
 * after the renderer mark" would land after the renderer was built. The
 * DevTools protocol delivers a console message out of the renderer while the
 * renderer's main thread is still busy — the same mechanism the calibration
 * depends on — so the wrapper is how a blocked page can still say where it is.
 *
 * It costs the page one string concatenation and one console call per mark, on
 * both builds alike, and only on window trials.
 */
function anchorSignal(prefix) {
  const original = performance.mark.bind(performance);
  performance.mark = function (name, options) {
    const entry = original(name, options);
    if (typeof name === "string" && name.indexOf(prefix) === 0) {
      try {
        const at = entry && typeof entry.startTime === "number" ? entry.startTime : performance.now();
        console.log("estate-inp:mark " + name + " " + at);
      } catch {
        /* A console nothing is listening to is not a reason to break the page. */
      }
    }
    return entry;
  };
}

/**
 * The anchors the page announced, and a promise per anchor for the harness to
 * wait on. `at` is the harness's clock when the message arrived (what the
 * offset is slept from) and `pageMs` is the mark's own `startTime` (what the
 * ACHIEVED offset is computed from afterwards, in the page's own clock, so the
 * record never has to trust the delivery latency of a console message).
 */
function markWatcher(page) {
  const seen = new Map();
  const waiting = new Map();
  page.on("console", (message) => {
    const text = message.text();
    if (!text.startsWith("estate-inp:mark ")) return;
    const [, name, pageMs] = text.split(" ");
    if (!seen.has(name)) seen.set(name, { at: Date.now(), pageMs: Number(pageMs) });
    const waiters = waiting.get(name);
    if (waiters) {
      waiting.delete(name);
      for (const resolve of waiters) resolve(seen.get(name));
    }
  });
  return {
    seen,
    /** Resolves with the anchor, or null when it has not arrived within `timeoutMs`. */
    wait(name, timeoutMs) {
      if (seen.has(name)) return Promise.resolve(seen.get(name));
      return new Promise((resolve) => {
        const list = waiting.get(name) ?? [];
        list.push(resolve);
        waiting.set(name, list);
        setTimeout(() => resolve(seen.get(name) ?? null), timeoutMs);
      });
    },
  };
}

/** Every `estate3d:*` mark the page has, by name, in page milliseconds. */
const readMarks = (page, prefix) =>
  page.evaluate(
    (p) =>
      Object.fromEntries(
        performance
          .getEntriesByType("mark")
          .filter((m) => m.name.startsWith(p))
          .map((m) => [m.name, m.startTime])
      ),
    prefix
  );

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


/**
 * The interactions of a trial's OWN measurement window: grouped first, then
 * filtered, so an interaction is never split.
 *
 * Filtering the ENTRIES by time (what this script did while the load needed no
 * trigger) can cut an interaction in half: a tap's pointerdown may start before
 * `since` while its click entry — the worst of the group, and the one that
 * decides the figure — starts after it, and the two halves then read as one
 * fast interaction and one phantom. Now every entry is grouped by
 * interactionId and a group counts when the group's FIRST entry is at or after
 * `since`; the 1 ms of slack is the page clock's own resolution.
 */
const interactionsSince = (entries, since) => interactionsOf(entries).filter((i) => i.startTime >= since - 1);

/**
 * Whether the three.js chunk was requested in this page view.
 *
 * Every trial watches, not only the control: `fetched` is what makes a control
 * trial evidence (the gate refuses a control row that does not say), and on the
 * other cells it is the cheapest possible confirmation that the trial measured
 * the page it claims to have measured. The chunk is identified by the file name
 * the pin run found on B, and arm A is watched for that same name: A's build
 * contains no chunk carrying `WebGLRenderer` at all, so "not requested" there
 * is a fact and not an absence of evidence. With no pinned name — a pin that
 * failed — `fetched()` returns null, and a control trial that cannot say
 * whether the chunk was fetched is recorded invalid rather than guessed at.
 */
function watchChunk(cdp, chunkFile) {
  const urls = [];
  cdp.on("Network.requestWillBeSent", (e) => {
    if (chunkFile && e.request.url.includes(chunkFile)) urls.push(e.request.url);
  });
  return {
    urls,
    fetched: () => (chunkFile ? urls.length > 0 : null),
  };
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

/**
 * THE TRIGGER: the reader's first completed interaction, which is what starts
 * the load since 25f4e51 (a tap or click on a list number — not a link, not
 * inside the frame, so it does nothing else). Dispatched through CDP like every
 * other measured input, because it IS a measured input in the trigger cell.
 *
 * Returns the harness-clock moment the input was sent, or an `invalid` reason
 * when the target was not there to be tapped.
 */
async function sendTrigger(page, cdp, input, precomputed = null) {
  const target = page.locator(TRIGGER_TARGET).first();
  if (!(await target.isVisible().catch(() => false))) return { invalid: `no ${TRIGGER_TARGET} to trigger the load with` };
  /*
   * `precomputed` is the trigger's box read during a settle step that already
   * scrolled it into view. A window trial passes it because `centre()`'s
   * `scrollIntoViewIfNeeded` can SCROLL, and the trial's measured tap point was
   * read before this call: a scroll here would fire the measured input at
   * coordinates computed against a layout that is no longer current, possibly
   * over a list link, whose soft navigation the document-changed check does not
   * catch. Nothing between the point and the tap may move the page.
   */
  const at = precomputed ?? (await centre(target));
  if (!at) return { invalid: `${TRIGGER_TARGET} has no box to tap` };
  const url = page.url();
  const m = await mark(page);
  const sentAt = Date.now();
  const pending = input(cdp, at.x, at.y);
  pending.catch(() => {});
  return { sentAt, since: m.since, countBefore: m.countBefore, pending, url, at };
}

/**
 * Load, settle as hotel-cwv does, bring the map into range, trigger the load,
 * and wait for the diagram when this build should mount it.
 *
 * THE TRIGGER IS NOT OPTIONAL ON B ANY MORE. Before 25f4e51 the diagram loaded
 * on visibility alone and this function only scrolled; now a page that is never
 * interacted with never requests three.js, which is what the control cell
 * exists to prove. `trigger: false` is that cell, and nothing else.
 */
async function loadAndSettle(page, cdp, input, build, { trigger = true } = {}) {
  await page.goto(build.base + ROUTE, { waitUntil: "load", timeout: 120_000 });
  await page.waitForTimeout(2500);
  await page.evaluate(() => document.querySelector(".estate-map-frame")?.scrollIntoView({ block: "center" }));
  const out = { mode: "2d", triggered: null };
  if (trigger) {
    const t = await sendTrigger(page, cdp, input);
    if (t.invalid) return { ...out, invalid: t.invalid };
    out.triggered = t;
    await t.pending.catch(() => {});
    if (page.url() !== t.url) return { ...out, invalid: `the trigger navigated to ${pathOf(page)}` };
  }
  /*
   * ONLY A TRIGGERED PAGE IS WAITED FOR. A control trial never triggers, so the
   * diagram never mounts, and waiting for it spent sixty seconds per control
   * trial waiting for something that must not happen — ten minutes per profile
   * in a measurement of record, and a `waitedMs` in the record that understated
   * how long the page had actually been watched.
   */
  if (build.expect3d && trigger) {
    out.mode = await page
      .locator(".estate-map-frame--3d[data-placed]")
      .waitFor({ state: "visible", timeout: 60_000 })
      .then(() => "3d")
      .catch(() => "2d");
  }
  await page.waitForTimeout(1500);
  return out;
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
  "canvas-tap": {
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

async function fixedTrial(browser, profileName, build, scenario, chunkFile) {
  const { context, page, cdp, input } = await openContext(browser, profileName);
  const chunk = watchChunk(cdp, chunkFile);
  const rec = { kind: "fixed", profile: profileName, build: build.label, scenario, status: "ok" };
  try {
    const loaded = await loadAndSettle(page, cdp, input, build);
    rec.mode = loaded.mode;
    rec.fetched = chunk.fetched();
    if (loaded.invalid) {
      rec.status = "invalid";
      rec.reason = loaded.invalid;
      return rec;
    }
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
    rec.fetched = chunk.fetched();
    const list = interactionsSince(after.entries, r.since);
    const worst = inpOf(list);
    const pageWorst = inpOf(interactionsOf(after.entries));
    const countDelta = after.interactionCount !== null && r.countBefore !== null ? after.interactionCount - r.countBefore : null;
    Object.assign(rec, {
      dispatched: r.dispatched,
      recorded: list.length,
      /*
       * NOT `under16`. The record's `under16` is a BOOLEAN the gate
       * type-checks; this is a COUNT, on the raw row only, and nothing reads it
       * (the report recomputes its own "<16 ms" column). Under the old name it
       * shipped in qa/perf/INP-estate3d.json beside the record's `under16:
       * true`, and it was one `extras` line away from putting a number where
       * `trialProblem` requires a boolean.
       */
      trialsWithNoEntry: Math.max(0, r.dispatched - list.length),
      interactionCountDelta: countDelta,
      inp: worst ? round(worst.latency) : null,
      pageWorst: pageWorst ? round(pageWorst.latency) : null,
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

/**
 * THE NO-INTERACTION CONTROL (D-033). A page view that dispatches nothing at
 * all: loaded, settled, scrolled so the map section is well inside the
 * observer's 600 px range, and then left alone for at least ten seconds.
 *
 * WHAT IT PROVES, AND WHY THE RECORD IS WEAKER WITHOUT IT. Every other cell
 * measures a tap on a page that is loading or has loaded three.js. None of them
 * can tell the difference between "the load waits for the reader" and "the load
 * happens anyway and the taps are simply fast". This cell can: a programmatic
 * scroll is `scroll`, which the loader counts as ACTIVITY but never as a
 * TRIGGER, so a correct page requests nothing, records no Event Timing entry
 * and never raises `performance.interactionCount`.
 *
 * It is checked three ways rather than one, because each catches something the
 * others do not: no chunk request (the network), no `estate3d:import-start`
 * mark and a stage still in phase `2d` (the page's own account of itself), and
 * no interaction (Event Timing, plus the browser's interaction count).
 */
async function controlTrial(browser, profileName, build, chunkFile) {
  const { context, page, cdp, input } = await openContext(browser, profileName);
  const chunk = watchChunk(cdp, chunkFile);
  const rec = { kind: "control", profile: profileName, build: build.label, status: "ok", dispatched: 0 };
  try {
    const loaded = await loadAndSettle(page, cdp, input, build, { trigger: false });
    rec.mode = loaded.mode;
    await page.waitForTimeout(CONTROL_WAIT);
    const after = await readRecorder(page).catch(() => null);
    if (!after) {
      rec.status = "lost";
      rec.reason = "the recorder could not be read";
      return rec;
    }
    const marks = await readMarks(page, ESTATE3D_MARK_PREFIX).catch(() => ({}));
    rec.fetched = chunk.fetched();
    rec.waitedMs = CONTROL_WAIT;
    rec.phase = await page
      .locator(".estate-map-stage")
      .first()
      .getAttribute("data-state")
      .catch(() => null);
    rec.marks = Object.keys(marks);
    const list = interactionsOf(after.entries);
    Object.assign(rec, {
      recorded: list.length,
      interactionCountDelta: after.interactionCount,
      inp: null,
      pageWorst: list.length ? round(inpOf(list).latency) : null,
    });
    const problems = [];
    if (list.length) problems.push(`${list.length} Event Timing interaction(s) on a page that was never touched`);
    if (after.interactionCount) problems.push(`the browser counted ${after.interactionCount} interaction(s)`);
    if (rec.fetched === null) problems.push("the three.js chunk was not pinned, so this trial cannot say whether it was fetched");
    else if (rec.fetched) problems.push("three.js was requested with no interaction");
    if (marks[ESTATE3D_MARK.importStart] !== undefined) problems.push(`the page reached ${ESTATE3D_MARK.importStart} with no interaction`);
    if (marks[ESTATE3D_MARK.trigger] !== undefined) problems.push(`the page reached ${ESTATE3D_MARK.trigger} with no interaction`);
    if (rec.phase !== null && rec.phase !== "2d") problems.push(`the stage left phase 2d (data-state=${rec.phase})`);
    if (problems.length) {
      rec.status = "invalid";
      rec.reason = problems.join("; ");
    }
  } catch (err) {
    rec.status = "error";
    rec.reason = String(err.message).split("\n")[0];
  } finally {
    await context.close();
  }
  return rec;
}

/**
 * THE TRIGGER CELL (D-033). The first interaction on the page is now the one
 * that starts the load, so its own latency is a measured cell: 10 valid trials
 * per profile.
 *
 * Nothing of the load has begun when it is dispatched — the quiet second and
 * the idle callback come after it — so this is the cheapest interaction on the
 * page and the cell that says what a tap costs on the 2D page the public is
 * served. It is still a cell the gate can fail: it is an interaction on a page
 * whose hydration may not be finished.
 *
 * The wait is deliberately short. The chunk arrives about a second later, and
 * the point here is the trigger's own figure, not the phases that follow.
 */
async function triggerTrial(browser, profileName, build, chunkFile) {
  const { context, page, cdp, input } = await openContext(browser, profileName);
  const chunk = watchChunk(cdp, chunkFile);
  const rec = { kind: "trigger", profile: profileName, build: build.label, status: "ok" };
  try {
    await page.goto(build.base + ROUTE, { waitUntil: "load", timeout: 120_000 });
    await page.waitForTimeout(2500);
    await page.evaluate(() => document.querySelector(".estate-map-frame")?.scrollIntoView({ block: "center" }));
    const before = await readRecorder(page);
    const t = await sendTrigger(page, cdp, input);
    if (t.invalid) {
      rec.status = "invalid";
      rec.reason = t.invalid;
      return rec;
    }
    await page.waitForTimeout(2500);
    await t.pending.catch(() => {});
    const after = await readRecorder(page).catch(() => null);
    if (!after || after.doc !== before.doc) {
      rec.status = "lost";
      rec.reason = after ? "the trigger changed the document" : "the recorder could not be read";
      return rec;
    }
    const marks = await readMarks(page, ESTATE3D_MARK_PREFIX).catch(() => ({}));
    rec.fetched = chunk.fetched();
    rec.marks = Object.keys(marks);
    const list = interactionsSince(after.entries, t.since);
    const worst = inpOf(list);
    const countDelta = after.interactionCount !== null && t.countBefore !== null ? after.interactionCount - t.countBefore : null;
    Object.assign(rec, {
      dispatched: 1,
      recorded: list.length,
      interactionCountDelta: countDelta,
      inp: worst ? round(worst.latency) : null,
      pageWorst: worst ? round(worst.latency) : null,
      worst: worst ? { types: worst.types, target: worst.target, split: mapSplit(worst.split) } : null,
    });
    const problems = [];
    if (countDelta !== null && countDelta < 1) problems.push("the browser counted no interaction for the trigger");
    /*
     * ON B THE TRIGGER MUST HAVE BEEN THE TRIGGER. Without `estate3d:trigger`
     * the tap reached the page but did not start the load, so whatever was
     * measured is not this cell. On A there is no loader to mark anything.
     */
    if (build.expect3d && marks[ESTATE3D_MARK.trigger] === undefined) problems.push(`the tap left no ${ESTATE3D_MARK.trigger} mark: it did not start the load`);
    if (problems.length) {
      rec.status = "invalid";
      rec.reason = problems.join("; ");
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
    /*
     * THE FEATURES THE RECORD DECLARES (D-033's `features` block). Probed in
     * the calibration's own page view rather than guessed from a mark's detail,
     * so a profile whose window cells never ran still carries them: the GPU
     * path decides what the first frame costs, and the three scheduling
     * features decide the shape of the load the record measured.
     */
    rec.gpu = await page.evaluate(() => {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl2");
      const scheduling = {
        requestIdleCallback: typeof window.requestIdleCallback === "function",
        schedulerYield: typeof globalThis.scheduler?.yield === "function",
      };
      if (!gl) return { webgl2: false, khrParallelShaderCompile: false, ...scheduling };
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      const out = {
        webgl2: true,
        vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
        renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        unmasked: !!ext,
        khrParallelShaderCompile: !!gl.getExtension("KHR_parallel_shader_compile"),
        ...scheduling,
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

/* ---- the window families ------------------------------------------------ */

/**
 * ONE PIN RUN PER PROFILE, ON B, before any window trial: it finds the three.js
 * chunk, reads every `estate3d:*` mark the load emits and the chunk's own
 * Resource Timing, and turns them into the delay from the trigger to each
 * family's anchor.
 *
 * IT IS ALSO THE TEST THAT A RENAMED MARK CANNOT BE MEASURED SILENTLY. Six of
 * the eight families anchor on a mark named in
 * `src/components/sections/estate-map-3d-marks.ts`. If the page does not emit
 * one of them, `missingAnchors` names it, the harness refuses to run that
 * profile's window cells and exits non-zero. The alternative — waiting for an
 * anchor that never comes — would produce twenty invalid trials per cell and a
 * record that says nothing about why.
 *
 * The chunk is found by its body: it is the only script that contains
 * `WebGLRenderer`.
 */
async function pinRun(browser, profileName, build) {
  const { context, page, cdp, input } = await openContext(browser, profileName);
  try {
    const scripts = new Map();
    cdp.on("Network.responseReceived", (e) => {
      if (e.type === "Script" || /\.js(\?|$)/.test(e.response.url)) scripts.set(e.requestId, { url: e.response.url });
    });
    const finished = [];
    cdp.on("Network.loadingFinished", (e) => {
      if (scripts.has(e.requestId)) finished.push({ requestId: e.requestId, at: Date.now(), bytes: e.encodedDataLength });
    });
    const loaded = await loadAndSettle(page, cdp, input, build);
    const pin = { profile: profileName, mode: loaded.mode, missingAnchors: [] };
    if (loaded.invalid) return { ...pin, error: loaded.invalid };
    if (loaded.mode !== "3d") return { ...pin, error: "the 3D diagram did not mount, so nothing can be pinned" };

    const marks = await readMarks(page, ESTATE3D_MARK_PREFIX);
    pin.marks = marks;
    const triggerMs = marks[ESTATE3D_MARK.trigger];
    if (typeof triggerMs !== "number") return { ...pin, error: `the page emitted no ${ESTATE3D_MARK.trigger} mark` };

    for (const f of INP_WINDOW_FAMILIES) {
      const name = WINDOW_ANCHOR[f];
      if (name !== null && marks[name] === undefined) pin.missingAnchors.push(`${f} (${name})`);
    }

    for (const f of finished) {
      const { body, base64Encoded } = await cdp.send("Network.getResponseBody", { requestId: f.requestId }).catch(() => ({ body: "" }));
      const text = base64Encoded ? Buffer.from(body, "base64").toString("utf8") : body;
      if (!text.includes("WebGLRenderer")) continue;
      const url = scripts.get(f.requestId).url;
      pin.file = new URL(url).pathname.split("/").pop();
      pin.transferBytes = f.bytes;
      pin.decodedBytes = Buffer.byteLength(text);
      break;
    }
    if (!pin.file) return { ...pin, error: "no script in this page view carried WebGLRenderer" };

    /* The chunk in the page's own clock: `startTime` is when the request went out, `responseEnd` when the last byte arrived. */
    pin.resource = await page.evaluate((file) => {
      const e = performance.getEntriesByType("resource").find((r) => r.name.includes(file));
      return e ? { startMs: e.startTime, responseEndMs: e.responseEnd, transferSize: e.transferSize, decodedBodySize: e.decodedBodySize } : null;
    }, pin.file);
    if (!pin.resource) return { ...pin, error: `the page has no Resource Timing entry for ${pin.file}` };

    /*
     * THE DELAY FROM THE TRIGGER TO EACH ANCHOR, which is the only thing arm A
     * can be measured against: A has no chunk and emits no marks, so its
     * trials fire at these delays after their own trigger. Measured from B's
     * `estate3d:trigger` MARK, while A adds them to the moment its trigger
     * input was SENT — the difference is that input's own delay, a few
     * milliseconds on a settled page, and the record names the anchor so the
     * approximation is visible rather than implied.
     */
    pin.triggerMs = triggerMs;
    pin.anchorDelays = {};
    for (const f of INP_WINDOW_FAMILIES) {
      const name = WINDOW_ANCHOR[f];
      const at = name === null ? (f === "request" ? pin.resource.startMs : pin.resource.responseEndMs) : marks[name];
      pin.anchorDelays[f] = typeof at === "number" ? Math.max(0, round(at - triggerMs)) : null;
    }
    return pin;
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

/**
 * ONE WINDOW TRIAL: trigger the load, wait for this family's anchor, and fire
 * ONE non-awaited input `offset` milliseconds after it.
 *
 * NOTHING IS EVALUATED IN THE PAGE BETWEEN THE ANCHOR AND THE INPUT. A
 * `page.evaluate` needs the main thread, and the main thread is precisely what
 * this cell exists to catch being busy: asking the page what time it is would
 * wait for the task the input is supposed to land in. So the tap point and the
 * page's clock are read while the page is still idle, before the trigger, and
 * the measured interaction is picked out afterwards by the page time the input
 * was sent at (mapped from the harness's clock, with 2 ms of slack).
 *
 * THE FIGURE IS THE MEASURED INPUT'S, NOT THE TRIGGER'S. Both are real inputs
 * in this page view; the trigger has a cell of its own, and counting it inside
 * every window cell would make all eight families a measurement of the trigger.
 * `pageWorstMs` and `triggerInpMs` carry it for the record's reader anyway.
 */
async function windowTrial(browser, profileName, build, family, offset, pin, { traced = false } = {}) {
  const { context, page, cdp, input } = await openContext(browser, profileName);
  const chunkFile = pin?.file ?? null;
  const chunk = watchChunk(cdp, chunkFile);
  const rec = { kind: "window", profile: profileName, build: build.label, family, offset, status: "ok", traced };
  let tracing = false;
  try {
    if (build.expect3d && !chunkFile && (family === "request" || family === "arrival")) {
      /* Without a pinned chunk these two families can only wait out their timeout and be recorded invalid: 90 s per trial for a row that was doomed before it started. */
      rec.status = "invalid";
      rec.reason = `the three.js chunk was not pinned, so the ${family} anchor cannot be recognised`;
      return rec;
    }
    await context.addInitScript(anchorSignal, ESTATE3D_MARK_PREFIX);
    if (traced) await context.addInitScript(canvasMark);
    const anchors = markWatcher(page);
    /*
     * THE TWO NETWORK ANCHORS, IN THE BROWSER'S OWN CLOCK, NOT THE HARNESS'S.
     *
     * `Date.now()` in the handler is when NODE heard about the event, which is
     * late by the protocol's delivery latency and never early. CDP gives the
     * real instants: `Network.requestWillBeSent` carries both `wallTime`
     * (epoch seconds, the same system clock as `Date.now()`) and `timestamp`
     * (a monotonic clock), and `Network.loadingFinished` carries `timestamp`.
     * One pairing of the two on the request fixes the offset between them, so
     * the arrival is placed on the system clock with no delivery latency at all.
     */
    const requestIds = new Set();
    let monotonicToWall = null;
    let arrivedAt = null;
    const requestSeen = new Promise((resolve) => {
      cdp.on("Network.requestWillBeSent", (e) => {
        if (!chunkFile || !e.request.url.includes(chunkFile) || requestIds.size) return;
        requestIds.add(e.requestId);
        const heardAt = Date.now();
        const wall = typeof e.wallTime === "number" ? e.wallTime * 1000 : null;
        if (wall !== null && typeof e.timestamp === "number") monotonicToWall = wall - e.timestamp * 1000;
        resolve({ at: wall ?? heardAt, heardAt, exact: wall !== null });
      });
    });
    const arrivalSeen = new Promise((resolve) => {
      cdp.on("Network.loadingFinished", (e) => {
        if (!requestIds.has(e.requestId) || arrivedAt !== null) return;
        const heardAt = Date.now();
        arrivedAt = monotonicToWall !== null && typeof e.timestamp === "number" ? e.timestamp * 1000 + monotonicToWall : heardAt;
        resolve({ at: arrivedAt, heardAt, exact: monotonicToWall !== null });
      });
    });

    if (traced) {
      await cdp.send("Tracing.start", { transferMode: "ReturnAsStream", traceConfig: { recordMode: "recordAsMuchAsPossible", includedCategories: TRACE_CATEGORIES } });
      tracing = true;
    }
    await page.goto(build.base + ROUTE, { waitUntil: "load", timeout: 120_000 });
    await page.waitForTimeout(2500);
    const before = await readRecorder(page);

    /*
     * THE LAYOUT IS SETTLED BEFORE THE TAP POINT IS READ, not after.
     *
     * The frame is centred and the trigger scrolled into view FIRST, and the
     * trigger's box is then handed to `sendTrigger` so that nothing between
     * this point and the measured tap can scroll the page. Before this, the
     * point was read after centring the frame and `centre(trigger)` could
     * scroll afterwards (13 px at desktop 1440×900 in a synthetic page with
     * this section's box model), so the stored coordinates and the `inControl`
     * check both described a layout that was no longer current.
     */
    await page.evaluate(() => document.querySelector(".estate-map-frame")?.scrollIntoView({ block: "center" }));
    const triggerBox = await centre(page.locator(TRIGGER_TARGET).first()).catch(() => null);
    const point = await page.evaluate(() => {
      const f = document.querySelector(".estate-map-frame");
      const r = f.getBoundingClientRect();
      const x = r.left + r.width * 0.5;
      const y = r.top + r.height * 0.92;
      const hit = document.elementFromPoint(x, y);
      return { x, y, at: hit ? hit.tagName.toLowerCase() : null, inControl: !!(hit && hit.closest("a, button")), scrollY: window.scrollY };
    });
    rec.target = point.at;
    if (point.inControl) {
      rec.status = "invalid";
      rec.reason = "the point at the bottom of the frame is inside a link or a button";
      return rec;
    }
    /*
     * THE PAGE'S CLOCK AGAINST THE HARNESS'S, best of a few reads.
     *
     * A `page.evaluate` on a throttled renderer is answered LATE inside its
     * round trip, so the midpoint of "sent" and "returned" is later than the
     * instant the page actually read its clock, and every page time derived
     * from one sample is overestimated by as much as the renderer was behind.
     * The sample with the SHORTEST round trip is the one least able to be
     * wrong, and its error is bounded by half of that round trip — which the
     * row records, so a reader can see how much the mapping is worth.
     *
     * It is used for two things and no others: arm A's `anchorPageMs` (A emits
     * no marks, so it has no page time of its own), and the delivery latency of
     * a mark's console message, below. It is NEVER used to decide which
     * interaction was measured — that cost every phone window trial its figure
     * once already.
     */
    let best = null;
    for (let i = 0; i < 5; i++) {
      const sentAt = Date.now();
      const pageNow = await page.evaluate(() => performance.now());
      const rtt = Date.now() - sentAt;
      if (!best || rtt < best.rtt) best = { rtt, pageClock: pageNow, clockAt: sentAt + rtt / 2 };
    }
    const { pageClock, clockAt } = best;
    rec.clockRoundTripMs = round(best.rtt);
    const toPage = (wall) => pageClock + (wall - clockAt);
    const toWall = (pageMs) => clockAt + (pageMs - pageClock);

    const t = await sendTrigger(page, cdp, input, triggerBox);
    if (t.invalid) {
      rec.status = "invalid";
      rec.reason = t.invalid;
      return rec;
    }
    await t.pending.catch(() => {});
    rec.triggerSentAt = t.sentAt;

    /* ---- the anchor ------------------------------------------------------ */
    /*
     * THE ANCHOR IS WHEN THE PHASE HAPPENED, NOT WHEN THE HARNESS HEARD OF IT.
     *
     * A mark reaches the harness as a console message, 1–15 ms after it was
     * written by this script's own measurement. Sleeping `offset` from the
     * moment the MESSAGE arrived fired every trial that much late, on every
     * family, never early — and later means waiting for less of the phase, so
     * the bias flattered exactly the cells that decide the gate. The mark
     * carries its own `startTime`, so the latency is the difference between
     * that (mapped to the harness's clock) and the arrival, and it is
     * subtracted. `anchorSignalLatencyMs` travels with the row so the
     * correction can be argued with.
     */
    let anchorAt = null;
    let anchorPageMs = null;
    let anchorEstimated = false;
    let signalLatency = null;
    if (build.expect3d) {
      if (family === "request" || family === "arrival") {
        const got = await Promise.race([family === "request" ? requestSeen : arrivalSeen, sleep(90_000).then(() => null)]);
        if (got === null) {
          rec.status = "invalid";
          rec.reason = `the three.js chunk's ${family === "request" ? "request" : "arrival"} never happened`;
          return rec;
        }
        anchorAt = got.at;
        signalLatency = round(got.heardAt - got.at);
        rec.anchorFromBrowserClock = got.exact;
        rec.anchor = `three.js ${family === "request" ? "Network.requestWillBeSent" : "Network.loadingFinished"}`;
      } else {
        const name = WINDOW_ANCHOR[family];
        const got = await anchors.wait(name, 90_000);
        if (!got) {
          rec.status = "invalid";
          rec.reason = `the page never emitted ${name}`;
          return rec;
        }
        anchorPageMs = got.pageMs;
        const markWall = Number.isFinite(got.pageMs) ? toWall(got.pageMs) : null;
        /* Clamped to [0, 60]: a negative latency can only be the clock mapping's own error, and a huge one would move the input out of the phase entirely. */
        signalLatency = markWall === null ? 0 : Math.min(60, Math.max(0, round(got.at - markWall)));
        anchorAt = got.at - signalLatency;
        rec.anchor = `the page's ${name} mark`;
      }
    } else {
      const delay = pin?.anchorDelays?.[family];
      if (typeof delay !== "number") {
        rec.status = "invalid";
        rec.reason = `arm A has no ${family} anchor: the pin run on B measured none`;
        return rec;
      }
      anchorAt = t.sentAt + delay;
      anchorPageMs = toPage(anchorAt);
      anchorEstimated = true;
      rec.anchor = `the trigger + ${delay} ms (B's pin run measured that delay to ${WINDOW_ANCHOR[family] ?? `the chunk's ${family}`}; A has neither the chunk nor the marks)`;
    }
    rec.anchorSignalLatency = signalLatency;

    /* ---- the measured input --------------------------------------------- */
    await sleep(anchorAt + offset - Date.now());
    const firedAt = Date.now();
    rec.firedAfterAnchorMs = firedAt - anchorAt;
    const pending = input(cdp, point.x, point.y);
    pending.catch(() => {});
    await page.waitForTimeout(4000);
    await pending.catch(() => {});

    const after = await readRecorder(page).catch(() => null);
    const events = tracing ? await readTrace(cdp) : null;
    tracing = false;
    if (!after || after.doc !== before.doc) {
      rec.status = "lost";
      rec.reason = after ? "the document changed" : "the recorder could not be read";
      return rec;
    }
    const marks = await readMarks(page, ESTATE3D_MARK_PREFIX).catch(() => ({}));
    rec.fetched = chunk.fetched();
    /* On B the anchor's page time is the mark's own; for the two network families it comes from the page's Resource Timing afterwards. */
    if (build.expect3d && (family === "request" || family === "arrival")) {
      const resource = await page
        .evaluate((file) => {
          const e = performance.getEntriesByType("resource").find((r) => r.name.includes(file));
          return e ? { startMs: e.startTime, responseEndMs: e.responseEnd } : null;
        }, chunkFile)
        .catch(() => null);
      if (resource) anchorPageMs = family === "request" ? resource.startMs : resource.responseEndMs;
      rec.resource = resource;
    }

    /*
     * WHICH INTERACTION IS THE MEASURED ONE — by its TARGET, not by a clock.
     *
     * The first version mapped the harness's clock onto the page's with one
     * `performance.now()` read before the trigger, and asked which interactions
     * started after the moment the input was sent. On the desktop profile that
     * worked; on the phone profile it put EVERY window trial's measured
     * interaction on the wrong side of the line, so all sixteen came back "no
     * Event Timing entry, the input was counted" — an under-16 pass invented out
     * of a bad clock, with the real figure (72 to 264 ms) sitting in
     * `pageWorstMs` where nothing read it. The cause is that a `page.evaluate`
     * on a throttled renderer is answered LATE inside its round trip, so the
     * midpoint of "sent" and "returned" is later than the instant the page
     * actually read its clock, and every page time derived from it is
     * overestimated by as much as the renderer was behind.
     *
     * The two inputs of a window trial land on different elements and always
     * will: the trigger on a list number (`.estate-map-list-index`), the
     * measured input inside the frame. Event Timing carries each entry's target,
     * so the split needs no clocks at all. If the trigger's group has no target
     * to recognise (its node can be replaced at the swap), the groups are
     * ordered in time and the first is the trigger.
     */
    const all = interactionsOf(after.entries);
    /* `isTriggerTarget` matches the class as a WHOLE class, out of the full list the recorder now spells; the spec pins it, because this is the one fact that decides which of a window trial's two inputs becomes the cell's figure. */
    const isTrigger = (i) => isTriggerTarget(i.target);
    let measured = all.filter((i) => !isTrigger(i));
    let triggerOne = all.find(isTrigger) ?? null;
    if (!triggerOne && all.length > 1) {
      /* No target to recognise: the inputs are ordered, so the first group is the trigger's. */
      triggerOne = all[0];
      measured = all.slice(1);
      rec.triggerByOrder = true;
    }
    const worst = inpOf(measured);
    const pageWorst = inpOf(all);
    const countDelta = after.interactionCount !== null && t.countBefore !== null ? after.interactionCount - t.countBefore : null;
    /*
     * WHERE THE INPUT WAS SENT, in the page's clock, for a trial that left no
     * entry to measure the achieved offset from. Both `firedAt` and `anchorAt`
     * are the harness's clock, so the difference cancels every clock question
     * except the anchor signal's own delivery latency (1 to 15 ms, measured).
     */
    const sentOffset = round(firedAt - anchorAt);

    /*
     * WHAT THE CELL CLAIMS TO HAVE SAMPLED, checked against what it did.
     *
     * The phase a family is named for ends at the mark that follows its anchor
     * (`phaseEndMarkOf`, derived from ESTATE3D_MARK_ORDER so it cannot drift
     * from the mark names); `request` ends when the chunk's last byte arrives
     * and `arrival` at `estate3d:import-end`. Both times are read from the page
     * AFTERWARDS, in the page's own clock, so nothing here costs the trial a
     * main-thread round trip while it is being measured.
     */
    const phaseEndMark = family === "request" ? null : phaseEndMarkOf(family);
    let phaseEndPageMs = null;
    if (family === "request") phaseEndPageMs = rec.resource?.responseEndMs ?? null;
    else if (phaseEndMark && typeof marks[phaseEndMark] === "number") phaseEndPageMs = marks[phaseEndMark];
    const phaseMs = phaseEndPageMs !== null && anchorPageMs !== null ? round(phaseEndPageMs - anchorPageMs) : null;
    const achieved = worst && anchorPageMs !== null ? round(worst.startTime - anchorPageMs) : null;
    /* A trial with no Event Timing entry has no page time for its input, so where it was SENT is the only evidence left — and now that the anchor is corrected, that is evidence and not an artefact of the signal's latency. */
    const landedAt = achieved !== null ? achieved : sentOffset;
    const inPhase = phaseMs === null || landedAt === null ? null : landedAt >= -OFFSET_TOLERANCE_MS && landedAt < phaseMs;

    Object.assign(rec, {
      phaseEndMark: phaseEndMark ?? (family === "request" ? "the chunk's last byte (Resource Timing)" : null),
      phaseEndPageMs: phaseEndPageMs === null ? null : round(phaseEndPageMs),
      phaseMs,
      inPhase,
      inPhaseFrom: inPhase === null ? null : achieved !== null ? "entry" : "sent",
      measuredTarget: worst?.target ?? null,
    });
    Object.assign(rec, {
      /* The trigger and the measured input: both were dispatched in this page view, and the under-16 rule asks the browser to have counted both. */
      dispatched: 2,
      measuredDispatched: 1,
      recorded: measured.length,
      interactionCountDelta: countDelta,
      inp: worst ? round(worst.latency) : null,
      pageWorst: pageWorst ? round(pageWorst.latency) : null,
      triggerInp: triggerOne ? round(triggerOne.latency) : null,
      anchorPageMs: anchorPageMs === null ? null : round(anchorPageMs),
      anchorEstimated,
      offsetAchieved: achieved,
      /* Where the input was SENT relative to the CORRECTED anchor: recorded on every row, so a trial with no entry still says where it landed. */
      offsetSent: sentOffset,
      worst: worst ? { types: worst.types, target: worst.target, split: mapSplit(worst.split) } : null,
      class: !worst
        ? "under 16 ms (no entry; the input was counted)"
        : events
          ? classify(traceModel(events, build.base, after.origin), worst, build.expect3d ? chunkFile : null)
          : "not traced (the figure of record is measured without a trace)",
      classWindow: worst ? worst.window : null,
      /* The marks themselves, not a count of them: the count discarded the following mark's time, and with it any way to check afterwards whether a trial fell inside its phase. */
      marks,
      mounted3d: await page
        .locator(".estate-map-frame--3d")
        .count()
        .then((n) => n > 0)
        .catch(() => null),
    });
    const problems = [];
    if (!worst && !(countDelta >= 2)) {
      problems.push(
        countDelta === null
          ? "no Event Timing entry, and this browser has no interaction count to confirm the input landed"
          : `no Event Timing entry, and the browser counted ${countDelta} of the 2 inputs dispatched (the trigger and the measured one)`
      );
      delete rec.class;
    }
    /*
     * A TRIAL MUST HAVE LANDED WHERE ITS CELL ID SAYS. `window:renderer:0` is a
     * claim about where the tap was, and a cell whose twenty taps all landed
     * 20 ms into a 37 ms phase is not that cell — it is a different, easier
     * measurement wearing the same name. Arm A's anchor is an estimate by
     * construction (the pin run's delay, not A's own event), so the check is on
     * B, which is the arm the gate reads.
     */
    const signed = (n) => `${n >= 0 ? "+" : ""}${n}`;
    if (!anchorEstimated && landedAt !== null && Math.abs(landedAt - offset) > OFFSET_TOLERANCE_MS) {
      problems.push(`the input landed ${signed(landedAt)} ms from the anchor, not +${offset} ms (tolerance ${OFFSET_TOLERANCE_MS} ms)`);
    }
    if (!anchorEstimated && landedAt === null) {
      problems.push("nothing places this trial's input relative to its anchor, so the cell cannot say it sampled its phase");
    }
    if (!anchorEstimated && inPhase === false) {
      problems.push(`the input landed outside the ${family} phase (${signed(landedAt)} ms into a phase of ${phaseMs} ms)`);
    }
    /*
     * WHAT THE TAP ACTUALLY HIT. The point is checked against
     * `elementFromPoint` before the trigger, while the page still shows the 2D
     * photograph. In the `swap` family, and at late `layout` offsets, the input
     * lands at or after the task that places the labels, when the same
     * coordinates may sit over a `.estate-map-3d-button` — and the cell would
     * then be measuring a tap that opens a card. Event Timing already carries
     * the target the figure came from; this reads it.
     */
    if (hitAControl(rec.measuredTarget)) {
      problems.push(`the measured input landed on a control (${rec.measuredTarget}), not on an empty part of the frame`);
    }
    if (problems.length) {
      rec.status = "invalid";
      rec.reason = problems.join("; ");
    }
    /*
     * A TRACED TRIAL IS EVIDENCE ABOUT THE PHASE, NEVER A FIGURE OF RECORD.
     * Tracing inflates task durations and Event Timing's `duration` runs to the
     * next paint, so a traced trial reports a LARGER INP than the same tap
     * untraced (+18.7 % on this machine's workload). Its `class` is what it is
     * for; its number is recorded and marked `na`, which the gate skips.
     */
    if (traced && rec.status === "ok") {
      rec.status = "n/a";
      rec.reason = "traced for the classification only; tracing inflates the figure, so this trial is not one of record";
    }
  } catch (err) {
    rec.status = "error";
    rec.reason = String(err.message).split("\n")[0];
  } finally {
    if (tracing) await readTrace(cdp).catch(() => {});
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
const refusals = [];
/**
 * A REFUSAL STOPS THE RUN WHERE IT IS RAISED.
 *
 * They used to be collected before any trial of a profile and printed after
 * every trial of every profile. With no pinned chunk, every control trial is
 * invalid by construction and every `request`/`arrival` window trial waits out
 * a 90 s timeout before being recorded invalid — about two hours per profile of
 * pure timeout, four across the grid, for rows that were doomed before they
 * started. The header already promised the other behaviour ("the run stops with
 * the mark's name instead of measuring nothing"); now the code does it.
 *
 * What is already measured is not thrown away: the loop breaks, the markdown
 * report and the raw JSON are written from the rows in hand, and the gate
 * record is refused with exit 2.
 */
let fatal = false;
const refuse = (reason) => {
  refusals.push(reason);
  console.error(`REFUSED: ${reason}`);
  fatal = true;
};
/** Which offsets each profile measured: derived from that profile's own pin run, except where --offsets said otherwise. */
const offsetsByProfile = {};
const cellName = (r) => (r.kind === "window" ? `window:${r.family}+${r.offset}ms` : r.kind === "fixed" ? r.scenario : r.kind);
const log = (r) => {
  const figure = r.status !== "ok" ? `${r.status.toUpperCase()}${r.reason ? ` (${r.reason})` : ""}` : r.inp === null ? "<16 ms" : `${r.inp} ms`;
  const achieved = r.offsetAchieved === null || r.offsetAchieved === undefined ? "" : ` @+${r.offsetAchieved}ms`;
  console.log(
    `[${rows.length}] ${r.profile} ${cellName(r)} ${r.build}${r.mode ? `/${r.mode}` : ""}: ${figure}${achieved}${r.class ? ` [${r.class}]` : ""}${r.notes ? ` — ${r.notes}` : ""}`
  );
};
/* ABBA: the arms alternate, and the order flips each time, so a machine that slows down over the run does not favour one arm. */
const armOrder = (i) => (i % 2 === 0 ? builds : [...builds].reverse());

for (const profileName of profiles) {
  const cal = await calibrate(browser, profileName, builds[0]);
  calibration.push(cal);
  console.log(`calibration ${profileName}: ${JSON.stringify(cal)}`);

  /*
   * THE PIN RUN COMES FIRST, AND EVERY CELL NEEDS IT. It names the three.js
   * chunk, which is how `fetched` is decided on every row — the control cell's
   * whole evidence — and it measures the delay from the trigger to each
   * anchor, which is the only thing arm A's window trials can fire against.
   */
  const bBuild = builds.find((b) => b.expect3d);
  const pin = bBuild ? await pinRun(browser, profileName, bBuild).catch((err) => ({ profile: profileName, error: String(err.message).split("\n")[0], missingAnchors: [] })) : null;
  chunks[profileName] = pin;
  console.log(`pin ${profileName}: ${JSON.stringify(pin && { file: pin.file, error: pin.error, missingAnchors: pin.missingAnchors, anchorDelays: pin.anchorDelays })}`);
  if (pin?.missingAnchors?.length) {
    /*
     * A RENAMED MARK FAILS HERE, LOUDLY. The harness will not measure a family
     * whose anchor the page does not emit: twenty invalid trials per cell and a
     * silently short record is not a measurement, it is an hour lost and a
     * mystery. The name it looked for is in the message.
     */
    refuse(`${profileName}: the page emits no mark for ${pin.missingAnchors.join(", ")} — the names come from src/components/sections/estate-map-3d-marks.ts and the page must emit every one of them`);
    break;
  }
  const chunkFile = pin?.file ?? null;
  if (bBuild && !chunkFile) {
    refuse(`${profileName}: the three.js chunk was not pinned (${pin?.error ?? "no reason given"}), so no row can say whether it was fetched`);
    break;
  }

  /*
   * THE OFFSETS COME FROM THIS PROFILE'S OWN PIN RUN.
   *
   * One table for both profiles was the phone's. On the unthrottled desktop the
   * same phases run five to ten times shorter, so `scene`, `compile`, `layout`
   * and `swap` would each have sampled a LATER phase, or an idle page, while
   * the cell id still named the phase they missed. The pin run already reads
   * every mark's page time and the chunk's Resource Timing, so it already knows
   * each phase's length here; each family is probed at 0 and at about half of
   * it. `--offsets family=a,b` still wins, on every profile.
   */
  const derived = derivedOffsets(pin, DEFAULT_OFFSETS);
  const profileOffsets = {};
  for (const family of INP_WINDOW_FAMILIES) profileOffsets[family] = OFFSET_OVERRIDES.has(family) ? [...OFFSETS[family]] : derived.offsets[family];
  offsetsByProfile[profileName] = { offsets: profileOffsets, phases: derived.phases, fellBack: derived.fellBack, overridden: [...OFFSET_OVERRIDES] };
  console.log(`offsets ${profileName}: ${JSON.stringify(profileOffsets)} (phases ${JSON.stringify(derived.phases)}${derived.fellBack.length ? `; fell back to the table for ${derived.fellBack.join(", ")}` : ""})`);

  if (wantControl) {
    for (let run = 0; run < RUNS; run++) {
      for (const build of armOrder(run)) {
        const r = await controlTrial(browser, profileName, build, chunkFile);
        rows.push(r);
        log(r);
      }
    }
  }

  if (wantTrigger) {
    for (let run = 0; run < RUNS; run++) {
      for (const build of armOrder(run)) {
        const r = await triggerTrial(browser, profileName, build, chunkFile);
        rows.push(r);
        log(r);
      }
    }
  }

  for (const scenario of fixedWanted) {
    for (let run = 0; run < RUNS; run++) {
      for (const build of armOrder(run)) {
        const r = await fixedTrial(browser, profileName, build, scenario, chunkFile);
        rows.push(r);
        log(r);
      }
    }
  }

  if (wantWindow && !cal.pass) {
    /*
     * Not run at all, rather than run and hidden. The figures a failed
     * calibration makes meaningless then exist nowhere: not in the per-offset
     * table, the every-trial table, the console or the JSON.
     */
    console.log(`window families ${profileName}: NOT RUN — calibration failed, so CDP input is not shown to record queueing delay here`);
  } else if (wantWindow) {
    let flip = 0;
    for (const family of families) {
      for (const offset of profileOffsets[family]) {
        /*
         * THE TRACED TRIALS FIRST, THEN THE FIGURES. Tracing inflates the
         * figure, so the trials of record are untraced and the trace is taken
         * for the classification only, on a few trials whose rows are written
         * as `na`. `--trace-trials 0` turns it off entirely.
         */
        for (let t = 0; t < TRACED; t++) {
          for (const build of armOrder(flip++)) {
            const r = await windowTrial(browser, profileName, build, family, offset, pin, { traced: true });
            rows.push(r);
            log(r);
          }
        }
        for (let t = 0; t < TRIALS; t++) {
          for (const build of armOrder(flip++)) {
            const r = await windowTrial(browser, profileName, build, family, offset, pin, { traced: false });
            rows.push(r);
            log(r);
          }
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
const fmt = (n) => (n === null || n === undefined ? "—" : `${Math.round(n)} ms`);
const splitText = (w) => (w ? `${w.split.inputDelay} / ${w.split.processing} / ${w.split.presentation}` : "—");
/*
 * THE CELLS ONE PROFILE MEASURED, which is not the same list for both any more:
 * each profile's window offsets come from its own pin run, so `window:scene:21`
 * exists on the phone and `window:scene:10` on the desktop. Crossing every
 * profile with every cell any profile measured reported each of them as missing
 * the other's cells — and on arm B that would have forced `smoke: true` on
 * every complete run there will ever be.
 */
const cellsMeasuredIn = (p) => [...new Set(rows.filter((r) => r.profile === p).map((r) => cellIdFor(r)))];

/*
 * SMOKE IS DECIDED BY THE VALID TRIALS THAT CAME BACK, not by what was
 * requested, and against the gate's OWN minimums (`INP_MIN_OK_TRIALS`), so the
 * report and the record cannot disagree about what "enough" means. A cell that
 * was never measured is a shortfall too: the record it would produce is one the
 * gate refuses to read.
 */
const shortfalls = [];
/** Arm A's own shortfalls: reported, but they do not make the record a smoke run (see below). */
const armANotes = [];
for (const p of profiles) {
  for (const planned of plannedCells(offsetsByProfile[p]?.offsets ?? OFFSETS)) {
    const id = cellIdFor(planned);
    if (!rows.some((r) => r.profile === p && cellIdFor(r) === id)) shortfalls.push(`${p} ${id}: not measured`);
  }
}
for (const p of profiles) {
  for (const id of cellsMeasuredIn(p)) {
    for (const b of builds) {
      const set = rows.filter((r) => r.profile === p && r.build === b.label && cellIdFor(r) === id);
      const where = b.label === "B" ? shortfalls : armANotes;
      if (!set.length) {
        where.push(`${p} ${id} ${b.label}: no trial`);
        continue;
      }
      if (set.every((r) => r.status === "n/a")) continue;
      const need = INP_MIN_OK_TRIALS[set[0].kind];
      const ok = set.filter((r) => r.status === "ok").length;
      if (ok < need) where.push(`${p} ${id} ${b.label}: ${ok} valid trial(s) of ${set.length}, needs ${need}`);
    }
  }
}
/*
 * SMOKE IS ARM B's, BECAUSE THE GATE READS ONLY ARM B.
 *
 * `smoke: true` makes the gate reject the record outright ("smoke run"), and
 * D-033 requires nothing whatever of arm A. While a shortfall on EITHER arm set
 * it, one transient invalid anywhere in the roughly 780 arm-A trials of a full
 * run — a Visit tap that did not open the card, a list link that did not
 * arrive — was enough to hand back a dead record. Arm A's shortfalls are still
 * reported, in the run's own notes, where they belong.
 */
const smoke = shortfalls.length > 0;

/* Read and PROVEN SERVED by the pre-flight at the top of this file: the arm answered for /_next/static/<id>/_buildManifest.js, which only that dist dir can serve. */
const buildIds = Object.fromEntries(builds.map((b) => [b.label, buildIdOf(b)]));

let md = `# INP on \`${ROUTE}\`, with the 3D map active\n\n`;
md += smoke
  ? `**SMOKE — NOT A MEASUREMENT OF RECORD.** A measurement of record needs ${INP_MIN_OK_TRIALS.control} valid review-build (B) trials per control, trigger and fixed cell, per profile, and ${INP_MIN_OK_TRIALS.window} per window cell. Short on arm B: ${shortfalls.join("; ")}. Other work may have been running on the machine. These figures show that the harness works; they measure nothing.\n\n`
  : `Trials: ${RUNS} per control, trigger and fixed cell per profile; ${TRIALS} untraced per window cell plus ${TRACED} traced for the classification; every cell and profile has at least the minimum valid review-build trials. Lab only (see Limits).\n\n`;
if (refusals.length) md += `**REFUSED, and the run stopped here:** ${refusals.join("; ")}\n\n`;
if (armANotes.length) md += `Arm A fell short in ${armANotes.length} place(s), which the gate reads nothing of and which therefore does not make this a smoke run: ${armANotes.slice(0, 10).join("; ")}${armANotes.length > 10 ? `, and ${armANotes.length - 10} more` : ""}.\n\n`;
md += `Generated ${started.toISOString()} by \`node scripts/estate-inp.mjs\`. Builds: ${builds.map((b) => `**${b.label}** ${b.base} (${b.expect3d ? "review build, 3D" : "public build, gate closed, 2D"}, build id \`${buildIds[b.label]}\`)`).join("; ")}. Order ABBA, a fresh context per trial. Tree \`${FINGERPRINT}\` at \`${COMMIT.slice(0, 7) || "(no commit)"}\`.\n\n`;

md += `## Calibration (CDP input behind a 300 ms busy loop)\n\n| profile | input into the loop | expected input delay | measured input delay | result |\n|---|---|---|---|---|\n`;
for (const c of calibration) md += `| ${c.profile} | ${fmt(c.inputIntoLoopMs ?? null)} | ${fmt(c.expectedInputDelayMs ?? null)} | ${fmt(c.measuredInputDelayMs ?? null)} | ${c.pass ? "PASS: CDP input records queueing delay" : `FAIL${c.reason ? ` (${c.reason})` : ""}: the window families are not measurable this way`} |\n`;

md += `\n## GPU path and the features the record declares\n\n| profile | WebGL2 | vendor | renderer | software | KHR_parallel_shader_compile | requestIdleCallback | scheduler.yield |\n|---|---|---|---|---|---|---|---|\n`;
for (const c of calibration) {
  md += `| ${c.profile} | ${c.gpu?.webgl2 ?? "—"} | ${c.gpu?.vendor ?? "—"} | ${c.gpu?.renderer ?? "—"} | ${c.gpu?.software ?? "—"} | ${c.gpu?.khrParallelShaderCompile ?? "—"} | ${c.gpu?.requestIdleCallback ?? "—"} | ${c.gpu?.schedulerYield ?? "—"} |\n`;
}

/** One summary row per cell, per profile, per arm: the same grouping the gate counts by. */
const summary = [];
for (const profileName of profiles) {
  for (const id of cellsMeasuredIn(profileName)) {
    for (const build of builds) {
      const set = rows.filter((r) => r.profile === profileName && r.build === build.label && cellIdFor(r) === id);
      if (!set.length) continue;
      const ok = set.filter((r) => r.status === "ok");
      const numeric = ok.filter((r) => r.inp !== null && r.inp !== undefined);
      const worstRun = numeric.reduce((a, b) => (!a || b.inp > a.inp ? b : a), null);
      const medianRun = numeric.length ? [...numeric].sort((a, b) => a.inp - b.inp)[Math.floor((numeric.length - 1) / 2)] : null;
      const under = ok.length - numeric.length;
      const confirmed = ok.filter((r) => r.inp === null || r.inp === undefined).every((r) => r.kind === "control" || (r.interactionCountDelta ?? 0) >= (r.dispatched ?? 1));
      let verdict;
      if (!ok.length) verdict = set.some((r) => r.status === "n/a") ? "not applicable" : "no valid trial";
      else if (worstRun) verdict = worstRun.inp < BUDGET_MS ? "pass" : "FAIL";
      else if (set[0].kind === "control") verdict = "pass (no interaction, as a control must report)";
      else verdict = confirmed ? "pass (every interaction under 16 ms)" : "not established (no entry, interaction count unconfirmed)";
      summary.push({ profileName, id, kind: set[0].kind, build: build.label, set, ok, numeric, worstRun, medianRun, under, verdict });
    }
  }
}

md += `\n## Every cell\n\nINP per trial is the worst interaction of that trial's own measurement window — for a window cell, the measured input and not the trigger that started the load (the trigger has a cell of its own). "<16 ms" counts trials whose interactions all stayed under Event Timing's 16 ms floor, confirmed by the browser's interaction count. Split = input delay / processing / presentation, in ms. The verdict is on the WORST trial against ${BUDGET_MS} ms, strictly.\n\n`;
md += `| profile | cell | build | ok / lost / n/a / invalid / error | median INP | worst INP | trials <16 ms | median split | worst split | verdict |\n|---|---|---|---|---|---|---|---|---|---|\n`;
for (const s of summary) {
  const count = (st) => s.set.filter((r) => r.status === st).length;
  md += `| ${s.profileName} | \`${s.id}\` | ${s.build} | ${count("ok")} / ${count("lost")} / ${count("n/a")} / ${count("invalid")} / ${count("error")} | ${fmt(median(s.numeric.map((r) => r.inp)))} | ${fmt(s.worstRun?.inp ?? null)} | ${s.under} | ${splitText(s.medianRun?.worst)} | ${splitText(s.worstRun?.worst)} | ${s.verdict} |\n`;
}

if (wantWindow) {
  md += `\n## The window families\n\nThe anchor of each family, and the delay the pin run measured from the trigger to it. Arm A has neither the chunk nor the marks, so its trials fire at these delays after their own trigger; the record names that for every A row.\n\n`;
  md += `| profile | three.js chunk | transfer | decoded | ${INP_WINDOW_FAMILIES.map((f) => `→${f}`).join(" | ")} |\n|---|---|---|---|${INP_WINDOW_FAMILIES.map(() => "---").join("|")}|\n`;
  for (const p of profiles) {
    const c = chunks[p];
    md += `| ${p} | ${c?.file ?? c?.error ?? "—"} | ${c?.transferBytes ?? "—"} B | ${c?.decodedBytes ?? "—"} B | ${INP_WINDOW_FAMILIES.map((f) => fmt(c?.anchorDelays?.[f] ?? null)).join(" | ")} |\n`;
  }
  for (const p of profiles) {
    const cal = calibration.find((c) => c.profile === p);
    if (!cal?.pass) {
      md += `\n**${p}: not measurable.** Calibration failed, so CDP input is not shown to record queueing delay on this machine. No window trial was run on this profile, so there are no figures to report.\n`;
      continue;
    }
    const po = offsetsByProfile[p];
    md += `\n### ${p}\n\nOffsets derived from this profile's own pin run: each family at 0 and at about half its measured phase${po?.fellBack?.length ? `; ${po.fellBack.join(", ")} fell back to the table in \`scripts/estate-inp-record.mjs\`` : ""}${po?.overridden?.length ? `; ${po.overridden.join(", ")} came from \`--offsets\`` : ""}. Measured phases, ms: ${INP_WINDOW_FAMILIES.map((f) => `${f} ${po?.phases?.[f] ?? "—"}`).join(", ")}.\n\n"achieved" is the offset the trial actually landed at, measured in the page's own clock from the anchor; a trial further than ${OFFSET_TOLERANCE_MS} ms from its declared offset, or outside its phase, is recorded invalid and appears in the every-trial table only. "in phase" counts the valid B trials whose input landed inside the phase the family is named for. The class comes from the traced trials, which are recorded \`na\` because tracing inflates the figure.\n\n| family | offset | build | n (of record) | in phase | median achieved | median INP | worst INP | <16 ms | class (traced trials) |\n|---|---|---|---|---|---|---|---|---|---|\n`;
    for (const family of families) {
      for (const offset of po?.offsets?.[family] ?? []) {
        for (const build of builds) {
          const here = (status) => rows.filter((r) => r.kind === "window" && r.profile === p && r.family === family && r.offset === offset && r.build === build.label && r.status === status);
          const set = here("ok").filter((r) => !r.traced);
          const tracedRows = rows.filter((r) => r.kind === "window" && r.profile === p && r.family === family && r.offset === offset && r.build === build.label && r.traced);
          const nums = set.filter((r) => r.inp !== null).map((r) => r.inp);
          const achieved = set.map((r) => r.offsetAchieved).filter((v) => typeof v === "number");
          const classes = [...new Set(tracedRows.map((r) => r.class).filter(Boolean))];
          md += `| ${family} | +${offset} ms | ${build.label} | ${set.length} | ${set.filter((r) => r.inPhase === true).length} | ${fmt(median(achieved))} | ${fmt(median(nums))} | ${fmt(nums.length ? Math.max(...nums) : null)} | ${set.length - nums.length} | ${classes.join(" / ") || "—"} |\n`;
        }
      }
    }
  }
}

md += `\n## Every trial, in the order measured\n\n| # | profile | cell | build | status | INP | worst interaction | split | dispatched / recorded | interactionCount Δ | fetched | notes |\n|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
rows.forEach((r, i) => {
  const inp = r.status !== "ok" ? "—" : r.inp === null || r.inp === undefined ? "<16 ms" : `${r.inp} ms`;
  const notes = [
    r.mode,
    r.class,
    r.classWindow && `class over ${r.classWindow}`,
    r.offsetAchieved !== null && r.offsetAchieved !== undefined && `achieved +${r.offsetAchieved} ms`,
    r.notes,
    r.navigatedTo && `→ ${r.navigatedTo}`,
    r.reason,
    r.anchor,
  ]
    .filter(Boolean)
    .join("; ");
  md += `| ${i + 1} | ${r.profile} | \`${cellIdFor(r)}\` | ${r.build} | ${r.status} | ${inp} | ${r.worst ? `${r.worst.types.join("+")} on \`${r.worst.target}\`` : "—"} | ${splitText(r.worst)} | ${r.dispatched ?? "—"} / ${r.recorded ?? "—"} | ${r.interactionCountDelta ?? "—"} | ${r.fetched ?? "—"} | ${notes.replace(/\|/g, "\\|")} |\n`;
});

md += `\n## Limits\n\n- Lab only: Chromium through Playwright, synthetic CDP input, throttled CPU and network. Not field INP, and not Safari or Firefox.\n- Event Timing's floor is 16 ms and its durations are rounded to 8 ms; an interaction under the floor leaves no entry and is printed as "<16 ms".\n- The GPU path above decides the first frame's cost; software WebGL overstates it against a phone's GPU.\n- Traces use hotel-cwv's categories without the CPU sampler. Tracing INFLATES the figure (+18.7 % on this machine's comparable workload, traced slower in all five interleaved pairs), and Event Timing's \`duration\` runs to the next paint, so the figures of record above are measured UNTRACED; ${TRACED} trial(s) per window cell and arm are traced for the classification alone and are recorded \`na\`.\n- Every window trial's anchor is corrected for the latency of the signal that announced it (a mark's console message, or a CDP network event), and a trial that lands further than ${OFFSET_TOLERANCE_MS} ms from its declared offset, or outside its family's phase, is recorded invalid rather than counted. Arm A's anchors are estimates by construction, so that check is applied to arm B.\n- Each profile's offsets come from its own pin run, so the same family's cell id carries a different offsetMs on phone and desktop.\n- A window trial replaces \`performance.mark\` with a wrapper that logs each \`estate3d:*\` mark synchronously, on both builds alike: that is how the harness learns where the page is while the page's main thread is blocked, and it costs the page one console call per mark.\n- Arm A's window anchors are B's measured delays from the trigger, not A's own events: A has no three.js chunk and emits no marks, so nothing else is available to compare it on.\n- ${smoke ? "The machine was not isolated. This is a smoke run: no figure here is a measurement of record." : "Figures of record need an otherwise idle machine. The harness cannot check that, so the record that cites these figures states the conditions they were taken under."}\n`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, md);
fs.writeFileSync(
  JSON_OUT,
  JSON.stringify(
    { started, smoke, refusals, armANotes, runs: RUNS, trials: TRIALS, tracedTrials: TRACED, offsetToleranceMs: OFFSET_TOLERANCE_MS, offsets: offsetsByProfile, offsetsFallback: OFFSETS, fingerprint: FINGERPRINT, commit: COMMIT, builds, buildIds, calibration, chunks, rows },
    null,
    2
  ) + "\n"
);
console.log(`-> ${OUT}\n-> ${JSON_OUT}`);

/* ---- the gate's record --------------------------------------------------- */
/*
 * BUILT LAST AND CHECKED BEFORE IT IS WRITTEN (D-033). The rules are in
 * scripts/estate-inp-record.mjs; the checker is the gate's own
 * `decideInpCondition`, so "a record the gate would reject" is not a second
 * opinion. A SHAPE failure means the reader could not read this as the schema
 * at all, and the file is not written — the markdown report and the raw JSON
 * above already hold everything measured, so nothing is lost by refusing.
 */
const profileRecords = {};
for (const p of profiles) {
  const cal = calibration.find((c) => c.profile === p) ?? {};
  profileRecords[p] = {
    calibration: {
      pass: cal.pass === true,
      measuredMs: cal.measuredInputDelayMs ?? -1,
      expectedMs: cal.expectedInputDelayMs ?? -1,
      /* What it was, in the calibration's own words, when it did not pass. */
      ...(cal.reason ? { reason: cal.reason } : {}),
    },
    features: {
      gpu: String(cal.gpu?.renderer ?? "unknown"),
      software: cal.gpu?.software === true,
      khrParallelShaderCompile: cal.gpu?.khrParallelShaderCompile === true,
      requestIdleCallback: cal.gpu?.requestIdleCallback === true,
      schedulerYield: cal.gpu?.schedulerYield === true,
    },
    rows: rows.filter((r) => r.profile === p),
  };
}
const gateRecord = buildGateRecord({
  generatedAt: started.toISOString(),
  commit: COMMIT,
  smoke,
  fingerprint: FINGERPRINT,
  builds: Object.fromEntries(builds.map((b) => [b.label, { origin: b.base, buildId: buildIds[b.label] }])),
  profiles: profileRecords,
});
const verdict = checkGateRecord(gateRecord, FINGERPRINT);

for (const r of refusals) console.log(`REFUSED: ${r}`);
for (const n of armANotes) console.log(`arm A short (the gate reads none of it): ${n}`);
if (fatal) {
  /* A refusal stopped the run: the rows in hand are written above, but a record built from a run that was cut short is not evidence of anything. */
  console.log(`\nNOT WRITTEN: ${GATE_JSON ?? "(no gate record requested)"} — the run was refused before it finished. Everything measured is in ${OUT} and ${JSON_OUT}.`);
  process.exitCode = 2;
} else if (!verdict.shape.pass) {
  console.log(`\nThe gate's own reader cannot read this record as ${gateRecord.schema}:`);
  for (const reason of verdict.shape.reasons) console.log(`  - ${reason}`);
  console.log(`NOT WRITTEN: ${GATE_JSON ?? "(no gate record requested)"} — a record the reader rejects is not evidence. Everything measured is in ${OUT} and ${JSON_OUT}.`);
  process.exitCode = 2;
} else {
  if (GATE_JSON === null) {
    console.log("\nThe gate's reader accepts this record's shape; --no-gate-json, so it was not written.");
  } else {
    fs.mkdirSync(path.dirname(GATE_JSON), { recursive: true });
    fs.writeFileSync(GATE_JSON, JSON.stringify(gateRecord, null, 2) + "\n");
    console.log(`-> ${GATE_JSON}${verdict.smoke ? " (smoke: true — the gate closes on it, by design)" : ""}`);
  }
  /*
   * THE CLAIM AND THE EXIT CODE COME FROM THE RECORD AS WRITTEN.
   *
   * `substance` is computed with `smoke` forced false, so that a smoke run
   * still prints WHAT is short instead of hiding behind "smoke run" — and
   * while the acceptance claim came from that same copy, a run that wrote
   * `smoke: true` announced "the gate's own reader accepts this record" and
   * exited 0 over a record the gate rejects outright.
   */
  if (verdict.asWritten.pass) {
    console.log("The gate's own reader accepts this record as written, on the measurement as well as the shape.");
  } else {
    console.log("\nThe gate's own reader would reject this record (it is written; the shortfall is in this exit code):");
    for (const reason of verdict.substance.reasons) console.log(`  - ${reason}`);
    if (verdict.smoke) console.log(`  - and the record carries smoke: true, which the gate rejects on its own`);
    process.exitCode = 1;
  }
  /* The harness's own rule, which is NOT the gate's: a window cell that did not catch the phase it is named for measured something else. */
  if (!verdict.harness.pass) {
    console.log("\nThe HARNESS's own rule (not the gate's): a window cell must have caught the phase its id names —");
    for (const reason of verdict.harness.reasons) console.log(`  - ${reason}`);
    if (!process.exitCode) process.exitCode = 1;
  }
}
if (smoke) console.log("SMOKE: not a measurement of record.");
