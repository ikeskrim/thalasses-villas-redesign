/* Types for the pure helpers tests/estate-inp-record.spec.ts imports (the precedent is scripts/ingest-drive.d.mts). */
import type { InpArm, InpCell, InpCellKind, InpGateRecord, InpProfileName, InpTrial, InpWindowFamily } from "../src/lib/estate-plan-gate";
import type { Estate3DMarkName } from "../src/components/sections/estate-map-3d-marks";

/** A measured row, as the harness's trial functions return it. Only the fields the record is built from are typed. */
export interface InpRow {
  kind: InpCellKind;
  profile: InpProfileName;
  build: InpArm;
  status: "ok" | "n/a" | "invalid" | "lost" | "error";
  scenario?: string;
  family?: InpWindowFamily;
  offset?: number;
  inp?: number | null;
  dispatched?: number;
  interactionCountDelta?: number | null;
  fetched?: boolean | null;
  reason?: string;
  [extra: string]: unknown;
}

export const FIXED_SCENARIOS: string[];
export const DEFAULT_OFFSETS: Record<InpWindowFamily, number[]>;
export const DEFAULT_OFFSET_PHASE_MS: Record<InpWindowFamily, [number, number]>;
export const OFFSET_TOLERANCE_MS: number;
export const INP_MIN_IN_PHASE_TRIALS: number;
export const INP_TRIGGER_TARGET: string;
export const CONTROL_CLASSES: string[];
export const WINDOW_ANCHOR: Record<InpWindowFamily, Estate3DMarkName | null>;
export const INP_MIN_OK_TRIALS: Readonly<Record<InpCellKind, number>>;
export const INP_MIN_WINDOW_OFFSETS: number;
export const INP_WINDOW_FAMILIES: readonly InpWindowFamily[];
export const INP_PROFILES: readonly InpProfileName[];
export const INP_CONTROL_CELL: string;
export const INP_TRIGGER_CELL: string;
export const INP_FIXED_CELLS: readonly string[];
export const INP_GATE_SCHEMA: string;
export const INP_ARMS: readonly InpArm[];

export function isTriggerTarget(target: unknown): boolean;
export function hitAControl(target: unknown): boolean;
export function phaseEndMarkOf(family: string): Estate3DMarkName | null;
export function derivedOffsets(
  pin: unknown,
  fallback?: Record<string, number[]>
): { offsets: Record<InpWindowFamily, number[]>; phases: Record<InpWindowFamily, number | null>; fellBack: InpWindowFamily[] };
export function cellIdFor(row: Partial<InpRow>): string;
export function recordStatus(status: string): InpTrial["status"];
export function under16Of(row: Partial<InpRow>): { under16: boolean; invalid: string | null };
export function trialOf(row: InpRow): InpTrial & Record<string, unknown>;
export function cellsOf(rows: InpRow[]): InpCell[];
export function buildGateRecord(input: {
  generatedAt: string;
  commit: string;
  smoke: boolean;
  fingerprint: string;
  builds: InpGateRecord["builds"];
  profiles: Record<string, { calibration: unknown; features: unknown; rows: InpRow[] }>;
}): InpGateRecord;
export function shapeProbe(record: InpGateRecord): unknown;
export function harnessRules(record: InpGateRecord): { pass: boolean; reasons: string[] };
export function checkGateRecord(
  record: InpGateRecord,
  fingerprint: string
): {
  write: boolean;
  smoke: boolean;
  shape: { pass: boolean; reasons: string[] };
  substance: { pass: boolean; reasons: string[] };
  asWritten: { pass: boolean; reasons: string[] };
  harness: { pass: boolean; reasons: string[] };
};
export function plannedCells(offsets: Record<string, number[]>): Partial<InpRow>[];
