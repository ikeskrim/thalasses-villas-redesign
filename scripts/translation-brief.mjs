#!/usr/bin/env node
/**
 * THE TRANSLATION BRIEF.
 *
 * Task 28 was written as "a Greek drafts consistency pass on /el". **There are
 * no Greek drafts and there is no /el**, and the reason is recorded rather than
 * discovered: `content/url-map.md` §5.3 states that the legacy site is
 * English-only, so nothing Greek was ever captured in Phase 0 and writing any
 * would be inventing content about a real property.
 *
 * So the honest version of that task is the thing it was pointing at: give the
 * owner's translator a real brief. Not "translate the site" — a count, a scope,
 * and, most importantly, **the list of strings that must NOT be translated**,
 * because that is the part a translator cannot know and the part that breaks a
 * booking engine when it goes wrong.
 *
 * Extracted from the RENDERED pages rather than from the source. A string that
 * lives in a component, a token or a registry field still reaches a reader, and
 * a brief built from `content/` alone would quietly omit every word written in
 * JSX — which on this site is most of the display copy.
 *
 *   node scripts/translation-brief.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.CAPTURE_BASE ?? "http://localhost:3005";
const CONTENT = path.join(process.cwd(), "content");
const OUT = path.join(process.cwd(), "TRANSLATION-BRIEF.md");

const readJson = (...p) => JSON.parse(fs.readFileSync(path.join(CONTENT, ...p), "utf-8"));

/**
 * DO NOT TRANSLATE — derived, never typed.
 *
 * Proper nouns come from the registry, so a sixth villa is protected on the day
 * it is added. The licence number, the booking host and the contact details are
 * matched by shape. url-map §5.3 flags the villa names specifically: they will
 * almost certainly keep their Latin forms in Greek, and that is the owner's
 * call rather than a transliteration decision a translator should make alone.
 */
const properNouns = new Set();
for (const f of fs.readdirSync(path.join(CONTENT, "villas")).filter((f) => f.endsWith(".json"))) {
  const v = readJson("villas", f);
  if (v.name) properNouns.add(v.name);
}
for (const n of ["Thalasses", "Thalasses Villas", "Pigianos Kampos", "Rethymno", "Crete", "Greece"]) {
  properNouns.add(n);
}

const DO_NOT_TRANSLATE = [
  { label: "Operating licence", re: /\b1041K91003163701\b/ },
  { label: "Booking engine host", re: /reserve-online\.net/ },
  { label: "Email address", re: /[\w.+-]+@[\w-]+\.[\w.]+/ },
  { label: "Telephone", re: /\(\+30\)|\+30\s?\d/ },
  { label: "Measurement", re: /^\s*[\d.,]+\s*(m²|m2|km|m|sq ft|€)\s*$/i },
];

const ROUTES = [
  "/",
  "/en/the-estate",
  "/en/villas/villa-thoi",
  "/en/villas/villa-pueblo",
  "/en/gallery",
  "/en/experiences",
  "/en/weddings",
  "/en/location",
  "/en/careers",
  "/en/contact",
  "/en/terms",
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
const perRoute = [];
const protectedHits = new Map();

for (const route of ROUTES) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const res = await page.goto(BASE + route, { waitUntil: "load", timeout: 90_000 });
  if (!res || res.status() !== 200) {
    console.error(`${route} served ${res ? res.status() : "nothing"}, not 200`);
    process.exitCode = 1;
    await page.close();
    continue;
  }
  /* Reveal everything — unrevealed text is text a reader still gets (T-283). */
  const total = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y <= total; y += 700) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(45);
  }

  const strings = await page.evaluate(() => {
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const parent = n.parentElement;
      if (!parent) continue;
      const tag = parent.tagName.toLowerCase();
      if (tag === "script" || tag === "style" || tag === "noscript") continue;
      const t = (n.textContent || "").replace(/\s+/g, " ").trim();
      if (t.length < 2) continue;
      out.push(t);
    }
    return out;
  });
  await page.close();

  const seen = new Set();
  const unique = [];
  for (const s of strings) {
    if (seen.has(s)) continue;
    seen.add(s);
    unique.push(s);
  }

  let translate = 0;
  let words = 0;
  let leave = 0;
  for (const s of unique) {
    /*
     * A string that IS a protected token is left alone. A string that merely
     * CONTAINS one still has to be translated — only the token inside it is
     * fixed.
     *
     * The first version did not make that distinction and marked two whole
     * sentences do-not-translate because an address appeared inside them:
     * "Become one of us and send your CV at creteholidayhome@gmail.com" and a
     * clause of the terms. A brief that tells a translator to skip a sentence
     * because of one word in it is worse than no brief.
     */
    const whole = DO_NOT_TRANSLATE.find((r) => {
      const m = r.re.exec(s);
      return m && m[0].trim() === s.trim();
    });
    const proper = properNouns.has(s);
    if (whole || proper) {
      leave++;
      const key = whole ? whole.label : "Proper noun";
      if (!protectedHits.has(key)) protectedHits.set(key, new Set());
      protectedHits.get(key).add(s.slice(0, 60));
      continue;
    }

    const inside = DO_NOT_TRANSLATE.find((r) => r.re.test(s));
    if (inside) {
      const m = inside.re.exec(s);
      if (m) {
        const key = `${inside.label} (inside a sentence)`;
        if (!protectedHits.has(key)) protectedHits.set(key, new Set());
        protectedHits.get(key).add(m[0].slice(0, 60));
      }
    }

    translate++;
    words += s.split(/\s+/).filter(Boolean).length;
  }

  perRoute.push({ route, unique: unique.length, translate, words, leave });
  console.log(
    `  ${route.padEnd(26)} ${String(translate).padStart(4)} strings, ${String(words).padStart(5)} words  (${leave} left alone)`
  );
}

