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
  FIXED_SCENARIOS,
  buildGateRecord,
  cellIdFor,
  cellsOf,
  checkGateRecord,
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
    for (const offset of DEFAULT_OFFSETS[family]) add({ kind: "window", family, offset }, INP_MIN_OK_TRIALS.window, (i) => (i % 5 === 0 ? null : 150 + i));
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
  test("the self-check reports what is short, not just that the run was a smoke", () => {
    const thin = rowsForProfile("phone").filter((r, i, all) => all.findIndex((o) => cellIdFor(o) === cellIdFor(r) && o.build === r.build) === i);
    const verdict = checkGateRecord(recordFrom({ phone: thin, desktop: rowsForProfile("desktop") }, FINGERPRINT, true), FINGERPRINT);
    expect(verdict.write, "a smoke record reads as the schema, so it is written").toBe(true);
    expect(verdict.substance.reasons.join("; ")).toMatch(/has 1 ok B trial \(needs 10\)/);
    expect(verdict.substance.reasons.join("; ")).not.toMatch(/smoke run/);
  });
});
