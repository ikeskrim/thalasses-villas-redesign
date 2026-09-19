/**
 * THE GATE'S RECORD, BUILT AND CHECKED — the part of `scripts/estate-inp.mjs`
 * that turns measured trial rows into `qa/perf/INP-estate3d-gate.json`
 * (schema `estate3d-inp-gate/1`, D-033) and then refuses to write a record its
 * own reader would reject.
 *
 * WHY IT IS A MODULE OF ITS OWN, NOT PART OF THE HARNESS. Everything here is
 * pure: rows in, record out, no browser, no clock, no file system. So
 * `tests/estate-inp-record.spec.ts` can drive every rule — the cell ids, the
 * status vocabulary, the under-16 confirmation, the self-check's two verdicts —
 * in milliseconds, and a mutation of any of them goes red at a named assertion
 * instead of after an hour of measurement. The harness is the only thing that
 * touches a browser; the rules live here.
 *
 * ONE READER, NOT A COPY OF IT. The rules the record must satisfy are not
 * restated here. `decideInpCondition` from `src/lib/estate-plan-gate.ts` — the
 * function the build and `check-estate-gate.mjs` use — is run against the
 * record the harness is about to write, so "the harness refuses to write a
 * record the gate would reject" is true by construction and cannot drift.
 *
 * THE SELF-CHECK HAS TWO VERDICTS, AND THE DIFFERENCE MATTERS.
 *  - SHAPE, from `shapeProbe`. Is this record READABLE as the schema: the
 *    declared cells complete, every id spelled as the gate spells it, every
 *    row's fields of the types the schema names, both profiles present,
 *    calibration passed, the fingerprint this tree's? Every one of those is
 *    the HARNESS's own doing and can only be wrong by being buggy, so a shape
 *    failure means the record is NOT written: a file the reader cannot parse is
 *    not evidence, and putting one in `qa/perf/` would leave the real complaint
 *    in a log nobody keeps.
 *  - SUBSTANCE, from the record exactly as written. Are there enough valid
 *    trials, and is every one of them under the bar? That is a MEASUREMENT: a
 *    smoke run's short counts, a cell that kept going invalid, a trial over
 *    200 ms, a trial that errored. The record IS written — a figure over the
 *    bar is evidence and is never withheld — and the harness exits non-zero
 *    naming every reason, so a shortfall is in its exit code and not only in
 *    the gate's later verdict.
 * Both verdicts are computed with `smoke` forced false and the tree's real
 * fingerprint, so a smoke run still reports its substantive shortfalls instead
 * of hiding behind "smoke run".
 */
import {
  INP_ARMS,
  INP_CONTROL_CELL,
  INP_FIXED_CELLS,
  INP_GATE_SCHEMA,
  INP_MIN_OK_TRIALS,
  INP_MIN_WINDOW_OFFSETS,
  INP_PROFILES,
  INP_STATUSES,
  INP_TRIGGER_CELL,
  INP_WINDOW_FAMILIES,
  decideInpCondition,
} from "../src/lib/estate-plan-gate.ts";
import { WINDOW_ANCHOR } from "../src/components/sections/estate-map-3d-marks.ts";

export {
  INP_ARMS,
  INP_CONTROL_CELL,
  INP_FIXED_CELLS,
  INP_GATE_SCHEMA,
  INP_MIN_OK_TRIALS,
  INP_MIN_WINDOW_OFFSETS,
  INP_PROFILES,
  INP_TRIGGER_CELL,
  INP_WINDOW_FAMILIES,
  WINDOW_ANCHOR,
};

/** The five fixed scenario names, as the gate spells the cells: "fixed:place-open" → "place-open". */
export const FIXED_SCENARIOS = INP_FIXED_CELLS.map((id) => id.slice("fixed:".length));

