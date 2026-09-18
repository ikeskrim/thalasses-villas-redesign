import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { test, expect } from "@playwright/test";

import { HOTSPOTS } from "../src/app/home-data";
import {
  INP_CONTROL_CELL,
  INP_FIXED_CELLS,
  INP_GATE_RECORD_PATH,
  INP_GATE_SCHEMA,
  INP_PROFILES,
  INP_TRIGGER_CELL,
  INP_WINDOW_FAMILIES,
  PROVENANCE_INFERRED,
  PROVENANCE_NONE,
  PROVENANCE_VERIFIED,
  REQUIRED_ELEMENT_IDS,
  decideEstate3D,
  describeGateDecision,
  toRenderPlan,
  validatePlan,
  type EstatePlan,
  type InpCell,
  type InpGateRecord,
  type InpInput,
  type InpProfileName,
  type InpProfileRecord,
  type InpTrial,
} from "../src/lib/estate-plan-gate";
import {
  FINGERPRINTED_PACKAGES,
  INP_RECORD_FILE,
  estate3dFingerprint,
  estate3dInpInput,
  mountPathFiles,
} from "../src/lib/estate-3d-fingerprint";

/**
 * content/estate-plan.json — THE DATA, AND THE GATE THAT READS IT.
 *
 * D-021: the plan is populated from the aerial and drone frames, "label nothing
 * as fact", and the 3D map is public only when provenance is owner-verified.
 * D-028: and only once "the tap stays under 200 ms", read from the committed
 * INP harness record for this tree's fingerprint. These tests hold the file to
 * that, and run every branch of the gate against fixtures derived from the real
 * file and from records built here — no build needed for the logic.
 */

const ROOT = process.cwd();
const read = (...p: string[]) => fs.readFileSync(path.join(ROOT, ...p), "utf-8");
const plan = JSON.parse(read("content", "estate-plan.json")) as EstatePlan;
const clone = (): EstatePlan => structuredClone(plan);

/** The plan as it would be on the day the owner verifies every placed element. */
function verifiedFixture(): EstatePlan {
  const p = clone();
  for (const e of p.elements) {
    if (e.position !== null) {
      e.provenance = PROVENANCE_VERIFIED;
      e.decision = "D-999";
    }
  }
  return p;
}

/* ------------------------------------------------------------------------- *
 * INP RECORD FIXTURES, built here rather than committed.
 * ------------------------------------------------------------------------- */

/** The fingerprint of this tree, as production computes it. Verification does not change it (asserted below). */
const FINGERPRINT = estate3dFingerprint(ROOT, plan).fingerprint;
const OTHER_FINGERPRINT = FINGERPRINT.replace(/^./, (c) => (c === "0" ? "1" : "0"));
/** Two offsets per window family: the minimum the gate accepts. */
const WINDOW_OFFSETS = [0, 150];

/**
 * A profile that meets every rule with nothing to spare: minimum counts, the
 * slowest trial at 191 ms, and every fifth window trial below Event Timing's
 * 16 ms floor (no entry, confirmed). Control trials dispatch no interaction, so
 * they carry no entry either: inpMs null, under16 true, as the record format's
 * rule requires of every ok trial. Its arm-A rows are ones that would fail the
 * gate if it read them: an error, 900 ms, a fetched control.
 */
function passingProfile(): InpProfileRecord {
  const cells: InpCell[] = [];
  const trials: InpTrial[] = [];
  const declare = (c: InpCell, okTrials: number, inpMs: (i: number) => number | null, extra: Partial<InpTrial> = {}) => {
    cells.push(c);
    for (let i = 0; i < okTrials; i++) {
      const v = inpMs(i);
      trials.push({ cell: c.id, arm: "B", status: "ok", inpMs: v, under16: v === null, fetched: null, ...extra });
      trials.push({ cell: c.id, arm: "A", status: i === 0 ? "error" : "ok", inpMs: 900, under16: false, fetched: true });
    }
  };
  const arms: InpCell["arms"] = ["A", "B"];
  declare({ id: INP_CONTROL_CELL, kind: "control", family: null, offsetMs: null, arms }, 10, () => null, { fetched: false });
  declare({ id: INP_TRIGGER_CELL, kind: "trigger", family: null, offsetMs: null, arms }, 10, (i) => 40 + i * 8);
  for (const id of INP_FIXED_CELLS) declare({ id, kind: "fixed", family: null, offsetMs: null, arms }, 10, (i) => 24 + i * 4);
  for (const family of INP_WINDOW_FAMILIES) {
    for (const offsetMs of WINDOW_OFFSETS) {
      declare({ id: `window:${family}:${offsetMs}`, kind: "window", family, offsetMs, arms }, 20, (i) => (i % 5 === 0 ? null : 192 - i));
    }
  }
  return {
    calibration: { pass: true, measuredMs: 104, expectedMs: 100 },
    features: { gpu: "SwiftShader", software: true, khrParallelShaderCompile: false, requestIdleCallback: true, schedulerYield: true },
    cells,
    trials,
  };
}

function passingRecord(fingerprint = FINGERPRINT): InpGateRecord {
  return {
    schema: INP_GATE_SCHEMA,
    generatedAt: "2026-09-17T12:00:00.000Z",
    commit: "0344ad3000000000000000000000000000000000",
    smoke: false,
    fingerprint,
    builds: {
      A: { origin: "http://localhost:3005", buildId: "fixture-a" },
      B: { origin: "http://localhost:3035", buildId: "fixture-b" },
    },
    profiles: { phone: passingProfile(), desktop: passingProfile() },
  };
}

const inp = (record: unknown, fingerprint = FINGERPRINT): InpInput => ({ record, fingerprint });
const NO_RECORD = inp(null);
/** A record with one top-level field removed. */
function omit(r: InpGateRecord, key: keyof InpGateRecord): Record<string, unknown> {
  const copy: Record<string, unknown> = { ...r };
  delete copy[key];
  return copy;
}
const profileOf = (r: InpGateRecord, name: InpProfileName) => r.profiles[name]!;
const bTrials = (r: InpGateRecord, name: InpProfileName, cell: string) => profileOf(r, name).trials.filter((t) => t.arm === "B" && t.cell === cell);
function removeCell(r: InpGateRecord, name: InpProfileName, cell: string) {
  const p = profileOf(r, name);
  p.cells = p.cells.filter((c) => c.id !== cell);
  p.trials = p.trials.filter((t) => t.cell !== cell);
}
/** Rewrites one declared cell's fields (any value, typed or not), moving its trials to its new id. */
function recell(r: InpGateRecord, name: InpProfileName, from: string, fields: Record<string, unknown>) {
  const p = profileOf(r, name);
  const cell = p.cells.find((c) => c.id === from)!;
  Object.assign(cell, fields);
  for (const t of p.trials) if (t.cell === from) t.cell = cell.id;
}
/** Adds a cell with `n` ok B trials at 30 ms. */
function addCell(r: InpGateRecord, name: InpProfileName, cell: Record<string, unknown>, n: number) {
  const p = profileOf(r, name);
  p.cells.push(cell as unknown as InpCell);
  for (let i = 0; i < n; i++) p.trials.push({ cell: cell.id as string, arm: "B", status: "ok", inpMs: 30, under16: false, fetched: null });
}
/** Adds one B trial: ok at 30 ms unless `fields` says otherwise (any value, typed or not). */
function addTrial(r: InpGateRecord, name: InpProfileName, fields: Record<string, unknown>) {
  const t: Record<string, unknown> = { cell: "fixed:visit", arm: "B", status: "ok", inpMs: 30, under16: false, fetched: null, ...fields };
  for (const key of Object.keys(t)) if (t[key] === undefined) delete t[key];
  profileOf(r, name).trials.push(t as unknown as InpTrial);
}
const loose = (v: object) => v as unknown as Record<string, unknown>;

