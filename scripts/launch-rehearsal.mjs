#!/usr/bin/env node
/**
 * THE LAUNCH DRESS REHEARSAL — LAUNCH.md's verifiable steps, against a real
 * deployment rather than localhost.
 *
 * The local suite proves the build; this proves the DEPLOYMENT. They differ in
 * exactly the places launch day is decided: the redirects are served by Vercel's
 * edge, not by `next start`; the canonical origin comes from Vercel's own
 * environment unless SITE_URL is set; headers are Vercel's. So each check here
 * is run against the URL a visitor would open.
 *
 *   REHEARSAL_BASE=https://<deployment>.vercel.app node scripts/launch-rehearsal.mjs
 *
 * Writes qa/launch/LAUNCH-REHEARSAL.md and .json. Exits non-zero on any RED.
 * AMBER is a finding the owner should know about that is not a launch blocker.
 *
 * What it does NOT do, on purpose: flip indexing, touch DNS, or set SITE_URL.
 * The noindex flip and the SITE_URL builds are rehearsed LOCALLY by the steps in
 * the report, because rehearsing them on a public deployment would do them.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const BASE = (process.env.REHEARSAL_BASE ?? process.argv[2] ?? "").replace(/\/$/, "");
if (!/^https?:\/\//.test(BASE)) {
  console.error("usage: REHEARSAL_BASE=https://<deployment> node scripts/launch-rehearsal.mjs");
  process.exit(2);
}
const ROOT = process.cwd();
const OUT = path.join(ROOT, "qa", "launch");
fs.mkdirSync(OUT, { recursive: true });

const rows = []; /* { section, check, status: GREEN|AMBER|RED, detail } */
const add = (section, check, status, detail) => rows.push({ section, check, status, detail });
const UA = { "user-agent": "thalasses-launch-rehearsal/1.0 (+owner dress rehearsal)" };

async function get(url, opts = {}) {
  const res = await fetch(url, { headers: UA, redirect: "manual", ...opts });
  return res;
}
async function text(url) {
  const res = await fetch(url, { headers: UA });
  return { status: res.status, body: await res.text(), headers: res.headers };
}

/* ----------------------------------------------------------- 0. routes -- */
const sm = await text(`${BASE}/sitemap.xml`);
const locs = [...sm.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const routes = locs.map((u) => new URL(u).pathname);
const sitemapOrigins = [...new Set(locs.map((u) => new URL(u).origin))];
add("Deployment", "sitemap reachable on the deployment", sm.status === 200 && routes.length > 20 ? "GREEN" : "RED",
  `${sm.status}, ${routes.length} URLs`);

/* ------------------------------------------------------- 1. redirects -- */
const redirects = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "generated", "redirects.json"), "utf-8")).redirects;
let rOk = 0;
const rBad = [];
for (const r of redirects) {
  try {
    const first = await get(BASE + r.source);
    const loc = first.headers.get("location");
    const target = loc ? new URL(loc, BASE) : null;
    const want = new URL(r.destination, BASE);
    const permanent = first.status === 308 || first.status === 301;
    const samePlace = target && target.pathname === want.pathname && target.search === want.search;
    let landed = 0;
    if (target) landed = (await get(new URL(target.pathname + target.search, BASE).href)).status;
    if (permanent && samePlace && landed === 200) rOk++;
    else rBad.push(`${r.source} → ${first.status} ${loc ?? "(no location)"} → ${landed} (want ${r.destination})`);
  } catch (e) {
    rBad.push(`${r.source}: ${e.message}`);
  }
}
add("Redirects", `legacy URLs redirect permanently and land on a 200`, rBad.length ? "RED" : "GREEN",
  `${rOk} / ${redirects.length}` + (rBad.length ? ` — ${rBad.slice(0, 5).join("; ")}` : ""));

const gaps = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "redirect-gaps.json"), "utf-8")).gaps ?? [];
add("Redirects", "the gaps file is empty", gaps.length ? "RED" : "GREEN", `${gaps.length} open gaps in content/redirect-gaps.json`);

