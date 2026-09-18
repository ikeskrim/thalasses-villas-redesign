#!/usr/bin/env node
/**
 * THE ESTATE MAP'S GATE, CHECKED ON A DEPLOYMENT.
 *
 *   node scripts/check-estate-gate.mjs https://<deployment or domain>
 *
 * The 3D estate map is public only when both conditions hold:
 *  - provenance (D-021): content/estate-plan.json is owner-verified;
 *  - INP (D-028): the committed harness record, qa/perf/INP-estate3d-gate.json,
 *    shows every review-build tap under 200 ms, for this tree's fingerprint.
 * `tests/estate-3d.spec.ts` proves that on a local build. This checks what a
 * real deployment serves, by reading the COMMITTED plan and record and deciding
 * the gate exactly as a production build does (same inputs, same function), so
 * the check needs no edit the day both conditions pass: until then it expects
 * no render plan on the page, and after it expects one. It prints each
 * condition's verdict separately.
 *
 * Run it against the deployment of the commit whose plan and record are checked
 * out here, from the repository root, with node_modules installed (the
 * fingerprint reads the installed three, react, react-dom and next). A
 * deployment of an older commit may legitimately disagree.
 *
 * What it reads, and why both:
 *  - the HTML of /en/the-estate — the 2D map is always server-rendered, so its
 *    markers must be there either way;
 *  - the page's flight data (the same URL with `RSC: 1`) — the render plan is a
 *    prop, and would travel there even if no element of it reached the HTML.
 * A closed gate ships the marker string `estate-render-plan/1` in neither.
 *
 * Imports the gate's TypeScript directly (Node's type stripping, Node 22.6+),
 * so there is one implementation of the rules, not a copy that could drift.
 */
import fs from "node:fs";
import path from "node:path";

const origin = (process.argv[2] ?? "").replace(/\/+$/, "");
if (!/^https?:\/\//.test(origin)) {
  console.error("usage: node scripts/check-estate-gate.mjs https://<deployment or domain>");
  process.exit(2);
}

const { decideEstate3D, describeGateDecision } = await import("../src/lib/estate-plan-gate.ts");
const { estate3dInpInput } = await import("../src/lib/estate-3d-fingerprint.ts");
const root = process.cwd();
const plan = JSON.parse(fs.readFileSync(path.join(root, "content", "estate-plan.json"), "utf-8"));
const decision = decideEstate3D(plan, {}, estate3dInpInput(root, plan));

const route = `${origin}/en/the-estate`;
const htmlRes = await fetch(route, { redirect: "manual" });
const html = await htmlRes.text();
/*
 * Followed, not refused: Next answers a flight request that lacks its `_rsc`
 * cache-busting parameter with a 307 to the same URL carrying it, and a browser
 * follows that. The RSC header travels with the same-origin redirect.
 */
const rscRes = await fetch(route, { redirect: "follow", headers: { RSC: "1" } });
const rsc = await rscRes.text();

const MARKER = "estate-render-plan/1";
const markers = (html.match(/class="estate-map-marker/g) ?? []).length;
const inHtml = html.includes(MARKER);
const inRsc = rsc.includes(MARKER);

const failures = [];
if (htmlRes.status !== 200) failures.push(`HTML: HTTP ${htmlRes.status}`);
if (rscRes.status !== 200) failures.push(`flight data: HTTP ${rscRes.status}`);
if (markers === 0) failures.push("no 2D map markers in the HTML: the server-rendered map is missing");
if (!decision.open && (inHtml || inRsc)) failures.push(`the gate is closed (${decision.reason}), but a render plan was served`);
if (decision.open && !inRsc) failures.push("both conditions pass (owner-verified plan, INP record under 200 ms), but no render plan was served");

console.log(`check-estate-gate ${route} at ${new Date().toISOString()}`);
console.log("committed plan and INP record, decided as a production build decides them:");
for (const line of describeGateDecision(decision)) console.log(`  ${line}`);
console.log(`HTML ${htmlRes.status}: ${markers} markers, render plan ${inHtml ? "present" : "absent"}`);
console.log(`flight data ${rscRes.status}${rscRes.redirected ? ` (after a redirect, from ${new URL(rscRes.url).pathname}${new URL(rscRes.url).search})` : ""}: render plan ${inRsc ? "present" : "absent"}`);
/* exitCode, not exit(): exiting while fetch handles are still closing trips a libuv assertion on Windows. */
if (failures.length) {
  console.log(`FAIL:\n  - ${failures.join("\n  - ")}`);
  process.exitCode = 1;
} else {
  console.log("PASS: the deployment serves what the gate decides for the committed plan and INP record");
}
