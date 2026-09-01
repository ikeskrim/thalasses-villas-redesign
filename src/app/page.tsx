import type { Metadata } from "next";

import { HotelPage } from "@/components/hotel/HotelPage";
import { alternatesFor } from "@/lib/locale";

/**
 * THE HOMEPAGE — Direction F, "The Cretan Hotel".
 *
 * Approved by the owner in September 2026 and recorded in `DECISIONS.md` D-001.
 * Motion is calibrated by `MOTION-DIRECTIVE.md`.
 *
 * WHAT THIS REPLACED, and where it went. The previous homepage was Direction D:
 * a preloader, a Ken Burns hero with an animated clause, the five-line litany,
 * a three-act pinned showcase, the estate map, the drag register and the run.
 * Those components are still in `src/components/sections/` and still serve the
 * inner pages; only the homepage's composition changed.
 *
 * The chooser at `/looks` and the four candidate directions are gone from the
 * build. Their findings — the grading pass, the reservoir, the legibility
 * measurements, the one-DOM result — are recorded in `SESSION-REPORT.md` and
 * `RE-SKIN-DIRECTIVE.md`, which is where the reasoning belongs once the
 * decision it fed is made.
 *
 * A KNOWN INCONSISTENCY, stated rather than left to be found: Direction F is a
 * homepage design. `/en/villas/*`, `/en/the-estate` and the rest are still
 * Direction D and still carry the Direction D navigation. Bringing them across
 * is real work and was not in this instruction's scope.
 */
export const metadata: Metadata = {
  /*
   * ITS OWN DESCRIPTION, not the site default.
   *
   * The first version of this file repeated the layout's default string, which
   * `/en/terms` also inherits — so the two shared the one line a searcher reads
   * to tell pages apart, and the homepage's was the one that mattered. Every
   * fact here resolves against the inventory: five villas, a pool each, a
   * private beach fifty metres below, and the four seafront houses as one.
   */
  description:
    "Five villas above a private beach on the north coast of Crete, each with its own pool. " +
    "Take one, or the four seafront houses together.",
  /*
   * THE CANONICAL, which the first version of this file dropped.
   *
   * Direction D's homepage declared one and this replacement did not, so for
   * the length of one commit the site's most important page told search engines
   * nothing about its own address. `alternatesFor` is the single source for it
   * — it emits the canonical and, once `/el` publishes, the hreflang set, so
   * this page cannot drift from the rule the way a hand-written block would.
   */
  alternates: alternatesFor("/"),
};

export default function Home() {
  return <HotelPage />;
}
