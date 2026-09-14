#!/usr/bin/env node
/**
 * THE PHASE-1 GATE — Core Web Vitals for Direction F, in the lab.
 *
 * The F+ motion directive makes CWV a release blocker rather than an
 * aspiration: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1, and it says not to start
 * Phase 2 until Phase 1 passes.
 *
 * WHAT THIS CANNOT DO, said first because the directive asks for it.
 *
 * It asks for a pass "at p75 in the field (CrUX), not just in the lab". **That
 * is not obtainable here and will not be until the site is deployed and has
 * real traffic.** CrUX is a report on other people's browsers; nothing in this
 * repository can synthesise one. So this is a LAB measurement, it says so in
 * its own output, and a pass here is necessary rather than sufficient.
 *
 * INP is the same problem in miniature: it is a field metric, measured from
 * real interactions. The lab stand-in used here is honest about being one — it
 * drives real clicks and scrolls through CDP and reports the WORST interaction
 * latency observed, plus total blocking time. A page that fails this would
 * certainly fail INP; a page that passes it might still.
 *
 * NO INTERACTION RECORDED IS NOT 0 MS, AND NOT A PASS.
 *
 * Through tranche twelve the worst-interaction figure started at 0 and was
 * printed as it stood. On a route where the session drives nothing Event Timing
 * records — `/en/the-estate` has no `.ho-dots` to click and no `.ho-card` to
 * hover, and a wheel scroll is not an Event Timing type — every run printed
 * "0 ms" and the budget line counted it as met (D-020: twelve A/B runs, all
 * "0 ms", none a reading). It now starts empty: such a route prints "no
 * interaction recorded", and the report names it under "not measured" instead
 * of "all budgets met". The observer's floor is 16 ms, so an interaction that
 * was driven but finished faster leaves no entry either; this script cannot
 * tell the two apart, and says neither is a pass. `scripts/estate-inp.mjs`
 * counts what it dispatches and can.
 *
 * TOTAL BLOCKING TIME COMES FROM A TRACE, NOT FROM THE PAGE'S OWN OBSERVER.
 *
 * Until tranche twelve this summed a `longtask` PerformanceObserver installed
 * in the page. That observer turned out to be blind to exactly the task a
 * performance change is most likely to move: removing the root Suspense
 * boundary took the whole-page layout out of a script-triggered task (which
 * the observer reported) and into the parser's own rendering before first
 * paint (which it did not). The observer's figure fell from 295 to 104 ms on
 * the phone profile; the trace showed the blocking after first paint had moved
 * from 331 to 303 ms. A gate that can be passed by moving work out of its sight
 * is not a gate.
 *
 * So TBT here is Lighthouse's definition, taken from a Chrome trace of the same
 * session: main-thread tasks over 50 ms, counting only the part after first
 * contentful paint. Two further figures stand beside it so nothing hides:
 * `load-blocking` (every long task, before first paint included) and
 * `observer` (the old figure, for continuity with earlier reports). Tasks that
 * are the harness's own `page.evaluate` — script with no page URL and nothing
 * of the page's in them — are excluded and the amount is printed.
 *
 * Throttled to a mid-range phone (4× CPU, Slow 4G) because that is the device
 * the directive names for the Phase-2 gate and the one a guest actually holds.
 *
 * TBT IS A BUDGET, NOT A FIGURE THAT IS ONLY PRINTED.
 *
 * Through tranche twelve the gate reported TBT and nothing in BUDGET referred
 * to it, so no TBT, however high, could fail a run. The phone profile's TBT
 * (the trace figure, after FCP) now fails over 200 ms, the target the
 * performance pass was set. On the final tranche-twelve build the phone
 * medians of all eleven route templates are 53 to 76 ms
 * (`qa/perf/AB-tranche12-final.md`). Phone only, because that is the profile
 * the target names: the desktop medians were 0 ms on all eleven (same file),
 * and a vacuous line is not a budget. `load-blocking` stays printed and
 * unbudgeted. It is the wider measure: its phone medians on those templates
 * are 62 to 193 ms, and a single run on `/` reached 225 ms
 * (`qa/looks/HOTEL-CWV.md`). Making it the gate would set a new target rather
 * than enforce the one set.
 *
 *   node scripts/hotel-cwv.mjs [route]
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.CAPTURE_BASE ?? "http://localhost:3005";
/*
 * Git Bash rewrites a bare "/" argument into the MSYS root, so the route
 * arrives as "C:/Program Files/Git/" and Playwright reports "Cannot navigate to
 * invalid URL" — which reads like a Playwright problem and is a shell problem.
 * `scripts/look.mjs` hit this first and documented it; this is the same guard.
 * Routes may therefore be given without a leading slash, or as "" for the home
 * page.
 */
