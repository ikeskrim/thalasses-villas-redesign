#!/usr/bin/env node
/**
 * WHERE DID THIS PICTURE COME FROM?
 *
 * The standing rule of this project is real property photography only. It exists
 * because the site being replaced used stock photographs of places that were not
 * this property, and the owner found out.
 *
 * That rule survived Phase 0 because inventing a photograph was hard. It is now
 * about two dollars and four minutes, which means the rule needs a mechanism
 * rather than an intention. `AI-IMAGERY-POLICY.md` is the intention; this is the
 * mechanism.
 *
 * IT WORKS ON HASHES, NOT ON HONESTY.
 *
 * A declaration-based policy holds until the first hurried afternoon. Every
 * shipped image is recorded here by SHA-256, so a frame that is quietly replaced
 * by an edited version fails the push even though the filename, the dimensions
 * and the folder are all unchanged. That is the case worth catching: nobody
 * forgets to mention a NEW photograph, and everybody forgets to mention that
 * they cleaned a cable out of an old one.
 *
 *   node scripts/verify-provenance.mjs           check
 *   node scripts/verify-provenance.mjs --adopt   record what is on disk now
 *
 * `--adopt` is deliberately a separate, explicit act. It is how the baseline was
 * taken and how a genuinely new photograph gets admitted, and it should show up
 * in a diff as a decision somebody made.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "public");
const LEDGER = path.join(ROOT, "content", "image-provenance.json");
const ADOPT = process.argv.includes("--adopt");

const MEDIA = /\.(jpe?g|png|webp|avif|gif|mp4|webm|mov)$/i;

/* ------------------------------------------------------------ what ships -- */
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (MEDIA.test(entry.name)) out.push(full);
  }
  return out;
}

const files = fs.existsSync(PUBLIC) ? walk(PUBLIC) : [];
const rel = (f) => "/" + path.relative(PUBLIC, f).split(path.sep).join("/");
const hash = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex").slice(0, 16);

const onDisk = new Map();
for (const f of files) onDisk.set(rel(f), hash(f));

/* --------------------------------------------------------------- adopt -- */
if (ADOPT) {
  const prior = fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, "utf-8")) : { images: {} };
  const images = {};
  let added = 0;
  let rehashed = 0;

  for (const [p, h] of [...onDisk].sort((a, b) => a[0].localeCompare(b[0]))) {
    const was = prior.images?.[p];
    if (!was) {
      added++;
      images[p] = {
        sha256: h,
        tier: "allowed",
        origin: "camera",
        note: "Phase 0 inventory — the owner's own site, the manager's listing, or the property photographer.",
      };
    } else {
      if (was.sha256 !== h) rehashed++;
      images[p] = { ...was, sha256: h };
    }
  }

  fs.writeFileSync(
    LEDGER,
    JSON.stringify(
      {
        _note:
          "Provenance of every media file in public/. Governed by AI-IMAGERY-POLICY.md and " +
          "checked by scripts/verify-provenance.mjs. Adopt new entries with --adopt, and " +
          "read the diff before committing it.",
        _tiers: {
          allowed: "Camera original, routine retouch, ambient motion on a real frame, or abstract non-depictive texture.",
          review: "Object removal or a reveal-changing move. Needs ownerSignoff and an archived original.",
        },
        images,
      },
      null,
      2
    ) + "\n"
  );
  console.log(`adopted ${onDisk.size} files (${added} new, ${rehashed} re-hashed) -> content/image-provenance.json`);
  process.exit(0);
}

/* --------------------------------------------------------------- check -- */
if (!fs.existsSync(LEDGER)) {
  console.error("No content/image-provenance.json. Take a baseline with --adopt.");
  process.exit(1);
}

const ledger = JSON.parse(fs.readFileSync(LEDGER, "utf-8"));
const known = ledger.images ?? {};
const problems = [];

/* Undeclared: shipped but never recorded. */
for (const [p, h] of onDisk) {
  const entry = known[p];
  if (!entry) {
    problems.push(`UNDECLARED  ${p}\n            ships but is not in the ledger — declare it, then --adopt`);
    continue;
  }
  if (entry.sha256 !== h) {
    problems.push(
      `CHANGED     ${p}\n            the bytes differ from the recorded original.\n` +
        `            If this is a crop or an exposure change, re-adopt. If anything was\n` +
        `            added or removed from the frame, it is a REVIEW-tier edit first.`
    );
  }
}

/* Vanished: recorded but no longer shipped. Not fatal — files get removed. */
const gone = Object.keys(known).filter((p) => !onDisk.has(p));

/* Policy conformance of the declarations themselves. */
for (const [p, e] of Object.entries(known)) {
  const aiTouched = typeof e.origin === "string" && e.origin.startsWith("ai-");

  if (e.tier === "never") {
    problems.push(`FORBIDDEN   ${p}\n            declares the NEVER tier — this must not ship at all`);
  }
  if (e.tier && e.tier !== "allowed" && e.tier !== "review" && e.tier !== "never") {
    problems.push(`BAD TIER    ${p}\n            "${e.tier}" is not a tier`);
  }
  if (aiTouched && !e.tool) {
    problems.push(`NO TOOL     ${p}\n            declares "${e.origin}" and names no tool — "AI" is not a provenance record`);
  }
  if (e.tier === "review") {
    if (!e.ownerSignoff) {
      problems.push(`NO SIGNOFF  ${p}\n            REVIEW tier with no ownerSignoff — that is what the tier means`);
    }
    if (!e.original) {
      problems.push(
        `NO ORIGINAL ${p}\n            REVIEW tier with no archived original — the original is the only\n` +
          `            thing that makes the edit checkable afterwards`
      );
    } else if (!fs.existsSync(path.join(ROOT, e.original.replace(/^\//, "")))) {
      problems.push(`LOST ORIGINAL ${p}\n            names ${e.original}, which is not there`);
    }
  }
}

/* ------------------------------------------------------------- report -- */
const aiCount = Object.values(known).filter((e) => String(e.origin ?? "").startsWith("ai-")).length;
const reviewCount = Object.values(known).filter((e) => e.tier === "review").length;

console.log(`${onDisk.size} media files shipped, ${Object.keys(known).length} declared`);
console.log(`  AI-touched: ${aiCount}   awaiting/holding owner sign-off: ${reviewCount}`);
if (gone.length) console.log(`  ${gone.length} ledger entries no longer on disk (not a failure)`);

if (problems.length) {
  console.error(`\n${problems.length} provenance problem${problems.length === 1 ? "" : "s"}:\n`);
  for (const p of problems) console.error("  " + p + "\n");
  console.error("See AI-IMAGERY-POLICY.md.");
  process.exit(1);
}

console.log("\nCLEAN — every shipped frame is accounted for.");
