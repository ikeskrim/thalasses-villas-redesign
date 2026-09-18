/**
 * WHAT THE INP RECORD WAS MEASURED ON — the 3D estate map's fingerprint, and
 * the one place the INP record is read from disk (DECISIONS.md D-028).
 *
 * The gate's INP condition (`decideInpCondition` in estate-plan-gate.ts) holds
 * only for the tree that was measured. A committed harness record says "every
 * tap was under 200 ms" about one mount path, one set of dependencies and one
 * drawn plan; change any of them and the record no longer describes what would
 * be served, so the gate closes again until the harness is run on the new tree.
 *
 * The fingerprint is sha256 over, in this order:
 *  (a) the mount-path sources: every file in src/components/sections whose name
 *      starts with "EstateMap" or "estate-map" (and every file under a
 *      subdirectory so named), plus src/lib/schedule.ts if it exists — each as
 *      its repository path and its text with CRLF normalised to LF, sorted by
 *      path. A new module on the mount path must be named to fall under this.
 *      This file is deliberately NOT under it: it decides what is measured, not
 *      what is served;
 *  (b) the installed versions of three, react, react-dom and next, read from
 *      node_modules/<package>/package.json;
 *  (c) a canonical digest of the plan's DRAWN geometry: for every element with
 *      a position, in plan order (the order places and labels are laid out in),
 *      its id, kind, position, orientation, footprint, storeys, and whether it
 *      links anywhere (a linked element becomes a labelled place). Never its
 *      provenance, basis, notes, name, sources or decision — so the owner
 *      verifying the plan as it stands does not by itself invalidate a record,
 *      and moving, resizing, adding or removing a drawn element does.
 *
 * NODE-IMPORTABLE ON PURPOSE. `scripts/check-estate-gate.mjs` and the INP
 * harness import this file through Node's type stripping, and
 * `src/lib/estate-plan.ts` imports it at build time. So: `node:` built-ins only,
 * a type-only import from the gate, erasable TypeScript, no path aliases and no
 * "server-only".
 *
 * NOT TRACED. Every path here is joined onto a `root` the bundler cannot know,
 * and without `turbopackIgnore` Turbopack traced the whole repository into the
 * estate page's server output (1,515 files against 1,193; its build warned
 * "Dynamic filesystem access causes tracing of the whole project"). The page is
 * prerendered, so these reads happen at build time only and nothing needs
 * tracing. If a server ever did run this without the sources beside it, the
 * read fails, `estate3dInpInput` reports it, and the gate stays closed.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { EstatePlan, InpInput } from "./estate-plan-gate";

export const FINGERPRINT_SCHEMA = "estate3d-fingerprint/1";
/** Must equal INP_GATE_RECORD_PATH in estate-plan-gate.ts (a runtime import would need a .ts specifier; a test checks the two agree). */
export const INP_RECORD_FILE = "qa/perf/INP-estate3d-gate.json";
export const MOUNT_PATH_DIR = "src/components/sections";
export const MOUNT_PATH_PREFIXES = ["EstateMap", "estate-map"] as const;
export const MOUNT_PATH_EXTRA = ["src/lib/schedule.ts"] as const;
export const FINGERPRINTED_PACKAGES = ["three", "react", "react-dom", "next"] as const;

export interface Estate3DFingerprint {
  /** sha256, lowercase hex. */
  fingerprint: string;
  /** The parts, for a log that has to explain a mismatch. */
  files: { path: string; sha256: string }[];
  versions: Record<string, string>;
  geometry: string;
}

const sha256 = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");
const toPosix = (p: string) => p.split(path.sep).join("/");
const lf = (text: string) => text.replace(/\r\n/g, "\n");