const RAW = process.argv[2] ?? "/looks/hotel";
const ROUTE = /^[A-Za-z]:/.test(RAW) ? "/" : "/" + RAW.replace(/^\/+/, "");
const OUT = path.join(process.cwd(), "qa", "looks");
fs.mkdirSync(OUT, { recursive: true });

async function reachable(url) {
  for (let i = 0; i < 20; i++) {
    try {
      const r = await fetch(url, { method: "HEAD" });
      if (r.status < 500) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}
if (!(await reachable(BASE))) {
  console.error(`No server at ${BASE}. Run \`npm start\` first.`);
  process.exit(1);
}

/* `phoneTbt` is the trace TBT after FCP on the phone profile — see the header. */
const BUDGET = { lcp: 2500, cls: 0.1, inp: 200, phoneTbt: 200 };
const TRACE_CATEGORIES = ["devtools.timeline", "disabled-by-default-devtools.timeline", "loading", "blink.user_timing"];
const NO_INTERACTION = "no interaction recorded";

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

/** Lighthouse-style blocking from a trace: after FCP, before it, and what was the harness's. */
function blockingFromTrace(events) {
  const key = (e) => `${e.pid}:${e.tid}`;
  const urlOf = (e) => String(e.args?.data?.url ?? e.args?.beginData?.url ?? "");
  const counts = new Map();
  for (const e of events) {
    if ((e.name === "EvaluateScript" || e.name === "v8.compile" || e.name === "ParseHTML") && urlOf(e).startsWith(BASE)) {
      counts.set(key(e), (counts.get(key(e)) ?? 0) + 1);
    }
  }
  const main = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!main) return null;
  const pid = Number(main.split(":")[0]);
  const fcp = events.filter((e) => e.name === "firstContentfulPaint" && e.pid === pid).sort((a, b) => a.ts - b.ts)[0]?.ts ?? null;

  const onMain = events.filter((e) => key(e) === main && e.ph === "X" && typeof e.dur === "number");
  const tasks = onMain.filter((e) => e.name === "RunTask" && e.dur > 50_000);
  const scripts = onMain.filter((e) => e.name === "EvaluateScript" || e.name === "FunctionCall" || e.name === "v8.compile");

  let afterFcp = 0;
  let all = 0;
  let harness = 0;
  for (const t of tasks) {
    const inside = scripts.filter((s) => s.ts >= t.ts && s.ts < t.ts + t.dur);
    const isHarness = inside.length > 0 && inside.every((s) => !/^https?:/.test(urlOf(s)));
    if (isHarness) {
      harness += t.dur - 50_000;
      continue;
    }
    all += t.dur - 50_000;
    if (fcp !== null) {
      const tail = t.ts + t.dur - Math.max(t.ts, fcp);
      if (tail > 50_000) afterFcp += tail - 50_000;
    }
  }
  return { tbt: afterFcp / 1000, loadBlocking: all / 1000, harness: harness / 1000, fcpFound: fcp !== null };
}

const browser = await chromium.launch();
const rows = [];

for (const [label, width, height, mobile] of [
  ["desktop", 1440, 900, false],
  ["phone", 390, 844, true],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);

  /*
   * A mid-range Android, not this machine. Measuring motion on a developer's
   * desktop is how a page ships that only feels fast to the person who built it.
   */
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: mobile ? 4 : 2 });
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: mobile ? 150 : 40,
    downloadThroughput: (mobile ? 1.6 : 10) * 1024 * 1024 / 8,
    uploadThroughput: (mobile ? 0.75 : 5) * 1024 * 1024 / 8,
  });

  await page.addInitScript(() => {
    /* `longest` starts EMPTY, not at 0: see "No interaction recorded" in the header. */
    window.__v = { cls: 0, lcp: 0, fcp: 0, longest: null, tbt: 0, lcpEl: "" };
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__v.cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((l) => {
      const es = l.getEntries();
      const last = es[es.length - 1];
      window.__v.lcp = last.startTime;
      window.__v.lcpEl = last.element ? last.element.tagName + "." + (last.element.className || "") : "";
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (e.name === "first-contentful-paint") window.__v.fcp = e.startTime;
    }).observe({ type: "paint", buffered: true });
    new PerformanceObserver((l) => {
      /* The old figure, kept for continuity only — see the header. */
      for (const e of l.getEntries()) {
        if (e.duration > 50) window.__v.tbt += e.duration - 50;
      }
    }).observe({ type: "longtask", buffered: true });
    /*
     * The lab stand-in for INP: the worst real interaction we drive. Only
     * entries with an interactionId count. The "event" observer also delivers
     * pointerover, pointerenter, mouseover and mouseout, with interactionId 0,
     * and this session makes them itself: the synthetic mouse moves after each
     * wheel step, and the card hover. None of those is an interaction, and on a
     * page busy loading (the 3D estate map's chunk arrives during this scroll)
     * one of them at 16 ms or more would turn "no interaction recorded" into a
     * figure that passed the budget.
     */
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (!e.interactionId) continue;
        if (window.__v.longest === null || e.duration > window.__v.longest) window.__v.longest = e.duration;
      }
    }).observe({ type: "event", durationThreshold: 16, buffered: true });
  });

  await cdp.send("Tracing.start", {
    transferMode: "ReturnAsStream",
    traceConfig: { recordMode: "recordAsMuchAsPossible", includedCategories: TRACE_CATEGORIES },
  });

  await page.goto(BASE + ROUTE, { waitUntil: "load", timeout: 120_000 });
  await page.waitForTimeout(2500);

  /* Drive real interactions so the event timing has something to report. */
  const dots = page.locator(".ho-dots button");
  if (await dots.count()) {
    await dots.nth(1).click();
    await page.waitForTimeout(500);
  }
  const total = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y <= total; y += Math.round(height * 0.9)) {
    await page.mouse.wheel(0, Math.round(height * 0.9));
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(800);
  /* A hover over a villa card, where Phase 2's shader will eventually live. */
  const card = page.locator(".ho-card").first();
  if (await card.count()) {
    await card.hover().catch(() => {});
    await page.waitForTimeout(300);
  }

  const v = await page.evaluate(() => window.__v);
  const blocking = blockingFromTrace(await readTrace(cdp));
  rows.push({
    view: label,
    lcp: Math.round(v.lcp),
    fcp: Math.round(v.fcp),
    cls: +v.cls.toFixed(4),
    /* null, never 0, when nothing was recorded. */
    inp: v.longest === null ? null : Math.round(v.longest),
    tbt: blocking ? Math.round(blocking.tbt) : NaN,
    loadBlocking: blocking ? Math.round(blocking.loadBlocking) : NaN,
    harness: blocking ? Math.round(blocking.harness) : NaN,
    observer: Math.round(v.tbt),
    lcpEl: v.lcpEl,
  });

  await context.close();
}

