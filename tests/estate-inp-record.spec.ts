import fs from "node:fs";
import path from "node:path";

import { test, expect } from "@playwright/test";

import {
  ESTATE3D_MARK,
  ESTATE3D_MARK_ORDER,
  ESTATE3D_MARK_PREFIX,
  WINDOW_ANCHOR,
  WINDOW_ANCHOR_MARKS,
} from "../src/components/sections/estate-map-3d-marks";
import {
  INP_CONTROL_CELL,
  INP_FIXED_CELLS,
  INP_GATE_SCHEMA,
  INP_MIN_OK_TRIALS,
  INP_MIN_WINDOW_OFFSETS,
  INP_PROFILES,
  INP_TRIGGER_CELL,
  INP_WINDOW_FAMILIES,
  type InpArm,
  type InpGateRecord,
  type InpProfileName,
} from "../src/lib/estate-plan-gate";
import { estate3dFingerprint } from "../src/lib/estate-3d-fingerprint";
import {
  DEFAULT_OFFSETS,
  DEFAULT_OFFSET_PHASE_MS,
  FIXED_SCENARIOS,
  INP_MIN_IN_PHASE_TRIALS,
  INP_TRIGGER_TARGET,
  OFFSET_TOLERANCE_MS,
  buildGateRecord,
  cellIdFor,
  cellsOf,
  checkGateRecord,
  derivedOffsets,
  harnessRules,
  hitAControl,
  isTriggerTarget,
  phaseEndMarkOf,
  plannedCells,
  recordStatus,
  trialOf,
  under16Of,
  type InpRow,
} from "../scripts/estate-inp-record.mjs";

/**
 * THE INP HARNESS'S OWN RULES — the part of `scripts/estate-inp.mjs` that can
 * be tested without a browser, which is the part that decides what the gate's
 * record SAYS (D-033).
 *
 * WHY THESE TESTS EXIST AT ALL. The measurement of record is hours of machine
 * time. Every rule below is one that, if it were wrong, would be discovered
 * only after those hours: a cell id the gate spells differently, a status word
 * it does not know, a trial rescued as "under 16 ms" that the browser never
 * registered, a mark the harness waits for that the page no longer emits. So
 * each is asserted here, in milliseconds, and the harness's own self-check runs
 * the gate's reader — not a copy of its rules — over the record before it is
 * written.
 */

const ROOT = process.cwd();
const SECTIONS = path.join(ROOT, "src", "components", "sections");
const MARKS_FILE = "estate-map-3d-marks.ts";
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "estate-plan.json"), "utf-8"));
const FINGERPRINT = estate3dFingerprint(ROOT, plan).fingerprint;

/** Comments name the marks in prose deliberately; what must not exist anywhere else is the name in the CODE. */
const stripComments = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

