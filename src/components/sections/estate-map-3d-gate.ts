"use client";

import { startTransition, useCallback, useEffect, useRef, useState, type ComponentType, type RefObject } from "react";

import type { RenderPlan } from "@/lib/estate-plan-gate";
import { hasIdleCallback, hasSchedulerYield, idle, mark } from "@/lib/schedule";
import type { Hotspot } from "./EstateMap";

/**
 * What the diagram hands back once it is drawn and placed while hidden: a
 * function that makes it the visible frame, in the task that calls it.
 */
export type ShowDiagram = () => void;

export type Map3DProps = {
  plan: RenderPlan;
  hotspots: Hotspot[];
  onFail: () => void;
  onReady: (show: ShowDiagram) => void;
  /** True while the diagram is built behind the 2D frame: hidden, inert, and out of the accessibility tree. */
  staged: boolean;
};
type Map3D = ComponentType<Map3DProps>;

/**
 * The phase `EstateMap` exposes as `data-state` on its stage (tests and the INP
 * harness read it):
 *  - `2d`: the 2D map, and nothing requested (the gate hook is waiting, or
 *    will never start: reduced motion or Data Saver at load);
 *  - `preparing`: the WebGL2 probe passed and three.js was requested; the
 *    diagram is fetched and built hidden behind the 2D frame;
 *  - `ready`: the diagram is the frame;
 *  - `failed`: back to (or kept on) the 2D map for good.
 */
export type Estate3DPhase = "2d" | "preparing" | "ready" | "failed";

/** `navigator.connection` is not in TypeScript's DOM library (it is Chromium-only). */
type WithConnection = Navigator & { connection?: { saveData?: boolean } };

/**
 * How long nothing may happen before three.js is requested: no pointerdown,
 * keydown, wheel, touchmove or scroll. A build default (D-028 names "idle", not
 * a figure); it makes a collision with a reader's next gesture less likely, and
 * bounds nothing: only the yielding build does that.
 */
export const QUIET_MS = 1000;
/** `requestIdleCallback`'s timeout after the quiet period; without it an idle callback can wait for seconds. */
export const IDLE_TIMEOUT_MS = 2000;
/** Where `requestIdleCallback` does not exist (Safari): a short timer stands in for it. */
export const IDLE_FALLBACK_MS = 200;

const TRIGGERS = ["pointerup", "keydown"] as const;
const ACTIVITY = ["pointerdown", "keydown", "wheel", "touchmove", "scroll"] as const;
const LISTEN: AddEventListenerOptions = { capture: true, passive: true };

/**
 * WHETHER THIS READER GETS THE 3D DIAGRAM, AND WHEN — decided in the browser,
 * and only ever towards the 2D map when in doubt. The browser is asked only
 * after the server has said yes.
 *
 *  - The provenance and INP gate: first, and not the browser's call. The page
 *    passes a render plan only when the gate is open (DECISIONS.md D-021,
 *    D-028; `src/lib/estate-plan-gate.ts`). With `null` this hook registers
 *    nothing at all, so the public build with a closed gate is what it was.
 *  - Reduced motion: never. At load, or turned on at any point before the
 *    diagram is ready, the 2D map stays and nothing more is fetched; turned on
 *    after, the 2D map comes back for good (step B, B1).
 *  - Data saver: never, and three.js is not fetched (a step B build default).
 *
 * THE LOAD WAITS FOR THE READER, THEN FOR THE BROWSER (D-028: "defer the
 * three.js load until idle and after first interaction").
 *  1. A first interaction, page-wide: a completed tap or click (`pointerup`) or
 *     a key press, the interactions INP itself counts. Not `pointerdown` or
 *     `touchstart`, which a phone fires the moment a finger lands to scroll, and
 *     not scroll, wheel or touchmove: a reader who only scrolls never asked for
 *     anything. A touch that turns into a scroll ends in `pointercancel`, never
 *     `pointerup`. Passive capture listeners on `window`, removed after the
 *     first event.
 *  2. The section within 600 px of the viewport (an IntersectionObserver), so a
 *     reader who never reaches the map downloads nothing. Either may come first.
 *  3. Then a quiet period, `QUIET_MS` with no pointerdown, keydown, wheel,
 *     touchmove or scroll (each restarts it), so the fetch and the chunk's
 *     evaluation do not land in the middle of the gesture that follows a tap.
 *  4. Then idle time: `requestIdleCallback` with `IDLE_TIMEOUT_MS`, or a
 *     `IDLE_FALLBACK_MS` timer where it does not exist.
 *  5. Only then the WebGL2 probe (moved out of hydration; a device without
 *     WebGL2 still downloads nothing: three.js r163+ refuses WebGL1), and the
 *     `import()`.
 *
 * THE DIAGRAM IS BUILT HIDDEN AND SHOWN IN ONE TASK. `EstateMap` keeps the 2D
 * frame on screen while `EstateMap3D` builds behind it in yielding steps, and
 * the diagram calls `onReady` once it is drawn and placed. The swap then waits
 * while the reader is using the 2D map: a card open on it, focus inside it, or
 * a pointer down on it; it is retried at the next idle moment after any of
 * those can have ended. When it goes ahead, the stage's `data-state` and the
 * diagram's own attributes change in that same task, so the 2D frame leaves and
 * the diagram takes its box before the next frame is drawn, and React's commit
 * of the same phase follows as a transition.
 *
 * A FAILURE BEFORE THE SWAP IS SILENT. A probe without WebGL2, a chunk that
 * does not load, a renderer that cannot be created, a lost context, reduced
 * motion turned on, or the section unmounting: everything created is disposed,
 * the 2D map stays, focus is not moved (it was never inside the hidden
 * diagram) and nothing is logged.
 *
 * FOCUS SURVIVES THE SWAP BACK. After the swap, reduced motion turned on or a
 * lost context removes the diagram with whatever had focus in it. So `onFail`
 * notes which place had focus, and once the 2D map is rendered focus goes to
 * that place's 2D marker if it is shown, else its link in the numbered list,
 * else the section itself (named "The estate"), made focusable only for that
 * moment.
 *
 * Marks for the INP harness (`performance.mark`): `estate3d:trigger`,
 * `estate3d:idle`, `estate3d:probe`, `estate3d:import-start` and
 * `estate3d:import-end` here; the build's own marks are in `EstateMap3D`.
 */
