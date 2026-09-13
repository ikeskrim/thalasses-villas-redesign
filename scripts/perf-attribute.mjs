#!/usr/bin/env node
/**
 * WHERE THE PHONE'S BLOCKING TIME GOES — one route, attributed.
 *
 * `scripts/hotel-cwv.mjs` says how much Total Blocking Time a route has. It
 * cannot say whose it is, and a performance pass that does not know whose it is
 * optimises whatever is easiest to name. This drives the same session as
 * hotel-cwv — the same phone profile (4× CPU, Slow 4G), the same load, slider
 * click, full scroll and card hover — under a Chrome trace with the CPU sampler
 * on, and splits every long task's blocking portion three ways:
 *
 *   by phase     load (up to the end of hotel-cwv's 2.5 s settle) vs interaction
 *   by activity  script evaluate / compile / run, style, layout, paint, image
 *                decode, GC, HTML parse — by SELF time, so a forced layout inside
 *                a scroll handler counts as layout, not as script
 *   by source    the script URL and function the CPU sampler caught inside the
 *                long tasks, with the libraries each chunk carries
 *
 * TBT here is the trace's own (the part of each main-thread task over 50 ms). It
 * tracks hotel-cwv's figure but is not identical to it — tracing costs a little
 * — so before/after NUMBERS come from hotel-cwv, and this explains them.
 *
 *   node scripts/perf-attribute.mjs <route> [--desktop]
 *   -> qa/perf/attribution-<route>-<profile>.md
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const BASE = process.env.CAPTURE_BASE ?? "http://localhost:3005";
const args = process.argv.slice(2);
const RAW = args.find((a) => !a.startsWith("--")) ?? "/";
/* Git Bash rewrites "/" to the MSYS root; same guard as hotel-cwv. */
const ROUTE = /^[A-Za-z]:/.test(RAW) ? "/" : "/" + RAW.replace(/^\/+/, "");
const DESKTOP = args.includes("--desktop");
const PROFILE = DESKTOP ? "desktop" : "phone";
const OUT = path.join(process.cwd(), "qa", "perf");
fs.mkdirSync(OUT, { recursive: true });

const [width, height, mobile] = DESKTOP ? [1440, 900, false] : [390, 844, true];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: mobile ? 4 : 2 });
await cdp.send("Network.enable");
await cdp.send("Network.emulateNetworkConditions", {
  offline: false,
  latency: mobile ? 150 : 40,
  downloadThroughput: ((mobile ? 1.6 : 10) * 1024 * 1024) / 8,
  uploadThroughput: ((mobile ? 0.75 : 5) * 1024 * 1024) / 8,
});

const scripts = new Map();
page.on("response", async (res) => {
  if (res.request().resourceType() !== "script") return;
  try {
    const body = await res.body();
    scripts.set(res.url(), body);
  } catch {
    /* navigated away mid-body */
  }
});

/*
 * EXPERIMENTS WITHOUT AN EDIT. `ATTR_INJECT_CSS` adds a stylesheet at document
 * start, so a candidate fix can be measured before it is written into the site.
 * A figure measured this way is a hypothesis; the figures of record come from
 * the built change.
 */
if (process.env.ATTR_INJECT_CSS) {
  await page.addInitScript((css) => {
    const add = () => {
      const s = document.createElement("style");
      s.setAttribute("data-attr-experiment", "");
      s.textContent = css;
      document.head.appendChild(s);
    };
    if (document.head) add();
    else document.addEventListener("DOMContentLoaded", add, { once: true });
  }, process.env.ATTR_INJECT_CSS);
}

/* hotel-cwv's own longtask observer, so the two TBT figures can be reconciled. */
await page.addInitScript(() => {
  performance.mark("attr:start");
  window.__lt = [];
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) window.__lt.push([e.startTime, e.duration]);
  }).observe({ type: "longtask", buffered: true });
});

await cdp.send("Tracing.start", {
  transferMode: "ReturnAsStream",
  traceConfig: {
    recordMode: "recordAsMuchAsPossible",
    includedCategories: [
      "devtools.timeline",
      "disabled-by-default-devtools.timeline",
      "disabled-by-default-devtools.timeline.stack",
      "toplevel",
      "v8.execute",
      "v8",
      "blink.user_timing",
      "disabled-by-default-v8.cpu_profiler",
      /* Per-selector style cost. Inflates style recalc, so opt-in only. */
      ...(process.env.ATTR_SELECTOR_STATS ? ["disabled-by-default-blink.debug"] : []),
    ],
  },
});

