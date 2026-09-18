/**
 * THE ESTATE PLAN'S PROVENANCE GATE — pure logic, no file access, so the tests
 * can run every branch of it without a build.
 *
 * `content/estate-plan.json` is the single source of the 3D estate map's
 * geometry (DECISIONS.md D-021). The owner's ruling, in its own words: the 3D
 * map renders publicly ONLY when provenance is "owner-verified"; until then the
 * 2D hotspot map stays live. Everything below exists to make that ruling
 * mechanical rather than a matter of someone remembering it.
 *
 * WHAT OPENS THE GATE (D-022 records these as build defaults, not rulings):
 *  - Every element the diagram would DRAW — every element with a position —
 *    must be "owner-verified". The lane, the compound outline and the helipad
 *    apron are elements too: a diagram that went public drawing a verified villa
 *    beside an unverified lane would still be presenting an inference as fact.
 *  - An element with no position is not drawn, so it cannot block the gate. It
 *    stays in the numbered list beneath the map, and the note names it.
 *  - The four villas must be drawn. A diagram of the estate without them is not
 *    the thing the owner approved.
 *  - "owner-verified" is accepted only with the DECISIONS.md entry that relayed
 *    the owner's confirmation (`decision: "D-0NN"`). No session sets it from its
 *    own reading of a plan or a photograph (D-021, "What it does not settle").
 *
 * THE REVIEW PREVIEW. `ESTATE_3D_PREVIEW=1` opens the gate for a LOCAL build
 * (`scripts/estate3d-preview.mjs`) so the diagram can be worked on and measured
 * before the plan is verified. On any Vercel build it throws: this project's
 * preview deployments are public by link (DEPLOY.md, deployment protection
 * disabled), so "not on production" is not the same as "not public", and a
 * build that silently ignored the flag would teach someone that setting it is
 * harmless.
 *
 * THE SECOND CONDITION: INP (D-028). The owner's words: "the gate stays closed
 * until the tap stays under 200 ms", and that holds even once the plan is
 * owner-verified. So the public build opens only when provenance passes AND the
 * committed harness record (`qa/perf/INP-estate3d-gate.json`, written by
 * `scripts/estate-inp.mjs`) shows every measured review-build tap under 200 ms
 * for the code, dependencies and geometry being built now. The verdict is
 * recomputed here from the record's per-trial rows; a stored pass flag is never
 * read. `decideInpCondition` below has the rules. The review build ignores this
 * condition, because the review build is what gets measured.
 *
 * WHY THE DECISION IS MADE ON THE SERVER. `/en/the-estate` is prerendered. When
 * the gate is closed the page passes `null` to the client: no geometry in the
 * HTML or the flight data, the client hook returns before its WebGL probe, and
 * three.js is never requested. A check made in the browser could still ship
 * the plan and the chunk.
 *
 * NO NODE APIS IN THIS FILE. Client components import its types, and
 * `scripts/check-estate-gate.mjs` imports it through Node's type stripping, so
 * it stays pure, erasable TypeScript. The file reading and the fingerprint live
 * in `estate-3d-fingerprint.ts`.
 */

export const PROVENANCE_VERIFIED = "owner-verified";
export const PROVENANCE_INFERRED = "inferred-from-aerials, unverified";
export const PROVENANCE_NONE = "not-established";

export type Provenance = typeof PROVENANCE_VERIFIED | typeof PROVENANCE_INFERRED | typeof PROVENANCE_NONE;

export const ELEMENT_KINDS = [
  "villa",
  "pool",
  "shore",
  "venue",
  "helipad",
  "table",
  "garden",
  "lane",
  "compound",
  "apron",
] as const;
export type ElementKind = (typeof ELEMENT_KINDS)[number];

/** Every element D-021 names. The drawn context shapes (lane, compound, apron) come on top. */
export const REQUIRED_ELEMENT_IDS = [
  "thoi",
  "persi",
  "melia",
  "eeanthe",
  "pueblo",
  "thoi-pool",
  "persi-pool",
  "melia-pool",
  "eeanthe-pool",
  "beach-line",
  "long-table",
  "vegetable-garden",
  "helipad",
  "rituals-venue",
] as const;

