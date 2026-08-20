#!/usr/bin/env node
/**
 * CHH RE-ADMISSION — recovering the partner page's account of this property.
 *
 * `creteholidayhome.com/accommodation/thalasses-villas/` is a page about
 * Thalasses Villas, written by the company that manages the rentals, captured
 * in Phase 0 and then left alone. Its photographs were admitted long ago (168
 * of them under `public/images/_chh/`); its **words** never were.
 *
 * They should be. It carries facts that exist nowhere on thalasses.com — real
 * airport and port distances, a pool alarm, a week's notice for pool heating, a
 * playground, a vegetable garden, a full amenity inventory in twelve
 * categories — and it independently states the capacity figures that the villa
 * registry locks. That corroboration is the reason to trust the rest of it.
 *
 * **But it is a THIRD PARTY writing about a first party, and that distinction
 * survives into the data.** Every fact extracted here carries its source, and
 * nothing is merged into the owner's own registry. The reconciliation below
 * sorts each fact into one of three buckets and the report names them:
 *
 *   CORROBORATES  the registry already says this, and CHH agrees. Evidence.
 *   ADDS          the registry is silent and CHH is specific. Recoverable,
 *                 pending owner confirmation — never silently promoted.
 *   CONFLICTS     the two disagree. The registry wins on the page, and the
 *                 conflict goes to the owner. This is the bucket that matters.
 *
 *   node scripts/extract-chh.mjs
 */
import fs from "node:fs";
import path from "node:path";

const SRC = path.join(
  process.cwd(),
  "content",
  "raw-chh",
  "https___creteholidayhome.com_accommodation_thalasses-villas_.txt"
);
const OUT = path.join(process.cwd(), "content", "chh-facts.json");
const REPORT = path.join(process.cwd(), "content", "CHH-RECONCILIATION.md");

const SOURCE = "creteholidayhome.com/accommodation/thalasses-villas/ (Phase 0 capture)";

if (!fs.existsSync(SRC)) {
  console.error(`Phase 0 capture missing: ${SRC}`);
  process.exit(1);
}

/** Tags out, entities decoded, whitespace collapsed. */
function plain(html) {
  let s = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<[^>]+>/g, " ");
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&[a-z]+;/gi, " ");
  return s.replace(/﻿/g, "").replace(/\s+/g, " ").trim();
}

const text = plain(fs.readFileSync(SRC, "utf-8"));

/* ---------------------------------------------------------------- FIGURES -- */
/*
 * The estate stat strip. These are the numbers the villa registry locks, stated
 * independently by the manager — so this block is evidence rather than input,
 * and the reconciliation treats any disagreement as a defect to escalate.
 */
const figures = {};
for (const [key, re] of [
  ["bedrooms", /Bedrooms\s+(\d+)\b/],
  ["maxGuests", /Sleeps up to\s+(\d+)/],
  ["pools", /Pools\s+(\d+)\b/],
  ["bathrooms", /Baths\s+(\d+)\b/],
  ["indoorAreaSqm", /Indoor Area\s+(\d+)\s*m/],
]) {
  const m = re.exec(text);
  if (m) figures[key] = Number(m[1]);
}

/* -------------------------------------------------------------- DISTANCES -- */
/*
 * Real, specific, and absent from thalasses.com, which states no airport or
 * port distance anywhere. Eight beach distances remain unknown (T-223); these
 * are not those, and do not fill that gap.
 */
const distances = [];
{
  const block = /From Heraklion([\s\S]{0,200}?)From Chania([\s\S]{0,200}?)(?:Docto|$)/.exec(text);
  if (block) {
    for (const [city, chunk] of [
      ["Heraklion", block[1]],
      ["Chania", block[2]],
    ]) {
      for (const m of chunk.matchAll(/(Airport|Port)\s+([\d.]+)\s*km/g)) {
        distances.push({ from: city, to: m[1], km: Number(m[2]) });
      }
    }
  }
}

/* ---------------------------------------------------------------- POLICIES -- */
const policies = {};
{
  const smoking = /SMOKING\s+Allowed:\s*([A-Za-z ]+?)\s+LANGUAGES/.exec(text);
  if (smoking) policies.smoking = smoking[1].trim();
  const langs = /LANGUAGES SPOKEN\s+([A-Za-z, ]+?)\s+(?:Bedroom|Location|Popular|$)/.exec(text);
  if (langs) policies.languagesSpoken = langs[1].trim().replace(/\s*,\s*/g, ", ");
}

