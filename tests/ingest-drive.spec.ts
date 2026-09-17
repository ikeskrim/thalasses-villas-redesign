import { test, expect } from "@playwright/test";
import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import sharp from "sharp";

/**
 * THE OWNER MATERIAL PIPELINE, AGAINST A DUMMY DRIVE FOLDER.
 *
 * No owner link exists yet, so the folder is a local server speaking the two
 * public Drive formats the script reads, with the two Google hosts pointed at
 * it. The script is run exactly as the maintainer runs it. What each of those
 * two formats rests on, precisely:
 *
 *   THE FOLDER LISTING WAS CAPTURED LIVE. `tests/fixtures/drive/
 *   embeddedfolderview-live-2026-09-14.html` is Google's public
 *   `embeddedfolderview` page for the public test folder the gdown project uses
 *   (id 15uNXeRBIhVvZJIhL4yTw4IsStMhUaaxl), fetched with a single GET on
 *   2026-09-14 and saved byte for byte. The real parser is run over it below,
 *   and the mock's entry markup follows it. Nothing was downloaded from that
 *   folder. The `resourcekey` on an entry's link is NOT in that capture (its
 *   items need none) and is modelled.
 *
 *   THE DOWNLOAD, AND ITS CONFIRMATION PAGE, ARE STILL MODELLED. Drive shows the
 *   confirmation page only for a file too large to virus-scan, and capturing it
 *   means downloading from Drive, which this suite does not do. The mock's
 *   `download-form` with hidden inputs is the shape the script parses; it has not
 *   been checked against today's page, and a large file on the owner's first link
 *   is the first thing to watch.
 *
 * The folder is built to be hostile: a PDF wearing a .jpg name, an M4A wearing an
 * .mp4 name, a text file, a photograph already in the library, the same photograph
 * twice, a HEIC this machine cannot decode, a filename that tries to climb out of
 * its directory, a listing entry that links off Drive, a photograph carrying GPS,
 * and a real-structure MP4 behind a confirmation page.
 */

const REPO = process.cwd();
const DATE = "2026-01-02";
const LIVE_LISTING = path.join(REPO, "tests", "fixtures", "drive", "embeddedfolderview-live-2026-09-14.html");
const FAKE_FFMPEG = path.join(REPO, "tests", "fixtures", "drive", "fake-ffmpeg.mjs");
const IDS = {
  root: "ROOTfolder0000000001",
  sub: "SUBfolder00000000002",
  photo: "PHOTOfile0000000003",
  photoAgain: "PHOTOagain000000004",
  pdf: "PDFfile000000000005",
  text: "TEXTfile00000000006",
  dupe: "DUPEfile00000000007",
  video: "VIDEOfile0000000008",
  offsite: "OFFSITEentry0000009",
  m4a: "M4Afile000000000010",
  heic: "HEICfile00000000011",
  second: "SECONDphoto00000012",
  converted: "CONVERTEDjpg0000013",
  dwgFile: "DWGfile000000000014",
  dxfFile: "DXFfile000000000015",
  binaryDxfFile: "BINDXFfile000000016",
  keyed: "KEYEDfolder00000020",
  keyedPhoto: "KEYEDphoto000000021",
  empty: "EMPTYfolder00000030",
  drift: "DRIFTfolder00000031",
  missing: "MISSINGfolder000032",
};
const KEYS = { folder: "0-folderKEYabc123", photo: "0-photoKEYxyz789" };

/* The live page's entry shape (see the capture), trimmed of its icon markup. */
const entry = (id: string, title: string, href: string) =>
  `<div class="flip-entry" id="entry-${id}" tabindex="0" role="link"><div class="flip-entry-info"><a href="${href}" target="_blank"><div class="flip-entry-visual"></div><div class="flip-entry-title">${title}</div></a></div><div class="flip-entry-last-modified"><div>1/2/26</div></div></div>`;
const fileHref = (id: string) => `https://drive.google.com/file/d/${id}/view?usp=drive_web`;
const listing = (entries: string[]) => `<!DOCTYPE html><html><body><div class="flip-entries">${entries.join("")}</div></body></html>`;

/* ------------------------------------------------ containers, built to spec -- */

const u32 = (n: number) => {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n);
  return b;
};
/* ISO-BMFF: [u32 size][4cc][body]. */
const box = (type: string, ...body: Buffer[]) => {
  const data = Buffer.concat(body);
  return Buffer.concat([u32(8 + data.length), Buffer.from(type, "latin1"), data]);
};
const trak = (handler: "vide" | "soun") =>
  box(
    "trak",
    box("tkhd", Buffer.alloc(84)),
    box(
      "mdia",
      box("mdhd", Buffer.alloc(24)),
      /* version+flags, pre_defined, handler_type, reserved, name */
      box("hdlr", Buffer.alloc(8), Buffer.from(handler, "latin1"), Buffer.alloc(12), Buffer.from(handler === "vide" ? "VideoHandler\0" : "SoundHandler\0", "latin1")),
      box("minf", handler === "vide" ? box("vmhd", Buffer.alloc(12)) : box("smhd", Buffer.alloc(8)), box("dinf", box("dref", u32(0), u32(0))), box("stbl", box("stsd", u32(0), u32(0))))
    )
  );
/* The same box with size field 1 and a u64 size after the type — legal for any box. */
const box64 = (type: string, ...body: Buffer[]) => {
  const data = Buffer.concat(body);
  const size = Buffer.alloc(8);
  size.writeBigUInt64BE(BigInt(16 + data.length));
  return Buffer.concat([u32(1), Buffer.from(type, "latin1"), size, data]);
};
function isoFile(major: string, compatible: string[], handlers: ("vide" | "soun")[], opts: { mdat?: number; moovLast?: boolean; moov64?: boolean } = {}) {
  const ftyp = box("ftyp", Buffer.from(major, "latin1"), u32(0x200), Buffer.from(compatible.join(""), "latin1"));
  const moov = (opts.moov64 ? box64 : box)("moov", box("mvhd", Buffer.alloc(100)), ...handlers.map(trak));
  const mdat = box("mdat", Buffer.alloc(opts.mdat ?? 4096, 7));
  return Buffer.concat(opts.moovLast ? [ftyp, mdat, moov] : [ftyp, moov, mdat]);
}
/* EBML: [ID][size vint][body]; 8-byte sizes throughout, which is valid EBML. */
const ebml = (id: number[], ...body: Buffer[]) => {
  const data = Buffer.concat(body);
  const size = Buffer.alloc(8);
  size[0] = 0x01;
  size.writeUIntBE(data.length, 2, 6);
  return Buffer.concat([Buffer.from(id), size, data]);
};
function matroska(docType: string, tracks: { type: number; codec: string }[]) {
  return Buffer.concat([
    ebml([0x1a, 0x45, 0xdf, 0xa3], ebml([0x42, 0x86], Buffer.from([1])), ebml([0x42, 0x82], Buffer.from(docType, "latin1"))),
    ebml(
      [0x18, 0x53, 0x80, 0x67],
      ebml([0x15, 0x49, 0xa9, 0x66], ebml([0x2a, 0xd7, 0xb1], Buffer.from([0x0f, 0x42, 0x40]))),
      ebml(
        [0x16, 0x54, 0xae, 0x6b],
        ...tracks.map((t, i) => ebml([0xae], ebml([0xd7], Buffer.from([i + 1])), ebml([0x83], Buffer.from([t.type])), ebml([0x86], Buffer.from(t.codec, "latin1"))))
      ),
      ebml([0x1f, 0x43, 0xb6, 0x75], ebml([0xe7], Buffer.from([0])), Buffer.alloc(2048, 3))
    ),
  ]);
}

/* RIFF: [4cc][u32 LE size][data], padded to even; LIST data opens with its list type. */
const le32 = (n: number) => {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n);
  return b;
};
const chunk = (id: string, ...body: Buffer[]) => {
  const data = Buffer.concat(body);
  return Buffer.concat([Buffer.from(id, "latin1"), le32(data.length), data, Buffer.alloc(data.length & 1)]);
};
const riffList = (type: string, ...body: Buffer[]) => chunk("LIST", Buffer.from(type, "latin1"), ...body);
/* AVI: hdrl (avih, then one strl per stream: a 56-byte strh opening with the stream type, and strf), then movi. */
function avi(streams: ("vids" | "auds")[]) {
  const body = Buffer.concat([
    riffList(
      "hdrl",
      chunk("avih", Buffer.alloc(56)),
      ...streams.map((s) => riffList("strl", chunk("strh", Buffer.from(s, "latin1"), Buffer.alloc(52)), chunk("strf", Buffer.alloc(s === "vids" ? 40 : 18))))
    ),
    riffList("movi", chunk("00dc", Buffer.alloc(1023, 5))),
  ]);
  return Buffer.concat([Buffer.from("RIFF", "latin1"), le32(4 + body.length), Buffer.from("AVI ", "latin1"), body]);
}

function firstLibraryJpeg(): string {
  const dir = path.join(REPO, "public", "images", "_site");
  const f = fs.readdirSync(dir).find((n) => /\.jpe?g$/i.test(n));
  if (!f) throw new Error("no library JPEG to duplicate");
  return path.join(dir, f);
}

const solid = (r: number, g: number, b: number) => sharp({ create: { width: 1200, height: 900, channels: 3, background: { r, g, b } } }).jpeg({ quality: 90 }).toBuffer();

async function fixtures() {
  const photo = await sharp({ create: { width: 1600, height: 1000, channels: 3, background: { r: 40, g: 90, b: 130 } } })
    .jpeg({ quality: 90 })
    .withExif({ IFD0: { Artist: "owner phone" }, IFD3: { GPSLatitudeRef: "N", GPSLongitudeRef: "E" } })
    .toBuffer();
  const pdf = Buffer.from("%PDF-1.7\n%\xE2\xE3\xCF\xD3\n1 0 obj << /Type /Catalog >> endobj\ntrailer << >>\n%%EOF\n", "latin1");
  const text = Buffer.from("just some notes about the villas\n");
  const dupe = fs.readFileSync(firstLibraryJpeg());
  const video = isoFile("isom", ["isom", "iso2", "avc1", "mp41"], ["vide", "soun"]);
  const m4a = isoFile("M4A ", ["M4A ", "mp42", "isom"], ["soun"]);
  /* An iPhone HEIC's brand box over a body nothing can decode — and this machine's
     sharp could not decode a real one either (its heif input is AVIF only). */
  const heic = Buffer.concat([box("ftyp", Buffer.from("heic", "latin1"), u32(0), Buffer.from("mif1heic", "latin1")), box("meta", Buffer.alloc(64, 1)), box("mdat", Buffer.alloc(2048, 9))]);
  return { photo, pdf, text, dupe, video, m4a, heic, second: await solid(200, 170, 120), converted: await solid(90, 140, 60) };
}

/* ------------------------------------------------------ plans, built to spec -- */

/* A DWG header: the six-byte release code, then the NUL-padded bytes that follow
   it in every release (zeros, a maintenance byte, a byte of 1), then body. */
