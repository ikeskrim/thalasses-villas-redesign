#!/usr/bin/env node
/**
 * CAN THIS LIBRARY ACTUALLY DRESS THAT LOOK?
 *
 * The re-skin directive names three directions and asserts a photographic fact:
 * that the library "skews golden hour", which makes Golden Coast a natural fit
 * and means Aegean Light needs re-curation AWAY from that skew.
 *
 * THIS FILE ARGUED THE OPPOSITE, AND THIS FILE WAS WRONG.
 *
 * On the 72 frames Phase 1 had graded — 8% of the library — the argument was
 * that the skew lived in the CURATION rather than the collection: warmth did
 * not separate the grades, and the 799 ungraded frames were cooler on average,
 * so Aegean Light looked merely unmeasured rather than starved.
 *
 * Then all 640 gradeable frames were put through the same written standard by
 * two independent graders with a third adjudicating. The result: **15 new
 * A-grades out of 640, and 13 of those 15 are dusk, sunset or low sun.**
 *
 * The half that was right: the library holds far more usable SUPPORT material
 * than an 8% sample implied — Aegean Light went from 23 support frames to 162.
 *
 * The half that mattered and was wrong: average warmth across all frames says
 * nothing about where the hero-grade frames are. Grade for grade this property
 * photographs at hero level mainly at golden hour, which for a west-facing
 * seafront estate is unsurprising in hindsight. Aegean Light has **five**
 * daylight A-grades in the whole library. It is starved, and grading proved it
 * rather than fixing it.
 *
 * That is the value of the pass, and the reason the conclusion is left in the
 * report rather than quietly replaced: a measurement that only ever confirms
 * you is not a measurement.
 *
 * WHY IT CHECKS THE DISK
 *
 * `content/photo-metrics.json` scored 871 files. Byte-identical duplicates were
 * later collapsed and deleted, so 158 of those records point at files that are
 * no longer there. A reservoir that recommends deleted frames reads as
 * availability.
 *
 * WHY A FRAME MUST BE GRADED TO BE PICKED
 *
 * A pick has to carry a description, and this project does not invent them. A
 * graded frame has a person's `subject` line; an ungraded one has only numbers,
 * and numbers cannot see the air-conditioning unit in the corner — which is
 * what put 374 of these 640 frames in grade C.
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
const graded = new Map(); /* file -> { grade, subject, n, flagged, pass } */
for (const s of selects.selects) {
  graded.set(s.file, {
    grade: s.grade,
    subject: s.subject ?? "",
    n: s.n,
    flagged: flagged.has(s.n),
    pass: 1,
  });
}

/**
 * THE SECOND PASS, if it has been run.
 *
 * `content/photo-grades.json` holds every frame Phase 1 never looked at, graded
 * against the same written standard by two independent graders with a third
 * adjudicating. Before it existed this file could only ever report on 8% of the
 * library, and said so; now it reports on all of it.
 *
 * It is read OPTIONALLY on purpose. The grading pass is a large, expensive,
 * regenerable artefact, and a reservoir that cannot run without it would make
 * the whole look system undiagnosable on a fresh checkout.
 */
const gradesPath = path.join(ROOT, "content", "photo-grades.json");
let pass2 = 0;
if (fs.existsSync(gradesPath)) {
  const second = JSON.parse(fs.readFileSync(gradesPath, "utf-8"));
  for (const f of second.frames ?? []) {
    /* Phase 1 wins on any overlap — it is the owner-facing curation of record. */
    if (graded.has(f.file)) continue;
    graded.set(f.file, {
      grade: f.grade,
      subject: f.subject ?? "",
      n: f.id,
      flagged: !!f.flag,
      pass: 2,
    });
    pass2++;
  }
}

/**
 * Golden hour, as the graders described it — not as a colour metric guessed it.
 * `warmth` cannot tell dusk from a terracotta wall in flat light; a person
 * looking at the frame can, and did.
 *
 * Written against what graders ACTUALLY wrote, and widened once because of a
 * miss that shipped: the first version matched "sunset" and not "sun setting",
 * so "Sun setting behind a distant headland over calm sea" was classified as
 * daylight and picked as a frame for AEGEAN LIGHT — the bright direction.
 *
 * A prose classifier is a compromise. The right fix would have been to ask the
 * graders for the light as a field, and that is worth doing if this is ever
 * re-run. Until then the vocabulary is explicit rather than clever, and the
 * picked frames are eyeballed against it.
 */
