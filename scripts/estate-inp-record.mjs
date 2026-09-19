/**
 * THE GATE'S RECORD, BUILT AND CHECKED — the part of `scripts/estate-inp.mjs`
 * that turns measured trial rows into `qa/perf/INP-estate3d-gate.json`
 * (schema `estate3d-inp-gate/1`, D-033) and then refuses to write a record its
 * own reader would reject.
 *
 * WHY IT IS A MODULE OF ITS OWN, NOT PART OF THE HARNESS. Everything here is
 * pure: rows in, record out, no browser, no clock, no file system. So
 * `tests/estate-inp-record.spec.ts` can drive every rule — the cell ids, the
 * status vocabulary, the under-16 confirmation, the self-check's verdicts —
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
 * THE SELF-CHECK HAS THREE VERDICTS AND A FOURTH OPINION, AND THE DIFFERENCES
 * MATTER.
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
 *  - AS WRITTEN, from the record exactly as the file will hold it, `smoke` and
 *    all. SUBSTANCE is computed with `smoke` forced false so that a smoke run
 *    still reports WHAT is short instead of hiding behind "smoke run" — but
 *    while the acceptance claim came from that same cleared copy, a run that
 *    wrote `smoke: true` announced "the gate's own reader accepts this record"
 *    and exited 0 over a record the gate rejects outright. The claim and the
 *    exit code follow this verdict; the reasons come from SUBSTANCE.
 *  - THE HARNESS'S OWN RULE (`harnessRules`), which is NOT the gate's and is
 *    never mixed into the reader's reasons: a window cell must have CAUGHT the
 *    phase its id names. See that function for why it is not in the gate.
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
import { ESTATE3D_MARK, ESTATE3D_MARK_ORDER, WINDOW_ANCHOR } from "../src/components/sections/estate-map-3d-marks.ts";

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

/**
 * THE TRIGGER'S TARGET, AND HOW A TRIAL'S TWO INPUTS ARE TOLD APART.
 *
 * A window trial dispatches two inputs: the trigger, on a list number, and the
 * measured one, inside the frame. The harness separates them by the Event
 * Timing target the in-page recorder spells, so the selector and the matcher
 * live here — importable by the spec, which cannot import the harness itself
 * (`scripts/estate-inp.mjs` measures as soon as it is loaded).
 *
 * The recorder spells a target as `tag[#id][.class…]` with EVERY class, not the
 * first two: while it kept two, `.estate-map-list-index` was recognised only
 * because `<span className="tabular estate-map-list-index">` happens to carry
 * exactly two. One more class on that span and the trigger would have been read
 * as the measured interaction, and in a trial where the measured tap left no
 * entry the TRIGGER's latency would have become the window cell's figure.
 */
export const INP_TRIGGER_TARGET = ".estate-map-list-index";

/** Whether an Event Timing target string names the trigger's own element. */
export function isTriggerTarget(target) {
  if (typeof target !== "string" || !target) return false;
  return target
    .split(".")
    .slice(1)
    .includes(INP_TRIGGER_TARGET.slice(1));
}

/**
 * Whether an Event Timing target string names a link or a button — a tap that
 * did work of its own rather than landing on an empty part of the frame.
 *
 * A window trial checks its point against `elementFromPoint` before the
 * trigger, while the page still shows the 2D photograph. In the `swap` family,
 * and at late `layout` offsets, the same coordinates can be over a
 * `.estate-map-3d-button` by the time the input is fired, and the cell would
 * then measure a tap that opens a card. This reads what the input ACTUALLY hit,
 * out of the entry the figure came from.
 */
