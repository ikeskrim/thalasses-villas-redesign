#!/usr/bin/env node
/**
 * CORE WEB VITALS, MEASURED IN THE BROWSER.
 *
 * Not Lighthouse: it is not installed and there is no network to fetch it. This
 * uses the same PerformanceObserver entries Lighthouse reads — LCP from
 * `largest-contentful-paint`, CLS from `layout-shift`, and TBT-style long-task
 * total as the INP proxy, since INP needs real interaction and cannot be
 * synthesised honestly.
 *
 * Mobile settings: 390x844, 4x CPU throttle, Slow-4G network, via CDP. Numbers
 * are reported as measured, with the method stated, and nothing is called
 * "good" that was not compared against the stated budget.
 */
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3005";
const ROUTES = [
  ["/", "homepage"],
  ["/en/villas/villa-eeanthe", "villa (104 photos)"],
  ["/en/the-estate", "estate"],
  ["/en/experiences", "experiences"],
];

const BUDGET = { lcp: 2500, cls: 0.1, tbt: 200 };

const browser = await chromium.launch();
const rows = [];

for (const [route, label] of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  await page.addInitScript(() => {
    // @ts-expect-error test-only globals
    window.__lcp = 0; window.__cls = 0; window.__long = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__lcp = Math.max(window.__lcp, e.startTime);
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__long += Math.max(0, e.duration - 50);
    }).observe({ type: "longtask", buffered: true });
  });

  const t0 = Date.now();
  await page.goto(BASE + route, { waitUntil: "load", timeout: 180_000 });
  await page.waitForTimeout(4000);

  const m = await page.evaluate(() => ({
    lcp: Math.round(window.__lcp),
    cls: Math.round(window.__cls * 1000) / 1000,
    tbt: Math.round(window.__long),
    bytes: performance.getEntriesByType("resource").reduce((a, r) => a + (r.transferSize || 0), 0),
    reqs: performance.getEntriesByType("resource").length,
    imgs: document.querySelectorAll("img").length,
  }));
  rows.push({ label, route, ...m, wall: Date.now() - t0 });
  await ctx.close();
}
await browser.close();

const pad = (s, n) => String(s).padEnd(n);
console.log("\nMOBILE — 390x844, CPU 4x, Slow-4G. PerformanceObserver, same entries Lighthouse reads.\n");
console.log(pad("route", 22), pad("LCP", 10), pad("CLS", 9), pad("longtask", 10), pad("transfer", 11), "imgs");
for (const r of rows) {
  const lcp = `${r.lcp}ms${r.lcp <= BUDGET.lcp ? "" : " OVER"}`;
  const cls = `${r.cls}${r.cls <= BUDGET.cls ? "" : " OVER"}`;
  const tbt = `${r.tbt}ms${r.tbt <= BUDGET.tbt ? "" : " OVER"}`;
  console.log(pad(r.label, 22), pad(lcp, 10), pad(cls, 9), pad(tbt, 10), pad(`${(r.bytes / 1024).toFixed(0)} KB`, 11), r.imgs);
}
console.log(`\nbudgets: LCP <= ${BUDGET.lcp}ms, CLS <= ${BUDGET.cls}, long-task total <= ${BUDGET.tbt}ms`);