export const VILLA_IDS = ["thoi", "persi", "melia", "eeanthe"] as const;

export interface PlanPoint {
  x: number;
  z: number;
}

/** A rectangle (width along the element's own long axis) or an outline of points. */
export type Footprint = { w: number; d: number } | { points: [number, number][] };

export interface EstateElement {
  id: string;
  kind: ElementKind;
  name: string;
  href: string | null;
  position: PlanPoint | null;
  orientation: { deg: number } | null;
  footprint: Footprint | null;
  storeys: number | null;
  provenance: Provenance;
  /** The DECISIONS.md entry that relayed the owner's confirmation. Required when verified. */
  decision?: string;
  basis: { identity: string; position: string; orientation: string; footprint: string };
  stated: { fact: string; source: string }[];
  sources: string[];
  notes: string;
}

export interface EstatePlan {
  $comment?: string;
  version: 1;
  frame: {
    units: "schematic";
    origin: string;
    x: string;
    z: string;
    bearing: null;
    orientation: string;
  };
  elements: EstateElement[];
}

/** What the client receives — only when the gate is open, and only the drawn elements. */
export interface RenderElement {
  id: string;
  kind: ElementKind;
  name: string;
  href: string | null;
  position: PlanPoint;
  orientationDeg: number;
  footprint: Footprint | null;
  storeys: number | null;
}

export interface RenderPlan {
  /** A fixed marker, so a test can prove a closed gate shipped no plan at all. */
  schema: "estate-render-plan/1";
  /** True only on a local review build. The diagram says so on its face. */
  preview: boolean;
  elements: RenderElement[];
  /** Names of the D-021 elements with no position, for the note. */
  notDrawn: string[];
}

export interface GateEnv {
  ESTATE_3D_PREVIEW?: string;
  VERCEL?: string;
}

/** One condition's verdict. `applied: false` means this build does not let it decide (the review build). */
export interface ConditionVerdict {
  pass: boolean;
  applied: boolean;
  reason: string;
}

/** The INP condition's verdict, recomputed from the record's rows. */
export interface InpVerdict {
  pass: boolean;
  /** One line per failed condition, each beginning "INP: ". Empty when the condition passes. */
  reasons: string[];
  /** The reasons joined with "; ", or, when it passes, what the record showed. */
  reason: string;
}

export interface GateDecision {
  open: boolean;
  preview: boolean;
  /** Names both conditions: "provenance: …; INP: …". */
  reason: string;
  provenance: ConditionVerdict;
  /** Evaluated on every build, so the log shows it even while provenance keeps the gate closed. */
  inp: InpVerdict & { applied: boolean; fingerprint: string };
}

const isFiniteNumber = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

