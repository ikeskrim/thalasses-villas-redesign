#!/usr/bin/env node
/**
 * REGISTRY COVERAGE — which recovered facts never reach a page.
 *
 * This project has now fixed the same defect four times under four different
 * names, and every one of them was invisible because **nothing on screen looks
 * wrong when a fact is simply absent**:
 *
 *   T-212  villa capacity details reaching pages only through JSON-LD
 *   T-243  the Direction D rebuild silently dropping those detail rows again
 *   T-223  eight beach distances rendering as an em dash
 *   T-284  the wedding venue's figures and its 43-item inventory, printed nowhere
 *
 * The through-line is the whole point of this rebuild: **keep all existing
 * content.** A fact recovered in Phase 0, stored in the registry, and never
 * rendered has been lost as surely as if it had been deleted — it just leaves
 * no trace when it goes.
 *
 * So this walks every registry entry, finds each leaf value that carries real
 * content, and asks the rendered page whether that value appears. What it
 * cannot find is either a gap worth closing or a deliberate omission worth
 * recording — and both are better than not knowing.
 *
 *   node scripts/registry-coverage.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.CAPTURE_BASE ?? "http://localhost:3005";
const OUT = path.join(process.cwd(), "qa", "coverage");
fs.mkdirSync(OUT, { recursive: true });

const CONTENT = path.join(process.cwd(), "content");
const readJson = (...p) => JSON.parse(fs.readFileSync(path.join(CONTENT, ...p), "utf-8"));

/**
 * Fields that are MACHINERY, not content. Excluded by name because they are
 * plumbing — ids, slugs, urls, provenance notes and the todo lists — and a
 * coverage report that demands `legacyUrls` appear on the page is a report
 * nobody reads.
 *
 * Every exclusion here is a decision; none of them is a threshold that was
 * lowered until the number looked good. (CONVENTIONS §18.)
 */
const MACHINERY = new Set([
  "id",
  "slug",
  "canonical",
  "legacyUrls",
  "pageType",
  "bookable",
  "ref",
  "meta",
  "todos",
  "booking",
  "map",
  "video",
  "gallery",
  "facilities",
  "specsSource",
  "specsConfirmed",
  "source",
  "sources",
  "provenance",
  "note",
  "notes",
]);

/** Values too generic to prove anything by their presence. */
function meaningful(value) {
  if (value == null) return false;
  if (typeof value === "number") return value > 0;
  if (typeof value !== "string") return false;
  const s = value.trim();
  if (s.length < 8) return false;
  if (/^https?:\/\//.test(s)) return false;
  if (/^[0-9a-f]{16,}$/i.test(s)) return false;
  return true;
}

/** Every leaf of an object, with a dotted path, skipping machinery subtrees. */
function leaves(node, prefix = "", out = []) {
  if (Array.isArray(node)) {
    node.forEach((v, i) => leaves(v, `${prefix}[${i}]`, out));
    return out;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (MACHINERY.has(k)) continue;
      leaves(v, prefix ? `${prefix}.${k}` : k, out);
    }
    return out;
  }
  if (meaningful(node)) out.push({ path: prefix, value: node });
  return out;
}

/**
 * Normalised page text. Typographic quotes, non-breaking spaces and the
 * en/em dashes the design uses would otherwise make a fact look missing when it
 * is on the page in a slightly different shape — a false positive here costs
 * more than a false negative, because it is what makes a report get ignored.
 */
function normalise(s) {
  return String(s)
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—−]/g, "-")
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const TARGETS = [
  ["200", "/en/villas/villa-thoi"],
  ["201", "/en/villas/villa-persi"],
  ["202", "/en/villas/villa-eeanthe"],
  ["203", "/en/villas/villa-melia"],
  ["pueblo", "/en/villas/villa-pueblo"],
  ["2142", "/en/the-estate"],
  ["rituals", "/en/weddings"],
];

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

const browser = await chromium.launch();
const rows = [];

for (const [key, route] of TARGETS) {
  const entry = readJson("villas", `${key}.json`);
  const facts = leaves(entry);

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const res = await page.goto(BASE + route, { waitUntil: "load", timeout: 90_000 });
  if (!res || res.status() !== 200) {
    console.error(`${route} served ${res ? res.status() : "nothing"}, not 200`);
    process.exitCode = 1;
    await page.close();
    continue;
  }
  /* Reveal everything — the same lesson as T-283: unrevealed text is invisible
     to any reader of the DOM, and would read here as a missing fact. */
  const total = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y <= total; y += 600) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(45);
  }
  const text = normalise(await page.evaluate(() => document.body.innerText));
  await page.close();

  let present = 0;
  const missing = [];
  for (const f of facts) {
    const v = normalise(f.value);
    /* Long prose is checked by its opening clause: the page legitimately
       re-sets a paragraph across elements, and demanding an exact substring
       match on 400 characters reports absence for formatting. */
    const probe = v.length > 90 ? v.slice(0, 60) : v;
    if (text.includes(probe)) present++;
    else missing.push(f);
  }

  rows.push({ key, route, total: facts.length, present, missing });
  console.log(
    `  ${key.padEnd(8)} ${route.padEnd(26)} ${String(present).padStart(3)}/${String(facts.length).padEnd(3)} on the page`
  );
}

await browser.close();

const totalFacts = rows.reduce((n, r) => n + r.total, 0);
const totalPresent = rows.reduce((n, r) => n + r.present, 0);

let md = `# Registry coverage

Generated by \`node scripts/registry-coverage.mjs\`.

**${totalPresent} of ${totalFacts} registry facts reach a rendered page.**

Every entry below is a fact recovered in Phase 0, stored in \`content/villas/\`,
and not found in the rendered text of the page that owns it. Some are
deliberate; some are content that has been lost without leaving a trace. The
point of this report is that the difference is now visible.

Machinery is excluded by name — ids, slugs, urls, provenance, todos, booking
config, galleries. Those are plumbing and were never meant to be read.

---

`;

for (const r of rows) {
  md += `## ${r.key} — \`${r.route}\`\n\n**${r.present} of ${r.total}** on the page.\n\n`;
  if (!r.missing.length) {
    md += "Nothing missing.\n\n";
    continue;
  }
  md += "| field | value |\n|---|---|\n";
  for (const m of r.missing) {
    const v = String(m.value).replace(/\|/g, "/").slice(0, 160);
    md += `| \`${m.path}\` | ${v}${String(m.value).length > 160 ? "…" : ""} |\n`;
  }
  md += "\n";
}

fs.writeFileSync(path.join(OUT, "REGISTRY-COVERAGE.md"), md);
fs.writeFileSync(path.join(OUT, "coverage.json"), JSON.stringify(rows, null, 2) + "\n");

console.log(`\n${totalPresent}/${totalFacts} registry facts reach a page`);
console.log(`-> qa/coverage/REGISTRY-COVERAGE.md`);