const LOW_LIGHT =
  /sunset|sun ?setting|setting sun|sundown|dusk|twilight|blue hour|low sun|golden|backlit|lantern|festoon|string of bulbs|lit |uplit|evening|night/i;

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
  {
    id: "type-alive",
    name: "Type-Alive",
    promise: "Typography leads; photography is small, treated and rationed.",
    /*
     * IT TAKES ANY GRADED FRAME, and that is the direction's whole argument.
     *
     * The other three are photo-led, so each needs frames in ITS light: Aegean
     * needs daylight and has five. Type-Alive demotes photography to small
     * treated windows and detail crops, where a B-grade frame of stone or water
     * texture is not a compromise — it is the intended material. The frames it
     * cannot use are the ones no direction can use.
     */
    wantsGraded: () => true,
    wantsUngraded: (m) => m.score >= 4.0,
  },
  {
    id: "hotel",
    name: "The Cretan Hotel",
    promise: "Dense, warm, conventional — many medium frames rather than a few perfect ones.",
    /*
     * B-GRADE FRAMES ARE THE POINT HERE, not a concession. A hotel homepage runs
     * on forty photographs, and a direction that can only use the 33 A-grades
     * cannot be one. This look takes the whole graded pool and asks a different
     * question of it: not "is this frame a hero" but "is this frame honest and
     * usable at card size", which is what grade B means.
     */
    wantsGraded: () => true,
    wantsUngraded: (m) => m.score >= 3.9,
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
    /*
     * DAYLIGHT LEADS, and that ordering is a decision about the chooser page
     * rather than about this look.
     *
     * Golden first gave Editorial the same hero frame as Golden Coast — which
     * is defensible on a look PAGE, where one photograph in two structures
     * isolates the design as the only variable. On the chooser it was a
     * mistake: two of the three cards showed the identical photograph, and the
     * owner's entry point is exactly where "these two are the same" gets
     * decided and one of them gets dismissed unopened.
     *
     * Leading on daylight also happens to be truer. Editorial's brief is
     * daylight AND golden hour under one grade; opening on the same sunset
     * frame as the golden-hour look made it read as a third golden variant.
     */
    ordered = [];
    for (let i = 0; i < Math.max(low.length, day.length); i++) {
      if (day[i]) ordered.push(day[i]);
      if (low[i]) ordered.push(low[i]);
    }
  }

  picks[look.id] = {
    name: look.name,
    promise: look.promise,
    /*
     * The counts travel WITH the picks, so the prototype reads them from here
     * rather than carrying its own transcribed copy. A number typed into a
     * second file is a number that goes stale the first time the library
     * changes, silently, on the one card whose whole job is to tell the owner
     * what a look can actually be dressed from.
     */
    reservoir: { proven: A.length, support: B.length, candidates: candidates.length },
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

/* ------------------------------------------------- distinct front pages -- */
/**
 * NO TWO LOOKS OPEN ON THE SAME PHOTOGRAPH.
 *
 * On a look PAGE a shared frame is a virtue — one photograph in two structures
 * isolates the design as the only variable. On the CHOOSER it is a defect: two
 * identical cards read as one direction shown twice, and the owner's entry
 * point is precisely where a look gets dismissed unopened.
 *
 * Ordering alone could not fix it. Golden-first collided Editorial with Golden
 * Coast; daylight-first collided it with Aegean Light instead, because the
 * whole library holds exactly three daylight A-grade frames. The collision is a
 * property of a thin graded set, not of a sort order, so it needs a pass that
 * knows about all three looks at once.
 *
 * THE LOOK WITH FEWER PROVEN FRAMES KEEPS ITS HERO. Aegean Light has three and
 * Editorial Estate has eighteen; asking the one with three to yield would be
 * taking from the look that has least. Editorial drops to its next frame, which
 * costs it nothing.
 *
 * This is also the clearest signal in the whole report that the graded set is
 * too small: with 871 photographs in the library, three directions cannot open
 * on three different frames without being told to.
 */
{
  /*
   * DIFFERENT FILE IS NOT THE SAME AS DIFFERENT PICTURE.
   *
   * The first version compared `src` and passed happily while Golden Coast and
   * Type-Alive opened on two DIFFERENT files that were both thatched beach
   * umbrellas at sunset, shot minutes apart. On the chooser they read as one
   * photograph used twice — exactly the failure this pass exists to prevent,
   * slipping through because the test was for identity rather than for
   * likeness.
   *
   * The subject lines are the only description of these frames that exists, and
   * they are specific enough to work as a proxy: two heroes that share two or
   * more significant words are treated as the same picture. It is a heuristic
   * and it is stated as one — the right fix is a perceptual hash, which is a
   * larger piece of work than the problem currently justifies.
   */
  const STOP = new Set([
    "the", "a", "an", "and", "with", "at", "on", "in", "of", "to", "over",
    "behind", "under", "from", "for", "beyond", "against", "sea", "white",
  ]);
  const keywords = (s) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOP.has(w))
    );
  /**
   * What the photograph is OF, which is the thing that actually reads as a
   * repeat. Two shared keywords was not enough: Golden Coast's "Beach umbrellas
   * and loungers, golden hour" and Type-Alive's "Thatched umbrellas, low sun"
   * share exactly one word — `umbrellas` — and are plainly the same picture
   * twice on a chooser card. The subject noun is the stronger signal, so it is
   * checked on its own.
   */
  const SUBJECT_NOUNS = [
    "umbrella", "cabana", "lounger", "pool", "terrace", "villa", "beach",
    "table", "garden", "path", "kitchen", "bedroom", "bathroom", "helicopter",
    "boat", "shoreline", "headland", "gate", "deck",
  ];
  const primary = (s) => {
    const t = s.toLowerCase();
    return SUBJECT_NOUNS.find((n) => t.includes(n)) ?? null;
  };
  const tooAlike = (a, b) => {
    const pa = primary(a);
    if (pa && pa === primary(b)) return true;
    const A = keywords(a);
    let shared = 0;
    for (const w of keywords(b)) if (A.has(w)) shared++;
    return shared >= 2;
  };

  const order = [...report].sort((a, b) => a.proven - b.proven);
  const taken = [];
  for (const r of order) {
    const frames = picks[r.look.id].frames;
    const i = frames.findIndex(
      (f) => !taken.some((t) => t.src === f.src || tooAlike(t.subject, f.subject))
    );
    if (i === -1) {
      console.error(`No visually distinct hero frame left for ${r.look.name}.`);
      process.exitCode = 1;
      continue;
    }
    if (i > 0) {
      const [chosen] = frames.splice(i, 1);
      frames.unshift(chosen);
      console.log(`  ${r.look.name}: hero moved to "${chosen.subject}" (earlier picks were taken or too alike)`);
    }
    taken.push(frames[0]);
  }
}