/** Every structural rule the plan file must satisfy. An empty array means valid. */
export function validatePlan(plan: EstatePlan): string[] {
  const errors: string[] = [];
  if (!plan || plan.version !== 1 || !Array.isArray(plan.elements)) return ["plan must be { version: 1, elements: [...] }"];
  if (plan.frame?.units !== "schematic" || plan.frame?.bearing !== null) {
    errors.push('frame must declare units "schematic" and bearing null — no aerial on record carries a bearing');
  }

  const ids = new Set<string>();
  for (const e of plan.elements) {
    const at = `element ${JSON.stringify(e?.id)}`;
    if (typeof e?.id !== "string" || !e.id) {
      errors.push("every element needs an id");
      continue;
    }
    if (ids.has(e.id)) errors.push(`${at}: duplicate id`);
    ids.add(e.id);
    if (!(ELEMENT_KINDS as readonly string[]).includes(e.kind)) errors.push(`${at}: unknown kind ${JSON.stringify(e.kind)}`);
    if (typeof e.name !== "string" || !e.name) errors.push(`${at}: needs a name`);
    if (e.href !== null && !(typeof e.href === "string" && e.href.startsWith("/en/"))) {
      errors.push(`${at}: href must be null or a site route under /en/`);
    }

    const allowed = [PROVENANCE_VERIFIED, PROVENANCE_INFERRED, PROVENANCE_NONE];
    if (!allowed.includes(e.provenance)) errors.push(`${at}: provenance must be one of ${allowed.join(" | ")}`);
    if (e.position === null && e.provenance !== PROVENANCE_NONE) {
      errors.push(`${at}: an element with no position is "${PROVENANCE_NONE}"`);
    }
    if (e.position !== null && e.provenance === PROVENANCE_NONE) {
      errors.push(`${at}: "${PROVENANCE_NONE}" cannot carry a position`);
    }
    if (e.provenance === PROVENANCE_VERIFIED && !/^D-\d{3}$/.test(e.decision ?? "")) {
      errors.push(`${at}: "${PROVENANCE_VERIFIED}" needs the DECISIONS.md entry that relayed it (decision: "D-0NN")`);
    }
    if (e.provenance !== PROVENANCE_VERIFIED && e.decision !== undefined) {
      errors.push(`${at}: only an owner-verified element carries a decision`);
    }

    if (e.position !== null && !(isFiniteNumber(e.position?.x) && isFiniteNumber(e.position?.z))) {
      errors.push(`${at}: position must be { x, z } numbers or null`);
    }
    if (e.orientation !== null && !isFiniteNumber(e.orientation?.deg)) errors.push(`${at}: orientation must be { deg } or null`);
    if (e.footprint !== null) {
      const f = e.footprint as Record<string, unknown>;
      const rect = isFiniteNumber(f.w) && isFiniteNumber(f.d) && (f.w as number) > 0 && (f.d as number) > 0;
      const outline =
        Array.isArray(f.points) &&
        f.points.length >= 2 &&
        f.points.every((p) => Array.isArray(p) && p.length === 2 && isFiniteNumber(p[0]) && isFiniteNumber(p[1]));
      if (!rect && !outline) errors.push(`${at}: footprint must be { w, d } (positive), { points: [[x, z], ...] } or null`);
    }
    if (e.storeys !== null && !(Number.isInteger(e.storeys) && e.storeys > 0)) errors.push(`${at}: storeys must be a positive integer or null`);

    for (const k of ["identity", "position", "orientation", "footprint"] as const) {
      if (typeof e.basis?.[k] !== "string" || !e.basis[k]) errors.push(`${at}: basis.${k} must say where the value comes from`);
    }
    if (e.position === null && e.basis?.position !== PROVENANCE_NONE) {
      errors.push(`${at}: with no position, basis.position is "${PROVENANCE_NONE}"`);
    }
  }
  for (const id of REQUIRED_ELEMENT_IDS) if (!ids.has(id)) errors.push(`missing required element ${id} (D-021)`);
  return errors;
}

/**
 * The server's decision for one build. Throws on a malformed plan or a preview flag on Vercel.
 *
 * `inp` is the committed harness record and the fingerprint of the tree being
 * built, as `estate3dInpInput()` (estate-3d-fingerprint.ts) reads them. A
 * missing `inp` decides as "no record": closed.
 */
export function decideEstate3D(plan: EstatePlan, env: GateEnv, inp: InpInput): GateDecision {
  const errors = validatePlan(plan);
  if (errors.length) {
    throw new Error(`content/estate-plan.json is invalid:\n  - ${errors.join("\n  - ")}`);
  }

  const drawn = plan.elements.filter((e) => e.position !== null);
  const drawnIds = new Set(drawn.map((e) => e.id));
  const missingVillas = VILLA_IDS.filter((id) => !drawnIds.has(id));
  const unverified = drawn.filter((e) => e.provenance !== PROVENANCE_VERIFIED).map((e) => e.id);

  const provenance: ConditionVerdict = missingVillas.length
    ? { pass: false, applied: true, reason: `the four villas are not all placed (${missingVillas.join(", ")})` }
    : unverified.length
      ? { pass: false, applied: true, reason: `not owner-verified: ${unverified.join(", ")}` }
      : { pass: true, applied: true, reason: "every drawn element is owner-verified" };
  const inpVerdict = decideInpCondition(inp);
  const fingerprint = typeof inp?.fingerprint === "string" ? inp.fingerprint : "";

  if (env.ESTATE_3D_PREVIEW === "1") {
    if (env.VERCEL) {
      throw new Error(
        "ESTATE_3D_PREVIEW is set on a Vercel build. It is for local review builds only " +
          "(scripts/estate3d-preview.mjs): Vercel preview deployments here are public by link, " +
          "and the 3D map is public only when the plan is owner-verified (DECISIONS.md D-021). Unset it."
      );
    }
    /* The review build is what the INP harness measures, so the INP condition cannot gate it. */
    const inpNotApplied = { ...inpVerdict, applied: false, fingerprint };
    if (missingVillas.length) {
      const reason = `preview requested, but the four villas are not all placed (${missingVillas.join(", ")})`;
      return { open: false, preview: false, reason, provenance: { pass: false, applied: true, reason }, inp: inpNotApplied };
    }
    return {
      open: true,
      preview: true,
      reason: "local review build (ESTATE_3D_PREVIEW=1): unverified geometry, never public; provenance and INP not applied",
      provenance: { ...provenance, applied: false },
      inp: inpNotApplied,
    };
  }

  return {
    open: provenance.pass && inpVerdict.pass,
    preview: false,
    reason: `provenance: ${provenance.reason}; ${inpVerdict.reason}`,
    provenance,
    inp: { ...inpVerdict, applied: true, fingerprint },
  };
}