/** A value with every object's keys sorted, so the JSON of equal data is equal text. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) out[key] = canonical((value as Record<string, unknown>)[key]);
    return out;
  }
  return value;
}

function filesUnder(root: string, relDir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(path.join(/* turbopackIgnore: true */ root, relDir), { withFileTypes: true })) {
    const rel = `${relDir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...filesUnder(root, rel));
    else if (entry.isFile()) out.push(rel);
  }
  return out;
}

/** The mount-path source files, as repository paths with "/" separators, sorted by code unit. */
export function mountPathFiles(root: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(path.join(/* turbopackIgnore: true */ root, MOUNT_PATH_DIR), { withFileTypes: true })) {
    if (!MOUNT_PATH_PREFIXES.some((prefix) => entry.name.startsWith(prefix))) continue;
    const rel = `${MOUNT_PATH_DIR}/${entry.name}`;
    if (entry.isDirectory()) files.push(...filesUnder(root, rel));
    else if (entry.isFile()) files.push(rel);
  }
  for (const extra of MOUNT_PATH_EXTRA) {
    if (fs.existsSync(path.join(/* turbopackIgnore: true */ root, extra))) files.push(extra);
  }
  return files.map(toPosix).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/** The drawn geometry, in the canonical form the digest is taken over. */
export function drawnGeometry(plan: EstatePlan) {
  return plan.elements
    .filter((e) => e.position !== null)
    .map((e) =>
      canonical({
        id: e.id,
        kind: e.kind,
        position: e.position,
        /* What the renderer receives (toRenderPlan): a missing orientation draws at 0°. */
        orientationDeg: e.orientation?.deg ?? 0,
        footprint: e.footprint,
        storeys: e.storeys,
        linked: e.href !== null,
      })
    );
}

export function estate3dFingerprint(root: string, plan: EstatePlan): Estate3DFingerprint {
  const hash = createHash("sha256");
  hash.update(`${FINGERPRINT_SCHEMA}\n`);

  const files = mountPathFiles(root).map((rel) => {
    const text = lf(fs.readFileSync(path.join(/* turbopackIgnore: true */ root, rel), "utf8"));
    hash.update(`file ${rel} ${Buffer.byteLength(text, "utf8")}\n`);
    hash.update(text, "utf8");
    hash.update("\n");
    return { path: rel, sha256: sha256(text) };
  });

  const versions: Record<string, string> = {};
  for (const pkg of FINGERPRINTED_PACKAGES) {
    const file = path.join(/* turbopackIgnore: true */ root, "node_modules", pkg, "package.json");
    const version = (JSON.parse(fs.readFileSync(file, "utf8")) as { version?: unknown }).version;
    if (typeof version !== "string" || !version) throw new Error(`${toPosix(path.relative(root, file))} has no version`);
    versions[pkg] = version;
    hash.update(`package ${pkg} ${version}\n`);
  }

  const geometry = sha256(JSON.stringify(drawnGeometry(plan)));
  hash.update(`geometry ${geometry}\n`);

  return { fingerprint: hash.digest("hex"), files, versions, geometry };
}

/**
 * The committed INP record, parsed. Absent: `record: null` (the gate says "no
 * record"). Present but unreadable: `readError` (the gate stays closed and says
 * why) — a bad evidence file closes the map, it does not break the build.
 */
export function readInpRecord(root: string): { record: unknown; readError?: string } {
  const file = path.join(/* turbopackIgnore: true */ root, INP_RECORD_FILE);
  let text: string;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch (e) {
    if ((e as { code?: string }).code === "ENOENT") return { record: null };
    return { record: null, readError: `${INP_RECORD_FILE}: ${(e as Error).message}` };
  }
  try {
    return { record: JSON.parse(text) as unknown };
  } catch (e) {
    return { record: null, readError: `${INP_RECORD_FILE} is not valid JSON: ${(e as Error).message}` };
  }
}

/**
 * The INP input every caller of `decideEstate3D` passes: the build,
 * check-estate-gate and the tests. A fingerprint that cannot be computed (a
 * source or a package missing) closes the gate with the reason; it does not
 * throw, because a closed map is the safe failure and the log says why.
 */
export function estate3dInpInput(root: string, plan: EstatePlan): InpInput {
  const { record, readError } = readInpRecord(root);
  const input: InpInput = { record, fingerprint: "" };
  try {
    input.fingerprint = estate3dFingerprint(root, plan).fingerprint;
  } catch (e) {
    input.fingerprintError = (e as Error).message.split("\n")[0];
  }
  if (readError !== undefined) input.readError = readError;
  return input;
}
