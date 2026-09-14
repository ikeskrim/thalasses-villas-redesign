/**
 * THE ONE SCROLL-REVEAL OBSERVER — shared by every `Reveal` and `ImageReveal`.
 *
 * `src/components/motion/Reveal.tsx` explains what the reveal looks like and why
 * its hidden state is no longer in the server HTML (`DECISIONS.md` D-021). This
 * module is the mechanism, and it holds three rules.
 *
 *   1. ARM ONLY WHAT NOBODY HAS SEEN. When an element registers — at hydration,
 *      or at mount after a client navigation — it is hidden (`data-reveal=
 *      "armed"`) only if its top is at or below the REAL bottom edge of the
 *      viewport. Not the -12% band the entrance fires on: an element sitting in
 *      the bottom 12% of the first screen has already been painted and read, and
 *      hiding it would be the defect this replaces, one band lower. Anything
 *      else is left exactly as the server sent it — visible, with no entrance.
 *
 *   2. READ EVERY RECT, THEN WRITE. Registrations from one React commit are
 *      queued and decided together in a microtask: all the measurements first,
 *      then all the attribute writes. Sixty-six gallery frames interleaving
 *      reads and writes would be sixty-six forced layouts in the hydration task.
 *
 *   3. NOTHING A READER REACHES STAYS HIDDEN. An IntersectionObserver reports a
 *      change of state, so an element that jumps from below the viewport to
 *      above it between two frames — an anchor jump, a fast fling, a restored
 *      scroll — never reports at all. A sweep on idle (the same safety net
 *      `HotelMotion.tsx` carries for the same reason) reveals anything still
 *      armed whose top is above the viewport's bottom edge.
 *
 *      Scroll and resize are not the only things that bring an element into
 *      view. LAYOUT does too, with the page standing still: on a villa page
 *      the reader switches `Inventory` to a shorter group, or closes one of its
 *      descriptions, and `.d-includes` below it rises into the bottom tenth of
 *      the screen — inside the viewport, outside the entrance band, so the band
 *      observer never reports and no scroll event ever schedules the sweep.
 *      A second observer therefore watches every armed element against the
 *      REAL viewport (no margin) and only schedules the same idle sweep when
 *      one enters it, whatever moved it. It never reveals by itself — on an
 *      ordinary scroll that would fire at the bottom edge, ahead of the band,
 *      and change where the entrance happens.
 *
 * It fails soft. No IntersectionObserver, an element with no box (`display:
 * none` measures as top 0), a script that never runs: in every case nothing is
 * armed and the page is simply the server's page. The CSS that hides an armed
 * element lives in `direction-d.css` ("SCROLL REVEALS") and keys off the
 * attribute alone, so there is no inline style here for the `<noscript>`
 * override in `layout.tsx` to have to undo.
 */

export type RevealKind = "text" | "image";

/*
 * The entrance bands are the ones Framer was given before (`Reveal.tsx` at
 * 90bcd28): text enters 12% inside the viewport top and bottom, photographs 10%.
 */
const ROOT_MARGIN: Record<RevealKind, string> = {
  text: "-12% 0px -12% 0px",
  image: "-10% 0px",
};

/* How long the page must be still before the sweep runs — HotelMotion's figure. */
const IDLE_MS = 200;

const noop = () => {};

/** Every element currently hidden and waiting, with the band it waits on. */
const armed = new Map<Element, RevealKind>();
const observers: Partial<Record<RevealKind, IntersectionObserver>> = {};
/* Rule 3's second observer: the real viewport, no margin. See the header. */
let edge: IntersectionObserver | undefined;

let pending: { el: HTMLElement; kind: RevealKind }[] = [];
let flushQueued = false;
let listening = false;
let idleTimer = 0;

function observerFor(kind: RevealKind): IntersectionObserver {
  let io = observers[kind];
  if (!io) {
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) show(e.target);
      },
      { rootMargin: ROOT_MARGIN[kind] }
    );
    observers[kind] = io;
  }
  return io;
}

/*
 * Schedules, never reveals: the sweep still decides, by the same `top <
 * innerHeight` test, after the page has been still for IDLE_MS. Its first
 * report for a freshly armed element says "not intersecting" (or, for one whose
 * top sits exactly on the bottom edge, an edge-adjacent "intersecting" the
 * sweep then declines), so registering costs nothing.
 */
function edgeObserver(): IntersectionObserver {
  edge ??= new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) scheduleSweep();
  });
  return edge;
}

/** Stop watching an element on both observers. Does not touch its attribute. */
function unwatch(el: Element, kind: RevealKind) {
  armed.delete(el);
  observers[kind]?.unobserve(el);
  edge?.unobserve(el);
  if (!armed.size) stopSweep();
}

/** Once only: the element leaves the armed set and is never observed again. */
function show(el: Element) {
  const kind = armed.get(el);
  if (!kind) return;
  unwatch(el, kind);
  el.setAttribute("data-reveal", "in");
}

function watch(el: HTMLElement, kind: RevealKind) {
  armed.set(el, kind);
  observerFor(kind).observe(el);
  edgeObserver().observe(el);
  startSweep();
}

function sweep() {
  const bottom = window.innerHeight;
  /* Reads first, into a list; `show` writes. */
  const due: Element[] = [];
  for (const el of armed.keys()) if (el.getBoundingClientRect().top < bottom) due.push(el);
  for (const el of due) show(el);
}

/* Debounced: any scroll, resize or edge report restarts the idle wait. */
function scheduleSweep() {
  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(sweep, IDLE_MS);
}

/* Listeners exist only while something is armed; a page with nothing below the
   fold carries none at all. */
function startSweep() {
  if (listening) return;
  listening = true;
  window.addEventListener("scroll", scheduleSweep, { passive: true });
  window.addEventListener("resize", scheduleSweep, { passive: true });
}

function stopSweep() {
  if (!listening) return;
  listening = false;
  window.removeEventListener("scroll", scheduleSweep);
  window.removeEventListener("resize", scheduleSweep);
  window.clearTimeout(idleTimer);
}

function flush() {
  flushQueued = false;
  const batch = pending;
  pending = [];
  const bottom = window.innerHeight;

  /* Every read… */
  const below = batch.filter(
    ({ el }) =>
      el.isConnected && !el.hasAttribute("data-reveal") && el.getBoundingClientRect().top >= bottom
  );
  /* …then every write. */
  for (const { el, kind } of below) {
    el.setAttribute("data-reveal", "armed");
    watch(el, kind);
  }
}

function release(el: HTMLElement) {
  pending = pending.filter((p) => p.el !== el);
  const kind = armed.get(el);
  if (kind) unwatch(el, kind);
}

/**
 * Register an element. Returns its cleanup, which is what a React 19 ref
 * callback hands back to be run on unmount.
 *
 * Idempotent on purpose. Strict Mode attaches, detaches and re-attaches every
 * ref in development, and a detach deliberately leaves the attribute where it
 * is: an element re-registering as `armed` is simply watched again, and one
 * already `in` is left alone rather than measured and hidden a second time.
 */
export function observeReveal(el: HTMLElement, kind: RevealKind): () => void {
  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return noop;

  const state = el.getAttribute("data-reveal");
  if (state === "in") return noop;
  if (state === "armed") {
    watch(el, kind);
  } else {
    pending.push({ el, kind });
    if (!flushQueued) {
      flushQueued = true;
      queueMicrotask(flush);
    }
  }
  return () => release(el);
}