export const CONTROL_CLASSES = ["estate-map-3d-button", "estate-map-marker"];
export function hitAControl(target) {
  if (typeof target !== "string" || !target) return false;
  const tag = target.split(/[.#]/)[0];
  if (tag === "a" || tag === "button") return true;
  const classes = target.split(".").slice(1);
  return CONTROL_CLASSES.some((c) => classes.includes(c));
}

/** The five fixed scenario names, as the gate spells the cells: "fixed:place-open" → "place-open". */
export const FIXED_SCENARIOS = INP_FIXED_CELLS.map((id) => id.slice("fixed:".length));

/**
 * WHERE EACH WINDOW FAMILY IS PROBED, AND WHY THOSE OFFSETS — the FALLBACK
 * defaults, used only when the profile's own pin run could not measure a phase
 * (`--offsets family=a,b[,c]` overrides either). They were chosen from the
 * phase deltas the runtime stage measured on the phone-4× profile (three runs,
 * ms):
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
 *
 * THIS TABLE IS THE PHONE'S, AND IT IS NO LONGER USED AS THE DESKTOP'S.
 * Every figure above is phone-4×. On the unthrottled desktop the same phases
 * are five to ten times shorter (ESTATE3D-runtime-tranche14.md §1), so at 2×
 * CPU `scene→compile` is about 14–15 ms against an offset of 20, `layout→swap`
 * about 42–48 against an offset of 60, and `swap→shown` about 18–21 against an
 * offset of 20: four of the eight families would have sampled a LATER phase, or
 * an idle page, while the cell id still said otherwise. `derivedOffsets` below
 * now takes each profile's offsets from that profile's own pin run, and this
 * table is what a family falls back to when the pin could not measure it.
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

/**
 * THE PHASE EACH FAMILY IS NAMED FOR, in the phone-4× deltas the table above
 * cites (`request` from the pin runs D-036 records: 870 ms on the phone,
 * 175 ms on the throttled desktop). Nothing at run time reads this — it exists
 * so `tests/estate-inp-record.spec.ts` can pin the INTENT of each fallback
 * pair, not merely that there are two of them: mutation M5 caught a family
 * dropped to one offset, and nothing caught `arrival: [0, 50]` becoming
 * `[0, 1]`, which would have removed the deliberate straddle of the chunk's
 * 83–168 ms evaluation that D-033 names as the leading risk.
 */
export const DEFAULT_OFFSET_PHASE_MS = {
  trigger: [1013, 1019],
  request: [175, 870],
  arrival: [83, 168],
  renderer: [37, 42],
  scene: [42, 48],
  compile: [51, 71],
  layout: [105, 135],
  swap: [38, 44],
};

/**
 * HOW CLOSE A TRIAL MUST LAND TO THE OFFSET ITS CELL ID DECLARES.
 *
 * A window trial sleeps until `anchor + offset` and fires. Before this was
 * checked, nothing anywhere compared where it LANDED with where it was aimed,
 * and the error was one-directional: the anchor was the moment the harness
 * HEARD about the phase (a console message or a CDP event), never the instant
 * it happened, so every trial fired late by the signal's delivery latency —
 * 1–15 ms by the harness's own measurement. Later means waiting for less of
 * the phase, so the bias flattered exactly the cells that decide the gate.
 *
 * The harness now subtracts the measured latency (see `anchorSignalLatencyMs`
 * on every row) and a trial that still lands further than this from its
 * declared offset is recorded INVALID with the reason, rather than counted as
 * a figure for a window it did not sample. 20 ms is larger than the residual a
 * corrected signal leaves and smaller than the shortest phase any fallback pair
 * straddles (`renderer→scene`, 37 ms on the phone).
 */
export const OFFSET_TOLERANCE_MS = 20;

/** The fewest of a window cell's valid B trials that must have landed inside the phase the cell is named for. */
export const INP_MIN_IN_PHASE_TRIALS = 10;

/**
 * WHERE EACH FAMILY'S PHASE ENDS, derived rather than declared: for a
 * mark-keyed family it is the mark that FOLLOWS its anchor in
 * `ESTATE3D_MARK_ORDER`, so the phase boundaries cannot drift away from the
 * mark names without the order test noticing. `request` ends when the chunk's
 * last byte arrives (Resource Timing, not a mark), and `arrival` ends at
 * `estate3d:import-end`, which is the end of the evaluation it exists to
 * sample.
 */
export function phaseEndMarkOf(family) {
  if (family === "request") return null;
  if (family === "arrival") return ESTATE3D_MARK.importEnd;
  const anchor = WINDOW_ANCHOR[family];
  if (!anchor) return null;
  const phase = ESTATE3D_MARK_ORDER.find((p) => ESTATE3D_MARK[p] === anchor);
  const next = ESTATE3D_MARK_ORDER[ESTATE3D_MARK_ORDER.indexOf(phase) + 1];
  return next ? ESTATE3D_MARK[next] : null;
}

/**
 * THE OFFSETS FOR ONE PROFILE, FROM THAT PROFILE'S OWN PIN RUN.
 *
 * The pin run already reads every mark's page time and the chunk's Resource
 * Timing, so it already knows how long each phase lasted ON THIS PROFILE. Each
 * family is then probed at 0 (an input that waits for the whole of the step
 * that has just begun) and at about half the measured phase (an input inside
 * it) — whole milliseconds, because the gate spells a window cell's id from
 * `offsetMs` by template and an id that disagrees with its offset is a cell it
 * refuses.
 *
 * A family whose phase the pin could not measure keeps its fallback pair, and
 * the reason is reported so the record's reader can see which cells were
 * derived and which were assumed.
 */
export function derivedOffsets(pin, fallback = DEFAULT_OFFSETS) {
  const offsets = {};
  const phases = {};
  const fellBack = [];
  const marks = pin?.marks ?? {};
  const at = (name) => (typeof marks[name] === "number" ? marks[name] : null);
  for (const family of INP_WINDOW_FAMILIES) {
    let start = null;
    let end = null;
    if (family === "request") {
      start = typeof pin?.resource?.startMs === "number" ? pin.resource.startMs : null;
      end = typeof pin?.resource?.responseEndMs === "number" ? pin.resource.responseEndMs : null;
    } else if (family === "arrival") {
      start = typeof pin?.resource?.responseEndMs === "number" ? pin.resource.responseEndMs : null;
      end = at(ESTATE3D_MARK.importEnd);
    } else {
      start = at(WINDOW_ANCHOR[family]);
      end = at(phaseEndMarkOf(family));
    }
    const phase = start === null || end === null ? null : Math.round(end - start);
    phases[family] = phase;
    const second = phase === null ? null : Math.max(1, Math.round(phase / 2));
    if (second === null) {
      fellBack.push(family);
      offsets[family] = [...(fallback[family] ?? [])];
    } else {
      offsets[family] = [0, second];
    }
  }
  return { offsets, phases, fellBack };
}

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
    /*
     * A control dispatches nothing, so it has no entry by construction and is
     * recorded under16 with a null inpMs (the gate reads it as the format's
     * rule requires). A control that DID record an interaction is not that: it
     * is D-033 requirement 4 failing, and it must not be written as a passing
     * control just because its kind is "control".
     */
    if (row.inp !== null && row.inp !== undefined) return { under16: false, invalid: `a control trial recorded an interaction of ${row.inp} ms` };
    return { under16: true, invalid: null };
  }
  if (row.inp !== null && row.inp !== undefined) return { under16: false, invalid: null };
  const dispatched = typeof row.dispatched === "number" ? row.dispatched : 0;
  /* Without this, a non-control row that dispatched nothing is rescued as under-16 on an interactionCountDelta of 0: a pass invented out of a missing measurement. */
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
    /* The stricter reading of inpMs ("the WORST interaction in that page view") can be applied to a committed record without measuring again ONLY while these two travel with the row. */
    pageWorstMs: row.pageWorst ?? null,
    triggerInpMs: row.triggerInp ?? null,
    offsetRequestedMs: row.offset ?? null,
    offsetAchievedMs: row.offsetAchieved ?? null,
    offsetSentMs: row.offsetSent ?? null,
    offsetToleranceMs: row.kind === "window" ? OFFSET_TOLERANCE_MS : null,
    anchorSignalLatencyMs: row.anchorSignalLatency ?? null,
    anchor: row.anchor ?? null,
    anchorPageMs: row.anchorPageMs ?? null,
    /* What the cell claims to have sampled, so the record can be audited on it: the phase's end mark, its page time, its length, and whether this trial's input landed inside it. */
    phaseEndMark: row.phaseEndMark ?? null,
    phaseEndPageMs: row.phaseEndPageMs ?? null,
    phaseMs: row.phaseMs ?? null,
    inPhase: row.inPhase ?? null,
    inPhaseFrom: row.inPhaseFrom ?? null,
    traced: row.traced ?? null,
    measuredTarget: row.measuredTarget ?? null,
    class: row.class ?? null,
    classWindow: row.classWindow ?? null,
    worst: row.worst ?? null,
  };
  for (const [k, v] of Object.entries(extras)) if (v !== null) trial[k] = v;
  return trial;
}

