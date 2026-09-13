#!/usr/bin/env node
/**
 * THE OWNER'S MATERIAL, FROM GOOGLE DRIVE INTO THE LIBRARY.
 *
 * The owner makes a folder, shares it "anyone with the link", and pastes the
 * link. This takes it from there: downloads everything, admits photographs and
 * video ONLY, refuses anything already in the library, and routes what is left —
 * photographs into the library as Tier A owner material queued for the grading
 * pass, video into `content/media/` with hero-loop variants.
 *
 *   node scripts/ingest-drive.mjs "<Drive share link>"            ingest
 *   node scripts/ingest-drive.mjs "<Drive share link>" --dry-run  look, change nothing
 *
 * WHAT IT WILL NOT DO, each one a rule rather than a preference:
 *
 *   It takes a link ONLY as its argument. It never follows a link it finds inside
 *   a folder listing or a downloaded file — a listing yields Drive item IDs and
 *   nothing else, and an entry that is not a Drive item is skipped and logged.
 *   The link comes from the owner, via the person running this, and from nowhere
 *   else (SESSION-REPORT tranche twelve).
 *
 *   It trusts no filename. Type is decided by the file's first bytes. A PDF named
 *   `sunset.jpg` is a PDF, and it is refused.
 *
 *   It never writes a Drive ID into the repository. This repository is public,
 *   and an "anyone with the link" ID is a key to the owner's folder: committed,
 *   it would publish his whole shared folder to anyone who reads the history. IDs
 *   are recorded only as a short one-way hash, enough to recognise a re-run.
 *
 *   It strips metadata from every published photograph, GPS included. Phone
 *   photographs carry the exact coordinates they were taken at; a web master
 *   carries none.
 *
 *   It never generates, retouches or grades. A photograph is published as the
 *   owner took it (rotated upright, resized for the web) and queued for the same
 *   independent grading pass every other frame went through.
 *
 * Environment, for tests only: INGEST_DRIVE_BASE, INGEST_DOWNLOAD_BASE (the two
 * Google hosts), INGEST_OUT_ROOT (where outputs go), INGEST_DATE, FFMPEG_PATH.
 */
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const OUT = process.env.INGEST_OUT_ROOT ? path.resolve(process.env.INGEST_OUT_ROOT) : ROOT;
const DRIVE = (process.env.INGEST_DRIVE_BASE ?? "https://drive.google.com").replace(/\/$/, "");
const USERCONTENT = (process.env.INGEST_DOWNLOAD_BASE ?? "https://drive.usercontent.google.com").replace(/\/$/, "");
const DATE = process.env.INGEST_DATE ?? new Date().toISOString().slice(0, 10);
const PROVENANCE = `owner/drive/${DATE}`;

const MAX_BYTES = Number(process.env.INGEST_MAX_BYTES ?? 2 * 1024 ** 3); /* 2 GB: a video master, not a movie */
const MAX_DEPTH = 3;
const MAX_ITEMS = 500;
const WEB_EDGE = 3000; /* long edge of a published photograph; the library's own masters run to 3300 */
const HERO_LOOP = { seconds: 8, maxBytes: 2.5 * 1024 * 1024, width: 1920 };

/* Hosts a request may ever be made to. Redirects are followed only within them. */
const ALLOWED_HOSTS = new Set([
  new URL(DRIVE).host,
  new URL(USERCONTENT).host,
  "drive.google.com",
  "docs.google.com",
  "drive.usercontent.google.com",
]);

