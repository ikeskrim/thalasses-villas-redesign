"use client";

import { useEffect, useState } from "react";

/**
 * PATTERN 6 — THE SCROLL ODOMETER.
 *
 * Their footer counts the distance scrolled and compares it to something at sea.
 * Ours counts metres and, once past fifty, says the one thing that is actually
 * true of this place: fifty metres is the distance from the veranda to the water.
 *
 * A CSS pixel is defined against a 96dpi reference, so 96px is one inch and
 * 3780px is one metre. That is the honest conversion and it is stated in the
 * markup rather than hidden — the charm depends on the number being real.
 *
 * Reduced motion gets the static line instead of a live counter.
 */
const PX_PER_METRE = 3780;

const NOTES: { over: number; text: string }[] = [
  { over: 300, text: "Further than the garden path, end to end." },
  { over: 150, text: "About the length of the private beach." },
  { over: 50, text: "You have just walked from your veranda to the water." },
  { over: 8, text: "The width of a villa terrace." },
  { over: 0, text: "Still on the doorstep." },
];

export function Odometer() {
  const [metres, setMetres] = useState(0);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const start = requestAnimationFrame(() => setLive(true));
    let total = 0;
    let last = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      const y = window.scrollY;
      total += Math.abs(y - last);
      last = y;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setMetres(total / PX_PER_METRE);
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(start);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const note = NOTES.find((n) => metres > n.over)?.text ?? NOTES[NOTES.length - 1]!.text;

  if (!live) {
    return (
      <p className="odometer on-dark">
        <span className="micro">The private beach lies fifty metres from every door.</span>
      </p>
    );
  }

  return (
    <p className="odometer on-dark" aria-live="off">
      <span className="micro">Scrolled</span>{" "}
      <span className="tabular odometer-value">{metres.toFixed(1)} m</span>
      <span className="odometer-note caption">{note}</span>
    </p>
  );
}
