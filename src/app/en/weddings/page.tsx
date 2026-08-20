import type { Metadata } from "next";
import Link from "next/link";

import { Magnetic } from "@/components/motion/Magnetic";
import { Reveal } from "@/components/motion/Reveal";
import { Inventory } from "@/components/sections/Inventory";
import { PageShell } from "@/components/sections/PageShell";
import { TheRun } from "@/components/sections/TheRun";
import { Clause } from "@/components/ui/Clause";
import { Field } from "@/components/ui/Field";
import { getExperience, getFacilitiesForVilla, getVilla } from "@/lib/content";
import { buildInventory } from "@/lib/inventory";
import { alternatesFor } from "@/lib/locale";
import { byN } from "@/lib/selects";
import { specStrip } from "@/lib/villa-page";

export const metadata: Metadata = {
  title: "Weddings & Events",
  description:
    "Marrying on sand, beside the water — Thalasses Rituals, the wedding and events venue at Thalasses Villas, Rethymno, Crete.",
  alternates: alternatesFor("/en/weddings"),
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

  /*
   * THE VENUE'S OWN FIGURES AND ITS OWN INVENTORY.
   *
   * `rituals.json` has carried both since Phase 0 and this page printed
   * neither: three bedrooms, three bathrooms, twelve in beds, 97 m², a pool,
   * and 43 features the legacy site displayed. Exactly the T-212 class — a
   * registry fact that reaches no page — and the reason the villas grew a spec
   * strip and an inventory in the first place.
   *
   * Read through the same functions the villa template uses, so the venue and
   * the houses can never disagree about how a figure is derived or printed.
   */
  const specs = specStrip(venue);
  const inventory = buildInventory(getFacilitiesForVilla(venue));
  const inventoryCount = inventory.groups.reduce((n, g) => n + g.count, 0);

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
          {specs.length ? (
            <ul className="d-spec-strip">
              {specs.map((sp) => (
                <li
                  key={sp.label}
                  className={`d-spec-cell${sp.sub ? " d-spec-cell--area" : ""}`}
                >
                  <span className="micro d-spec-label">{sp.label}</span>
                  <span className="tabular d-spec-value">{sp.value}</span>
                  {sp.sub ? <span className="caption tabular d-spec-sub">{sp.sub}</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </Reveal>
        <Reveal index={1}>
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

      {/* -------------------------------------------- 05 WHAT IS HERE -- */}
      {/* The 43 features the legacy site displayed for this venue, through the
          same component the villas use. Unresolved ids and empty groups are
          omitted rather than dashed, exactly as everywhere else. */}
      {inventoryCount > 0 ? (
        <Inventory data={inventory} villaName={venue.name} beat="05" />
      ) : null}

      <section className="canon d-estate-close">
        <Reveal>
          <p className="micro">06 — Planning it</p>
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
