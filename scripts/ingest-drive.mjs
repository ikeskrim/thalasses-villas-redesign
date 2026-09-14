#!/usr/bin/env node
/**
 * THE OWNER'S MATERIAL, FROM GOOGLE DRIVE INTO THE LIBRARY.
 *
 * The owner makes a folder, shares it "anyone with the link", and pastes the
 * link. This takes it from there: downloads everything, admits photographs and
 * video ONLY, refuses anything already in the library, and routes what is left —
 * photographs into a gitignored staging area and the grading queue, video into
 * `content/media/` with hero-loop variants.
 *
 * A SITE PLAN comes through the same door, in a run of its own. With `--plans`
 * the run admits plans ONLY — PDF, DWG, DXF, or an image of a plan — and stores
 * each one byte for byte in `content/plans/<date>/`, which git ignores, with a
 * committed ledger beside it. In that run nothing is a photograph or a video.
 *
 *   node scripts/ingest-drive.mjs "<Drive share link>"                 ingest photographs and video
 *   node scripts/ingest-drive.mjs "<Drive share link>" --plans         ingest site plans, and only plans
 *   node scripts/ingest-drive.mjs "<Drive share link>" --dry-run       look, change nothing (with or
 *                                                                       without --plans)
 *   node scripts/ingest-drive.mjs "<Drive share link>" --allow-empty   an empty folder is not an error
 *   node scripts/ingest-drive.mjs --transcode-pending                  cut the variants of every
 *                                                                       clip left needs-transcode
 *
 * WHAT IT WILL NOT DO, each one a rule rather than a preference:
 *
 *   It takes a link ONLY as its argument. It never follows a link it finds inside
 *   a folder listing or a downloaded file — a listing yields Drive item IDs (and
 *   the resource key Drive pairs with an older item's ID) and nothing else, and
 *   an entry that is not a Drive item is skipped and logged. The link comes from
 *   the owner, via the person running this, and from nowhere else (D-011).
 *
 *   It trusts no filename. Type is decided by the file's bytes. A PDF named
 *   `sunset.jpg` is a PDF, and it is refused. An M4A named `drone.mp4` is audio,
 *   and it is refused too: MP4, Matroska and AVI are containers, not video, so a
 *   file is admitted as video only when its own track table (an AVI's stream
 *   headers) declares a video track. Under `--plans`, a PDF named `plan.dwg` is
 *   stored as the PDF it is.
 *
 *   It never guesses that a file is a plan. In an ordinary run a PDF, DWG or DXF
 *   is refused — a PDF is as likely a contract or an invoice — and the log says
 *   to re-run the link with `--plans` if it is a plan. The person running this
 *   declares what the link holds, the way the link itself comes only from its
 *   argument: no folder name, no manifest inside the folder and no reading of
 *   pixels decides it. A folder named "plans" is owner-typed listing data, and a
 *   misspelling would send a drawing to the graders and, on a pass, to public/.
 *   So in a `--plans` run nothing is a photograph or a video, and in any other
 *   run nothing is a plan.
 *
 *   It publishes, grades, re-encodes and strips no plan. A plan is stored as the
 *   owner's bytes, because its sha256 is its provenance and a re-encode would
 *   degrade the line work; a phone photograph of a paper plan therefore keeps its
 *   EXIF. It is stored where git does not look — `content/plans/*` is ignored and
 *   only its ledger, `content/plans/manifest.json`, is committed — because a plan
 *   shows the property's boundaries, access and buildings. No plan enters the
 *   grading queue, owner-staging, public/ or content/image-provenance.json.
 *
 *   It never verifies a plan. Every ledger entry it writes says
 *   `verification: "unverified"`. Receiving a drawing is not the owner
 *   confirming the layout it shows: that is his ruling, relayed and recorded by
 *   hand in DECISIONS.md (D-021), and the 3D estate map's gate keys on it. This
 *   script never writes that ruling's value, anywhere.
 *
 *   It never writes a Drive ID or a resource key into the repository. This
 *   repository is public, and an "anyone with the link" ID is a key to the
 *   owner's folder: committed, it would publish his whole shared folder to anyone
 *   who reads the history. IDs are recorded only as a short one-way hash, enough
 *   to recognise a re-run; resource keys are not recorded at all.
 *
 *   It publishes nothing ungraded. A photograph is stripped and STAGED in
 *   `content/owner-staging/<date>/`, which git ignores, and queued in
 *   `content/grading-queue.json`. `public/` is what deploys, so a photograph
 *   reaches it only when `scripts/merge-grades.mjs` lands a publishable grade —
 *   committing the repository in between cannot ship a frame nobody has judged.
 *
 *   It strips metadata from every staged photograph, GPS included. Phone
 *   photographs carry the exact coordinates they were taken at; a web master
 *   carries none.
 *
 *   It never generates, retouches or grades. A photograph is staged as the owner
 *   took it (rotated upright, resized for the web) and graded by the same
 *   independent pass every other frame went through.
 *
 *   It never files an unfinished item as done. Something that failed to download,
 *   needs converting or needs transcoding is recorded as exactly that, and a
 *   re-run tries it again instead of calling it a duplicate of itself. So is a
 *   photograph still waiting for its grade whose staged file is no longer on
 *   this machine: it is staged again. And so is a plan whose stored file is no
 *   longer on this machine: it is stored again, and its ledger entry replaced.
 *
 * Environment, for tests only: INGEST_DRIVE_BASE, INGEST_DOWNLOAD_BASE (the two
 * Google hosts), INGEST_OUT_ROOT (where outputs go), INGEST_DATE, INGEST_MAX_BYTES,
 * INGEST_FFMPEG_SHIM (a Node script standing in for ffmpeg). FFMPEG_PATH is not a
 * test hook: it names the real ffmpeg binary when it is not on PATH.
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
const WEB_EDGE = 3000; /* long edge of a staged photograph; the library's own masters run to 3300 */
const HERO_LOOP = { seconds: 8, maxBytes: 2.5 * 1024 * 1024, width: 1920 };
/* How much of a download the type decision reads: this much from the start, and
   this much from the end when the file is longer. A track table is a few hundred
   KB even on a long 4K clip; the window is bounded so that naming the type of a
   2 GB master never means reading the master. */
const SNIFF_WINDOW = 8 * 1024 * 1024;

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
/* Drive pairs some older shared items' IDs with a resource key
   (`?resourcekey=0-…`) that has to travel with the ID. It is accepted and
   forwarded; only a mock Drive has served a keyed item to this script — the live
   capture in tests/fixtures/drive/ carries no key. Same alphabet as an ID;
   anything else in that parameter makes the whole link unacceptable. */