export function useEstateMap3D(section: RefObject<HTMLElement | null>, stage: RefObject<HTMLElement | null>, plan: RenderPlan | null) {
  const [Map3D, setMap3D] = useState<Map3D | null>(null);
  const [phase, setPhase] = useState<Estate3DPhase>("2d");
  /* The phase as the DOM has it: the swap sets `ready` in its own task, before React commits it. */
  const shown = useRef(false);
  const failed = useRef(false);
  /* Stops the waits, listeners and pending callbacks of the load and the swap. */
  const stop = useRef<(() => void) | null>(null);
  /* What `onReady` does, set by the effect that owns the stage. */
  const ready = useRef<((show: ShowDiagram) => void) | null>(null);
  /* Set only when focus was inside the shown diagram as it failed: the place it was on, or null for none. */
  const refocus = useRef<{ place: string | null } | null>(null);

  const onFail = useCallback(() => {
    if (failed.current) return;
    failed.current = true;
    stop.current?.();
    const active = document.activeElement;
    if (shown.current && active?.closest(".estate-map-frame--3d")) {
      refocus.current = { place: active.closest("[data-place]")?.getAttribute("data-place") ?? null };
    }
    startTransition(() => {
      setMap3D(null);
      setPhase("failed");
    });
  }, []);

  const onReady = useCallback((show: ShowDiagram) => {
    if (failed.current || shown.current) return;
    ready.current?.(show);
  }, []);

  useEffect(() => {
    const pending = refocus.current;
    const el = section.current;
    if (Map3D || !pending || !el) return;
    refocus.current = null;
    const isShown = (n: HTMLElement | null): n is HTMLElement => !!n && n.getClientRects().length > 0;
    const key = pending.place ? CSS.escape(pending.place) : null;
    const marker = key ? el.querySelector<HTMLElement>(`[aria-controls="spot-${key}"]`) : null;
    const link = key ? el.querySelector<HTMLElement>(`[data-hotspot="${key}"] a[href]`) : null;
    if (isShown(marker)) return marker.focus({ preventScroll: true });
    if (isShown(link)) return link.focus({ preventScroll: true });
    el.setAttribute("tabindex", "-1");
    el.addEventListener("blur", () => el.removeAttribute("tabindex"), { once: true });
    el.focus({ preventScroll: true });
  }, [Map3D, section]);

  useEffect(() => {
    if (!plan) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;
    if ((navigator as WithConnection).connection?.saveData === true) return;
    const el = section.current;
    const box = stage.current;
    if (!el || !box) return;

    let stopped = false;
    let interacted = false;
    let inRange = false;
    let quietTimer = 0;
    let lastActivity = 0;
    const off: (() => void)[] = [];
    const listen = (target: EventTarget, type: string, fn: EventListener) => {
      target.addEventListener(type, fn, LISTEN);
      off.push(() => target.removeEventListener(type, fn, LISTEN));
    };
    const unlisten = (target: EventTarget, types: readonly string[], fn: EventListener) => {
      for (const t of types) target.removeEventListener(t, fn, LISTEN);
    };
    const halt = () => {
      if (stopped) return;
      stopped = true;
      window.clearTimeout(quietTimer);
      io.disconnect();
      for (const f of off.splice(0)) f();
    };
    stop.current = halt;

    /* Turned on at any point: the 2D map, whether or not anything was fetched or built. */
    const onMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches) onFail();
    };
    reduce.addEventListener("change", onMotionChange);

    /* ---- The swap ---------------------------------------------------------- */
    const frame2d = () => box.querySelector<HTMLElement>(":scope > .estate-map-frame:not(.estate-map-frame--3d)");
    /* A pointer down on the 2D frame holds the swap until it comes up. */
    let pointerOn2D = false;
    listen(box, "pointerdown", (e) => {
      const f = frame2d();
      if (f && e.target instanceof Node && f.contains(e.target)) pointerOn2D = true;
    });
    const pointerUp = () => {
      pointerOn2D = false;
    };
    listen(window, "pointerup", pointerUp);
    listen(window, "pointercancel", pointerUp);

    let show: ShowDiagram | null = null;
    let holding = false;
    const HOLD_ENDS = ["pointerup", "pointercancel", "click", "keyup", "focusout", "blur"] as const;
    /* Anything that can end the hold; then the next idle moment, and the swap is tried again. */
    const retry = () => {
      holding = false;
      unlisten(window, HOLD_ENDS, retry);
      void idle(IDLE_TIMEOUT_MS, IDLE_FALLBACK_MS).then(trySwap);
    };
    const trySwap = () => {
      if (stopped || !show || shown.current || failed.current) return;
      const f = frame2d();
      const held = !!f && (f.contains(document.activeElement) || !!f.querySelector(".estate-map-card:not([hidden])") || pointerOn2D);
      if (held) {
        if (holding) return;
        holding = true;
        for (const t of HOLD_ENDS) listen(window, t, retry);
        return;
      }
      const reveal = show;
      show = null;
      shown.current = true;
      /* One task: the stage shows the diagram (CSS takes the 2D frame out), and the diagram makes itself visible. */
      box.dataset.state = "ready";
      reveal();
      startTransition(() => setPhase("ready"));
    };
    ready.current = (s) => {
      show = s;
      trySwap();
    };

    /* ---- The load ---------------------------------------------------------- */
    const load = async () => {
      const { timedOut } = await idle(IDLE_TIMEOUT_MS, IDLE_FALLBACK_MS);
      if (stopped) return;
      mark("estate3d:idle", { timedOut, requestIdleCallback: hasIdleCallback(), schedulerYield: hasSchedulerYield() });
      if ((navigator as WithConnection).connection?.saveData === true) return;

      mark("estate3d:probe");
      const probe = document.createElement("canvas");
      const gl = probe.getContext("webgl2");
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
      if (!gl) {
        onFail();
        return;
      }
      startTransition(() => setPhase("preparing"));
      mark("estate3d:import-start");
      let m: typeof import("./EstateMap3D");
      try {
        m = await import("./EstateMap3D");
      } catch {
        /* A chunk that fails to load leaves the 2D map exactly as it was. */
        onFail();
        return;
      }
      mark("estate3d:import-end");
      if (stopped) return;
      startTransition(() => setMap3D(() => m.EstateMap3D));
    };

    /* The quiet period: any activity restarts it, read lazily so a scroll does not reset a timer on every event. */
    const activity = () => {
      lastActivity = performance.now();
    };
    const waitQuiet = () => {
      if (stopped) return;
      const left = lastActivity + QUIET_MS - performance.now();
      if (left > 0) {
        quietTimer = window.setTimeout(waitQuiet, left);
        return;
      }
      unlisten(window, ACTIVITY, activity);
      void load();
    };
    const maybeStart = () => {
      if (stopped || !interacted || !inRange) return;
      lastActivity = performance.now();
      for (const t of ACTIVITY) listen(window, t, activity);
      waitQuiet();
    };

    const trigger = () => {
      if (interacted) return;
      interacted = true;
      unlisten(window, TRIGGERS, trigger);
      mark("estate3d:trigger");
      maybeStart();
    };
    for (const t of TRIGGERS) listen(window, t, trigger);

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        inRange = true;
        maybeStart();
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(el);

    return () => {
      halt();
      if (stop.current === halt) stop.current = null;
      ready.current = null;
      reduce.removeEventListener("change", onMotionChange);
    };
  }, [section, stage, plan, onFail]);

  return { Map3D, phase, onFail, onReady };
}
