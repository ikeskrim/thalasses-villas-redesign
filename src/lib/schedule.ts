/**
 * MAIN-THREAD SCHEDULING — idle, yield, delay and marks, for work that must
 * not stand between a reader and the page's response to a tap.
 *
 * Written for the deferred 3D estate map (DECISIONS.md D-028: "defer the
 * three.js load until idle and after first interaction, split the first-frame
 * work into yielding tasks"), after the pattern `HotelMotion` already uses
 * (`idle()` with a timeout and a timer fallback, a yield between stages).
 * `HotelMotion` keeps its own copies: moving it onto this module would tie the
 * 3D map's INP fingerprint (`src/lib/estate-3d-fingerprint.ts` hashes this
 * file) to a component that has nothing to do with the map.
 *
 * Browser-only at call time, import-safe anywhere: nothing here touches
 * `window` until a function is called.
 */

type SchedulerLike = { yield?: () => Promise<void> };

/** Whether the browser has `requestIdleCallback` (Safari has none by default). */
export const hasIdleCallback = (): boolean => typeof window !== "undefined" && typeof window.requestIdleCallback === "function";

/** Whether the browser has `scheduler.yield()` (Chromium 129+, Firefox 142+, not Safari). */
export const hasSchedulerYield = (): boolean =>
  typeof globalThis !== "undefined" && typeof (globalThis as { scheduler?: SchedulerLike }).scheduler?.yield === "function";

/**
 * Resolve on the next idle period, or after `timeout` ms if none comes. Where
 * `requestIdleCallback` does not exist, a `fallback` ms timer stands in for it.
 * Resolves with whether the callback came from the timeout rather than idle
 * time (always false on the fallback path, which cannot tell).
 */
export function idle(timeout = 2000, fallback = 200): Promise<{ timedOut: boolean }> {
  return new Promise((resolve) => {
    if (hasIdleCallback()) {
      window.requestIdleCallback((deadline) => resolve({ timedOut: deadline.didTimeout }), { timeout });
    } else {
      window.setTimeout(() => resolve({ timedOut: false }), fallback);
    }
  });
}

/*
 * One MessageChannel for every macrotask yield. `setTimeout(0)` is clamped to
 * 4 ms once timers nest five deep, which a chain of awaited yields reaches at
 * once; a posted message is not clamped.
 */
let channel: MessageChannel | null = null;
const waiting: (() => void)[] = [];
function postTask(resolve: () => void) {
  if (!channel) {
    channel = new MessageChannel();
    channel.port1.onmessage = () => waiting.shift()?.();
  }
  waiting.push(resolve);
  channel.port2.postMessage(null);
}

/**
 * Give the main thread back: end this task, so input and rendering can run,
 * and continue in a new one. `scheduler.yield()` where it exists (its
 * continuation goes ahead of other queued tasks of the same priority, but after
 * input), otherwise a posted message.
 */
export function yieldToMain(): Promise<void> {
  const scheduler = (globalThis as { scheduler?: SchedulerLike }).scheduler;
  if (typeof scheduler?.yield === "function") return scheduler.yield();
  return new Promise((resolve) => postTask(resolve));
}

/** Resolve after `ms` milliseconds (a timer task). */
export const delay = (ms: number): Promise<void> => new Promise((resolve) => window.setTimeout(resolve, ms));

/** Resolve at the start of the task after the next rendering frame. */
export const nextFrame = (): Promise<void> =>
  new Promise((resolve) => window.requestAnimationFrame(() => postTask(resolve)));

/**
 * `performance.mark(name, { detail })`, never throwing: a harness keys on these
 * names, and a missing User Timing API must not break the page.
 */
export function mark(name: string, detail?: Record<string, unknown>): void {
  try {
    performance.mark(name, detail === undefined ? undefined : { detail });
  } catch {
    /* No User Timing, or a detail it cannot clone: the mark is evidence, not behaviour. */
  }
}
