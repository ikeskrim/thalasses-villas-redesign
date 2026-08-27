#!/usr/bin/env node
/**
 * CAN THIS LIBRARY ACTUALLY DRESS THAT LOOK?
 *
 * The re-skin directive names three directions and asserts a photographic fact
 * about each: that the library "skews golden hour", which makes Look C a natural
 * fit and means Look A "requires deliberate re-curation AWAY from" that skew.
 *
 * That is a claim about THIS repository's inventory, and this repository has a
 * rule about claims (CONVENTIONS §18). So it is measured here rather than
 * accepted, and the measurement does not agree with it.
 *
 * WHAT THE NUMBERS SAY
 *
 *   The A-grade shortlist is golden-hour dominated — 15 of 18 frames are
 *   sunset, dusk, blue hour or low sun, by their own curator's subject lines.
 *   The directive is right about that.
 *
 *   The LIBRARY is not. Only 72 of 871 scored frames were ever visually graded;
 *   the other 799 average a warmth of -4.7 against the shortlist's +15.1. And
 *   warmth does not separate the grades at all — A averages 15.1, B 15.0, C
 *   14.2 — so warm light was never a grading criterion. It is what the grader
 *   reached for, not what the library holds.
 *
 *   So the skew is in the CURATION, not the collection. Look A is not starved;
 *   it is UNGRADED. That is a different problem with a different fix: a grading
 *   pass over frames already identified, not a re-shoot and not a compromise.
 *
 * WHY IT CHECKS THE DISK
 *
 * `content/photo-metrics.json` scored 871 files. 320 byte-identical duplicates
 * were later collapsed and deleted, so a fifth of the index points at files that
 * are no longer there. A reservoir report that recommends deleted frames is
 * worse than none, because it reads as availability.
 *
 * WHY UNGRADED FRAMES ARE COUNTED BUT NEVER PICKED
 *
 * A pick has to carry a description, and this project does not invent them. The
 * 72 graded frames have a curator's `subject` line; the other 799 have nothing
 * but numbers. Numbers cannot tell you there is an air-conditioning unit in the
 * corner — that is why 22 of 72 were rejected for clutter no metric detects.
 * Ungraded frames are therefore reported as WORK AVAILABLE, and the prototypes
 * are dressed only in frames a person has actually looked at.
 *
 *   node scripts/look-reservoir.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "qa", "looks");
fs.mkdirSync(OUT, { recursive: true });

const metrics = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "photo-metrics.json"), "utf-8"));
const selects = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "photo-selects.json"), "utf-8"));

/* ------------------------------------------------------------ on the disk -- */
const IMAGES = path.join(ROOT, "public", "images");
const onDisk = new Set();
for (const store of fs.readdirSync(IMAGES)) {
  const dir = path.join(IMAGES, store);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir)) onDisk.add(`/images/${store}/${f}`);
}

const pathOf = (m) => `/images/_${m.store}/${m.file}`;
const exists = (m) => onDisk.has(pathOf(m));

/* --------------------------------------------------------- what was graded -- */
const flagged = new Set(selects.flags.map((f) => f.n));
const graded = new Map(); /* file -> { grade, subject, n, flagged } */
for (const s of selects.selects) {
  graded.set(s.file, {
    grade: s.grade,
    subject: s.subject ?? "",
    n: s.n,
    flagged: flagged.has(s.n),
  });
}

/**
 * Golden hour, as the curator described it — not as a colour metric guessed it.
 *
 * `warmth` cannot tell dusk from a terracotta wall in flat light. The subject
 * lines can, because a person wrote them while looking at the frame.
 */
const LOW_LIGHT = /sunset|dusk|blue hour|low sun|golden|backlit|lantern|lit |uplit|night/i;

/* --------------------------------------------------------------- the looks -- */
/**
 * Each look's brief, expressed twice: once over the curator's words (for graded
 * frames, which is what gets picked) and once over the metrics (for ungraded
 * frames, which is what gets counted). They are deliberately different tests,
 * because they are answering different questions — "is this frame right" versus
 * "is it worth a person's time to look at this frame".
 */
