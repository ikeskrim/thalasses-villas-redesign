"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType, type RefObject } from "react";

import type { RenderPlan } from "@/lib/estate-plan-gate";

type Map3D = ComponentType<{ plan: RenderPlan; onFail: () => void }>;

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
 *    one; it is the page.
 *  - No WebGL2: never, and three.js is not even fetched. three.js stopped
 *    supporting WebGL1 at r163, so a WebGL1-only device used to download the
 *    chunk and fall back anyway. A throwaway canvas probes for a WebGL2 context
 *    and releases it at once.
 *  - Not near the viewport: not yet. The chunk is requested only when the
 *    section is within 600px, so a reader who never scrolls to the map never
 *    downloads three.js.
 *  - A context that fails or is lost later: back to the 2D map, for good.
 */
export function useEstateMap3D(section: RefObject<HTMLElement | null>, plan: RenderPlan | null) {
  const [Map3D, setMap3D] = useState<Map3D | null>(null);
  const failed = useRef(false);

  useEffect(() => {
    if (!plan) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2");
    if (!gl) return;
    gl.getExtension("WEBGL_lose_context")?.loseContext();

    const el = section.current;
    if (!el) return;

    let cancelled = false;
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
    };
  }, [section, plan]);

  const onFail = useCallback(() => {
    failed.current = true;
    setMap3D(null);
  }, []);

  return { Map3D, onFail };
}