/**
 * WHERE EACH WINDOW FAMILY IS PROBED, AND WHY THOSE OFFSETS — build defaults,
 * overridable with `--offsets family=a,b[,c]`, chosen from the phase deltas the
 * runtime stage measured on the phone-4× profile (three runs, ms):
 *
 *   trigger→idle 1013–1019 | import-start→import-end 83–104 | →renderer 35–66
 *   renderer→scene 37–42   | scene→compile 42–48 | compile→compiled 51–71
 *   compiled→layout 12–14  | layout→swap 105–135 | swap→shown 38–44
 *
 * The gate requires at least two distinct offsets per family; each pair below
 * is chosen to sample the phase at its START (where an input waits for the
 * whole of the step that has just begun — the worst case, since each mark is
 * written at the top of its task) and again INSIDE it. D-033's arithmetic for
 * the measurement of record assumes two offsets per family; a third costs the
 * landing session 40 more valid trials per profile, which is its call to make.
 */
export const DEFAULT_OFFSETS = {
  /* 0: the tap arrives in the trigger's own task (its handler, and React's work from it). 500: mid quiet-second, when nothing at all should be running — a negative control inside the load sequence. */
  trigger: [0, 500],
  /* The chunk's request goes out and the bytes take 175 ms to arrive on the throttled desktop profile and seconds on the phone (562,640 B at 1.6 Mbps), so both offsets sit inside the download on BOTH profiles, where the main thread should be free. 0: as the request is queued, the import-start task possibly still finishing. 100: inside the download, clear of it. */
  request: [0, 100],
  /* THE LEADING RISK (D-033's own words): the chunk's evaluation is one V8 task of 83–168 ms that no yield can enter, and it starts when the bytes are in. 0: the input arrives immediately before that task, so it waits the whole of it — the worst case the record can produce. 50: inside it, so the pair straddles the evaluation deliberately rather than incidentally. */
  arrival: [0, 50],
  /* WebGLRenderer construction, 37–42 ms to the next mark. */
  renderer: [0, 20],
  /* The scene, element by element in slices of at most 8 ms: any offset in the chain should wait one slice, which is the point of measuring it. */
  scene: [0, 20],
  /* One shader program per task, 51–71 ms to `compiled`. */
  compile: [0, 30],
  /* One read pass, then the label search one solve order per task, then a write-only task: 105–135 ms in all, the longest phase. 0: the read pass (a forced layout). 60: mid label search. */
  layout: [0, 60],
  /* The write-only task that draws the first frame, 38–44 ms to `shown`. */
  swap: [0, 20],
};

/** "control" | "trigger" | "fixed" | "window" for a measured row. */
export const cellKindOf = (row) => row.kind;

/**
 * The cell id for a row, spelled exactly as `cellProblem` in the gate spells
 * it. Never build one of these by hand anywhere else.
 */
export function cellIdFor(row) {
  switch (row.kind) {
    case "control":
      return INP_CONTROL_CELL;
    case "trigger":
      return INP_TRIGGER_CELL;
    case "fixed":
      return `fixed:${row.scenario}`;
    case "window":
      return `window:${row.family}:${row.offset}`;
    default:
      throw new Error(`unknown trial kind ${JSON.stringify(row.kind ?? null)}`);
  }
}

/** The harness prints "n/a"; the record's vocabulary is the gate's, where it is "na". */
export function recordStatus(status) {
  const mapped = status === "n/a" ? "na" : status;
  if (!INP_STATUSES.includes(mapped)) throw new Error(`no record status for ${JSON.stringify(status ?? null)}`);
  return mapped;
}

/**
 * THE UNDER-16 RULE, in one place.
 *
 * D-033: "A trial with no Event Timing entry counts as under only when the
 * harness confirms it was under the 16 ms floor." The confirmation is the
 * browser's own `performance.interactionCount`: it must have risen by at least
 * as many interactions as the trial dispatched. No count (a browser without the
 * API) is not a confirmation, and neither is a count that did not rise — an
 * input the page never registered is not a fast input.
 *
 * Returns `{ under16, invalid }`: `invalid` is the reason the row cannot be an
 * "ok" row, or null.
 */
