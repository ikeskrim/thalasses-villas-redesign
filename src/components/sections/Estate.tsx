import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Clause } from "@/components/ui/Clause";
import type { VillaCta } from "@/lib/booking";

export interface EstateProps {
  bedrooms: number;
  bathrooms: number;
  sleeps: number;
  pools: number;
  sizeSqm: number;
  distanceToBeach: string;
  diningSeats: number;
  cta: VillaCta;
}

/**
 * Beat 05 — THE ENTIRE ESTATE (DESIGN-PLAN §6.2).
 *
 * The only section on the site that changes ground: --pelagos edge to edge.
 * Nothing else on any page uses the sea as a surface, which is what makes this
 * read as the crown piece without a badge, a ribbon or the word "exclusive".
 *
 * The CTA is an enquiry BY DESIGN, not by limitation — a full-buyout product
 * suits a concierge conversation, and direct booking of the whole estate would
 * conflict with the individual villas' allotment. The copy never hints at a
 * missing feature.
 */
export function Estate({
  bedrooms,
  bathrooms,
  sleeps,
  pools,
  sizeSqm,
  distanceToBeach,
  diningSeats,
  cta,
}: EstateProps) {
  const figures = [
    { value: bedrooms, label: "Bedrooms" },
    { value: bathrooms, label: "Bathrooms" },
    { value: sleeps, label: "Sleep in beds" },
    { value: pools, label: "Private pools" },
    { value: `${sizeSqm}`, label: "Square metres" },
    { value: diningSeats, label: "At one table" },
  ];

  return (
    <section className="estate on-dark">
      <div className="canon">
        <Reveal>
          <p className="micro">The Entire Estate</p>
          <div className="clause-field" style={{ marginTop: "var(--spacing-step-4)" }}>
            <Clause gerund="Gathering" tail="All four, one gate" scale="c1" as="h2" />
          </div>
        </Reveal>

        <Reveal index={1}>
          <p className="lede estate-lede">
            Four villas taken together as one house, {distanceToBeach} from the water, with a
            private beach, four private pools and a table that seats {diningSeats} under the
            evening sun.
          </p>
        </Reveal>

        <Reveal index={2}>
          <dl className="estate-figures">
            {figures.map((f) => (
              <div key={f.label} className="estate-figure">
                <dt className="micro">{f.label}</dt>
                <dd className="display c3 tabular estate-figure-value">{f.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal index={3}>
          <p className="estate-cta-row">
            <Link href={cta.href} className="micro estate-cta">
              {cta.label}
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