const UA = { "user-agent": "thalasses-ingest-drive/1.0" };
const shortHash = (s) => crypto.createHash("sha256").update(String(s)).digest("hex").slice(0, 12);
const slug = (s) =>
  String(s)
    .normalize("NFKD")
    .replace(/\.[A-Za-z0-9]{1,5}$/, "")
    .replace(/[^\w-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 48) || "file";
const decodeEntities = (s) =>
  String(s)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

/* --------------------------------------------------------------- links -- */

const ID = /^[A-Za-z0-9_-]{10,200}$/;

/** A Drive share link, or null. Strict: https, Google's own hosts, known shapes. */
export function parseDriveLink(raw) {
  let u;
  try {
    u = new URL(String(raw).trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  if (u.hostname !== "drive.google.com" && u.hostname !== "docs.google.com") return null;
  if (u.username || u.password || u.port) return null;
  let m = u.pathname.match(/^\/drive(?:\/u\/\d+)?\/folders\/([^/]+)\/?$/);
  if (m && ID.test(m[1])) return { kind: "folder", id: m[1] };
  m = u.pathname.match(/^\/file\/d\/([^/]+)(?:\/(?:view|edit|preview))?\/?$/);
  if (m && ID.test(m[1])) return { kind: "file", id: m[1] };
  if ((u.pathname === "/open" || u.pathname === "/uc") && ID.test(u.searchParams.get("id") ?? "")) {
    return { kind: "either", id: u.searchParams.get("id") };
  }
  return null;
}

/* ------------------------------------------------------------- sniffing -- */

const IMAGE_BRANDS_HEIC = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"]);
const VIDEO_BRANDS_MP4 = new Set(["isom", "iso2", "iso4", "iso5", "iso6", "mp41", "mp42", "avc1", "dash", "M4V ", "M4VP", "f4v ", "3gp4", "3gp5", "3gp6", "3g2a", "MSNV", "NDAS"]);

/** What a file IS, from its first bytes. `null` means neither a photograph nor a video. */
export function sniff(buf) {
  const b = Buffer.from(buf);
  const ascii = (s, e) => b.subarray(s, e).toString("latin1");
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { kind: "image", type: "jpeg" };
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { kind: "image", type: "png" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { kind: "image", type: "webp" };
  if (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a") return { kind: "image", type: "gif" };
  if ((b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a && b[3] === 0) || (b[0] === 0x4d && b[1] === 0x4d && b[2] === 0 && b[3] === 0x2a)) {
    return { kind: "image", type: "tiff" };
  }
  if (ascii(4, 8) === "ftyp") {
    const size = Math.min(b.readUInt32BE(0), b.length);
    const brands = [ascii(8, 12)];
    for (let o = 16; o + 4 <= size; o += 4) brands.push(ascii(o, o + 4));
    if (brands.some((x) => x === "avif" || x === "avis")) return { kind: "image", type: "avif" };
    if (brands.some((x) => IMAGE_BRANDS_HEIC.has(x))) return { kind: "image", type: "heic" };
    if (brands[0] === "qt  ") return { kind: "video", type: "mov" };
    if (brands.some((x) => VIDEO_BRANDS_MP4.has(x))) return { kind: "video", type: "mp4" };
  }
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) {
    return { kind: "video", type: ascii(0, 64).includes("webm") ? "webm" : "mkv" };
  }
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "AVI ") return { kind: "video", type: "avi" };
  return null;
}

/** For the rejection log only: a name for what a refused file most likely is. */
function describeRefused(b) {
  const a = Buffer.from(b).subarray(0, 16).toString("latin1");
  if (a.startsWith("%PDF")) return "pdf";
  if (a.startsWith("PK")) return "zip or office document";
  if (/^\s*<(!doctype|html)/i.test(a)) return "html";
  if (/^[\x09\x0a\x0d\x20-\x7e]*$/.test(a)) return "text";
  return "unrecognised binary";
}

/* ------------------------------------------------------------- network -- */

async function request(url, attempt = 0) {
  let current = new URL(url);
  for (let hop = 0; hop < 6; hop++) {
    if (!ALLOWED_HOSTS.has(current.host)) throw new Error(`refusing to contact ${current.host}`);
    const res = await fetch(current, { headers: UA, redirect: "manual" });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      current = new URL(res.headers.get("location"), current);
      continue;
    }
    if ((res.status === 429 || res.status >= 500) && attempt < 2) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      return request(url, attempt + 1);
    }
    return { res, url: current };
  }
  throw new Error("too many redirects");
}

/** A folder's entries, from Drive's public embedded listing. IDs and names only. */
async function listFolder(id) {
  const { res } = await request(`${DRIVE}/embeddedfolderview?id=${encodeURIComponent(id)}`);
  const body = await res.text();
  if (res.status !== 200 || !body.includes("flip-entries")) {
    throw new Error(`the folder could not be listed (${res.status}) — is it shared "anyone with the link"?`);
  }
  const out = [];
  const re = /<div class="flip-entry" id="entry-([A-Za-z0-9_-]+)"[\s\S]*?<a href="([^"]*)"[\s\S]*?<div class="flip-entry-title">([^<]*)<\/div>/g;
  for (const m of body.matchAll(re)) {
    const [, entryId, hrefRaw, title] = m;
    const href = decodeEntities(hrefRaw);
    const name = decodeEntities(title).trim();
    if (!ID.test(entryId)) continue;
    /* The listing is DATA. An entry counts only if its link is one of Google's
       own Drive shapes naming that same entry; even then the request is built
       from the entry ID against the fixed Drive host — never from the URL. */
    let hrefUrl = null;
    try {
      hrefUrl = new URL(href);
    } catch {}
    const onDrive = hrefUrl?.protocol === "https:" && (hrefUrl.hostname === "drive.google.com" || hrefUrl.hostname === "docs.google.com");
    if (onDrive && hrefUrl.pathname.match(/^\/drive(?:\/u\/\d+)?\/folders\/([^/]+)/)?.[1] === entryId) out.push({ kind: "folder", id: entryId, name });
    else if (onDrive && hrefUrl.pathname.match(/^\/file\/d\/([^/]+)/)?.[1] === entryId) out.push({ kind: "file", id: entryId, name });
    else out.push({ kind: "skipped", id: entryId, name, reason: "not a Drive file or folder" });
  }
  return out;
}