await browser.close();

const totalStrings = perRoute.reduce((n, r) => n + r.translate, 0);
const totalWords = perRoute.reduce((n, r) => n + r.words, 0);

let md = `# Translation brief — English to Greek

**Generated by \`npm run brief\`. Do not edit by hand.**

Task 28 was written as "a Greek drafts consistency pass on \`/el\`". There are no
Greek drafts and there is no \`/el\`, and that is by design rather than by
omission: \`content/url-map.md\` §5.3 records that **the legacy site is
English-only**, so nothing Greek was captured in Phase 0 and writing any would
be inventing content about a real property.

This is the thing that task was pointing at — what a translator would actually
need to quote for the work and do it correctly.

---

## Scope

**${totalStrings} distinct strings, ${totalWords} words**, across ${perRoute.length} routes.

| route | strings | words | left alone |
|---|---|---|---|
${perRoute.map((r) => `| \`${r.route}\` | ${r.translate} | ${r.words} | ${r.leave} |`).join("\n")}

Counted from the **rendered** pages, not from \`content/\`. A brief built from
the registry alone would omit every word written in JSX, which on this site is
most of the display copy. The twenty-one experience detail pages and the four
remaining villa pages are not counted separately — they are the same templates
with different registry values, and the template strings appear above.

---

## Do not translate

The part a translator cannot know, and the part that breaks things when it goes
wrong. Derived from the registry and by shape, never from a typed list — a sixth
villa is protected on the day it is added.

Entries marked **(inside a sentence)** are tokens that appear WITHIN copy that
does need translating. The sentence is translated; the token inside it is not.

${[...protectedHits.entries()]
  .map(([label, set]) => `**${label}** — ${[...set].slice(0, 8).join(" · ")}`)
  .join("\n\n")}

**The villa names are the owner's decision, not the translator's.**
\`content/url-map.md\` §5.3: Thoi, Persi, Eeanthe, Melia and Pueblo will almost
certainly keep their Latin forms in Greek, but that must be confirmed rather
than transliterated.

---

## What must be true before \`/el\` ships

1. **Greek copy for every string above.** Nothing else blocks it — the routing,
   the canonical and the hreflang machinery are built and flag-gated in
   \`src/lib/locale.ts\`. Publishing is one line: add \`"el"\` to
   \`PUBLISHED_LOCALES\`.
2. **A Greek display face.** Marcellus carries no Greek at all, so every Greek
   heading would silently fall back to Georgia. Decided on evidence and
   recommended in \`qa/greek-face/VERDICT.md\` — Noto Serif Display, with GFS
   Didot a defensible runner-up. **The owner reads Greek natively and should
   make the final call.**
3. **A decision on Latin inside Greek pages.** "Villa Thoi", "Condé Nast
   Traveller" and the licence number all appear inside Greek sentences. Either
   the Greek face carries Latin too, or Marcellus handles it through a
   \`unicode-range\` split. The second is more faithful and needs deciding with
   the face.
4. **Slugs.** url-map §5.3: the English slug tables stay the registry and a
   parallel Greek table is added beside them. Legacy redirects keep pointing at
   \`/en/...\` — the legacy site was English-only, so no legacy URL should ever
   resolve under \`/el\`, and \`tests/locale.spec.ts\` asserts that today.

## What the guard does if you publish too early

\`tests/locale.spec.ts\` asserts every published locale actually serves its
routes. Adding \`"el"\` to \`PUBLISHED_LOCALES\` before the pages exist turns the
suite **red** rather than shipping a locale of 404s to a crawler and telling
search engines to index them.
`;

fs.writeFileSync(OUT, md);
console.log(`\n${totalStrings} strings, ${totalWords} words -> ${path.relative(process.cwd(), OUT)}`);
