import type { Metadata } from "next";
import Link from "next/link";

import { KenBurns } from "@/components/motion/KenBurns";
import { Magnetic } from "@/components/motion/Magnetic";
import { Reveal } from "@/components/motion/Reveal";
import { CoastLine } from "@/components/sections/CoastLine";
import { Collection } from "@/components/sections/Collection";
import { DragRegister } from "@/components/sections/DragRegister";
import { EstateMap } from "@/components/sections/EstateMap";
import { Litany } from "@/components/sections/Litany";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { BookingLedger } from "@/components/ui/BookingLedger";
import { Clause } from "@/components/ui/Clause";
import { Field } from "@/components/ui/Field";
import { getHomepageData } from "@/lib/homepage";
import { HOTSPOTS, LITANY } from "@/app/home-data";

export const metadata: Metadata = {
  title: "B — Light Editorial",
  robots: { index: false, follow: false },
};

/**
 * DIRECTION B — LIGHT EDITORIAL.
 *
 * The existing limestone system, pushed as far as it goes rather than replaced:
 * this is the current language's last stand, and it is only a fair test if it
 * is argued at full strength.
 *
 * Three levers, all of them scale rather than new invention — because the
 * critique of this direction was never "wrong ingredients", it was "flat".
 *   1. Type one full step larger throughout, so the display register reads as
 *      a magazine opener rather than as a heading.
 *   2. More photography, and photography that interrupts prose instead of
 *      following it — a full-bleed frame between every pair of reading beats.
 *   3. Tighter vertical rhythm. The current page breathes so evenly that
 *      nothing feels emphasised; compressing the gaps lets scale do the work.
 *
 * Same facts, same booking links, same photographs as A and C.
 */
export default function DirectionB() {
  const d = getHomepageData();

  return (
    <div className="dir dir-b">
      <main id="main">
        <section className="b-hero">
          <KenBurns
            src={d.frame.hero.path}
            alt={d.frame.hero.alt}
            width={d.frame.hero.w}
            height={d.frame.hero.h}
            objectPosition="50% 54%"
          />
          <div className="b-hero-scrim" aria-hidden="true" />
          <div className="canon b-hero-copy">
            <p className="micro">Pigianos Kampos · Rethymno · Crete</p>
            <div className="clause-field">
              <Clause gerund="Living" tail="Unlimited" scale="c1" animate as="h1" />
            </div>
            <p className="lede b-hero-lede">
              Five seafront villas, one private beach fifty metres from the door.
            </p>
          </div>
        </section>

        {/* The overture, unchanged in kind — this direction keeps the device. */}
        <Litany lines={LITANY} payoffGerund="Living" payoffTail="Whatever that means to you" />

        {/* A frame between reading beats, not after them. */}
        <Field src={d.frame.cabanas.path} alt={d.frame.cabanas.alt} horizonY={d.frame.cabanas.horizonY} height="78svh" />

        {/* The editorial spread: one long lyrical sentence, one column of fact. */}
        <section className="canon b-spread">
          <Reveal className="b-spread-lede">
            <p className="micro">The estate</p>
            <p className="display c3 b-pull">
              One gate closes, and the estate is yours — four houses, four pools, and a beach
              with no one else&rsquo;s towels on it.
            </p>
          </Reveal>
          <Reveal className="b-spread-facts" index={1}>
            <dl className="b-facts">
              {d.figures.map((f) => (
                <div key={f.label} className="b-fact">
                  <dt className="micro">{f.label}</dt>
                  <dd className="display c3 tabular">{f.value}</dd>
                </div>
              ))}
            </dl>
            <p className="b-spread-cta">
              <Magnetic>
                <Link href={d.cta.href} className="btn-primary micro" data-cursor="Enquire">
                  {d.cta.label}
                </Link>
              </Magnetic>
            </p>
          </Reveal>
        </section>

        <Collection front={d.villas.front} rear={d.villas.rear} fifth={d.villas.fifth} />

        <Field src={d.frame.pool.path} alt={d.frame.pool.alt} height="82svh" />

        <EstateMap
          image={d.frame.map.path}
          alt={d.frame.map.alt}
          hotspots={HOTSPOTS}
          ledger={d.figures}
          ctaLabel={d.cta.label}
          ctaHref={d.cta.href}
          beat="05"
        />

        <section id="experiences" className="beat beat--wide b-register">
          <p className="micro">06 — Experiences</p>
          <div className="clause-field">
            <Clause gerund="Asking" tail="For any of the following" scale="c2" as="h2" />
          </div>
          <DragRegister rows={d.rows} />
        </section>

        <Field src={d.frame.terrace.path} alt={d.frame.terrace.alt} horizonY={d.frame.terrace.horizonY} height="76svh" />

        <CoastLine
          entries={d.location.distances ?? []}
          beaches={(d.location.nearby ?? []).map((n) => ({ name: n.name, distance: n.distance }))}
        />

        <Field src={d.frame.wedding.path} alt={d.frame.wedding.alt} height="90svh">
          <div className="canon clause-field" style={{ padding: 0 }}>
            <p className="micro">08 — Weddings &amp; Events</p>
            <Clause gerund="Marrying" tail="On sand, beside the water" scale="c2" as="h2" />
            <p className="beat-cta">
              <Magnetic>
                <Link href="/en/weddings" className="btn-primary btn-primary--light micro" data-cursor="View">
                  Plan the day
                </Link>
              </Magnetic>
            </p>
          </div>
        </Field>
      </main>

      <BookingLedger host={d.host} />
      <SiteFooter
        addressLines={d.contact.addressLines ?? []}
        phones={d.contact.phones ?? []}
        phoneHrefs={d.contact.phoneHrefs ?? []}
        email={d.contact.email ?? "info@thalasses.com"}
        careersEmail={d.site.careers?.careersEmail ?? "creteholidayhome@gmail.com"}
        socials={d.site.socials ?? []}
        operatingLicence={d.site.legal?.operatingLicence ?? ""}
        operatingLicenceLabel={d.site.legal?.operatingLicenceLabel ?? "Permission of legality"}
      />
    </div>
  );
}
