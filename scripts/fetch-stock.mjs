#!/usr/bin/env node
/**
 * FETCH THE SOURCED STOCK, AND WRITE ITS LOG.
 *
 * Tier B-Experiences (content/image-sources.md) permits properly licensed stock
 * on experience cards, one log line per frame. The sourcing itself is a
 * judgement — an agent searched, a second agent tried to refute it, and the
 * owner reviews the result on the live page. This script is the part that is
 * not a judgement: given the accepted candidates, it fetches the original,
 * sizes it for the web, files it under `public/images/_stock/`, and writes the
 * log entry that the ratchet in tests/flagged.spec.ts will hold the site to.
 *
 * NOTHING IS GRADED, TONED OR FILTERED. Condition 7 of the rule: stock stays
 * visually honest, with no shared treatment that blurs it into the property's
 * own photography. The only transform here is a resize to 1800px on the long
 * edge and JPEG at quality 82 — the same delivery the property's own frames get
 * through next/image. Orientation and colour are the photographer's.
 *
 *   node scripts/fetch-stock.mjs <accepted.json>
 *
 * `accepted.json` is an array of
 *   { slug, source: "pexels"|"unsplash", id, pageUrl, downloadUrl, photographer,
 *     licence, location, alt, verifier }
 * and the result is merged into content/experience-stock.json, which
 * scripts/experience-imagery.mjs reads. Re-running with the same input is
 * idempotent: an existing file is kept and its log entry refreshed.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const STOCK_DIR = path.join(ROOT, "public", "images", "_stock");
const LOG = path.join(ROOT, "content", "experience-stock.json");
const TODAY = new Date().toISOString().slice(0, 10);

const input = process.argv[2];
if (!input) {
  console.error("usage: node scripts/fetch-stock.mjs <accepted.json>");
  process.exit(2);
}
const accepted = JSON.parse(fs.readFileSync(input, "utf-8"));
if (!Array.isArray(accepted) || !accepted.length) {
  console.error("accepted.json is empty — nothing to fetch");
  process.exit(2);
}

/* Only the two named sources. A URL from anywhere else is refused, not fetched. */
const ALLOWED_HOSTS = new Set(["images.pexels.com", "unsplash.com", "images.unsplash.com"]);

fs.mkdirSync(STOCK_DIR, { recursive: true });
const log = fs.existsSync(LOG)
  ? JSON.parse(fs.readFileSync(LOG, "utf-8"))
  : { _note: "", _rule: "content/image-sources.md — Tier B-Experiences", frames: {} };

const UA = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36",
  accept: "image/*,*/*",
};

let fetched = 0;
let kept = 0;
const failures = [];

for (const c of accepted) {
  const required = ["slug", "source", "id", "pageUrl", "downloadUrl", "photographer", "licence", "alt"];
  const missing = required.filter((k) => !c[k]);
  if (missing.length) {
    failures.push(`${c.slug ?? "?"}: missing ${missing.join(", ")}`);
    continue;
  }
  const host = new URL(c.downloadUrl).hostname;
  if (!ALLOWED_HOSTS.has(host)) {
    failures.push(`${c.slug}: download host ${host} is not a permitted source`);
    continue;
  }

  const safeId = String(c.id).replace(/[^A-Za-z0-9_-]/g, "");
  const file = `${c.slug}--${c.source}-${safeId}.jpg`;
  const target = path.join(STOCK_DIR, file);

  let width = 0;
  let height = 0;
  let bytes = 0;

  if (fs.existsSync(target)) {
    const meta = await sharp(target).metadata();
    width = meta.width ?? 0;
    height = meta.height ?? 0;
    bytes = fs.statSync(target).size;
    kept++;
  } else {
    let res;
    try {
      res = await fetch(c.downloadUrl, { headers: UA, redirect: "follow" });
    } catch (e) {
      failures.push(`${c.slug}: fetch failed — ${e.message}`);
      continue;
    }
    if (!res.ok || !/^image\//.test(res.headers.get("content-type") ?? "")) {
      failures.push(`${c.slug}: ${res.status} ${res.headers.get("content-type")} from ${c.downloadUrl}`);
      continue;
    }
    const original = Buffer.from(await res.arrayBuffer());
    const meta = await sharp(original).metadata();
    if (!meta.width || !meta.height || meta.width < 1200) {
      failures.push(`${c.slug}: original is ${meta.width}x${meta.height} — too small to serve a 4:3 card honestly`);
      continue;
    }
    /* Resize only. No colour operation of any kind — see the header. */
    const out = await sharp(original)
      .rotate() /* honour EXIF orientation, then strip it with the metadata */
      .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    fs.writeFileSync(target, out);
    const m2 = await sharp(out).metadata();
    width = m2.width ?? 0;
    height = m2.height ?? 0;
    bytes = out.length;
    fetched++;
  }

  log.frames[c.slug] = {
    file: `/images/_stock/${file}`,
    width,
    height,
    bytes,
    source: c.source === "pexels" ? "Pexels" : "Unsplash",
    sourceUrl: c.pageUrl,
    sourceId: String(c.id),
    photographer: c.photographer,
    licence: c.licence,
    location: c.location ?? "not stated",
    alt: c.alt,
    retrieved: TODAY,
    verifier: c.verifier ?? "",
  };
}

log._note =
  "Tier B-Experiences stock, sourced under the rule in content/image-sources.md. " +
  "HAND-MAINTAINED: scripts/experience-imagery.mjs reads this and merges it into the " +
  "generated experience-imagery.json, so regenerating never loses a sourced frame. " +
  "One entry per experience slug; the file must exist under public/images/_stock/. " +
  "Free-licence sources only, nothing purchased, nothing generated. Resized for the web, " +
  "never graded or toned (condition 7). Written by scripts/fetch-stock.mjs.";

fs.writeFileSync(LOG, JSON.stringify(log, null, 2) + "\n");

console.log(`${fetched} fetched, ${kept} already on disk, ${Object.keys(log.frames).length} logged in content/experience-stock.json`);
if (failures.length) {
  console.log(`\n${failures.length} NOT fetched:`);
  for (const f of failures) console.log("   " + f);
  process.exitCode = 1;
}
