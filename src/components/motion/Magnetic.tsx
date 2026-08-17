"use client";

import { useEffect, useRef } from "react";

/**
 * Magnetic primary CTA (elevation spec §3).
 *
 * The element leans toward the pointer within a small radius, then springs back.
 * Deliberately restrained — 10px of travel, not 40 — because the effect should
 * register as quality rather than as a toy.
 *
 * Pointer-fine only, and disabled under prefers-reduced-motion. The transform is
 * applied to an inner wrapper so the hit area never moves: a magnetic button
 * that dodges the cursor is a usability defect wearing a costume.
 */
export function Magnetic({
  children,
  strength = 10,
  className = "",
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const root = useRef<HTMLSpanElement>(null);
  const inner = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    const move = inner.current;
    if (!el || !move) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      move.style.transform = `translate3d(${dx * strength}px, ${dy * strength}px, 0)`;
    };
    const onLeave = () => {
      move.style.transform = "translate3d(0,0,0)";
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [strength]);

  return (
    <span ref={root} className={`magnetic ${className}`}>
      <span ref={inner} className="magnetic-inner">
        {children}
      </span>
    </span>
  );
}
