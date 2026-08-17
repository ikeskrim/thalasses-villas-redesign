"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Contextual cursor (elevation spec §3) — desktop pointer only.
 *
 * Reads its label from `data-cursor` on whatever is under the pointer, so the
 * cursor says View / Drag / Book rather than being decorative. Never rendered on
 * touch and never under prefers-reduced-motion, and it never replaces a real
 * affordance — every element it labels is independently focusable and its
 * behaviour is available from the keyboard.
 */
export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    // Scheduled, not synchronous: this depends on matchMedia, which only
    // resolves on the client, and a synchronous setState here would cascade a
    // second render on every mount.
    const enable = requestAnimationFrame(() => {
      setActive(true);
      document.body.classList.add("has-custom-cursor");
    });

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let cx = x;
    let cy = y;
    let raf = 0;

    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      const el = (e.target as HTMLElement | null)?.closest?.("[data-cursor]");
      setLabel(el ? el.getAttribute("data-cursor") : null);
    };

    const tick = () => {
      // Light easing so the cursor trails rather than snaps.
      cx += (x - cx) * 0.22;
      cy += (y - cy) * 0.22;
      if (dot.current) {
        dot.current.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(enable);
      document.body.classList.remove("has-custom-cursor");
    };
  }, []);

  if (!active) return null;

  return (
    <div ref={dot} className={`cursor${label ? " cursor--labelled" : ""}`} aria-hidden="true">
      {label ? <span className="cursor-label">{label}</span> : null}
    </div>
  );
}