const RESOURCE_KEY = /^[A-Za-z0-9_-]{1,200}$/;
const FOLDER_PATH = /^\/drive(?:\/u\/\d+)?(?:\/mobile)?\/folders\/([^/]+)/;

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
  const key = u.searchParams.get("resourcekey");
  if (key !== null && !RESOURCE_KEY.test(key)) return null;
  const found = (kind, id) => (key ? { kind, id, resourceKey: key } : { kind, id });
  /* `/drive/mobile/folders/<id>` is the shape a folder link takes when it is
     copied from Drive's mobile site — and a phone is where the owner will be. */
  let m = u.pathname.match(/^\/drive(?:\/u\/\d+)?(?:\/mobile)?\/folders\/([^/]+)\/?$/);
  if (m && ID.test(m[1])) return found("folder", m[1]);
  m = u.pathname.match(/^\/file\/d\/([^/]+)(?:\/(?:view|edit|preview))?\/?$/);
  if (m && ID.test(m[1])) return found("file", m[1]);
  if ((u.pathname === "/open" || u.pathname === "/uc") && ID.test(u.searchParams.get("id") ?? "")) {
    return found("either", u.searchParams.get("id"));
  }
  return null;
}

/* ------------------------------------------------------------- sniffing -- */

const IMAGE_BRANDS_HEIC = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"]);
const VIDEO_BRANDS_MP4 = new Set(["isom", "iso2", "iso4", "iso5", "iso6", "mp41", "mp42", "avc1", "dash", "M4V ", "M4VP", "f4v ", "3gp4", "3gp5", "3gp6", "3g2a", "MSNV", "NDAS"]);
/* Major brands that declare audio. An M4A lists `isom` and `mp42` among its
   compatible brands like any MP4, so the compatible list proves nothing about
   it; its major brand does. */
const AUDIO_BRANDS_MP4 = new Set(["M4A ", "M4B ", "M4P ", "F4A ", "F4B "]);

/** ISO-BMFF boxes between `start` and `end`: [u32 size][4cc type], size 1 = a u64
    size follows, 0 = to the end. A box running past the bytes read comes back
    clamped to them, and ends the walk. */
function isoBoxes(b, start, end) {
  const out = [];
  let o = start;
  while (o + 8 <= end) {
    let size = b.readUInt32BE(o);
    let header = 8;
    if (size === 1) {
      if (o + 16 > end) break;
      size = Number(b.readBigUInt64BE(o + 8));
      header = 16;
    } else if (size === 0) size = end - o;
    if (size < header) break;
    out.push({ type: b.toString("latin1", o + 4, o + 8), start: o + header, end: Math.min(o + size, end) });
    o += size;
  }
  return out;
}

/** Does this `moov` hold a track whose media handler is `vide`? moov → trak →
    mdia → hdlr, whose handler type sits 8 bytes into its body (QuickTime's
    `mhlr` header puts its component subtype at the same offset). */
function moovHasVideo(b, start, end) {
  const children = (box, type) => isoBoxes(b, box.start, box.end).filter((x) => x.type === type);
  for (const trak of children({ start, end }, "trak"))
    for (const mdia of children(trak, "mdia"))
      for (const hdlr of children(mdia, "hdlr"))
        if (hdlr.end - hdlr.start >= 12 && b.toString("latin1", hdlr.start + 8, hdlr.start + 12) === "vide") return true;
  return false;
}

function isoHasVideoTrack(head, tail) {
  for (const box of isoBoxes(head, 0, head.length)) if (box.type === "moov" && moovHasVideo(head, box.start, box.end)) return true;
  if (!tail) return false;
  /* A phone usually writes the track table AFTER the picture data, so on a long
     clip it is in the tail — at an offset nothing in the tail announces. Every
     `moov` whose declared size fits inside the tail is walked; a chance match in
     compressed data does not survive the walk down to a `vide` handler. The size
     is read the way isoBoxes() reads it: 1 means a u64 size follows the type (a
     muxer writing a large file may use it for moov too), 0 means the box runs to
     the end of the file, which is the end of the tail.
     Not handled: a moov that starts in neither window — one straddling the end of
     the head of a file longer than two windows. */
  for (let i = tail.indexOf("moov", 4, "latin1"); i !== -1; i = tail.indexOf("moov", i + 1, "latin1")) {
    const at = i - 4;
    let size = tail.readUInt32BE(at);
    let header = 8;
    if (size === 1) {
      if (i + 12 > tail.length) continue;
      size = Number(tail.readBigUInt64BE(i + 4));
      header = 16;
    } else if (size === 0) size = tail.length - at;
    if (size >= header && at + size <= tail.length && moovHasVideo(tail, at + header, at + size)) return true;
  }
  return false;
}

/* RIFF (AVI): a chunk is [4cc][u32 LE size][data], padded to an even length. A
   LIST chunk's data opens with its own 4cc list type. */
function riffChunks(b, start, end) {
  const out = [];
  let o = start;
  while (o + 8 <= end) {
    const size = b.readUInt32LE(o + 4);
    out.push({ id: b.toString("latin1", o, o + 4), start: o + 8, end: Math.min(o + 8 + size, end) });
    o += 8 + size + (size & 1);
  }
  return out;
}

/** Does this AVI declare a video stream? RIFF → LIST hdrl → LIST strl → strh, whose
    first four bytes are the stream type: `vids` for video, `auds` for audio. The
    AVI header list comes first in the file, so the head is where it is read. */
function aviHasVideoStream(b) {
  const lists = (parent, type) =>
    riffChunks(b, parent.start, parent.end)
      .filter((c) => c.id === "LIST" && c.end - c.start >= 4 && b.toString("latin1", c.start, c.start + 4) === type)
      .map((c) => ({ start: c.start + 4, end: c.end }));
  for (const hdrl of lists({ start: 12, end: b.length }, "hdrl"))
    for (const strl of lists(hdrl, "strl"))
      for (const strh of riffChunks(b, strl.start, strl.end))
        if (strh.id === "strh" && strh.end - strh.start >= 4 && b.toString("latin1", strh.start, strh.start + 4) === "vids") return true;
  return false;
}

/* EBML (Matroska, WebM): an element is [ID vint, marker kept][size vint, marker
   dropped][data]. A size of all ones is "unknown": the element runs to its parent's end. */
function vint(b, o, keepMarker) {
  const first = b[o];
  if (first === undefined || first === 0) return null;
  const len = Math.clz32(first) - 23;
  if (o + len > b.length) return null;
  const mask = 0xff >> len;
  let value = keepMarker ? first : first & mask;
  let allOnes = (first & mask) === mask;
  for (let i = 1; i < len; i++) {
    value = value * 256 + b[o + i];
    allOnes &&= b[o + i] === 0xff;
  }
  return { value, len, unknown: !keepMarker && allOnes };
}