/* ---------------------------------------------------------------- report -- */
const pct = (n, d) => (d ? ((n / d) * 100).toFixed(0) : "0");

let md = `# Look reservoir — can the library dress each direction?

Generated by \`npm run reservoir\`. Re-run it; do not quote it from memory.

## The question, and the answer that reversed itself

The re-skin directive ranks the three looks on a photographic claim: that the
library "skews golden hour", making Golden Coast the natural fit and Aegean
Light the one needing re-curation away from the skew.

**On 8% of the library, this file argued the opposite** — that the skew lived in
the CURATION rather than the collection, because only ${selects.selects.length} of
${metrics.length} frames had ever been looked at and the ungraded remainder was
cooler on average. The conclusion drawn was that Aegean Light was not starved,
merely unmeasured.

**Then everything was graded, and that conclusion was wrong.**

Two independent graders took all ${pass2} remaining frames through the same
written standard, with a third adjudicating disagreements. The library is now
${pct(graded.size, metrics.length)}% graded. The full set yielded **15 new
A-grades in 640 frames**, and **13 of those 15 are dusk, sunset or low sun**.

Where the first conclusion was right: the library holds far more usable SUPPORT
material than an 8% sample suggested. Where it was wrong, and it is the half that
mattered: average warmth across all frames says nothing about where the
hero-grade frames are. Grade for grade, this property photographs at hero level
mainly at golden hour — which for a west-facing seafront estate is not a
surprise in hindsight.

**The directive was right, and closer to right for its own reason than the
correction was.**

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

console.log(`library: ${metrics.length} scored, ${onDisk.size} on disk, ${graded.size} graded (${pct(graded.size, metrics.length)}%)` + (pass2 ? ` — ${selects.selects.length} in pass 1, ${pass2} in pass 2` : ""));
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
