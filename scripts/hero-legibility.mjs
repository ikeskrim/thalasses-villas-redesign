#!/usr/bin/env node
/**
 * IS THE HERO TYPE ACTUALLY READABLE ON THE PHOTOGRAPH UNDER IT?
 *
 * This is the question the whole project turns on. Two design rounds were
 * rejected by the owner, and the words he used were about type he could not
 * read. The first capture of the three look prototypes reproduced the same
 * defect on two of them, and I only found it by looking at the picture.
 *
 * Looking is not a gate. axe will not ask this — it declines contrast checks
 * over background images, and it is right to, because the answer depends on
 * which pixels happen to be behind which glyph. So it gets measured here.
 *
 * HOW, and the method matters because the naive version is wrong:
 *
 *   1. Record every hero text element's box and its computed colour.
 *   2. HIDE THE TEXT — `visibility: hidden`, which keeps layout identical —
 *      and screenshot the hero.
 *   3. Sample the pixels that were behind each box, and take the WORST one.
 *
 * Step 2 is the whole trick. Screenshotting with the text visible and sampling
 * the box measures the text against itself. Hiding it exposes what is really
 * there: the photograph, the scrim, and their composite.
 *
 * The worst pixel, not the average. A headline is unreadable if one word of it
 * falls on a bright patch, and an average over the whole box cheerfully hides
 * exactly that.
 *
 *   node scripts/hero-legibility.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const BASE = process.env.CAPTURE_BASE ?? "http://localhost:3005";
const OUT = path.join(process.cwd(), "qa", "looks");
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

/* ------------------------------------------------------------ WCAG 2.x -- */
const channel = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const luminance = (r, g, b) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const contrast = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

/**
 * The AA threshold that applies to THIS text, by its own rendered size.
 * 3:1 for large text (24px, or 18.66px when bold), 4.5:1 for everything else.
 */
const required = (px, weight) => {
  const bold = Number(weight) >= 700;
  return px >= 24 || (bold && px >= 18.66) ? 3 : 4.5;
};

/**
 * Direction E is measured too, and it needs its own selectors.
 *
 * Its type is not over a photograph — it is over paper and a slow ambient
 * gradient. That gradient is exactly the sort of thing that looks harmless and
 * quietly eats contrast, so it gets the same treatment: hide the text,
 * screenshot what is behind it, sample the worst pixel.
 */
const LOOKS = [
  { id: "aegean", root: ".lk-hero", text: ".lk-eyebrow, .lk-headline, .lk-headline-tail, .lk-lede, .lk-draft" },
  { id: "editorial", root: ".lk-hero", text: ".lk-eyebrow, .lk-headline, .lk-headline-tail, .lk-lede, .lk-draft" },
  { id: "golden", root: ".lk-hero", text: ".lk-eyebrow, .lk-headline, .lk-headline-tail, .lk-lede, .lk-draft" },
  { id: "type-alive", root: ".te-hero", text: ".te-kicker, .te-display, .te-lede, .te-draft, .te-caption" },
];
const VIEWS = [
  ["desktop", 1440, 900],
  ["phone", 390, 844],
];
const browser = await chromium.launch();
const rows = [];

