#!/usr/bin/env node
/**
 * A STAND-IN FOR FFMPEG, for tests/ingest-drive.spec.ts only.
 *
 * No ffmpeg is installed on the machines this suite runs on, and the pipeline
 * must not install one. What the spec needs to prove is not what ffmpeg makes of
 * a clip but WHICH commands the pipeline runs — that `--transcode-pending` runs
 * exactly the lines a needs-transcode clip recorded — and whether the byte budget
 * is enforced on what comes out.
 *
 * So this decodes and encodes nothing. It answers `-version`, appends each argv to
 * FAKE_FFMPEG_LOG as one JSON line, and writes FAKE_FFMPEG_BYTES zero bytes (1024
 * by default) at the output path, which is ffmpeg's last argument. The script is
 * run with INGEST_FFMPEG_SHIM pointing here.
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
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, Buffer.alloc(Number(process.env.FAKE_FFMPEG_BYTES ?? 1024)));