/** Download one file to `dest`, through Drive's large-file confirmation page if one appears. */
async function download(id, dest) {
  let url = `${USERCONTENT}/download?id=${encodeURIComponent(id)}&export=download`;
  for (let step = 0; step < 3; step++) {
    const { res, url: at } = await request(url);
    if (!res.ok) throw new Error(`download failed (${res.status})`);
    const type = res.headers.get("content-type") ?? "";
    if (/text\/html/i.test(type)) {
      const html = await res.text();
      const form =
        /<form[^>]*id="download-form"[^>]*action="([^"]+)"[^>]*>([\s\S]*?)<\/form>/i.exec(html) ??
        /<form[^>]*action="([^"]+)"[^>]*>([\s\S]*?)<\/form>/i.exec(html);
      if (!form) throw new Error("Drive returned a page instead of the file — not shared publicly, or its download quota is exhausted");
      const action = new URL(decodeEntities(form[1]), at);
      for (const inp of form[2].matchAll(/<input[^>]*>/gi)) {
        const name = /name="([^"]+)"/.exec(inp[0])?.[1];
        const value = /value="([^"]*)"/.exec(inp[0])?.[1] ?? "";
        if (name) action.searchParams.set(name, decodeEntities(value));
      }
      url = action.href;
      continue;
    }
    const disposition = res.headers.get("content-disposition") ?? "";
    const filename =
      decodeURIComponent(/filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1] ?? "") ||
      /filename="([^"]+)"/i.exec(disposition)?.[1] ||
      null;
    const hash = crypto.createHash("sha256");
    const out = fs.createWriteStream(dest);
    let bytes = 0;
    try {
      for await (const chunk of res.body) {
        bytes += chunk.length;
        if (bytes > MAX_BYTES) throw new Error(`larger than the ${Math.round(MAX_BYTES / 1024 ** 3)} GB limit`);
        hash.update(chunk);
        if (!out.write(chunk)) await once(out, "drain");
      }
      out.end();
      await once(out, "finish");
    } catch (e) {
      out.destroy();
      fs.rmSync(dest, { force: true });
      throw e;
    }
    return { bytes, sha256: hash.digest("hex"), filename };
  }
  throw new Error("Drive kept returning a confirmation page");
}

/* ------------------------------------------------------------- library -- */

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, out);
    else out.push(f);
  }
  return out;
}

/** sha256 → library path, for everything already on disk. Cached by size and mtime. */
function libraryHashes() {
  const cacheFile = path.join(ROOT, "node_modules", ".cache", "ingest-drive", "hashes.json");
  const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, "utf-8")) : {};
  const next = {};
  const byHash = new Map();
  const roots = [
    [path.join(ROOT, "public"), (f) => "/" + path.relative(path.join(ROOT, "public"), f).split(path.sep).join("/")],
    [path.join(ROOT, "content", "media"), (f) => "content/media/" + path.relative(path.join(ROOT, "content", "media"), f).split(path.sep).join("/")],
  ];
  if (OUT !== ROOT) {
    roots.push([path.join(OUT, "public"), (f) => "/" + path.relative(path.join(OUT, "public"), f).split(path.sep).join("/")]);
    roots.push([path.join(OUT, "content", "media"), (f) => "content/media/" + path.relative(path.join(OUT, "content", "media"), f).split(path.sep).join("/")]);
  }
  for (const [dir, label] of roots) {
    for (const f of walk(dir)) {
      if (!/\.(jpe?g|png|webp|avif|gif|tiff?|heic|mp4|mov|webm|mkv|avi)$/i.test(f)) continue;
      const st = fs.statSync(f);
      const key = `${f}|${st.size}|${st.mtimeMs}`;
      const h = cache[key] ?? crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
      next[key] = h;
      if (!byHash.has(h)) byHash.set(h, label(f));
    }
  }
  fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(next));
  return byHash;
}