/* --------------------------------------------------------------- AMENITIES -- */
/*
 * The inventory is rendered as `N <name> <optional gloss>` runs under category
 * headings — a checkmark glyph that survived the capture as the letter N. The
 * categories are known and closed, which is what makes this parseable at all;
 * a heuristic split would silently drop or invent entries.
 */
const CATEGORIES = [
  "Popular",
  "Bathroom",
  "Bedroom and laundry",
  "Entertainment",
  "Family",
  "Heating and cooling",
  "Home safety",
  "Internet and office",
  "Kitchen and dining",
  "Location features",
  "Outdoor",
  "Parking and facilities",
];

const amenities = {};
for (const cat of CATEGORIES) {
  const re = new RegExp(
    `\\b${cat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+((?:N\\s+[^N][\\s\\S]*?)+?)(?=\\b(?:${CATEGORIES.map(
      (c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    ).join("|")}|TRAVEL TRIBE|SMOKING|LANGUAGES SPOKEN|Location of Thalasses)\\b|$)`
  );
  const m = re.exec(text);
  if (!m) continue;
  const items = m[1]
    .split(/\bN\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    /* The first word or two is the amenity; the rest is its gloss. Both kept —
       the gloss is the partner's own wording and is not ours to rewrite. */
    .map((s) => {
      const cut = /^([A-Z][^.]*?)(?:\s+([A-Z][a-z][\s\S]*))?$/.exec(s);
      const name = (cut ? cut[1] : s).replace(/\s+/g, " ").trim();
      const gloss = cut && cut[2] ? cut[2].replace(/\s+/g, " ").trim() : null;
      return { name, gloss };
    })
    .filter((a) => a.name.length > 1 && a.name.length < 60);
  if (items.length) amenities[cat] = items;
}

/* ------------------------------------------------------------- PROSE FACTS -- */
/*
 * Specific, checkable statements the site does not make anywhere. Matched on
 * exact phrases from the capture rather than summarised, because a summary of
 * someone else's claim is a new claim.
 */
const PROSE = [
  ["poolHeating", /can be heated upon advance request with an additional daily charge/i],
  ["poolHeatingNotice", /requires at least one week advance notice/i],
  ["poolAlarm", /pool contains a pool alarm system for child safety/i],
  ["playground", /safe organised playground for children/i],
  ["vegetableGarden", /vegetable garden in which you can [""“”]?use[""“”]? with our gardener/i],
  ["diningTable18", /dining table for 18 people/i],
  ["sunbeds", /private sunbeds on the crystal clear water[’']s edge/i],
  ["bedConversion", /single beds in twin rooms can be transformed to be a double/i],
  ["receptionDesk", /daily operating reception desk/i],
  ["cleaning", /cleaning every 3 days/i],
  ["concierge", /Holiday Advisor & concierge/i],
  ["helipad", /only sea\s*front villas with private helipad/i],
  ["beachArea", /sandy stretch of beach on the east side of Rethymno in an area called/i],
];
const prose = {};
for (const [key, re] of PROSE) {
  const m = re.exec(text);
  if (m) prose[key] = m[0].replace(/\s+/g, " ").trim();
}

/* -------------------------------------------------------------- RECONCILE -- */
const villas = ["200", "201", "202", "203"].map((k) =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), "content", "villas", `${k}.json`), "utf-8"))
);
const sum = (f) => villas.reduce((n, v) => n + (v.specs?.[f] ?? 0), 0);

const registry = {
  bedrooms: sum("bedrooms"),
  bathrooms: sum("bathrooms"),
  maxGuests: sum("maxGuests"),
  pools: sum("pools"),
  indoorAreaSqm: sum("sizeSqm"),
};

const reconciliation = [];
for (const [key, chhValue] of Object.entries(figures)) {
  const ours = registry[key];
  if (ours == null) {
    reconciliation.push({ fact: key, chh: chhValue, registry: null, verdict: "ADDS" });
  } else if (ours === chhValue) {
    reconciliation.push({ fact: key, chh: chhValue, registry: ours, verdict: "CORROBORATES" });
  } else {
    reconciliation.push({ fact: key, chh: chhValue, registry: ours, verdict: "CONFLICTS" });
  }
}