test.describe("the estate3d:* mark names live in one place", () => {
  test("every name carries the prefix, and no two phases share one", () => {
    const names = Object.values(ESTATE3D_MARK);
    for (const name of names) expect(name.startsWith(ESTATE3D_MARK_PREFIX), `${name} is not prefixed ${ESTATE3D_MARK_PREFIX}`).toBe(true);
    expect(new Set(names).size, "two phases share a mark name").toBe(names.length);
  });

  test("the phase order lists every phase exactly once", () => {
    expect([...ESTATE3D_MARK_ORDER].sort()).toEqual(Object.keys(ESTATE3D_MARK).sort());
  });

  /*
   * THE TEST A RENAME FAILS. While the names were literals in the components,
   * renaming one there left the harness waiting for an anchor that never
   * arrives — twenty invalid trials per cell and nothing to say why. They are
   * now constants, and no other file in the mount path may spell one.
   */
  test("no other file under src/components/sections spells a mark name in code", () => {
    const offenders: string[] = [];
    for (const entry of fs.readdirSync(SECTIONS, { withFileTypes: true })) {
      if (!entry.isFile() || entry.name === MARKS_FILE) continue;
      if (!/\.tsx?$/.test(entry.name)) continue;
      const code = stripComments(fs.readFileSync(path.join(SECTIONS, entry.name), "utf-8"));
      if (code.includes(ESTATE3D_MARK_PREFIX)) offenders.push(entry.name);
    }
    expect(offenders, `these files spell "${ESTATE3D_MARK_PREFIX}" in code instead of importing ${MARKS_FILE}`).toEqual([]);
  });

  /*
   * THE PHASE EACH FAMILY IS NAMED FOR, derived from the mark ORDER rather than
   * declared a second time - so "where the renderer phase ends" cannot drift
   * away from "which mark follows estate3d:renderer".
   */
  test("every mark-keyed family's phase ends at the mark that follows its anchor", () => {
    expect(phaseEndMarkOf("renderer")).toBe(ESTATE3D_MARK.scene);
    expect(phaseEndMarkOf("scene")).toBe(ESTATE3D_MARK.compile);
    expect(phaseEndMarkOf("compile")).toBe(ESTATE3D_MARK.compiled);
    expect(phaseEndMarkOf("layout")).toBe(ESTATE3D_MARK.swap);
    expect(phaseEndMarkOf("swap")).toBe(ESTATE3D_MARK.shown);
    expect(phaseEndMarkOf("trigger")).toBe(ESTATE3D_MARK.idle);
    /* The chunk's evaluation is what `arrival` exists to sample, and it ends at import-end. `request` ends at a byte count, not a mark. */
    expect(phaseEndMarkOf("arrival")).toBe(ESTATE3D_MARK.importEnd);
    expect(phaseEndMarkOf("request")).toBeNull();
  });

  test("the window anchor map covers exactly the gate's eight window families", () => {
    expect(Object.keys(WINDOW_ANCHOR).sort()).toEqual([...INP_WINDOW_FAMILIES].sort());
  });

  test("every mark-keyed anchor is a name this module owns, and the two network families name none", () => {
    const names: string[] = Object.values(ESTATE3D_MARK);
    for (const [family, anchor] of Object.entries(WINDOW_ANCHOR)) {
      if (family === "request" || family === "arrival") {
        expect(anchor, `${family} must anchor on a network event, not a mark`).toBeNull();
        continue;
      }
      expect(anchor, `${family} has no anchor`).not.toBeNull();
      expect(names, `${family} anchors on ${anchor}, which is not one of this module's marks`).toContain(anchor);
    }
    expect(WINDOW_ANCHOR_MARKS.length).toBe(INP_WINDOW_FAMILIES.length - 2);
  });
});

test.describe("the cells the harness declares are the cells the gate reads", () => {
  const planned = plannedCells(DEFAULT_OFFSETS);
  const ids = planned.map((c) => cellIdFor(c));

  test("the planned grid is the control, the trigger, the five fixed scenarios and every family at two or more offsets", () => {
    expect(ids).toContain(INP_CONTROL_CELL);
    expect(ids).toContain(INP_TRIGGER_CELL);
    for (const id of INP_FIXED_CELLS) expect(ids, `${id} is not planned`).toContain(id);
    for (const family of INP_WINDOW_FAMILIES) {
      const offsets = planned.filter((c) => c.kind === "window" && c.family === family).map((c) => c.offset);
      expect(new Set(offsets).size, `${family} has fewer than ${INP_MIN_WINDOW_OFFSETS} distinct offsets`).toBeGreaterThanOrEqual(INP_MIN_WINDOW_OFFSETS);
    }
    expect(new Set(ids).size, "a cell is planned twice").toBe(ids.length);
  });

  /* The gate builds a window cell's id by template from its offsetMs, so an id and an offset that disagree is a cell it refuses. */
  test("a window cell's id and its offsetMs never disagree", () => {
    for (const cell of planned.filter((c) => c.kind === "window")) {
      expect(cellIdFor(cell)).toBe(`window:${cell.family}:${cell.offset}`);
      expect(Number.isInteger(cell.offset), `offset ${cell.offset} is not a whole number of milliseconds`).toBe(true);
      expect(cell.offset as number).toBeGreaterThanOrEqual(0);
    }
  });

  test("every fixed scenario the harness runs is a fixed cell the gate declares", () => {
    expect(FIXED_SCENARIOS.map((s) => `fixed:${s}`).sort()).toEqual([...INP_FIXED_CELLS].sort());
  });

  test("a kind the gate does not know is refused, not spelled", () => {
    expect(() => cellIdFor({ kind: "resize" as InpRow["kind"] })).toThrow(/unknown trial kind/);
  });
});

/* -------------------------------------------------------------------------- *
 * WHICH OF A WINDOW TRIAL'S TWO INPUTS IS THE FIGURE
 * -------------------------------------------------------------------------- */
