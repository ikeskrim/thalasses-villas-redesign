#!/usr/bin/env node
/**
 * THE WALKTHROUGH CAPTURE — screenshots and videos, outside the test runner.
 *
 * This used to be Playwright tests and it kept killing the runner. The reason
 * was measured, not guessed: the homepage is 22,165px tall at 1920, so a
 * `fullPage` capture is a 42-megapixel bitmap — about 170 MB raw — and the
 * estate page loads 144 photographs. Thirty of those in one worker exhausts
 * memory, and the suite dies mid-run with an aborted worker and no failure
 * message, which reads exactly like a flaky test and is nothing of the kind.
 *
 * The deeper problem was architectural: **evidence generation is not a
 * correctness gate.** A screenshot proves nothing about behaviour; it exists so
 * a person can look at it. Keeping it in the suite meant a memory limit could
 * fail a build that had nothing wrong with it.
 *
 * So: correctness stays in `npm run qa:fast` (assertions, cheap, fast), and
 * this script produces the evidence — one fresh browser per route so memory is
 * released between them, viewport tiles instead of enormous strips, and video
 * of a scripted slow scroll because the owner reviews motion, not stills.
 *
 *   node scripts/capture.mjs            screenshots + video
 *   node scripts/capture.mjs --stills   screenshots only (faster)
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.CAPTURE_BASE ?? "http://localhost:3005";
const STILLS_ONLY = process.argv.includes("--stills");
const SHOTS = path.join(process.cwd(), "qa", "walkthrough");
const VIDEO = path.join(process.cwd(), "qa", "video");

/**
 * The experience route is DERIVED from the registry, never typed.
 *
 * It was typed, as `/en/experiences/private-chef`, and that slug does not
 * exist — the real one is `chef-in-villa`. So every walkthrough still labelled
 * "experience-detail", and every taste-audit pass over that route, was
 * photographing and auditing the **404 page**, and reporting it clean. A
 * `page.goto` does not throw on a 404; it loads the not-found boundary and
 * returns happily, so nothing said a word.
 */
function firstExperienceSlug() {
  const dir = path.join(process.cwd(), "content", "experiences");
  const slugs = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")).slug)
    .filter(Boolean)
    .sort();
  if (!slugs.length) throw new Error("no experiences in the registry — nothing to audit");
  return slugs[0];
}
const EXPERIENCE = firstExperienceSlug();

const ROUTES = [
  ["home", "/"],
  ["estate", "/en/the-estate"],
  ["villa-thoi", "/en/villas/villa-thoi"],
  ["villa-eeanthe", "/en/villas/villa-eeanthe"],
  ["villa-pueblo", "/en/villas/villa-pueblo"],
  ["experiences", "/en/experiences"],
  ["experience-detail", `/en/experiences/${EXPERIENCE}`],
  ["weddings", "/en/weddings"],
  ["location", "/en/location"],
  ["careers", "/en/careers"],
  ["contact", "/en/contact"],
  ["terms", "/en/terms"],
];

const WIDTHS = [
  ["1440", 1440, 900],
  ["390", 390, 844],
];

fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync(VIDEO, { recursive: true });

async function reachable(url) {
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(url, { method: "HEAD" });
      if (r.ok || r.status < 500) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

if (!(await reachable(BASE))) {
  console.error(`No server at ${BASE}. Run \`npm start\` first.`);
  process.exit(1);
}

let stills = 0;
let clips = 0;

for (const [name, route] of ROUTES) {
  for (const [label, w, h] of WIDTHS) {
    // A FRESH BROWSER PER ROUTE PER WIDTH. This is the whole point: a long page
    // with a hundred photographs does not release cleanly inside a shared
    // process, and that is what was killing the runner.
    const browser = await chromium.launch();
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      ...(STILLS_ONLY
        ? {}
        : { recordVideo: { dir: VIDEO, size: { width: w, height: h } } }),
    });
    const page = await ctx.newPage();

    try {
      const res = await page.goto(BASE + route, { waitUntil: "load", timeout: 90_000 });
      /* A 404 loads. Evidence of the not-found page filed under a route name is
         worse than no evidence, because it looks like evidence. */
      if (!res || res.status() !== 200) {
        throw new Error(`served ${res ? res.status() : "nothing"}, not 200`);
      }
      await page.waitForTimeout(2200);

      // A scripted SLOW scroll: this is the take the owner watches, so it moves
      // at reading pace rather than at test pace, and it lets the scroll-driven
      // reveals actually fire.
      const total = await page.evaluate(() => document.body.scrollHeight);
      const step = Math.round(h * 0.55);
      for (let y = 0; y <= total; y += step) {
        await page.evaluate((v) => window.scrollTo({ top: v, behavior: "auto" }), y);
        await page.waitForTimeout(STILLS_ONLY ? 90 : 420);
      }

      // Tiles, at reading positions rather than one unreadable strip.
      const height = await page.evaluate(() => document.body.scrollHeight);
      const marks = [
        ["01-top", 0],
        ["02-early", Math.round(height * 0.2)],
        ["03-mid", Math.round(height * 0.45)],
        ["04-late", Math.round(height * 0.72)],
        ["05-end", Math.max(0, height - h)],
      ];
      for (const [mark, y] of marks) {
        await page.evaluate((v) => window.scrollTo(0, v), y);
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(SHOTS, `${name}-${label}-${mark}.png`) });
        stills++;
      }
      process.stdout.write(`  ${name} @ ${label}  (${height}px)\n`);
    } catch (e) {
      process.stdout.write(`  ${name} @ ${label}  FAILED: ${String(e).slice(0, 90)}\n`);
    }

    await page.close();
    await ctx.close();
    await browser.close();

    if (!STILLS_ONLY) {
      // Playwright names videos by an internal id; rename to something a human
      // can find in a folder of forty files.
      const files = fs.readdirSync(VIDEO).filter((f) => f.endsWith(".webm"));
      const newest = files
        .map((f) => ({ f, t: fs.statSync(path.join(VIDEO, f)).mtimeMs }))
        .sort((a, b) => b.t - a.t)[0];
      if (newest && !/^[a-z-]+-\d+\.webm$/.test(newest.f)) {
        fs.renameSync(path.join(VIDEO, newest.f), path.join(VIDEO, `${name}-${label}.webm`));
        clips++;
      }
    }
  }
}

console.log(`\n${stills} stills -> qa/walkthrough`);
if (!STILLS_ONLY) console.log(`${clips} clips  -> qa/video`);
