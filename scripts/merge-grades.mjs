#!/usr/bin/env node
/**
 * LAND THE GRADING PASS INTO THE REPOSITORY.
 *
 * Phase 1 graded 72 of 871 frames and the other 799 were never looked at. That
 * shortfall was not abstract: three candidate directions could not open on
 * three different photographs without being told to, because the graded set
 * held exactly three daylight A-grades.
 *
 * This takes the output of `scripts/grade-photo-library` — every gradeable
 * frame, judged by two independent graders against the Phase 1 standard
 * verbatim, with a third adjudicating where they disagreed — and joins it back
 * to the real files.
 *
 * IT JOINS ON THE SHEET INDEX, NOT ON GUESSES. The graders saw `g0417.jpg`, a
 * normalised JPEG in a scratch directory; the site serves
 * `/images/_pool/<hash>.jpg`. `index.json` is the only thing that knows those
 * are the same photograph, and it was written by the same run that produced the
 * sheet.
 *
 *   node scripts/merge-grades.mjs <workflow-output.json> <sheetDir>
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const [outFile, sheetDir] = process.argv.slice(2);
if (!outFile || !sheetDir) {
  console.error("usage: node scripts/merge-grades.mjs <workflow-output.json> <sheetDir>");
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(outFile, "utf-8"));
const result = payload.result ?? payload;
const graded = result.frames ?? [];
const stats = result.stats ?? {};

if (!graded.length) {
  console.error("The workflow returned no frames. Read its journal.jsonl before assuming a merge problem.");
  process.exit(1);
}

const index = JSON.parse(fs.readFileSync(path.join(sheetDir, "index.json"), "utf-8")).frames;
const byId = new Map(index.map((f) => [f.id, f]));

/* The files still have to be there. A grade for a deleted frame is not a fact. */
const IMAGES = path.join(ROOT, "public", "images");
const onDisk = new Set();
for (const store of fs.readdirSync(IMAGES)) {
  const dir = path.join(IMAGES, store);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir)) onDisk.add(`/images/${store}/${f}`);
}

const frames = [];
const orphans = [];
for (const g of graded) {
  const src = byId.get(g.id);
  if (!src) {
    orphans.push(g.id);
    continue;
  }
  if (!onDisk.has(src.path)) {
    orphans.push(`${g.id} (${src.path} not on disk)`);
    continue;
  }
  frames.push({
    id: g.id,
    file: src.file,
    store: src.store,
    path: src.path,
    w: src.w,
    h: src.h,
    grade: g.grade,
    subject: g.subject,
    reason: g.reason,
    flag: g.flag ?? null,
    flagReason: g.flagReason ?? null,
    graders: g.graders,
    agreed: !!g.agreed,
    adjudicated: !!g.adjudicated,
    ...(g.unresolved ? { unresolved: true } : {}),
    ...(g.wasA ? { wasA: g.wasA, wasB: g.wasB } : {}),
  });
}

const dist = { A: 0, B: 0, C: 0 };
for (const f of frames) dist[f.grade]++;
const flagged = frames.filter((f) => f.flag);
const flagKinds = {};
for (const f of flagged) flagKinds[f.flag] = (flagKinds[f.flag] ?? 0) + 1;

fs.writeFileSync(
  path.join(ROOT, "content", "photo-grades.json"),
  JSON.stringify(
    {
      _note:
        "The second grading pass. Every frame Phase 1 never looked at, graded against " +
        "`content/photo-selects.json`'s criteria VERBATIM by two independent graders, with a " +
        "third adjudicating disagreements. `subject` is what a grader saw in the frame and is " +
        "the source of alt text — nothing here is generated from a filename. Regenerate the " +
        "sheet with `npm run grading:sheet`, then merge with `npm run grading:merge`.",
      method: {
        standard: "content/photo-selects.json criteria, verbatim, plus that curator's worked examples",
        graders: 2,
        adjudicator: "a third grader, on disagreements only",
        flagRule:
          "Flags are a UNION across graders. A flag is a claim that a frame may not be this " +
          "property, and the cost of publishing somebody else's hotel is far higher than the " +
          "cost of dropping one frame from a library of 640.",
      },
      stats: {
        ...stats,
        merged: frames.length,
        distribution: dist,
        flagged: flagged.length,
        flagKinds,
      },
      frames,
    },
    null,
    2
  ) + "\n"
);

console.log(`merged ${frames.length} graded frames -> content/photo-grades.json`);
console.log(`  A ${dist.A}   B ${dist.B}   C ${dist.C}`);
console.log(`  flagged ${flagged.length}`, flagKinds);
console.log(`  agreement ${stats.agreementPct ?? "?"}%  (${stats.disputed ?? "?"} adjudicated)`);
if (orphans.length) {
  console.error(`\n${orphans.length} graded ids could not be joined to a file on disk:`);
  for (const o of orphans.slice(0, 10)) console.error("  " + o);
  process.exitCode = 1;
}