function ebmlElements(b, start, end) {
  const out = [];
  let o = start;
  while (o < end) {
    const id = vint(b, o, true);
    const size = id && vint(b, o + id.len, false);
    if (!size) break;
    const data = o + id.len + size.len;
    const stop = size.unknown ? end : data + size.value;
    out.push({ id: id.value, start: data, end: Math.min(stop, end) });
    if (stop >= end) break;
    o = stop;
  }
  return out;
}

const EBML_SEGMENT = 0x18538067;
const EBML_TRACKS = 0x1654ae6b;
const EBML_TRACK_ENTRY = 0xae;
const EBML_TRACK_TYPE = 0x83; /* 1 video, 2 audio, 17 subtitle */

function tracksHaveVideo(b, start, end) {
  for (const entry of ebmlElements(b, start, end).filter((e) => e.id === EBML_TRACK_ENTRY)) {
    for (const t of ebmlElements(b, entry.start, entry.end).filter((e) => e.id === EBML_TRACK_TYPE)) {
      if (t.end - t.start < 1 || t.end - t.start > 8) continue;
      let type = 0;
      for (let i = t.start; i < t.end; i++) type = type * 256 + b[i];
      if (type === 1) return true;
    }
  }
  return false;
}

function ebmlHasVideoTrack(head, tail) {
  for (const segment of ebmlElements(head, 0, head.length).filter((e) => e.id === EBML_SEGMENT))
    for (const tracks of ebmlElements(head, segment.start, segment.end).filter((e) => e.id === EBML_TRACKS))
      if (tracksHaveVideo(head, tracks.start, tracks.end)) return true;
  if (!tail) return false;
  /* Muxers put Tracks before the first cluster, but the format allows it later. */
  const TRACKS_ID = Buffer.from([0x16, 0x54, 0xae, 0x6b]);
  for (let i = tail.indexOf(TRACKS_ID); i !== -1; i = tail.indexOf(TRACKS_ID, i + 1)) {
    const size = vint(tail, i + 4, false);
    const start = size ? i + 4 + size.len : 0;
    if (size && !size.unknown && start + size.value <= tail.length && tracksHaveVideo(tail, start, start + size.value)) return true;
  }
  return false;
}

const asBuffer = (u8) => Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength);

/**
 * What a file IS, from its bytes. `null` means neither a photograph nor a video.
 *
 * `buf` is the file from its first byte — all of it, or as much as was read;
 * `tail`, when the file is longer than that, is its last bytes. A photograph is
 * decided by its signature. A video is not: an MP4 or a Matroska file is a
 * CONTAINER, and an M4A, a voice memo in a 3GP or an .mka is the same container
 * with only sound inside; so is an AVI holding only an audio stream. So a video
 * must also show a video track — an ISO `hdlr` of type `vide`, a Matroska
 * TrackType of 1, or an AVI `strh` of type `vids` — within the bytes read.
 */
export function sniff(buf, tail) {
  const b = asBuffer(buf);
  const t = tail ? asBuffer(tail) : undefined;
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
    if (AUDIO_BRANDS_MP4.has(brands[0])) return null;
    const type = brands[0] === "qt  " ? "mov" : brands.some((x) => VIDEO_BRANDS_MP4.has(x)) ? "mp4" : null;
    return type && isoHasVideoTrack(b, t) ? { kind: "video", type } : null;
  }
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) {
    return ebmlHasVideoTrack(b, t) ? { kind: "video", type: ascii(0, 64).includes("webm") ? "webm" : "mkv" } : null;
  }
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "AVI ") return aviHasVideoStream(b) ? { kind: "video", type: "avi" } : null;
  return null;
}

/** The bytes sniff() decides on: a file's first SNIFF_WINDOW, and its last SNIFF_WINDOW too when it is longer. */
function readWindow(file) {
  const { size } = fs.statSync(file);
  const fd = fs.openSync(file, "r");
  try {
    const head = Buffer.alloc(Math.min(size, SNIFF_WINDOW));
    fs.readSync(fd, head, 0, head.length, 0);
    let tail;
    if (size > SNIFF_WINDOW) {
      tail = Buffer.alloc(SNIFF_WINDOW);
      fs.readSync(fd, tail, 0, SNIFF_WINDOW, size - SNIFF_WINDOW);
    }
    return { head, tail };
  } finally {
    fs.closeSync(fd);
  }
}

/** sniff() over a file on disk, reading only the bounded window it needs. */
export function sniffFile(file) {
  const { head, tail } = readWindow(file);
  return sniff(head, tail);
}

/* ---------------------------------------------------------------- plans -- */

/* DWG release codes: the six bytes at offset 0 of a DWG file. The list is the
   DWG entries of file(1)'s magic database (Git for Windows,
   usr/share/misc/magic.mgc, whose labels run from "Release 1.0" to "AutoCAD
   2021"). Two of them, AC1.2 and AC1.3, are five characters long. file(1)
   matches every code as a prefix at offset 0, but this does not: all six bytes
   are compared, so a five-character code must be followed by the NUL that ends
   it. Read as a prefix, "AC1.2" would also admit "AC1.29" or "AC1.3Z", codes
   nobody has shown to exist — and an allowlist admits only what is known.
   AC1035 is in that database too and is DELIBERATELY left out: it sits next to
   the "AutoCAD 2021" label, but it was not established here that Autodesk ever
   wrote a DWG with that code. A real AC1035 file is refused, loudly, and the
   code is added once such a file exists. */
const DWG_VERSIONS = [
  "AC1.2\0", "AC1.3\0", "AC1.40", "AC1.50", "AC2.10", "AC2.21", "AC2.22",
  "AC1001", "AC1002", "AC1003", "AC1004", "AC1006", "AC1009", "AC1012", "AC1013",
  "AC1014", "AC1015", "AC1018", "AC1021", "AC1024", "AC1027", "AC1032",
];
/* The section names a DXF file's first SECTION may carry. */
const DXF_SECTIONS = new Set(["HEADER", "CLASSES", "TABLES", "BLOCKS", "ENTITIES", "OBJECTS", "THUMBNAILIMAGE"]);
/* A binary DXF opens with this 22-byte sentinel: "AutoCAD Binary DXF", CR, LF,
   SUB, NUL. It is taken from Autodesk's DXF reference ("Binary DXF Files"). It
   was NOT checked against a real binary DXF on this machine — file(1)'s magic
   database has no entry for it. */
const BINARY_DXF = Buffer.from("AutoCAD Binary DXF\r\n\x1a\0", "latin1");
const isBinaryDxf = (b) => b.length >= BINARY_DXF.length && b.subarray(0, BINARY_DXF.length).equals(BINARY_DXF);
/* What a version recorded from inside a DXF may look like. The ledger is
   committed, so nothing free-form read out of an owner's file goes into it. */