const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

/**
 * The cells a set of rows declares, in a stable order, each with the arms it
 * was measured on.
 *
 * A WINDOW CELL ALSO STATES WHAT IT SAMPLED, not only what it intended: the
 * tolerance its trials were held to, the median offset its valid B trials
 * ACHIEVED, the length of the phase its name claims, and how many of those
 * trials landed inside it. Without those a reader of the record cannot tell a
 * cell that caught its phase from one whose twenty taps all missed it — and
 * twenty fast taps on an idle page read exactly like twenty fast taps on a busy
 * one.
 */
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
  for (const cell of byId.values()) {
    if (cell.kind !== "window") continue;
    const valid = rows.filter((r) => cellIdFor(r) === cell.id && r.build === "B" && r.status === "ok");
    cell.offsetToleranceMs = OFFSET_TOLERANCE_MS;
    cell.offsetAchievedMedianMs = median(valid.map((r) => r.offsetAchieved).filter((v) => typeof v === "number"));
    cell.phaseMs = median(valid.map((r) => r.phaseMs).filter((v) => typeof v === "number"));
    cell.inPhaseTrials = valid.filter((r) => r.inPhase === true).length;
  }
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
 *  - a control row's `fetched` becomes false for ANY value the schema accepts —
 *    null (a control the harness could not confirm) and true alike; a `fetched`
 *    that is neither a boolean nor null stays. `true` is the D-035 regression
 *    the control cell exists to catch, and it is the worst possible outcome to
 *    misfile: while only null was normalised, a review build that fetched
 *    three.js on a page nobody touched came out as a SHAPE failure, so the
 *    record was NOT WRITTEN, the exit code was 2 ("the harness is buggy") and
 *    the substance reasons were never printed. It is a MEASUREMENT: the record
 *    is written, the exit code is 1, and every reason is printed;
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
      if (kindOf.get(row.cell) === "control" && (row.fetched === null || typeof row.fetched === "boolean")) row.fetched = false;
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
 * THE HARNESS'S OWN RULES, WHICH ARE NOT THE GATE'S — and which are reported
 * as such, never mixed into the reader's reasons.
 *
 * The gate counts a window cell's ok B trials and checks each one against
 * 200 ms. It never asks whether the cell CAUGHT the phase it is named for, and
 * it cannot: a trial whose input landed after the phase is twenty fast taps on
 * an idle page, and reads exactly like twenty fast taps on a busy one. Making
 * that a gate rule would change D-033's record format and is a decision, not a
 * fix; making it a harness rule is not — the record is still written, the gate
 * still decides, and a cell that measured nothing shows up in the exit code
 * rather than only in a column nobody reads.
 */
