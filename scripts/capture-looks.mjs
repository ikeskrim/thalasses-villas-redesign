#!/usr/bin/env node
/**
 * PHOTOGRAPH THE FIVE LOOKS.
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
 * DID THIS LOOK'S STYLESHEET ACTUALLY LOAD?
 *
 * Asked about the STYLESHEET now, not about a token, because the token version
 * broke three times. It started by reading `--lk-ink` off the layout's outer
 * wrapper, where custom properties do not inherit upward, and failed on every
 * correctly styled page. Then Direction E arrived declaring `--te-ink` and it
 * failed the one look that had never used `--lk-`. Then Direction F arrived
 * declaring `--ho-` and it failed again — under a comment I had written saying
 * a fifth direction could not resurrect it.
 *
 * A list of token names is a list that must be edited every time, by somebody
 * who has no reason to know it exists. So this asks the question it actually
 * means: is there a CSS rule in this document that targets this look? If the
 * stylesheet is missing there is not, and no naming convention has to hold.
 */
async function assertStyled(page, where, lookId) {
  const styled = await page.evaluate((id) => {
    const needle = `[data-look="${id}"]`;
    for (const sheet of document.styleSheets) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        continue; /* cross-origin: not ours */
      }
      for (const rule of rules) {
        if (rule.cssText && rule.cssText.includes(needle)) return true;
      }
    }
    return false;
  }, lookId);
  if (!styled) {
    console.error(
      `${where} rendered WITHOUT its stylesheet — no CSS rule targets [data-look="${lookId}"].
` +
        `  Almost always a stale server: an old \`next start\` still holding the port
` +
        `  over a rebuilt .next. Kill it and start again. Measuring this would produce
` +
        `  numbers about an unstyled page.`
    );
    process.exit(1);
  }
}

const LOOKS = ["aegean", "editorial", "golden", "type-alive", "hotel"];
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
    await assertStyled(page, `/looks/${look} @${label}`, look);

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
