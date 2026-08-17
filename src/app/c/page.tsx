import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { KenBurns } from "@/components/motion/KenBurns";
import { Magnetic } from "@/components/motion/Magnetic";
import { ImageReveal, Reveal } from "@/components/motion/Reveal";
import { DragRegister } from "@/components/sections/DragRegister";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { BookingLedger } from "@/components/ui/BookingLedger";
import { Clause } from "@/components/ui/Clause";
import { Ledger } from "@/components/ui/Ledger";
import { getHomepageData } from "@/lib/homepage";
import { ACTS, LITANY } from "@/app/home-data";

export const metadata: Metadata = {
  title: "C — Bold Immersive",
  robots: { index: false, follow: false },
};

/**
 * DIRECTION C — BOLD IMMERSIVE.
 *
 * Product-confident rather than hospitality-polite. The organising idea is
 * SCALE CONTRAST: a 22vw numeral against 11px letterspaced micro on the same
 * line, type that overlaps and crops its own photograph, and a page that never
 * gives you a calm empty gutter to rest in.
 *
 * Where A withholds and B composes, C asserts. The estate's numbers are the
 * hero of their own beat at display scale; the villa names are set larger than
 * the photographs they sit on; the experiences run as a dense marquee of names
 * rather than as cards.
 *
 * Same facts, same booking links, same photographs as A and B.
 */
export default function DirectionC() {
  const d = getHomepageData();

  return (
    <div className="dir dir-c">
      <main id="main">
        {/* Type over image, cropping it. The offer named in the first second. */}
        <section className="c-hero">
          <KenBurns
            src={d.frame.hero.path}
            alt={d.frame.hero.alt}
            width={d.frame.hero.w}
            height={d.frame.hero.h}
            objectPosition="50% 52%"
          />
          <div className="c-hero-wash" aria-hidden="true" />
          <div className="c-hero-type">
            <span className="c-mega">SEAFRONT</span>
            <span className="c-mega c-mega--out">CRETE</span>
          </div>
          <div className="c-hero-copy">
            <p className="c-hero-lede display c3">
              Five private villas. One beach. Fifty metres from the door.
            </p>
            <p className="c-hero-actions">
              <Magnetic>
                <Link href="#collection" className="c-btn micro" data-cursor="View">
                  See the five
                </Link>
              </Magnetic>
              <a
                className="c-btn c-btn--ghost micro"
                href={`https://${d.host}/?lang=en`}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="Book"
              >
                Check availability
              </a>
            </p>
          </div>
        </section>

        {/* THE NUMBERS AS THE BEAT. Not a footnote — the loudest thing here. */}
        <section className="c-numbers">
          <Reveal>
            <p className="micro c-mark">The estate, taken as one house</p>
          </Reveal>
          <ul className="c-number-row">
            {d.figures.map((f) => (
              <li key={f.label} className="c-number">
                <span className="c-number-value tabular">{f.value}</span>
                <span className="micro c-number-label">{f.label}</span>
              </li>
            ))}
          </ul>
          <Reveal index={1}>
            <p className="c-numbers-cta">
              <Magnetic>
                <Link href={d.cta.href} className="c-btn micro" data-cursor="Enquire">
                  {d.cta.label}
                </Link>
              </Magnetic>
            </p>
          </Reveal>
        </section>

        {/* Litany as a stack of oversized statements, each with a hairline. */}
        <section className="c-statements">
          {LITANY.map((l, i) => (
            <Reveal key={l.text} index={i} className="c-statement">
              <span className="tabular c-statement-index">{String(i + 1).padStart(2, "0")}</span>
              <p className="display c-statement-text">{l.text}</p>
            </Reveal>
          ))}
        </section>

        {/* The three acts, flattened into dense fact blocks on deep ground. */}
        <section className="c-acts">
          {ACTS.map((a) => (
            <div key={a.title} className="c-act">
              <div className="c-act-media">
                <ImageReveal className="c-act-frame">
                  <Image src={a.image} alt={a.alt} fill sizes="(max-width: 767px) 100vw, 42vw" quality={80} style={{ objectFit: "cover" }} />
                </ImageReveal>
              </div>
              <div className="c-act-body">
                <p className="micro c-mark">{a.eyebrow}</p>
                <h2 className="display c2 c-act-title">{a.title}</h2>
                <ul className="c-act-list">
                  {a.cards.map((c) => (
                    <li key={c.title}>
                      <span className="c-act-card-title">{c.title}</span>
                      <span className="c-act-card-desc">{c.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </section>

        {/* Five villas, names set larger than their photographs. */}
        <section id="collection" className="c-collection">
          <Reveal>
            <p className="micro c-mark">Five houses</p>
          </Reveal>
          <div className="c-collection-grid">
            {d.villas.all.map((c) => (
              <Link key={c.villa.id} href={`/en/villas/${c.villa.slug}`} className="c-villa">
                <ImageReveal className="c-villa-frame">
                  <Image
                    src={c.villa.gallery.heroImage ?? d.frame.pool.path}
                    alt={`${c.villa.name}, Thalasses Villas`}
                    fill
                    sizes="(max-width: 767px) 100vw, 33vw"
                    quality={80}
                    style={{ objectFit: "cover" }}
                  />
                </ImageReveal>
                <span className="c-villa-name display">{c.villa.name}</span>
                <span className="c-villa-spec micro">
                  {c.villa.specs.bedrooms} bd · {c.villa.specs.bathrooms} ba · sleeps{" "}
                  {c.villa.specs.maxGuests}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* The signal, at maximum. */}
        <section className="c-signal">
          <Image
            src={d.frame.path.path}
            alt={d.frame.path.alt}
            fill
            sizes="100vw"
            quality={82}
            style={{ objectFit: "cover" }}
          />
          <div className="c-signal-wash" aria-hidden="true" />
          <div className="c-signal-type">
            <span className="micro c-mark">The only ones with one</span>
            <span className="c-mega c-mega--signal">HELIPAD</span>
          </div>
        </section>

        <section className="c-register">
          <Reveal>
            <p className="micro c-mark">{d.rows.length} things we arrange</p>
            <div className="clause-field">
              <Clause gerund="Asking" tail="For any of the following" scale="c2" as="h2" />
            </div>
          </Reveal>
          <DragRegister rows={d.rows} />
        </section>

        <section className="c-where">
          <Reveal>
            <p className="micro c-mark">From the door</p>
          </Reveal>
          <ul className="c-where-grid">
            {(d.location.distances ?? []).slice(0, 8).map((e) => (
              <li key={e.name} className="c-where-cell">
                <span className="c-where-value tabular display">{e.value}</span>
                <span className="micro c-where-name">{e.name}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="c-close">
          <Ledger entries={d.figures} className="c-close-ledger" />
          <p className="c-numbers-cta">
            <Magnetic>
              <a
                className="c-btn micro"
                href={`https://${d.host}/?lang=en`}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="Book"
              >
                Check availability
              </a>
            </Magnetic>
          </p>
        </section>
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
