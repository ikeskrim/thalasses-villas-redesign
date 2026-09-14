"use client";

import type { ComponentType } from "react";
import { useEffect, useState } from "react";

/**
 * THE CONTEXTUAL CURSOR, LOADED ONLY WHERE IT RUNS.
 *
 * `CustomCursor` was a static import in the root layout, so its code sat in the
 * site shell's chunk and every phone, every reader who asked for reduced motion
 * and every visit to the Direction F homepage downloaded and evaluated it only
 * to reach the early return at the top of its effect. This is the move
 * `SmoothScroll.tsx` made for Lenis: the checks run here first, and the cursor
 * module is imported only when all three pass.
 *
 * They are the cursor's own checks, in its order, read once on mount as they
 * always were. `CustomCursor` keeps them as well, so it stays correct if
 * anything ever mounts it directly. On a desktop Direction D inner page the
 * same component mounts, one chunk request later than before. The cursor test
 * in `tests/villa.spec.ts` checks that against the served build.
 *
 * A DECORATIVE CHUNK THAT FAILS TO LOAD MUST NOT TAKE THE PAGE DOWN. The import
 * runs in an effect and its rejection is caught and dropped, so a flaky
 * connection, a content blocker or a redeploy that removed the old hashed chunk
 * leaves the page as it is, with no cursor. Not `React.lazy`: it rethrows a
 * rejected import during render, this component sits in the root layout beside
 * `children` and so outside `app/error.tsx`, and there is no
 * `global-error.tsx`, so the whole document would be replaced by Next's
 * default error screen, booking ledger included. Nothing renders until the
 * module has arrived, and nothing renders on the server, so the HTML is
 * unchanged and no Suspense segment streams.
 *
 * ONCE PER DOCUMENT, NOT PER ROUTE, and deliberately left that way. The root
 * layout persists across client navigations and both effects have an empty
 * dependency list, so the decision is made on the first page only: arriving on
 * the F homepage and following a link into a villa gives no cursor until a
 * reload, and arriving on a villa and navigating home keeps it mounted under
 * the CSS rule that hides it. That is how the cursor behaved before it was
 * deferred (`qa/perf/ISLANDS-tranche12.md`), and changing it is a behaviour
 * decision, not a loading one.
 */
export function LazyCustomCursor() {
  const [Cursor, setCursor] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (document.querySelector('[data-look="hotel"]')) return;

    let cancelled = false;

    import("./CustomCursor").then(
      (m) => {
        // The updater form: a component passed to setState directly would be
        // called as one.
        if (!cancelled) setCursor(() => m.CustomCursor);
      },
      () => {
        // Swallowed on purpose — see "must not take the page down" above.
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return Cursor ? <Cursor /> : null;
}