/** Decides with a verified plan, so only the INP condition can close the gate. */
function decideVerified(input: InpInput) {
  const d = decideEstate3D(verifiedFixture(), {}, input);
  expect(d.provenance.pass, "the fixture plan is verified: provenance must not be what decides").toBe(true);
  return d;
}

/** Asserts the gate is closed by the INP condition, with exactly these reasons among its own. */
function expectClosedBy(input: InpInput, ...reasons: string[]) {
  const d = decideVerified(input);
  expect(d.open, `the gate must stay closed (${d.reason})`).toBe(false);
  expect(d.inp.pass).toBe(false);
  expect(d.inp.applied).toBe(true);
  for (const r of reasons) expect(d.inp.reasons, `the reasons must include "${r}"`).toContain(r);
  for (const r of d.inp.reasons) expect(d.reason).toContain(r);
  return d;
}

function expectOpen(input: InpInput) {
  const d = decideVerified(input);
  expect(d.inp.reasons, "no INP reason may be reported").toEqual([]);
  expect(d.open).toBe(true);
  return d;
}

test.describe("content/estate-plan.json", () => {
  test("is valid and names every element D-021 lists", () => {
    expect(validatePlan(plan)).toEqual([]);
    const ids = plan.elements.map((e) => e.id);
    for (const id of REQUIRED_ELEMENT_IDS) expect(ids).toContain(id);
  });

  test("labels nothing as fact: every owner-verified element names a DECISIONS.md entry that exists", () => {
    const decisions = read("DECISIONS.md");
    for (const e of plan.elements) {
      expect([PROVENANCE_VERIFIED, PROVENANCE_INFERRED, PROVENANCE_NONE]).toContain(e.provenance);
      if (e.provenance === PROVENANCE_VERIFIED) {
        expect(decisions, `${e.id} cites ${e.decision}, which DECISIONS.md does not contain`).toMatch(
          new RegExp(`#{2,3} ${e.decision} `)
        );
      }
    }
  });

  test("no compass words: no aerial on record carries a bearing", () => {
    const text = JSON.stringify({ frame: plan.frame, elements: plan.elements.map((e) => ({ basis: e.basis, notes: e.notes })) });
    expect(text).not.toMatch(/\b(north|south|east|west)(ern|ward|wards)?\b/i);
  });

  test("an element with no established position is drawn nowhere and carries no geometry", () => {
    for (const e of plan.elements) {
      if (e.provenance === PROVENANCE_NONE) {
        expect(e.position, e.id).toBeNull();
        expect(e.orientation, e.id).toBeNull();
        expect(e.footprint, e.id).toBeNull();
      }
    }
  });

  test("every link goes to a page this site serves", async ({ request }) => {
    for (const e of plan.elements.filter((x) => x.href)) {
      const r = await request.get(e.href!, { maxRedirects: 0 });
      expect(r.status(), `${e.id} → ${e.href}`).toBe(200);
    }
    /* The villas link where the 2D map already links them. */
    for (const h of HOTSPOTS.filter((x) => x.href && ["thoi", "persi", "melia", "eeanthe"].includes(x.id))) {
      expect(plan.elements.find((e) => e.id === h.id)?.href).toBe(h.href);
    }
  });
});

test.describe("the provenance gate", () => {
  test("the committed plan and the committed INP record (or none), decided as a production build decides them", () => {
    /* The same inputs estate3dPlanForPage() passes, read the same way. */
    const d = decideEstate3D(plan, {}, estate3dInpInput(ROOT, plan));
    const unverifiedDrawn = plan.elements.filter((e) => e.position !== null && e.provenance !== PROVENANCE_VERIFIED);
    expect(d.preview).toBe(false);
    expect(d.provenance.pass).toBe(unverifiedDrawn.length === 0);
    expect(d.open).toBe(d.provenance.pass && d.inp.pass);
    expect(d.inp.fingerprint).toBe(FINGERPRINT);
    if (!fs.existsSync(path.join(ROOT, INP_RECORD_FILE))) {
      /* No record is committed: production must decide closed, and say so, whatever the plan says. */
      expect(d.open).toBe(false);
      expect(d.inp.reasons).toEqual(["INP: no record"]);
      expect(d.reason).toContain("INP: no record");
    }
  });

  test("opens only when every drawn element is owner-verified", () => {
    expect(decideEstate3D(verifiedFixture(), {}, inp(passingRecord())).open).toBe(true);

    for (const kind of ["villa", "lane", "compound", "apron", "shore"] as const) {
      const p = verifiedFixture();
      const target = p.elements.find((e) => e.kind === kind && e.position !== null);
      if (!target) continue;
      target.provenance = PROVENANCE_INFERRED;
      delete target.decision;
      const d = decideEstate3D(p, {}, inp(passingRecord()));
      expect(d.open, `one unverified ${kind} must close the gate`).toBe(false);
      expect(d.reason).toContain(target.id);
      expect(d.inp.pass, "the INP record passes: provenance alone closed it").toBe(true);
    }
  });

  test("an element with no position does not block it, and the note names it", () => {
    const p = verifiedFixture();
    const unplaced = p.elements.filter((e) => e.position === null);
    expect(decideEstate3D(p, {}, inp(passingRecord())).open).toBe(true);
    const render = toRenderPlan(p, false);
    expect(render.schema).toBe("estate-render-plan/1");
    for (const e of unplaced) {
      expect(render.elements.map((r) => r.id)).not.toContain(e.id);
      if ((REQUIRED_ELEMENT_IDS as readonly string[]).includes(e.id)) expect(render.notDrawn).toContain(e.name);
    }
  });

  test("stays closed without the four villas", () => {
    const p = verifiedFixture();
    const villa = p.elements.find((e) => e.id === "thoi")!;
    villa.position = null;
    villa.orientation = null;
    villa.footprint = null;
    villa.provenance = PROVENANCE_NONE;
    villa.basis.position = PROVENANCE_NONE;
    delete villa.decision;
    /* The record's fingerprint follows the edited geometry, so only the missing villa can close it. */
    const edited = estate3dFingerprint(ROOT, p).fingerprint;
    const d = decideEstate3D(p, {}, inp(passingRecord(edited), edited));
    expect(d.inp.pass).toBe(true);
    expect(d.open).toBe(false);
    expect(d.reason).toContain("the four villas are not all placed (thoi)");
  });

  test("refuses owner-verified without the entry that relayed it", () => {
    const p = verifiedFixture();
    delete p.elements.find((e) => e.position !== null)!.decision;
    expect(() => decideEstate3D(p, {}, inp(passingRecord()))).toThrow(/needs the DECISIONS\.md entry/);
  });

  test("the review preview opens it locally, and throws on any Vercel build", () => {
    const local = decideEstate3D(plan, { ESTATE_3D_PREVIEW: "1" }, NO_RECORD);
    expect(local.open).toBe(true);
    expect(local.preview).toBe(true);
    expect(toRenderPlan(plan, local.preview).preview).toBe(true);

    expect(() => decideEstate3D(plan, { ESTATE_3D_PREVIEW: "1", VERCEL: "1" }, NO_RECORD)).toThrow(/local review builds only/);
    /* Anything but exactly "1" is not the flag. */
    expect(decideEstate3D(plan, { ESTATE_3D_PREVIEW: "true" }, NO_RECORD).preview).toBe(false);
  });
});