export function under16Of(row) {
  if (row.kind === "control") {
    /* A control dispatches nothing, so it has no entry by construction and is recorded under16 with a null inpMs (the gate reads it as the format's rule requires). */
    return { under16: true, invalid: null };
  }
  if (row.inp !== null && row.inp !== undefined) return { under16: false, invalid: null };
  const dispatched = typeof row.dispatched === "number" ? row.dispatched : 0;
  if (dispatched < 1) return { under16: false, invalid: "no interaction was dispatched" };
  if (typeof row.interactionCountDelta !== "number") {
    return { under16: false, invalid: "no Event Timing entry, and this browser has no interaction count to confirm the input landed" };
  }
  if (row.interactionCountDelta < dispatched) {
    return { under16: false, invalid: `no Event Timing entry, and the browser counted ${row.interactionCountDelta} of the ${dispatched} interaction(s) dispatched` };
  }
  return { under16: true, invalid: null };
}

/**
 * One record row per measured trial. Everything the gate reads is computed
 * here; everything else is carried through for the reader of the record (the
 * achieved offset, the trace class, the reason a trial is not ok), because a
 * record that cannot be argued with is not evidence.
 */
export function trialOf(row) {
  const { under16, invalid } = under16Of(row);
  const status = invalid && row.status === "ok" ? "invalid" : row.status;
  const trial = {
    cell: cellIdFor(row),
    arm: row.build,
    status: recordStatus(status),
    inpMs: row.inp === undefined ? null : row.inp,
    under16,
    fetched: row.fetched === undefined ? null : row.fetched,
  };
  if (invalid && row.status === "ok") trial.reason = invalid;
  else if (row.reason) trial.reason = row.reason;
  const extras = {
    profileMode: row.mode ?? null,
    dispatched: row.dispatched ?? null,
    recorded: row.recorded ?? null,
    interactionCountDelta: row.interactionCountDelta ?? null,
    pageWorstMs: row.pageWorst ?? null,
    offsetRequestedMs: row.offset ?? null,
    offsetAchievedMs: row.offsetAchieved ?? null,
    offsetSentMs: row.offsetSent ?? null,
    triggerInpMs: row.triggerInp ?? null,
    anchor: row.anchor ?? null,
    anchorPageMs: row.anchorPageMs ?? null,
    class: row.class ?? null,
    classWindow: row.classWindow ?? null,
    worst: row.worst ?? null,
  };
  for (const [k, v] of Object.entries(extras)) if (v !== null) trial[k] = v;
  return trial;
}

/** The cells a set of rows declares, in a stable order, each with the arms it was measured on. */
export function cellsOf(rows) {
  const order = [];
  const byId = new Map();
  for (const row of rows) {
    const id = cellIdFor(row);
    if (!byId.has(id)) {
      order.push(id);
      byId.set(id, {
        id,
        kind: row.kind,
        family: row.kind === "window" ? row.family : null,
        offsetMs: row.kind === "window" ? row.offset : null,
        arms: [],
      });
    }
    const cell = byId.get(id);
    if (!cell.arms.includes(row.build)) cell.arms.push(row.build);
  }
  /* The gate wants arms as ["A","B"] or ["B"], each arm once, and "B" present. */
  for (const cell of byId.values()) cell.arms.sort();
  return order.map((id) => byId.get(id));
}

/** The record, exactly as the gate's `InpGateRecord` describes it. */
export function buildGateRecord({ generatedAt, commit, smoke, fingerprint, builds, profiles }) {
  const record = {
    schema: INP_GATE_SCHEMA,
    generatedAt,
    commit,
    smoke,
    fingerprint,
    builds,
    profiles: {},
  };
  for (const [name, p] of Object.entries(profiles)) {
    record.profiles[name] = {
      calibration: p.calibration,
      features: p.features,
      cells: cellsOf(p.rows),
      trials: p.rows.map(trialOf),
    };
  }
  return record;
}

