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
 * WHY THE DECISION IS MADE ON THE SERVER. `/en/the-estate` is prerendered. When
 * the gate is closed the page passes `null` to the client: no geometry in the
 * HTML or the flight data, the client hook returns before its WebGL probe, and
 * three.js is never requested. A check made in the browser could still ship
 * the plan and the chunk.
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

export interface GateDecision {
  open: boolean;
  preview: boolean;
  reason: string;
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

/** The server's decision for one build. Throws on a malformed plan or a preview flag on Vercel. */
export function decideEstate3D(plan: EstatePlan, env: GateEnv): GateDecision {
  const errors = validatePlan(plan);
  if (errors.length) {
    throw new Error(`content/estate-plan.json is invalid:\n  - ${errors.join("\n  - ")}`);
  }

  const drawn = plan.elements.filter((e) => e.position !== null);
  const drawnIds = new Set(drawn.map((e) => e.id));
  const missingVillas = VILLA_IDS.filter((id) => !drawnIds.has(id));

  if (env.ESTATE_3D_PREVIEW === "1") {
    if (env.VERCEL) {
      throw new Error(
        "ESTATE_3D_PREVIEW is set on a Vercel build. It is for local review builds only " +
          "(scripts/estate3d-preview.mjs): Vercel preview deployments here are public by link, " +
          "and the 3D map is public only when the plan is owner-verified (DECISIONS.md D-021). Unset it."
      );
    }
    if (missingVillas.length) {
      return { open: false, preview: false, reason: `preview requested, but the four villas are not all placed (${missingVillas.join(", ")})` };
    }
    return { open: true, preview: true, reason: "local review build (ESTATE_3D_PREVIEW=1): unverified geometry, never public" };
  }

  if (missingVillas.length) {
    return { open: false, preview: false, reason: `the four villas are not all placed (${missingVillas.join(", ")})` };
  }
  const unverified = drawn.filter((e) => e.provenance !== PROVENANCE_VERIFIED).map((e) => e.id);
  if (unverified.length) {
    return { open: false, preview: false, reason: `not owner-verified: ${unverified.join(", ")}` };
  }
  return { open: true, preview: false, reason: "every drawn element is owner-verified" };
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
