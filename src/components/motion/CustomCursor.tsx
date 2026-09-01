"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The contextual cursor (elevation spec §3) — Direction D's inner pages.
 *
 * A dot that follows with a little weight and reads its label from
 * `data-cursor` on whatever is under the pointer, so it says View / Book /
 * Enquire rather than being decorative.
 *
 * Desktop pointer only, never on touch, never under `prefers-reduced-motion`.
 * Every element it labels stays independently focusable and operable from the
 * keyboard — the cursor is decoration over a working affordance, never the
 * affordance itself.
 *
 * THE MAGNETIC SNAP WAS REMOVED, and so was hiding the OS pointer.
 *
 * Both were built against a brief whose register was Aman and Casa Angelina,
 * before the owner's approval of Direction F was recorded (`DECISIONS.md`
 * D-001). F is conventional hotel UX and `MOTION-DIRECTIVE.md`'s avoid-list
 * rules out cursor work that hides the real pointer. What remains is what was
 * here before: a contextual label on the Direction D inner pages, over a
 * pointer the reader still has.
 */

/** Follow damping. Lower is heavier. */
const EASE = 0.18;

export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    /*
     * NOT ON DIRECTION F. The homepage suppresses `.cursor` in CSS, which hid
     * the dot but left this component mounted — a requestAnimationFrame loop
     * running for the life of the page, and a pointermove listener with a
     * `closest()` on every event, to move something nobody can see.
     *
     * Hiding a thing is not the same as not running it.
     */
    if (document.querySelector('[data-look="hotel"]')) return;

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

      const target = e.target as HTMLElement | null;
      const labelled = target?.closest?.("[data-cursor]") ?? null;
      setLabel(labelled ? labelled.getAttribute("data-cursor") : null);
    };

    const tick = () => {
      cx += (x - cx) * EASE;
      cy += (y - cy) * EASE;
      if (dot.current) {
        /* translate3d only — never top/left, which would reflow every frame. */
        dot.current.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("pointermove", move, { passive: true });

    return () => {
      cancelAnimationFrame(enable);
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.body.classList.remove("has-custom-cursor");
    };
  }, []);

  if (!active) return null;

  return (
    <div
      ref={dot}
      className={`cursor${label ? " cursor--labelled" : ""}`}
      aria-hidden="true"
    >
      {label ? <span className="cursor-label">{label}</span> : null}
    </div>
  );
}
