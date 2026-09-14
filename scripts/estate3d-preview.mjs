#!/usr/bin/env node
/**
 * THE 3D ESTATE MAP, BUILT FOR REVIEW — never for the public.
 *
 *   node scripts/estate3d-preview.mjs build   # into .next-estate3d/
 *   node scripts/estate3d-preview.mjs start   # serves it on :3035
 *
 * `content/estate-plan.json` is still "inferred-from-aerials, unverified", so a
 * normal build keeps the 3D map closed (DECISIONS.md D-021; the gate is
 * src/lib/estate-plan-gate.ts). The diagram still has to be worked on, tested
 * and measured before the owner's site plan arrives. This builds a SEPARATE copy
 * with `ESTATE_3D_PREVIEW=1`, in its own distDir and on its own port, so:
 *  - `npm run qa` keeps testing the real, gate-closed build on :3005;
 *  - `npm run qa:estate3d` tests the diagram against this one on :3035;
 *  - nothing here can reach a deployment. The gate throws if the flag is ever
 *    set on Vercel, and this script refuses to run there at all.
 *
 * The diagram built here carries a visible "unverified" band, so a screenshot
 * of it cannot be mistaken for the public page.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const mode = process.argv[2];
const PORT = "3035";
const DIST = ".next-estate3d";

if (process.env.VERCEL) {
  console.error("estate3d-preview: refusing to run on Vercel. This build is local-only (DECISIONS.md D-021).");
  process.exit(1);
}
if (mode !== "build" && mode !== "start") {
  console.error("usage: node scripts/estate3d-preview.mjs build | start");
  process.exit(2);
}

const env = { ...process.env, ESTATE_3D_PREVIEW: "1", NEXT_DIST_DIR: DIST };
const nextBin = path.join("node_modules", "next", "dist", "bin", "next");

function run(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, { stdio: "inherit", env });
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

/*
 * next-env.d.ts IS LEFT EXACTLY AS IT WAS.
 *
 * `next build` rewrites that tracked file to import the route types from the
 * distDir it is building into, so every review build changed
 * `./.next/types/...` to `./.next-estate3d/types/...` and left a dirty file in
 * the working tree. Committed by accident, it points `tsc` and every editor at
 * the review build's types instead of the public build's. So its bytes are
 * saved before the build and written back after it, whatever the build's exit
 * code, and on Ctrl+C too. The public build (`npm run build`) regenerates the
 * file for `.next` as it always has.
 *
 * A BUILD KILLED OUTRIGHT CANNOT RESTORE ANYTHING. Stop-Process, taskkill /F, or
 * a peer session killing node by name (it has happened on this machine) ends
 * the process before any handler runs, and leaves the file pointing at
 * `./.next-estate3d/types`. Saving those bytes as the baseline would then make
 * every later review build faithfully restore the damage. So a baseline that
 * already names the review build's types is repaired to `./.next/types` before
 * it is saved, and the build puts back the repaired file. The console signals
 * that can be caught (Ctrl+C, Ctrl+Break, the console window closing, a plain
 * kill) all restore.
 */
const NEXT_ENV = "next-env.d.ts";

if (mode === "build") {
  /* The same two steps as `npm run build`: the redirect map is derived first. */
  const redirects = await run([path.join("scripts", "build-redirects.mjs")]);
  if (redirects !== 0) process.exit(redirects);

  const read = () => (fs.existsSync(NEXT_ENV) ? fs.readFileSync(NEXT_ENV) : null);
  const onDisk = read();
  const reviewTypes = `./${DIST}/types/`;
  const saved = onDisk !== null && onDisk.includes(reviewTypes) ? Buffer.from(onDisk.toString("utf8").replaceAll(reviewTypes, "./.next/types/"), "utf8") : onDisk;
  if (saved !== onDisk) console.log(`estate3d-preview: ${NEXT_ENV} named ${reviewTypes} before this build (a review build that was killed); it is put back pointing at ./.next/types/.`);
  /* Exactly as it was: the same bytes, or no file if there was none. Untouched when nothing changed, so its mtime stays too. */
  const restore = () => {
    const now = read();
    if (saved === null) {
      if (now !== null) fs.rmSync(NEXT_ENV);
    } else if (now === null || !now.equals(saved)) {
      fs.writeFileSync(NEXT_ENV, saved);
    }
  };
  for (const [signal, code] of [
    ["SIGINT", 130],
    ["SIGBREAK", 149],
    ["SIGHUP", 129],
    ["SIGTERM", 143],
  ]) {
    process.once(signal, () => {
      restore();
      process.exit(code);
    });
  }
  let code = 1;
  try {
    code = await run([nextBin, "build"]);
  } finally {
    restore();
  }
  process.exit(code);
} else {
  process.exit(await run([nextBin, "start", "-p", PORT]));
}
