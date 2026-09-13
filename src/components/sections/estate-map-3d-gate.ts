"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType, type RefObject } from "react";

type Map3D = ComponentType<{ onFail: () => void }>;

/**
 * WHETHER THIS READER GETS THE 3D DIAGRAM — decided in the browser, and only
 * ever towards the 2D map when in doubt.
 *
 *  - Reduced motion: never. The 2D map is not a degraded version of the 3D
 *    one; it is the page.
 *  - No WebGL: never, and three.js is not even fetched. A throwaway canvas
 *    probes for a context and releases it at once.
 *  - Not near the viewport: not yet. The chunk is requested only when the
 *    section is within 600px, so a reader who never scrolls to the map never
 *    downloads three.js.
 *  - A context that fails or is lost later: back to the 2D map, for good.
 */
export function useEstateMap3D(section: RefObject<HTMLElement | null>) {
  const [Map3D, setMap3D] = useState<Map3D | null>(null);
  const failed = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2") ?? probe.getContext("webgl");
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
  }, [section]);

  const onFail = useCallback(() => {
    failed.current = true;
    setMap3D(null);
  }, []);

  return { Map3D, onFail };
}