const facts = {
  source: SOURCE,
  capturedFile: path.relative(process.cwd(), SRC).split(path.sep).join("/"),
  ownerConfirmed: false,
  note:
    "Third party writing about a first party. Nothing here is merged into content/villas/*.json. " +
    "Regenerate with `node scripts/extract-chh.mjs`.",
  figures,
  distances,
  policies,
  amenities,
  prose,
  reconciliation,
};

fs.writeFileSync(OUT, JSON.stringify(facts, null, 2) + "\n");

/* ------------------------------------------------------------------ REPORT -- */
const conflicts = reconciliation.filter((r) => r.verdict === "CONFLICTS");
const corroborates = reconciliation.filter((r) => r.verdict === "CORROBORATES");
const amenityCount = Object.values(amenities).reduce((n, a) => n + a.length, 0);

let md = `# CHH reconciliation

Generated by \`node scripts/extract-chh.mjs\` from the Phase 0 capture of
\`${SOURCE}\`.

The partner company's page about this property. Its **photographs** were
admitted in Phase 1; its **words** were not, and they carry facts that exist
nowhere on thalasses.com.

It is a third party writing about a first party, so nothing here is merged into
\`content/villas/*.json\`. The owner's registry stays the registry.

---

## The figures — ${corroborates.length} corroborated, ${conflicts.length} in conflict

| fact | CHH says | registry says | verdict |
|---|---|---|---|
${reconciliation.map((r) => `| ${r.fact} | ${r.chh} | ${r.registry ?? "—"} | **${r.verdict}** |`).join("\n")}

${
  conflicts.length
    ? "**These conflicts are for the owner.** The registry wins on the page until he rules."
    : "Every figure the manager publishes agrees exactly with the owner's own registry. That is the reason to trust the rest of this page: two independent sources, no disagreement."
}

## What it ADDS — facts the site does not state anywhere

### Distances (${distances.length})

${distances.length ? distances.map((d) => `- ${d.from} ${d.to} — **${d.km} km**`).join("\n") : "None found."}

These are airport and port distances. They do **not** close T-223, which is the
eight missing *beach* distances — different question, still open.

### Policies

${Object.entries(policies).map(([k, v]) => `- **${k}** — ${v}`).join("\n") || "None found."}

### Specifics stated only here

${Object.entries(prose).map(([k, v]) => `- **${k}** — "${v}"`).join("\n") || "None found."}

### The amenity inventory — ${amenityCount} entries in ${Object.keys(amenities).length} categories

${Object.entries(amenities)
  .map(([cat, items]) => `**${cat}** (${items.length}) — ${items.map((i) => i.name).join(", ")}`)
  .join("\n\n")}

---

## What is safe to surface, and what is not

**Corroborating a claim the site already makes is free.** "The table, set for
eighteen" on the homepage is the owner's copy; the manager's page independently
says *"a dining table for 18 people"*. Nothing needs to change, but the claim is
now sourced twice.

**Everything in ADDS is owner-pending.** It is recovered content, not confirmed
content, and the distinction is the whole reason this file exists. A pool alarm,
a playground and a vegetable garden are excellent detail and would each be a
claim about a real property made on the strength of a partner's marketing page.

**The helipad line is the one to be careful with.** CHH repeats the exclusivity
claim — *"the only seafront villas with private helipad"* — which is already the
open question on thalasses.com. Two sources making the same unscoped claim is
not the same as the claim being scoped.
`;

fs.writeFileSync(REPORT, md);

console.log(`figures      ${Object.keys(figures).length}  (${corroborates.length} corroborate, ${conflicts.length} conflict)`);
console.log(`distances    ${distances.length}`);
console.log(`policies     ${Object.keys(policies).length}`);
console.log(`prose facts  ${Object.keys(prose).length}`);
console.log(`amenities    ${amenityCount} in ${Object.keys(amenities).length} categories`);
console.log(`\n-> ${path.relative(process.cwd(), OUT)}`);
console.log(`-> ${path.relative(process.cwd(), REPORT)}`);

if (conflicts.length) {
  console.error(`\n${conflicts.length} CONFLICT(S) with the owner's registry — see the report.`);
}
