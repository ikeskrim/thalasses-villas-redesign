#!/usr/bin/env node
/**
 * DRESS THE EXPERIENCES UNDER TIER B-EXPERIENCES.
 *
 * The owner ruled that non-property representational imagery is permitted for
 * experience cards — own real frames first, otherwise properly licensed stock,
 * one log line per frame. `content/image-sources.md` carries the rule.
 *
 * This builds the log and the mapping, and it does the part of the rule that can
 * be done from what is already here: **condition 1, own frames first.**
 *
 * IT ONLY PROPOSES A FRAME WHEN THE FRAME GENUINELY DEPICTS THE ACTIVITY.
 *
 * That sounds obvious and it is the whole difficulty. A first pass matched
 * "massage" to a villa at dusk and "hiking" to an uplit garden path, because a
 * loose keyword search will always find something. A hot tub is not a massage
 * and a garden path is not a gorge. Where the estate has never photographed the
 * activity, this says so and leaves the slot empty rather than filling it with
 * an adjacent picture — an experience card showing the wrong thing is a promise
 * the property cannot keep, which is the failure the whole tiering exists to
 * prevent.
 *
 *   node scripts/experience-imagery.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const EXP = path.join(ROOT, "content", "experiences");

/* --------------------------------------------------- what has been graded -- */
const grades = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "photo-grades.json"), "utf-8"));
const selects = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "photo-selects.json"), "utf-8"));

const phase1Flags = new Set(selects.flags.map((f) => f.n));
const frames = new Map(); /* path -> { grade, subject, flag } */
for (const s of selects.selects) {
  frames.set(s.path, { grade: s.grade, subject: s.subject ?? "", flag: phase1Flags.has(s.n) ? "phase1" : null });
}
for (const f of grades.frames) {
  if (!frames.has(f.path)) frames.set(f.path, { grade: f.grade, subject: f.subject ?? "", flag: f.flag });
}

const usable = [...frames.entries()]
  .filter(([, f]) => !f.flag && f.grade !== "C")
  .map(([p, f]) => ({ path: p, ...f }));

/**
 * The mapping, decided by reading subject lines rather than by matching words.
 *
 * Each entry names the EXACT subject text of the frame it wants, so a frame that
 * is later re-graded, flagged or removed makes this fail loudly instead of
 * silently sliding onto a different photograph.
 */
const OWN = {
  "biological-garden": "Vegetable beds toward the sea",
  "breakfast-on-the-beach": "Breakfast table and chair on a white terrace facing the sea",
  "chef-in-villa": "Dressed dinner tables on a terrace in low sun",
  "learn-the-secrets-of-cretan-cuisine": "Bright kitchen and dining table with folding doors open to a sunlit terrace",
  "dream-weadding-on-the-beach": "Two open-sided canopies over low cushioned tables on a rocky beach at sunset",
  "wine-tasting": "Outdoor dining table set with wine beside a barbecue counter and timber fence",
  chauffeur: "Illuminated estate entrance sign lettered Thalasses beside a driveway at dusk",
};

/**
 * Activities the estate has never photographed, with the reason stated so nobody
 * has to re-derive it. These are the Tier B-Experiences slots: they need
 * properly licensed stock that plausibly depicts the activity in Crete or the
 * Mediterranean, and until that exists the card carries no photograph.
 */
const NEEDS_LICENSED = {
  "boat-trip": "Happens at sea, off the estate. No own frame of a boat exists in the library.",
  "scuba-diving": "Underwater. Nothing comparable in the library.",
  "jet-ski-safari": "Open water, operated off-site.",
  hiking: "The gorges are inland. The estate's paths are garden paths, not trails.",
  running: "No own frame of the activity; a garden path is not a running route.",
  "bike-tours": "Routes are around Crete, not on the estate.",
  "jeep-safari": "Inland mountain tracks.",
  "quad-safari": "Inland tracks. The inherited frame is withdrawn — its landscape is not Crete.",
  "exclusive-tour": "Rethymno town and monasteries; these are Tier B named places, photographed off-site.",
  massage: "In-villa, but never photographed. A hot tub is not a massage.",
  therapist: "Same. No own frame depicts a treatment.",
  "personal-trainer": "No gym or training frame exists.",
  "wine-production": "A working winery, off-site. The inherited frame is withdrawn as composited stock.",
  "private-helipad": "The only helicopter frame in the library carries a watermark and is flagged unsure.",
};

