import type Lenis from "lenis";

/**
 * THE SHARED SCROLL HANDLE.
 *
 * One Lenis instance lives in the site shell. Anything that needs to read or
 * drive it — a scroll-linked footer, an anchor jump, a route change — asks
 * here rather than constructing a second one, because two smooth-scroll loops
 * on one document fight over the same frame and produce exactly the stutter the
 * library exists to remove.
 *
 * WHY A MODULE HANDLE RATHER THAN A CONTEXT. GSAP is a dependency of this
 * project but is used on **no page of the live site** — Framer Motion is the
 * motion library in play. Putting a provider (and therefore GSAP's
 * ScrollTrigger) at the root would add roughly 33 kB gzip to every page of a
 * site whose homepage already carries a long-task problem, to serve one
 * component at the very bottom of one route.
 *
 * So the handle is passive: the shell publishes its Lenis instance, and the one
 * component that wants ScrollTrigger imports GSAP itself, lazily, and attaches.
 * If that component never mounts, no GSAP is ever downloaded.
 */

type Listener = () => void;

let instance: Lenis | null = null;
const listeners = new Set<Listener>();

/** Called by the shell when Lenis starts or stops. */
export function setSmoothScroll(next: Lenis | null): void {
  instance = next;
  for (const l of listeners) l();
}

/** The live instance, or null when smooth scrolling is off — touch, or `reduce`. */
export function getSmoothScroll(): Lenis | null {
  return instance;
}

/**
 * Subscribe to the handle appearing or disappearing.
 *
 * Consumers mount before the shell's effect runs as often as not, so a
 * component that reads `getSmoothScroll()` once at mount would see `null` on a
 * page where smooth scrolling is perfectly available. This fires again when it
 * arrives.
 */
export function onSmoothScrollChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