/* ------------------------------------------------ 2. link integrity -- */
const crawl = spawnSync(process.execPath, [path.join("scripts", "link-crawl.mjs")], {
  cwd: ROOT,
  env: { ...process.env, CAPTURE_BASE: BASE },
  encoding: "utf-8",
  timeout: 20 * 60 * 1000,
});
const cOut = `${crawl.stdout ?? ""}\n${crawl.stderr ?? ""}`;
const mBroken = /(\d+) internal destinations, (\d+) broken/.exec(cOut);
const mFrag = /(\d+) fragments naming nothing/.exec(cOut);
const mExt = /(\d+) external links, (\d+) not answering/.exec(cOut);
if (!mBroken) add("Links", "link-integrity crawl ran", "RED", `no summary line — exit ${crawl.status}: ${cOut.slice(-300)}`);
else {
  add("Links", "every internal link resolves", Number(mBroken[2]) === 0 ? "GREEN" : "RED",
    `${mBroken[1]} internal destinations, ${mBroken[2]} broken`);
  add("Links", "every in-page fragment names an element", mFrag && Number(mFrag[1]) === 0 ? "GREEN" : "RED",
    `${mFrag ? mFrag[1] : "?"} fragments naming nothing`);
  if (mExt) add("Links", "external links answer (not a launch blocker)", Number(mExt[2]) === 0 ? "GREEN" : "AMBER",
    `${mExt[1]} external, ${mExt[2]} not answering a scripted request`);
}

/* ---------------------------------------------- 3. structured data -- */
const location = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "location.json"), "utf-8"));
const decimals = (n) => (String(n).split(".")[1] ?? "").length;
let ldBlocks = 0;
const ldProblems = [];
const vrFindings = new Set();
const lbFindings = new Set();
for (const r of routes) {
  const { body } = await text(BASE + r);
  const blocks = [...body.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  for (const raw of blocks) {
    ldBlocks++;
    let j;
    try {
      j = JSON.parse(raw);
    } catch (e) {
      ldProblems.push(`${r}: does not parse — ${e.message}`);
      continue;
    }
    if (j["@context"] !== "https://schema.org") ldProblems.push(`${r}: @context is ${j["@context"]}`);
    if (!j["@type"]) ldProblems.push(`${r}: no @type`);
    const lat = j.latitude ?? j.geo?.latitude;
    const lng = j.longitude ?? j.geo?.longitude;
    if (lat != null && (Math.abs(lat - Number(location.coordinates?.lat ?? lat)) > 0.01)) ldProblems.push(`${r}: latitude ${lat} disagrees with content/location.json`);
    if (j["@type"] === "VacationRental") {
      /* Google's documented requirements (developers.google.com/search/docs/appearance/structured-data/vacation-rental). */
      if (!j.name) ldProblems.push(`${r}: VacationRental with no name`);
      if (!j.identifier) vrFindings.add("identifier");
      if (!j.image || (Array.isArray(j.image) ? j.image.length : 1) < 8) vrFindings.add("image (8 or more)");
      if (!j.containsPlace?.occupancy?.value) vrFindings.add("containsPlace.occupancy.value (occupancy is at the top level)");
      if (lat == null || decimals(lat) < 5) vrFindings.add("latitude to 5 decimal places");
      if (lng == null || decimals(lng) < 5) vrFindings.add("longitude to 5 decimal places");
    }
    if (j["@type"] === "LodgingBusiness") {
      if (!j.name || !j.address?.addressLocality || !j.address?.addressCountry) ldProblems.push(`${r}: LodgingBusiness missing name or address`);
      if (!j.image) lbFindings.add("image");
      if (!j.telephone) lbFindings.add("telephone");
      if (!j.url) lbFindings.add("url");
    }
  }
}
add("Structured data", "every JSON-LD block parses, declares schema.org and a type, and agrees with the registry",
  ldProblems.length ? "RED" : "GREEN", `${ldBlocks} blocks across ${routes.length} routes` + (ldProblems.length ? ` — ${ldProblems.slice(0, 4).join("; ")}` : ""));
if (vrFindings.size)
  add("Structured data", "VacationRental against Google's documented requirements", "AMBER",
    `missing: ${[...vrFindings].join(", ")}. Google restricts VacationRental rich results to partners connected through a ` +
      `Technical Account Manager and Hotel Center, so this markup cannot earn a rich result on this site today either way.`);
if (lbFindings.size)
  add("Structured data", "LodgingBusiness recommended properties", "AMBER", `not present: ${[...lbFindings].join(", ")}`);

/* ------------------------------------------------ 4. indexing state -- */
const robots = await text(`${BASE}/robots.txt`);
const blanket = /User-Agent:\s*\*\s*\n\s*Disallow:\s*\/\s*$/im.test(robots.body);
add("Indexing", "robots.txt still disallows everything (pre-launch, by design)", blanket ? "GREEN" : "RED",
  robots.body.trim().replace(/\n/g, " ⏎ "));
const home = await text(`${BASE}/`);
const xrt = home.headers.get("x-robots-tag");
add("Indexing", "X-Robots-Tag on the deployment", "GREEN",
  xrt ? `"${xrt}" — set by Vercel on a *.vercel.app deployment URL; it will not be present on thalasses.com` : "none");

/* -------------------------------------------------- 5. SITE_URL origin -- */
const canon = (html) => /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1] ?? null;
const ogUrl = (html) => /<meta property="og:url" content="([^"]+)"/.exec(html)?.[1] ?? null;
const ogImg = (html) => /<meta property="og:image" content="([^"]+)"/.exec(html)?.[1] ?? null;
const villa = await text(`${BASE}/en/villas/villa-thoi`);
const origins = {
  "canonical /": canon(home.body),
  "canonical villa": canon(villa.body),
  "og:url /": ogUrl(home.body),
  "og:image /": ogImg(home.body),
  "sitemap <loc>": sitemapOrigins.join(" "),
  "robots Sitemap:": /Sitemap:\s*(\S+)/.exec(robots.body)?.[1] ?? null,
};
const seen = [...new Set(Object.values(origins).filter(Boolean).map((u) => new URL(u.split(" ")[0]).origin))];
add("SITE_URL", "every absolute URL on the deployment agrees on one origin", seen.length === 1 ? "GREEN" : "RED",
  `${seen.join(" | ")} — ${Object.entries(origins).map(([k, v]) => `${k}: ${v}`).join("; ")}`);