/**
 * WHY A SLOT IS STILL EMPTY AFTER THE SOURCING PASS — printed on the card.
 *
 * Fourteen activities went to two free-licence sources with an adversarial
 * verifier on every candidate, and nine came back clean. These five did not,
 * and the owner asked that a card with no honest match keep its typographic
 * treatment and SAY WHY. So the reason is on the live page, in the same
 * labelled-slot register as the press wall, until a frame is found or the
 * owner supplies one.
 */
const SOURCING_NOTES = {
  running: "every candidate carried a kit logo or a recognisable face",
  "bike-tours": "the only clean frame was a Spanish coast road with the riders too small to read",
  "quad-safari": "the only clean frame was a parked quad on Mykonos, not a mountain track",
  "personal-trainer": "the only clean frame showed a recognisable face on a public deck",
  "private-helipad": "every helicopter frame carried an operator's livery or registration",
};

/* --------------------------------------------------- the inherited frames -- */
const quarantine = JSON.parse(
  fs.readFileSync(path.join(ROOT, "content", "flagged-quarantine.json"), "utf-8")
);

/** Out on brand grounds, not on paperwork — they do not come back with a licence. */
const WITHDRAWN = [
  {
    match: /quad bike/i,
    why: "The birch-and-scrub woodland is not Crete. Fails Tier B-Experiences condition 3 on sight.",
  },
  {
    match: /wine barrel/i,
    why: "Textbook composited stock — it reads as an advertisement rather than an evening here.",
  },
];

const inherited = quarantine.frames.map((f) => {
  const w = WITHDRAWN.find((x) => x.match.test(f.subject));
  return {
    src: f.src,
    subject: f.subject,
    source: "Owner's Loggia CMS (thalasses.com), inherited in Phase 0",
    licence: "unknown",
    status: w ? "withdrawn" : "pending-licence",
    why: w
      ? w.why
      : "Flagged as " + f.flag + " by two independent graders. Unknown is not licensed; " +
        "clearing it means producing the licence, not asserting one.",
  };
});

/* ------------------------------------------------------------ the mapping -- */
const bySubject = new Map();
for (const f of usable) if (!bySubject.has(f.subject)) bySubject.set(f.subject, f);

const experiences = {};
/*
 * The sourced-stock log is HAND-MAINTAINED and lives in its own file precisely
 * because this one is generated: a sourced frame written straight into
 * experience-imagery.json would vanish on the next `npm run experience-imagery`.
 * scripts/fetch-stock.mjs writes it; this merges it.
 */
const STOCK = fs.existsSync(path.join(ROOT, "content", "experience-stock.json"))
  ? JSON.parse(fs.readFileSync(path.join(ROOT, "content", "experience-stock.json"), "utf-8"))
  : { frames: {} };
for (const slug of Object.keys(STOCK.frames)) {
  if (OWN[slug]) {
    throw new Error(
      `${slug} has both an own frame and a stock entry. Condition 1 — own frames first — ` +
        `means the stock entry is dead; remove it from content/experience-stock.json.`
    );
  }
}

const problems = [];
let dressed = 0;
let dressedFromStock = 0;