const dwg = (version: string) => Buffer.concat([Buffer.from(version, "latin1"), Buffer.alloc(5), Buffer.from([0x3f, 0x01]), Buffer.alloc(512, 0x5a)]);
/* Binary DXF opens with a 22-byte sentinel (Autodesk's DXF reference). */
const binaryDxf = () => Buffer.concat([Buffer.from("AutoCAD Binary DXF\r\n\x1a\0", "latin1"), Buffer.from("\0\0SECTION\0\x02\0HEADER\0", "latin1"), Buffer.alloc(64, 1)]);
/* ASCII DXF: group code and value on alternate lines. */
const dxfText = (lines: string[], eol = "\n") => Buffer.from(lines.join(eol) + eol, "latin1");
const DXF = {
  lf: dxfText(["0", "SECTION", "2", "HEADER", "9", "$ACADVER", "1", "AC1015", "9", "$INSBASE", "10", "0.0", "0", "ENDSEC", "0", "EOF"]),
  crlf: dxfText(["999", "written by a test", "  0", "SECTION", "  2", "ENTITIES", "  0", "LINE", "  8", "0", " 10", "0.0", " 20", "0.0", "  0", "ENDSEC", "  0", "EOF"], "\r\n"),
  bom: Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), dxfText(["0", "SECTION", "2", "HEADER", "9", "$ACADVER", "1", "AC1032", "0", "ENDSEC", "0", "EOF"])]),
  headerOnly: dxfText([" 0", "SECTION", " 2", "HEADER", " 9", "$ACADVER", " 1", "AC1027", " 0", "ENDSEC", " 0", "EOF"], "\r\n"),
};

