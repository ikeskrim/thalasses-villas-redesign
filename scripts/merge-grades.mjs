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
 * THE OWNER'S QUEUE LANDS DIFFERENTLY. A sheet built with
 * `grading-sheet.mjs --queue` says `mode: "queue"` in its index, and each grade
 * is written back onto its `content/grading-queue.json` entry. A frame graded A
 * or B with no flag — the test `scripts/experience-imagery.mjs` puts a frame
 * through before it will use one — is then PUBLISHED: the staged file, its
 * metadata already stripped at ingest, is copied to `public/images/_owner/<date>/`
 * and declared in `content/image-provenance.json`. Nothing reaches public/ before
 * that moment, because public/ is what deploys. A C or a flagged frame stays in
 * staging, recorded `held`. `content/photo-grades.json` is not touched in this
 * mode: it is the record of the library pass, and rewriting it from a sheet of
 * owner photographs would erase that record.
 *
 * A GRADE LANDS ONCE. Only an entry still `pending-grade` takes one; an entry
 * already published or held is reported and left exactly as it is, so merging
 * the same output twice, or a different output against the same sheet, changes
 * nothing. Nothing here takes a published photograph back off the site: that is
 * a deliberate hand edit (remove the copy under public/images/_owner/ and its
 * declaration in content/image-provenance.json), not a side effect of a merge.
 *
 *   node scripts/merge-grades.mjs <workflow-output.json> <sheetDir>
 */
import crypto from "node:crypto";
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

const sheet = JSON.parse(fs.readFileSync(path.join(sheetDir, "index.json"), "utf-8"));
if (sheet.mode === "queue") {
  landQueue(sheet.frames);
  process.exit();
}
const index = sheet.frames;
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

/* ------------------------------------------------------ the owner's queue -- */

/**
 * Land a `--queue` sheet: every grade onto its queue entry, and every frame that
 * passes — A or B, no flag — published with its provenance declared.
 */
function landQueue(queueIndex) {
  const queueFile = path.join(ROOT, "content", "grading-queue.json");
  const ledgerFile = path.join(ROOT, "content", "image-provenance.json");
  const queue = JSON.parse(fs.readFileSync(queueFile, "utf-8"));
  const ledger = fs.existsSync(ledgerFile) ? JSON.parse(fs.readFileSync(ledgerFile, "utf-8")) : { images: {} };
  const bySheetId = new Map(queueIndex.map((f) => [f.id, f]));
  const today = new Date().toISOString().slice(0, 10);
  const sha256 = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");

  /* The queue is a committed file anyone can edit, and these two paths decide
     where a copy gets written. Only the shapes ingest-drive.mjs writes count. */
  const STAGED = /^content\/owner-staging\/\d{4}-\d{2}-\d{2}\/[0-9a-f]{12}-[\w-]+\.jpg$/;
  const PUBLISH_AS = /^\/images\/_owner\/\d{4}-\d{2}-\d{2}\/[0-9a-f]{12}-[\w-]+\.jpg$/;

  const missing = [];
  const already = [];
  const published = { A: 0, B: 0 };
  let held = 0;
  let ledgerChanged = false;
  for (const g of graded) {
    const src = bySheetId.get(g.id);
    const q = src && queue.queue.find((e) => e.staged === src.staged);
    if (!q) {
      missing.push(src ? `${g.id} (${src.staged} is no longer in the queue)` : g.id);
      continue;
    }
    if (q.status !== "pending-grade") {
      already.push(`${g.id} (${q.staged} is already ${q.status})`);
      continue;
    }
    if (!STAGED.test(q.staged) || !PUBLISH_AS.test(q.publishAs ?? "")) {
      missing.push(`${g.id} (the queue entry for ${q.staged} carries a path ingest-drive.mjs would not have written)`);
      continue;
    }
    const stagedFile = path.join(ROOT, ...q.staged.split("/"));
    if (!fs.existsSync(stagedFile)) {
      missing.push(`${g.id} (${q.staged} not on disk)`);
      continue;
    }
    /* Two hashes, and what each proves — no more. The sheet copied the queue
       entry's stagedSha256 when it was built (it does not hash the file itself),
       so a queue entry re-staged since then is not joined to grades given for the
       earlier sheet. The queue recorded it at
       ingest, so the bytes copied to public/ are the bytes ingest staged, unaltered.
       Neither proves a grader looked at this photograph: that rests on the sheet
       folder having been written once (grading-sheet.mjs refuses to rebuild a
       queue sheet in place) and on this being the output of that sheet's pass. */
    if (src.stagedSha256 !== q.stagedSha256) {
      missing.push(`${g.id} (${q.staged} was staged again after this sheet was built — build a new sheet)`);
      continue;
    }
    const digest = sha256(stagedFile);
    if (q.stagedSha256 && digest !== q.stagedSha256) {
      missing.push(`${g.id} (${q.staged} is not the file that was staged — its bytes have changed)`);
      continue;
    }

    Object.assign(q, {
      grade: g.grade,
      subject: g.subject,
      reason: g.reason,
      flag: g.flag ?? null,
      flagReason: g.flagReason ?? null,
      graders: g.graders,
      agreed: !!g.agreed,
      adjudicated: !!g.adjudicated,
      ...(g.unresolved ? { unresolved: true } : {}),
      graded: today,
    });

    if ((g.grade === "A" || g.grade === "B") && !g.flag) {
      const dest = path.join(ROOT, "public", ...q.publishAs.slice(1).split("/"));
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(stagedFile, dest);
      ledger.images[q.publishAs] = {
        sha256: digest.slice(0, 16),
        tier: "allowed",
        origin: "camera",
        note: `${q.provenance} — owner-supplied property material, Tier A by provenance; graded ${g.grade} in the standard pass`,
      };
      ledgerChanged = true;
      q.status = "published";
      q.published = q.publishAs;
      delete q.heldBecause;
      published[g.grade]++;
    } else {
      q.status = "held";
      q.heldBecause = g.flag ? `flagged ${g.flag}` : `graded ${g.grade}`;
      held++;
    }
  }

  fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2) + "\n");
  if (ledgerChanged) fs.writeFileSync(ledgerFile, JSON.stringify(ledger, null, 2) + "\n");

  const pending = queue.queue.filter((q) => q.status === "pending-grade").length;
  console.log(`merged ${published.A + published.B + held} graded owner photographs -> content/grading-queue.json`);
  console.log(`  published ${published.A + published.B} (A ${published.A}   B ${published.B}) -> public/images/_owner/, declared in content/image-provenance.json`);
  console.log(`  held in staging ${held} (graded C, or flagged)`);
  if (pending) console.log(`  still pending-grade ${pending}`);
  if (already.length) {
    console.log(`  already graded, left as they are ${already.length}:`);
    for (const o of already.slice(0, 10)) console.log("    " + o);
  }
  if (published.A + published.B) console.log("next: `npm run verify:provenance` before committing");
  if (missing.length) {
    console.error(`\n${missing.length} graded ids could not be joined to a staged file:`);
    for (const o of missing.slice(0, 10)) console.error("  " + o);
    process.exitCode = 1;
  }
}