for (const file of fs.readdirSync(EXP).filter((f) => f.endsWith(".json")).sort()) {
  const e = JSON.parse(fs.readFileSync(path.join(EXP, file), "utf-8"));
  const slug = e.slug;
  const wanted = OWN[slug];

  if (wanted) {
    const frame = bySubject.get(wanted);
    if (!frame) {
      problems.push(`${slug}: wants "${wanted}", which is no longer an unflagged A/B frame`);
      experiences[slug] = { tier: "A", status: "frame-missing", wanted };
      continue;
    }
    experiences[slug] = {
      tier: "A",
      status: "cleared",
      src: frame.path,
      alt: frame.subject,
      grade: frame.grade,
      source: "The property's own photography",
      licence: "Owner's material",
    };
    dressed++;
    continue;
  }

  /*
   * SOURCED STOCK, from the hand-maintained log. Condition 1 says own frames
   * first, and the branch above has already had its chance — a slug that is in
   * both OWN and the stock log never reaches here, so a sourced frame can never
   * displace the property's own photograph.
   *
   * The file must exist. A log line for a file that is not on disk is a claim
   * with nothing behind it, and it fails the build rather than the page.
   */
  const stock = STOCK.frames[slug];
  if (stock) {
    const onDisk = path.join(ROOT, "public", stock.file);
    if (!fs.existsSync(onDisk)) {
      problems.push(`${slug}: stock log names ${stock.file}, which is not in public/images/_stock/`);
    }
    for (const k of ["sourceUrl", "licence", "photographer", "retrieved", "alt"]) {
      if (!stock[k]) problems.push(`${slug}: stock log entry has no ${k}`);
    }
    experiences[slug] = {
      tier: "B-Experiences",
      status: "cleared",
      src: stock.file,
      alt: stock.alt,
      source: stock.source,
      sourceUrl: stock.sourceUrl,
      sourceId: stock.sourceId,
      photographer: stock.photographer,
      licence: stock.licence,
      location: stock.location,
      retrieved: stock.retrieved,
      verifier: stock.verifier,
      /* Crop focus for a portrait frame on a 4:3 card — the photographer's
         framing survives; nothing is toned. */
      position: stock.position,
      why: NEEDS_LICENSED[slug] ?? "No own frame depicts this activity.",
    };
    dressedFromStock++;
    continue;
  }

  experiences[slug] = {
    tier: "B-Experiences",
    status: "needs-licensed-stock",
    why: NEEDS_LICENSED[slug] ?? "No own frame depicts this activity.",
    /* Shown on the card, so the owner sees on the live page why it is empty. */
    note: SOURCING_NOTES[slug],
    /* What a sourced frame has to satisfy, so filling this needs no re-reading. */
    brief: "Plausibly this activity in Crete or the Mediterranean; no landmark from elsewhere; no third-party branding; licence recorded here.",
  };
}

fs.writeFileSync(
  path.join(ROOT, "content", "experience-imagery.json"),
  JSON.stringify(
    {
      _note:
        "Experience-card imagery under the Tier B-Experiences rule in content/image-sources.md. " +
        "`experiences` maps a slug to the frame its card should use; `inherited` is the log of the " +
        "fourteen flagged frames the rebuild received. tests/flagged.spec.ts fails on any " +
        "non-property frame the site renders that is not logged here, and on any frame marked " +
        "withdrawn. Regenerate with `npm run experience-imagery`.",
      _rule: "content/image-sources.md — Tier B-Experiences",
      generated: {
        dressedFromOwnFrames: dressed,
        dressedFromLicensedStock: dressedFromStock,
        needsLicensedStock: Object.values(experiences).filter((x) => x.status === "needs-licensed-stock").length,
      },
      experiences,
      inherited,
    },
    null,
    2
  ) + "\n"
);

const needs = Object.entries(experiences).filter(([, v]) => v.status === "needs-licensed-stock");
console.log(`${dressed} experiences dressed from the property's own frames`);
console.log(`${dressedFromStock} dressed from licensed stock (content/experience-stock.json)`);
console.log(`${needs.length} need licensed stock under Tier B-Experiences:`);
for (const [slug, v] of needs) console.log(`   ${slug.padEnd(36)} ${v.why}`);
console.log(`\ninherited log: ${inherited.length} frames — ` +
  `${inherited.filter((f) => f.status === "withdrawn").length} withdrawn, ` +
  `${inherited.filter((f) => f.status === "pending-licence").length} pending a licence`);
console.log("-> content/experience-imagery.json");

if (problems.length) {
  console.error(`\n${problems.length} mapping problem(s):`);
  for (const p of problems) console.error("  " + p);
  process.exitCode = 1;
}