test.describe("the trigger is told apart from the measured input", () => {
  /*
   * THE TEST THE OLD MATCHER WOULD HAVE FAILED. The recorder used to keep a
   * target's first TWO classes, and `<span className="tabular estate-map-list-index">`
   * was recognised only because it happens to carry exactly two. One more class
   * on that span and the trigger would have looked like the measured
   * interaction; in a trial whose measured tap left no entry, the TRIGGER's
   * latency would then have become the window cell's figure, with status ok.
   */
  test("a trigger target is recognised however many classes the element gains", () => {
    expect(isTriggerTarget("span.tabular.estate-map-list-index")).toBe(true);
    expect(isTriggerTarget("span.tabular.estate-map-list-index.is-new.and-another")).toBe(true);
    expect(isTriggerTarget("span.estate-map-list-index")).toBe(true);
    expect(isTriggerTarget("canvas.estate-map-3d-canvas")).toBe(false);
    expect(isTriggerTarget("span.estate-map-list-index-wrapper"), "a longer class that merely starts the same is not it").toBe(false);
    expect(isTriggerTarget(null)).toBe(false);
  });

  test("the component still spells the class the harness triggers on", () => {
    const source = fs.readFileSync(path.join(SECTIONS, "EstateMap.tsx"), "utf-8");
    const cls = INP_TRIGGER_TARGET.slice(1);
    const classLists = [...source.matchAll(/className="([^"]*)"/g)].map((m) => m[1]!.trim().split(/\s+/));
    const carrying = classLists.filter((list) => list.includes(cls));
    expect(carrying.length, `no element in EstateMap.tsx carries ${cls}, so the harness has nothing to trigger the load with`).toBeGreaterThan(0);
    for (const list of carrying) expect(isTriggerTarget(`span.${list.join(".")}`), `${list.join(" ")} would not be recognised`).toBe(true);
  });

  /*
   * WHAT THE TAP ACTUALLY HIT. A window trial checks its point before the
   * trigger, on the 2D photograph; by the swap the same coordinates can be over
   * a label button, and the cell would be measuring a tap that opens a card.
   */
  test("a measured interaction on a link, a button or a label is not an empty part of the frame", () => {
    expect(hitAControl("button.estate-map-3d-button")).toBe(true);
    expect(hitAControl("a.estate-map-list-link")).toBe(true);
    expect(hitAControl("span.estate-map-3d-button")).toBe(true);
    expect(hitAControl("canvas.estate-map-3d-canvas")).toBe(false);
    expect(hitAControl("img.estate-map-photo")).toBe(false);
    expect(hitAControl(null)).toBe(false);
  });
});

/* -------------------------------------------------------------------------- *
 * THE OFFSETS: WHAT THEY MEAN, NOT ONLY HOW MANY THERE ARE
 * -------------------------------------------------------------------------- */
test.describe("the offsets a window family is probed at", () => {
  /*
   * MUTATION M5 CAUGHT A FAMILY DROPPED TO ONE OFFSET, and nothing caught
   * `arrival: [0, 50]` becoming `[0, 1]` - which removes the deliberate
   * straddle of the chunk's 83-168 ms evaluation that D-033 names as the
   * leading risk, while the family still "has two offsets".
   */
  test("every fallback pair is 0 and a second offset inside the phase, above Event Timing's floor", () => {
    for (const family of INP_WINDOW_FAMILIES) {
      const pair = DEFAULT_OFFSETS[family];
      const [phaseMin] = DEFAULT_OFFSET_PHASE_MS[family];
      expect(pair.length, `${family} has ${pair.length} offsets`).toBeGreaterThanOrEqual(INP_MIN_WINDOW_OFFSETS);
      expect(pair[0], `${family} does not sample the start of its phase`).toBe(0);
      expect(pair[1], `${family}'s second offset is under Event Timing's 16 ms floor, so it samples the same instant as 0`).toBeGreaterThan(16);
      expect(pair[1], `${family}'s second offset is past the ${phaseMin} ms phase it is named for`).toBeLessThan(phaseMin);
    }
  });

  /*
   * ONE TABLE FOR BOTH PROFILES WAS THE PHONE'S. Each profile now takes its own
   * offsets from its own pin run, so a desktop phase of 14 ms is not sampled at
   * an offset of 20.
   */
  test("offsets are derived from the pin run's own measured phases", () => {
    const pin = {
      marks: {
        [ESTATE3D_MARK.trigger]: 1000,
        [ESTATE3D_MARK.idle]: 2000,
        [ESTATE3D_MARK.importEnd]: 2400,
        [ESTATE3D_MARK.renderer]: 2500,
        [ESTATE3D_MARK.scene]: 2514,
        [ESTATE3D_MARK.compile]: 2528,
        [ESTATE3D_MARK.compiled]: 2535,
        [ESTATE3D_MARK.layout]: 2540,
        [ESTATE3D_MARK.swap]: 2584,
        [ESTATE3D_MARK.shown]: 2604,
      },
      resource: { startMs: 2100, responseEndMs: 2275 },
    };
    const { offsets, phases, fellBack } = derivedOffsets(pin, DEFAULT_OFFSETS);
    expect(fellBack).toEqual([]);
    expect(phases.renderer).toBe(14);
    expect(offsets.renderer, "a 14 ms phase must not be probed at the phone's 20 ms").toEqual([0, 7]);
    expect(offsets.layout).toEqual([0, 22]);
    expect(offsets.swap).toEqual([0, 10]);
    expect(offsets.request).toEqual([0, 88]);
    expect(offsets.arrival).toEqual([0, 63]);
    for (const family of INP_WINDOW_FAMILIES) {
      expect(offsets[family]![0]).toBe(0);
      expect(Number.isInteger(offsets[family]![1]), `${family}'s derived offset is not a whole number of milliseconds`).toBe(true);
      expect(offsets[family]![1]).toBeLessThan(phases[family]!);
    }
  });

  test("a family whose phase the pin could not measure keeps the table's pair, and says so", () => {
    const { offsets, fellBack } = derivedOffsets({ marks: {}, resource: null }, DEFAULT_OFFSETS);
    expect([...fellBack].sort()).toEqual([...INP_WINDOW_FAMILIES].sort());
    expect(offsets.arrival).toEqual(DEFAULT_OFFSETS.arrival);
  });
});

