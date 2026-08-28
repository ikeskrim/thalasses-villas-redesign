#!/usr/bin/env node
/**
 * PREPARE THE UNGRADED LIBRARY FOR A GRADING PASS.
 *
 * Phase 1 graded 72 of 871 frames. The other 799 were scored by an algorithm
 * and never looked at, and `qa/looks/RESERVOIR.md` showed what that costs: three
 * candidate directions could not open on three different photographs without
 * being told to, because the graded set holds exactly three daylight A-grades.
 *
 * **799 is the index count and the index is stale.** 159 of those records point
 * at files collapsed in the duplicate sweep. The gradeable set is 640.
 *
 * This writes every one of them to a uniform JPEG so that each grader sees the
 * same thing at the same scale — 107 are WebP and 7 are PNG in the library, and
 * a grading pass in which some frames arrive sharper than others is a grading
 * pass with a format bias baked into it.
 *
 * Output goes to the scratchpad, not the repository: it is derived, it is
 * 640 files, and `content/photo-metrics.json` plus `public/images/` already
 * hold everything needed to rebuild it.
 *
 *   node scripts/grading-sheet.mjs <outDir>
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const OUT = process.argv[2];
if (!OUT) {
  console.error("usage: node scripts/grading-sheet.mjs <outDir>");
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

const metrics = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "photo-metrics.json"), "utf-8"));
const selects = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "photo-selects.json"), "utf-8"));

const IMAGES = path.join(ROOT, "public", "images");
const onDisk = new Set();
for (const store of fs.readdirSync(IMAGES)) {
  const dir = path.join(IMAGES, store);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir)) onDisk.add(`/images/${store}/${f}`);
}

const gradedAlready = new Set(selects.selects.map((s) => s.file));
const publicPath = (m) => `/images/_${m.store}/${m.file}`;

const todo = metrics
  .filter((m) => !gradedAlready.has(m.file) && onDisk.has(publicPath(m)))
  /* Stable order so batch N is the same batch on every run and on every resume. */
  .sort((a, b) => (a.store + a.file).localeCompare(b.store + b.file));

const index = [];
let n = 0;
for (const m of todo) {
  n++;
  const id = `g${String(n).padStart(4, "0")}`;
  const src = path.join(ROOT, "public", publicPath(m).replace(/^\//, "").split("/").join(path.sep));
  const dest = path.join(OUT, `${id}.jpg`);
  try {
    await sharp(src)
      /* Big enough to see an air-conditioning unit or a cable, small enough
         that a grader can hold thirty of them at once. */
      .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 74 })
      .toFile(dest);
  } catch (e) {
    console.error(`  skip ${publicPath(m)} — ${String(e).slice(0, 60)}`);
    n--;
    continue;
  }
  index.push({
    id,
    file: m.file,
    store: m.store,
    path: publicPath(m),
    sheet: `${id}.jpg`,
    w: m.w,
    h: m.h,
    aspect: m.aspect,
    score: m.score,
  });
  if (n % 100 === 0) process.stdout.write(`\r  ${n}/${todo.length}   `);
}
process.stdout.write("\n");

fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ frames: index }, null, 2) + "\n");

/* ------------------------------------------------ the standard, in writing -- */
/*
 * The graders work from the criteria Phase 1 used, VERBATIM, plus worked
 * examples taken from what that curator actually decided. A second pass judged
 * against a reworded standard would not be a second pass over the same library;
 * it would be a different opinion, and the two could not be pooled.
 */
const worked = {
  A: selects.selects.filter((s) => s.grade === "A").slice(0, 6).map((s) => `${s.subject} — ${s.reason}`),
  B: selects.selects.filter((s) => s.grade === "B").slice(0, 6).map((s) => `${s.subject} — ${s.reason}`),
  C: selects.selects.filter((s) => s.grade === "C").slice(0, 8).map((s) => `${s.subject} — ${s.reason}`),
};
const flagExamples = selects.flags.map((f) => `${f.concern}: ${f.reason}`);

fs.writeFileSync(
  path.join(OUT, "STANDARD.md"),
  `# The grading standard — Phase 1, verbatim

## Grades

- **A** — ${selects.criteria.A}
- **B** — ${selects.criteria.B}
- **C** — ${selects.criteria.C}

## Flags (independent of grade)

A frame may be usable and still be excluded. Flag it and say which:

- \`stock\` — a generic stock photograph, not this property.
- \`public-place\` — a public beach, a town square, a landmark. Not the estate.
- \`different-property\` — architecture or landscape that is not Thalasses.
- \`unsure\` — you cannot tell whether it is this property.

Worked examples of flags raised in Phase 1:

${flagExamples.map((f) => `- ${f}`).join("\n")}

## The curator's worked examples

**Graded A**
${worked.A.map((x) => `- ${x}`).join("\n")}

**Graded B**
${worked.B.map((x) => `- ${x}`).join("\n")}

**Graded C**
${worked.C.map((x) => `- ${x}`).join("\n")}
`
);

console.log(`${index.length} frames -> ${OUT}`);
console.log(`  index.json, STANDARD.md written`);
