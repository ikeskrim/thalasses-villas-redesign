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
 * THE OWNER'S PHOTOGRAPHS COME THROUGH THE SAME DOOR. `--queue` builds the sheet
 * from `content/grading-queue.json` instead: every `pending-grade` photograph
 * `scripts/ingest-drive.mjs` stripped and staged in `content/owner-staging/`.
 * Owner material is Tier A by PROVENANCE — it is his property — and that says
 * nothing about whether a frame is any good, so it is judged by the same graders
 * against the same verbatim standard rather than waved through for who sent it.
 * Staging is gitignored: run this on the machine that did the ingest.
 *
 * THE IDS ARE THE ONES THE GRADING PASS WILL ASK FOR. The pass is the
 * grade-photo-library workflow, and it never reads index.json: given `sheet`,
 * `total` and `batchSize`, it names the frames itself, `g0001` … `g<total>`, and
 * has each grader open `<sheet>/g0001.jpg` and onward. So a queue sheet uses
 * exactly those names, numbered without gaps, and this prints the arguments to
 * give the pass. What tells `scripts/merge-grades.mjs` that the grades belong in
 * the queue and not in `content/photo-grades.json` is the index's
 * `mode: "queue"`, not the id.
 *
 * A QUEUE SHEET IS WRITTEN ONCE, INTO A NEW OR EMPTY FOLDER. The index is the
 * only join from `g0002` to a photograph, and the pending set changes with every
 * ingest and every merge: rebuilt in place, `g0002` would name a different
 * photograph from the one graded under that id, and merging the earlier grades
 * would publish a frame nobody looked at. For the same reason a library sheet
 * refuses to overwrite a queue sheet's index.
 *
 *   node scripts/grading-sheet.mjs <outDir>            the ungraded library
 *   node scripts/grading-sheet.mjs <outDir> --queue    the owner's staged photographs
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const QUEUE = process.argv.includes("--queue");
const OUT = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!OUT) {
  console.error("usage: node scripts/grading-sheet.mjs <outDir> [--queue]");
  process.exit(1);
}

const selects = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "photo-selects.json"), "utf-8"));

/* Each frame to grade: where its pixels are, and the index record it gets once it has an id. */
function librarySheet() {
  const metrics = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "photo-metrics.json"), "utf-8"));

  const IMAGES = path.join(ROOT, "public", "images");
  const onDisk = new Set();
  for (const store of fs.readdirSync(IMAGES)) {
    const dir = path.join(IMAGES, store);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) onDisk.add(`/images/${store}/${f}`);
  }

  const gradedAlready = new Set(selects.selects.map((s) => s.file));
  const publicPath = (m) => `/images/_${m.store}/${m.file}`;

  return (
    metrics
      .filter((m) => !gradedAlready.has(m.file) && onDisk.has(publicPath(m)))
      /* Stable order so batch N is the same batch on every run and on every resume. */
      .sort((a, b) => (a.store + a.file).localeCompare(b.store + b.file))
      .map((m) => ({
        label: publicPath(m),
        src: path.join(ROOT, "public", publicPath(m).replace(/^\//, "").split("/").join(path.sep)),
        record: (id) => ({ id, file: m.file, store: m.store, path: publicPath(m), sheet: `${id}.jpg`, w: m.w, h: m.h, aspect: m.aspect, score: m.score }),
      }))
  );
}

function queueSheet() {
  const file = path.join(ROOT, "content", "grading-queue.json");
  if (!fs.existsSync(file)) {
    console.error("No content/grading-queue.json — scripts/ingest-drive.mjs has not staged anything in this checkout.");
    process.exit(1);
  }
  const queue = JSON.parse(fs.readFileSync(file, "utf-8"));
  return (
    queue.queue
      .filter((q) => q.status === "pending-grade" && q.staged)
      /* Stable order, for the same reason as the library's. */
      .sort((a, b) => a.staged.localeCompare(b.staged))
      .map((q) => ({
        label: q.staged,
        src: path.join(ROOT, ...q.staged.split("/")),
        record: (id) => ({
          id,
          file: path.basename(q.staged),
          store: "owner-staging",
          path: q.staged,
          sheet: `${id}.jpg`,
          w: q.width,
          h: q.height,
          aspect: Math.round((q.width / q.height) * 100) / 100,
          staged: q.staged,
          stagedSha256: q.stagedSha256,
          publishAs: q.publishAs,
          provenance: q.provenance,
          tier: q.tier,
        }),
      }))
  );
}

const todo = QUEUE ? queueSheet() : librarySheet();
if (QUEUE && !todo.length) {
  console.log("content/grading-queue.json has no pending-grade photograph — nothing to grade.");
  process.exit(0);
}

if (QUEUE && fs.existsSync(OUT) && fs.readdirSync(OUT).length) {
  console.error(`${OUT} is not empty. A queue sheet is written once, into a new or empty folder: rebuilt over an earlier sheet, its ids would name different photographs from the ones graded under them.`);
  process.exit(1);
}
if (!QUEUE && fs.existsSync(path.join(OUT, "index.json"))) {
  let mode;
  try {
    mode = JSON.parse(fs.readFileSync(path.join(OUT, "index.json"), "utf-8")).mode;
  } catch {}
  if (mode === "queue") {
    console.error(`${OUT} holds a queue sheet. Its index is the only join from its grades to the owner's photographs; write the library sheet somewhere else.`);
    process.exit(1);
  }
}
fs.mkdirSync(OUT, { recursive: true });

const index = [];
let n = 0;
for (const t of todo) {
  n++;
  /* The grade-photo-library pass's own id(n). A skipped frame gives its number back, so the ids run 1…total without a gap. */
  const id = `g${String(n).padStart(4, "0")}`;
  const dest = path.join(OUT, `${id}.jpg`);
  try {
    await sharp(t.src)
      /* Big enough to see an air-conditioning unit or a cable, small enough
         that a grader can hold thirty of them at once. */
      .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 74 })
      .toFile(dest);
  } catch (e) {
    console.error(`  skip ${t.label} — ${String(e).slice(0, 60)}`);
    n--;
    continue;
  }
  index.push(t.record(id));
  if (n % 100 === 0) process.stdout.write(`\r  ${n}/${todo.length}   `);
}
process.stdout.write("\n");

/* A queue whose staged files are all missing is a sheet of nothing, and an empty
   index would let the grading pass "finish" having looked at no photograph
   (CONVENTIONS §18). The usual cause is running on a machine that did not ingest. */
if (QUEUE && !index.length) {
  console.error(`None of the ${todo.length} pending photographs could be read from content/owner-staging/. Staging is gitignored: grade on the machine that ran the ingest.`);
  process.exit(1);
}

fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(QUEUE ? { mode: "queue", frames: index } : { frames: index }, null, 2) + "\n");

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
/* `sheet` absolute, because graders open `<sheet>/g0001.jpg` from wherever they run.
   32 per batch is the library pass's own split: 640 frames in 20 batches. */
console.log(`grade-photo-library args: ${JSON.stringify({ sheet: path.resolve(OUT), total: index.length, batchSize: 32 })}`);
