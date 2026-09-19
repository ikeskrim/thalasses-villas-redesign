/**
 * THE `estate3d:*` PERFORMANCE MARK NAMES — one place, shared by the page that
 * emits them and the INP harness that measures against them (D-033; the
 * runtime stage's open issue 3).
 *
 * WHY THIS FILE EXISTS. The INP record's eight window families are keyed to
 * these marks: a window cell fires its input a fixed offset after one of them,
 * so the trial measures the latency of a tap that landed inside a named phase
 * of the load. While the names were string literals in `estate-map-3d-gate.ts`
 * and `EstateMap3D.tsx` and again in the harness, a rename in one of them would
 * have left the harness waiting for an anchor that never arrives: every window
 * trial invalid, the record short, and nothing to say why. Now there is one
 * spelling, and `tests/estate-inp-record.spec.ts` keeps it that way (in its
 * "the estate3d:* mark names live in one place" block):
 *  - no `src/components/sections` file but this one may contain the literal
 *    `estate3d:` (so a name cannot be reintroduced inline);
 *  - `WINDOW_ANCHOR` must cover exactly the gate's eight window families, and
 *    every anchor it names must be one of `ESTATE3D_MARK`'s values;
 *  - the review build must actually emit every mark in `ESTATE3D_MARK_ORDER`,
 *    in that order (`tests/estate-3d-preview.spec.ts`).
 * The harness adds a fourth check at run time: its pin run refuses to measure a
 * family whose anchor mark the page did not emit, and names the mark.
 *
 * NODE-IMPORTABLE AND CLIENT-SAFE ON PURPOSE. `scripts/estate-inp.mjs` imports
 * this file through Node's type stripping and both client components import it
 * in the browser, so it holds no imports at all, no `node:` built-ins, no path
 * aliases and nothing but erasable TypeScript.
 *
 * IN THE FINGERPRINT. The name begins with `estate-map`, so this file is one of
 * the mount-path sources `estate3dFingerprint` hashes (D-033). That is
 * deliberate: the mark names decide what the record measured, and a record
 * taken against one set of phase names does not describe a tree with another.
 */

/** The `estate3d:` prefix, so a reader of the page's marks can find them all. */
export const ESTATE3D_MARK_PREFIX = "estate3d:";

/**
 * Every mark the load path emits, by phase. The loader
 * (`estate-map-3d-gate.ts`) emits `trigger` … `importEnd`; the build
 * (`EstateMap3D.tsx`) emits `renderer` … `shown`.
 *
 * Each of `renderer`, `scene`, `compile`, `layout` and `swap` is written at the
 * START of the task that does that step's work, immediately after a yield — the
 * harness depends on that placement, because an input fired at `mark + offset`
 * is meant to land inside the step, not after it.
 */
export const ESTATE3D_MARK = {
  /** The reader's first completed interaction: the load may begin. */
  trigger: "estate3d:trigger",
  /** The idle callback (or its fallback timer) after the quiet period. */
  idle: "estate3d:idle",
  /** Before the WebGL2 probe. */
  probe: "estate3d:probe",
  /** The dynamic `import()` of the diagram, which pulls the three.js chunk. */
  importStart: "estate3d:import-start",
  /** That import resolved: the chunk is fetched and evaluated. */
  importEnd: "estate3d:import-end",
  /** Step 1: the WebGL renderer and its canvas. */
  renderer: "estate3d:renderer",
  /** Step 2: the tokens read from the page, then the scene in slices. */
  scene: "estate3d:scene",
  /** Step 3: the shader programs, one new program per task. */
  compile: "estate3d:compile",
  /** Step 3's outcome: whether `KHR_parallel_shader_compile` was there, and how many programs. */
  compiled: "estate3d:compiled",
  /** Step 4: one read pass, then the label search, one solve order per task. */
  layout: "estate3d:layout",
  /** Step 5: the write-only task that draws the first frame and places the labels. */
  swap: "estate3d:swap",
  /** The diagram became the visible frame. */
  shown: "estate3d:shown",
} as const;

export type Estate3DMarkPhase = keyof typeof ESTATE3D_MARK;
export type Estate3DMarkName = (typeof ESTATE3D_MARK)[Estate3DMarkPhase];

/**
 * The order the phases must occur in, which
 * `tests/estate-3d-preview.spec.ts` asserts against the running review build.
 */
export const ESTATE3D_MARK_ORDER = [
  "trigger",
  "idle",
  "probe",
  "importStart",
  "importEnd",
  "renderer",
  "scene",
  "compile",
  "compiled",
  "layout",
  "swap",
  "shown",
] as const satisfies readonly Estate3DMarkPhase[];

/**
 * WHERE EACH OF THE GATE'S EIGHT WINDOW FAMILIES TAKES ITS ANCHOR
 * (`INP_WINDOW_FAMILIES` in `src/lib/estate-plan-gate.ts`, which this must
 * cover exactly — a test asserts it).
 *
 * `null` means the anchor is not a page mark but a network event for the
 * three.js chunk, observed over CDP in the browser process rather than in the
 * page: `request` is `Network.requestWillBeSent` and `arrival` is
 * `Network.loadingFinished`. Those two cannot be marks, because the point of
 * them is to sample the window in which the page's own main thread is about to
 * be taken by one V8 task (the chunk's evaluation) that no yield can enter, and
 * a page that is about to be blocked cannot be relied on to report anything.
 */
export const WINDOW_ANCHOR = {
  trigger: ESTATE3D_MARK.trigger,
  request: null,
  arrival: null,
  renderer: ESTATE3D_MARK.renderer,
  scene: ESTATE3D_MARK.scene,
  compile: ESTATE3D_MARK.compile,
  layout: ESTATE3D_MARK.layout,
  swap: ESTATE3D_MARK.swap,
} as const;

export type InpWindowAnchor = keyof typeof WINDOW_ANCHOR;

/** The mark names the harness must see the page emit before it measures a mark-keyed family. */
export const WINDOW_ANCHOR_MARKS: readonly Estate3DMarkName[] = Object.values<Estate3DMarkName | null>(WINDOW_ANCHOR).filter(
  (name): name is Estate3DMarkName => name !== null
);