await page.goto(BASE + ROUTE, { waitUntil: "load", timeout: 180_000 });
await page.waitForTimeout(2500);
await page.evaluate(() => performance.mark("attr:interact"));

/* `ATTR_LOAD_ONLY=1`: stop after load and the idle-staged setup — for bisecting. */
if (process.env.ATTR_LOAD_ONLY) {
  await page.waitForTimeout(2000);
} else {
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
  const card = page.locator(".ho-card").first();
  if (await card.count()) {
    await card.hover().catch(() => {});
    await page.waitForTimeout(300);
  }
}

const observed = await page.evaluate(() => window.__lt ?? []);
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
await context.close();
await browser.close();

const parsed = JSON.parse(Buffer.concat(parts).toString("utf8"));
const events = Array.isArray(parsed) ? parsed : parsed.traceEvents;

const shortUrl = (u) => (u ? u.replace(BASE, "").replace(/\?.*$/, "") : "");

/* ---------------------------------------------------------- main thread -- */

const threadKey = (e) => `${e.pid}:${e.tid}`;
const scriptCounts = new Map();
for (const e of events) {
  if ((e.name === "EvaluateScript" || e.name === "v8.compile") && String(e.args?.data?.url ?? "").startsWith(BASE)) {
    scriptCounts.set(threadKey(e), (scriptCounts.get(threadKey(e)) ?? 0) + 1);
  }
}
const MAIN = [...scriptCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
if (!MAIN) {
  console.error("could not find the page's main thread in the trace");
  process.exit(1);
}
const [mainPid] = MAIN.split(":").map(Number);

const mark = (name) => events.filter((e) => e.name === name && e.cat?.includes("user_timing") && e.pid === mainPid).sort((a, b) => a.ts - b.ts)[0]?.ts ?? null;
const T0 = mark("attr:start") ?? Math.min(...events.filter((e) => threadKey(e) === MAIN && e.ts).map((e) => e.ts));
const T_INTERACT = mark("attr:interact");
/*
 * FIRST CONTENTFUL PAINT, from the trace's own paint-timing event. Lighthouse's
 * TBT counts only the long tasks after it, and a change that moves work from
 * after first paint to before it lowers TBT without removing the work — so the
 * report states both sums rather than letting one stand for the other.
 */
const T_FCP =
  events
    .filter((e) => e.name === "firstContentfulPaint" && e.pid === mainPid)
    .sort((a, b) => a.ts - b.ts)[0]?.ts ?? null;

/* Turn B/E pairs into durations, keep X events; main thread only. */
const main = [];
const open = new Map();
for (const e of events) {
  if (threadKey(e) !== MAIN) continue;
  if (e.ph === "X" && typeof e.dur === "number") main.push({ name: e.name, ts: e.ts, dur: e.dur, data: e.args?.data ?? {}, args: e.args ?? {} });
  else if (e.ph === "B") {
    const k = e.name;
    if (!open.has(k)) open.set(k, []);
    open.get(k).push(e);
  } else if (e.ph === "E") {
    const b = open.get(e.name)?.pop();
    if (b) main.push({ name: e.name, ts: b.ts, dur: e.ts - b.ts, data: { ...(b.args?.data ?? {}), ...(e.args?.data ?? {}) }, args: { ...(b.args ?? {}), end: e.args ?? {} } });
  }
}
main.sort((a, b) => a.ts - b.ts || b.dur - a.dur);

const KIND = {
  EvaluateScript: "script: evaluate",
  "v8.compile": "script: compile",
  "v8.compileModule": "script: compile",
  "V8.CompileCode": "script: compile",
  "v8.parseOnBackground": "script: compile",
  "v8.produceCache": "script: compile",
  "v8.deserializeOnBackground": "script: compile",
  FunctionCall: "script: run",
  TimerFire: "script: run",
  FireAnimationFrame: "script: run",
  FireIdleCallback: "script: run",
  EventDispatch: "script: run",
  RunMicrotasks: "script: run",
  "v8.run": "script: run",
  "V8.Execute": "script: run",
  ParseHTML: "parse HTML",
  ParseAuthorStyleSheet: "style: parse",
  UpdateLayoutTree: "style: recalc",
  RecalculateStyles: "style: recalc",
  Layout: "layout",
  PrePaint: "paint",
  Paint: "paint",
  Layerize: "paint",
  Commit: "paint",
  UpdateLayer: "paint",
  UpdateLayerTree: "paint",
  "Decode Image": "image decode",
  ImageDecodeTask: "image decode",
  "Decode LazyPixelRef": "image decode",
  MajorGC: "GC",
  MinorGC: "GC",
  "BlinkGC.AtomicPhase": "GC",
  "V8.GC_MC_BACKGROUND_MARKING": "GC",
  HitTest: "hit test",
};

const tasks = main.filter((e) => e.name === "RunTask" && e.dur > 50_000);
const byKind = new Map();
const byPhase = { load: 0, interaction: 0 };
const taskRows = [];
const layouts = [];
const add = (m, k, v) => m.set(k, (m.get(k) ?? 0) + v);

let cursor = 0;
for (const task of tasks) {
  const end = task.ts + task.dur;
  const weight = (task.dur - 50_000) / task.dur;
  byPhase[T_INTERACT !== null && task.ts >= T_INTERACT ? "interaction" : "load"] += task.dur - 50_000;
  while (cursor < main.length && main[cursor].ts < task.ts) cursor++;
  /* Nesting by stack, self time per activity. */
  const stack = [{ ev: task, kind: "other (task overhead)", child: 0 }];
  const self = new Map();
  const close = (frame) => add(self, frame.kind, Math.max(0, frame.ev.dur - frame.child));
  for (let i = cursor; i < main.length && main[i].ts < end; i++) {
    const ev = main[i];
    if (ev === task || ev.name === "RunTask") continue;
    while (stack.length > 1 && ev.ts >= stack.at(-1).ev.ts + stack.at(-1).ev.dur) close(stack.pop());
    const parent = stack.at(-1);
    const kind = KIND[ev.name] ?? parent.kind;
    if (kind === "layout" || kind === "style: recalc") {
      /* Who asked for it: a script frame above it means a forced (synchronous) pass. */
      const script = [...stack].reverse().find((f) => f.kind.startsWith("script"));
      const frame = ev.args?.beginData?.stackTrace?.[0] ?? ev.data?.stackTrace?.[0];
      const by = frame
        ? `${frame.functionName || "(anonymous)"} ${shortUrl(frame.url)}:${(frame.lineNumber ?? 0) + 1}`
        : script
          ? `${script.ev.name} ${script.ev.data.functionName ?? ""} ${shortUrl(script.ev.data.url)}`.trim()
          : "";
      layouts.push({
        at: (ev.ts - T0) / 1000,
        dur: ev.dur / 1000,
        kind,
        forced: Boolean(script),
        objects: ev.args?.beginData?.totalObjects ?? ev.data?.elementCount ?? "",
        by,
      });
    }
    parent.child += Math.min(ev.dur, parent.ev.ts + parent.ev.dur - ev.ts);
    stack.push({ ev, kind, child: 0 });
  }
  while (stack.length) close(stack.pop());
  let dominant = ["", 0];
  for (const [k, v] of self) {
    add(byKind, k, v * weight);
    if (v > dominant[1]) dominant = [k, v];
  }
  taskRows.push({ i: taskRows.length, at: (task.ts - T0) / 1000, dur: task.dur / 1000, blocking: (task.dur - 50_000) / 1000, dominant: dominant[0], kinds: self });
}
const tbt = tasks.reduce((s, t) => s + t.dur - 50_000, 0) / 1000;

const selectors = new Map();
for (const e of events) {
  const timings = e.args?.selector_stats?.selector_timings;
  if (!Array.isArray(timings) || e.pid !== mainPid) continue;
  for (const s of timings) {
    const cur = selectors.get(s.selector) ?? { elapsed: 0, attempts: 0, matches: 0 };
    /* Chrome's key is literally "elapsed (us)" — microseconds. */
    cur.elapsed += Number(s["elapsed (us)"] ?? s.elapsed ?? 0);
    cur.attempts += Number(s.match_attempts ?? 0);
    cur.matches += Number(s.match_count ?? 0);
    selectors.set(s.selector, cur);
  }
}
const topSelectors = [...selectors.entries()].sort((a, b) => b[1].elapsed - a[1].elapsed).slice(0, 15);
const observedTbt = observed.reduce((s, [, d]) => s + Math.max(0, d - 50), 0);
/* Blocking inside Lighthouse's window: only the part of each task after FCP. */
const afterFcp =
  T_FCP === null
    ? null
    : tasks.reduce((s, t) => {
        const tail = t.ts + t.dur - Math.max(t.ts, T_FCP);
        return s + (tail > 50_000 ? tail - 50_000 : 0);
      }, 0) / 1000;
const fcpAt = T_FCP === null ? null : Math.round((T_FCP - T0) / 1000);

/* ------------------------------------------------------------ CPU samples -- */

const profiles = new Map();
for (const e of events) {
  if (e.name === "Profile" && e.pid === mainPid) profiles.set(e.id, { tid: e.tid, start: e.args.data.startTime, nodes: new Map(), samples: [] });
}
for (const e of events) {
  if (e.name !== "ProfileChunk" || !profiles.has(e.id)) continue;
  const p = profiles.get(e.id);
  const cpu = e.args.data.cpuProfile ?? {};
  for (const n of cpu.nodes ?? []) p.nodes.set(n.id, n);
  const deltas = e.args.data.timeDeltas ?? [];
  (cpu.samples ?? []).forEach((id, i) => p.samples.push([id, deltas[i] ?? 0]));
}
const mainTid = Number(MAIN.split(":")[1]);
const profile = [...profiles.values()].sort((a, b) => (b.tid === mainTid) - (a.tid === mainTid) || b.samples.length - a.samples.length)[0];

const byUrl = new Map();
const byFn = new Map();
const taskFn = tasks.map(() => new Map());
if (profile) {
  let t = profile.start;
  let ti = 0;
  const nodeUrl = (id) => {
    for (let n = profile.nodes.get(id); n; n = profile.nodes.get(n.parent)) if (n.callFrame?.url) return n.callFrame.url;
    return "";
  };
  const times = [];
  for (const [id, d] of profile.samples) {
    t += d;
    times.push([id, t]);
  }
  for (let i = 0; i < times.length - 1; i++) {
    const [id, at] = times[i];
    const span = times[i + 1][1] - at;
    while (ti < tasks.length && tasks[ti].ts + tasks[ti].dur < at) ti++;
    const task = tasks[ti];
    if (!task || at < task.ts) continue;
    const w = (span * (task.dur - 50_000)) / task.dur;
    const node = profile.nodes.get(id);
    const fn = node?.callFrame?.functionName || "(anonymous)";
    if (fn === "(idle)") continue;
    const url = nodeUrl(id);
    add(byUrl, shortUrl(url) || fn, w);
    add(taskFn[ti], `${fn} ${shortUrl(node?.callFrame?.url) || ""}${node?.callFrame?.url ? `:${(node.callFrame.lineNumber ?? 0) + 1}:${(node.callFrame.columnNumber ?? 0) + 1}` : ""}`.trim(), span);
    add(byFn, `${fn} — ${shortUrl(node?.callFrame?.url) || "native"}${node?.callFrame?.url ? `:${(node.callFrame.lineNumber ?? 0) + 1}` : ""}`, w);
  }
}

/* --------------------------------------------------------------- scripts -- */

const SIGNATURES = [
  ["react-dom", /react-dom|__reactContainer\$|Minified React error/],
  ["next runtime", /next-router-state-tree|__next_f|NEXT_REDIRECT/],
  ["gsap", /GreenSock|_gsap\b|gsap\.registerPlugin|\bgsap\b/],
  ["ScrollTrigger", /ScrollTrigger/],
  ["SplitText", /SplitText/],
  ["lenis", /\blenis\b/i],
  ["framer-motion", /framer-motion|MotionConfigContext|LayoutGroupContext/],
  ["three", /WebGLRenderer|THREE\./],
];
const scriptRows = [...scripts.entries()]
  .map(([url, body]) => {
    const text = body.toString("utf8");
    return {
      url: shortUrl(url),
      raw: body.length,
      gzip: zlib.gzipSync(body).length,
      libs: SIGNATURES.filter(([, re]) => re.test(text)).map(([n]) => n),
    };
  })
  .sort((a, b) => b.raw - a.raw);
const libsFor = (u) => scriptRows.find((s) => s.url === u)?.libs.join(", ") ?? "";

/* ---------------------------------------------------------------- report -- */

const ms = (µs) => `${Math.round(µs / 1000)} ms`;
const taskKinds = (r) => [...r.kinds.entries()].sort((a, b) => b[1] - a[1]).filter(([, v]) => v >= 5000).map(([k, v]) => `${k} ${Math.round(v / 1000)}`).join(", ");
const taskFrames = (r) => [...taskFn[r.i].entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `\`${k}\` ${Math.round(v / 1000)}`).join("; ");
const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
const slugRoute = ROUTE === "/" ? "home" : ROUTE.replace(/^\//, "").replace(/\//g, "_");
const md = `# Blocking-time attribution — \`${ROUTE}\`, ${PROFILE}

Generated by \`node scripts/perf-attribute.mjs ${ROUTE}${DESKTOP ? " --desktop" : ""}\`. Same session as
\`hotel-cwv\` (load, 2.5 s settle, slider click, full scroll, card hover) under a trace. **Trace TBT ${Math.round(tbt)} ms**
across ${tasks.length} long tasks — explanatory; the before/after figures of record are hotel-cwv's.
First contentful paint at **${fcpAt ?? "?"} ms**; blocking after it (Lighthouse's TBT window opens at FCP) **${afterFcp === null ? "?" : Math.round(afterFcp)} ms**.

## By phase

| phase | blocking |
|---|---|
| load (to end of settle) | ${ms(byPhase.load)} |
| interaction (click, scroll, hover) | ${ms(byPhase.interaction)} |

## By activity (self time inside long tasks, blocking share)

| activity | blocking |
|---|---|
${top(byKind, 20).map(([k, v]) => `| ${k} | ${ms(v)} |`).join("\n")}

## By script (CPU samples inside long tasks)

| source | blocking | carries |
|---|---|---|
${top(byUrl, 14).map(([k, v]) => `| \`${k}\` | ${ms(v)} | ${libsFor(k)} |`).join("\n")}