await browser.close();

const inpText = (r) => (r.inp === null ? NO_INTERACTION : `${r.inp}ms`);
const fail = [];
const notMeasured = [];
for (const r of rows) {
  if (r.lcp > BUDGET.lcp) fail.push(`${r.view}: LCP ${r.lcp}ms over ${BUDGET.lcp}ms`);
  if (r.cls > BUDGET.cls) fail.push(`${r.view}: CLS ${r.cls} over ${BUDGET.cls}`);
  if (r.inp === null) notMeasured.push(`${r.view}: worst interaction — ${NO_INTERACTION}, so the ${BUDGET.inp}ms interaction budget was not measured (not a pass)`);
  else if (r.inp > BUDGET.inp) fail.push(`${r.view}: worst interaction ${r.inp}ms over ${BUDGET.inp}ms`);
  if (Number.isNaN(r.tbt)) fail.push(`${r.view}: TBT could not be read from the trace`);
  if (r.view === "phone" && r.tbt > BUDGET.phoneTbt) {
    fail.push(`${r.view}: TBT ${r.tbt}ms (trace, after FCP) over ${BUDGET.phoneTbt}ms`);
  }
}

let verdict = "";
if (fail.length) verdict += `## Over budget\n\n${fail.map((f) => `- ${f}`).join("\n")}\n\n`;
if (notMeasured.length) verdict += `## Not measured\n\n${notMeasured.map((f) => `- ${f}`).join("\n")}\n\n`;
if (!fail.length && !notMeasured.length) verdict = "**All budgets met in the lab.**\n";
else if (!fail.length) verdict += "**Every budget that was measured was met; the ones above were not measured.**\n";