/** The build log's and check-estate-gate's account of a decision: each condition on its own lines. */
export function describeGateDecision(d: GateDecision, maxReasons = 30): string[] {
  const state = (v: { pass: boolean; applied: boolean }) =>
    v.applied ? (v.pass ? "PASS" : "FAIL") : `not applied on this build (would ${v.pass ? "pass" : "fail"})`;
  const lines = [`gate ${d.open ? "OPEN" : "CLOSED"}${d.preview ? " — local review build (ESTATE_3D_PREVIEW=1), never public" : ""}`];
  lines.push(`  provenance: ${state(d.provenance)} — ${d.provenance.reason}`);
  lines.push(`  INP: ${state(d.inp)} — fingerprint of this tree ${d.inp.fingerprint || "(none)"}`);
  const shown = d.inp.pass ? [d.inp.reason] : d.inp.reasons;
  for (const r of shown.slice(0, maxReasons)) lines.push(`    ${r}`);
  if (shown.length > maxReasons) lines.push(`    … and ${shown.length - maxReasons} more`);
  return lines;
}

/* ------------------------------------------------------------------------- *
 * THE INP CONDITION (D-028: "the gate stays closed until the tap stays under
 * 200 ms", even once the plan is owner-verified)
 *
 * Read from the committed harness record, row by row. Only the review build's
 * trials (arm "B") count: arm "A" is the 2D public build it is compared with.
 * Build defaults, not rulings (the tranche-fourteen notes carry them):
 *  - "under 200 ms" is strict: Event Timing rounds durations to 8 ms, so 200 is
 *    a value a trial can report, and it fails;
 *  - it is the WORST trial that must be under, not a median or a percentile;
 *  - both profiles are required: D-028 names the phone, and the desktop load
 *    window failed too in tranche thirteen;
 *  - a trial whose inpMs is a number must be under 200 whatever its under16
 *    flag says; under16 rescues only a trial with no Event Timing entry;
 *  - the record format's rule is applied as written to control trials too:
 *    a control dispatches no interaction, so the harness records it as
 *    under16: true with a null inpMs, and a control with a null inpMs and
 *    under16: false fails like any other unconfirmed trial;
 *  - the record may carry only the profiles "phone" and "desktop": a row in
 *    any other profile is a row the gate would not read, so it closes;
 *  - no duration or offset is negative: a negative value can only be a
 *    harness bug (end - start the wrong way round), never a measurement.
 * ------------------------------------------------------------------------- */

export const INP_GATE_SCHEMA = "estate3d-inp-gate/1";
/** The committed record's path, relative to the repository root. */
export const INP_GATE_RECORD_PATH = "qa/perf/INP-estate3d-gate.json";
export const INP_BUDGET_MS = 200;
export const INP_PROFILES = ["phone", "desktop"] as const;
export type InpProfileName = (typeof INP_PROFILES)[number];

export const INP_CELL_KINDS = ["control", "trigger", "fixed", "window"] as const;
export type InpCellKind = (typeof INP_CELL_KINDS)[number];
export const INP_ARMS = ["A", "B"] as const;
export type InpArm = (typeof INP_ARMS)[number];
export const INP_STATUSES = ["ok", "na", "invalid", "lost", "error"] as const;
export type InpStatus = (typeof INP_STATUSES)[number];