add("SITE_URL", "that origin is the launch domain", seen[0] === "https://thalasses.com" ? "GREEN" : "AMBER",
  seen[0] === "https://thalasses.com"
    ? "https://thalasses.com — the fallback; set SITE_URL explicitly on launch day anyway (LAUNCH.md step 0)"
    : `${seen[0]} — the deployment is announcing its own origin, which is the correct pre-launch behaviour; ` +
      `SITE_URL=https://thalasses.com on launch day switches every one of them at once`);

/* ------------------------------------------------ 6. WebHotelier CTAs -- */
const ALLOWED = new Set(["lang", "checkin", "checkout", "nights", "adults", "children", "rooms"]);
const ctas = new Map(); /* href -> [routes] */
const forms = [];
for (const r of routes) {
  const { body } = await text(BASE + r);
  for (const m of body.matchAll(/href="(https?:\/\/[^"]*reserve-online\.net[^"]*)"/g)) {
    const href = m[1].replace(/&amp;/g, "&");
    ctas.set(href, [...(ctas.get(href) ?? []), r]);
  }
  for (const m of body.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/g)) {
    const attrs = m[1];
    const action = /action="([^"]*)"/.exec(attrs)?.[1]?.replace(/&amp;/g, "&");
    if (!action || !/reserve-online\.net/.test(action)) continue;
    const method = (/method="([^"]*)"/.exec(attrs)?.[1] ?? "get").toLowerCase();
    const langField = /<input[^>]*name="lang"[^>]*value="en"|<input[^>]*value="en"[^>]*name="lang"/.test(m[2]);
    forms.push({ route: r, action, method, langField });
  }
}
const ctaProblems = [];
for (const [href, where] of ctas) {
  const u = new URL(href);
  if (u.hostname !== "thalassesvillas.reserve-online.net") ctaProblems.push(`${href} (host) on ${where[0]}`);
  if (u.searchParams.get("lang") !== "en") ctaProblems.push(`${href} (no lang=en) on ${where[0]}`);
  for (const k of u.searchParams.keys()) if (!ALLOWED.has(k)) ctaProblems.push(`${href} (param ${k}) on ${where[0]}`);
}
/* A GET form DISCARDS its action's query string — lang must be a field. */
for (const f of forms) if (f.method === "get" && !f.langField) ctaProblems.push(`form on ${f.route}: GET to ${f.action} with no lang=en field — the browser drops ?lang from the action`);
const routesWithCta = new Set([...ctas.values()].flat());
add("Booking", "every WebHotelier link and form: the real engine, lang=en, dates-only parameters", ctaProblems.length ? "RED" : "GREEN",
  `${ctas.size} distinct links on ${routesWithCta.size} routes, ${forms.length} forms` + (ctaProblems.length ? ` — ${ctaProblems.slice(0, 5).join("; ")}` : ""));

