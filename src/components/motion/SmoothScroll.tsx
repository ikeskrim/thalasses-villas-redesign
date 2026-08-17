"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/**
 * Lenis smooth scrolling.
 *
 * Deliberately narrow: desktop pointer devices only, and disabled outright for
 * prefers-reduced-motion. Touch scrolling stays native — hijacking momentum on
 * a phone is the single most common way a "premium" site becomes unusable, and
 * mobile is a first-class surface here, not a degraded one.
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduced || coarse) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 0,
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
