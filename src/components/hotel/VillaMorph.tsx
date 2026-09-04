"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { finish, VT_NAME, whenCommitted } from "@/lib/view-transition";

/**
 * THE VILLA MORPH, AS ONE ISLAND OVER PLAIN ANCHORS.
 *
 * The villa cards' photographs are ordinary `<a href>` links in the server
 * HTML — what a crawler, a reader without JavaScript, and a middle-click all
 * get. This mounts once inside `#villas` and listens by delegation, so five
 * cards cost one hydration rather than five `next/link` islands. Measured on
 * the gate's phone profile, those five were part of the blocking-time
 * regression Phase 2 first showed; the page's hydration task is the largest
 * long task it has, and every island is a slice of it.
 *
 * On a plain click it does what a Link would — a client-side navigation — and,
 * where the browser has View Transitions and the reader has not asked for
 * reduced motion, it names the card's photograph and starts the transition
 * whose other end is `ViewTransitionTarget` on the villa page. See
 * lib/view-transition.ts for the hand-off.
 *
 * PREFETCH ON INTENT, NOT ON SCROLL. `next/link` would prefetch all five villa
 * routes as the cards scroll into view, and on a 4× CPU that parsing landed as
 * long tasks (268 → 433ms). The route is warmed when the reader shows intent —
 * pointer over the card, or focus on it — which on a mouse precedes the click
 * by long enough, and on touch costs nothing until the tap.
 *
 * WHAT IT NEVER DOES: intercept a modified click (new tab, download), touch
 * Book Now or "Check availability", move focus, or own scroll. RouteTransition
 * still moves focus to `#main` on every navigation and the App Router still
 * owns scroll restoration.
 */
export function VillaMorph({ root = "#villas", selector = ".ho-card-link" }: { root?: string; selector?: string }) {
  const router = useRouter();

  useEffect(() => {
    const host = document.querySelector<HTMLElement>(root);
    if (!host) return;

    const linkFrom = (t: EventTarget | null) =>
      t instanceof Element ? t.closest<HTMLAnchorElement>(selector) : null;

    const warm = (e: Event) => {
      const a = linkFrom(e.target);
      if (a) router.prefetch(a.getAttribute("href") ?? "");
    };

    const click = (e: MouseEvent) => {
      const a = linkFrom(e.target);
      if (!a) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const href = a.getAttribute("href");
      if (!href || a.target === "_blank") return;
      e.preventDefault();

      const doc = document as Document & {
        startViewTransition?: (cb: () => Promise<void>) => { finished: Promise<void> };
      };
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const canMorph =
        typeof doc.startViewTransition === "function" && !document.documentElement.hasAttribute("data-vt");

      if (!canMorph) {
        router.push(href);
        return;
      }

      const img = a.closest(".ho-card")?.querySelector<HTMLElement>(".ho-card-figure img") ?? null;
      document.documentElement.setAttribute("data-vt", reduced ? "reduced" : "villa");
      if (img && !reduced) img.style.viewTransitionName = VT_NAME;

      try {
        const vt = doc.startViewTransition(() => {
          router.push(href);
          return whenCommitted();
        });
        vt.finished.finally(() => {
          if (img) img.style.viewTransitionName = "";
          document.documentElement.removeAttribute("data-vt");
          finish();
        });
      } catch {
        if (img) img.style.viewTransitionName = "";
        document.documentElement.removeAttribute("data-vt");
        router.push(href);
      }
    };

    host.addEventListener("click", click);
    host.addEventListener("pointerenter", warm, true);
    host.addEventListener("focusin", warm);
    return () => {
      host.removeEventListener("click", click);
      host.removeEventListener("pointerenter", warm, true);
      host.removeEventListener("focusin", warm);
    };
  }, [root, selector, router]);

  return null;
}