test.describe("the INP condition (D-028)", () => {
  test("all conditions met: a verified plan and a passing record open the gate", () => {
    const record = passingRecord();
    /* Not vacuous: the fixture carries what the rules look at. */
    expect(profileOf(record, "phone").trials.filter((t) => t.arm === "B")).toHaveLength(10 + 10 + 5 * 10 + 8 * 2 * 20);
    const d = expectOpen(inp(record));
    expect(d.preview).toBe(false);
    expect(d.inp.applied).toBe(true);
    expect(d.reason).toContain("provenance: every drawn element is owner-verified");
    expect(d.reason).toContain("INP: every review-build trial under 200 ms (ok B trials: phone 390, desktop 390; record of 0344ad3");
  });

  test("no record closes it", () => {
    const d = expectClosedBy(NO_RECORD, "INP: no record");
    expect(d.inp.reasons).toEqual(["INP: no record"]);
    /* A caller that passes nothing (an untyped script) decides the same way. */
    const bare = decideEstate3D(verifiedFixture(), {}, undefined as unknown as InpInput);
    expect(bare.open).toBe(false);
    expect(bare.inp.reasons).toEqual(["INP: no record"]);
  });

  test("an unreadable record closes it", () => {
    expectClosedBy({ record: null, fingerprint: FINGERPRINT, readError: "qa/perf/INP-estate3d-gate.json is not valid JSON: x" }, "INP: record unreadable (qa/perf/INP-estate3d-gate.json is not valid JSON: x)");
  });

  test("a record of another schema closes it", () => {
    const wrong = { ...passingRecord(), schema: "estate3d-inp-gate/2" };
    expect(expectClosedBy(inp(wrong)).inp.reasons).toEqual(['INP: schema is "estate3d-inp-gate/2", not "estate3d-inp-gate/1"']);
    expectClosedBy(inp(omit(passingRecord(), "schema")), 'INP: schema is null, not "estate3d-inp-gate/1"');
    expectClosedBy(inp([passingRecord()]), "INP: the record is not a JSON object");
    expectClosedBy(inp("PASS"), "INP: the record is not a JSON object");
  });

  test("a smoke run closes it", () => {
    expect(expectClosedBy(inp({ ...passingRecord(), smoke: true })).inp.reasons).toEqual(["INP: smoke run"]);
    expectClosedBy(inp(omit(passingRecord(), "smoke")), "INP: smoke is null, not false");
  });

  test("a failed calibration on either profile closes it", () => {
    for (const name of INP_PROFILES) {
      const r = passingRecord();
      profileOf(r, name).calibration = { pass: false, measuredMs: 161.37, expectedMs: 100 };
      expect(expectClosedBy(inp(r)).inp.reasons).toEqual([`INP: ${name} calibration failed (measured 161.4 ms, expected 100 ms)`]);
    }
    const r = passingRecord();
    delete (profileOf(r, "phone") as Partial<InpProfileRecord>).calibration;
    expectClosedBy(inp(r), "INP: phone has no calibration");
  });

  test("a missing profile closes it", () => {
    for (const name of INP_PROFILES) {
      const r = passingRecord();
      delete r.profiles[name];
      expect(expectClosedBy(inp(r)).inp.reasons).toEqual([`INP: no ${name} profile`]);
    }
    expectClosedBy(inp(omit(passingRecord(), "profiles")), "INP: the record has no profiles");
  });

  test("a missing required cell or window family closes it", () => {
    for (const cell of [INP_CONTROL_CELL, INP_TRIGGER_CELL, ...INP_FIXED_CELLS]) {
      const r = passingRecord();
      removeCell(r, "desktop", cell);
      expect(expectClosedBy(inp(r)).inp.reasons).toEqual([`INP: desktop is missing cell ${cell}`]);
    }
    for (const family of INP_WINDOW_FAMILIES) {
      const r = passingRecord();
      removeCell(r, "phone", `window:${family}:150`);
      expect(expectClosedBy(inp(r)).inp.reasons).toEqual([`INP: phone window family ${family} has 1 offset (needs 2)`]);
      removeCell(r, "phone", `window:${family}:0`);
      expectClosedBy(inp(r), `INP: phone window family ${family} has 0 offsets (needs 2)`);
    }
    /* A cell must declare the review-build arm, or it declares nothing the gate reads. */
    const r = passingRecord();
    profileOf(r, "phone").cells.find((c) => c.id === "fixed:visit")!.arms = ["A"];
    expectClosedBy(inp(r), 'INP: phone has 1 malformed cell: fixed:visit (arms must be ["A","B"] or ["B"])', "INP: phone is missing cell fixed:visit");
  });

  test("a cell below its minimum count of ok trials closes it", () => {
    const cases: [InpProfileName, string, number][] = [
      ["phone", INP_CONTROL_CELL, 10],
      ["desktop", INP_TRIGGER_CELL, 10],
      ["desktop", "fixed:keyboard", 10],
      ["phone", "window:compile:150", 20],
    ];
    for (const [name, cell, need] of cases) {
      const r = passingRecord();
      const p = profileOf(r, name);
      const drop = p.trials.findIndex((t) => t.arm === "B" && t.cell === cell);
      p.trials.splice(drop, 1);
      expect(expectClosedBy(inp(r)).inp.reasons).toEqual([`INP: ${name} ${cell} has ${need - 1} ok B trials (needs ${need})`]);
    }
    /* An invalid or n/a trial is allowed, and does not count. */
    const r = passingRecord();
    bTrials(r, "phone", "window:swap:0")[3]!.status = "invalid";
    bTrials(r, "phone", "window:swap:0")[4]!.status = "na";
    expect(expectClosedBy(inp(r)).inp.reasons).toEqual(["INP: phone window:swap:0 has 18 ok B trials (needs 20)"]);
    /* Every declared window cell needs its own twenty, not just two per family. */
    const extra = passingRecord();
    const phone = profileOf(extra, "phone");
    phone.cells.push({ id: "window:swap:500", kind: "window", family: "swap", offsetMs: 500, arms: ["B"] });
    for (let i = 0; i < 5; i++) phone.trials.push({ cell: "window:swap:500", arm: "B", status: "ok", inpMs: 30, under16: false, fetched: null });
    expect(expectClosedBy(inp(extra)).inp.reasons).toEqual(["INP: phone window:swap:500 has 5 ok B trials (needs 20)"]);
  });

  test("a control trial that fetched three.js closes it", () => {
    const fetched = passingRecord();
    bTrials(fetched, "phone", INP_CONTROL_CELL)[0]!.fetched = true;
    expect(expectClosedBy(inp(fetched)).inp.reasons).toEqual([`INP: phone ${INP_CONTROL_CELL} has 1 B trial that fetched three.js`]);

    const unrecorded = passingRecord();
    bTrials(unrecorded, "desktop", INP_CONTROL_CELL)[2]!.fetched = null;
    expectClosedBy(inp(unrecorded), `INP: desktop ${INP_CONTROL_CELL} has 1 B trial that did not record whether three.js was fetched`);

    /* Every control trial must be ok: an invalid control is not a pass. */
    const invalid = passingRecord();
    profileOf(invalid, "phone").trials.push({ cell: INP_CONTROL_CELL, arm: "B", status: "invalid", inpMs: null, under16: false, fetched: true });
    expect(expectClosedBy(inp(invalid)).inp.reasons).toEqual([`INP: phone ${INP_CONTROL_CELL} has 1 B trial not ok (invalid)`]);
  });

  test("an error or a lost trial closes it", () => {
    for (const status of ["error", "lost"] as const) {
      const r = passingRecord();
      profileOf(r, "phone").trials.push({ cell: "window:scene:0", arm: "B", status, inpMs: null, under16: false, fetched: null });
      expect(expectClosedBy(inp(r)).inp.reasons).toEqual([`INP: phone has 1 ${status} B trial (window:scene:0)`]);
    }
  });

  test("one trial at exactly 200 ms closes it", () => {
    const r = passingRecord();
    bTrials(r, "phone", "window:compile:150")[7]!.inpMs = 200;
    expect(expectClosedBy(inp(r)).inp.reasons).toEqual(["INP: phone window:compile:150 has 1 trial at 200 ms"]);

    /* The trigger tap itself, and a trial whose worst interaction was a collision with it, count the same way. */
    const t = passingRecord();
    bTrials(t, "desktop", INP_TRIGGER_CELL)[0]!.inpMs = 232;
    bTrials(t, "desktop", "window:arrival:0")[1]!.inpMs = 456;
    bTrials(t, "desktop", "window:arrival:0")[2]!.inpMs = 208;
    expectClosedBy(inp(t), `INP: desktop ${INP_TRIGGER_CELL} has 1 trial at 232 ms`, "INP: desktop window:arrival:0 has 2 trials at 456, 208 ms");
  });

  test("one trial at 199 ms passes", () => {
    const r = passingRecord();
    bTrials(r, "phone", "window:compile:150")[7]!.inpMs = 199;
    bTrials(r, "desktop", "fixed:canvas-tap")[0]!.inpMs = 199.9;
    expectOpen(inp(r));
  });

  test("under16 with a null inpMs passes; a null inpMs without it closes", () => {
    const r = passingRecord();
    for (const t of bTrials(r, "phone", "fixed:place-open")) Object.assign(t, { inpMs: null, under16: true });
    expectOpen(inp(r));

    const unconfirmed = passingRecord();
    Object.assign(bTrials(unconfirmed, "phone", "fixed:place-open")[0]!, { inpMs: null, under16: false });
    expect(expectClosedBy(inp(unconfirmed)).inp.reasons).toEqual([
      "INP: phone fixed:place-open has 1 ok trial with no INP value and no under-16 confirmation",
    ]);

    /* under16 rescues only a missing entry: a recorded 232 ms is over whatever the flag says. */
    const contradictory = passingRecord();
    Object.assign(bTrials(contradictory, "desktop", "window:layout:0")[1]!, { inpMs: 232, under16: true });
    expectClosedBy(inp(contradictory), "INP: desktop window:layout:0 has 1 trial at 232 ms");

    /* The format's rule holds for control trials too: no entry must be confirmed as under16, not merely absent. */
    const control = passingRecord();
    expect(bTrials(control, "phone", INP_CONTROL_CELL).every((t) => t.inpMs === null && t.under16 === true && t.fetched === false)).toBe(true);
    bTrials(control, "phone", INP_CONTROL_CELL)[4]!.under16 = false;
    expect(expectClosedBy(inp(control)).inp.reasons, "a control trial is held to the same rule as every other ok trial").toEqual([
      `INP: phone ${INP_CONTROL_CELL} has 1 ok trial with no INP value and no under-16 confirmation`,
    ]);
    /* A control that did record a slow interaction is over, like any other. */
    const slowControl = passingRecord();
    Object.assign(bTrials(slowControl, "desktop", INP_CONTROL_CELL)[0]!, { inpMs: 264, under16: false });
    expect(expectClosedBy(inp(slowControl)).inp.reasons).toEqual([`INP: desktop ${INP_CONTROL_CELL} has 1 trial at 264 ms`]);
  });

  test("a fingerprint mismatch closes it", () => {
    expect(OTHER_FINGERPRINT).not.toBe(FINGERPRINT);
    const d = expectClosedBy(inp(passingRecord(OTHER_FINGERPRINT)));
    expect(d.inp.reasons).toEqual([`INP: fingerprint mismatch (record ${OTHER_FINGERPRINT.slice(0, 12)}…, this tree ${FINGERPRINT.slice(0, 12)}…)`]);

    expectClosedBy(inp(omit(passingRecord(), "fingerprint")), "INP: the record carries no fingerprint");
    /* Two empty fingerprints are not a match. */
    expectClosedBy(inp(passingRecord(""), ""), "INP: no fingerprint for this tree");
  });

  test("a stored pass flag is never read: the verdict comes from the rows", () => {
    const r = { ...passingRecord(), pass: true, verdict: "PASS", inpPass: true } as InpGateRecord & Record<string, unknown>;
    bTrials(r, "phone", "fixed:visit")[0]!.inpMs = 312;
    expectClosedBy(inp(r), "INP: phone fixed:visit has 1 trial at 312 ms");
  });

  test("malformed rows close it, and never throw", () => {
    const arm = passingRecord();
    profileOf(arm, "phone").trials.push({ cell: "window:swap:0", arm: "b" as "B", status: "ok", inpMs: 900, under16: false, fetched: null });
    expectClosedBy(inp(arm), 'INP: phone has 1 trial with no arm "A" or "B"');

    const status = passingRecord();
    profileOf(status, "desktop").trials.push({ cell: "window:swap:0", arm: "B", status: "passed" as "ok", inpMs: 12, under16: false, fetched: null });
    expectClosedBy(inp(status), 'INP: desktop has 1 malformed B trial: window:swap:0 (unknown status "passed")');

    const value = passingRecord();
    (bTrials(value, "phone", INP_TRIGGER_CELL)[0] as unknown as Record<string, unknown>).inpMs = "48";
    expectClosedBy(inp(value), "INP: phone has 1 malformed B trial: trigger (inpMs must be null or a number, 0 or more)");

    const undeclared = passingRecord();
    profileOf(undeclared, "phone").trials.push({ cell: "window:paint:0", arm: "B", status: "ok", inpMs: 700, under16: false, fetched: null });
    expectClosedBy(inp(undeclared), "INP: phone has 1 B trial for undeclared cells (window:paint:0)");

    const cell = passingRecord();
    profileOf(cell, "desktop").cells.push({ id: "window:swap:9", kind: "window", family: "swap", offsetMs: 90, arms: ["A", "B"] });
    expectClosedBy(inp(cell), 'INP: desktop has 1 malformed cell: window:swap:9 (a window cell\'s id is "window:swap:90")');

    const twice = passingRecord();
    profileOf(twice, "desktop").cells.push({ id: INP_TRIGGER_CELL, kind: "trigger", family: null, offsetMs: null, arms: ["B"] });
    expectClosedBy(inp(twice), "INP: desktop has 1 malformed cell: trigger (declared twice)");

    const shapeless = passingRecord();
    (profileOf(shapeless, "phone") as unknown as Record<string, unknown>).cells = {};
    (profileOf(shapeless, "desktop") as unknown as Record<string, unknown>).trials = null;
    expectClosedBy(inp(shapeless), "INP: phone declares no cells", "INP: desktop has no trials");
  });

  test("a profile other than phone and desktop closes it, whatever it carries", () => {
    const tablet = passingRecord();
    loose(tablet.profiles).tablet = {
      calibration: { pass: false, measuredMs: 400, expectedMs: 100 },
      cells: [{ id: INP_TRIGGER_CELL, kind: "trigger", family: null, offsetMs: null, arms: ["B"] }],
      trials: [{ cell: INP_TRIGGER_CELL, arm: "B", status: "error", inpMs: 900, under16: false, fetched: null }],
    };
    expect(expectClosedBy(inp(tablet)).inp.reasons, "an unread profile with an error trial must close the gate").toEqual([
      'INP: unexpected profile "tablet" (a record has only phone and desktop)',
    ]);

    /* A profile name is matched exactly: "Phone" is not the phone. */
    const wrongCase = passingRecord();
    loose(wrongCase.profiles).Phone = wrongCase.profiles.phone;
    delete wrongCase.profiles.phone;
    expect(expectClosedBy(inp(wrongCase)).inp.reasons, "a wrong-case profile name must close the gate").toEqual([
      'INP: unexpected profile "Phone" (a record has only phone and desktop)',
      "INP: no phone profile",
    ]);

    const both = passingRecord();
    loose(both.profiles).Desktop = passingProfile();
    loose(both.profiles)["phone "] = passingProfile();
    expect(expectClosedBy(inp(both)).inp.reasons).toEqual(['INP: unexpected profiles "Desktop", "phone " (a record has only phone and desktop)']);
  });

  test("a negative duration or offset closes it: a sign error in the harness is not a fast tap", () => {
    const tap = passingRecord();
    addTrial(tap, "phone", { cell: "fixed:visit", inpMs: -5 });
    expect(expectClosedBy(inp(tap)).inp.reasons, "a negative inpMs must close the gate").toEqual([
      "INP: phone has 1 malformed B trial: fixed:visit (inpMs must be null or a number, 0 or more)",
    ]);

    const allNegative = passingRecord();
    for (const t of profileOf(allNegative, "desktop").trials) if (t.arm === "B" && t.inpMs !== null) t.inpMs = -1000;
    expectClosedBy(inp(allNegative), "INP: desktop trigger has 0 ok B trials (needs 10)");

    const offset = passingRecord();
    recell(offset, "desktop", "window:scene:150", { id: "window:scene:-150", offsetMs: -150 });
    expect(expectClosedBy(inp(offset)).inp.reasons, "a negative window offset must not count toward its family").toEqual([
      "INP: desktop has 1 malformed cell: window:scene:-150 (a window cell's offsetMs must be a number, 0 or more)",
      "INP: desktop window family scene has 1 offset (needs 2)",
      "INP: desktop has 20 B trials for undeclared cells (window:scene:-150)",
    ]);

    /* A missing or non-numeric offset does not count as a second offset either. */
    for (const offsetMs of [null, "150"]) {
      const r = passingRecord();
      recell(r, "phone", "window:swap:150", { id: `window:swap:${offsetMs}`, offsetMs });
      expect(expectClosedBy(inp(r)).inp.reasons, `offsetMs ${JSON.stringify(offsetMs)} must not count toward its family`).toEqual([
        `INP: phone has 1 malformed cell: window:swap:${offsetMs} (a window cell's offsetMs must be a number, 0 or more)`,
        "INP: phone window family swap has 1 offset (needs 2)",
        `INP: phone has 20 B trials for undeclared cells (window:swap:${offsetMs})`,
      ]);
    }
  });

  test("every field the gate reads is checked, and a bad one closes it with its own reason", () => {
    const UPPER = FINGERPRINT.toUpperCase();
    expect(UPPER).not.toBe(FINGERPRINT);
    const cases: [string, (r: InpGateRecord) => void, string[]][] = [
      [
        "under16 as a count, with no INP value",
        (r) => addTrial(r, "phone", { cell: "fixed:place-open", inpMs: null, under16: 2 }),
        ["INP: phone has 1 malformed B trial: fixed:place-open (under16 is not a boolean)"],
      ],
      [
        "fetched as a string",
        (r) => addTrial(r, "phone", { cell: "fixed:keyboard", fetched: "no" }),
        ["INP: phone has 1 malformed B trial: fixed:keyboard (fetched must be a boolean or null)"],
      ],
      [
        "fetched missing",
        (r) => addTrial(r, "desktop", { cell: "window:request:0", fetched: undefined }),
        ["INP: desktop has 1 malformed B trial: window:request:0 (fetched must be a boolean or null)"],
      ],
      ["a trial with an empty cell", (r) => addTrial(r, "phone", { cell: "" }), ["INP: phone has 1 malformed B trial: ? (no cell)"]],
      ["a trial with no cell", (r) => addTrial(r, "phone", { cell: undefined }), ["INP: phone has 1 malformed B trial: ? (no cell)"]],
      [
        "a required cell of an unknown kind, with no trials",
        (r) => {
          recell(r, "phone", "fixed:visit", { kind: "bogus" });
          profileOf(r, "phone").trials = profileOf(r, "phone").trials.filter((t) => t.cell !== "fixed:visit");
        },
        ['INP: phone has 1 malformed cell: fixed:visit (unknown kind "bogus")', "INP: phone is missing cell fixed:visit"],
      ],
      [
        "a control-kind cell under another id",
        (r) => recell(r, "phone", "fixed:canvas-tap", { kind: "control" }),
        [
          'INP: phone has 1 malformed cell: fixed:canvas-tap (the control cell is "control:no-interaction")',
          "INP: phone is missing cell fixed:canvas-tap",
          "INP: phone has 10 B trials for undeclared cells (fixed:canvas-tap)",
        ],
      ],
      [
        "a trigger-kind cell under another id",
        (r) => recell(r, "desktop", "fixed:keyboard", { kind: "trigger" }),
        [
          'INP: desktop has 1 malformed cell: fixed:keyboard (the trigger cell is "trigger")',
          "INP: desktop is missing cell fixed:keyboard",
          "INP: desktop has 10 B trials for undeclared cells (fixed:keyboard)",
        ],
      ],
      [
        "a fixed-kind cell without the fixed: prefix",
        (r) => recell(r, "desktop", "fixed:list-link", { id: "list-link" }),
        [
          'INP: desktop has 1 malformed cell: list-link (a fixed cell is "fixed:<name>", the name in lowercase letters, digits and hyphens)',
          "INP: desktop is missing cell fixed:list-link",
          "INP: desktop has 10 B trials for undeclared cells (list-link)",
        ],
      ],
      [
        "an extra fixed cell with an empty name",
        (r) => addCell(r, "phone", { id: "fixed:", kind: "fixed", family: null, offsetMs: null, arms: ["B"] }, 10),
        [
          'INP: phone has 1 malformed cell: fixed: (a fixed cell is "fixed:<name>", the name in lowercase letters, digits and hyphens)',
          "INP: phone has 10 B trials for undeclared cells (fixed:)",
        ],
      ],
      [
        "an extra window cell of an unknown family",
        (r) => addCell(r, "desktop", { id: "window:paint:0", kind: "window", family: "paint", offsetMs: 0, arms: ["B"] }, 20),
        ['INP: desktop has 1 malformed cell: window:paint:0 (unknown window family "paint")', "INP: desktop has 20 B trials for undeclared cells (window:paint:0)"],
      ],
      [
        "a cell with no id, and one with an empty id",
        (r) => {
          addCell(r, "phone", { kind: "control", family: null, offsetMs: null, arms: ["B"] }, 0);
          addCell(r, "phone", { id: "", kind: "fixed", family: null, offsetMs: null, arms: ["B"] }, 0);
        },
        ["INP: phone has 2 malformed cells: ? (no id), ? (no id)"],
      ],
      [
        'arms ["B","B"]',
        (r) => recell(r, "phone", "fixed:visit", { arms: ["B", "B"] }),
        [
          'INP: phone has 1 malformed cell: fixed:visit (arms must be ["A","B"] or ["B"]: each once)',
          "INP: phone is missing cell fixed:visit",
          "INP: phone has 10 B trials for undeclared cells (fixed:visit)",
        ],
      ],
      [
        'arms ["B","C"]',
        (r) => recell(r, "phone", "fixed:visit", { arms: ["B", "C"] }),
        [
          'INP: phone has 1 malformed cell: fixed:visit (arms must be ["A","B"] or ["B"]: only "A" and "B")',
          "INP: phone is missing cell fixed:visit",
          "INP: phone has 10 B trials for undeclared cells (fixed:visit)",
        ],
      ],
      [
        'calibration.pass as the string "false"',
        (r) => (loose(profileOf(r, "phone").calibration).pass = "false"),
        ["INP: phone calibration failed (measured 104 ms, expected 100 ms)"],
      ],
      ["calibration.pass as 1", (r) => (loose(profileOf(r, "desktop").calibration).pass = 1), ["INP: desktop calibration failed (measured 104 ms, expected 100 ms)"]],
      ['smoke as the string "false"', (r) => (loose(r).smoke = "false"), ['INP: smoke is "false", not false']],
      ["smoke as 0", (r) => (loose(r).smoke = 0), ["INP: smoke is 0, not false"]],
      ["a phone profile that is an array", (r) => (loose(r.profiles).phone = []), ["INP: phone profile is not an object"]],
      ["a desktop profile that is a string", (r) => (loose(r.profiles).desktop = "PASS"), ["INP: desktop profile is not an object"]],
      ["the record's fingerprint in uppercase", (r) => (r.fingerprint = UPPER), ["INP: the record's fingerprint is not 64 lowercase hex characters"]],
      ["the record's fingerprint cut short", (r) => (r.fingerprint = FINGERPRINT.slice(0, 63)), ["INP: the record's fingerprint is not 64 lowercase hex characters"]],
      [
        "a record that throws while it is read",
        (r) =>
          Object.defineProperty(r, "profiles", {
            get() {
              throw new Error("boom");
            },
          }),
        ["INP: the record could not be checked (boom)"],
      ],
    ];
    for (const [label, edit, reasons] of cases) {
      const r = passingRecord();
      edit(r);
      let outcome: ReturnType<typeof decideEstate3D> | Error;
      try {
        outcome = decideVerified(inp(r));
      } catch (e) {
        outcome = e instanceof Error ? e : new Error(String(e));
      }
      expect(outcome instanceof Error ? outcome.message : null, `${label}: the gate must decide, not throw`).toBeNull();
      const d = outcome as ReturnType<typeof decideEstate3D>;
      expect(d.open, `${label}: the gate must stay closed`).toBe(false);
      expect(d.inp.reasons, `${label}: the reasons`).toEqual(reasons);
    }
    /* A current fingerprint that is not lowercase hex matches nothing, not even itself. */
    expect(expectClosedBy(inp(passingRecord(UPPER), UPPER)).inp.reasons).toEqual(["INP: no fingerprint for this tree"]);
  });

  test("every failed condition gets its own reason", () => {
    const r = passingRecord(OTHER_FINGERPRINT);
    r.smoke = true;
    delete r.profiles.desktop;
    bTrials(r, "phone", "window:renderer:0")[1]!.inpMs = 248;
    const d = expectClosedBy(inp(r));
    expect(d.inp.reasons).toEqual([
      "INP: smoke run",
      `INP: fingerprint mismatch (record ${OTHER_FINGERPRINT.slice(0, 12)}…, this tree ${FINGERPRINT.slice(0, 12)}…)`,
      "INP: phone window:renderer:0 has 1 trial at 248 ms",
      "INP: no desktop profile",
    ]);
    expect(d.inp.reason).toBe(d.inp.reasons.join("; "));
  });

  test("the review preview opens regardless of the INP record", () => {
    for (const input of [NO_RECORD, inp(passingRecord(OTHER_FINGERPRINT)), inp({ ...passingRecord(), smoke: true })]) {
      const d = decideEstate3D(plan, { ESTATE_3D_PREVIEW: "1" }, input);
      expect(d.open).toBe(true);
      expect(d.preview).toBe(true);
      expect(d.inp.applied).toBe(false);
      expect(d.inp.pass).toBe(false);
      expect(d.provenance.applied).toBe(false);
    }
    /* The preview still refuses Vercel, whatever the record says. */
    expect(() => decideEstate3D(plan, { ESTATE_3D_PREVIEW: "1", VERCEL: "1" }, inp(passingRecord()))).toThrow(/local review builds only/);
  });

  test("the reason names both conditions, and the INP verdict shows while provenance keeps the gate closed", () => {
    const none = decideEstate3D(plan, {}, NO_RECORD);
    expect(none.open).toBe(false);
    expect(none.reason).toMatch(/^provenance: not owner-verified: .+; INP: no record$/);

    const passing = decideEstate3D(plan, {}, inp(passingRecord()));
    expect(passing.open, "a passing record does not open an unverified plan").toBe(false);
    expect(passing.provenance.pass).toBe(false);
    expect(passing.inp.pass).toBe(true);
    expect(passing.reason).toMatch(/^provenance: not owner-verified: .+; INP: every review-build trial under 200 ms/);

    const lines = describeGateDecision(none);
    expect(lines[0]).toBe("gate CLOSED");
    expect(lines[1]).toMatch(/^ {2}provenance: FAIL — not owner-verified: /);
    expect(lines[2]).toBe(`  INP: FAIL — fingerprint of this tree ${FINGERPRINT}`);
    expect(lines[3]).toBe("    INP: no record");
  });
});

