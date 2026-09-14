"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType, type RefObject } from "react";

import type { RenderPlan } from "@/lib/estate-plan-gate";
import type { Hotspot } from "./EstateMap";

type Map3D = ComponentType<{ plan: RenderPlan; hotspots: Hotspot[]; onFail: () => void }>;

/** `navigator.connection` is not in TypeScript's DOM library (it is Chromium-only). */
type WithConnection = Navigator & { connection?: { saveData?: boolean } };

/**
 * WHETHER THIS READER GETS THE 3D DIAGRAM — decided in the browser, and only
 * ever towards the 2D map when in doubt. The browser is asked only after the
 * server has said yes.
 *
 *  - The provenance gate: first, and not the browser's call. The page passes a
 *    render plan only when `content/estate-plan.json` is owner-verified
 *    (DECISIONS.md D-021; `src/lib/estate-plan-gate.ts`). With `null` this hook
 *    returns before it probes anything, so three.js is never requested.
 *  - Reduced motion: never. The 2D map is not a degraded version of the 3D
 *    one; it is the page. And not only at mount: a reader who turns reduced
 *    motion on after the diagram has arrived gets the 2D map back, for good
 *    (step B, B1). Before, the preference was read once and a later change kept
 *    the diagram on screen for the rest of the visit.
 *  - Data saver: never, and three.js is not fetched. A reader who has asked the
 *    browser to save data has told us what 135 KiB of gzip that draws no
 *    information the list does not already carry is worth. This is a build
 *    default logged with step B, not a ruling.
 *  - No WebGL2: never, and three.js is not even fetched. three.js stopped
 *    supporting WebGL1 at r163, so a WebGL1-only device used to download the
 *    chunk and fall back anyway. A throwaway canvas probes for a WebGL2 context
 *    and releases it at once.
 *  - Not near the viewport: not yet. The chunk is requested only when the
 *    section is within 600px, so a reader who never scrolls to the map never
 *    downloads three.js.
 *  - A context that fails or is lost later: back to the 2D map, for good.
 *
 * FOCUS SURVIVES THE SWAP BACK. Reduced motion turned on, or a lost context,
 * removes the diagram with whatever had focus in it, and focus fell to the
 * document body: a keyboard or screen-reader reader lost their place, and below
 * 768 px the 2D markers are hidden, so there was nothing equivalent to find. So
 * `onFail` notes which place had focus, and once the 2D map is rendered focus
 * goes to that place's 2D marker if it is shown, else its link in the numbered
 * list, else the section itself (named "The estate"), made focusable only for
 * that moment.
 */
export function useEstateMap3D(section: RefObject<HTMLElement | null>, plan: RenderPlan | null) {
  const [Map3D, setMap3D] = useState<Map3D | null>(null);
  const failed = useRef(false);
  /* Set only when focus was inside the diagram as it failed: the place it was on, or null for none. */
  const refocus = useRef<{ place: string | null } | null>(null);

  const onFail = useCallback(() => {
    /* The diagram is the only `.estate-map-frame--3d` a page can have: only /en/the-estate passes a plan. */
    const active = document.activeElement;
    if (active?.closest(".estate-map-frame--3d")) {
      refocus.current = { place: active.closest("[data-place]")?.getAttribute("data-place") ?? null };
    }
    failed.current = true;
    setMap3D(null);
  }, []);

  useEffect(() => {
    const pending = refocus.current;
    const el = section.current;
    if (Map3D || !pending || !el) return;
    refocus.current = null;
    const shown = (n: HTMLElement | null): n is HTMLElement => !!n && n.getClientRects().length > 0;
    const key = pending.place ? CSS.escape(pending.place) : null;
    const marker = key ? el.querySelector<HTMLElement>(`[aria-controls="spot-${key}"]`) : null;
    const link = key ? el.querySelector<HTMLElement>(`[data-hotspot="${key}"] a[href]`) : null;
    if (shown(marker)) return marker.focus({ preventScroll: true });
    if (shown(link)) return link.focus({ preventScroll: true });
    el.setAttribute("tabindex", "-1");
    el.addEventListener("blur", () => el.removeAttribute("tabindex"), { once: true });
    el.focus({ preventScroll: true });
  }, [Map3D, section]);

  useEffect(() => {
    if (!plan) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;
    if ((navigator as WithConnection).connection?.saveData === true) return;

    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2");
    if (!gl) return;
    gl.getExtension("WEBGL_lose_context")?.loseContext();

    const el = section.current;
    if (!el) return;

    let cancelled = false;
    /*
     * Turned on at any point after this: the 2D map, whether the chunk has
     * arrived or not. Before it has, the observer is stopped too, so a reader
     * who turns reduced motion on before scrolling to the map never downloads
     * three.js; `failed` alone would only have stopped the swap, after the fetch.
     */
    const onMotionChange = (e: MediaQueryListEvent) => {
      if (!e.matches) return;
      io.disconnect();
      onFail();
    };
    reduce.addEventListener("change", onMotionChange);

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        import("./EstateMap3D")
          .then((m) => {
            if (!cancelled && !failed.current) setMap3D(() => m.EstateMap3D);
          })
          .catch(() => {
            /* A chunk that fails to load leaves the 2D map exactly as it was. */
          });
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(el);

    return () => {
      cancelled = true;
      io.disconnect();
      reduce.removeEventListener("change", onMotionChange);
    };
  }, [section, plan, onFail]);

  return { Map3D, onFail };
}
