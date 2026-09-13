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
 * public Drive formats the script reads — the embedded folder listing and the
 * usercontent download, confirmation page included — both taken from Google's
 * live responses (SESSION-REPORT tranche twelve). The script is run exactly as
 * the maintainer runs it, with the two Google hosts pointed at this server.
 *
 * The folder is built to be hostile: a PDF wearing a .jpg name, a text file, a
 * photograph already in the library, the same photograph twice, a filename that
 * tries to climb out of its directory, a listing entry that links off Drive, a
 * photograph carrying GPS, and a video behind a confirmation page.
 */

const REPO = process.cwd();
const DATE = "2026-01-02";
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
};

const entry = (id: string, title: string, href: string) =>
  `<div class="flip-entry" id="entry-${id}" tabindex="0" role="link"><div class="flip-entry-info"><a href="${href}" target="_blank"><div class="flip-entry-visual"></div><div class="flip-entry-title">${title}</div></a></div></div>`;
const fileHref = (id: string) => `https://drive.google.com/file/d/${id}/view?usp=drive_web`;
const listing = (entries: string[]) => `<!DOCTYPE html><html><body><div class="flip-entries">${entries.join("")}</div></body></html>`;

function firstLibraryJpeg(): string {
  const dir = path.join(REPO, "public", "images", "_site");
  const f = fs.readdirSync(dir).find((n) => /\.jpe?g$/i.test(n));
  if (!f) throw new Error("no library JPEG to duplicate");
  return path.join(dir, f);
}

async function fixtures() {
  const photo = await sharp({ create: { width: 1600, height: 1000, channels: 3, background: { r: 40, g: 90, b: 130 } } })
    .jpeg({ quality: 90 })
    .withExif({ IFD0: { Artist: "owner phone" }, IFD3: { GPSLatitudeRef: "N", GPSLongitudeRef: "E" } })
    .toBuffer();
  const pdf = Buffer.from("%PDF-1.7\n%\xE2\xE3\xCF\xD3\n1 0 obj << /Type /Catalog >> endobj\ntrailer << >>\n%%EOF\n", "latin1");
  const text = Buffer.from("just some notes about the villas\n");
  const dupe = fs.readFileSync(firstLibraryJpeg());
  const ftyp = Buffer.alloc(32);
  ftyp.writeUInt32BE(32, 0);
  ftyp.write("ftypisom", 4, "latin1");
  ftyp.writeUInt32BE(0x200, 12);
  ftyp.write("isomiso2avc1mp41", 16, "latin1");
  const video = Buffer.concat([ftyp, Buffer.alloc(4096, 7)]);
  return { photo, pdf, text, dupe, video };
}