export function harnessRules(record) {
  const reasons = [];
  for (const [name, p] of Object.entries(record?.profiles ?? {})) {
    const cells = Array.isArray(p?.cells) ? p.cells : [];
    const trials = Array.isArray(p?.trials) ? p.trials : [];
    for (const cell of cells) {
      if (cell?.kind !== "window") continue;
      const valid = trials.filter((t) => t?.cell === cell.id && t?.arm === "B" && t?.status === "ok");
      /* A cell short of the gate's own minimum is already the gate's complaint; saying it twice in different words helps nobody. */
      if (valid.length < INP_MIN_OK_TRIALS[cell.kind]) continue;
      const inPhase = valid.filter((t) => t?.inPhase === true).length;
      const unknown = valid.filter((t) => t?.inPhase === undefined).length;
      if (inPhase < INP_MIN_IN_PHASE_TRIALS) {
        reasons.push(
          `${name} ${cell.id}: ${inPhase} of ${valid.length} valid B trials landed inside the ${cell.family} phase (needs ${INP_MIN_IN_PHASE_TRIALS}${unknown ? `; ${unknown} could not be placed` : ""})`
        );
      }
    }
  }
  return { pass: reasons.length === 0, reasons };
}

/**
 * The harness's verdict on its own record, before it is written.
 *
 * `fingerprint` is the tree's, as `estate3dFingerprint` computes it — the same
 * value the record carries, so a mismatch here could only be a harness bug and
 * is reported as one.
 *
 * THREE VERDICTS, BECAUSE THEY ANSWER THREE DIFFERENT QUESTIONS.
 *  - `shape`: can the reader read this as the schema at all (the probe above)?
 *    A failure means the harness is buggy, and the record is not written.
 *  - `substance`: with `smoke` forced false, what does the reader complain
 *    about in the MEASUREMENT? A smoke run's own shortfalls are printed here
 *    instead of hiding behind "smoke run".
 *  - `asWritten`: the reader's verdict on the FILE, `smoke` and all. This is
 *    the one the harness may claim acceptance from and the one its exit code
 *    follows. While the acceptance claim came from the `smoke: false` copy, a
 *    run that wrote `smoke: true` printed "the gate's own reader accepts this
 *    record" and exited 0 over a record the gate rejects outright.
 */
export function checkGateRecord(record, fingerprint) {
  const substance = decideInpCondition({ record: { ...record, smoke: false }, fingerprint });
  const shape = decideInpCondition({ record: shapeProbe(record), fingerprint });
  const asWritten = decideInpCondition({ record, fingerprint });
  const harness = harnessRules(record);
  return {
    write: shape.pass,
    smoke: record?.smoke === true,
    shape: { pass: shape.pass, reasons: shape.reasons },
    substance: { pass: substance.pass, reasons: substance.reasons },
    asWritten: { pass: asWritten.pass, reasons: asWritten.reasons },
    harness,
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
