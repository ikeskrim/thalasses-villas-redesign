/**
 * THE SHARED-IMAGE MORPH, villa card → villa page, on the browser's own API.
 *
 * `document.startViewTransition` snapshots the old document, runs a callback,
 * and animates old against new once the callback's promise settles. In the App
 * Router the difficulty is the promise: the router commits the new page inside
 * a React transition, and nothing tells the browser when that has happened.
 * `RouteTransition.tsx` records that `experimental.viewTransition` — the flag
 * that would wire this up — does not exist in this Next version.
 *
 * So the hand-off is done by hand, in one small handle:
 *
 *   - the CARD, on click, starts the transition and returns `whenCommitted()`,
 *     a promise that resolves when the destination says so, or after a bounded
 *     wait so a slow route can never freeze the page under a frozen snapshot;
 *   - the DESTINATION mounts `ViewTransitionTarget`, which names its hero image
 *     `villa-hero` — the same name the card gave its photograph — and resolves.
 *
 * The browser then morphs the one named element between its two rectangles and
 * cross-fades everything else. Both elements are real `<img>`s already on the
 * page; nothing is cloned, nothing is measured, and no layout property moves.
 *
 * With no `startViewTransition` (Firefox at the time of writing) the link is a
 * plain client-side navigation and the existing route wipe plays instead.
 */

let resolveCommit: (() => void) | null = null;

/** The destination has mounted and named its hero. */
export function markCommitted(): void {
  resolveCommit?.();
  resolveCommit = null;
}

/** Resolves on `markCommitted()`, or after `ms` regardless. */
export function whenCommitted(ms = 1200): Promise<void> {
  return new Promise<void>((resolve) => {
    resolveCommit = resolve;
    window.setTimeout(resolve, ms);
  });
}

/** True while a villa morph is in flight — the route wipe stands down. */
export function isMorphing(): boolean {
  return document.documentElement.hasAttribute("data-vt");
}

/*
 * The name must come off BOTH ends when the morph finishes. The card clears
 * its own on `finished`; the destination cannot see that promise, so it
 * registers here and the card calls `finish()` for it. A transition name left
 * on the hero would make the NEXT navigation away from the villa page try to
 * morph a hero that has no partner.
 */
let finishers: (() => void)[] = [];

export function onFinished(cb: () => void): void {
  finishers.push(cb);
}

export function finish(): void {
  const run = finishers;
  finishers = [];
  for (const f of run) f();
}

export const VT_NAME = "villa-hero";