let md = `# Direction F — the Phase 1 CWV gate

Generated by \`npm run hotel:cwv\`. Route: \`${ROUTE}\`.

**This is a LAB measurement.** The directive asks for a pass at p75 in the field
via CrUX, and that cannot be produced from this repository — CrUX reports on real
visitors' browsers and the site is not deployed to any. A pass here is necessary,
not sufficient. INP is likewise a field metric; the figure below is the worst
latency of the interactions this script actually drives (a slider dot, a full
scroll, a card hover), which is a floor rather than the real number. Where none
of them left an Event Timing entry it reads "${NO_INTERACTION}", which is not 0
and not a pass.

Throttled to a mid-range phone: 4× CPU and Slow 4G on the phone profile, 2× CPU
on desktop.

**TBT is taken from a Chrome trace** (main-thread tasks over 50 ms, the part after
first contentful paint — Lighthouse's window). \`load-blocking\` counts every long
task including those before first paint; \`observer\` is the page's own longtask
observer, kept for continuity and known to miss pre-paint rendering tasks.

| view | LCP | FCP | CLS | worst interaction | TBT (trace, after FCP) | load-blocking | observer | harness excluded | LCP element |
|---|---|---|---|---|---|---|---|---|---|
${rows
  .map(
    (r) =>
      `| ${r.view} | ${r.lcp}ms | ${r.fcp}ms | ${r.cls} | ${inpText(r)} | ${r.tbt}ms | ${r.loadBlocking}ms | ${r.observer}ms | ${r.harness}ms | \`${r.lcpEl}\` |`
  )
  .join("\n")}

Budgets: LCP ≤ ${BUDGET.lcp}ms · CLS ≤ ${BUDGET.cls} · interaction ≤ ${BUDGET.inp}ms · phone TBT (trace, after FCP) ≤ ${BUDGET.phoneTbt}ms. \`load-blocking\` and \`observer\` are printed, not budgeted.

${verdict}`;

fs.writeFileSync(path.join(OUT, "HOTEL-CWV.md"), md);

for (const r of rows) {
  console.log(
    `${r.view.padEnd(8)} LCP ${String(r.lcp).padStart(5)}ms  CLS ${String(r.cls).padEnd(7)} ` +
      `worst-interaction ${inpText(r).padStart(6)}  TBT ${String(r.tbt).padStart(5)}ms  ` +
      `load-blocking ${String(r.loadBlocking).padStart(5)}ms  observer ${String(r.observer).padStart(5)}ms  ` +
      `FCP ${String(r.fcp).padStart(5)}ms  harness ${String(r.harness).padStart(4)}ms  [${r.lcpEl}]`
  );
}
console.log("-> qa/looks/HOTEL-CWV.md   (LAB ONLY — field CrUX is not obtainable here)");
if (notMeasured.length) {
  console.error("\nNOT MEASURED (not a pass):");
  for (const f of notMeasured) console.error("  " + f);
}
if (fail.length) {
  console.error("\nOVER BUDGET:");
  for (const f of fail) console.error("  " + f);
  process.exitCode = 1;
}