const LOOKS = [
  {
    id: "aegean",
    name: "Aegean Light",
    promise: "Bright Mediterranean minimal — daylight, blue water, whitewashed stone.",
    wantsGraded: (g) => !LOW_LIGHT.test(g.subject),
    wantsUngraded: (m) => m.warmth < 10 && m.lum > 140,
  },
  {
    id: "editorial",
    name: "Editorial Estate",
    promise: "A magazine feature about one address — daylight and golden hour under one grade.",
    wantsGraded: () => true,
    wantsUngraded: (m) => m.score >= 4.1,
  },
  {
    id: "golden",
    name: "Golden Coast",
    promise: "Golden-hour cinematic — warm light, houses stacked toward the water.",
    wantsGraded: (g) => LOW_LIGHT.test(g.subject),
    wantsUngraded: (m) => m.warmth >= 25,
  },
];

/* Usable at all: on the disk, graded, and not carrying a content flag. */
const usable = metrics
  .filter(exists)
  .map((m) => ({ m, g: graded.get(m.file) }))
  .filter((x) => x.g && !x.g.flagged);

const ungraded = metrics.filter((m) => exists(m) && !graded.has(m.file));

const report = [];
const picks = {};

for (const look of LOOKS) {
  const fit = usable.filter((x) => look.wantsGraded(x.g));
  const A = fit.filter((x) => x.g.grade === "A");
  const B = fit.filter((x) => x.g.grade === "B");
  const candidates = ungraded.filter(look.wantsUngraded);

  /*
   * THE CURATOR'S GRADE OUTRANKS THE SCORE, and the two are sorted separately
   * rather than concatenated and re-sorted.
   *
   * Sorting the union by score alone put Aegean Light's hero on a frame whose
   * own subject line reads "Same beach scene, WEAKER FRAMING", and pushed its
   * three A-grade turquoise-pool frames — the exact brief — down the list. The
   * algorithmic score is a proxy that was never meant to overrule the person who
   * looked at the photograph; that is the whole premise of this file.
   */
  const byScore = (p, q) => q.m.score - p.m.score;
  let ordered = [...A.sort(byScore), ...B.sort(byScore)];

  /*
   * EDITORIAL'S IDENTITY IS THE MIX, so it is built as one.
   *
   * Its brief is daylight and golden hour held together by a single grade —
   * that is what makes it a magazine feature rather than a mood piece. Taking
   * the top of the graded pile gave it a front page identical to Golden Coast's,
   * because 15 of the 18 A-grade frames are low light. Two directions that
   * choose the same photographs are one direction shown twice, and the owner
   * would have been asked to pick between them.
   */
  if (look.id === "editorial") {
    const low = ordered.filter((x) => LOW_LIGHT.test(x.g.subject));
    const day = ordered.filter((x) => !LOW_LIGHT.test(x.g.subject));
    ordered = [];
    for (let i = 0; i < Math.max(low.length, day.length); i++) {
      if (low[i]) ordered.push(low[i]);
      if (day[i]) ordered.push(day[i]);
    }
  }

  picks[look.id] = {
    name: look.name,
    promise: look.promise,
    frames: ordered.slice(0, 8).map((x) => ({
      src: pathOf(x.m),
      /* The curator's own words. Never generated, never paraphrased. */
      subject: x.g.subject,
      grade: x.g.grade,
      n: x.g.n,
      w: x.m.w,
      h: x.m.h,
    })),
  };

  report.push({
    look,
    proven: A.length,
    support: B.length,
    candidates: candidates.length,
    heroReady: A.length > 0,
  });
}

/* ---------------------------------------------------------------- report -- */
const pct = (n, d) => (d ? ((n / d) * 100).toFixed(0) : "0");
const gradedLow = selects.selects.filter((s) => s.grade === "A" && LOW_LIGHT.test(s.subject ?? "")).length;
const gradedA = selects.selects.filter((s) => s.grade === "A").length;
const meanWarmth = (arr) => (arr.length ? (arr.reduce((s, x) => s + x.warmth, 0) / arr.length).toFixed(1) : "-");