test.describe("a trial row", () => {
  const row = (extra: Partial<InpRow>): InpRow => ({ kind: "fixed", scenario: "canvas-tap", profile: "phone", build: "B", status: "ok", ...extra }) as InpRow;

  test("the harness's n/a becomes the gate's na, and an unknown status is refused", () => {
    expect(recordStatus("n/a")).toBe("na");
    for (const s of ["ok", "invalid", "lost", "error"]) expect(recordStatus(s)).toBe(s);
    expect(() => recordStatus("skipped")).toThrow(/no record status/);
  });

  /*
   * D-033: "A trial with no Event Timing entry counts as under only when the
   * harness confirms it was under the 16 ms floor." The confirmation is the
   * browser's interaction count. Without it the trial is INVALID, not fast —
   * this is the rule that keeps an input the page never registered out of the
   * record as a pass.
   */
  test("no Event Timing entry counts as under 16 ms only when the browser counted the input", () => {
    expect(under16Of(row({ inp: null, dispatched: 1, interactionCountDelta: 1 }))).toEqual({ under16: true, invalid: null });
    const notCounted = under16Of(row({ inp: null, dispatched: 1, interactionCountDelta: 0 }));
    expect(notCounted.under16).toBe(false);
    expect(notCounted.invalid).toMatch(/counted 0 of the 1/);
    const noCount = under16Of(row({ inp: null, dispatched: 1, interactionCountDelta: null }));
    expect(noCount.under16).toBe(false);
    expect(noCount.invalid).toMatch(/no interaction count/);
  });

  test("a window trial is confirmed only when the browser counted BOTH its inputs", () => {
    expect(under16Of(row({ kind: "window", family: "arrival", offset: 0, inp: null, dispatched: 2, interactionCountDelta: 2 })).under16).toBe(true);
    expect(under16Of(row({ kind: "window", family: "arrival", offset: 0, inp: null, dispatched: 2, interactionCountDelta: 1 })).under16).toBe(false);
  });

  test("a control row is under16 with a null inpMs, as the record format requires", () => {
    const t = trialOf(row({ kind: "control", scenario: undefined, inp: null, dispatched: 0, fetched: false }));
    expect(t).toMatchObject({ cell: INP_CONTROL_CELL, status: "ok", inpMs: null, under16: true, fetched: false });
  });

  test("a recorded figure is never excused as under 16 ms", () => {
    expect(under16Of(row({ inp: 204, dispatched: 1, interactionCountDelta: 0 })).under16).toBe(false);
    expect(trialOf(row({ inp: 204, dispatched: 1, interactionCountDelta: 1 }))).toMatchObject({ inpMs: 204, under16: false });
  });

  test("an ok row the under-16 rule cannot confirm is written as invalid, with the reason", () => {
    const t = trialOf(row({ inp: null, dispatched: 1, interactionCountDelta: 0 }));
    expect(t.status).toBe("invalid");
    expect(t.reason).toMatch(/counted 0 of the 1/);
  });

  test("the achieved offset and the trace class travel with the row", () => {
    const t = trialOf(row({ kind: "window", family: "layout", offset: 60, inp: 88, offsetAchieved: 63, class: "other-task", anchor: "the page's estate3d:layout mark" }));
    expect(t).toMatchObject({ cell: "window:layout:60", offsetRequestedMs: 60, offsetAchievedMs: 63, class: "other-task" });
  });

  /*
   * THE FIELDS THAT LET THE STRICTER READING BE APPLIED WITHOUT RE-MEASURING.
   * The gate's own comment on `inpMs` says "the WORST interaction in that page
   * view", which the harness reads as the measured input's and not the
   * trigger's. That is a build default, and it is only reversible on a
   * committed record while BOTH figures travel with the row. Dropping either
   * from `extras` used to leave all 28 tests green.
   */
  test("a window row carries the page's worst interaction and the trigger's, so the stricter reading needs no second run", () => {
    const t = trialOf(row({ kind: "window", family: "arrival", offset: 0, inp: 88, pageWorst: 141, triggerInp: 141, inPhase: true }));
    expect(t.pageWorstMs, "without pageWorstMs the stricter reading of inpMs cannot be applied to a committed record").toBe(141);
    expect(t.triggerInpMs, "without triggerInpMs nothing says how much of the page's worst was the trigger").toBe(141);
  });

  /*
   * A ROW THAT DISPATCHED NOTHING IS NOT A FAST ROW. Without the guard, a
   * non-control row with `dispatched: 0` is rescued as under-16 on an
   * interactionCountDelta of 0 - a pass invented out of a missing measurement,
   * which is exactly what mutation M3 exists to prevent.
   */
  test("a non-control row that dispatched nothing is invalid, not under 16 ms", () => {
    const r = under16Of(row({ inp: null, dispatched: 0, interactionCountDelta: 0 }));
    expect(r.under16).toBe(false);
    expect(r.invalid).toMatch(/no interaction was dispatched/);
    const t = trialOf(row({ inp: null, dispatched: 0, interactionCountDelta: 0 }));
    expect(t.status).toBe("invalid");
  });

  /*
   * D-033 requirement 4, enforced where the record is built and not only in
   * controlTrial's untested browser code: "every control trial reports no
   * interaction". The control branch used to return under16 unconditionally,
   * ignoring `inp` altogether.
   */
  test("a control row that recorded an interaction is not written as a passing control", () => {
    const r = under16Of(row({ kind: "control", scenario: undefined, inp: 42, dispatched: 0 }));
    expect(r.under16).toBe(false);
    expect(r.invalid).toMatch(/control trial recorded an interaction/);
    const t = trialOf(row({ kind: "control", scenario: undefined, inp: 42, dispatched: 0, fetched: false }));
    expect(t.status).toBe("invalid");
    expect(t.inpMs).toBe(42);
  });
});