const ACADVER = /^AC[0-9.]{4,5}$/;

/** A DWG's release code, or null. The code alone is six printable bytes — a text
    file could open with "AC1015" — so the file must also hold a NUL within its
    first 128 bytes, which every DWG header does and no text file does. The
    version recorded is the code without the NUL a five-character one ends in. */
function dwgVersion(b) {
  if (b.length < 6) return null;
  const opening = b.toString("latin1", 0, 6);
  const code = DWG_VERSIONS.find((v) => opening === v);
  return code && b.subarray(0, 128).includes(0) ? code.replace(/\0$/, "") : null;
}

/**
 * An ASCII DXF, read as what it is: (group code, value) line pairs, LF or CRLF,
 * codes possibly space-padded ("  0"). Leading 999 comments are skipped, then the
 * file must open a SECTION (code 0) with a known section name (code 2). A loose
 * "0 / SECTION" anywhere in a text file is not enough. Returns `{ version }` —
 * the header's $ACADVER when it is there and shaped like a release code — or null.
 */
function asciiDxf(b) {
  if (b.length < 8 || b.includes(0)) return null;
  let pos = b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf ? 3 : 0; /* a UTF-8 BOM */
  const line = () => {
    if (pos >= b.length) return null;
    let end = b.indexOf(0x0a, pos);
    if (end === -1) end = b.length;
    const stop = end > pos && b[end - 1] === 0x0d ? end - 1 : end;
    const s = b.toString("latin1", pos, Math.min(stop, pos + 512));
    pos = end + 1;
    return s;
  };
  const pair = () => {
    const code = line();
    const value = line();
    if (code === null || value === null || !/^[ \t]*-?\d{1,4}[ \t]*$/.test(code)) return null;
    return { code: Number(code), value: value.trim() };
  };
  let p = pair();
  while (p && p.code === 999) p = pair();
  if (!p || p.code !== 0 || p.value !== "SECTION") return null;
  p = pair();
  if (!p || p.code !== 2 || !DXF_SECTIONS.has(p.value)) return null;
  let version = null;
  /* $ACADVER is the header's first variable in what AutoCAD writes; the next code 0 ends the section. */
  for (let n = 0; n < 64 && (p = pair()) && p.code !== 0; n++) {
    if (p.code === 9 && p.value === "$ACADVER") {
      const v = pair();
      if (v && v.code === 1 && ACADVER.test(v.value)) version = v.value;
      break;
    }
  }
  return { version };
}

/**
 * What a file IS as a plan, from its bytes — for a `--plans` run only. `null`
 * means not a plan. Same arguments as sniff(): the file from its first byte, and
 * its last bytes when it is longer than that.
 *
 *   PDF   "%PDF-" and a 1.x or 2.x version, AND "%%EOF" within the file's last
 *         1024 bytes: a PDF cut short in the download is not stored as a plan.
 *   DWG   a known release code at offset 0 (DWG_VERSIONS), and a NUL in the
 *         first 128 bytes.
 *   DXF   the binary sentinel, or an ASCII file that opens a known SECTION.
 *   image a photograph or scan of a plan, by sniff()'s own image signatures.
 *
 * Everything else is refused: video and audio, HTML, SVG (it can carry script),
 * zip and office documents, plain text.
 */
export function sniffPlan(buf, tail) {
  const b = asBuffer(buf);
  const t = tail ? asBuffer(tail) : undefined;
  if (b.length >= 5 && b.toString("latin1", 0, 5) === "%PDF-") {
    const version = /^[12]\.\d/.exec(b.toString("latin1", 5, 8))?.[0];
    const end = t ?? b;
    const complete = end.subarray(Math.max(0, end.length - 1024)).includes("%%EOF", 0, "latin1");
    return version && complete ? { kind: "plan", type: "pdf", version } : null;
  }
  const dwg = dwgVersion(b);
  if (dwg) return { kind: "plan", type: "dwg", version: dwg };
  if (isBinaryDxf(b)) return { kind: "plan", type: "dxf", version: null, encoding: "binary" };
  const media = sniff(b, t);
  if (media?.kind === "image") return { kind: "plan", type: media.type };
  if (media) return null;
  const dxf = asciiDxf(b);
  return dxf ? { kind: "plan", type: "dxf", version: dxf.version, encoding: "ascii" } : null;
}

/* What describeRefused() names a file that a `--plans` run would take. */
const PLAN_NAMES = new Set(["pdf", "dwg", "dxf"]);

/** For the rejection log only: a name for what a refused file most likely is. */
function describeRefused(b) {
  const a = Buffer.from(b).subarray(0, 16).toString("latin1");
  if (a.startsWith("%PDF")) return "pdf";
  if (dwgVersion(asBuffer(b))) return "dwg";
  /* The binary sentinel is 22 bytes, longer than `a`: it is compared on the
     whole head, or a binary DXF would pass below as "text" with no --plans hint. */
  if (isBinaryDxf(asBuffer(b)) || asciiDxf(asBuffer(b))) return "dxf";
  if (a.startsWith("PK")) return "zip or office document";
  if (a.slice(4, 8) === "ftyp") {
    const major = a.slice(8, 12);
    return AUDIO_BRANDS_MP4.has(major) ? `audio (major brand "${major.trim()}")` : `an MP4-family container with no video track in it (major brand "${major.trim()}"), audio most likely`;
  }
  if (a.startsWith("\x1a\x45\xdf\xa3")) return "a Matroska/WebM container with no video track in it, audio most likely";
  if (a.startsWith("RIFF") && a.slice(8, 12) === "WAVE") return "audio (WAV)";
  if (a.startsWith("RIFF") && a.slice(8, 12) === "AVI ") return "an AVI container with no video stream in it, audio most likely";
  if (/^\s*<(!doctype|html)/i.test(a)) return "html";
  const opening = asBuffer(b).subarray(0, 1024).toString("latin1");
  if (/^\s*</.test(opening) && /<svg[\s>]/i.test(opening)) return "svg";
  if (/^[\x09\x0a\x0d\x20-\x7e]*$/.test(a)) return "text";
  return "unrecognised binary";
}

