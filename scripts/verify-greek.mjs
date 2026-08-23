#!/usr/bin/env node
/**
 * VERIFY THE GREEK CORPUS — against the English, not against the report.
 *
 * `content/el/RECONCILIATION.md` says the numerals are clean and the proper
 * nouns are intact. It was written by the process that produced the corpus, and
 * this project's whole discipline is that a report from the thing being checked
 * is a claim, not a measurement (CONVENTIONS §18).
 *
 * So this re-derives the answer from the two sides. Six checks, and the first
 * is the one the owner asked for by name:
 *
 *   1. NUMERALS. Every figure in a Greek string must match the figures in the
 *      English string it translates — same values, same count, same order. This
 *      is the guarantee: 9 bedrooms stays 9, 50 m stays 50 m, 35€ stays 35€, and
 *      "72.8 km" keeps its DOT rather than becoming the Greek decimal comma.
 *   2. PROPER NOUNS. If the English says "Villa Eeanthe", so does the Greek.
 *   3. ACCENTED CAPITALS. Greek capitals carry no accent — ΧΩΡΙΣ, never ΧΩΡΊΣ.
 *      The diaeresis (Ϊ Ϋ) is kept and is not an error.
 *   4. BANNED WORDS. The voice rules in Greek, enforced as a word list.
 *   5. DRAFT STATUS. Every file must declare it. This corpus is for the owner's
 *      native review; a file that forgot to say so could be shipped by accident.
 *   6. COVERAGE. Every experience, every villa, every feature id — because a
 *      translation that quietly skipped nine experiences would otherwise look
 *      exactly like one that did not.
 *
 *   node scripts/verify-greek.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const EL = path.join(ROOT, "content", "el");
const CONTENT = path.join(ROOT, "content");
const readJson = (...p) => JSON.parse(fs.readFileSync(path.join(...p), "utf-8"));

const problems = [];
const fail = (check, where, detail) => problems.push({ check, where, detail });

/* ------------------------------------------------------------- the files -- */
const FILES = [
  "experiences.json",
  "villas.json",
  "facilities.json",
  "villa-page-copy.json",
  "home.json",
  "pages.json",
  "terms.json",
  "chrome.json",
];

const el = {};
for (const f of FILES) {
  const p = path.join(EL, f);
  if (!fs.existsSync(p)) {
    fail("files", f, "missing");
    continue;
  }
  try {
    el[f] = readJson(EL, f);
  } catch (e) {
    fail("files", f, `does not parse: ${String(e).slice(0, 80)}`);
  }
}

/* ------------------------------------------------------- 5. draft status -- */
for (const [f, j] of Object.entries(el)) {
  if (j.copyStatus !== "draft") fail("draft", f, `copyStatus is ${JSON.stringify(j.copyStatus)}`);
}

/* --------------------------------------------------------- string walker -- */
function* strings(node, trail = "") {
  if (typeof node === "string") {
    yield [trail, node];
    return;
  }
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) yield* strings(node[i], `${trail}[${i}]`);
    return;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (k === "notes" || k === "_comment") continue; /* translator prose */
      yield* strings(v, trail ? `${trail}.${k}` : k);
    }
  }
}

/* -------------------------------------------------- 3 + 4. voice and case -- */
const ACCENTED_CAPS = /[ΆΈΉΊΌΎΏ]/; /* ΆΈΉΊΌΎΏ */
const BANNED = [
  "υπέροχ",
  "μαγευτικ",
  "παραδεισένι",
  "ονειρικ",
  "εκπληκτικ",
  "απαράμιλλ",
  "πολυτελέστατ",
  "μοναδική εμπειρία",
];

for (const [f, j] of Object.entries(el)) {
  for (const [where, s] of strings(j)) {
    /* An accented capital only matters in an ALL-CAPS run — a normal sentence
       beginning with Ά is correct Greek. */
    for (const run of s.match(/[Ά-ώ\s]{4,}/g) ?? []) {
      const letters = run.replace(/\s/g, "");
      if (!letters) continue;
      const isAllCaps = letters === letters.toUpperCase() && /[Α-Ω]/.test(letters);
      if (isAllCaps && ACCENTED_CAPS.test(letters)) {
        fail("capitals", `${f} ${where}`, `accented capital in an all-caps run: ${run.trim().slice(0, 40)}`);
      }
    }
    const lower = s.toLowerCase();
    for (const b of BANNED) {
      if (lower.includes(b)) fail("banned", `${f} ${where}`, `"${b}" in: ${s.slice(0, 60)}`);
    }
  }
}

