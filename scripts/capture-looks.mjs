#!/usr/bin/env node
/**
 * PHOTOGRAPH THE FOUR LOOKS.
 *
 * A design deliverable that has only been typechecked has not been checked. This
 * shoots each prototype at desktop and phone, at three scroll positions, so the
 * comparison can be made by looking — which is the entire premise of the
 * exercise and would be a poor thing to exempt myself from.
 *
 *   node scripts/capture-looks.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.CAPTURE_BASE ?? "http://localhost:3005";
const OUT = path.join(process.cwd(), "qa", "looks", "shots");
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

/**
 * REFUSE TO MEASURE AN UNSTYLED PAGE.
 *
 * This is not defensive padding; it is here because it already happened. A
 * previous `next start` kept holding port 3005 while a rebuild replaced
 * `.next` underneath it, so the new server never bound (EADDRINUSE, logged and
 * unread) and the old one carried on answering with HTML that referenced CSS
 * chunks which no longer existed. The pages served unstyled.
 *
 * Every number produced in that state was real, precise and about nothing. It
 * reported the hero eyebrow at 1.00:1 and I went looking for a design defect
 * that did not exist.
 *
 * `--lk-ink` is defined by `looks.css` and by nothing else, so if it resolves
 * the stylesheet arrived. Checked once, before any measurement.
 */
async function assertStyled(page, where) {
  /*
   * `[data-look]`, NOT `[data-looks-root]`, and it accepts EITHER ink token.
   *
   * Two corrections, both from this guard being wrong rather than the page.
   * First it asked the layout's outer wrapper — earlier in the tree, so what
   * `querySelector` returns — but the token is declared on the INNER element
   * and custom properties inherit downward, so it reported "" on a perfectly
   * styled page. Then Direction E arrived declaring `--te-ink` in its own
   * stylesheet, and a guard hard-coded to `--lk-ink` failed the one look that
   * had never used it.
   *
   * A check that cannot pass is worse than no check: both times it sent me
   * hunting a broken stylesheet that was working. It now asks for whichever
   * ink the look actually declares, so adding a fifth direction cannot
   * resurrect this.
   */
  const ink = await page.evaluate(() => {
    const root = document.querySelector("[data-look]");
    if (!root) return "";
    const cs = getComputedStyle(root);
    return (cs.getPropertyValue("--lk-ink") || cs.getPropertyValue("--te-ink")).trim();
  });
  if (!ink) {
    console.error(
      `${where} rendered WITHOUT looks.css — the stylesheet did not load.\n` +
        `  Almost always a stale server: an old \`next start\` still holding the port\n` +
        `  over a rebuilt .next. Kill it and start again. Measuring this would produce\n` +
        `  numbers about an unstyled page.`
    );
    process.exit(1);
  }
}

const LOOKS = ["aegean", "editorial", "golden", "type-alive"];
const VIEWS = [
  ["desktop", 1440, 900],
  ["phone", 390, 844],
];

const browser = await chromium.launch();
let shots = 0;
const problems = [];

for (const [label, width, height] of VIEWS) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });

  /* The chooser first — it is the page he opens. */
  await page.goto(`${BASE}/looks`, { waitUntil: "load", timeout: 90_000 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, `chooser-${label}.png`) });
  shots++;

  for (const look of LOOKS) {
    const res = await page.goto(`${BASE}/looks/${look}`, { waitUntil: "load", timeout: 90_000 });
    if (res && res.status() !== 200) problems.push(`/looks/${look} returned ${res.status()}`);
    /*
     * SETTLE BEFORE SHOOTING. 400ms here caught Golden Coast's 1400ms reveal
     * in flight: the lede was still translated down across the draft badge
     * beneath it, and the overlap read in the still as an underline through
     * the text. A screenshot of a transition is not a screenshot of a design.
     */
    await page.waitForTimeout(1800);
    await assertStyled(page, `/looks/${look} @${label}`);

    /* Top, then two scroll positions, revealing as it goes. */
    await page.screenshot({ path: path.join(OUT, `${look}-${label}-top.png`) });
    shots++;

    const total = await page.evaluate(() => document.body.scrollHeight);
    for (const [name, frac] of [
      ["mid", 0.32],
      ["late", 0.66],
    ]) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * frac));
      /* Long enough for the slowest reveal on any look to finish. */
      await page.waitForTimeout(1700);
      await page.screenshot({ path: path.join(OUT, `${look}-${label}-${name}.png`) });
      shots++;
    }

    /*
     * THE SITE'S CHROME MUST NOT BE HERE. Checked while the page is already
     * open rather than assumed from the stylesheet — a `:has()` rule that
     * Lightning CSS declined to emit would look exactly like one that worked.
     */
    const chrome = await page.evaluate(() => {
      const vis = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        return getComputedStyle(el).display !== "none";
      };
      return { nav: vis(".nav"), grain: vis(".grain"), cursor: vis(".cursor") };
    });
    for (const [what, visible] of Object.entries(chrome)) {
      if (visible) problems.push(`/looks/${look} @${label}: the site's ${what} is still showing`);
    }

    /* Nothing may scroll sideways, at any width. That is the standing rule. */
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    if (overflow > 1) problems.push(`/looks/${look} @${label}: overflows by ${overflow}px`);
  }

  await page.close();
}

await browser.close();

console.log(`${shots} stills -> qa/looks/shots/`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error("  " + p);
  process.exitCode = 1;
} else {
  console.log("no chrome leakage, no horizontal overflow");
}
