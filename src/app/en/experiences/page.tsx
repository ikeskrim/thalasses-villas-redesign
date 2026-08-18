import type { Metadata } from "next";

import { DragRegister } from "@/components/sections/DragRegister";
import { PageHead, PageShell } from "@/components/sections/PageShell";
import { getHomepageData } from "@/lib/homepage";

export const metadata: Metadata = {
  title: "Experiences",
  description:
    "Twenty-one things we arrange at Thalasses Villas — on the sea, on the land, at the table, and at the door.",
  alternates: { canonical: "/en/experiences" },
};

/**
 * THE EXPERIENCES HUB.
 *
 * The register is the same component the homepage carries, with the same chips
 * and the same 21 rows — one source, so the two can never disagree about what
 * is offered. What differs is the frame around it.
 */
export default function ExperiencesPage() {
  const d = getHomepageData();
  return (
    <PageShell>
      <PageHead
        beat="01 — Experiences"
        title="Asking for any of the following"
        lede="Twenty-one arrangements, made by people who live here. Filter by where they happen."
      />
      <section id="experiences" className="beat beat--wide d-register">
        <DragRegister rows={d.rows} />
      </section>
    </PageShell>
  );
}
