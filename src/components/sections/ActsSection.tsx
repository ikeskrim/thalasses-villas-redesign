"use client";

import { useEffect, useState } from "react";

import { ActShowcase, ActStack, type Act } from "@/components/sections/ActShowcase";

/**
 * Chooses between the pinned showcase and the stacked version.
 *
 * Touch and reduced-motion get the stack — no pin, no scroll capture, nothing
 * behind an interaction. That is the majority platform, so it is a designed
 * layout rather than a fallback.
 *
 * Rendered stacked on the server so the markup is complete before any decision
 * is made: if the script never runs, the reader gets all three acts in full.
 */
export function ActsSection({ acts }: { acts: Act[] }) {
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia("(min-width: 1024px)");

    const decide = () => setPinned(fine.matches && wide.matches && !reduced.matches);
    const id = requestAnimationFrame(decide);

    fine.addEventListener("change", decide);
    reduced.addEventListener("change", decide);
    wide.addEventListener("change", decide);
    return () => {
      cancelAnimationFrame(id);
      fine.removeEventListener("change", decide);
      reduced.removeEventListener("change", decide);
      wide.removeEventListener("change", decide);
    };
  }, []);

  return pinned ? <ActShowcase acts={acts} /> : <ActStack acts={acts} />;
}
