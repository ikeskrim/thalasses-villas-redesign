import type { Metadata } from "next";
import Link from "next/link";

import { KenBurns } from "@/components/motion/KenBurns";
import { Reveal } from "@/components/motion/Reveal";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { BookingLedger } from "@/components/ui/BookingLedger";
import { Clause } from "@/components/ui/Clause";
import { Field } from "@/components/ui/Field";
import { Ledger } from "@/components/ui/Ledger";
import { getHomepageData } from "@/lib/homepage";
import { LITANY } from "@/app/home-data";

export const metadata: Metadata = {
  title: "A — Night Cinema",
  robots: { index: false, follow: false },
};

/**
 * DIRECTION A — NIGHT CINEMA.
 *
 * The Ultima Gstaad register, transposed. Three values and no more: near-black
 * ground, white ink, one grey. Every colour on the page comes out of the
 * photographs — which is the whole argument, because the photography here is a
 * single golden-hour grade and a dark ground is the only setting that lets it
 * be the loudest thing on screen.
 *
 * Composition is a reel, not a page: full-bleed frames butted edge to edge with
 * a single line of type over each. No grid, no cards, no ledger chrome until
 * the very end. The litany becomes intertitles.
 *
 * Same facts, same booking links, same photographs as B and C — see
 * `src/lib/homepage.ts`.
 */
export default function DirectionA() {
  const d = getHomepageData();

  return (
    <div className="dir dir-a">
      <main id="main">
        {/* One frame, held. The mark and one line. */}
        <section className="a-hero">
          <KenBurns
            src={d.frame.hero.path}
            alt={d.frame.hero.alt}
            width={d.frame.hero.w}
            height={d.frame.hero.h}
            objectPosition="50% 54%"
          />
          <div className="a-hero-veil" aria-hidden="true" />
          <div className="a-hero-copy">
            <p className="micro a-eyebrow">Pigianos Kampos · Rethymno · Crete</p>
            <div className="clause-field">
              <Clause gerund="Living" tail="Unlimited" scale="c1" animate as="h1" />
            </div>
            <p className="a-lede">
              Five seafront villas, one private beach fifty metres from the door.
            </p>
          </div>
        </section>

        {/* INTERTITLES. The litany, one line per frame, full-bleed. */}
        {[d.frame.horizon, d.frame.beach, d.frame.dusk].map((f, i) => (
          <Field key={f.n} src={f.path} alt={f.alt} horizonY={f.horizonY} height="86svh">
            <div className="a-title-card">
              <p className="a-intertitle display">{LITANY[i]!.text}</p>
            </div>
          </Field>
        ))}

        {/* THE FIVE, as five frames. No grid — a reel does not have a grid. */}
        <section className="a-reel" aria-label="The five villas">
          <p className="micro a-section-mark">The collection · five houses</p>
          {d.villas.all.map((c, i) => (
            <Link key={c.villa.id} href={`/en/villas/${c.villa.slug}`} className="a-plate">
              <Field
                src={c.villa.gallery.heroImage ?? d.frame.pool.path}
                alt={`${c.villa.name}, Thalasses Villas`}
                height="92svh"
              >
                <div className="a-plate-copy">
                  <span className="micro a-plate-index">{c.ordinal}</span>
                  <span className="display c2 a-plate-name">{c.villa.name}</span>
                  <span className="a-plate-clause micro">
                    {c.gerund} — {c.tail}
                  </span>
                  <span className="micro a-plate-spec">
                    {c.villa.specs.bedrooms} bedrooms · sleeps {c.villa.specs.maxGuests}
                    {i === 4 ? " · adults only" : ""}
                  </span>
                </div>
              </Field>
            </Link>
          ))}
        </section>

        {/* The estate, stated quietly. Numbers are the only ornament. */}
        <section className="a-estate">
          <Reveal>
            <p className="micro a-section-mark">All four, taken together</p>
            <div className="clause-field a-estate-clause">
              <Clause gerund="Gathering" tail="All four, one gate" scale="c1" as="h2" />
            </div>
            <Ledger entries={d.figures} className="a-ledger" />
            <p className="a-estate-cta">
              <Link href={d.cta.href} className="micro a-link">
                {d.cta.label}
              </Link>
            </p>
          </Reveal>
        </section>

        {/* The signal. One frame, one claim. */}
        <Field src={d.frame.path.path} alt={d.frame.path.alt} height="94svh">
          <div className="a-title-card">
            <div className="clause-field">
              <Clause gerund="Landing" tail="The only seafront villas with helipad" scale="c1" as="h2" />
            </div>
          </div>
        </Field>

        {/* Experiences, as a plain index. Twenty-one names, no cards. */}
        <section className="a-index">
          <Reveal>
            <p className="micro a-section-mark">{d.rows.length} things we arrange</p>
            <ul className="a-index-list">
              {d.rows.map((r) => (
                <li key={r.slug} className="a-index-row">
                  <span className="display c4">{r.name}</span>
                  <span className="micro a-index-cat">{r.category ?? ""}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        {/* Where it is. Figures only. */}
        <section className="a-where">
          <Reveal>
            <p className="micro a-section-mark">From the door</p>
            <dl className="a-where-list">
              {(d.location.distances ?? []).map((e) => (
                <div key={e.name} className="a-where-row">
                  <dt className="a-where-name">{e.name}</dt>
                  <dd className="tabular a-where-value">{e.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </section>

        <Field src={d.frame.wedding.path} alt={d.frame.wedding.alt} height="90svh">
          <div className="a-title-card">
            <div className="clause-field">
              <Clause gerund="Marrying" tail="On sand, beside the water" scale="c1" as="h2" />
            </div>
            <p className="a-estate-cta">
              <Link href="/en/weddings" className="micro a-link">
                Plan the day
              </Link>
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
