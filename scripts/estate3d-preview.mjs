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

if (mode === "build") {
  /* The same two steps as `npm run build`: the redirect map is derived first. */
  const redirects = await run([path.join("scripts", "build-redirects.mjs")]);
  if (redirects !== 0) process.exit(redirects);
  process.exit(await run([nextBin, "build"]));
} else {
  process.exit(await run([nextBin, "start", "-p", PORT]));
}