/* One live request per distinct link: the engine answers, in English. */
let live = 0;
const liveBad = [];
for (const href of [...ctas.keys()].slice(0, 12)) {
  try {
    const res = await fetch(href, { headers: { ...UA, "accept-language": "hr" } });
    const body = await res.text();
    const lang = /<html[^>]*\blang="([^"]+)"/i.exec(body)?.[1] ?? "?";
    if (res.status === 200 && lang.toLowerCase().startsWith("en")) live++;
    else liveBad.push(`${href} → ${res.status}, <html lang="${lang}">`);
  } catch (e) {
    liveBad.push(`${href}: ${e.message}`);
  }
}
/*
 * A 403 from the engine is only a finding about THIS property if the platform
 * answers scripts at all. Measured 2026-09-11: CloudFront in front of
 * reserve-online.net refuses every automated request — curl, headless
 * Chromium, and a fetcher on a different network — for three properties on the
 * platform, one of them another brand, while WebHotelier's own site answers 200.
 * That is a platform rule against automation, and the answer to it is a human
 * in a normal browser (LAUNCH.md step 2), never a disguised script. So the
 * check asks a CONTROL property first, and tells the two cases apart.
 */
const control = await fetch("https://inkhotels.reserve-online.net/about", { headers: UA }).then((r) => r.status, () => 0);
if (!liveBad.length) {
  add("Booking", "each distinct link opens the engine in English, even for a Croatian-preferring browser", "GREEN",
    `${live} / ${Math.min(12, ctas.size)} answered 200 with <html lang="en">`);
} else if (control === 403 && liveBad.every((b) => / 403,/.test(b))) {
  add("Booking", "each distinct link opens the engine — by script", "AMBER",
    `not verifiable by script: the platform's CDN refuses automated requests (ours 403, control property 403, ` +
      `webhotelier.net 200). Link construction is verified above; opening one by hand in a normal browser is ` +
      `LAUNCH.md step 2 and is the check that counts — ${liveBad.join("; ")}`);
} else {
  add("Booking", "each distinct link opens the engine in English", "RED",
    `control property answered ${control}, ours did not — ${liveBad.join("; ")}`);
}

/* ---------------------------------------------------------- report -- */
const red = rows.filter((r) => r.status === "RED");
const amber = rows.filter((r) => r.status === "AMBER");
let md = `# Launch dress rehearsal

Against **${BASE}** — the deployment of the commit under test, not localhost.
Generated by \`node scripts/launch-rehearsal.mjs\`.

**${rows.length - red.length - amber.length} green · ${amber.length} amber · ${red.length} red.**

| section | check | | detail |
|---|---|---|---|
`;
for (const r of rows) md += `| ${r.section} | ${r.check} | **${r.status}** | ${String(r.detail).replace(/\|/g, "\\|")} |\n`;
fs.writeFileSync(path.join(OUT, "LAUNCH-REHEARSAL.md"), md);
fs.writeFileSync(path.join(OUT, "launch-rehearsal.json"), JSON.stringify({ base: BASE, rows }, null, 2) + "\n");
for (const r of rows) console.log(`${r.status.padEnd(5)} ${r.section.padEnd(16)} ${r.check}\n      ${r.detail}`);
console.log(`\n-> qa/launch/LAUNCH-REHEARSAL.md   ${red.length} red, ${amber.length} amber`);
process.exitCode = red.length ? 1 : 0;