## Hottest functions

| function | blocking |
|---|---|
${top(byFn, 15).map(([k, v]) => `| \`${k.replace(/\|/g, "\\|")}\` | ${ms(v)} |`).join("\n")}

## Largest layout and style passes inside long tasks

| at | duration | pass | forced by script | objects | requested by |
|---|---|---|---|---|---|
${[...layouts].sort((a, b) => b.dur - a.dur).slice(0, 12).map((l) => `| ${Math.round(l.at)} ms | ${Math.round(l.dur)} ms | ${l.kind} | ${l.forced ? "yes" : "no"} | ${l.objects} | \`${l.by.replace(/\|/g, "\\|")}\` |`).join("\n")}

## The page's own longtask observer (what hotel-cwv sums)

Observer TBT **${Math.round(observedTbt)} ms** across ${observed.length} long tasks: ${observed.map(([s, d]) => `${Math.round(s)}+${Math.round(d)}`).join(", ")} (start+duration, ms).

## Longest tasks

| at | duration | blocking | activity (self ms) | top sampled frames (ms) |
|---|---|---|---|---|
${[...taskRows].sort((a, b) => b.dur - a.dur).slice(0, 12).map((r) => `| ${Math.round(r.at)} ms | ${Math.round(r.dur)} ms | ${Math.round(r.blocking)} ms | ${taskKinds(r)} | ${taskFrames(r).replace(/\|/g, "\\|")} |`).join("\n")}

