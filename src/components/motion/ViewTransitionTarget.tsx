"use client";

import { useLayoutEffect } from "react";

import { markCommitted, onFinished, VT_NAME } from "@/lib/view-transition";

/**
 * The receiving end of the villa morph. See lib/view-transition.ts.
 *
 * Mounted once on the villa page. On mount it names the hero image with the
 * shared transition name and tells the handle the new page has committed, so
 * the transition the card started can play. If no transition is in flight —
 * a direct visit, a reload, a back navigation — it does nothing at all.
 *
 * `useLayoutEffect`, not `useEffect`: the browser must see the name before it
 * paints the new state, or it captures the hero as an unnamed element and the
 * morph becomes a plain cross-fade.
 *
 * THE NAME COMES OFF WHEN THE MORPH FINISHES, not when this unmounts. A hero
 * left named would try to morph against nothing on the next navigation away.
 * This component cannot see the transition's `finished` promise, so it
 * registers with the handle and the card calls it.
 */
export function ViewTransitionTarget({ selector = ".d-villa-hero img" }: { selector?: string }) {
  useLayoutEffect(() => {
    if (!document.documentElement.hasAttribute("data-vt")) return;
    const img = document.querySelector<HTMLElement>(selector);
    const clear = () => {
      if (img) img.style.viewTransitionName = "";
    };
    if (img && document.documentElement.getAttribute("data-vt") === "villa") {
      img.style.viewTransitionName = VT_NAME;
      onFinished(clear);
    }
    markCommitted();
    return clear;
  }, [selector]);

  return null;
}