/** Scroll into range, no tap, click or key, wait at least 10 s: three.js must not be requested. */
export const INP_CONTROL_CELL = "control:no-interaction";
/** The first interaction itself: a tap or click on the 2D frame. */
export const INP_TRIGGER_CELL = "trigger";
/** Measured on a page whose 3D map is ready, after the trigger. */
export const INP_FIXED_CELLS = ["fixed:place-open", "fixed:keyboard", "fixed:visit", "fixed:list-link", "fixed:canvas-tap"] as const;
/**
 * Where a window cell's offset is measured from: the trigger; the chunk's
 * Network.requestWillBeSent; its Network.loadingFinished; and the page's
 * performance marks estate3d:renderer, :scene, :compile, :layout and :swap.
 */
export const INP_WINDOW_FAMILIES = ["trigger", "request", "arrival", "renderer", "scene", "compile", "layout", "swap"] as const;
export type InpWindowFamily = (typeof INP_WINDOW_FAMILIES)[number];
/** Each window family must be probed at no fewer distinct offsets than this. */
export const INP_MIN_WINDOW_OFFSETS = 2;
/** The fewest "ok" B trials a declared cell may carry, by kind. */
export const INP_MIN_OK_TRIALS: Readonly<Record<InpCellKind, number>> = { control: 10, trigger: 10, fixed: 10, window: 20 };

export interface InpCell {
  /** "control:no-interaction", "trigger", "fixed:<name>" or "window:<family>:<offsetMs>". */
  id: string;
  kind: InpCellKind;
  family: string | null;
  offsetMs: number | null;
  arms: InpArm[];
}

export interface InpTrial {
  cell: string;
  arm: InpArm;
  status: InpStatus;
  /** The WORST interaction in that page view, so a measured tap that collided with the trigger counts. */
  inpMs: number | null;
  /**
   * Event Timing reported no entry because the interaction was under its 16 ms
   * floor, as the harness confirmed. A control trial, which dispatches no
   * interaction and so has no entry, is recorded as true.
   */
  under16: boolean;
  /** Whether the three.js chunk was requested: required on control trials, null where not recorded. Always present. */
  fetched: boolean | null;
}

export interface InpProfileRecord {
  calibration: { pass: boolean; measuredMs: number; expectedMs: number };
  features: { gpu: string; software: boolean; khrParallelShaderCompile: boolean; requestIdleCallback: boolean; schedulerYield: boolean };
  cells: InpCell[];
  trials: InpTrial[];
}

/** The committed record as `scripts/estate-inp.mjs` writes it. The gate never trusts this shape: it checks every field it reads. */
export interface InpGateRecord {
  schema: typeof INP_GATE_SCHEMA;
  generatedAt: string;
  commit: string;
  smoke: boolean;
  /** `estate3dFingerprint()` of the tree the review build was built from. */
  fingerprint: string;
  builds: { A: { origin: string; buildId: string }; B: { origin: string; buildId: string } };
  profiles: Partial<Record<InpProfileName, InpProfileRecord>>;
}