for (const [label, width, height] of VIEWS) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });

  for (const look of LOOKS) {
    const TEXT = look.text;
    const ROOT = look.root;
    await page.goto(`${BASE}/looks/${look.id}`, { waitUntil: "load", timeout: 90_000 });
    await page.waitForTimeout(1800); /* reveals settled — see capture-looks.mjs */
    await assertStyled(page, `/looks/${look.id} @${label}`);

    /* Where the type is, what colour it is, and how big it renders. */
    const items = await page.evaluate(([sel, rootSel]) => {
      const hero = document.querySelector(rootSel);
      if (!hero) return [];
      const heroBox = hero.getBoundingClientRect();
      return [...hero.querySelectorAll(sel)]
        .filter((el) => (el.textContent ?? "").trim().length > 0)
        .map((el) => {
          const b = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return {
            what: el.className.split(" ")[0],
            text: (el.textContent ?? "").trim().slice(0, 34),
            color: cs.color,
            px: parseFloat(cs.fontSize),
            weight: cs.fontWeight,
            /* Relative to the hero, which is what gets screenshotted. */
            x: Math.round(b.left - heroBox.left),
            y: Math.round(b.top - heroBox.top),
            w: Math.round(b.width),
            h: Math.round(b.height),
          };
        });
    }, [TEXT, ROOT]);

    /*
     * Hide the type — `visibility`, never `display`, so nothing reflows and the
     * boxes measured a moment ago still describe where the text was.
     */
    await page.evaluate(([sel, rootSel]) => {
      const hero = document.querySelector(rootSel);
      for (const el of hero?.querySelectorAll(sel) ?? []) {
        el.style.visibility = "hidden";
      }
    }, [TEXT, ROOT]);

    const shot = await page.locator(ROOT).screenshot();
    const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
    const { width: iw, height: ih, channels } = info;

    for (const it of items) {
      const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(it.color);
      if (!m) continue;
      const textLum = luminance(Number(m[1]), Number(m[2]), Number(m[3]));

      let worst = Infinity;
      let sampled = 0;
      const step = 3;
      for (let y = Math.max(0, it.y); y < Math.min(ih, it.y + it.h); y += step) {
        for (let x = Math.max(0, it.x); x < Math.min(iw, it.x + it.w); x += step) {
          const i = (y * iw + x) * channels;
          const bg = luminance(data[i], data[i + 1], data[i + 2]);
          const c = contrast(textLum, bg);
          if (c < worst) worst = c;
          sampled++;
        }
      }
      if (!sampled) continue;

      const need = required(it.px, it.weight);
      rows.push({
        look: look.id,
        view: label,
        what: it.what,
        text: it.text,
        px: it.px,
        worst,
        need,
        pass: worst >= need,
        sampled,
      });
    }

    await page.evaluate(([sel, rootSel]) => {
      const hero = document.querySelector(rootSel);
      for (const el of hero?.querySelectorAll(sel) ?? []) {
        el.style.visibility = "";
      }
    }, [TEXT, ROOT]);
  }

  await page.close();
}

await browser.close();

/* --------------------------------------------------------------- report -- */
const failed = rows.filter((r) => !r.pass);

let md = `# Hero legibility — measured against the pixels, not the intention

Generated by \`npm run legibility\`. Every line of hero type, sampled against the
photograph and scrim actually composited behind it, at the worst pixel in its
own bounding box.

**${rows.length} text runs measured. ${failed.length} below AA.**

The threshold is WCAG AA by rendered size: 3:1 for large text (24px, or 18.66px
bold), 4.5:1 otherwise. The figure is the WORST pixel behind the run, because a
headline is unreadable if one word of it lands on a bright patch and an average
hides exactly that case.

| look | view | element | size | worst | needs | |
|---|---|---|---|---|---|---|
`;

for (const r of rows.sort((a, b) => a.worst - b.worst)) {
  md += `| ${r.look} | ${r.view} | \`${r.what}\` | ${r.px.toFixed(0)}px | **${r.worst.toFixed(2)}:1** | ${r.need}:1 | ${r.pass ? "pass" : "**FAIL**"} |\n`;
}

md += `
## Why this exists

The first build of these prototypes put white display type over a bright
daylight photograph on two of the three looks, and it was unreadable — the same
defect, in the same place, that got an earlier design round rejected by the
owner in his own words.

It was found by looking at a screenshot. That is not a gate, and axe will never
provide one here: it declines to compute contrast over background images,
correctly, because the answer depends on which pixels sit under which glyph.

The fix was structural rather than cosmetic. Aegean Light and Editorial Estate
now set their hero copy on paper beneath the frame — Aegean's own brief said
type belongs "in generous safe margins, never over busy image areas", and the
first pass ignored it. Only Golden Coast keeps type on the photograph, because
full-bleed cinema is what that direction is, and it earns it with a two-axis
scrim measured here rather than judged.
`;

fs.writeFileSync(path.join(OUT, "LEGIBILITY.md"), md);

console.log(`${rows.length} text runs measured, ${failed.length} below AA`);
for (const r of rows.filter((x) => !x.pass)) {
  console.error(`  FAIL ${r.look}/${r.view} ${r.what} ${r.worst.toFixed(2)}:1 (needs ${r.need}:1) — "${r.text}"`);
}
const min = rows.reduce((a, r) => Math.min(a, r.worst), Infinity);
console.log(`worst run on the whole set: ${min.toFixed(2)}:1`);
console.log("-> qa/looks/LEGIBILITY.md");

if (failed.length) process.exitCode = 1;
