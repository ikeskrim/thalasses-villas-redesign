"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * THE PELAGOS WIPE — route transitions.
 *
 * WHY THIS IS NOT THE VIEW TRANSITIONS API, having tried it first.
 *
 * `document.startViewTransition` snapshots the outgoing document and animates
 * it against the incoming one, which is exactly the effect wanted. But it needs
 * the router to tell it when the new DOM has committed, and in the App Router
 * that hand-off is `experimental.viewTransition` — a key **this Next version
 * rejects as invalid** (measured: `next build` warns "invalid experimental
 * key", and no `viewTransition` option exists in its config schema). Without
 * it, wrapping `router.push` in `startViewTransition` snapshots before the new
 * page exists and animates a page against itself.
 *
 * So: a controlled overlay instead. One pelagos sheet wipes up over the
 * outgoing page, the navigation happens underneath it, and it withdraws when
 * the new pathname commits. It is not the native mechanism, and it is honest
 * about that — but it works in every browser, it is falsifiable, and it can be
 * asserted. When Next exposes the flag, the sheet comes out and the CSS
 * `::view-transition-*` rules take over.
 *
 * It also removes the white flash between routes for free, which the native
 * path would not have.
 *
 * REDUCED MOTION: no sheet at all, and no delay — navigation is instant.
 *
 * FOCUS: a client-side route change does not move focus, which strands a
 * keyboard or screen-reader user on the previous page's last focused element.
 * After every navigation focus moves to the new page's `#main`. Asserted in
 * `tests/direction-d.spec.ts`: the transition may never cost the hand-off.
 */
export function RouteTransition() {
  const pathname = usePathname();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    // First paint is an arrival, not a transition.
    if (previous.current === null) {
      previous.current = pathname;
      return;
    }
    if (previous.current === pathname) return;
    previous.current = pathname;

    // Move focus to the new page's landmark. This happens under reduced motion
    // too — it is an accessibility behaviour, not a decorative one.
    const main = document.getElementById("main");
    if (main) {
      if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
      main.focus({ preventScroll: true });
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // The sheet is a transient visual, not application state, so it is a DOM
    // node that removes itself rather than a `useState` that costs a render on
    // every navigation. It also cannot survive a fast double-navigation as a
    // stuck overlay: the cleanup removes it unconditionally.
    const sheet = document.createElement("div");
    sheet.className = "d-wipe";
    sheet.setAttribute("aria-hidden", "true");
    const done = () => sheet.remove();
    sheet.addEventListener("animationend", done, { once: true });
    document.body.appendChild(sheet);

    return () => {
      sheet.removeEventListener("animationend", done);
      sheet.remove();
    };
  }, [pathname]);

  return null;
}
