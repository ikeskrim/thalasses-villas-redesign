import { test, expect } from "@playwright/test";
import { spawn } from "node:child_process";
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
    };
    const rootEntries = [
      entry(IDS.photo, "../../escape attempt.JPG", fileHref(IDS.photo)),
      entry(IDS.second, "second.jpg", fileHref(IDS.second)),
      entry(IDS.pdf, "sunset.jpg", fileHref(IDS.pdf)),
      entry(IDS.text, "notes.txt", fileHref(IDS.text)),
      entry(IDS.dupe, "already-have-this.jpg", fileHref(IDS.dupe)),
      entry(IDS.heic, "IMG_0001.HEIC", fileHref(IDS.heic)),
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
      expect(byName["drone audio.mp4"].status).toBe("rejected");
      expect(byName["drone audio.mp4"].reason).toContain("audio");
      expect(byName["notes.txt"].status).toBe("rejected");
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

      /* The video: original kept local; the recorded commands are the plan heroVariants() runs. */
      let clip = read("content/media/manifest.json").videos.at(-1);
      expect(clip.original).toMatch(new RegExp(`^content/media/originals/${DATE}/`));
      expect(clip.spec.maxBytes).toBeLessThanOrEqual(2.5 * 1024 * 1024);
      expect(clip.commands).toEqual(heroVariantPlan(clip.original, `content/media/${clip.slug}`).map((s) => commandLine(s.args)));
      expect(clip.commands[0]).toContain("poster.jpg");
      expect(clip.commands[1]).toContain("-b:v 2411k -maxrate 2411k -bufsize 4822k");
      expect(clip.commands[2]).toContain("-c:v libvpx-vp9 -row-mt 1 -deadline good");

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

      /* ---- 6. --transcode-pending runs exactly the commands the clip recorded. */
      const log = path.join(out, "ffmpeg.jsonl");
      const cut = await ingest(["--transcode-pending"], { ...env, INGEST_FFMPEG_SHIM: FAKE_FFMPEG, FAKE_FFMPEG_LOG: log });
      printed.push(cut.stdout, cut.stderr);
      expect(cut.status, cut.stderr + cut.stdout).toBe(0);
      clip = read("content/media/manifest.json").videos.at(-1);
      expect(clip.status).toBe("variants-ready");
      expect(clip.commands).toBeUndefined();
      expect(clip.variants.map((v: { file: string }) => path.posix.basename(v.file))).toEqual(["poster.jpg", "loop-1080.mp4", "loop-1080.webm"]);
      for (const v of clip.variants) expect(v.bytes).toBeLessThanOrEqual(clip.spec.maxBytes);
      const ran = fs
        .readFileSync(log, "utf-8")
        .trim()
        .split("\n")
        .map((l) => JSON.parse(l));
      expect(ran).toEqual(heroVariantPlan(clip.original, `content/media/${clip.slug}`).map((s) => s.args));

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
});
