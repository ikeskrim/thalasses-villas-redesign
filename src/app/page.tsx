import type { Metadata } from "next";

import { HotelPage } from "@/components/hotel/HotelPage";

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
  description:
    "An intimate seafront collection of private villas in Pigianos Kampos, Rethymno, Crete.",
};

export default function Home() {
  return <HotelPage />;
}
