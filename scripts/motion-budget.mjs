#!/usr/bin/env node
/**
 * THE MOTION JS BUDGET, MEASURED ON WHAT THE HOMEPAGE ACTUALLY FETCHES.
 *
 * `MOTION-DIRECTIVE.md` §F: total added motion JS about 55–70 kB gzip, with
 * WebGL and video deferred so first paint ships only Lenis and GSAP core.
 *
 * Two earlier versions of this measurement were wrong in opposite directions.
 * Summing every chunk that mentioned a motion library counted Next's 70 kB
 * router runtime, because it mentions `startViewTransition` once. Summing only
 * the chunks named in `/`'s HTML missed GSAP entirely, because HotelMotion
 * `import()`s it after paint — deferred is not absent. A budget is what the
 * browser downloads, so this opens the page in one and records that.
 *
 *   node scripts/motion-budget.mjs           (server on :3005, or CAPTURE_BASE)
 *
 * Reports three figures: motion JS at first paint, motion JS deferred until
 * after paint (dynamic imports, lazy islands), and the total — which is the
 * budgeted number.
 */
import zlib from "node:zlib";
import { chromium } from "playwright";

const BASE = process.env.CAPTURE_BASE ?? "http://localhost:3005";
const BUDGET_KB = 70;

/** The project's own markers, not framework API names. */
const SIGNATURES = [
  ["gsap", /gsap\.registerPlugin|_gsap|ScrollTrigger/],
  ["lenis", /\bLenis\b|lenis/],
  ["splittext", /SplitText/],
  ["webgl", /ho-liquid|uCover|WEBGL_lose_context/],
  ["framer", /framer-motion|__framer/],
  ["view-transition", /villa-hero|data-vt/],
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const seen = new Map(); /* url -> { bytes, gz, tags, phase } */
let phase = "first-paint";

page.on("response", async (res) => {
  const url = res.url();
  if (!/\/_next\/static\/chunks\/.*\.js(\?|$)/.test(url) || seen.has(url)) return;
  try {
    const body = await res.body();
    const text = body.toString("latin1");
    const tags = SIGNATURES.filter(([, re]) => re.test(text)).map(([t]) => t);
    seen.set(url, { bytes: body.length, gz: zlib.gzipSync(body).length, tags, phase });
  } catch {
    /* a response that cannot be read is not counted, and is said so below */
    seen.set(url, { bytes: 0, gz: 0, tags: ["unreadable"], phase });
  }
});

/*
 * ROUTE PREFETCH IS NOT HOMEPAGE MOTION. The villa cards are `next/link`s, and
 * Link prefetches the villa route's chunks when the cards scroll into view —
 * the villa page's own client bundle, fetched on `/` so the morph navigation is
 * instant. It is a real download and it is reported, but it is another route's
 * JavaScript and does not count against this page's motion budget.
 */
const homeHtml = await (await fetch(BASE + "/")).text();
const villaHtml = await (await fetch(BASE + "/en/villas/villa-thoi")).text();
const chunksIn = (html) => new Set([...html.matchAll(/\/_next\/static\/chunks\/([^"'\s]+\.js)/g)].map((m) => m[1]));
const HOME = chunksIn(homeHtml);
const VILLA = chunksIn(villaHtml);

await page.goto(BASE + "/", { waitUntil: "load" });
await page.waitForTimeout(300);
phase = "deferred";
/* Everything that loads after paint: the dynamic imports, and the lazy islands
   that only initialise as their section nears — scroll the whole page. */
await page.evaluate(async () => {
  const h = document.documentElement.scrollHeight;
  for (let y = 0; y <= h; y += 500) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 90));
  }
});
await page.waitForTimeout(1500);
await browser.close();

const rows = [...seen.entries()]
  .map(([url, r]) => {
    const file = url.split("/chunks/")[1].split("?")[0];
    const prefetch = !HOME.has(file) && VILLA.has(file);
    return { file, ...r, phase: prefetch ? "prefetch" : r.phase };
  })
  .filter((r) => r.tags.length)
  .sort((a, b) => {
    const order = { "first-paint": 0, deferred: 1, prefetch: 2 };
    return order[a.phase] - order[b.phase] || b.gz - a.gz;
  });

let first = 0;
let deferred = 0;
let prefetched = 0;
for (const r of rows) {
  if (r.phase === "first-paint") first += r.gz;
  else if (r.phase === "deferred") deferred += r.gz;
  else prefetched += r.gz;
  console.log(
    `${(r.gz / 1024).toFixed(1).padStart(7)} kB  ${r.phase.padEnd(11)} ${r.tags.join("+").padEnd(28)} ${r.file}`
  );
}
console.log("-".repeat(76));
const total = (first + deferred) / 1024;
console.log(`motion JS at first paint:   ${(first / 1024).toFixed(1)} kB gzip`);
console.log(`motion JS deferred:         ${(deferred / 1024).toFixed(1)} kB gzip`);
console.log(`TOTAL motion JS on /:       ${total.toFixed(1)} kB gzip   (budget ~${BUDGET_KB} kB)  ${total <= BUDGET_KB ? "WITHIN" : "OVER"}`);
console.log(`prefetched for villa pages: ${(prefetched / 1024).toFixed(1)} kB gzip   (another route's bundle, fetched on / by next/link; not budgeted)`);
process.exitCode = total <= BUDGET_KB ? 0 : 1;