## Scripts loaded (${scriptRows.length}, ${Math.round(scriptRows.reduce((s, r) => s + r.gzip, 0) / 1024)} kB gzip)

| script | raw | gzip | carries |
|---|---|---|---|
${scriptRows.map((r) => `| \`${r.url}\` | ${Math.round(r.raw / 1024)} kB | ${Math.round(r.gzip / 1024)} kB | ${r.libs.join(", ")} |`).join("\n")}
`;
const file = path.join(OUT, `attribution-${slugRoute}-${PROFILE}.md`);
fs.writeFileSync(file, md);

console.log(`${ROUTE} ${PROFILE}: FCP at ${fcpAt ?? "?"} ms · blocking after FCP ${afterFcp === null ? "?" : Math.round(afterFcp)} ms · trace TBT ${Math.round(tbt)} ms (${tasks.length} long tasks) — load ${ms(byPhase.load)}, interaction ${ms(byPhase.interaction)} · observer TBT ${Math.round(observedTbt)} ms (${observed.map(([s, d]) => `${Math.round(s)}+${Math.round(d)}`).join(", ")})`);
for (const [sel, s] of topSelectors.slice(0, 10)) console.log(`  selector ${(s.elapsed / 1000).toFixed(1)} ms  attempts ${s.attempts}  matches ${s.matches}  ${sel.slice(0, 110)}`);
for (const r of taskRows) console.log(`  task ${Math.round(r.at)}+${Math.round(r.dur)} ms: ${taskKinds(r)} | ${taskFrames(r).replace(/`/g, "")}`);
for (const l of [...layouts].sort((a, b) => b.dur - a.dur).slice(0, 4)) console.log(`  ${l.kind} ${Math.round(l.dur)} ms at ${Math.round(l.at)} ms, forced=${l.forced}, objects ${l.objects}, by ${l.by}`);
for (const [k, v] of top(byKind, 6)) console.log(`  ${k.padEnd(24)} ${ms(v)}`);
for (const [k, v] of top(byUrl, 6)) console.log(`  ${k.slice(0, 70).padEnd(70)} ${ms(v)}`);
console.log(`-> ${path.relative(process.cwd(), file)}`);