/* ------------------------------------------------------------ 1. numerals -- */
/**
 * Figures, in order. Deliberately captures the separator so "72.8" and "72,8"
 * are different strings — a Greek decimal comma is the exact substitution this
 * check exists to catch.
 */
const figures = (s) => (s.match(/\d+(?:[.,]\d+)?/g) ?? []);

function compareFigures(check, where, english, greek) {
  const a = figures(english);
  const b = figures(greek);
  if (a.join("|") !== b.join("|")) {
    fail(
      check,
      where,
      `EN [${a.join(", ")}] vs EL [${b.join(", ")}]\n      en: ${english.slice(0, 90)}\n      el: ${greek.slice(0, 90)}`
    );
  }
}

/* --------------------------------------------------- 2. proper nouns kept -- */
const PROPER = ["Villa Thoi", "Villa Persi", "Villa Eeanthe", "Villa Melia", "Villa Pueblo", "Thalasses Rituals", "Thalasses Villas"];
function compareProper(where, english, greek) {
  for (const n of PROPER) {
    if (english.includes(n) && !greek.includes(n)) {
      fail("proper", where, `"${n}" is in the English and not in the Greek`);
    }
  }
}

/* ------------------------------------------------------ paired: experiences */
{
  const src = {};
  for (const f of fs.readdirSync(path.join(CONTENT, "experiences")).filter((f) => f.endsWith(".json"))) {
    const e = readJson(CONTENT, "experiences", f);
    if (e.slug) src[e.slug] = e;
  }
  const got = el["experiences.json"]?.experiences ?? {};
  const missing = Object.keys(src).filter((s) => !got[s]);
  if (missing.length) fail("coverage", "experiences.json", `not translated: ${missing.join(", ")}`);

  for (const [slug, g] of Object.entries(got)) {
    const s = src[slug];
    if (!s) {
      fail("coverage", "experiences.json", `${slug} is not an experience in the registry`);
      continue;
    }
    for (const k of ["name", "shortDescription", "longDescription"]) {
      if (g[k] && s[k]) {
        compareFigures("numerals", `experiences ${slug}.${k}`, s[k], g[k]);
        compareProper(`experiences ${slug}.${k}`, s[k], g[k]);
      }
    }
  }
}

/* ----------------------------------------------------------- paired: villas */
{
  const KEYS = ["200", "201", "202", "203", "pueblo", "2142", "rituals"];
  const got = el["villas.json"]?.villas ?? {};
  const missing = KEYS.filter((k) => !got[k]);
  if (missing.length) fail("coverage", "villas.json", `not translated: ${missing.join(", ")}`);

  for (const key of KEYS) {
    const s = fs.existsSync(path.join(CONTENT, "villas", `${key}.json`))
      ? readJson(CONTENT, "villas", `${key}.json`)
      : null;
    const g = got[key];
    if (!s || !g) continue;

    for (const k of ["tagline", "shortDescription", "longDescription"]) {
      if (g[k] && s[k]) {
        compareFigures("numerals", `villas ${key}.${k}`, s[k], g[k]);
        compareProper(`villas ${key}.${k}`, s[k], g[k]);
      }
    }
    for (const k of ["policies", "amenityFacts"]) {
      const a = s[k] ?? [];
      const b = g[k] ?? [];
      if (b.length && a.length !== b.length) {
        fail("coverage", `villas ${key}.${k}`, `${a.length} in English, ${b.length} in Greek`);
      }
      for (let i = 0; i < Math.min(a.length, b.length); i++) {
        compareFigures("numerals", `villas ${key}.${k}[${i}]`, a[i], b[i]);
      }
    }
    for (const sp of ["view", "distanceToBeach", "bedroomsDetail", "bathroomsDetail", "maxGuestsBasis"]) {
      if (s.specs?.[sp] && g.specs?.[sp]) {
        compareFigures("numerals", `villas ${key}.specs.${sp}`, s.specs[sp], g.specs[sp]);
      }
    }
  }
}