/* -------------------------------------------------------------------------- *
 * THE RECORD, AND THE HARNESS'S REFUSAL TO WRITE ONE THE GATE WOULD REJECT
 *
 * The rows below are FIXTURES, not measurements: they exist to drive the
 * builder and the self-check. No file in qa/ is written by this spec.
 * -------------------------------------------------------------------------- */

function rowsForProfile(profile: InpProfileName, opts: { arms?: InpArm[] } = {}): InpRow[] {
  const arms = opts.arms ?? (["A", "B"] as InpArm[]);
  const out: InpRow[] = [];
  const add = (base: Partial<InpRow>, n: number, inp: (i: number) => number | null) => {
    for (const build of arms) {
      for (let i = 0; i < n; i++) {
        const v = inp(i);
        out.push({
          profile,
          build,
          status: "ok",
          inp: v,
          dispatched: base.kind === "control" ? 0 : base.kind === "window" ? 2 : 1,
          interactionCountDelta: base.kind === "control" ? 0 : base.kind === "window" ? 2 : 1,
          fetched: base.kind === "control" ? false : true,
          ...base,
        } as InpRow);
      }
    }
  };
  add({ kind: "control" }, INP_MIN_OK_TRIALS.control, () => null);
  add({ kind: "trigger" }, INP_MIN_OK_TRIALS.trigger, (i) => 40 + i);
  for (const scenario of FIXED_SCENARIOS) add({ kind: "fixed", scenario }, INP_MIN_OK_TRIALS.fixed, (i) => 24 + i);
  for (const family of INP_WINDOW_FAMILIES) {
    /* `inPhase` is what says the cell caught the phase its id names; a fixture without it is a cell that measured nothing. */
    for (const offset of DEFAULT_OFFSETS[family]) add({ kind: "window", family, offset, inPhase: true, offsetAchieved: offset, phaseMs: 120 }, INP_MIN_OK_TRIALS.window, (i) => (i % 5 === 0 ? null : 150 + i));
  }
  return out;
}