test.describe("the INP record's fingerprint", () => {
  test("is sha256 hex over the mount path, stable, and the gate and the helper agree on the record's path", () => {
    expect(INP_RECORD_FILE).toBe(INP_GATE_RECORD_PATH);
    expect(FINGERPRINT).toMatch(/^[0-9a-f]{64}$/);
    expect(estate3dFingerprint(ROOT, clone()).fingerprint).toBe(FINGERPRINT);

    const files = mountPathFiles(ROOT);
    for (const f of [
      "src/components/sections/EstateMap.tsx",
      "src/components/sections/EstateMap3D.tsx",
      "src/components/sections/EstateMapCard.tsx",
      "src/components/sections/estate-map-3d-gate.ts",
      "src/components/sections/estate-map-3d-layout.ts",
    ]) {
      expect(files).toContain(f);
    }
    for (const f of files) expect(f).toMatch(/^src\/components\/sections\/(EstateMap|estate-map)|^src\/lib\/schedule\.ts$/);
    expect(files).not.toContain("src/lib/estate-3d-fingerprint.ts");
    expect([...files].sort()).toEqual(files);

    const parts = estate3dFingerprint(ROOT, plan);
    for (const pkg of ["three", "react", "react-dom", "next"]) {
      expect(parts.versions[pkg]).toBe((JSON.parse(read("node_modules", pkg, "package.json")) as { version: string }).version);
    }
  });

  test("verifying the plan does not change it, and neither do names, notes, basis or sources", () => {
    expect(estate3dFingerprint(ROOT, verifiedFixture()).fingerprint).toBe(FINGERPRINT);
    const p = clone();
    for (const e of p.elements) {
      e.name = `${e.name} (renamed)`;
      e.notes = "edited";
      e.basis.identity = "edited";
      e.sources = [];
      e.stated = [];
    }
    p.$comment = "edited";
    expect(estate3dFingerprint(ROOT, p).fingerprint).toBe(FINGERPRINT);
  });

  test("moving, resizing, turning, relinking, adding, removing or reordering a drawn element changes it", () => {
    const edits: [string, (p: EstatePlan) => void][] = [
      ["move", (p) => (p.elements.find((e) => e.id === "thoi")!.position!.x += 0.1)],
      ["resize", (p) => (p.elements.find((e) => e.id === "persi")!.footprint = { w: 9, d: 8.5 })],
      ["reshape", (p) => (p.elements.find((e) => e.id === "lane")!.footprint = { points: [[0, 0], [1, 1]] })],
      ["turn", (p) => (p.elements.find((e) => e.id === "helipad")!.orientation = { deg: 15 })],
      ["storeys", (p) => (p.elements.find((e) => e.id === "melia")!.storeys = 3)],
      ["unlink", (p) => (p.elements.find((e) => e.id === "rituals-venue")!.href = null)],
      ["kind", (p) => (p.elements.find((e) => e.id === "rituals-pool")!.kind = "venue")],
      ["id", (p) => (p.elements.find((e) => e.id === "helipad")!.id = "helipad-renamed")],
      [
        "place",
        (p) => {
          const table = p.elements.find((e) => e.id === "long-table")!;
          table.position = { x: 1, z: 1 };
          table.provenance = PROVENANCE_INFERRED;
        },
      ],
      [
        "unplace",
        (p) => {
          const pool = p.elements.find((e) => e.id === "thoi-pool")!;
          pool.position = null;
          pool.provenance = PROVENANCE_NONE;
        },
      ],
      ["reorder", (p) => p.elements.reverse()],
    ];
    const seen = new Set([FINGERPRINT]);
    for (const [name, edit] of edits) {
      const p = clone();
      edit(p);
      const fp = estate3dFingerprint(ROOT, p).fingerprint;
      expect(seen.has(fp), `${name} must change the fingerprint`).toBe(false);
      seen.add(fp);
    }
    /* A missing orientation draws at 0°, so stating 0° changes nothing drawn. */
    const zero = clone();
    const villa = zero.elements.find((e) => e.id === "thoi")!;
    expect(villa.orientation).toBeNull();
    villa.orientation = { deg: 0 };
    expect(estate3dFingerprint(ROOT, zero).fingerprint).toBe(FINGERPRINT);
  });

  test("the mount-path sources, schedule.ts and the dependency versions change it; CRLF and other files do not; the record is read as production reads it", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "estate3d-fingerprint-"));
    const write = (rel: string, text: string) => {
      fs.mkdirSync(path.dirname(path.join(tmp, rel)), { recursive: true });
      fs.writeFileSync(path.join(tmp, rel), text);
    };
    const pkg = (name: string, version: string) => write(`node_modules/${name}/package.json`, JSON.stringify({ name, version }));
    try {
      write("src/components/sections/EstateMap.tsx", "export const a = 1;\nexport const b = 2;\n");
      write("src/components/sections/Hero.tsx", "export const hero = 1;\n");
      for (const name of ["three", "react", "react-dom", "next"]) pkg(name, "1.0.0");
      const fp = () => estate3dFingerprint(tmp, plan).fingerprint;
      const base = fp();
      expect(base).toMatch(/^[0-9a-f]{64}$/);

      write("src/components/sections/EstateMap.tsx", "export const a = 1;\r\nexport const b = 2;\r\n");
      expect(fp(), "CRLF must hash as LF").toBe(base);
      write("src/components/sections/Hero.tsx", "export const hero = 2;\n");
      expect(fp(), "a file off the mount path must not count").toBe(base);

      const seen = new Set([base]);
      const changed = (why: string) => {
        const now = fp();
        expect(seen.has(now), `${why} must change the fingerprint`).toBe(false);
        seen.add(now);
      };
      write("src/components/sections/EstateMap.tsx", "export const a = 1;\nexport const b = 3;\n");
      changed("an edit to EstateMap.tsx");
      /* Same bytes under another name: the path is part of what is hashed. */
      fs.renameSync(path.join(tmp, "src/components/sections/EstateMap.tsx"), path.join(tmp, "src/components/sections/EstateMapRenamed.tsx"));
      expect(mountPathFiles(tmp)).toEqual(["src/components/sections/EstateMapRenamed.tsx"]);
      changed("a mount-path file renamed with the same content");
      write("src/components/sections/estate-map-schedule.ts", "export {};\n");
      changed("a new estate-map module");
      write("src/components/sections/estate-map-parts/phase.ts", "export {};\n");
      changed("a file under an estate-map directory");
      write("src/lib/schedule.ts", "export {};\n");
      changed("src/lib/schedule.ts");
      for (const name of ["three", "react", "react-dom", "next"]) {
        pkg(name, "1.0.1");
        changed(`a ${name} version`);
      }

      /* The record, read the way the build reads it. */
      const verified = verifiedFixture();
      const current = estate3dFingerprint(tmp, verified).fingerprint;
      expect(estate3dInpInput(tmp, verified)).toEqual({ record: null, fingerprint: current });
      expect(decideEstate3D(verified, {}, estate3dInpInput(tmp, verified)).reason).toContain("INP: no record");
      write(INP_RECORD_FILE, JSON.stringify(passingRecord(current)));
      expect(decideEstate3D(verified, {}, estate3dInpInput(tmp, verified)).open).toBe(true);
      write(INP_RECORD_FILE, "{ not json");
      const unreadable = decideEstate3D(verified, {}, estate3dInpInput(tmp, verified));
      expect(unreadable.open).toBe(false);
      expect(unreadable.inp.reasons[0]).toMatch(/^INP: record unreadable \(qa\/perf\/INP-estate3d-gate\.json is not valid JSON: /);

      write(INP_RECORD_FILE, JSON.stringify(passingRecord(current)));
      fs.rmSync(path.join(tmp, "node_modules", "next"), { recursive: true });
      expect(() => fp(), "an uninstalled dependency cannot be fingerprinted").toThrow();
      /* ...and the build's input then closes the gate with the reason instead of throwing, even beside a record. */
      const unfingerprinted = estate3dInpInput(tmp, verified);
      expect(unfingerprinted.fingerprint).toBe("");
      const closed = decideEstate3D(verified, {}, unfingerprinted);
      expect(closed.open).toBe(false);
      expect(closed.inp.reasons).toContain(`INP: no fingerprint for this tree (${unfingerprinted.fingerprintError})`);
      expect(unfingerprinted.fingerprintError).toMatch(/ENOENT/);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("one file cannot pass for two: each file's entry carries its length", () => {
    /* Without the length, one file holding a second file's header would hash exactly like the two files. */
    const DIR = "src/components/sections";
    const fingerprintOf = (files: Record<string, string>) => {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "estate3d-framing-"));
      try {
        for (const [rel, text] of Object.entries(files)) {
          fs.mkdirSync(path.dirname(path.join(tmp, rel)), { recursive: true });
          fs.writeFileSync(path.join(tmp, rel), text);
        }
        for (const name of ["three", "react", "react-dom", "next"]) {
          fs.mkdirSync(path.join(tmp, "node_modules", name), { recursive: true });
          fs.writeFileSync(path.join(tmp, "node_modules", name, "package.json"), JSON.stringify({ name, version: "1.0.0" }));
        }
        expect(mountPathFiles(tmp)).toEqual(Object.keys(files).sort());
        return estate3dFingerprint(tmp, plan).fingerprint;
      } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
      }
    };
    const two = fingerprintOf({ [`${DIR}/EstateMap.tsx`]: "a", [`${DIR}/EstateMapZ.tsx`]: "b" });
    const oneForged = fingerprintOf({ [`${DIR}/EstateMap.tsx`]: `a\nfile ${DIR}/EstateMapZ.tsx\nb` });
    expect(oneForged, "a file carrying another file's header must not hash like the two files").not.toBe(two);
  });

  test("the mount path's imports from outside the fingerprint are the reviewed few", () => {
    /*
     * The fingerprint hashes the mount-path files, not everything they import,
     * and a new mount-path module must be named to fall under it (D-028's gate
     * format). This turns red when the mount path starts importing anything
     * else, so that the fingerprint's scope is decided again rather than
     * narrowed without anyone noticing. Type-only imports are erased and do not
     * count; packages fingerprinted by version do not count.
     */
    const hashed = new Set(mountPathFiles(ROOT));
    const resolveLocal = (from: string, spec: string) => {
      const base = spec.startsWith("@/") ? path.posix.join("src", spec.slice(2)) : path.posix.join(path.posix.dirname(from), spec);
      for (const ext of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) {
        const candidate = path.join(ROOT, base + ext);
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return base + ext;
      }
      return `unresolved ${spec} (from ${from})`;
    };
    const found = new Set<string>();
    const outside = new Set<string>();
    for (const file of hashed) {
      const text = read(file);
      const specs = [
        ...text.matchAll(/^\s*import\s+(?!type\b)[^;]*?\bfrom\s+["']([^"']+)["']/gm),
        ...text.matchAll(/^\s*export\s+(?:\*(?:\s+as\s+\w+)?|\{[^}]*\})\s+from\s+["']([^"']+)["']/gm),
        ...text.matchAll(/^\s*import\s+["']([^"']+)["']/gm),
        ...text.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g),
      ].map((m) => m[1]!);
      for (const spec of specs) {
        found.add(spec);
        if (spec.startsWith(".") || spec.startsWith("@/")) {
          const target = resolveLocal(file, spec);
          if (!hashed.has(target)) outside.add(target);
        } else {
          const pkg = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]!;
          if (!(FINGERPRINTED_PACKAGES as readonly string[]).includes(pkg)) outside.add(`package ${pkg}`);
        }
      }
    }
    /* The scan reached its subject: a multi-line import, a dynamic import, and a local import between hashed files. */
    for (const spec of ["three", "react", "./EstateMap3D", "./estate-map-3d-layout", "./EstateMapCard"]) {
      expect([...found], `the import scan must find ${spec}`).toContain(spec);
    }
    expect(
      [...outside].sort(),
      "a mount-path import from outside the fingerprint: name the module EstateMap* or estate-map-* so the fingerprint covers it, or decide the fingerprint's scope again and list it here"
    ).toEqual(["src/components/motion/Magnetic.tsx", "src/components/ui/Clause.tsx", "src/components/ui/Ledger.tsx"]);
  });
});
