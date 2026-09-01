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
 * Throttled to a mid-range phone (4× CPU, Slow 4G) because that is the device
 * the directive names for the Phase-2 gate and the one a guest actually holds.
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

const BUDGET = { lcp: 2500, cls: 0.1, inp: 200 };

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
    window.__v = { cls: 0, lcp: 0, longest: 0, tbt: 0, lcpEl: "" };
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
      for (const e of l.getEntries()) {
        /* Total blocking time: the part of each long task over 50ms. */
        if (e.duration > 50) window.__v.tbt += e.duration - 50;
      }
    }).observe({ type: "longtask", buffered: true });
    /* The lab stand-in for INP: the worst real interaction we drive. */
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (e.duration > window.__v.longest) window.__v.longest = e.duration;
      }
    }).observe({ type: "event", durationThreshold: 16, buffered: true });
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
  rows.push({
    view: label,
    lcp: Math.round(v.lcp),
    cls: +v.cls.toFixed(4),
    inp: Math.round(v.longest),
    tbt: Math.round(v.tbt),
    lcpEl: v.lcpEl,
  });

  await context.close();
}

await browser.close();

const fail = [];
for (const r of rows) {
  if (r.lcp > BUDGET.lcp) fail.push(`${r.view}: LCP ${r.lcp}ms over ${BUDGET.lcp}ms`);
  if (r.cls > BUDGET.cls) fail.push(`${r.view}: CLS ${r.cls} over ${BUDGET.cls}`);
  if (r.inp > BUDGET.inp) fail.push(`${r.view}: worst interaction ${r.inp}ms over ${BUDGET.inp}ms`);
}

let md = `# Direction F — the Phase 1 CWV gate

Generated by \`npm run hotel:cwv\`. Route: \`${ROUTE}\`.

**This is a LAB measurement.** The directive asks for a pass at p75 in the field
via CrUX, and that cannot be produced from this repository — CrUX reports on real
visitors' browsers and the site is not deployed to any. A pass here is necessary,
not sufficient. INP is likewise a field metric; the figure below is the worst
latency of the interactions this script actually drives (a slider dot, a full
scroll, a card hover), which is a floor rather than the real number.

Throttled to a mid-range phone: 4× CPU and Slow 4G on the phone profile, 2× CPU
on desktop.

| view | LCP | CLS | worst interaction | TBT | LCP element |
|---|---|---|---|---|---|
${rows
  .map(
    (r) =>
      `| ${r.view} | ${r.lcp}ms | ${r.cls} | ${r.inp}ms | ${r.tbt}ms | \`${r.lcpEl}\` |`
  )
  .join("\n")}

Budgets: LCP ≤ ${BUDGET.lcp}ms · CLS ≤ ${BUDGET.cls} · interaction ≤ ${BUDGET.inp}ms.

${fail.length ? `## Over budget\n\n${fail.map((f) => `- ${f}`).join("\n")}\n` : "**All budgets met in the lab.**\n"}
`;

fs.writeFileSync(path.join(OUT, "HOTEL-CWV.md"), md);

for (const r of rows) {
  console.log(
    `${r.view.padEnd(8)} LCP ${String(r.lcp).padStart(5)}ms  CLS ${String(r.cls).padEnd(7)} ` +
      `worst-interaction ${String(r.inp).padStart(4)}ms  TBT ${String(r.tbt).padStart(5)}ms  [${r.lcpEl}]`
  );
}
console.log("-> qa/looks/HOTEL-CWV.md   (LAB ONLY — field CrUX is not obtainable here)");
if (fail.length) {
  console.error("\nOVER BUDGET:");
  for (const f of fail) console.error("  " + f);
  process.exitCode = 1;
}