/**
 * THE SHAPE PROBE: the record with its MEASUREMENT normalised away and nothing
 * else touched, so that what the gate's reader still complains about is the
 * record's shape.
 *
 * THE RULE, in one sentence: a value the schema accepts is normalised to its
 * best case; a value the schema does not accept is left exactly as it is.
 *  - a status that is one of the gate's five words becomes "ok"; a status that
 *    is not (the harness printing "n/a" where the record's word is "na") stays,
 *    and the reader calls the row malformed;
 *  - an inpMs that is null or a number 0 or more becomes null with under16
 *    true — so a trial at 240 ms is a measurement, not a shape problem; an
 *    inpMs that is negative, a string or missing stays, and the reader calls
 *    the row malformed;
 *  - a control row's `fetched` becomes false when it is null (a control the
 *    harness could not confirm is a measurement gap); a `fetched` that is
 *    neither a boolean nor null stays;
 *  - every cell is topped up to its minimum count with synthetic passing rows,
 *    so a smoke run's short counts are a measurement and not a refusal.
 * What is left for the reader to reject: a cell never measured, a cell id or an
 * offset spelled other than the gate spells it, a profile the gate does not
 * read, a calibration that did not pass, a fingerprint that is not this tree's,
 * a row whose fields are not of the schema's types. Every one of those is the
 * harness's own doing, and none of them is a figure anyone measured.
 *
 * Never written anywhere: it exists only to be read by `decideInpCondition`.
 */
export function shapeProbe(record) {
  const probe = { ...record, smoke: false, profiles: {} };
  for (const [name, p] of Object.entries(record.profiles ?? {})) {
    const cells = Array.isArray(p?.cells) ? p.cells : [];
    const kindOf = new Map(cells.map((c) => [c?.id, c?.kind]));
    const counted = new Map();
    const trials = [];
    for (const t of Array.isArray(p?.trials) ? p.trials : []) {
      const row = { ...t };
      if (INP_STATUSES.includes(row.status)) row.status = "ok";
      if (row.inpMs === null || (typeof row.inpMs === "number" && Number.isFinite(row.inpMs) && row.inpMs >= 0)) {
        row.inpMs = null;
        row.under16 = true;
      }
      if (kindOf.get(row.cell) === "control" && row.fetched === null) row.fetched = false;
      if (row.arm === "B" && row.status === "ok") counted.set(row.cell, (counted.get(row.cell) ?? 0) + 1);
      trials.push(row);
    }
    for (const cell of cells) {
      const need = INP_MIN_OK_TRIALS[cell?.kind] ?? 0;
      for (let i = counted.get(cell?.id) ?? 0; i < need; i++) {
        trials.push({ cell: cell?.id, arm: "B", status: "ok", inpMs: null, under16: true, fetched: cell?.kind === "control" ? false : true });
      }
    }
    probe.profiles[name] = { ...p, trials };
  }
  return probe;
}
/**
 * The harness's verdict on its own record, before it is written.
 *
 * `fingerprint` is the tree's, as `estate3dFingerprint` computes it — the same
 * value the record carries, so a mismatch here could only be a harness bug and
 * is reported as one.
 */
export function checkGateRecord(record, fingerprint) {
  const asRecord = { record: { ...record, smoke: false }, fingerprint };
  const substance = decideInpCondition(asRecord);
  const shape = decideInpCondition({ record: shapeProbe(record), fingerprint });
  return {
    write: shape.pass,
    shape: { pass: shape.pass, reasons: shape.reasons },
    substance: { pass: substance.pass, reasons: substance.reasons },
  };
}

/**
 * The declared grid a complete run must cover, for the harness to plan its
 * trials from and for the notes to print: the control, the trigger, the five
 * fixed scenarios, and every family × offset.
 */
export function plannedCells(offsets) {
  const cells = [
    { kind: "control" },
    { kind: "trigger" },
    ...FIXED_SCENARIOS.map((scenario) => ({ kind: "fixed", scenario })),
  ];
  for (const family of INP_WINDOW_FAMILIES) {
    for (const offset of offsets[family] ?? []) cells.push({ kind: "window", family, offset });
  }
  return cells;
}
