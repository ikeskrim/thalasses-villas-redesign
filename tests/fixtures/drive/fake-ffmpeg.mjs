#!/usr/bin/env node
/**
 * A STAND-IN FOR FFMPEG, for tests/ingest-drive.spec.ts only.
 *
 * The spec must not depend on an ffmpeg being installed, and the pipeline must
 * not install one. What the spec needs to prove is not what ffmpeg makes of a
 * clip but WHICH commands the pipeline runs — that `--transcode-pending` runs
 * the lines a needs-transcode clip recorded, in order, up to the first WebM rung
 * that fits — and whether the byte budget is enforced on what comes out.
 *
 * So this decodes and encodes nothing. It answers `-version`, appends each argv to
 * FAKE_FFMPEG_LOG as one JSON line, and writes zero bytes at the output path,
 * which is ffmpeg's last argument. How many: FAKE_FFMPEG_SIZES, a JSON object
 * keyed by the output's file name (`{"loop-1920.webm": 3145728}`), when it names
 * that file; else FAKE_FFMPEG_BYTES; else 1024. A size of "fail" writes 1024
 * bytes and exits 1, as an encoder that broke part-way would. The script is run
 * with INGEST_FFMPEG_SHIM pointing here.
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
if (args[0] === "-version") {
  console.log("fake-ffmpeg — a test stand-in, not ffmpeg");
  process.exit(0);
}
fs.appendFileSync(process.env.FAKE_FFMPEG_LOG, JSON.stringify(args) + "\n");
const target = args.at(-1);
const sizes = JSON.parse(process.env.FAKE_FFMPEG_SIZES || "{}");
const size = sizes[path.basename(target)] ?? process.env.FAKE_FFMPEG_BYTES ?? 1024;
/* Like ffmpeg, never create the output's folder: the pipeline must make it first. */
if (!fs.existsSync(path.dirname(target))) {
  console.error(`${target}: No such file or directory`);
  process.exit(1);
}
fs.writeFileSync(target, Buffer.alloc(size === "fail" ? 1024 : Number(size)));
if (size === "fail") {
  console.error(`fake-ffmpeg: a deliberate encoder failure on ${path.basename(target)}`);
  process.exit(1);
}
