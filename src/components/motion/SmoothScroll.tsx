"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { getSmoothScroll, setSmoothScroll } from "@/lib/smooth-scroll";

/**
 * Lenis smooth scrolling, synced to the router.
 *
 * Deliberately narrow: desktop pointer devices only, and disabled outright for
 * prefers-reduced-motion. Touch scrolling stays native — hijacking momentum on
 * a phone is the single most common way a "premium" site becomes unusable, and
 * mobile is a first-class surface here, not a degraded one.
 *
 * ROUTE SYNC, and what it deliberately does NOT do.
 *
 * Lenis caches the document height. After a client-side navigation the new page
 * is a different height and the old number is still in memory, so the scroll
 * runs out early or overshoots into empty space — the classic symptom of
 * "smooth scroll broke on the second page". `resize()` on every pathname change
 * fixes it.
 *
 * It does **not** force the scroll to the top. The App Router already restores
 * position, including on a back navigation, and a hard `scrollTo(0)` here would
 * throw away the place a reader had returned to. The bug being fixed is a stale
 * measurement, not a stale position.
 */
export function SmoothScroll() {
  const pathname = usePathname();

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

    /* Publish for anything that needs to attach — see lib/smooth-scroll.ts. */
    setSmoothScroll(lenis);

    return () => {
      cancelAnimationFrame(frame);
      setSmoothScroll(null);
      lenis.destroy();
    };
  }, []);

  /*
   * Re-measure after a navigation, once the new page has actually painted.
   * A double rAF is the reliable point: the first fires before layout of the
   * incoming route has settled, and measuring then caches the old height again.
   */
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      /* Read at call time, not at mount: on the first render this effect can
         run before the instance exists, and on every later navigation it does. */
      second = requestAnimationFrame(() => getSmoothScroll()?.resize());
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [pathname]);

  return null;
}