/* ------------------------------------------------------ paired: facilities */
{
  const names = new Map();
  const descTexts = new Set();
  for (const f of fs.readdirSync(path.join(CONTENT, "facilities")).filter((f) => f.endsWith(".json"))) {
    const j = readJson(CONTENT, "facilities", f);
    for (const t of j.tabs ?? []) {
      for (const gr of t.groups ?? []) {
        for (const i of gr.items ?? []) {
          names.set(String(i.featureId), i.name);
          if (i.description) descTexts.add(i.description);
          if (i.extraDescription) descTexts.add(i.extraDescription);
        }
      }
    }
  }
  const g = el["facilities.json"] ?? {};
  const gotNames = g.features ?? {};
  const gotDescs = g.descriptions ?? {};

  const missingNames = [...names.keys()].filter((k) => !gotNames[k]);
  if (missingNames.length) {
    fail("coverage", "facilities.features", `${missingNames.length} feature ids untranslated`);
  }

  /*
   * DESCRIPTIONS ARE KEYED BY THE ENGLISH TEXT, not by featureId.
   *
   * They were keyed by featureId, and the same featureId carries DIFFERENT
   * English in different villa files: the estate says "4 Fully equipped
   * kitchens" where a villa says "Fully equipped kitchen", and featureId 366
   * has five separate wordings of the pool sentence. A featureId map holds one
   * Greek, so the estate would have rendered the single-villa text and told a
   * reader there was one kitchen.
   *
   * 57 distinct English texts, 42 Greek entries — fifteen collisions, silent.
   * The English string is the key now, which is 1:1 by construction.
   */
  const missingTexts = [...descTexts].filter((t) => !gotDescs[t]);
  if (missingTexts.length) {
    fail(
      "coverage",
      "facilities.descriptions",
      `${missingTexts.length} description texts untranslated: ${missingTexts[0]?.slice(0, 60)}…`
    );
  }
  for (const en of descTexts) {
    if (gotDescs[en]) compareFigures("numerals", `facilities "${en.slice(0, 40)}…"`, en, gotDescs[en]);
  }
  for (const [k, en] of names) {
    if (gotNames[k]) compareFigures("numerals", `facilities.feature.${k}`, en, gotNames[k]);
  }
}

/* ------------------------------------ english-keyed maps: key IS the source */
for (const [f, j] of Object.entries(el)) {
  for (const [where, s] of strings(j)) {
    const key = where.split(".").pop() ?? "";
    /*
     * Only when the key is ITSELF an English sentence — the shape the chrome,
     * beats and sections maps use, where the English string is the map key.
     *
     * An array index is not a sentence. The first version compared the digits
     * in `highlights[0]` against the digits in the Greek and produced 128 false
     * positives, which buried three real ones. A check that cries wolf 128
     * times is a check nobody reads to the end of.
     */
    if (/\[\d+\]$/.test(key)) continue;
    /* `d498` / `e366` are featureId references, not English sentences. The
       paired facilities pass above already compares those properly. */
    if (/^[de]\d+$/.test(key)) continue;
    if (!/[A-Za-z]/.test(key) || key.length < 4) continue;
    if (!/\d/.test(key)) continue;
    compareFigures("numerals", `${f} ${where}`, key, s);
  }
}

/* ----------------------------------------------------------------- report -- */
const byCheck = {};
for (const p of problems) (byCheck[p.check] ??= []).push(p);

const order = ["files", "draft", "numerals", "proper", "capitals", "banned", "coverage"];
console.log("Greek corpus verification — against the English, not the report\n");
for (const c of order) {
  const list = byCheck[c] ?? [];
  console.log(`  ${c.padEnd(10)} ${list.length === 0 ? "clean" : `${list.length} PROBLEM(S)`}`);
}
console.log();
for (const c of order) {
  for (const p of (byCheck[c] ?? []).slice(0, 12)) {
    console.log(`  [${p.check}] ${p.where}\n      ${p.detail}`);
  }
  const extra = (byCheck[c] ?? []).length - 12;
  if (extra > 0) console.log(`  ... and ${extra} more ${c} problems`);
}

const total = problems.length;
console.log(`\n${total === 0 ? "CLEAN" : `${total} problem(s)`} across ${Object.keys(el).length} files`);
if (total) process.exitCode = 1;