const readJson = (f, fallback) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf-8")) : fallback);
const writeJson = (f, v) => {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(v, null, 2) + "\n");
};
/* Ledgers are read from the output root if present, else from the repository. */
const ledgerPath = (rel) => path.join(OUT, rel);
const readLedger = (rel, fallback) => readJson(fs.existsSync(ledgerPath(rel)) ? ledgerPath(rel) : path.join(ROOT, rel), fallback);

/* ---------------------------------------------------------------- video -- */

function ffmpegBinary() {
  const candidate = process.env.FFMPEG_PATH || "ffmpeg";
  const r = spawnSync(candidate, ["-version"], { encoding: "utf-8" });
  return r.status === 0 ? candidate : null;
}

/** Poster first, then the loop variants, each held under the hero-loop budget. */
function heroVariants(ffmpeg, input, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const run = (args) => spawnSync(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", ...args], { encoding: "utf-8" });
  const outputs = [];
  const poster = path.join(dir, "poster.jpg");
  let r = run(["-ss", "0.5", "-i", input, "-frames:v", "1", "-vf", `scale=${HERO_LOOP.width}:-2`, "-q:v", "3", poster]);
  if (r.status !== 0) return { ok: false, error: `poster: ${r.stderr.trim().slice(0, 300)}` };
  outputs.push(poster);
  /* Target bitrate from the byte budget, with 8% headroom for the container. */
  const kbps = Math.floor((HERO_LOOP.maxBytes * 8 * 0.92) / HERO_LOOP.seconds / 1000);
  const specs = [
    ["loop-1080.mp4", ["-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-preset", "slow"]],
    ["loop-1080.webm", ["-c:v", "libvpx-vp9", "-row-mt", "1", "-deadline", "good"]],
  ];
  for (const [name, codec] of specs) {
    const target = path.join(dir, name);
    r = run(["-i", input, "-t", String(HERO_LOOP.seconds), "-an", "-vf", `scale=${HERO_LOOP.width}:-2`, ...codec, "-b:v", `${kbps}k`, "-maxrate", `${kbps}k`, "-bufsize", `${kbps * 2}k`, target]);
    if (r.status !== 0) return { ok: false, error: `${name}: ${r.stderr.trim().slice(0, 300)}` };
    const size = fs.statSync(target).size;
    if (size > HERO_LOOP.maxBytes) return { ok: false, error: `${name} came out at ${size} bytes, over the ${HERO_LOOP.maxBytes}-byte budget` };
    outputs.push(target);
  }
  return { ok: true, outputs };
}

/* ----------------------------------------------------------------- main -- */

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes("--dry-run");
  const link = args.find((a) => !a.startsWith("--"));
  const parsed = link ? parseDriveLink(link) : null;
  if (!parsed) {
    console.error(
      'usage: node scripts/ingest-drive.mjs "https://drive.google.com/drive/folders/<id>" [--dry-run]\n' +
        "The link must be a Google Drive folder or file shared \"anyone with the link\"."
    );
    process.exit(2);
  }

  const runId = shortHash(`${parsed.id}|${DATE}`);
  const inbox = path.join(OUT, "content", "inbox", DATE);
  fs.mkdirSync(inbox, { recursive: true });
  console.log(`ingest ${parsed.kind} ${shortHash(parsed.id)} → ${path.relative(ROOT, inbox) || inbox}${dry ? "  (dry run)" : ""}`);

  /* 1. What is there. */
  const items = [];
  const visit = async (id, depth, trail) => {
    for (const e of await listFolder(id)) {
      if (items.length >= MAX_ITEMS) return;
      if (e.kind === "folder") {
        if (depth < MAX_DEPTH) await visit(e.id, depth + 1, [...trail, e.name]);
        else items.push({ ...e, kind: "skipped", reason: `deeper than ${MAX_DEPTH} folders` });
      } else items.push({ ...e, trail });
    }
  };
  if (parsed.kind === "folder") await visit(parsed.id, 0, []);
  else if (parsed.kind === "file") items.push({ kind: "file", id: parsed.id, name: null, trail: [] });
  else {
    try {
      await visit(parsed.id, 0, []);
    } catch {
      items.push({ kind: "file", id: parsed.id, name: null, trail: [] });
    }
  }

  const library = libraryHashes();
  const intake = readLedger("content/owner-intake.json", {
    _note:
      "Every item the owner has sent through scripts/ingest-drive.mjs. Drive IDs are never stored — only a short one-way hash, because an 'anyone with the link' ID is a key to the owner's folder and this repository is public.",
    runs: [],
  });
  const seenInIntake = new Map();
  for (const run of intake.runs) for (const f of run.files) if (f.sha256) seenInIntake.set(f.sha256, f.published ?? f.stored ?? "an earlier intake");

  const provenance = readLedger("content/image-provenance.json", { images: {} });
  const queue = readLedger("content/grading-queue.json", {
    _note:
      "Owner-supplied photographs waiting for the standard grading pass (two independent graders against the Phase 1 standard, a third adjudicating). Tier A by provenance: the owner's own property material. A grade is NOT implied by being here.",
    queue: [],
  });
  const media = readLedger("content/media/manifest.json", {
    _note: "Owner-supplied video. Originals stay local (gitignored); poster-first hero-loop variants are generated beside this file when ffmpeg is available.",
    videos: [],
  });
  const ffmpeg = ffmpegBinary();

  const record = { run: runId, date: DATE, provenance: PROVENANCE, link: { kind: parsed.kind, idHash: shortHash(parsed.id) }, files: [] };
  const batch = new Map();
  let sharpLib = null;

  for (const it of items) {
    const base = { name: it.name, idHash: shortHash(it.id), folder: it.trail?.join("/") || undefined };
    if (it.kind === "skipped") {
      record.files.push({ ...base, status: "skipped", reason: it.reason });
      continue;
    }
    const tmp = path.join(inbox, `${shortHash(it.id)}.part`);
    let got;
    try {
      got = await download(it.id, tmp);
    } catch (e) {
      record.files.push({ ...base, status: "failed", reason: e.message });
      continue;
    }
    const name = it.name ?? got.filename ?? base.idHash;
    const head = Buffer.alloc(4096);
    const fd = fs.openSync(tmp, "r");
    const n = fs.readSync(fd, head, 0, 4096, 0);
    fs.closeSync(fd);
    const kind = sniff(head.subarray(0, n));
    const entry = { ...base, name, bytes: got.bytes, sha256: got.sha256 };

    if (!kind) {
      fs.rmSync(tmp, { force: true });
      record.files.push({ ...entry, status: "rejected", reason: `not a photograph or a video — it is ${describeRefused(head.subarray(0, n))}, whatever its name says` });
      continue;
    }
    entry.type = kind.type;
    const dupe = library.get(got.sha256) ?? seenInIntake.get(got.sha256) ?? batch.get(got.sha256);
    if (dupe) {
      fs.rmSync(tmp, { force: true });
      record.files.push({ ...entry, status: "duplicate", of: dupe });
      continue;
    }
    const stored = path.join(inbox, `${got.sha256.slice(0, 12)}-${slug(name)}.${kind.type === "jpeg" ? "jpg" : kind.type}`);
    fs.renameSync(tmp, stored);
    batch.set(got.sha256, path.relative(OUT, stored).split(path.sep).join("/"));

    if (dry) {
      record.files.push({ ...entry, status: "would-ingest", kind: kind.kind });
      continue;
    }

    if (kind.kind === "image") {
      sharpLib ??= (await import("sharp")).default;
      const destRel = `/images/_owner/${DATE}/${got.sha256.slice(0, 12)}-${slug(name)}.jpg`;
      const dest = path.join(OUT, "public", destRel.slice(1));
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      try {
        /* Rotated upright, resized for the web, metadata dropped (GPS included).
           No colour, grade or retouch of any kind. */
        const info = await sharpLib(stored, { failOn: "none" })
          .rotate()
          .resize({ width: WEB_EDGE, height: WEB_EDGE, fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 86, mozjpeg: true })
          .toFile(dest);
        const webSha = crypto.createHash("sha256").update(fs.readFileSync(dest)).digest("hex");
        provenance.images[destRel] = {
          sha256: webSha.slice(0, 16),
          tier: "allowed",
          origin: "camera",
          note: `${PROVENANCE} — owner-supplied property material, Tier A by provenance; grade pending`,
        };
        if (!queue.queue.some((q) => q.path === destRel)) {
          queue.queue.push({ path: destRel, originalSha256: got.sha256, provenance: PROVENANCE, tier: "A", width: info.width, height: info.height, status: "pending-grade", added: DATE });
        }
        record.files.push({ ...entry, status: "ingested", kind: "image", published: destRel, width: info.width, height: info.height });
      } catch (e) {
        fs.rmSync(dest, { force: true });
        record.files.push({
          ...entry,
          status: "needs-conversion",
          kind: "image",
          stored: path.relative(OUT, stored).split(path.sep).join("/"),
          reason: kind.type === "heic" ? "HEIC this build of sharp cannot decode — export it as JPEG, or convert it locally" : e.message,
        });
      }
      continue;
    }

    /* Video: the original stays local; variants beside the manifest. */
    const originalRel = `content/media/originals/${DATE}/${path.basename(stored)}`;
    const original = path.join(OUT, originalRel);
    fs.mkdirSync(path.dirname(original), { recursive: true });
    fs.renameSync(stored, original);
    const clipSlug = `${DATE}-${got.sha256.slice(0, 8)}-${slug(name)}`;
    const dir = path.join(OUT, "content", "media", clipSlug);
    const v = { slug: clipSlug, original: originalRel, originalSha256: got.sha256, provenance: PROVENANCE, type: kind.type, spec: HERO_LOOP, added: DATE };
    if (!ffmpeg) {
      v.status = "needs-transcode";
      v.reason = "ffmpeg is not installed on this machine";
      v.commands = [
        `ffmpeg -ss 0.5 -i "${originalRel}" -frames:v 1 -vf scale=1920:-2 -q:v 3 "content/media/${clipSlug}/poster.jpg"`,
        `ffmpeg -i "${originalRel}" -t 8 -an -vf scale=1920:-2 -c:v libx264 -profile:v high -pix_fmt yuv420p -movflags +faststart -b:v 2300k -maxrate 2300k -bufsize 4600k "content/media/${clipSlug}/loop-1080.mp4"`,
        `ffmpeg -i "${originalRel}" -t 8 -an -vf scale=1920:-2 -c:v libvpx-vp9 -b:v 2300k -maxrate 2300k -bufsize 4600k "content/media/${clipSlug}/loop-1080.webm"`,
      ];
    } else {
      const r = heroVariants(ffmpeg, original, dir);
      if (r.ok) {
        v.status = "variants-ready";
        v.note = "DRAFT CUT: the first 8 seconds. Choosing the in and out points is an editorial call — re-cut before it becomes the hero.";
        v.variants = r.outputs.map((f) => ({ file: `content/media/${clipSlug}/${path.basename(f)}`, bytes: fs.statSync(f).size }));
      } else {
        v.status = "transcode-failed";
        v.reason = r.error;
      }
    }
    media.videos = media.videos.filter((x) => x.originalSha256 !== got.sha256);
    media.videos.push(v);
    record.files.push({ ...entry, status: v.status, kind: "video", stored: originalRel });
  }

  const counts = record.files.reduce((a, f) => ((a[f.status] = (a[f.status] ?? 0) + 1), a), {});
  record.counts = counts;
  if (!dry) {
    intake.runs.push(record);
    writeJson(ledgerPath("content/owner-intake.json"), intake);
    writeJson(ledgerPath("content/image-provenance.json"), provenance);
    writeJson(ledgerPath("content/grading-queue.json"), queue);
    writeJson(ledgerPath("content/media/manifest.json"), media);
  }

  for (const f of record.files) {
    console.log(`  ${f.status.padEnd(16)} ${(f.type ?? "").padEnd(5)} ${f.name ?? f.idHash}${f.of ? `  = ${f.of}` : ""}${f.reason ? `  — ${f.reason}` : ""}`);
  }
  console.log(`\n${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(", ") || "nothing found"}`);
  if (!dry && (counts.ingested ?? 0) > 0) {
    console.log(`next: run the grading pass over content/grading-queue.json, then \`node scripts/verify-provenance.mjs\` before committing`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((e) => {
    console.error(`ingest failed: ${e.message}`);
    process.exit(1);
  });
}