/** What a build hands the gate: the parsed record (null when there is none) and the fingerprint of the tree being built. */
export interface InpInput {
  record: unknown;
  fingerprint: string;
  /** Set when the record file exists but could not be read or parsed. */
  readError?: string;
  /** Set when this tree's fingerprint could not be computed (`fingerprint` is then empty). */
  fingerprintError?: string;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const includes = <T extends string>(values: readonly T[], v: unknown): v is T => (values as readonly unknown[]).includes(v);
const SHA256_HEX = /^[0-9a-f]{64}$/;
/** "fixed:" and a name of lowercase letters and digits, hyphen-separated: "fixed:place-open". */
const FIXED_CELL_ID = /^fixed:[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isNonNegative = (n: unknown): n is number => isFiniteNumber(n) && n >= 0;
const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;
const firstFew = (items: string[], max = 6) => (items.length > max ? `${items.slice(0, max).join(", ")}, …` : items.join(", "));
const distinct = (items: string[]) => firstFew([...new Set(items)]);
const ms = (v: unknown) => (isFiniteNumber(v) ? `${Math.round(v * 10) / 10}` : JSON.stringify(v ?? null));

function cellProblem(c: Record<string, unknown>): string | null {
  const { id, kind, family, offsetMs, arms } = c;
  if (typeof id !== "string" || !id) return "no id";
  if (!includes(INP_CELL_KINDS, kind)) return `unknown kind ${JSON.stringify(kind ?? null)}`;
  if (!Array.isArray(arms) || !arms.includes("B")) return 'arms must be ["A","B"] or ["B"]';
  if (!arms.every((a) => includes(INP_ARMS, a))) return 'arms must be ["A","B"] or ["B"]: only "A" and "B"';
  if (new Set(arms).size !== arms.length) return 'arms must be ["A","B"] or ["B"]: each once';
  if (kind === "control" && id !== INP_CONTROL_CELL) return `the control cell is "${INP_CONTROL_CELL}"`;
  if (kind === "trigger" && id !== INP_TRIGGER_CELL) return `the trigger cell is "${INP_TRIGGER_CELL}"`;
  if (kind === "fixed" && !FIXED_CELL_ID.test(id)) return 'a fixed cell is "fixed:<name>", the name in lowercase letters, digits and hyphens';
  if (kind === "window") {
    if (!includes(INP_WINDOW_FAMILIES, family)) return `unknown window family ${JSON.stringify(family ?? null)}`;
    if (!isNonNegative(offsetMs)) return "a window cell's offsetMs must be a number, 0 or more";
    if (id !== `window:${family}:${offsetMs}`) return `a window cell's id is "window:${family}:${offsetMs}"`;
  }
  return null;
}

function trialProblem(t: Record<string, unknown>): string | null {
  if (typeof t.cell !== "string" || !t.cell) return "no cell";
  if (!includes(INP_STATUSES, t.status)) return `unknown status ${JSON.stringify(t.status ?? null)}`;
  if (!(t.inpMs === null || isNonNegative(t.inpMs))) return "inpMs must be null or a number, 0 or more";
  if (typeof t.under16 !== "boolean") return "under16 is not a boolean";
  if (!(t.fetched === null || typeof t.fetched === "boolean")) return "fetched must be a boolean or null";
  return null;
}

/** Checks one profile; returns its count of "ok" B trials. */
function checkProfile(name: InpProfileName, p: Record<string, unknown>, fail: (reason: string) => void): number {
  const cal = p.calibration;
  if (!isObject(cal)) fail(`${name} has no calibration`);
  else if (cal.pass !== true) fail(`${name} calibration failed (measured ${ms(cal.measuredMs)} ms, expected ${ms(cal.expectedMs)} ms)`);

  if (!Array.isArray(p.cells)) {
    fail(`${name} declares no cells`);
    return 0;
  }
  const cells = new Map<string, InpCell>();
  const malformedCells: string[] = [];
  for (const c of p.cells as unknown[]) {
    const id = isObject(c) && typeof c.id === "string" && c.id ? c.id : "?";
    let problem = isObject(c) ? cellProblem(c) : "not an object";
    if (!problem && cells.has(id)) problem = "declared twice";
    if (problem) malformedCells.push(`${id} (${problem})`);
    else cells.set(id, c as unknown as InpCell);
  }
  if (malformedCells.length) fail(`${name} has ${count(malformedCells.length, "malformed cell")}: ${firstFew(malformedCells)}`);

  for (const id of [INP_CONTROL_CELL, INP_TRIGGER_CELL, ...INP_FIXED_CELLS]) {
    if (!cells.has(id)) fail(`${name} is missing cell ${id}`);
  }
  const declared = [...cells.values()];
  for (const family of INP_WINDOW_FAMILIES) {
    const offsets = new Set(declared.filter((c) => c.kind === "window" && c.family === family).map((c) => c.offsetMs));
    if (offsets.size < INP_MIN_WINDOW_OFFSETS) {
      fail(`${name} window family ${family} has ${count(offsets.size, "offset")} (needs ${INP_MIN_WINDOW_OFFSETS})`);
    }
  }

  if (!Array.isArray(p.trials)) {
    fail(`${name} has no trials`);
    return 0;
  }
  let noArm = 0;
  const malformedTrials: string[] = [];
  const undeclared: string[] = [];
  const errors: string[] = [];
  const lost: string[] = [];
  const controlNotOk: string[] = [];
  let controlFetched = 0;
  let controlUnrecorded = 0;
  const ok = new Map<string, number>();
  const over = new Map<string, number[]>();
  const noValue = new Map<string, number>();

  for (const t of p.trials as unknown[]) {
    if (!isObject(t) || !includes(INP_ARMS, t.arm)) {
      noArm++;
      continue;
    }
    if (t.arm !== "B") continue;
    const problem = trialProblem(t);
    if (problem) {
      malformedTrials.push(`${typeof t.cell === "string" && t.cell ? t.cell : "?"} (${problem})`);
      continue;
    }
    const trial = t as unknown as InpTrial;
    const cell = cells.get(trial.cell);
    if (!cell) {
      undeclared.push(trial.cell);
      continue;
    }
    if (trial.status === "error") errors.push(cell.id);
    if (trial.status === "lost") lost.push(cell.id);
    if (cell.kind === "control") {
      if (trial.status !== "ok") controlNotOk.push(trial.status);
      else if (trial.fetched === true) controlFetched++;
      else if (trial.fetched !== false) controlUnrecorded++;
    }
    if (trial.status !== "ok") continue;

    ok.set(cell.id, (ok.get(cell.id) ?? 0) + 1);
    /* The format's rule, "under16 === true, or inpMs a finite number below 200", with one stricter reading: a recorded inpMs is never excused. */
    if (trial.inpMs !== null) {
      if (!(trial.inpMs < INP_BUDGET_MS)) over.set(cell.id, [...(over.get(cell.id) ?? []), trial.inpMs]);
    } else if (trial.under16 !== true) {
      noValue.set(cell.id, (noValue.get(cell.id) ?? 0) + 1);
    }
  }

  if (noArm) fail(`${name} has ${count(noArm, "trial")} with no arm "A" or "B"`);
  if (malformedTrials.length) fail(`${name} has ${count(malformedTrials.length, "malformed B trial")}: ${firstFew(malformedTrials)}`);
  if (undeclared.length) fail(`${name} has ${count(undeclared.length, "B trial")} for undeclared cells (${distinct(undeclared)})`);
  if (controlNotOk.length) fail(`${name} ${INP_CONTROL_CELL} has ${count(controlNotOk.length, "B trial")} not ok (${distinct(controlNotOk)})`);
  if (controlFetched) fail(`${name} ${INP_CONTROL_CELL} has ${count(controlFetched, "B trial")} that fetched three.js`);
  if (controlUnrecorded) fail(`${name} ${INP_CONTROL_CELL} has ${count(controlUnrecorded, "B trial")} that did not record whether three.js was fetched`);
  if (errors.length) fail(`${name} has ${count(errors.length, "error B trial")} (${distinct(errors)})`);
  if (lost.length) fail(`${name} has ${count(lost.length, "lost B trial")} (${distinct(lost)})`);
  for (const cell of declared) {
    const n = ok.get(cell.id) ?? 0;
    const need = INP_MIN_OK_TRIALS[cell.kind];
    /* Written so that a kind with no minimum fails rather than passing. */
    if (!(n >= need)) fail(`${name} ${cell.id} has ${count(n, "ok B trial")} (needs ${need})`);
  }
  for (const [id, values] of over) {
    const worstFirst = [...values].sort((a, b) => b - a).map((v) => ms(v));
    fail(`${name} ${id} has ${count(values.length, "trial")} at ${firstFew(worstFirst)} ms`);
  }
  for (const [id, n] of noValue) fail(`${name} ${id} has ${count(n, "ok trial")} with no INP value and no under-16 confirmation`);

  return [...ok.values()].reduce((a, b) => a + b, 0);
}

/**
 * THE INP CONDITION, recomputed from the record. Pure: no file access, and it
 * never throws (a record that cannot be read as the schema says closes the
 * gate and says why; anything unforeseen that throws while reading it closes
 * the gate too, with the error as the reason).
 */
export function decideInpCondition(input: InpInput | null | undefined): InpVerdict {
  const reasons: string[] = [];
  const fail = (reason: string) => {
    reasons.push(`INP: ${reason}`);
  };
  let passSummary = "";
  try {
    passSummary = checkInpInput(input, fail);
  } catch (e) {
    fail(`the record could not be checked (${(e instanceof Error ? e.message : String(e)).split("\n")[0]})`);
  }
  return reasons.length ? { pass: false, reasons, reason: reasons.join("; ") } : { pass: true, reasons, reason: `INP: ${passSummary}` };
}

/** Reports every failed rule through `fail`; returns what a passing record showed. */
function checkInpInput(input: InpInput | null | undefined, fail: (reason: string) => void): string {
  if (input?.readError !== undefined) {
    fail(`record unreadable (${input.readError})`);
    return "";
  }
  const rec = input?.record;
  if (rec === null || rec === undefined) {
    fail("no record");
    return "";
  }
  if (!isObject(rec)) {
    fail("the record is not a JSON object");
    return "";
  }
  if (rec.schema !== INP_GATE_SCHEMA) {
    fail(`schema is ${JSON.stringify(rec.schema ?? null)}, not "${INP_GATE_SCHEMA}"`);
    return "";
  }

  if (rec.smoke === true) fail("smoke run");
  else if (rec.smoke !== false) fail(`smoke is ${JSON.stringify(rec.smoke ?? null)}, not false`);

  const current = typeof input?.fingerprint === "string" ? input.fingerprint : "";
  if (input?.fingerprintError !== undefined) fail(`no fingerprint for this tree (${input.fingerprintError})`);
  else if (!SHA256_HEX.test(current)) fail("no fingerprint for this tree");
  else if (typeof rec.fingerprint !== "string" || !rec.fingerprint) fail("the record carries no fingerprint");
  else if (!SHA256_HEX.test(rec.fingerprint)) fail("the record's fingerprint is not 64 lowercase hex characters");
  else if (rec.fingerprint !== current) fail(`fingerprint mismatch (record ${rec.fingerprint.slice(0, 12)}…, this tree ${current.slice(0, 12)}…)`);

  const okByProfile: string[] = [];
  if (!isObject(rec.profiles)) {
    fail("the record has no profiles");
  } else {
    /* Rows in a profile the gate does not read would be rows nobody checked. */
    const unexpected = Object.keys(rec.profiles).filter((key) => !includes(INP_PROFILES, key));
    if (unexpected.length) {
      fail(`unexpected ${unexpected.length === 1 ? "profile" : "profiles"} ${firstFew(unexpected.map((k) => JSON.stringify(k)))} (a record has only ${INP_PROFILES.join(" and ")})`);
    }
    for (const name of INP_PROFILES) {
      const p = rec.profiles[name];
      if (p === undefined || p === null) fail(`no ${name} profile`);
      else if (!isObject(p)) fail(`${name} profile is not an object`);
      else okByProfile.push(`${name} ${checkProfile(name, p, fail)}`);
    }
  }

  const commit = typeof rec.commit === "string" ? rec.commit.slice(0, 7) : "?";
  const when = typeof rec.generatedAt === "string" ? rec.generatedAt : "?";
  return `every review-build trial under ${INP_BUDGET_MS} ms (ok B trials: ${okByProfile.join(", ")}; record of ${commit}, ${when})`;
}

/** The drawn elements, stripped to what the renderer needs. Call only when the gate is open. */
export function toRenderPlan(plan: EstatePlan, preview: boolean): RenderPlan {
  return {
    schema: "estate-render-plan/1",
    preview,
    elements: plan.elements
      .filter((e): e is EstateElement & { position: PlanPoint } => e.position !== null)
      .map((e) => ({
        id: e.id,
        kind: e.kind,
        name: e.name,
        href: e.href,
        position: e.position,
        orientationDeg: e.orientation?.deg ?? 0,
        footprint: e.footprint,
        storeys: e.storeys,
      })),
    notDrawn: plan.elements
      .filter((e) => e.position === null && (REQUIRED_ELEMENT_IDS as readonly string[]).includes(e.id))
      .map((e) => e.name),
  };
}