function filesUnder(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? filesUnder(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}

type Listing = { html: string; key?: string };
type Stored = { body: Buffer; key?: string; confirm?: boolean };

async function mockDrive(listings: Record<string, Listing>, files: Record<string, Stored>) {
  const seen = new Set<string>();
  const server = http.createServer((req, res) => {
    const u = new URL(req.url ?? "/", "http://mock");
    const id = u.searchParams.get("id") ?? "";
    const key = u.searchParams.get("resourcekey") ?? undefined;
    if (id === IDS.offsite) seen.add("asked-for-offsite-entry");
    if (u.pathname === "/embeddedfolderview") {
      res.setHeader("content-type", "text/html; charset=utf-8");
      const l = listings[id];
      if (!l || (l.key && l.key !== key)) {
        res.statusCode = 404;
        return res.end("<html>not found</html>");
      }
      return res.end(l.html);
    }
    if (u.pathname === "/download") {
      const f = files[id];
      if (!f || (f.key && f.key !== key)) {
        res.statusCode = 404;
        return res.end();
      }
      if (f.confirm && u.searchParams.get("confirm") !== "t") {
        seen.add("interstitial-served");
        res.setHeader("content-type", "text/html; charset=utf-8");
        return res.end(
          `<html><body><form id="download-form" action="/download" method="get">` +
            `<input type="hidden" name="id" value="${id}"><input type="hidden" name="export" value="download">` +
            `<input type="hidden" name="confirm" value="t"><input type="hidden" name="uuid" value="abc-123"></form></body></html>`
        );
      }
      if (f.confirm) seen.add("confirmed-download");
      res.setHeader("content-type", "application/octet-stream");
      res.setHeader("content-disposition", `attachment; filename="download.bin"`);
      return res.end(f.body);
    }
    res.statusCode = 404;
    res.end();
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { server, base, seen };
}

/* Asynchronous on purpose: the mock Drive lives in this process, and a
   synchronous spawn would block the very server the script is talking to. */
function run(script: string, args: string[], env: Record<string, string> = {}, cwd = REPO) {
  return new Promise<{ status: number | null; stdout: string; stderr: string }>((resolve) => {
    const child = spawn(process.execPath, [path.join(REPO, "scripts", script), ...args], {
      cwd,
      env: { ...process.env, ...env },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    const timer = setTimeout(() => child.kill(), 170_000);
    child.on("close", (status) => {
      clearTimeout(timer);
      resolve({ status, stdout, stderr });
    });
  });
}
const ingest = (args: string[], env: Record<string, string> = {}) => run("ingest-drive.mjs", args, env);
const NO_FFMPEG = { FFMPEG_PATH: "ffmpeg-deliberately-absent", INGEST_FFMPEG_SHIM: "" };

/* The hero-loop cut, written out by hand rather than read from heroVariantPlan(),
   so that a change to the plan cannot move both sides of an assertion at once. */
const BUDGET = 2.5 * 1024 * 1024; /* 2,621,440 bytes */
const LADDER = [
  { name: "poster.jpg", kind: "poster", rung: 1920, budget: false },
  { name: "loop-1920.mp4", kind: "mp4", rung: 1920, budget: true },
  { name: "loop-1920.webm", kind: "webm", rung: 1920, budget: true },
  { name: "loop-1280.webm", kind: "webm", rung: 1280, budget: true },
  { name: "loop-960.webm", kind: "webm", rung: 960, budget: true },
];
/* Scaled by the long edge, never enlarged. */
const longEdgeScale = (edge: number) => `scale=w='min(${edge},iw)':h='min(${edge},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`;
/* Every hero loop under `dir` larger than the budget (the poster has none; originals are not loops). */
const overBudgetFiles = (dir: string) =>
  filesUnder(dir).filter((f) => /\.(mp4|webm)$/.test(f) && !f.includes(`${path.sep}originals${path.sep}`) && fs.statSync(f).size > BUDGET);
/* The argv lists the fake ffmpeg logged, one per run, in order. */
const ranLog = (log: string): string[][] =>
  fs.existsSync(log)
    ? fs
        .readFileSync(log, "utf-8")
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((l) => JSON.parse(l))
    : [];

test.describe("owner material pipeline", () => {
  test.setTimeout(300_000);

  test("accepts only Drive share links, and only from its argument", async () => {
    const { parseDriveLink } = await import("../scripts/ingest-drive.mjs");
    expect(parseDriveLink("https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp?usp=sharing")).toEqual({ kind: "folder", id: "1AbCdEfGhIjKlMnOp" });
    expect(parseDriveLink("https://drive.google.com/drive/u/0/folders/1AbCdEfGhIjKlMnOp")).toEqual({ kind: "folder", id: "1AbCdEfGhIjKlMnOp" });
    expect(parseDriveLink("https://drive.google.com/drive/mobile/folders/1AbCdEfGhIjKlMnOp?usp=sharing")).toEqual({ kind: "folder", id: "1AbCdEfGhIjKlMnOp" });
    expect(parseDriveLink("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view")).toEqual({ kind: "file", id: "1AbCdEfGhIjKlMnOp" });
    expect(parseDriveLink("https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp?resourcekey=0-AbC_d-123")).toEqual({
      kind: "folder",
      id: "1AbCdEfGhIjKlMnOp",
      resourceKey: "0-AbC_d-123",
    });
    expect(parseDriveLink("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view?usp=sharing&resourcekey=0-XyZ")).toEqual({
      kind: "file",
      id: "1AbCdEfGhIjKlMnOp",
      resourceKey: "0-XyZ",
    });
    for (const bad of [
      "http://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp",
      "https://drive.google.com.evil.example/drive/folders/1AbCdEfGhIjKlMnOp",
      "https://evil.example/drive/folders/1AbCdEfGhIjKlMnOp",
      "https://user:pw@drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp",
      "https://drive.google.com/drive/folders/..%2F..",
      "https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp?resourcekey=..%2Fescape",
      "https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp?resourcekey=",
      "not a link",
    ]) {
      expect(parseDriveLink(bad), bad).toBeNull();
    }
    const r = await ingest(["https://evil.example/drive/folders/1AbCdEfGhIjKlMnOp"], {});
    expect(r.status).toBe(2);
  });

  test("the listing parser reads Drive's real page, captured live on 2026-09-14", async () => {
    const { parseFolderListing } = await import("../scripts/ingest-drive.mjs");
    /* Fetched once, 2026-09-14, by a single
       GET https://drive.google.com/embeddedfolderview?id=15uNXeRBIhVvZJIhL4yTw4IsStMhUaaxl
       — the public test folder gdown's own tests list — and saved verbatim. It is
       Google's markup, read here as data. */
    const html = fs.readFileSync(LIVE_LISTING, "utf-8");
    const entries = parseFolderListing(html);
    const onPage = (html.match(/class="flip-entry"/g) ?? []).length;
    expect(onPage, "the capture holds entries").toBeGreaterThan(0);
    expect(entries.length, "every entry on the page parses — none silently dropped").toBe(onPage);
    for (const e of entries) {
      expect(e.id).toMatch(/^[A-Za-z0-9_-]{25,}$/);
      expect(e.name.length).toBeGreaterThan(0);
    }
    expect(entries.filter((e) => e.kind === "folder").map((e) => e.name)).toContain("deep_folder");
    expect(entries.filter((e) => e.kind === "file").map((e) => e.name)).toContain("spam.txt");
    /* A Google Doc or Sheet lives at docs.google.com/document|spreadsheets, not
       /file/d/: not a file the download endpoint serves, so it is skipped, not guessed at. */
    expect(
      entries
        .filter((e) => e.kind === "skipped")
        .map((e) => e.name)
        .sort()
    ).toEqual(["gdown.docx", "gdown.xlsx"]);
  });

  test("decides type by content, never by name — and a video must carry a video track", async () => {
    const { sniff, sniffFile } = await import("../scripts/ingest-drive.mjs");
    const f = await fixtures();
    expect(sniff(f.photo)).toEqual({ kind: "image", type: "jpeg" });
    expect(sniff(f.video)).toEqual({ kind: "video", type: "mp4" });
    expect(sniff(f.pdf)).toBeNull();
    expect(sniff(f.text)).toBeNull();
    expect(sniff(await sharp({ create: { width: 4, height: 4, channels: 3, background: "#fff" } }).png().toBuffer())).toEqual({ kind: "image", type: "png" });
    expect(sniff(await sharp({ create: { width: 4, height: 4, channels: 3, background: "#fff" } }).webp().toBuffer())).toEqual({ kind: "image", type: "webp" });

    /* Audio in a video container. Every one of these was admitted as video before. */
    expect(sniff(f.m4a), "M4A").toBeNull();
    expect(sniff(isoFile("M4A ", ["M4A ", "mp42", "isom"], ["vide", "soun"])), "an audio major brand, whatever tracks ride along").toBeNull();
    expect(sniff(isoFile("3gp4", ["3gp4", "isom"], ["soun"])), "3GP, audio only").toBeNull();
    expect(sniff(isoFile("mp42", ["mp42", "isom"], ["soun"])), "MP4 brand, audio only").toBeNull();
    expect(sniff(matroska("matroska", [{ type: 2, codec: "A_OPUS" }])), "MKA, audio only").toBeNull();
    expect(sniff(avi(["auds"])), "AVI, audio stream only").toBeNull();

    /* Real structure with a video track is video. */
    expect(sniff(isoFile("3gp4", ["3gp4", "isom"], ["vide", "soun"]))).toEqual({ kind: "video", type: "mp4" });
    expect(sniff(isoFile("qt  ", ["qt  "], ["soun", "vide"]))).toEqual({ kind: "video", type: "mov" });
    expect(sniff(matroska("webm", [{ type: 2, codec: "A_OPUS" }, { type: 1, codec: "V_VP9" }]))).toEqual({ kind: "video", type: "webm" });
    expect(sniff(matroska("matroska", [{ type: 1, codec: "V_MPEG4/ISO/AVC" }]))).toEqual({ kind: "video", type: "mkv" });
    expect(sniff(avi(["auds", "vids"]))).toEqual({ kind: "video", type: "avi" });

    /* A phone writes the track table after the picture data. On a file longer than
       the read window it is only in the tail, and the tail is read. */
    const tmp = path.join(os.tmpdir(), `ingest-sniff-${process.pid}-${Date.now()}.bin`);
    try {
      const long = isoFile("isom", ["isom", "mp42"], ["vide"], { mdat: 12 * 1024 * 1024, moovLast: true });
      expect(sniff(long.subarray(0, 8 * 1024 * 1024)), "the head alone holds no track table").toBeNull();
      fs.writeFileSync(tmp, long);
      expect(sniffFile(tmp)).toEqual({ kind: "video", type: "mp4" });
      fs.writeFileSync(tmp, isoFile("isom", ["isom", "mp42"], ["soun"], { mdat: 12 * 1024 * 1024, moovLast: true }));
      expect(sniffFile(tmp), "a long audio-only MP4").toBeNull();
      /* The track table's box written with a 64-bit size: size field 1, u64 after the type. */
      fs.writeFileSync(tmp, isoFile("isom", ["isom", "mp42"], ["vide"], { mdat: 12 * 1024 * 1024, moovLast: true, moov64: true }));
      expect(sniffFile(tmp), "a long MP4 whose moov has a 64-bit size").toEqual({ kind: "video", type: "mp4" });
      fs.writeFileSync(tmp, isoFile("isom", ["isom", "mp42"], ["soun"], { mdat: 12 * 1024 * 1024, moovLast: true, moov64: true }));
      expect(sniffFile(tmp), "the same, audio only").toBeNull();
    } finally {
      fs.rmSync(tmp, { force: true });
    }
  });

  test("a plan is decided by content too — PDF, DWG, DXF or an image of a plan, and nothing else", async () => {
    const { sniff, sniffPlan } = await import("../scripts/ingest-drive.mjs");
    const f = await fixtures();

    /* PDF: a version, and an %%EOF at the end — a download cut short is not a plan. */
    expect(sniffPlan(f.pdf)).toEqual({ kind: "plan", type: "pdf", version: "1.7" });
    expect(sniffPlan(f.pdf.subarray(0, f.pdf.length - 7)), "a PDF with no %%EOF").toBeNull();
    expect(sniffPlan(Buffer.from("%PDF-9.1\ntrailer << >>\n%%EOF\n", "latin1")), "no 1.x or 2.x version").toBeNull();
    /* A file longer than the read window: the %%EOF is looked for in its tail, not the head. */
    const head = Buffer.concat([Buffer.from("%PDF-1.4\n%%EOF\n", "latin1"), Buffer.alloc(4096, 0x20)]);
    expect(sniffPlan(head, Buffer.concat([Buffer.alloc(4096, 0x20), Buffer.from("\n%%EOF\n", "latin1")]))).toEqual({ kind: "plan", type: "pdf", version: "1.4" });
    expect(sniffPlan(head, Buffer.alloc(4096, 0x20)), "an %%EOF near the start is not the end of the file").toBeNull();
    /* A file inside the read window has no tail: the %%EOF must be in the head's own last 1024 bytes. */
    expect(sniffPlan(Buffer.concat([Buffer.from("%PDF-1.4\n%%EOF\n", "latin1"), Buffer.alloc(3000, 0x20)])), "a head-only PDF whose %%EOF is not near its end").toBeNull();
    expect(sniffPlan(Buffer.concat([Buffer.from("%PDF-1.4\n", "latin1"), Buffer.alloc(3000, 0x20), Buffer.from("%%EOF\n", "latin1")]))).toEqual({ kind: "plan", type: "pdf", version: "1.4" });

    /* DWG: a known release code, and NUL padding after it. */
    for (const v of ["AC1015", "AC1018", "AC1021", "AC1024", "AC1027", "AC1032"]) {
      expect(sniffPlan(dwg(v)), v).toEqual({ kind: "plan", type: "dwg", version: v });
    }
    expect(sniffPlan(dwg("AC9999")), "an unknown release code").toBeNull();
    expect(sniffPlan(dwg("AC1035")), "AC1035, not established as a real code").toBeNull();
    const textAboutDwg = Buffer.from(
      "AC1015 is the release code a DWG from AutoCAD 2000 opens with. This note is plain text about it, and it runs well past the first one hundred and twenty-eight bytes.\n"
    );
    expect(sniffPlan(textAboutDwg), "a text file that opens with a release code").toBeNull();
    const nulLate = Buffer.concat([Buffer.from("AC1015", "latin1"), Buffer.alloc(200, 0x41), Buffer.alloc(8)]);
    expect(sniffPlan(nulLate), "a release code whose first NUL is past byte 128").toBeNull();
    expect(sniffPlan(Buffer.from("AC10", "latin1")), "four bytes").toBeNull();
    expect(sniffPlan(Buffer.from("AC1015", "latin1").subarray(0, 5)), "five bytes of a release code").toBeNull();
    /* The two five-character codes end in a NUL; all six bytes are compared, never a prefix. */
    expect(sniffPlan(dwg("AC1.2")), "AC1.2").toEqual({ kind: "plan", type: "dwg", version: "AC1.2" });
    expect(sniffPlan(dwg("AC1.3")), "AC1.3").toEqual({ kind: "plan", type: "dwg", version: "AC1.3" });
    expect(sniffPlan(dwg("AC1.40")), "AC1.40").toEqual({ kind: "plan", type: "dwg", version: "AC1.40" });
    expect(sniffPlan(dwg("AC1.29")), "AC1.29 is not AC1.2").toBeNull();
    expect(sniffPlan(dwg("AC1.3Z")), "AC1.3Z is not AC1.3").toBeNull();

    /* DXF, ASCII and binary. */
    expect(sniffPlan(DXF.lf), "LF").toEqual({ kind: "plan", type: "dxf", version: "AC1015", encoding: "ascii" });
    expect(sniffPlan(DXF.crlf), "CRLF, padded codes, a 999 comment first").toEqual({ kind: "plan", type: "dxf", version: null, encoding: "ascii" });
    expect(sniffPlan(DXF.bom), "a UTF-8 BOM").toEqual({ kind: "plan", type: "dxf", version: "AC1032", encoding: "ascii" });
    expect(sniffPlan(binaryDxf()), "the binary sentinel").toEqual({ kind: "plan", type: "dxf", version: null, encoding: "binary" });
    expect(sniffPlan(Buffer.concat([DXF.lf, Buffer.from("0\n\0\n", "latin1")])), "a well-formed ASCII DXF with a NUL in it is not text").toBeNull();
    expect(sniffPlan(dxfText(["0", "SECTION", "2", "NOTES", "0", "ENDSEC"])), "an unknown section").toBeNull();
    expect(sniffPlan(dxfText(["notes", "0", "SECTION", "2", "HEADER"])), "a SECTION that is not where a DXF opens").toBeNull();
    expect(
      sniffPlan(dxfText(["0", "SECTION", "2", "HEADER", "9", "$ACADVER", "1", "drawn by someone", "0", "ENDSEC"])),
      "a $ACADVER that is not a release code is not recorded"
    ).toEqual({ kind: "plan", type: "dxf", version: null, encoding: "ascii" });

    /* An image of a plan, by the photograph signatures. */
    expect(sniffPlan(f.photo)).toEqual({ kind: "plan", type: "jpeg" });
    expect(sniffPlan(await sharp({ create: { width: 8, height: 8, channels: 3, background: "#fff" } }).tiff().toBuffer())).toEqual({ kind: "plan", type: "tiff" });

    /* Not plans. */
    const svg = Buffer.from('<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>\n');
    const html = Buffer.from("<!DOCTYPE html><html><body>site plan</body></html>\n");
    const zip = Buffer.concat([Buffer.from("PK\x03\x04", "latin1"), Buffer.alloc(64)]);
    for (const [label, b] of [["text", f.text], ["html", html], ["zip", zip], ["svg", svg], ["m4a", f.m4a], ["video", f.video]] as const) {
      expect(sniffPlan(b), label).toBeNull();
    }

    /* And sniff() is unchanged: an ordinary run still refuses every plan format. */
    for (const [label, b] of [["pdf", f.pdf], ["dwg", dwg("AC1015")], ["ascii dxf", DXF.lf], ["binary dxf", binaryDxf()]] as const) {
      expect(sniff(b), label).toBeNull();
    }
  });

  test("a listing that yields nothing, or less than it shows, fails loudly; an ambiguous link with no listing is a file", async () => {
    const f = await fixtures();
    const drifted = `<div class="flip-entry" data-item="${IDS.photo}"><span>renamed.jpg</span></div>`;
    const drive = await mockDrive(
      {
        [IDS.empty]: { html: listing([]) },
        /* Entries on the page in a shape the parser no longer knows: markup drift. */
        [IDS.drift]: { html: `<!DOCTYPE html><html><body><div class="flip-entries">${drifted}</div></body></html>` },
        /* One entry still parses and one does not: partial drift, which must not pass as a smaller folder. */
        [IDS.sub]: { html: listing([entry(IDS.second, "second.jpg", fileHref(IDS.second)), drifted]) },
        /* What Drive answers when a FILE id is asked for as a folder has not been captured; an empty page is one reading. */
        [IDS.photo]: { html: listing([]) },
      },
      { [IDS.photo]: { body: f.photo }, [IDS.second]: { body: f.second } }
    );
    const out = fs.mkdtempSync(path.join(os.tmpdir(), "ingest-drive-empty-"));
    const env = { INGEST_DRIVE_BASE: drive.base, INGEST_DOWNLOAD_BASE: drive.base, INGEST_OUT_ROOT: out, INGEST_DATE: DATE, ...NO_FFMPEG };
    const folder = (id: string) => `https://drive.google.com/drive/folders/${id}`;
    try {
      const drift = await ingest([folder(IDS.drift), "--dry-run"], env);
      expect(drift.status, drift.stdout).toBe(1);
      expect(drift.stderr).toContain("markup has changed");
      const partial = await ingest([folder(IDS.sub), "--dry-run", "--allow-empty"], env);
      expect(partial.status, partial.stdout).toBe(1);
      expect(partial.stderr).toContain("shows 2 entries and 1 of them parse");
      /* `/open?id=` over an empty listing, and `/uc?id=` over a refused one: both are tried as a file. */
      const openEmpty = await ingest([`https://drive.google.com/open?id=${IDS.photo}`, "--dry-run"], env);
      expect(openEmpty.status, openEmpty.stderr).toBe(0);
      expect(openEmpty.stdout).toContain("would-ingest");
      const ucRefused = await ingest([`https://drive.google.com/uc?id=${IDS.second}`, "--dry-run"], env);
      expect(ucRefused.status, ucRefused.stderr).toBe(0);
      expect(ucRefused.stdout).toContain("would-ingest");
      const empty = await ingest([folder(IDS.empty), "--dry-run"], env);
      expect(empty.status, empty.stdout).toBe(1);
      expect(empty.stderr).toContain("--allow-empty");
      const allowed = await ingest([folder(IDS.empty), "--dry-run", "--allow-empty"], env);
      expect(allowed.status, allowed.stderr).toBe(0);
      expect(allowed.stdout).toContain("nothing found");
      const missing = await ingest([folder(IDS.missing), "--dry-run"], env);
      expect(missing.status).toBe(1);
      expect(missing.stderr).toContain("could not be listed");
      for (const x of [drift, partial, openEmpty, ucRefused, empty, allowed, missing]) {
        for (const id of [IDS.empty, IDS.drift, IDS.sub, IDS.missing, IDS.photo, IDS.second]) expect(x.stdout + x.stderr).not.toContain(id);
      }
    } finally {
      drive.server.close();
      fs.rmSync(out, { recursive: true, force: true });
    }
  });

  test("an older share: a mobile link with resource keys lists and downloads, and no key is written", async () => {
    const f = await fixtures();
    const drive = await mockDrive(
      { [IDS.keyed]: { key: KEYS.folder, html: listing([entry(IDS.keyedPhoto, "terrace.jpg", `${fileHref(IDS.keyedPhoto)}&amp;resourcekey=${KEYS.photo}`)]) } },
      { [IDS.keyedPhoto]: { body: f.second, key: KEYS.photo } }
    );
    const out = fs.mkdtempSync(path.join(os.tmpdir(), "ingest-drive-keyed-"));
    const env = { INGEST_DRIVE_BASE: drive.base, INGEST_DOWNLOAD_BASE: drive.base, INGEST_OUT_ROOT: out, INGEST_DATE: DATE, ...NO_FFMPEG };
    try {
      const r = await ingest([`https://drive.google.com/drive/mobile/folders/${IDS.keyed}?resourcekey=${KEYS.folder}`], env);
      expect(r.status, r.stderr + r.stdout).toBe(0);
      const last = JSON.parse(fs.readFileSync(path.join(out, "content", "owner-intake.json"), "utf-8")).runs.at(-1);
      expect(last.files).toEqual([expect.objectContaining({ name: "terrace.jpg", status: "staged" })]);
      for (const rel of ["content/owner-intake.json", "content/grading-queue.json", "content/media/manifest.json"]) {
        const text = fs.readFileSync(path.join(out, rel), "utf-8");
        for (const secret of [KEYS.folder, KEYS.photo, IDS.keyed, IDS.keyedPhoto]) expect(text, `${rel} leaks ${secret}`).not.toContain(secret);
      }
      for (const secret of [KEYS.folder, KEYS.photo, IDS.keyed, IDS.keyedPhoto]) expect(r.stdout + r.stderr).not.toContain(secret);
    } finally {
      drive.server.close();
      fs.rmSync(out, { recursive: true, force: true });
    }
  });

  test("a dummy folder: stages, grades through the queue, publishes only a pass, retries the unfinished, publishes no key", async () => {
    const { heroVariantPlan, commandLine } = await import("../scripts/ingest-drive.mjs");
    const f = await fixtures();
    const files: Record<string, Stored> = {
      [IDS.photo]: { body: f.photo },
      [IDS.photoAgain]: { body: f.photo },
      [IDS.second]: { body: f.second },
      [IDS.pdf]: { body: f.pdf },
      [IDS.text]: { body: f.text },
      [IDS.dupe]: { body: f.dupe },
      [IDS.m4a]: { body: f.m4a },
      [IDS.heic]: { body: f.heic },
      [IDS.video]: { body: f.video, confirm: true },
      [IDS.dwgFile]: { body: dwg("AC1024") },
      [IDS.dxfFile]: { body: DXF.lf },
      [IDS.binaryDxfFile]: { body: binaryDxf() },
    };
    const rootEntries = [
      entry(IDS.photo, "../../escape attempt.JPG", fileHref(IDS.photo)),
      entry(IDS.second, "second.jpg", fileHref(IDS.second)),
      entry(IDS.pdf, "sunset.jpg", fileHref(IDS.pdf)),
      entry(IDS.text, "notes.txt", fileHref(IDS.text)),
      entry(IDS.dupe, "already-have-this.jpg", fileHref(IDS.dupe)),
      entry(IDS.heic, "IMG_0001.HEIC", fileHref(IDS.heic)),
      /* Plans in a photograph folder: refused, each named for what it is, and pointed at --plans. */
      entry(IDS.dwgFile, "villa layout.jpg", fileHref(IDS.dwgFile)),
      entry(IDS.dxfFile, "boundary.dxf", fileHref(IDS.dxfFile)),
      entry(IDS.binaryDxfFile, "levels.dxf", fileHref(IDS.binaryDxfFile)),
      entry(IDS.offsite, "click me.jpg", `https://evil.example/file/d/${IDS.offsite}/view`),
      entry(IDS.sub, "Videos", `https://drive.google.com/drive/folders/${IDS.sub}`),
    ];
    const listings: Record<string, Listing> = {
      [IDS.root]: { html: listing(rootEntries) },
      [IDS.sub]: {
        html: listing([
          entry(IDS.video, "drone pass.MP4", fileHref(IDS.video)),
          entry(IDS.m4a, "drone audio.mp4", fileHref(IDS.m4a)),
          entry(IDS.photoAgain, "copy of photo.jpg", fileHref(IDS.photoAgain)),
        ]),
      },
    };
    const drive = await mockDrive(listings, files);
    const out = fs.mkdtempSync(path.join(os.tmpdir(), "ingest-drive-"));
    const sheetDir = path.join(out, "sheet");
    const env = { INGEST_DRIVE_BASE: drive.base, INGEST_DOWNLOAD_BASE: drive.base, INGEST_OUT_ROOT: out, INGEST_DATE: DATE };
    const link = `https://drive.google.com/drive/folders/${IDS.root}?usp=sharing`;
    const read = (rel: string) => JSON.parse(fs.readFileSync(path.join(out, rel), "utf-8"));
    const lastRun = () => {
      const r = read("content/owner-intake.json").runs.at(-1);
      return { counts: r.counts, byName: Object.fromEntries(r.files.map((x: { name: string }) => [x.name, x])) };
    };
    const printed: string[] = [];
    try {
      /* ---- 1. The first run. ---------------------------------------------- */
      const r = await ingest([link], { ...env, ...NO_FFMPEG });
      printed.push(r.stdout, r.stderr);
      expect(r.status, r.stderr + r.stdout).toBe(0);
      const { byName } = lastRun();

      expect(byName["../../escape attempt.JPG"].status).toBe("staged");
      expect(byName["second.jpg"].status).toBe("staged");
      expect(byName["sunset.jpg"].status).toBe("rejected");
      expect(byName["sunset.jpg"].reason).toContain("pdf");
      expect(byName["sunset.jpg"].reason, "a refused PDF points at the plans run").toContain("--plans");
      for (const [name, what] of [
        ["villa layout.jpg", "dwg"],
        ["boundary.dxf", "dxf"],
        ["levels.dxf", "dxf"] /* the binary sentinel is longer than a 16-byte look */,
      ] as const) {
        expect(byName[name].status, name).toBe("rejected");
        expect(byName[name].reason, name).toContain(`it is ${what},`);
        expect(byName[name].reason, `a refused ${what} points at the plans run`).toContain("--plans");
      }
      expect(byName["drone audio.mp4"].status).toBe("rejected");
      expect(byName["drone audio.mp4"].reason).toContain("audio");
      expect(byName["drone audio.mp4"].reason).not.toContain("--plans");
      expect(byName["notes.txt"].status).toBe("rejected");
      expect(byName["notes.txt"].reason).not.toContain("--plans");
      expect(byName["already-have-this.jpg"].status).toBe("duplicate");
      expect(byName["already-have-this.jpg"].of).toMatch(/^\/images\/_site\//);
      expect(byName["copy of photo.jpg"].status).toBe("duplicate");
      expect(byName["click me.jpg"].status).toBe("skipped");
      expect(byName["IMG_0001.HEIC"].status).toBe("needs-conversion");
      expect(byName["IMG_0001.HEIC"].reason).toContain("Most Compatible");
      expect(byName["drone pass.MP4"].status).toBe("needs-transcode");
      expect(drive.seen.has("interstitial-served") && drive.seen.has("confirmed-download")).toBe(true);
      expect(drive.seen.has("asked-for-offsite-entry")).toBe(false);

      /* The photograph: staged in its dated folder, stripped, and nowhere a build serves from. */
      const staged: string = byName["../../escape attempt.JPG"].staged;
      expect(staged).toMatch(new RegExp(`^content/owner-staging/${DATE}/[0-9a-f]{12}-escape-attempt\\.jpg$`));
      const meta = await sharp(path.join(out, staged)).metadata();
      expect(meta.exif).toBeUndefined();
      expect(meta.format).toBe("jpeg");
      expect(fs.existsSync(path.join(out, "public", "images", "_owner")), "nothing is published before a grade").toBe(false);
      expect(fs.existsSync(path.join(out, "content", "image-provenance.json")), "nothing is declared before a grade").toBe(false);
      expect(fs.readFileSync(path.join(REPO, ".gitignore"), "utf-8")).toMatch(/^content\/owner-staging\/$/m);
      expect(read("content/grading-queue.json").queue).toContainEqual(
        expect.objectContaining({
          staged,
          tier: "A",
          status: "pending-grade",
          provenance: `owner/drive/${DATE}`,
          publishAs: expect.stringMatching(new RegExp(`^/images/_owner/${DATE}/[0-9a-f]{12}-escape-attempt\\.jpg$`)),
        })
      );

      /* The video: original kept local; the recorded commands are the plan heroVariants() runs — all of it. */
      let clip = read("content/media/manifest.json").videos.at(-1);
      expect(clip.original).toMatch(new RegExp(`^content/media/originals/${DATE}/`));
      expect(clip.spec.maxBytes).toBeLessThanOrEqual(2.5 * 1024 * 1024);
      expect(clip.commands).toEqual(heroVariantPlan(clip.original, `content/media/${clip.slug}`).map((s) => commandLine(s.args)));
      expect(clip.commands).toHaveLength(LADDER.length);
      expect(clip.commands[0]).toContain("poster.jpg");
      expect(clip.commands[1]).toContain("loop-1920.mp4");
      expect(clip.commands[1]).toContain("-b:v 2411k -maxrate 2411k -bufsize 4822k");
      for (const [i, name] of [[2, "loop-1920.webm"], [3, "loop-1280.webm"], [4, "loop-960.webm"]] as const) {
        expect(clip.commands[i]).toContain("-c:v libvpx-vp9 -pix_fmt yuv420p -row-mt 1 -deadline good");
        expect(clip.commands[i]).toContain("-b:v 2411k -maxrate 2411k -bufsize 4822k");
        expect(clip.commands[i]).toContain(name);
      }

      /* Refused files do not linger in the inbox. */
      const inbox = fs.readdirSync(path.join(out, "content", "inbox", DATE));
      expect(inbox.filter((n) => /\.(pdf|txt|part)$/.test(n))).toEqual([]);

      /* ---- 2. The standard grading pass builds its sheet from the queue. ---- */
      fs.copyFileSync(path.join(REPO, "content", "photo-selects.json"), path.join(out, "content", "photo-selects.json"));
      const sheet = await run("grading-sheet.mjs", [sheetDir, "--queue"], {}, out);
      expect(sheet.status, sheet.stderr + sheet.stdout).toBe(0);
      const indexText = fs.readFileSync(path.join(sheetDir, "index.json"), "utf-8");
      const index = JSON.parse(indexText);
      expect(index.mode).toBe("queue");
      expect(index.frames).toHaveLength(2);
      /* The grading pass is the grade-photo-library workflow. It never reads
         index.json: from its `sheet`, `total` and `batchSize` arguments it names the
         frames with its own `const id = (n) => 'g' + String(n).padStart(4, '0')`,
         n = 1…total, and has graders open `${sheet}/${id}.jpg`. This is that
         derivation, checked against the sheet on disk and the arguments printed. */
      const workflowIds = Array.from({ length: index.frames.length }, (_, i) => "g" + String(i + 1).padStart(4, "0"));
      expect(index.frames.map((fr: { id: string }) => fr.id)).toEqual(workflowIds);
      expect(index.frames.map((fr: { sheet: string }) => fr.sheet)).toEqual(workflowIds.map((id) => `${id}.jpg`));
      for (const id of workflowIds) expect(fs.existsSync(path.join(sheetDir, `${id}.jpg`)), id).toBe(true);
      expect(fs.existsSync(path.join(sheetDir, "STANDARD.md"))).toBe(true);
      const argsLine = sheet.stdout.split("\n").find((l) => l.startsWith("grade-photo-library args: "));
      expect(JSON.parse(argsLine!.slice("grade-photo-library args: ".length))).toMatchObject({ sheet: path.resolve(sheetDir), total: 2 });
      /* Rebuilt into the same folder, the ids would name different photographs. */
      const rebuilt = await run("grading-sheet.mjs", [sheetDir, "--queue"], {}, out);
      expect(rebuilt.status, rebuilt.stdout).toBe(1);
      expect(rebuilt.stderr).toContain("new or empty folder");
      expect(fs.readFileSync(path.join(sheetDir, "index.json"), "utf-8")).toBe(indexText);
      /* A library sheet needs the library's own inputs to get as far as the
         guard. Without them it fails on a missing photo-metrics.json, and an
         exit 1 would prove nothing about the refusal. */
      fs.copyFileSync(path.join(process.cwd(), "content", "photo-metrics.json"), path.join(out, "content", "photo-metrics.json"));
      fs.mkdirSync(path.join(out, "public", "images"), { recursive: true });
      const overLibrary = await run("grading-sheet.mjs", [sheetDir], {}, out);
      expect(overLibrary.status, overLibrary.stdout).toBe(1);
      expect(overLibrary.stderr).toContain("holds a queue sheet");
      expect(fs.readFileSync(path.join(sheetDir, "index.json"), "utf-8")).toBe(indexText);
      const sheetId = (fragment: string) => index.frames.find((x: { staged: string }) => x.staged.includes(fragment)).id;

      /* ---- 3. Grades land: the B is published, the C stays in staging. ------
         The grader output below is test data standing in for the workflow's. */
      const gradesFile = path.join(out, "grader-output.json");
      fs.writeFileSync(
        gradesFile,
        JSON.stringify({
          result: {
            frames: [
              { id: sheetId("escape-attempt"), grade: "B", subject: "test fixture: a flat blue field", reason: "test fixture", graders: 2, agreed: true },
              { id: sheetId("-second"), grade: "C", subject: "test fixture: a flat sand field", reason: "test fixture", graders: 2, agreed: true },
            ],
          },
        })
      );
      const merged = await run("merge-grades.mjs", [gradesFile, sheetDir], {}, out);
      expect(merged.status, merged.stderr + merged.stdout).toBe(0);
      const queue = read("content/grading-queue.json").queue;
      const pass = queue.find((q: { staged: string }) => q.staged === staged);
      expect(pass).toMatchObject({ status: "published", grade: "B", published: pass.publishAs });
      const publishedFile = path.join(out, "public", ...pass.publishAs.slice(1).split("/"));
      expect(fs.readFileSync(publishedFile).equals(fs.readFileSync(path.join(out, staged))), "the file published is the file graded").toBe(true);
      expect((await sharp(publishedFile).metadata()).exif).toBeUndefined();
      const provenance = read("content/image-provenance.json");
      expect(provenance.images[pass.publishAs]).toMatchObject({ tier: "allowed", origin: "camera", sha256: pass.stagedSha256.slice(0, 16) });
      expect(provenance.images[pass.publishAs].note).toContain(`owner/drive/${DATE}`);
      expect(provenance.images[pass.publishAs].note).toContain("Tier A by provenance");
      const fail = queue.find((q: { staged: string }) => q.staged.includes("-second"));
      expect(fail).toMatchObject({ status: "held", grade: "C" });
      expect(fs.existsSync(path.join(out, "public", ...fail.publishAs.slice(1).split("/")))).toBe(false);
      expect(provenance.images[fail.publishAs]).toBeUndefined();

      /* A grade lands once: a second output against the same sheet, grades swapped, changes nothing. */
      const queueText = fs.readFileSync(path.join(out, "content", "grading-queue.json"), "utf-8");
      const provenanceText = fs.readFileSync(path.join(out, "content", "image-provenance.json"), "utf-8");
      const swapped = path.join(out, "grader-output-swapped.json");
      fs.writeFileSync(
        swapped,
        JSON.stringify({
          result: {
            frames: [
              { id: sheetId("escape-attempt"), grade: "C", subject: "test fixture", reason: "test fixture", graders: 2, agreed: true },
              { id: sheetId("-second"), grade: "A", subject: "test fixture", reason: "test fixture", graders: 2, agreed: true },
            ],
          },
        })
      );
      const remerged = await run("merge-grades.mjs", [swapped, sheetDir], {}, out);
      expect(remerged.status, remerged.stderr + remerged.stdout).toBe(0);
      expect(remerged.stdout).toContain("already graded, left as they are 2");
      expect(fs.readFileSync(path.join(out, "content", "grading-queue.json"), "utf-8")).toBe(queueText);
      expect(fs.readFileSync(path.join(out, "content", "image-provenance.json"), "utf-8")).toBe(provenanceText);
      expect(fs.existsSync(publishedFile)).toBe(true);
      expect(fs.existsSync(path.join(out, "public", ...fail.publishAs.slice(1).split("/")))).toBe(false);

      /* ---- 4. ffmpeg arrives but cuts a loop over budget: the budget holds. -- */
      const heavy = await ingest(["--transcode-pending"], {
        ...env,
        INGEST_FFMPEG_SHIM: FAKE_FFMPEG,
        FAKE_FFMPEG_LOG: path.join(out, "ffmpeg-heavy.jsonl"),
        FAKE_FFMPEG_BYTES: String(3 * 1024 * 1024),
      });
      printed.push(heavy.stdout, heavy.stderr);
      expect(heavy.status, heavy.stdout).toBe(1);
      clip = read("content/media/manifest.json").videos.at(-1);
      expect(clip.status).toBe("transcode-failed");
      expect(clip.reason).toContain("over the");
      expect(clip.reason, "the MP4 is the first loop over budget").toContain("loop-1920.mp4");
      expect(overBudgetFiles(path.join(out, "content", "media")), "nothing over budget is left where git can see it").toEqual([]);

      /* ---- 5. Run again: what was taken is a duplicate; the unfinished is retried. */
      const again = await ingest([link], { ...env, ...NO_FFMPEG });
      printed.push(again.stdout, again.stderr);
      expect(again.status, again.stderr).toBe(0);
      const second = lastRun();
      expect(second.counts.staged ?? 0).toBe(0);
      expect(second.byName["../../escape attempt.JPG"].status).toBe("duplicate");
      expect(second.byName["second.jpg"].status, "a held frame is not re-graded").toBe("duplicate");
      expect(second.byName["IMG_0001.HEIC"].status, "needs-conversion is retried").toBe("needs-conversion");
      expect(second.byName["drone pass.MP4"].status, "transcode-failed is retried").toBe("needs-transcode");

      /* ---- 6. --transcode-pending runs the commands the clip recorded, exactly,
         up to the first WebM rung that fits — here the first. */
      const log = path.join(out, "ffmpeg.jsonl");
      clip = read("content/media/manifest.json").videos.at(-1);
      expect(clip.status).toBe("needs-transcode");
      const recorded: string[] = clip.commands;
      expect(recorded).toHaveLength(LADDER.length);
      const cut = await ingest(["--transcode-pending"], { ...env, INGEST_FFMPEG_SHIM: FAKE_FFMPEG, FAKE_FFMPEG_LOG: log });
      printed.push(cut.stdout, cut.stderr);
      expect(cut.status, cut.stderr + cut.stdout).toBe(0);
      clip = read("content/media/manifest.json").videos.at(-1);
      expect(clip.status).toBe("variants-ready");
      expect(clip.commands).toBeUndefined();
      expect(clip.variants.map((v: { file: string }) => path.posix.basename(v.file))).toEqual(["poster.jpg", "loop-1920.mp4", "loop-1920.webm"]);
      expect(clip.webm).toEqual({ rung: 1920, tried: [] });
      expect(clip.fallback).toBeNull();
      for (const v of clip.variants) expect(v.bytes).toBeLessThanOrEqual(clip.spec.maxBytes);
      const plan = heroVariantPlan(clip.original, `content/media/${clip.slug}`);
      const upTo = plan.findIndex((s) => s.name === path.posix.basename(clip.variants.at(-1).file));
      expect(upTo, "the kept WebM is the plan's first rung").toBe(2);
      const ran = ranLog(log);
      expect(ran).toEqual(plan.slice(0, upTo + 1).map((s) => s.args));
      expect(ran.map((a) => commandLine(a)), "what ran is the recorded lines, up to the rung that fit").toEqual(recorded.slice(0, upTo + 1));

      /* ---- 7. The owner adds the HEIC again as a JPEG: it goes through. ------ */
      files[IDS.converted] = { body: f.converted };
      listings[IDS.root]!.html = listing([...rootEntries, entry(IDS.converted, "IMG_0001.jpg", fileHref(IDS.converted))]);
      const third = await ingest([link], { ...env, ...NO_FFMPEG });
      printed.push(third.stdout, third.stderr);
      expect(third.status, third.stderr).toBe(0);
      const thirdRun = lastRun();
      expect(thirdRun.byName["IMG_0001.jpg"].status).toBe("staged");
      expect(thirdRun.byName["drone pass.MP4"].status, "a finished clip is a duplicate").toBe("duplicate");

      /* ---- 8. Staging is lost (it is gitignored: a clean, another checkout). -
         The photograph still waiting for its grade is staged again, and its queue
         entry replaced; a graded one — published or held — stays a duplicate. */
      const convertedSha: string = thirdRun.byName["IMG_0001.jpg"].sha256;
      fs.rmSync(path.join(out, "content", "owner-staging"), { recursive: true, force: true });
      const fourth = await ingest([link], { ...env, ...NO_FFMPEG });
      printed.push(fourth.stdout, fourth.stderr);
      expect(fourth.status, fourth.stderr).toBe(0);
      const fourthRun = lastRun();
      expect(fourthRun.counts.staged).toBe(1);
      expect(fourthRun.byName["IMG_0001.jpg"].status, "a pending photograph whose staged file is gone is staged again").toBe("staged");
      expect(fourthRun.byName["../../escape attempt.JPG"].status, "published stays taken").toBe("duplicate");
      expect(fourthRun.byName["second.jpg"].status, "held stays taken").toBe("duplicate");
      const forConverted = read("content/grading-queue.json").queue.filter((q: { originalSha256: string }) => q.originalSha256 === convertedSha);
      expect(forConverted).toHaveLength(1);
      expect(forConverted[0].status).toBe("pending-grade");
      expect(fs.existsSync(path.join(out, ...forConverted[0].staged.split("/")))).toBe(true);

      /* No Drive ID written anywhere — the repo is public and the ID is a key. */
      for (const rel of ["content/owner-intake.json", "content/image-provenance.json", "content/grading-queue.json", "content/media/manifest.json", "sheet/index.json"]) {
        const text = fs.readFileSync(path.join(out, rel), "utf-8");
        for (const id of Object.values(IDS)) expect(text, `${rel} leaks ${id}`).not.toContain(id);
      }
      for (const text of printed) for (const id of Object.values(IDS)) expect(text).not.toContain(id);
    } finally {
      drive.server.close();
      fs.rmSync(out, { recursive: true, force: true });
    }
  });

  test("the WebM ladder: a lower rung when a WebM is over budget, the MP4 alone when none fits, nothing over budget left", async () => {
    const { heroVariantPlan, commandLine } = await import("../scripts/ingest-drive.mjs");
    /* Distinct clips: the same real structure, different bytes, so each is its own clip. */
    const V = {
      recorded: "LADDERrecorded00060",
      mid: "LADDERmid000000061",
      none: "LADDERnone00000062",
      mp4: "LADDERmp4000000063",
      broken: "LADDERbroken000064",
    };
    const drive = await mockDrive(
      {},
      Object.fromEntries(Object.values(V).map((id, i) => [id, { body: isoFile("isom", ["isom", "iso2", "avc1", "mp41"], ["vide"], { mdat: 4096 + i }) }]))
    );
    const roots: string[] = [];
    const printed: string[] = [];
    const MiB = 1024 * 1024;
    const names = (c: { variants: { file: string }[] }) => c.variants.map((v) => path.posix.basename(v.file));
    type Sizes = Record<string, number | "fail">;
    /* One output root per clip. Each run starts a fresh ffmpeg log, so `ran()` is that run's argv. */
    const clipCase = (id: string) => {
      const out = fs.mkdtempSync(path.join(os.tmpdir(), "ingest-ladder-"));
      roots.push(out);
      const log = path.join(out, "ffmpeg.jsonl");
      const manifest = path.join(out, "content", "media", "manifest.json");
      const link = `https://drive.google.com/file/d/${id}/view?usp=sharing`;
      const base = { INGEST_DRIVE_BASE: drive.base, INGEST_DOWNLOAD_BASE: drive.base, INGEST_OUT_ROOT: out, INGEST_DATE: DATE };
      const fake = (sizes: Sizes) => ({ ...base, INGEST_FFMPEG_SHIM: FAKE_FFMPEG, FAKE_FFMPEG_LOG: log, FAKE_FFMPEG_SIZES: JSON.stringify(sizes) });
      const go = async (args: string[], env: Record<string, string>) => {
        fs.rmSync(log, { force: true });
        const r = await ingest(args, env);
        printed.push(r.stdout, r.stderr);
        return r;
      };
      const clip = () => JSON.parse(fs.readFileSync(manifest, "utf-8")).videos.at(-1);
      return {
        out,
        manifest,
        /* A normal ingest of the link, with ffmpeg present (the fake). */
        cut: (sizes: Sizes) => go([link], fake(sizes)),
        pending: (sizes: Sizes) => go(["--transcode-pending"], fake(sizes)),
        /* A normal ingest with no ffmpeg: the clip records its commands. */
        record: () => go([link], { ...base, ...NO_FFMPEG }),
        clip,
        ran: () => ranLog(log),
        plan: (c: { original: string; slug: string }) => heroVariantPlan(c.original, `content/media/${c.slug}`),
        onDisk: (c: { slug: string }) => fs.readdirSync(path.join(out, "content", "media", c.slug)).sort(),
        overBudget: () => overBudgetFiles(path.join(out, "content", "media")),
        intakeStatus: () => JSON.parse(fs.readFileSync(path.join(out, "content", "owner-intake.json"), "utf-8")).runs.at(-1).files[0].status,
      };
    };
    try {
      /* ---- 1. The recorded commands are the whole plan, every step held to its long edge. */
      const rec = clipCase(V.recorded);
      const r0 = await rec.record();
      expect(r0.status, r0.stderr + r0.stdout).toBe(0);
      let c = rec.clip();
      expect(c.status).toBe("needs-transcode");
      expect(c.spec).toMatchObject({ maxBytes: BUDGET, longEdge: 1920, webmLadder: [1920, 1280, 960] });
      const recPlan = rec.plan(c);
      expect(recPlan.map(({ name, kind, rung, budget }) => ({ name, kind, rung, budget }))).toEqual(LADDER);
      expect(c.commands).toEqual(recPlan.map((s) => commandLine(s.args)));
      for (const [i, step] of recPlan.entries()) {
        const want = LADDER[i]!;
        const vf = step.args.indexOf("-vf");
        expect(vf, step.name).toBeGreaterThan(-1);
        expect(step.args[vf + 1], `${step.name} scales by its long edge and never enlarges`).toBe(longEdgeScale(want.rung));
        expect(step.args.filter((a) => a.includes("scale")), step.name).toHaveLength(1);
        expect(step.args.at(-1)).toBe(`content/media/${c.slug}/${want.name}`);
        expect(c.commands[i], `${step.name}: the recorded line quotes the filter for a shell`).toContain(` -vf "${longEdgeScale(want.rung)}" `);
      }
      expect(c.reason, "the reason says the later WebM lines are conditional").toContain("A WebM line runs only when the one before it came out over the 2621440-byte budget");
      /* ffmpeg makes no folder: the tranche-14 real-ffmpeg check found the recorded lines fail by hand without it. */
      expect(c.reason, "the reason says the clip folder must exist before the lines are run by hand").toContain(`content/media/${c.slug}/, to exist first`);
      /* Cut from the record: the two larger WebMs are over, the 960 is kept — the whole plan ran, and it is the recorded lines. */
      const r0b = await rec.pending({ "loop-1920.webm": 3 * MiB, "loop-1280.webm": BUDGET + 1 });
      expect(r0b.status, r0b.stderr + r0b.stdout).toBe(0);
      expect(rec.ran()).toEqual(recPlan.map((s) => s.args));
      expect(rec.ran().map((a) => commandLine(a))).toEqual(c.commands);
      c = rec.clip();
      expect(c.status).toBe("variants-ready");
      expect(c.commands).toBeUndefined();
      expect(c.reason).toBeUndefined();
      expect(names(c)).toEqual(["poster.jpg", "loop-1920.mp4", "loop-960.webm"]);
      expect(c.webm).toEqual({ rung: 960, tried: [{ rung: 1920, bytes: 3 * MiB }, { rung: 1280, bytes: BUDGET + 1 }] });
      expect(rec.onDisk(c)).toEqual(["loop-1920.mp4", "loop-960.webm", "poster.jpg"]);
      expect(rec.overBudget()).toEqual([]);

      /* ---- 2. The 1920 WebM is over budget, the 1280 fits: the 960 never runs. -- */
      const mid = clipCase(V.mid);
      const r1 = await mid.cut({ "loop-1920.webm": BUDGET + 1, "loop-1280.webm": BUDGET });
      expect(r1.status, r1.stderr + r1.stdout).toBe(0);
      c = mid.clip();
      expect(c.status).toBe("variants-ready");
      expect(mid.intakeStatus()).toBe("variants-ready");
      expect(names(c)).toEqual(["poster.jpg", "loop-1920.mp4", "loop-1280.webm"]);
      expect(c.variants.at(-1).bytes, "a loop of exactly the budget fits").toBe(BUDGET);
      expect(c.webm).toEqual({ rung: 1280, tried: [{ rung: 1920, bytes: BUDGET + 1 }] });
      expect(c.fallback).toBeNull();
      expect(c.note).toContain("DRAFT CUT");
      expect(c.note).toContain("the 1280 rung");
      expect(r1.stdout, "the rung is printed loudly").toMatch(/WEBM AT 1280/);
      expect(mid.onDisk(c), "the over-budget 1920 WebM is deleted, and no 960 was cut").toEqual(["loop-1280.webm", "loop-1920.mp4", "poster.jpg"]);
      expect(mid.ran(), "the plan up to the first rung that fits, and no further").toEqual(mid.plan(c).slice(0, 4).map((s) => s.args));
      expect(mid.overBudget()).toEqual([]);

      /* ---- 3. No WebM rung fits: the clip is the poster and the MP4, and it is finished. */
      const none = clipCase(V.none);
      const r2 = await none.cut({ "loop-1920.webm": 3 * MiB, "loop-1280.webm": 3 * MiB - 1, "loop-960.webm": BUDGET + 1 });
      expect(r2.status, r2.stderr + r2.stdout).toBe(0);
      c = none.clip();
      expect(c.status, "MP4 only is a finished clip, not a failure").toBe("variants-ready");
      expect(none.intakeStatus()).toBe("variants-ready");
      expect(names(c)).toEqual(["poster.jpg", "loop-1920.mp4"]);
      expect(c.webm).toBeNull();
      expect(c.fallback).toBe("mp4-only");
      expect(c.reason).toBeUndefined();
      expect(c.note).toContain("DRAFT CUT");
      expect(c.note).toContain("MP4 FALLBACK ONLY");
      for (const part of [`1920: ${3 * MiB} bytes`, `1280: ${3 * MiB - 1} bytes`, `960: ${BUDGET + 1} bytes`]) expect(c.note).toContain(part);
      expect(r2.stdout).toMatch(/MP4 ONLY/);
      expect(none.onDisk(c), "no WebM is left on disk").toEqual(["loop-1920.mp4", "poster.jpg"]);
      expect(none.ran(), "every rung was tried").toEqual(none.plan(c).map((s) => s.args));
      expect(none.overBudget()).toEqual([]);
      /* Finished means taken: the same link again is a duplicate, and nothing is cut. */
      const r2b = await none.cut({});
      expect(r2b.status, r2b.stderr).toBe(0);
      expect(none.intakeStatus()).toBe("duplicate");
      expect(none.ran()).toEqual([]);

      /* ---- 4. The MP4 is over budget: the clip fails, the run says so, and nothing over budget stays. */
      const mp4 = clipCase(V.mp4);
      const r3 = await mp4.cut({ "loop-1920.mp4": BUDGET + 1 });
      expect(r3.status, `a normal ingest whose cut failed exits 1: ${r3.stdout}`).toBe(1);
      expect(r3.stderr).toContain("could not be cut");
      c = mp4.clip();
      expect(c.status).toBe("transcode-failed");
      expect(mp4.intakeStatus()).toBe("transcode-failed");
      expect(c.reason).toContain(`loop-1920.mp4 came out at ${BUDGET + 1} bytes, over the ${BUDGET}-byte budget`);
      for (const k of ["variants", "webm", "fallback", "note", "commands"]) expect(c[k], k).toBeUndefined();
      expect(mp4.onDisk(c), "a failed cut leaves none of its files, the over-budget MP4 included").toEqual([]);
      expect(mp4.ran(), "no WebM is cut once the MP4 has failed").toEqual(mp4.plan(c).slice(0, 2).map((s) => s.args));
      expect(mp4.overBudget()).toEqual([]);
      /* Files an interrupted cut could have left: the next cut clears its own plan's files first. */
      const clipDir = path.join(mp4.out, "content", "media", c.slug);
      fs.writeFileSync(path.join(clipDir, "loop-960.webm"), Buffer.alloc(3 * MiB));
      fs.writeFileSync(path.join(clipDir, "loop-1280.webm"), Buffer.alloc(1024));
      /* --transcode-pending retries a transcode-failed clip whose original is here. */
      const r4 = await mp4.pending({});
      expect(r4.status, r4.stderr + r4.stdout).toBe(0);
      c = mp4.clip();
      expect(c.status, "--transcode-pending picks up a transcode-failed clip").toBe("variants-ready");
      expect(c.reason).toBeUndefined();
      expect(c.webm).toEqual({ rung: 1920, tried: [] });
      expect(c.fallback).toBeNull();
      expect(names(c)).toEqual(["poster.jpg", "loop-1920.mp4", "loop-1920.webm"]);
      expect(mp4.ran()).toEqual(mp4.plan(c).slice(0, 3).map((s) => s.args));
      expect(mp4.onDisk(c), "no stale rung from an earlier cut is left").toEqual(["loop-1920.mp4", "loop-1920.webm", "poster.jpg"]);
      expect(mp4.overBudget()).toEqual([]);

      /* ---- 5. A WebM encoder error fails the clip, part-way down the ladder. ---- */
      const broken = clipCase(V.broken);
      const r5 = await broken.cut({ "loop-1920.webm": BUDGET + 1, "loop-1280.webm": "fail" });
      expect(r5.status, r5.stdout).toBe(1);
      c = broken.clip();
      expect(c.status).toBe("transcode-failed");
      expect(c.reason).toContain("loop-1280.webm: fake-ffmpeg: a deliberate encoder failure");
      expect(c.reason, "the rung over budget before it is named").toContain(`1920: ${BUDGET + 1} bytes`);
      expect(broken.onDisk(c), "a failed cut leaves none of its files: not the over-budget rung, the broken one, or the MP4 and poster").toEqual([]);
      expect(broken.ran(), "the 960 rung never runs after an encoder error").toEqual(broken.plan(c).slice(0, 4).map((s) => s.args));
      expect(broken.overBudget()).toEqual([]);
      /* Its original gone (originals are gitignored): listed, left as it is, and not an error. */
      fs.rmSync(path.join(broken.out, "content", "media", "originals"), { recursive: true, force: true });
      const before = fs.readFileSync(broken.manifest, "utf-8");
      const r6 = await broken.pending({});
      expect(r6.status, r6.stderr + r6.stdout).toBe(0);
      expect(r6.stdout).toContain("not retried");
      expect(r6.stdout).toContain("nothing to cut");
      expect(broken.ran()).toEqual([]);
      expect(fs.readFileSync(broken.manifest, "utf-8")).toBe(before);

      /* No Drive ID written or printed. */
      for (const out of roots) {
        for (const rel of ["content/owner-intake.json", "content/media/manifest.json"]) {
          const text = fs.readFileSync(path.join(out, rel), "utf-8");
          for (const id of Object.values(V)) expect(text, `${rel} leaks ${id}`).not.toContain(id);
        }
      }
      for (const text of printed) for (const id of Object.values(V)) expect(text).not.toContain(id);
    } finally {
      drive.server.close();
      for (const out of roots) fs.rmSync(out, { recursive: true, force: true });
    }
  });

  test("a plans folder: stored byte for byte, never near the photograph path, never verified, no key written", async () => {
    const f = await fixtures();
    const tiff = await sharp({ create: { width: 64, height: 48, channels: 3, background: { r: 250, g: 250, b: 245 } } }).tiff().toBuffer();
    const misnamed = Buffer.from("%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\ntrailer << >>\n%%EOF\n", "latin1");
    const P = {
      root: "PLANSroot0000000040",
      sub: "PLANSsub00000000041",
      pdf: "PLANpdf00000000042",
      dwg: "PLANdwg00000000043",
      dxf: "PLANdxf00000000044",
      photo: "PLANphoto000000045",
      tiff: "PLANtiff0000000046",
      misnamed: "PLANmisnamed000047",
      pdfAgain: "PLANpdfAgain000048",
      video: "PLANvideo000000049",
      m4a: "PLANm4a00000000050",
      text: "PLANtext0000000051",
      svg: "PLANsvg00000000052",
      broken: "PLANbroken00000053",
      library: "PLANlibrary0000054",
      binaryDxf: "PLANbinaryDxf00055",
    };
    const bodies = {
      pdf: f.pdf,
      dwg: dwg("AC1032"),
      dxf: DXF.headerOnly,
      binaryDxf: binaryDxf(),
      photo: f.photo,
      tiff,
      misnamed,
      library: f.dupe,
    };
    const files: Record<string, Stored> = {
      [P.pdf]: { body: bodies.pdf },
      [P.pdfAgain]: { body: bodies.pdf },
      [P.dwg]: { body: bodies.dwg, key: KEYS.photo },
      [P.dxf]: { body: bodies.dxf },
      [P.photo]: { body: bodies.photo },
      [P.tiff]: { body: bodies.tiff },
      [P.misnamed]: { body: bodies.misnamed },
      [P.library]: { body: bodies.library },
      [P.video]: { body: f.video, confirm: true },
      [P.m4a]: { body: f.m4a },
      [P.text]: { body: f.text },
      [P.svg]: { body: Buffer.from('<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>\n') },
      [P.broken]: { body: f.pdf.subarray(0, 40) },
      [P.binaryDxf]: { body: bodies.binaryDxf },
    };
    const listings: Record<string, Listing> = {
      [P.root]: {
        html: listing([
          entry(P.pdf, "Site plan.pdf", fileHref(P.pdf)),
          entry(P.dwg, "estate.dwg", `${fileHref(P.dwg)}&amp;resourcekey=${KEYS.photo}`),
          entry(P.dxf, "estate.dxf", fileHref(P.dxf)),
          entry(P.photo, "plan photo.jpg", fileHref(P.photo)),
          entry(P.tiff, "survey scan.tif", fileHref(P.tiff)),
          entry(P.misnamed, "drawing.dwg", fileHref(P.misnamed)),
          entry(P.library, "aerial.jpg", fileHref(P.library)),
          entry(P.video, "walkthrough.mp4", fileHref(P.video)),
          entry(P.m4a, "voice note.m4a", fileHref(P.m4a)),
          entry(P.text, "readme.txt", fileHref(P.text)),
          entry(P.svg, "plan.svg", fileHref(P.svg)),
          entry(P.broken, "old plan.pdf", fileHref(P.broken)),
          entry(IDS.offsite, "click me.pdf", `https://evil.example/file/d/${IDS.offsite}/view`),
          entry(P.sub, "Copies", `https://drive.google.com/drive/folders/${P.sub}`),
        ]),
      },
      [P.sub]: { html: listing([entry(P.pdfAgain, "Site plan (1).pdf", fileHref(P.pdfAgain)), entry(P.binaryDxf, "site section.dxf", fileHref(P.binaryDxf))]) },
    };
    /* The Drive filename → the bytes Drive served for it, for every file that is a plan. */
    const plansServed: Record<string, Buffer> = {
      "Site plan.pdf": bodies.pdf,
      "estate.dwg": bodies.dwg,
      "estate.dxf": bodies.dxf,
      "site section.dxf": bodies.binaryDxf,
      "plan photo.jpg": bodies.photo,
      "survey scan.tif": bodies.tiff,
      "drawing.dwg": bodies.misnamed,
      "aerial.jpg": bodies.library,
    };
    const drive = await mockDrive(listings, files);
    const out = fs.mkdtempSync(path.join(os.tmpdir(), "ingest-drive-plans-"));
    const sheetDir = path.join(out, "sheet");
    const env = { INGEST_DRIVE_BASE: drive.base, INGEST_DOWNLOAD_BASE: drive.base, INGEST_OUT_ROOT: out, INGEST_DATE: DATE, ...NO_FFMPEG };
    const link = `https://drive.google.com/drive/folders/${P.root}?usp=sharing`;
    const read = (rel: string) => JSON.parse(fs.readFileSync(path.join(out, rel), "utf-8"));
    const lastRun = () => {
      const r = read("content/owner-intake.json").runs.at(-1);
      return { counts: r.counts, byName: Object.fromEntries(r.files.map((x: { name: string }) => [x.name, x])) };
    };
    const onDisk = (rel: string) => path.join(out, ...rel.split("/"));
    const sha256 = (b: Buffer) => crypto.createHash("sha256").update(b).digest("hex");
    /* The owner's ruling on a plan (DECISIONS.md D-021). No ingest may write it. */
    const RULING = "owner-verified";
    const printed: string[] = [];
    const noRuling = () => {
      for (const file of filesUnder(out)) {
        if (path.relative(out, file) === path.join("content", "photo-selects.json")) continue; /* copied from the repository below */
        expect(fs.readFileSync(file).includes(RULING), `${path.relative(out, file)} carries the owner's ruling`).toBe(false);
      }
      for (const text of printed) expect(text).not.toContain(RULING);
    };
    try {
      expect(fs.readFileSync(path.join(REPO, "scripts", "ingest-drive.mjs"), "utf-8"), "the ingest cannot write a ruling it does not contain").not.toContain(RULING);

      /* ---- 1. A dry run looks, and writes nothing. -------------------------- */
      const dry = await ingest([link, "--plans", "--dry-run"], env);
      printed.push(dry.stdout, dry.stderr);
      expect(dry.status, dry.stderr + dry.stdout).toBe(0);
      expect(dry.stdout.match(/^\s+would-store\s/gm) ?? []).toHaveLength(8);
      expect(dry.stdout).toMatch(/^\s+duplicate\s/m);
      for (const rel of ["content/plans", "content/owner-intake.json", "content/grading-queue.json", "content/media", "content/owner-staging", "public"]) {
        expect(fs.existsSync(path.join(out, rel)), `a dry run writes no ${rel}`).toBe(false);
      }
      expect(filesUnder(path.join(out, "content", "inbox")), "a dry run leaves no download behind").toEqual([]);

      /* ---- 2. The run, over ledgers a checkout already holds. ----------------
         The photograph queue already has the survey scan's bytes, graded and
         published: `taken` for a photograph run, and NOT a reason to refuse the
         plan. And the plans ledger has an entry for the DWG whose file is on disk
         but whose status is not "stored": only a stored plan is taken. */
      const scanPublished = `/images/_owner/2025-12-01/${sha256(bodies.tiff).slice(0, 12)}-survey-scan.jpg`;
      const seededQueue = {
        queue: [
          {
            staged: `content/owner-staging/2025-12-01/${sha256(bodies.tiff).slice(0, 12)}-survey-scan.jpg`,
            publishAs: scanPublished,
            published: scanPublished,
            originalSha256: sha256(bodies.tiff),
            provenance: "owner/drive/2025-12-01",
            tier: "A",
            origin: "camera",
            status: "published",
            grade: "B",
            added: "2025-12-01",
          },
        ],
      };
      fs.mkdirSync(path.join(out, "content"), { recursive: true });
      fs.writeFileSync(path.join(out, "content", "grading-queue.json"), JSON.stringify(seededQueue, null, 2));
      const withdrawnRel = `content/plans/2025-12-31/${sha256(bodies.dwg).slice(0, 12)}-estate.dwg`;
      fs.mkdirSync(path.dirname(onDisk(withdrawnRel)), { recursive: true });
      fs.writeFileSync(onDisk(withdrawnRel), bodies.dwg);
      fs.writeFileSync(
        path.join(out, "content", "plans", "manifest.json"),
        JSON.stringify({ _note: "seeded by the test", plans: [{ stored: withdrawnRel, sha256: sha256(bodies.dwg), bytes: bodies.dwg.length, type: "dwg", name: "estate.dwg", status: "withdrawn", verification: "unverified" }] }, null, 2)
      );

      const r = await ingest([link, "--plans"], env);
      printed.push(r.stdout, r.stderr);
      expect(r.status, r.stderr + r.stdout).toBe(0);
      const { counts, byName } = lastRun();
      expect(counts).toEqual({ stored: 8, duplicate: 1, rejected: 5, skipped: 1 });

      const storedAs = (name: string, slugged: string, ext: string) => {
        expect(byName[name], name).toMatchObject({ status: "stored", kind: "plan" });
        expect(byName[name].stored, name).toMatch(new RegExp(`^content/plans/${DATE}/[0-9a-f]{12}-${slugged}\\.${ext}$`));
      };
      storedAs("Site plan.pdf", "site-plan", "pdf");
      storedAs("estate.dwg", "estate", "dwg");
      storedAs("estate.dxf", "estate", "dxf");
      storedAs("site section.dxf", "site-section", "dxf");
      storedAs("plan photo.jpg", "plan-photo", "jpg");
      storedAs("survey scan.tif", "survey-scan", "tiff");
      storedAs("aerial.jpg", "aerial", "jpg");
      /* A PDF named .dwg is stored as the PDF it is. */
      storedAs("drawing.dwg", "drawing", "pdf");
      expect(byName["drawing.dwg"].type).toBe("pdf");
      expect(byName["Site plan (1).pdf"]).toMatchObject({ status: "duplicate", of: byName["Site plan.pdf"].stored });
      for (const [name, what] of [
        ["walkthrough.mp4", "video"],
        ["voice note.m4a", "audio"],
        ["readme.txt", "text"],
        ["plan.svg", "svg"],
        ["old plan.pdf", "cut short"],
      ] as const) {
        expect(byName[name].status, name).toBe("rejected");
        expect(byName[name].reason, name).toContain("not a plan");
        expect(byName[name].reason, name).toContain(what);
      }
      expect(byName["click me.pdf"].status).toBe("skipped");
      expect(drive.seen.has("asked-for-offsite-entry")).toBe(false);

      /* The bytes stored are the bytes served: nothing decoded, resized, re-encoded or stripped. */
      for (const [name, body] of Object.entries(plansServed)) {
        const stored = fs.readFileSync(onDisk(byName[name].stored));
        expect(stored.equals(body), `${name} is stored exactly as sent`).toBe(true);
        expect(sha256(stored), name).toBe(byName[name].sha256);
      }
      const planPhoto = await sharp(onDisk(byName["plan photo.jpg"].stored)).metadata();
      expect(planPhoto.exif, "a photograph of a plan keeps its EXIF, GPS included: it is never stripped").toBeDefined();

      /* The committed ledger. */
      const manifest = read("content/plans/manifest.json");
      expect(manifest.plans).toHaveLength(8);
      expect(manifest.plans.some((p: { stored: string }) => p.stored === withdrawnRel), "the entry that was not stored is replaced").toBe(false);
      for (const p of manifest.plans) {
        expect(p).toMatchObject({ provenance: `owner/drive/${DATE}`, origin: "owner-plan", verification: "unverified", status: "stored", added: DATE });
        expect(p.sha256).toMatch(/^[0-9a-f]{64}$/);
        expect(p.bytes).toBe(plansServed[p.name]!.length);
        expect(fs.existsSync(onDisk(p.stored))).toBe(true);
      }
      const planNamed = (name: string) => manifest.plans.find((p: { name: string }) => p.name === name);
      expect(planNamed("Site plan.pdf")).toMatchObject({ type: "pdf", version: "1.7", folder: null });
      expect(planNamed("estate.dwg")).toMatchObject({ type: "dwg", version: "AC1032" });
      expect(planNamed("estate.dxf")).toMatchObject({ type: "dxf", version: "AC1027", encoding: "ascii" });
      expect(planNamed("site section.dxf"), "a plan in a subfolder records its folder").toMatchObject({ type: "dxf", version: null, encoding: "binary", folder: "Copies" });
      expect(byName["estate.dwg"].status, "a plans-ledger entry that is not stored does not make a duplicate").toBe("stored");
      expect(manifest.plans.filter((p: { sha256: string }) => p.sha256 === sha256(bodies.dwg))).toHaveLength(1);
      expect(planNamed("survey scan.tif")).toMatchObject({ type: "tiff", version: null, alsoPhotograph: scanPublished });
      expect(byName["survey scan.tif"].status, "bytes the photograph queue has taken are still stored as a plan").toBe("stored");
      expect(planNamed("aerial.jpg").alsoPhotograph, "the same bytes as a library photograph: stored all the same, and the photograph named").toMatch(/^\/images\/_site\//);
      expect(planNamed("plan photo.jpg").alsoPhotograph).toBeUndefined();
      noRuling();

      /* Nothing went near the photograph path. */
      expect(read("content/grading-queue.json"), "no plan is queued for grading").toEqual(seededQueue);
      expect(read("content/media/manifest.json").videos).toEqual([]);
      for (const rel of ["content/owner-staging", "public", "content/image-provenance.json", "content/media/originals"]) {
        expect(fs.existsSync(path.join(out, rel)), `a plans run writes no ${rel}`).toBe(false);
      }
      expect(filesUnder(path.join(out, "content", "inbox")), "nothing is left in the inbox").toEqual([]);
      /* The rules as git applies them, not as text: a drawing is ignored, the ledger is not,
         and neither kind of CAD file is ever line-ending normalised. */
      const git = (...args: string[]) => spawnSync("git", args, { cwd: REPO, encoding: "utf-8" });
      for (const rel of [byName["estate.dxf"].stored, byName["Site plan.pdf"].stored, "content/plans/x.dwg"]) {
        const ignored = git("check-ignore", "--no-index", "-q", rel);
        expect(ignored.status, `${rel} is ignored ${ignored.stderr}`).toBe(0);
      }
      const ledger = git("check-ignore", "--no-index", "-q", "content/plans/manifest.json");
      expect(ledger.status, `the plans ledger is committed ${ledger.stderr}`).toBe(1);
      const attrs = git("check-attr", "binary", "--", "content/plans/x.dwg", "content/plans/x.dxf");
      expect(attrs.status, attrs.stderr).toBe(0);
      expect(attrs.stdout).toContain("content/plans/x.dwg: binary: set");
      expect(attrs.stdout).toContain("content/plans/x.dxf: binary: set");

      /* ---- 3. The grading pass finds no photograph to grade. ----------------- */
      fs.copyFileSync(path.join(REPO, "content", "photo-selects.json"), path.join(out, "content", "photo-selects.json"));
      const sheet = await run("grading-sheet.mjs", [sheetDir, "--queue"], {}, out);
      expect(sheet.status, sheet.stderr + sheet.stdout).toBe(0);
      expect(sheet.stdout).toContain("no pending-grade photograph");
      expect(fs.existsSync(sheetDir), "no sheet is built from plans").toBe(false);

      /* ---- 4. Run again: every plan is a duplicate. -------------------------- */
      const again = await ingest([link, "--plans"], env);
      printed.push(again.stdout, again.stderr);
      expect(again.status, again.stderr).toBe(0);
      const second = lastRun();
      expect(second.counts.stored ?? 0).toBe(0);
      for (const name of [...Object.keys(plansServed), "Site plan (1).pdf"]) expect(second.byName[name].status, name).toBe("duplicate");
      expect(read("content/plans/manifest.json").plans).toHaveLength(8);

      /* ---- 5. The drawings are lost (gitignored: a clean, another checkout), the
         committed ledger is not, and the run is on a later day. Each is stored
         again under that day; its entry is replaced, not kept pointing at the
         missing file. Meanwhile a photograph run has queued the plan photo's bytes
         and its staged file is gone too: not `taken`, but still in the queue, so
         it is named beside the plan. */
      const LATER = "2026-01-03";
      const later = { ...env, INGEST_DATE: LATER };
      const pendingStaged = `content/owner-staging/2025-12-02/${sha256(bodies.photo).slice(0, 12)}-plan-photo.jpg`;
      const queueNow = read("content/grading-queue.json");
      queueNow.queue.push({
        staged: pendingStaged,
        publishAs: `/images/_owner/2025-12-02/${path.posix.basename(pendingStaged)}`,
        originalSha256: sha256(bodies.photo),
        provenance: "owner/drive/2025-12-02",
        tier: "A",
        origin: "camera",
        status: "pending-grade",
        added: "2025-12-02",
      });
      fs.writeFileSync(path.join(out, "content", "grading-queue.json"), JSON.stringify(queueNow, null, 2));
      fs.rmSync(path.join(out, "content", "plans", DATE), { recursive: true, force: true });
      const restored = await ingest([link, "--plans"], later);
      printed.push(restored.stdout, restored.stderr);
      expect(restored.status, restored.stderr).toBe(0);
      const third = lastRun();
      expect(third.counts.stored).toBe(8);
      expect(third.byName["Site plan (1).pdf"].status).toBe("duplicate");
      let plansNow = read("content/plans/manifest.json").plans;
      expect(plansNow).toHaveLength(8);
      for (const name of Object.keys(plansServed)) {
        const entries = plansNow.filter((p: { name: string }) => p.name === name);
        expect(entries, name).toHaveLength(1);
        expect(entries[0], name).toMatchObject({ stored: third.byName[name].stored, added: LATER, provenance: `owner/drive/${LATER}`, status: "stored" });
        expect(entries[0].stored, name).toMatch(new RegExp(`^content/plans/${LATER}/`));
        expect(fs.existsSync(onDisk(entries[0].stored)), name).toBe(true);
        expect(fs.readFileSync(onDisk(entries[0].stored)).equals(plansServed[name]!), name).toBe(true);
      }
      expect(plansNow.find((p: { name: string }) => p.name === "plan photo.jpg").alsoPhotograph, "a queued photograph is named even while its staging is gone").toBe(pendingStaged);
      expect(read("content/grading-queue.json"), "the queue is read, never written, by a plans run").toEqual(queueNow);
      /* And on that day, a further run finds every plan where the ledger says it is. */
      const settled = await ingest([link, "--plans"], later);
      printed.push(settled.stdout, settled.stderr);
      expect(settled.status, settled.stderr).toBe(0);
      const fourth = lastRun();
      expect(fourth.counts.stored ?? 0).toBe(0);
      for (const name of [...Object.keys(plansServed), "Site plan (1).pdf"]) expect(fourth.byName[name].status, name).toBe("duplicate");

      /* ---- 6. All of content/plans is lost, ledger included. ----------------- */
      fs.rmSync(path.join(out, "content", "plans"), { recursive: true, force: true });
      const fresh = await ingest([link, "--plans"], later);
      printed.push(fresh.stdout, fresh.stderr);
      expect(fresh.status, fresh.stderr).toBe(0);
      expect(lastRun().counts.stored).toBe(8);
      plansNow = read("content/plans/manifest.json").plans;
      expect(plansNow).toHaveLength(8);
      for (const name of Object.keys(plansServed)) expect(plansNow.filter((p: { name: string }) => p.name === name), name).toHaveLength(1);
      noRuling();

      /* No Drive ID and no resource key written or printed. */
      const secrets = [...Object.values(P), IDS.offsite, KEYS.photo];
      for (const rel of ["content/plans/manifest.json", "content/owner-intake.json", "content/grading-queue.json", "content/media/manifest.json"]) {
        const text = fs.readFileSync(path.join(out, rel), "utf-8");
        for (const s of secrets) expect(text, `${rel} leaks ${s}`).not.toContain(s);
      }
      for (const text of printed) for (const s of secrets) expect(text).not.toContain(s);
    } finally {
      drive.server.close();
      fs.rmSync(out, { recursive: true, force: true });
    }
  });
});