let md = `# Look reservoir — can the library dress each direction?

Generated by \`npm run reservoir\`. Re-run it; do not quote it from memory.

## The correction

The re-skin directive states that the library "skews golden hour", and builds its
ranking on that: Look C is called the natural fit and Look A is said to need
re-curation *away* from the skew.

**The skew is in the curation, not the collection.**

| | frames | mean warmth |
|---|---|---|
| Visually graded (the shortlist) | ${selects.selects.length} | ${meanWarmth(selects.selects)} |
| Never visually graded | ${ungraded.length} | ${meanWarmth(ungraded)} |

Warm light was never a grading criterion — across the shortlist, warmth does not
separate the grades (A ${meanWarmth(selects.selects.filter((s) => s.grade === "A"))}, B ${meanWarmth(selects.selects.filter((s) => s.grade === "B"))}, C ${meanWarmth(selects.selects.filter((s) => s.grade === "C"))}). What is true is that
**${gradedLow} of the ${gradedA} A-grade frames are sunset, dusk, blue hour or low sun**
(${pct(gradedLow, gradedA)}%), by their curator's own subject lines. The grader reached for
dramatic light. The library did not supply it.

Only **${pct(selects.selects.length, metrics.length)}%** of the scored library was ever looked at by a person.

## What each look actually has

| look | proven hero-grade | proven support | ungraded candidates |
|---|---|---|---|
${report
  .map(
    (r) =>
      `| **${r.look.name}** | ${r.proven} | ${r.support} | ${r.candidates} |`
  )
  .join("\n")}

*Proven* means a person looked at the frame, graded it, wrote what is in it, and
it is still on the disk. *Candidates* means the numbers say it is worth looking
at and nobody has.

## What this changes

Look A is not the starved direction — it is the **unmeasured** one. Its shortage
is ${report.find((r) => r.look.id === "aegean").proven} proven hero frames against
${report.find((r) => r.look.id === "aegean").candidates} candidates nobody has
opened. That is a grading pass, not a re-shoot, and it is the cheapest thing on
this whole document: the frames already exist, already sit in \`public/images/\`,
and already have measurements.

Look C is the opposite: the **only** direction whose hero photography is proven
today, and the one with the least room left to grow.

The recommendation is therefore not a different pick. It is that the pick should
follow one afternoon of grading, because right now the ranking is being decided
by which frames somebody happened to look at in Phase 1.

**Caveat, stated because the numbers invite over-reading:** candidate counts are
upper bounds. 22 of the 72 graded frames were rejected for air-conditioning
units, cables, plastic furniture and catering gear — none of which any metric in
\`photo-metrics.json\` can see. Expect roughly a third of any candidate set to
fall away on sight.

## The frames these prototypes are dressed in

Only graded, unflagged, on-disk frames. Every description below is the curator's,
written while looking at the photograph.

`;

for (const look of LOOKS) {
  md += `### ${look.name}\n\n| grade | frame | what is in it |\n|---|---|---|\n`;
  md += picks[look.id].frames
    .map((f) => `| ${f.grade} | \`${f.src.split("/").pop()}\` | ${f.subject} |`)
    .join("\n");
  md += "\n\n";
}

/* The index is stale by a fifth; say so rather than letting it look complete. */
const missing = metrics.filter((m) => !exists(m)).length;
md += `## Index integrity

\`photo-metrics.json\` holds ${metrics.length} records. **${missing} of them point at files that are no
longer on the disk** — collapsed when the byte-identical duplicates were removed.
Nothing in this report or in \`content/look-picks.json\` references one; every
path was checked against \`public/images/\` at generation time.
`;

fs.writeFileSync(path.join(OUT, "RESERVOIR.md"), md);
fs.writeFileSync(
  path.join(ROOT, "content", "look-picks.json"),
  JSON.stringify(
    {
      _note:
        "Generated by scripts/look-reservoir.mjs. Graded, unflagged, on-disk frames only. " +
        "Every `subject` is the curator's own description from photo-selects.json — none is generated.",
      generatedFrom: { metrics: metrics.length, graded: selects.selects.length, onDisk: onDisk.size },
      looks: picks,
    },
    null,
    2
  ) + "\n"
);

console.log(`library: ${metrics.length} scored, ${onDisk.size} on disk, ${selects.selects.length} graded (${pct(selects.selects.length, metrics.length)}%)`);
for (const r of report) {
  console.log(
    `  ${r.look.name.padEnd(16)} proven A ${String(r.proven).padStart(2)}  support ${String(r.support).padStart(2)}  ungraded candidates ${r.candidates}`
  );
}
console.log(`-> qa/looks/RESERVOIR.md, content/look-picks.json`);

/* A look with no proven hero frame cannot be prototyped honestly. */
const starved = report.filter((r) => !r.heroReady);
if (starved.length) {
  console.error(`\nNo hero-grade frame for: ${starved.map((r) => r.look.name).join(", ")}`);
  process.exitCode = 1;
}
