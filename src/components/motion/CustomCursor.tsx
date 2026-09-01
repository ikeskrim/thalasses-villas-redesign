"use client";

import { useEffect, useRef, useState } from "react";

/**
 * THE MAGNETIC CURSOR (elevation spec §3, extended).
 *
 * A physics-following dot that reads its label from `data-cursor` on whatever
 * is under the pointer, snaps magnetically to interactive elements, and opens
 * into a labelled circle over the large villa photography.
 *
 * Desktop pointer only, never on touch, never under `prefers-reduced-motion`.
 * Every element it labels stays independently focusable and operable from the
 * keyboard — the cursor is decoration over a working affordance, never the
 * affordance itself.
 *
 * THE OS POINTER IS HIDDEN, WITH TWO CARVE-OUTS, AND THEY ARE NOT OPTIONAL.
 *
 * Hiding the native pointer is what the brief asks for and it is what makes the
 * effect read as bespoke rather than as an overlay. But this project's own
 * motion rules — and every usability guide worth the name — draw a line at two
 * places:
 *
 *   TEXT FIELDS keep their I-beam. A caret needs a cursor shaped like a caret;
 *   a dot floating over an input tells you nothing about where the text will
 *   land.
 *
 *   THE BOOKING CONTROL keeps its pointer. It is the one element on this site
 *   that earns money, and the F+ motion directive's avoid-list names it
 *   explicitly: no custom cursor that hides the real pointer over Book. A guest
 *   who cannot tell whether the button is clickable is a booking lost to
 *   decoration.
 *
 * Both are handled in CSS on `body.has-custom-cursor` rather than here, so they
 * hold even if this component throws.
 */

/** How hard the cursor is pulled toward a magnetic target, 0–1. */
const MAGNET = 0.32;
/** Follow damping. Lower is heavier. */
const EASE = 0.18;

export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [magnetic, setMagnetic] = useState(false);

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

    /**
     * What the cursor is currently attracted to.
     *
     * Magnetism is resolved on pointermove rather than per frame: reading a
     * bounding rect every frame is a forced layout sixty times a second, which
     * is exactly the reflow this project refuses to animate.
     */
    let magnet: { cx: number; cy: number } | null = null;

    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;

      const target = e.target as HTMLElement | null;
      const labelled = target?.closest?.("[data-cursor]") ?? null;
      setLabel(labelled ? labelled.getAttribute("data-cursor") : null);

      /*
       * Snap to the centre of small interactive things — buttons, links, the
       * nav — but never to a large one. A magnet on a full-bleed photograph
       * would drag the cursor to the middle of the screen and hold it there,
       * which reads as a broken pointer rather than as an effect.
       */
      const pull = target?.closest?.<HTMLElement>("[data-magnetic], button, a[href]") ?? null;
      if (pull) {
        const r = pull.getBoundingClientRect();
        magnet = r.width <= 420 && r.height <= 160 ? { cx: r.left + r.width / 2, cy: r.top + r.height / 2 } : null;
      } else {
        magnet = null;
      }
      setMagnetic(Boolean(magnet));
    };

    const tick = () => {
      /* Target is the pointer, pulled a fraction of the way toward the magnet. */
      const tx = magnet ? x + (magnet.cx - x) * MAGNET : x;
      const ty = magnet ? y + (magnet.cy - y) * MAGNET : y;
      cx += (tx - cx) * EASE;
      cy += (ty - cy) * EASE;
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
      className={`cursor${label ? " cursor--labelled" : ""}${magnetic ? " cursor--magnetic" : ""}`}
      aria-hidden="true"
    >
      {label ? <span className="cursor-label">{label}</span> : null}
    </div>
  );
}