function recordFrom(rowsByProfile: Partial<Record<InpProfileName, InpRow[]>>, fingerprint = FINGERPRINT, smoke = false): InpGateRecord {
  const profiles: Record<string, { calibration: unknown; features: unknown; rows: InpRow[] }> = {};
  for (const [name, rows] of Object.entries(rowsByProfile)) {
    profiles[name] = {
      calibration: { pass: true, measuredMs: 260, expectedMs: 240 },
      features: { gpu: "fixture", software: true, khrParallelShaderCompile: false, requestIdleCallback: true, schedulerYield: true },
      rows: rows ?? [],
    };
  }
  return buildGateRecord({
    generatedAt: "2026-09-18T00:00:00.000Z",
    commit: "0".repeat(40),
    smoke,
    fingerprint,
    builds: { A: { origin: "http://localhost:3165", buildId: "fixture-a" }, B: { origin: "http://localhost:3155", buildId: "fixture-b" } },
    profiles,
  });
}

const complete = () => recordFrom({ phone: rowsForProfile("phone"), desktop: rowsForProfile("desktop") });

test.describe("the record the harness writes", () => {
  test("it carries the gate's schema, both profiles, and every declared cell", () => {
    const record = complete();
    expect(record.schema).toBe(INP_GATE_SCHEMA);
    expect(Object.keys(record.profiles).sort()).toEqual([...INP_PROFILES].sort());
    for (const name of INP_PROFILES) {
      const ids = record.profiles[name]!.cells.map((c) => c.id);
      expect(ids).toContain(INP_CONTROL_CELL);
      expect(ids).toContain(INP_TRIGGER_CELL);
      expect(ids.filter((id) => id.startsWith("window:")).length).toBe(Object.values(DEFAULT_OFFSETS).flat().length);
    }
  });

  test("a cell declares the arms it was measured on, and B is always one of them", () => {
    const both = cellsOf(rowsForProfile("phone"));
    for (const cell of both) expect(cell.arms).toEqual(["A", "B"]);
    const onlyB = cellsOf(rowsForProfile("phone", { arms: ["B"] }));
    for (const cell of onlyB) expect(cell.arms).toEqual(["B"]);
  });

  test("the gate's own reader accepts a complete record, on the shape and on the measurement", () => {
    const verdict = checkGateRecord(complete(), FINGERPRINT);
    expect(verdict.shape.reasons).toEqual([]);
    expect(verdict.substance.reasons).toEqual([]);
    expect(verdict.write).toBe(true);
  });

  /* SHAPE: the record cannot be read as the schema. It is not written. */
  test("a cell that was never measured is a shape failure, and the record is refused", () => {
    const rows = rowsForProfile("phone").filter((r) => cellIdFor(r) !== "fixed:keyboard");
    const verdict = checkGateRecord(recordFrom({ phone: rows, desktop: rowsForProfile("desktop") }), FINGERPRINT);
    expect(verdict.write).toBe(false);
    expect(verdict.shape.reasons.join("; ")).toMatch(/phone is missing cell fixed:keyboard/);
  });

  test("a profile the gate does not read is a shape failure", () => {
    const record = recordFrom({ phone: rowsForProfile("phone"), desktop: rowsForProfile("desktop") });
    (record.profiles as Record<string, unknown>).tablet = record.profiles.phone;
    const verdict = checkGateRecord(record, FINGERPRINT);
    expect(verdict.write).toBe(false);
    expect(verdict.shape.reasons.join("; ")).toMatch(/unexpected profile "tablet"/);
  });

  test("a fingerprint that is not this tree's is a shape failure: the harness computes it, so a mismatch is a harness bug", () => {
    const other = FINGERPRINT.replace(/^./, (c) => (c === "0" ? "1" : "0"));
    const verdict = checkGateRecord(recordFrom({ phone: rowsForProfile("phone"), desktop: rowsForProfile("desktop") }, other), FINGERPRINT);
    expect(verdict.write).toBe(false);
    expect(verdict.shape.reasons.join("; ")).toMatch(/fingerprint mismatch/);
  });

  test("a row whose fields are not of the schema's types is a shape failure, and the record is refused", () => {
    const record = recordFrom({ phone: rowsForProfile("phone"), desktop: rowsForProfile("desktop") });
    /* The harness printing its own word for "not applicable" instead of the record's, and a control that says "no" rather than false. */
    const trials = record.profiles.phone!.trials as unknown as Record<string, unknown>[];
    /* Arm B: the gate reads no other, so a malformed A row would prove nothing. */
    const b = trials.filter((t) => t.arm === "B");
    b[0]!.status = "n/a";
    b[1]!.fetched = "no";
    const verdict = checkGateRecord(record, FINGERPRINT);
    expect(verdict.write).toBe(false);
    expect(verdict.shape.reasons.join("; ")).toMatch(/malformed B trial/);
  });

  test("a control row that cannot say whether three.js was fetched is a measurement failure, and the record is written", () => {
    const rows = rowsForProfile("phone").map((r) => (r.kind === "control" ? { ...r, fetched: null } : r));
    const verdict = checkGateRecord(recordFrom({ phone: rows, desktop: rowsForProfile("desktop") }), FINGERPRINT);
    expect(verdict.write, "the harness could not confirm the control; that is a gap in the measurement, not an unreadable record").toBe(true);
    expect(verdict.substance.reasons.join("; ")).toMatch(/did not record whether three\.js was fetched/);
  });

  /* SUBSTANCE: the record reads, and the measurement falls short. It IS written, and the exit code says so. */
  test("a trial at exactly 200 ms is a measurement failure, and the record is still written", () => {
    const rows = rowsForProfile("phone");
    const i = rows.findIndex((r) => r.build === "B" && r.kind === "window");
    rows[i] = { ...rows[i]!, inp: 200 };
    const verdict = checkGateRecord(recordFrom({ phone: rows, desktop: rowsForProfile("desktop") }), FINGERPRINT);
    expect(verdict.write, "a measured figure over the bar must be written, not hidden").toBe(true);
    expect(verdict.substance.pass).toBe(false);
    expect(verdict.substance.reasons.join("; ")).toMatch(/window:trigger:0 has 1 trial at 200 ms/);
  });

  test("too few valid trials is a measurement failure, and the record is still written", () => {
    const rows = rowsForProfile("phone");
    const first = rows.findIndex((r) => r.build === "B" && cellIdFor(r) === "fixed:visit");
    rows[first] = { ...rows[first]!, status: "invalid", reason: "the Visit link did not arrive" };
    const verdict = checkGateRecord(recordFrom({ phone: rows, desktop: rowsForProfile("desktop") }), FINGERPRINT);
    expect(verdict.write).toBe(true);
    expect(verdict.substance.reasons.join("; ")).toMatch(/phone fixed:visit has 9 ok B trials \(needs 10\)/);
  });

  test("an errored or lost trial anywhere is a measurement failure", () => {
    for (const status of ["error", "lost"] as const) {
      const rows = rowsForProfile("phone");
      const i = rows.findIndex((r) => r.build === "B" && r.kind === "trigger");
      rows[i] = { ...rows[i]!, status, reason: "fixture" };
      const verdict = checkGateRecord(recordFrom({ phone: rows, desktop: rowsForProfile("desktop") }), FINGERPRINT);
      expect(verdict.substance.reasons.join("; "), status).toMatch(new RegExp(`1 ${status} B trial`));
    }
  });

  /*
   * A SMOKE RUN'S SHORTFALLS ARE STILL REPORTED. The self-check runs with
   * `smoke` forced false, so "smoke run" never stands in for the substantive
   * reasons a landing session needs to see.
   */
  /*
   * THE ONE REGRESSION THE CONTROL CELL EXISTS TO CATCH (D-035: nothing is
   * fetched until the reader's first completed interaction). It is a
   * MEASUREMENT failure: the record is written, the exit code is 1, and every
   * reason is printed. While `shapeProbe` normalised only `fetched: null`, this
   * came out as a SHAPE failure - record NOT WRITTEN, exit code 2 ("the harness
   * is buggy"), and the substance reasons never printed at all.
   */
  test("a control row that fetched three.js is a measurement failure, and the record is written", () => {
    /* Exactly what `controlTrial` produces when the review build requests three.js on a page nobody touched: invalid, with fetched recorded truthfully. */
    const asMeasured = rowsForProfile("phone").map((r) => (r.kind === "control" && r.build === "B" ? { ...r, status: "invalid" as const, fetched: true, reason: "three.js was requested with no interaction" } : r));
    const verdict = checkGateRecord(recordFrom({ phone: asMeasured, desktop: rowsForProfile("desktop") }), FINGERPRINT);
    expect(verdict.write, "three.js fetched with no interaction is a figure, and a figure is never withheld").toBe(true);
    expect(verdict.shape.reasons.join("; "), "it is not a shape failure: `true` is a value the schema accepts, so the probe normalises it").toEqual("");
    expect(verdict.substance.pass).toBe(false);
    expect(verdict.substance.reasons.join("; ")).toMatch(/control:no-interaction has 10 B trials not ok \(invalid\)/);

    /* And the gate's own rule about it, on a record that calls such a row ok: the reason names the fetch, and it is still a measurement. */
    const asOk = rowsForProfile("phone").map((r) => (r.kind === "control" && r.build === "B" ? { ...r, fetched: true } : r));
    const second = checkGateRecord(recordFrom({ phone: asOk, desktop: rowsForProfile("desktop") }), FINGERPRINT);
    expect(second.write).toBe(true);
    expect(second.shape.reasons.join("; ")).toEqual("");
    expect(second.substance.reasons.join("; ")).toMatch(/has 10 B trials that fetched three\.js/);
  });

  /*
   * THE ACCEPTANCE CLAIM COMES FROM THE RECORD AS WRITTEN. `substance` is
   * computed with `smoke` forced false so that a short run still prints WHAT is
   * short; if the acceptance claim comes from that same copy, a run that wrote
   * `smoke: true` announces that the gate accepts a record the gate rejects
   * outright, and exits 0.
   */
  test("a smoke record is never reported as accepted, however complete its rows", () => {
    const record = recordFrom({ phone: rowsForProfile("phone"), desktop: rowsForProfile("desktop") }, FINGERPRINT, true);
    const verdict = checkGateRecord(record, FINGERPRINT);
    expect(verdict.write).toBe(true);
    expect(verdict.smoke).toBe(true);
    expect(verdict.substance.pass, "with smoke cleared there is nothing else wrong with it").toBe(true);
    expect(verdict.asWritten.pass, "the gate rejects smoke: true outright, so the harness may not claim acceptance").toBe(false);
    expect(verdict.asWritten.reasons.join("; ")).toMatch(/smoke run/);
  });

  /*
   * THE HARNESS'S OWN RULE, WHICH IS NOT THE GATE'S. The gate counts a window
   * cell's ok trials and checks each against 200 ms; it never asks whether the
   * cell caught the phase it is named for, and twenty fast taps on an idle page
   * read exactly like twenty fast taps on a busy one.
   */
  test("a window cell whose trials all missed their phase is reported, though the gate's reader is content", () => {
    const rows = rowsForProfile("phone").map((r) => (r.kind === "window" && r.family === "arrival" && r.offset === 0 ? { ...r, inPhase: false } : r));
    const record = recordFrom({ phone: rows, desktop: rowsForProfile("desktop") });
    const verdict = checkGateRecord(record, FINGERPRINT);
    expect(verdict.substance.pass, "the gate's own reader has no rule about this").toBe(true);
    expect(verdict.harness.pass).toBe(false);
    expect(verdict.harness.reasons.join("; ")).toMatch(new RegExp(`phone window:arrival:0: 0 of ${INP_MIN_OK_TRIALS.window} valid B trials landed inside the arrival phase \\(needs ${INP_MIN_IN_PHASE_TRIALS}\\)`));
    expect(harnessRules(record).reasons.length).toBe(1);
  });

  test("a complete record satisfies the harness's own rule as well as the gate's", () => {
    expect(harnessRules(complete()).reasons).toEqual([]);
  });

  /*
   * A WINDOW CELL STATES WHAT IT SAMPLED, not only what it intended: without
   * the tolerance and the achieved offset in the record, a cell that landed
   * 20 ms into a 37 ms phase cannot be told from one that landed at its start.
   */
  test("a window cell carries the tolerance its trials were held to, and the offset they achieved", () => {
    const cells = cellsOf(rowsForProfile("phone"));
    const cell = cells.find((c) => c.id === "window:layout:60")!;
    expect((cell as unknown as Record<string, unknown>).offsetToleranceMs).toBe(OFFSET_TOLERANCE_MS);
    expect((cell as unknown as Record<string, unknown>).offsetAchievedMedianMs).toBe(60);
    expect((cell as unknown as Record<string, unknown>).inPhaseTrials).toBe(INP_MIN_OK_TRIALS.window);
  });

  test("the self-check reports what is short, not just that the run was a smoke", () => {
    const thin = rowsForProfile("phone").filter((r, i, all) => all.findIndex((o) => cellIdFor(o) === cellIdFor(r) && o.build === r.build) === i);
    const verdict = checkGateRecord(recordFrom({ phone: thin, desktop: rowsForProfile("desktop") }, FINGERPRINT, true), FINGERPRINT);
    expect(verdict.write, "a smoke record reads as the schema, so it is written").toBe(true);
    expect(verdict.substance.reasons.join("; ")).toMatch(/has 1 ok B trial \(needs 10\)/);
    expect(verdict.substance.reasons.join("; ")).not.toMatch(/smoke run/);
  });
});