/** For a `--plans` run's rejection log: what a file that is not a plan most likely is. */
function describeNotPlan(head, tail) {
  const media = sniff(head, tail);
  if (media?.kind === "video") return `a video (${media.type})`;
  const what = describeRefused(head);
  if (what === "pdf") return "a pdf with no 1.x or 2.x version in its header, or no %%EOF at its end — damaged, or cut short in the download";
  if (what === "svg") return "an svg, which can carry script";
  return what;
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

/* A resource key rides in a request's own query and nowhere else — never a
   ledger, a log line or an error message. */
const keyed = (url, resourceKey) => (resourceKey ? `${url}&resourcekey=${encodeURIComponent(resourceKey)}` : url);

/** The link answered, but not as a listable folder: not shared, not a folder, or gone. */
class NotListable extends Error {}

/**
 * A folder's entries, parsed from Drive's public embedded listing: IDs, names,
 * resource keys, nothing else. Run against a live capture of that page in
 * tests/fixtures/drive/embeddedfolderview-live-2026-09-14.html.
 */
export function parseFolderListing(body) {
  const out = [];
  const re = /<div class="flip-entry" id="entry-([A-Za-z0-9_-]+)"[\s\S]*?<a href="([^"]*)"[\s\S]*?<div class="flip-entry-title">([^<]*)<\/div>/g;
  for (const m of String(body).matchAll(re)) {
    const [, entryId, hrefRaw, title] = m;
    const href = decodeEntities(hrefRaw);
    const name = decodeEntities(title).trim();
    if (!ID.test(entryId)) continue;
    /* The listing is DATA. An entry counts only if its link is one of Google's
       own Drive shapes naming that same entry; even then the request is built
       from the entry ID against the fixed Drive host — never from the URL. The
       one thing taken from the link is that item's own resource key, in the
       strict alphabet, to be sent back to Drive for that item alone. */
    let hrefUrl = null;
    try {
      hrefUrl = new URL(href);
    } catch {}
    const onDrive = hrefUrl?.protocol === "https:" && (hrefUrl.hostname === "drive.google.com" || hrefUrl.hostname === "docs.google.com");
    const key = onDrive ? hrefUrl.searchParams.get("resourcekey") : null;
    const extra = key && RESOURCE_KEY.test(key) ? { resourceKey: key } : {};
    if (onDrive && hrefUrl.pathname.match(FOLDER_PATH)?.[1] === entryId) out.push({ kind: "folder", id: entryId, name, ...extra });
    else if (onDrive && hrefUrl.pathname.match(/^\/file\/d\/([^/]+)/)?.[1] === entryId) out.push({ kind: "file", id: entryId, name, ...extra });
    else out.push({ kind: "skipped", id: entryId, name, reason: "not a Drive file or folder" });
  }
  return out;
}

async function listFolder(id, resourceKey) {
  const { res } = await request(keyed(`${DRIVE}/embeddedfolderview?id=${encodeURIComponent(id)}`, resourceKey));
  const body = await res.text();
  if (res.status !== 200 || !body.includes("flip-entries")) {
    throw new NotListable(`the folder could not be listed (${res.status}) — is it shared "anyone with the link"?`);
  }
  /* `onPage` is how many entry elements the page holds, counted without the
     parser. Every one of them yields exactly one parsed entry (a folder, a file
     or a logged skip), so a parsed count below it means Drive changed the markup
     of some entries — and those would otherwise vanish from the run unnoticed. */
  return { entries: parseFolderListing(body), onPage: (body.match(/class="flip-entry(?=[\s"])/g) ?? []).length };
}

