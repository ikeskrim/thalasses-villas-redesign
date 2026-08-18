import type { Metadata } from "next";
import Link from "next/link";

import { Magnetic } from "@/components/motion/Magnetic";
import { Reveal } from "@/components/motion/Reveal";
import { PageShell } from "@/components/sections/PageShell";
import { TheRun } from "@/components/sections/TheRun";
import { Clause } from "@/components/ui/Clause";
import { Field } from "@/components/ui/Field";
import { getVilla, getExperience } from "@/lib/content";
import { byN } from "@/lib/selects";

export const metadata: Metadata = {
  title: "Weddings & Events",
  description:
    "Marrying on sand, beside the water — Thalasses Rituals, the wedding and events venue at Thalasses Villas, Rethymno, Crete.",
  alternates: { canonical: "/en/weddings" },
};

/**
 * WEDDINGS & EVENTS — venue-led.
 *
 * Thalasses Rituals left the villa collection in D1a precisely so it could be
 * this: a venue with its own page rather than a sixth villa nobody could book.
 * The gallery is Rituals' own photography through the shared count-driven
 * resolver, so a venue with few frames gets the plates layout rather than a grid
 * with holes.
 *
 * Enquiry-only, in the concierge register — a wedding is not a dates-only deep
 * link and the page never pretends otherwise.
 */
export default function WeddingsPage() {
  const venue = getVilla("rituals");
  const dream = getExperience("dream-weadding-on-the-beach");
  const opener = byN(9);
  const gathering = byN(31);

  const runImages = venue.gallery.featured.length
    ? venue.gallery.featured.map((f) => ({ url: f.image, caption: f.caption }))
    : venue.gallery.allImages.map((u) => ({ url: u, caption: null }));

  return (
    <PageShell>
      <Field
        src={venue.gallery.heroImage ?? opener.path}
        alt="A wedding gathering beside the water at Thalasses Villas"
        horizonY={0.44}
        height="92svh"
        className="d-villa-hero"
      >
        <div className="canon clause-field" style={{ padding: 0 }}>
          <p className="micro d-eyebrow">01 — Weddings &amp; Events</p>
          <Clause gerund="Marrying" tail="On sand, beside the water" scale="c1" animate as="h1" />
        </div>
      </Field>

      <section className="canon d-spec">
        <Reveal>
          <p className="micro">02 — The venue</p>
          <p className="d-villa-lede">
            {venue.shortDescription ??
              "Thalasses Rituals is the estate's own venue for a wedding or a celebration, on the sand and beside the water."}
          </p>
        </Reveal>
      </section>

      <Field
        src={gathering.path}
        alt={gathering.alt}
        horizonY={gathering.horizonY}
        height="76svh"
        className="d-bleed"
      />

      {dream ? (
        <section className="canon d-exp-body">
          <Reveal>
            <p className="micro d-exp-mark">03 — The day itself</p>
            <p className="prose-measure d-exp-text">
              {dream.longDescription ?? dream.shortDescription ?? ""}
            </p>
          </Reveal>
        </section>
      ) : null}

      <div className="canon d-villa-mark">
        <p className="micro">04 — The venue, photographed</p>
        <div className="datum-rule" />
      </div>
      <TheRun images={runImages} villaName="Thalasses Rituals" />

      <section className="canon d-estate-close">
        <Reveal>
          <p className="micro">05 — Planning it</p>
          <div className="clause-field d-statement-clause">
            <Clause gerund="Planning" tail="The day, from the first note" scale="c2" as="h2" />
          </div>
          <p className="d-villa-lede">
            A wedding here is arranged in conversation, not in a booking form. Tell us the date
            and the number, and we will tell you what the estate can hold.
          </p>
          <p className="d-villa-cta">
            <Magnetic>
              <Link
                href="/en/contact?enquiry=Weddings%20%26%20Events"
                className="btn-primary micro"
                data-cursor="Enquire"
              >
                Enquire — we design your day
              </Link>
            </Magnetic>
          </p>
        </Reveal>
      </section>
    </PageShell>
  );
}