async function mockDrive(bytes: Record<string, Buffer>) {
  const confirmed = new Set<string>();
  const server = http.createServer((req, res) => {
    const u = new URL(req.url ?? "/", "http://mock");
    const id = u.searchParams.get("id") ?? "";
    if (u.pathname === "/embeddedfolderview") {
      res.setHeader("content-type", "text/html; charset=utf-8");
      if (id === IDS.root) {
        return res.end(
          listing([
            entry(IDS.photo, "../../escape attempt.JPG", fileHref(IDS.photo)),
            entry(IDS.pdf, "sunset.jpg", fileHref(IDS.pdf)),
            entry(IDS.text, "notes.txt", fileHref(IDS.text)),
            entry(IDS.dupe, "already-have-this.jpg", fileHref(IDS.dupe)),
            entry(IDS.offsite, "click me.jpg", `https://evil.example/file/d/${IDS.offsite}/view`),
            entry(IDS.sub, "Videos", `https://drive.google.com/drive/folders/${IDS.sub}`),
          ])
        );
      }
      if (id === IDS.sub) {
        return res.end(listing([entry(IDS.video, "drone pass.MP4", fileHref(IDS.video)), entry(IDS.photoAgain, "copy of photo.jpg", fileHref(IDS.photoAgain))]));
      }
      res.statusCode = 404;
      return res.end("<html>not found</html>");
    }
    if (u.pathname === "/download") {
      if (id === IDS.offsite) {
        res.statusCode = 500;
        return res.end("the script must never ask for this");
      }
      if (id === IDS.video && u.searchParams.get("confirm") !== "t") {
        confirmed.add("interstitial-served");
        res.setHeader("content-type", "text/html; charset=utf-8");
        return res.end(
          `<html><body><form id="download-form" action="/download" method="get">` +
            `<input type="hidden" name="id" value="${IDS.video}"><input type="hidden" name="export" value="download">` +
            `<input type="hidden" name="confirm" value="t"><input type="hidden" name="uuid" value="abc-123"></form></body></html>`
        );
      }
      const key = Object.entries(IDS).find(([, v]) => v === id)?.[0];
      const body = key ? bytes[key] : undefined;
      if (!body) {
        res.statusCode = 404;
        return res.end();
      }
      if (id === IDS.video) confirmed.add("confirmed-download");
      res.setHeader("content-type", "application/octet-stream");
      res.setHeader("content-disposition", `attachment; filename="${key}.bin"`);
      return res.end(body);
    }
    res.statusCode = 404;
    res.end();
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { server, base, confirmed };
}

/* Asynchronous on purpose: the mock Drive lives in this process, and a
   synchronous spawn would block the very server the script is talking to. */
function ingest(args: string[], env: Record<string, string>) {
  return new Promise<{ status: number | null; stdout: string; stderr: string }>((resolve) => {
    const child = spawn(process.execPath, [path.join(REPO, "scripts", "ingest-drive.mjs"), ...args], {
      cwd: REPO,
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

test.describe("owner material pipeline", () => {
  test.setTimeout(180_000);

  test("accepts only Drive share links, and only from its argument", async () => {
    const { parseDriveLink } = await import("../scripts/ingest-drive.mjs");
    expect(parseDriveLink("https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp?usp=sharing")).toEqual({ kind: "folder", id: "1AbCdEfGhIjKlMnOp" });
    expect(parseDriveLink("https://drive.google.com/drive/u/0/folders/1AbCdEfGhIjKlMnOp")).toEqual({ kind: "folder", id: "1AbCdEfGhIjKlMnOp" });
    expect(parseDriveLink("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view")).toEqual({ kind: "file", id: "1AbCdEfGhIjKlMnOp" });
    for (const bad of [
      "http://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp",
      "https://drive.google.com.evil.example/drive/folders/1AbCdEfGhIjKlMnOp",
      "https://evil.example/drive/folders/1AbCdEfGhIjKlMnOp",
      "https://user:pw@drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp",
      "https://drive.google.com/drive/folders/..%2F..",
      "not a link",
    ]) {
      expect(parseDriveLink(bad), bad).toBeNull();
    }
    const r = await ingest(["https://evil.example/drive/folders/1AbCdEfGhIjKlMnOp"], {});
    expect(r.status).toBe(2);
  });

  test("decides type by content, never by name", async () => {
    const { sniff } = await import("../scripts/ingest-drive.mjs");
    const f = await fixtures();
    expect(sniff(f.photo)).toEqual({ kind: "image", type: "jpeg" });
    expect(sniff(f.video)).toEqual({ kind: "video", type: "mp4" });
    expect(sniff(f.pdf)).toBeNull();
    expect(sniff(f.text)).toBeNull();
    expect(sniff(await sharp({ create: { width: 4, height: 4, channels: 3, background: "#fff" } }).png().toBuffer())).toEqual({ kind: "image", type: "png" });
    expect(sniff(await sharp({ create: { width: 4, height: 4, channels: 3, background: "#fff" } }).webp().toBuffer())).toEqual({ kind: "image", type: "webp" });
  });

  test("a dummy folder: routes photos and video, refuses the rest, publishes no key", async () => {
    const f = await fixtures();
    const drive = await mockDrive({ photo: f.photo, photoAgain: f.photo, pdf: f.pdf, text: f.text, dupe: f.dupe, video: f.video });
    const out = fs.mkdtempSync(path.join(os.tmpdir(), "ingest-drive-"));
    const env = { INGEST_DRIVE_BASE: drive.base, INGEST_DOWNLOAD_BASE: drive.base, INGEST_OUT_ROOT: out, INGEST_DATE: DATE, FFMPEG_PATH: "ffmpeg-deliberately-absent" };
    const link = `https://drive.google.com/drive/folders/${IDS.root}?usp=sharing`;
    try {
      const r = await ingest([link], env);
      expect(r.status, r.stderr + r.stdout).toBe(0);

      const intake = JSON.parse(fs.readFileSync(path.join(out, "content", "owner-intake.json"), "utf-8"));
      const run = intake.runs.at(-1);
      const byName = Object.fromEntries(run.files.map((x: { name: string }) => [x.name, x]));

      expect(byName["../../escape attempt.JPG"].status).toBe("ingested");
      expect(byName["sunset.jpg"].status).toBe("rejected");
      expect(byName["sunset.jpg"].reason).toContain("pdf");
      expect(byName["notes.txt"].status).toBe("rejected");
      expect(byName["already-have-this.jpg"].status).toBe("duplicate");
      expect(byName["already-have-this.jpg"].of).toMatch(/^\/images\/_site\//);
      expect(byName["copy of photo.jpg"].status).toBe("duplicate");
      expect(byName["click me.jpg"].status).toBe("skipped");
      expect(byName["drone pass.MP4"].status).toBe("needs-transcode");
      expect(drive.confirmed.has("interstitial-served") && drive.confirmed.has("confirmed-download")).toBe(true);

      /* The photograph: inside its dated folder, upright, no metadata at all. */
      const published: string = byName["../../escape attempt.JPG"].published;
      expect(published).toMatch(new RegExp(`^/images/_owner/${DATE}/[0-9a-f]{12}-escape-attempt\\.jpg$`));
      const meta = await sharp(path.join(out, "public", published.slice(1))).metadata();
      expect(meta.exif).toBeUndefined();
      expect(meta.format).toBe("jpeg");

      const provenance = JSON.parse(fs.readFileSync(path.join(out, "content", "image-provenance.json"), "utf-8"));
      expect(provenance.images[published].note).toContain(`owner/drive/${DATE}`);
      const queue = JSON.parse(fs.readFileSync(path.join(out, "content", "grading-queue.json"), "utf-8"));
      expect(queue.queue).toContainEqual(expect.objectContaining({ path: published, tier: "A", status: "pending-grade", provenance: `owner/drive/${DATE}` }));

      /* The video: original kept local, variants specified, commands recorded. */
      const media = JSON.parse(fs.readFileSync(path.join(out, "content", "media", "manifest.json"), "utf-8"));
      const clip = media.videos.at(-1);
      expect(clip.original).toMatch(new RegExp(`^content/media/originals/${DATE}/`));
      expect(clip.spec.maxBytes).toBeLessThanOrEqual(2.5 * 1024 * 1024);
      expect(clip.commands[0]).toContain("poster.jpg");

      /* Refused files do not linger in the inbox. */
      const inbox = fs.readdirSync(path.join(out, "content", "inbox", DATE));
      expect(inbox.filter((n) => /\.(pdf|txt|part)$/.test(n))).toEqual([]);

      /* No Drive ID written anywhere — the repo is public and the ID is a key. */
      for (const rel of ["content/owner-intake.json", "content/image-provenance.json", "content/grading-queue.json", "content/media/manifest.json"]) {
        const text = fs.readFileSync(path.join(out, rel), "utf-8");
        for (const id of Object.values(IDS)) expect(text, `${rel} leaks ${id}`).not.toContain(id);
      }
      expect(r.stdout).not.toContain(IDS.root);

      /* Run it again: everything already taken is now a duplicate. */
      const again = await ingest([link], env);
      expect(again.status, again.stderr).toBe(0);
      const second = JSON.parse(fs.readFileSync(path.join(out, "content", "owner-intake.json"), "utf-8")).runs.at(-1);
      expect(second.counts.ingested ?? 0).toBe(0);
      expect(second.files.find((x: { name: string }) => x.name === "../../escape attempt.JPG").status).toBe("duplicate");
    } finally {
      drive.server.close();
      fs.rmSync(out, { recursive: true, force: true });
    }
  });
});