/** Download one file to `dest`, through Drive's large-file confirmation page if one appears. */
async function download(id, dest, resourceKey) {
  let url = keyed(`${USERCONTENT}/download?id=${encodeURIComponent(id)}&export=download`, resourceKey);
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
      if (resourceKey && !action.searchParams.has("resourcekey")) action.searchParams.set("resourcekey", resourceKey);
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
  /* `content/media/originals/` is not library material. It holds the master of a
     clip that may still be waiting on ffmpeg, and counting it would make that clip
     a duplicate of itself on the very re-run meant to finish it. A finished clip
     is recognised by the media manifest instead. */
  const mediaFiles = (base) => {
    const dir = path.join(base, "content", "media");
    return walk(dir).filter((f) => path.relative(dir, f).split(path.sep)[0] !== "originals");
  };
  const roots = [
    [walk(path.join(ROOT, "public")), (f) => "/" + path.relative(path.join(ROOT, "public"), f).split(path.sep).join("/")],
    [mediaFiles(ROOT), (f) => "content/media/" + path.relative(path.join(ROOT, "content", "media"), f).split(path.sep).join("/")],
  ];
  if (OUT !== ROOT) {
    roots.push([walk(path.join(OUT, "public")), (f) => "/" + path.relative(path.join(OUT, "public"), f).split(path.sep).join("/")]);
    roots.push([mediaFiles(OUT), (f) => "content/media/" + path.relative(path.join(OUT, "content", "media"), f).split(path.sep).join("/")]);
  }
  for (const [files, label] of roots) {
    for (const f of files) {
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

/** The ffmpeg to run, as [executable, ...its leading arguments], or null when there is none. */
function ffmpegBinary() {
  const bin = process.env.INGEST_FFMPEG_SHIM ? [process.execPath, path.resolve(process.env.INGEST_FFMPEG_SHIM)] : [process.env.FFMPEG_PATH || "ffmpeg"];
  const r = spawnSync(bin[0], [...bin.slice(1), "-version"], { encoding: "utf-8" });
  return r.status === 0 ? bin : null;
}

/**
 * THE HERO-LOOP CUT, AS DATA: poster first, then the MP4 and WebM loops.
 *
 * One function, because there used to be two descriptions of this cut — the
 * arguments heroVariants() ran, and a hand-written copy recorded for a clip that
 * had to wait for ffmpeg — and they had already drifted: the copy used a fixed
 * 2300k where the code computes 2411k, and dropped the WebM encoder's `-row-mt`
 * and `-deadline`. A maintainer who ran the recorded lines would have cut a
 * different file from the one the pipeline cuts. Now heroVariants() runs these
 * argument lists and a needs-transcode clip records them, verbatim.
 *
 * Paths are relative to the output root and ffmpeg runs from there, which is what
 * lets the spawned argv and the recorded line be the same text.
 */
export function heroVariantPlan(inputRel, dirRel) {
  /* Target bitrate from the byte budget, with 8% headroom for the container. */
  const kbps = Math.floor((HERO_LOOP.maxBytes * 8 * 0.92) / HERO_LOOP.seconds / 1000);
  const quiet = ["-y", "-hide_banner", "-loglevel", "error"];
  const scale = ["-vf", `scale=${HERO_LOOP.width}:-2`];
  const rate = ["-b:v", `${kbps}k`, "-maxrate", `${kbps}k`, "-bufsize", `${kbps * 2}k`];
  const loop = (name, codec) => ({
    name,
    budget: true,
    args: [...quiet, "-i", inputRel, "-t", String(HERO_LOOP.seconds), "-an", ...scale, ...codec, ...rate, `${dirRel}/${name}`],
  });
  return [
    { name: "poster.jpg", budget: false, args: [...quiet, "-ss", "0.5", "-i", inputRel, "-frames:v", "1", ...scale, "-q:v", "3", `${dirRel}/poster.jpg`] },
    loop("loop-1080.mp4", ["-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-preset", "slow"]),
    loop("loop-1080.webm", ["-c:v", "libvpx-vp9", "-row-mt", "1", "-deadline", "good"]),
  ];
}

/** One plan step as a line a maintainer can paste into a shell. */
export function commandLine(args, exe = "ffmpeg") {
  return [exe, ...args].map((a) => (/^[\w@%+=:,./-]+$/.test(a) ? a : `"${a.replace(/["\\$`]/g, "\\$&")}"`)).join(" ");
}

/** Poster first, then the loop variants, each held under the hero-loop budget. Runs heroVariantPlan() exactly. */
function heroVariants(ffmpeg, inputRel, dirRel) {
  fs.mkdirSync(path.join(OUT, dirRel), { recursive: true });
  const outputs = [];
  for (const step of heroVariantPlan(inputRel, dirRel)) {
    const r = spawnSync(ffmpeg[0], [...ffmpeg.slice(1), ...step.args], { cwd: OUT, encoding: "utf-8" });
    const file = path.join(OUT, dirRel, step.name);
    if (r.status !== 0 || !fs.existsSync(file)) {
      return { ok: false, error: `${step.name}: ${String(r.stderr || r.error || "no output").trim().slice(0, 300)}` };
    }
    const bytes = fs.statSync(file).size;
    if (step.budget && bytes > HERO_LOOP.maxBytes) {
      return { ok: false, error: `${step.name} came out at ${bytes} bytes, over the ${HERO_LOOP.maxBytes}-byte budget` };
    }
    outputs.push({ file: `${dirRel}/${step.name}`, bytes });
  }
  return { ok: true, outputs };
}

/** Cut a clip's variants and record the outcome on its manifest entry. */
function cutVariants(ffmpeg, v) {
  const r = heroVariants(ffmpeg, v.original, `content/media/${v.slug}`);
  delete v.reason;
  delete v.commands;
  if (r.ok) {
    v.status = "variants-ready";
    v.note = "DRAFT CUT: the first 8 seconds. Choosing the in and out points is an editorial call — re-cut before it becomes the hero.";
    v.variants = r.outputs;
  } else {
    v.status = "transcode-failed";
    v.reason = r.error;
  }
}

/**
 * `--transcode-pending`: finish every clip that arrived while ffmpeg was missing.
 * The manifest is the list. The original must still be on this machine, because
 * originals are gitignored and never travel with the repository.
 */
function transcodePending() {
  const manifest = ledgerPath("content/media/manifest.json");
  if (!fs.existsSync(manifest)) {
    console.error(`no content/media/manifest.json under ${OUT} — run this from the repository the clips were ingested into`);
    process.exit(1);
  }
  const ffmpeg = ffmpegBinary();
  if (!ffmpeg) {
    console.error("ffmpeg was not found: put it on PATH, or point FFMPEG_PATH at the binary. Nothing was changed.");
    process.exit(1);
  }
  const media = readJson(manifest, { videos: [] });
  const pending = media.videos.filter((v) => v.status === "needs-transcode");
  if (!pending.length) {
    console.log("no clip in content/media/manifest.json is needs-transcode — nothing to cut");
    return;
  }
  for (const v of pending) {
    if (!fs.existsSync(path.join(OUT, v.original))) {
      console.log(`  ${"missing".padEnd(16)} ${v.slug}  — its original, ${v.original}, is not on this machine`);
      process.exitCode = 1;
      continue;
    }
    cutVariants(ffmpeg, v);
    if (v.status !== "variants-ready") process.exitCode = 1;
    console.log(`  ${v.status.padEnd(16)} ${v.slug}${v.reason ? `  — ${v.reason}` : ""}`);
  }
  writeJson(manifest, media);
}

/* ----------------------------------------------------------------- main -- */

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--transcode-pending")) return transcodePending();
  const dry = args.includes("--dry-run");
  const allowEmpty = args.includes("--allow-empty");
  const plans = args.includes("--plans");
  const link = args.find((a) => !a.startsWith("--"));
  const parsed = link ? parseDriveLink(link) : null;
  if (!parsed) {
    console.error(
      'usage: node scripts/ingest-drive.mjs "https://drive.google.com/drive/folders/<id>" [--dry-run] [--allow-empty]    photographs and video\n' +
        '       node scripts/ingest-drive.mjs "https://drive.google.com/drive/folders/<id>" --plans [--dry-run]           site plans only\n' +
        "       node scripts/ingest-drive.mjs --transcode-pending\n" +
        "The link must be a Google Drive folder or file shared \"anyone with the link\"."
    );
    process.exit(2);
  }

  const runId = shortHash(`${parsed.id}|${DATE}`);
  const inbox = path.join(OUT, "content", "inbox", DATE);
  fs.mkdirSync(inbox, { recursive: true });
  console.log(`ingest ${parsed.kind} ${shortHash(parsed.id)} → ${path.relative(ROOT, inbox) || inbox}${plans ? "  (plans only)" : ""}${dry ? "  (dry run)" : ""}`);

  /* 1. What is there. */
  const items = [];
  const visit = async (id, resourceKey, depth, trail, listed) => {
    const { entries, onPage } = listed ?? (await listFolder(id, resourceKey));
    const which = trail.length ? `the subfolder "${trail.join("/")}"` : "the folder";
    /* CONVENTIONS §18: a discovery step that finds nothing fails loudly, and so
       does one that finds less than is there. Entries on the page that do not
       parse are Drive changing its markup; --allow-empty does not excuse that. A
       page with no entries at all is far more often the same drift than the owner
       sending an empty folder, and "nothing found", exit 0, would report the first
       as the second. Listing finishes before any download, so nothing is ingested. */
    if (entries.length !== onPage) {
      throw new Error(
        `${which} shows ${onPage} entries and ${entries.length} of them parse — Drive's listing markup has changed; update parseFolderListing() against a fresh capture. Nothing was ingested.`
      );
    }
    if (!onPage && !allowEmpty) {
      throw new Error(
        `${which} was listed, but no entry was found in it. If it really is empty, re-run with --allow-empty; if it is not, Drive's listing markup has changed. Nothing was ingested.`
      );
    }
    for (const e of entries) {
      if (items.length >= MAX_ITEMS) return;
      if (e.kind === "folder") {
        if (depth < MAX_DEPTH) await visit(e.id, e.resourceKey, depth + 1, [...trail, e.name]);
        else items.push({ ...e, kind: "skipped", reason: `deeper than ${MAX_DEPTH} folders` });
      } else items.push({ ...e, trail });
    }
  };
  if (parsed.kind === "folder") await visit(parsed.id, parsed.resourceKey, 0, []);
  else if (parsed.kind === "file") items.push({ kind: "file", id: parsed.id, resourceKey: parsed.resourceKey, name: null, trail: [] });
  else {
    /* `/open?id=` and `/uc?id=` do not say whether the ID is a folder or a file.
       It is treated as a folder only if its listing shows at least one entry. A
       listing Drive refuses, or one with no entry on it, is tried as a file —
       what Drive's listing endpoint answers for a FILE ID has not been captured,
       and an empty page is as likely an answer as a refusal. A failure below the
       root (a subfolder that will not list, markup drift) still stops the run. */
    let listed = null;
    try {
      listed = await listFolder(parsed.id, parsed.resourceKey);
    } catch (e) {
      if (!(e instanceof NotListable)) throw e;
    }
    if (listed?.onPage) await visit(parsed.id, parsed.resourceKey, 0, [], listed);
    else items.push({ kind: "file", id: parsed.id, resourceKey: parsed.resourceKey, name: null, trail: [] });
  }

  const library = libraryHashes();
  const intake = readLedger("content/owner-intake.json", {
    _note:
      "Every item the owner has sent through scripts/ingest-drive.mjs. Drive IDs are never stored — only a short one-way hash, because an 'anyone with the link' ID is a key to the owner's folder and this repository is public.",
    runs: [],
  });
  const queue = readLedger("content/grading-queue.json", {
    _note:
      "Owner-supplied photographs, stripped of metadata and staged in content/owner-staging/ (gitignored), waiting for the standard grading pass (two independent graders against the Phase 1 standard, a third adjudicating). Tier A by provenance: the owner's own property material. A grade is NOT implied by being here. `npm run grading:sheet -- <new empty dir> --queue` builds the sheet from the pending-grade entries; `npm run grading:merge` writes each grade back here once and publishes an A or B with no flag to public/images/_owner/.",
    queue: [],
  });
  const media = readLedger("content/media/manifest.json", {
    _note: "Owner-supplied video. Originals stay local (gitignored); poster-first hero-loop variants are generated beside this file when ffmpeg is available.",
    videos: [],
  });

  /* What has been TAKEN, by the sha256 of the bytes the owner sent. Only a finished
     outcome counts. An item that failed, needs converting or needs transcoding is
     unfinished business, and counting it here would turn every re-run into
     "duplicate of itself" — the retry the owner was told to make would never happen.
     A photograph's outcome is read from the queue, not from an intake record that
     says it was once staged: see stagingStands below. */
  const TAKEN = new Set(["ingested", "variants-ready"]);
  const taken = new Map();
  for (const run of intake.runs) for (const f of run.files) if (f.sha256 && TAKEN.has(f.status)) taken.set(f.sha256, f.published ?? f.stored ?? "an earlier intake");
  /* Staging is gitignored and exists on one machine. A pending-grade entry whose
     staged file is gone — a `git clean -fdX`, a fresh checkout, another machine —
     cannot be put in front of graders, and counting it as taken would make every
     re-run call the photograph a duplicate while grading-sheet finds nothing to
     read. So a queue entry stands once it is graded (published or held), or while
     its staged file is on disk; otherwise the photograph is staged again and the
     stale entry is replaced. */
  const stagingStands = (q) => q.status !== "pending-grade" || (typeof q.staged === "string" && fs.existsSync(path.join(OUT, ...q.staged.split("/"))));
  for (const q of queue.queue) if (q.originalSha256 && stagingStands(q)) taken.set(q.originalSha256, q.published ?? q.staged ?? q.path);
  for (const v of media.videos) if (v.status === "variants-ready" && v.originalSha256) taken.set(v.originalSha256, `content/media/${v.slug}`);
  const ffmpeg = ffmpegBinary();

  /* Plans have a ledger of their own, and only a `--plans` run reads or writes it.
     The drawings themselves are gitignored and exist on one machine, so a plan is
     taken only while its stored file is on disk — the rule stagingStands applies to
     a photograph. One whose file is gone is stored again and its entry replaced. */
  const plansLedger = plans
    ? readLedger("content/plans/manifest.json", {
        _note:
          "Site plans the owner sent through `scripts/ingest-drive.mjs --plans`. The drawings are stored byte for byte in content/plans/<date>/, which git ignores: a plan shows the property's boundaries, access and buildings, and this repository is public. Only this ledger is committed. No plan is published, graded, re-encoded or stripped. Every entry the ingest writes is verification 'unverified': receiving a plan does not confirm the layout it shows, and only the owner's own ruling, recorded by hand (DECISIONS.md D-021), changes that. Drive IDs and resource keys are never stored.",
        plans: [],
      })
    : null;
  const planStands = (p) => p.status === "stored" && typeof p.stored === "string" && fs.existsSync(path.join(OUT, ...p.stored.split("/")));
  const plansTaken = new Map();
  for (const p of plansLedger?.plans ?? []) if (p.sha256 && planStands(p)) plansTaken.set(p.sha256, p.stored);
  /* The same bytes may also be a photograph the library or the queue already
     holds. That does not make the plan a duplicate — evidence of the layout is a
     separate use — so the plan is stored and the photograph named beside it. */
  const photographOf = (sha) => {
    const q = queue.queue.find((x) => x.originalSha256 === sha);
    return library.get(sha) ?? q?.published ?? q?.staged ?? taken.get(sha);
  };

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
      got = await download(it.id, tmp, it.resourceKey);
    } catch (e) {
      record.files.push({ ...base, status: "failed", reason: e.message });
      continue;
    }
    const name = it.name ?? got.filename ?? base.idHash;
    const { head, tail } = readWindow(tmp);
    const entry = { ...base, name, bytes: got.bytes, sha256: got.sha256 };

    if (plans) {
      /* A plan run. Nothing here is a photograph or a video, and nothing here goes
         near their path: no strip, no resize, no re-encode, no queue, no staging. */
      const plan = sniffPlan(head, tail);
      if (!plan) {
        fs.rmSync(tmp, { force: true });
        record.files.push({ ...entry, status: "rejected", reason: `not a plan — it is ${describeNotPlan(head, tail)}, whatever its name says` });
        continue;
      }
      entry.type = plan.type;
      const dupe = plansTaken.get(got.sha256) ?? batch.get(got.sha256);
      if (dupe) {
        fs.rmSync(tmp, { force: true });
        record.files.push({ ...entry, status: "duplicate", of: dupe });
        continue;
      }
      const storedRel = `content/plans/${DATE}/${got.sha256.slice(0, 12)}-${slug(name)}.${plan.type === "jpeg" ? "jpg" : plan.type}`;
      batch.set(got.sha256, storedRel);
      if (dry) {
        fs.rmSync(tmp, { force: true });
        record.files.push({ ...entry, status: "would-store", kind: "plan" });
        continue;
      }
      /* The downloaded file itself is moved into place: the bytes stored are the
         bytes Drive sent, whose sha256 was taken while they streamed. */
      const storedAbs = path.join(OUT, ...storedRel.split("/"));
      fs.mkdirSync(path.dirname(storedAbs), { recursive: true });
      fs.renameSync(tmp, storedAbs);
      const also = photographOf(got.sha256);
      plansLedger.plans = plansLedger.plans.filter((p) => p.sha256 !== got.sha256 && p.stored !== storedRel);
      plansLedger.plans.push({
        stored: storedRel,
        sha256: got.sha256,
        bytes: got.bytes,
        type: plan.type,
        version: plan.version ?? null,
        ...(plan.encoding ? { encoding: plan.encoding } : {}),
        name,
        folder: base.folder ?? null,
        provenance: PROVENANCE,
        origin: "owner-plan",
        verification: "unverified",
        status: "stored",
        added: DATE,
        ...(also ? { alsoPhotograph: also } : {}),
      });
      record.files.push({ ...entry, status: "stored", kind: "plan", stored: storedRel });
      continue;
    }

    const kind = sniff(head, tail);
    if (!kind) {
      fs.rmSync(tmp, { force: true });
      const what = describeRefused(head);
      const hint = PLAN_NAMES.has(what) ? " — if this is a plan, re-run the link with --plans" : "";
      record.files.push({ ...entry, status: "rejected", reason: `not a photograph or a video — it is ${what}, whatever its name says${hint}` });
      continue;
    }
    entry.type = kind.type;
    const dupe = library.get(got.sha256) ?? taken.get(got.sha256) ?? batch.get(got.sha256);
    if (dupe) {
      fs.rmSync(tmp, { force: true });
      record.files.push({ ...entry, status: "duplicate", of: dupe });
      continue;
    }
    const stored = path.join(inbox, `${got.sha256.slice(0, 12)}-${slug(name)}.${kind.type === "jpeg" ? "jpg" : kind.type}`);
    const storedRel = path.relative(OUT, stored).split(path.sep).join("/");
    fs.renameSync(tmp, stored);
    batch.set(got.sha256, storedRel);

    if (dry) {
      record.files.push({ ...entry, status: "would-ingest", kind: kind.kind });
      continue;
    }

    if (kind.kind === "image") {
      sharpLib ??= (await import("sharp")).default;
      const file = `${got.sha256.slice(0, 12)}-${slug(name)}.jpg`;
      const stagedRel = `content/owner-staging/${DATE}/${file}`;
      const staged = path.join(OUT, stagedRel);
      fs.mkdirSync(path.dirname(staged), { recursive: true });
      try {
        /* Rotated upright, resized for the web, metadata dropped (GPS included).
           No colour, grade or retouch of any kind. Staged, not published: the
           grade decides whether it ever reaches public/. */
        const info = await sharpLib(stored, { failOn: "none" })
          .rotate()
          .resize({ width: WEB_EDGE, height: WEB_EDGE, fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 86, mozjpeg: true })
          .toFile(staged);
        const stagedSha = crypto.createHash("sha256").update(fs.readFileSync(staged)).digest("hex");
        /* Any pending-grade entry still naming these bytes or this path is one whose
           staged file was gone (every other entry for them made this a duplicate
           above), so this staging replaces it rather than queueing the photograph twice. */
        queue.queue = queue.queue.filter((q) => !(q.status === "pending-grade" && (q.originalSha256 === got.sha256 || q.staged === stagedRel)));
        queue.queue.push({
          staged: stagedRel,
          publishAs: `/images/_owner/${DATE}/${file}`,
          stagedSha256: stagedSha,
          originalSha256: got.sha256,
          provenance: PROVENANCE,
          tier: "A",
          origin: "camera",
          width: info.width,
          height: info.height,
          status: "pending-grade",
          added: DATE,
        });
        record.files.push({ ...entry, status: "staged", kind: "image", staged: stagedRel, width: info.width, height: info.height });
      } catch (e) {
        fs.rmSync(staged, { force: true });
        record.files.push({
          ...entry,
          status: "needs-conversion",
          kind: "image",
          stored: storedRel,
          reason:
            kind.type === "heic"
              ? `HEIC, which the image library on this machine cannot decode (its sharp build reads AVIF, not HEVC). Ask the owner to send JPEG instead — on an iPhone, Settings → Camera → Formats → Most Compatible — or convert ${storedRel} locally and add the JPEG to the Drive folder. Then run the same link again: an item left needs-conversion is retried, never counted as a duplicate.`
              : e.message,
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
    const v = { slug: clipSlug, original: originalRel, originalSha256: got.sha256, provenance: PROVENANCE, type: kind.type, spec: HERO_LOOP, added: DATE };
    if (!ffmpeg) {
      v.status = "needs-transcode";
      v.reason = "ffmpeg is not on this machine. Once it is (on PATH, or FFMPEG_PATH), `node scripts/ingest-drive.mjs --transcode-pending` runs exactly these commands.";
      v.commands = heroVariantPlan(originalRel, `content/media/${clipSlug}`).map((s) => commandLine(s.args));
    } else {
      cutVariants(ffmpeg, v);
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
    writeJson(ledgerPath("content/grading-queue.json"), queue);
    writeJson(ledgerPath("content/media/manifest.json"), media);
    if (plansLedger) writeJson(ledgerPath("content/plans/manifest.json"), plansLedger);
  }

  for (const f of record.files) {
    console.log(`  ${f.status.padEnd(16)} ${(f.type ?? "").padEnd(5)} ${f.name ?? f.idHash}${f.of ? `  = ${f.of}` : ""}${f.reason ? `  — ${f.reason}` : ""}`);
  }
  console.log(`\n${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(", ") || "nothing found"}`);
  if (!dry && (counts.staged ?? 0) > 0) {
    console.log(
      "next: grade them — `npm run grading:sheet -- <new empty sheetDir> --queue`, the grade-photo-library pass " +
        "with the arguments it prints, then `npm run grading:merge -- <output.json> <sheetDir>`, which publishes " +
        "only an A or B with no flag and declares its provenance"
    );
  }
  if (!dry && (counts.stored ?? 0) > 0) {
    console.log(
      `next: nothing was published. The plans are in content/plans/${DATE}/ on this machine only (gitignored) and recorded ` +
        "unverified in content/plans/manifest.json — commit the manifest, never the drawings. Whether a plan shows the " +
        "estate as built is the owner's ruling, recorded by hand in DECISIONS.md; no script makes it."
    );
  }
  if (!dry && (counts["needs-transcode"] ?? 0) > 0) {
    console.log("next: once ffmpeg is available, `node scripts/ingest-drive.mjs --transcode-pending`");
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((e) => {
    console.error(`ingest failed: ${e.message}`);
    process.exit(1);
  });
}
