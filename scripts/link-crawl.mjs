#!/usr/bin/env node
/**
 * THE LINK-INTEGRITY CRAWL.
 *
 * Every internal link on the site, followed, and every destination's status
 * recorded. Nothing else in this project does this: the redirect harness drives
 * the *legacy* map, the soft-404 guard drives *invalid* slugs, and the parity
 * certificate counts what exists in the registry. None of them asks the simplest
 * question a visitor asks — **does this link go anywhere?**
 *
 * It matters most at launch. A dead internal link on a live site is a lost
 * booking; a dead internal link found the day before DNS moves is a five-minute
 * fix. This is the check that belongs in the dress rehearsal.
 *
 * External links are HEAD-checked and reported SEPARATELY, and their failures
 * never fail the run: a third party being down or refusing HEAD from a script is
 * not a defect in this site, and treating it as one would make the crawl a
 * source of false alarms nobody acts on.
 *
 *   node scripts/link-crawl.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.CAPTURE_BASE ?? "http://localhost:3005";
const OUT = path.join(process.cwd(), "qa", "crawl");
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

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const queue = ["/"];
const visited = new Set();
const status = new Map(); // path -> { code, from }
const external = new Map(); // href -> Set(from)
const anchors = new Map(); // "path#frag" -> Set(from)

let pages = 0;
while (queue.length) {
  const route = queue.shift();
  if (visited.has(route)) continue;
  visited.add(route);

  const res = await page.goto(BASE + route, { waitUntil: "load", timeout: 90_000 });
  const code = res ? res.status() : 0;
  status.set(route, { code, from: status.get(route)?.from ?? "(seed)" });
  pages++;

  if (code !== 200) continue;

  /*
   * Reveal before harvesting. Links inside scroll-revealed sections are real
   * links a reader can click, and a crawl that only reads the first viewport
   * would report a clean site while never seeing most of it (T-283).
   */
  const total = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y <= total; y += 900) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(35);
  }

  const found = await page.evaluate(() =>
    [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href") ?? "")
  );

  for (const raw of found) {
    if (!raw || raw.startsWith("mailto:") || raw.startsWith("tel:")) continue;
    if (raw.startsWith("#")) {
      anchors.set(`${route}${raw}`, (anchors.get(`${route}${raw}`) ?? new Set()).add(route));
      continue;
    }
    let url;
    try {
      url = new URL(raw, BASE);
    } catch {
      continue;
    }
    if (url.origin !== new URL(BASE).origin) {
      external.set(url.href, (external.get(url.href) ?? new Set()).add(route));
      continue;
    }
    if (url.hash) {
      anchors.set(`${url.pathname}${url.hash}`, (anchors.get(`${url.pathname}${url.hash}`) ?? new Set()).add(route));
    }
    const next = url.pathname;
    if (!visited.has(next)) {
      if (!status.has(next)) status.set(next, { code: null, from: route });
      queue.push(next);
    }
  }
  process.stdout.write(`\r  crawled ${pages} pages, ${queue.length} queued   `);
}
process.stdout.write("\n");

/* ------------------------------------------------------- ANCHOR TARGETS -- */
/*
 * A `#fragment` that names nothing is a link that silently does nothing when
 * clicked. Checked per page rather than assumed, because the skip link and the
 * homepage's scroll cue both depend on one.
 */
const brokenAnchors = [];
const byPath = new Map();
for (const key of anchors.keys()) {
  const [p, frag] = key.split("#");
  byPath.set(p, (byPath.get(p) ?? new Set()).add(frag));
}
for (const [p, frags] of byPath) {
  if (status.get(p)?.code !== 200) continue;
  await page.goto(BASE + p, { waitUntil: "load" });
  const missing = await page.evaluate(
    (list) => list.filter((f) => f && !document.getElementById(f)),
    [...frags]
  );
  for (const f of missing) brokenAnchors.push(`${p}#${f}`);
}

await page.close();

/* ----------------------------------------------------------- EXTERNALS -- */
const externalResults = [];
for (const [href, froms] of external) {
  let code = 0;
  let note = "";
  try {
    const r = await fetch(href, { method: "HEAD", redirect: "follow" });
    code = r.status;
  } catch (e) {
    note = String(e).slice(0, 60);
  }
  externalResults.push({ href, code, note, from: [...froms][0] });
  process.stdout.write(`\r  external ${externalResults.length}/${external.size}   `);
}
process.stdout.write("\n");

await browser.close();

/* -------------------------------------------------------------- REPORT -- */
const internal = [...status.entries()].map(([p, v]) => ({ path: p, ...v }));
const broken = internal.filter((r) => r.code !== 200 && r.code !== null);
const unvisited = internal.filter((r) => r.code === null);

let md = `# Link-integrity crawl

Generated by \`npm run crawl\`. Every internal link on the site, followed.

**${internal.length} internal destinations reached from \`/\`. ${broken.length} broken.**

`;

md += broken.length
  ? `## Broken internal links\n\n| path | status | first linked from |\n|---|---|---|\n${broken
      .map((r) => `| \`${r.path}\` | **${r.code}** | \`${r.from}\` |`)
      .join("\n")}\n\n`
  : "## Broken internal links\n\nNone. Every internal link resolves.\n\n";

md += brokenAnchors.length
  ? `## Fragments that name nothing\n\nA \`#fragment\` with no matching element is a link that silently does nothing.\n\n${brokenAnchors
      .map((a) => `- \`${a}\``)
      .join("\n")}\n\n`
  : "## Fragments that name nothing\n\nNone. Every in-page anchor has a target.\n\n";

const extBad = externalResults.filter((r) => r.code === 0 || r.code >= 400);
md += `## External links — ${externalResults.length} checked, ${extBad.length} not answering\n\n`;
md += `**These never fail the run.** A third party being down, or refusing a HEAD\nfrom a script, is not a defect in this site — and a crawl that cries wolf about\nsomebody else's server is a crawl nobody runs twice.\n\n`;
md += externalResults.length
  ? `| link | status | from |\n|---|---|---|\n${externalResults
      .map((r) => `| ${r.href} | ${r.code || r.note || "no answer"} | \`${r.from}\` |`)
      .join("\n")}\n\n`
  : "None found.\n\n";

if (unvisited.length) {
  md += `## Queued but never reached — ${unvisited.length}\n\n${unvisited
    .map((r) => `- \`${r.path}\` (from \`${r.from}\`)`)
    .join("\n")}\n`;
}

fs.writeFileSync(path.join(OUT, "LINK-CRAWL.md"), md);
fs.writeFileSync(
  path.join(OUT, "crawl.json"),
  JSON.stringify({ internal, brokenAnchors, external: externalResults }, null, 2) + "\n"
);

console.log(`\n${internal.length} internal destinations, ${broken.length} broken`);
console.log(`${brokenAnchors.length} fragments naming nothing`);
console.log(`${externalResults.length} external links, ${extBad.length} not answering (not a failure)`);
console.log(`-> qa/crawl/LINK-CRAWL.md`);

if (broken.length || brokenAnchors.length) process.exitCode = 1;
