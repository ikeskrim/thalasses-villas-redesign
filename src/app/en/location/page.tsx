import type { Metadata } from "next";

import { CoastLine } from "@/components/sections/CoastLine";
import { PageHead, PageShell } from "@/components/sections/PageShell";
import { Field } from "@/components/ui/Field";
import { getLocation } from "@/lib/content";
import { byN } from "@/lib/selects";
import { alternatesFor } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Location & Beaches",
  description:
    "Pigianos Kampos, Rethymno, on the north coast of Crete — with a private beach fifty metres from the door and the south coast forty minutes away.",
  alternates: alternatesFor("/en/location"),
};

/**
 * LOCATION — the measured distances, and the honest absence of the rest.
 *
 * The `CoastLine` component is shared with the homepage, so the figures cannot
 * disagree between the two pages. Eight of the eleven beaches have no distance
 * in the registry; they are a named run rather than a column of dashes, and no
 * figure is invented to fill the gap.
 */
export default function LocationPage() {
  const location = getLocation() as unknown as {
    distances?: { name: string; value: string; note?: string }[];
    nearby?: { name: string; distance: string | null }[];
  };
  const frame = byN(61);

  return (
    <PageShell>
      <PageHead
        beat="01 — Location"
        title="Wandering south, forty minutes"
        lede="Pigianos Kampos, on the north coast, with the water at the end of the garden and the wilder south within a morning."
      />
      <Field src={frame.path} alt={frame.alt} horizonY={frame.horizonY} height="72svh" className="d-bleed" />
      <CoastLine
        entries={location.distances ?? []}
        beaches={(location.nearby ?? []).map((n) => ({ name: n.name, distance: n.distance }))}
      />
    </PageShell>
  );
}
