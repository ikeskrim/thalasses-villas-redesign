import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { KenBurns } from "@/components/motion/KenBurns";
import { Magnetic } from "@/components/motion/Magnetic";
import { Preloader } from "@/components/motion/Preloader";
import { ImageReveal, Reveal } from "@/components/motion/Reveal";
import { ActsSection } from "@/components/sections/ActsSection";
import { CoastLine } from "@/components/sections/CoastLine";
import { DragRegister } from "@/components/sections/DragRegister";
import { EstateMap } from "@/components/sections/EstateMap";
import { Litany } from "@/components/sections/Litany";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { BookingLedger } from "@/components/ui/BookingLedger";
import { Clause } from "@/components/ui/Clause";
import { Field } from "@/components/ui/Field";
import { Ledger } from "@/components/ui/Ledger";
import { villaCta } from "@/lib/booking";
import { getHomepageData } from "@/lib/homepage";
import { ACTS, HOTSPOTS, LITANY } from "./home-data";

export const metadata: Metadata = {
  title: "Thalasses Villas — Living Unlimited",
  description:
    "Five seafront villas in Pigianos Kampos, Rethymno, Crete, with a private beach fifty metres from the door.",
  /*
   * The last route without one. Every other page declares its canonical; the
   * homepage is the one an old address is most likely to reach by a redirect
   * chain, so it is the one that most needs to name itself. The hreflang
   * scaffolding that will sit beside this is in `layout.tsx`, commented until
   * /el exists.
   */
  alternates: { canonical: "/" },
};

/**
 * DIRECTION D — the production homepage.
 *
 * The light ground wins, carrying A's composition and C's confidence, and none
 * of the failure modes of either.
 *
 * TAKEN FROM A: the reel — full-bleed frames that read like film plates, the
 * litany as intertitles at one line per screen, and one villa per viewport.
 * NOT taken: the near-black ground, and the edge-butted airless stacking. Every
 * plate now gets `--section-y` of air before the next idea.
 *
 * TAKEN FROM C: display confidence and the estate's numbers as their own beat.
 * NOT taken: 22vw type that crops its own frame, deliberate overflow, and names
 * set larger than the photographs they sit on. Display is capped at 96px and
 * every villa name sits BELOW its plate, never over it.
 *
 * The ground is limestone throughout with exactly TWO deep-pelagos interludes —
 * the last litany line, and the estate numbers. Contrast by rarity.
 *
 * One idea per viewport. Content resolves once, in `src/lib/homepage.ts`.
 */
export default function Home() {
  const d = getHomepageData();

  return (
    <>
      <Preloader />

      <div className="d">
        <main id="main">
          {/* ---------------------------------------------------- HERO ---- */}
          <section className="d-hero">
            <KenBurns
              src={d.frame.hero.path}
              alt={d.frame.hero.alt}
              width={d.frame.hero.w}
              height={d.frame.hero.h}
              objectPosition="50% 54%"
            />
            <div className="d-hero-scrim" aria-hidden="true" />
            <div className="canon d-hero-copy">
              <p className="micro d-eyebrow">Pigianos Kampos · Rethymno · Crete</p>
              <div className="clause-field">
                <Clause gerund="Living" tail="Unlimited" scale="c1" animate as="h1" />
              </div>
              {/* Working default per the directive. Names the offer in the
                  first second — seafront, private, Crete — rather than opening
                  on brand abstraction. Flagged, not asserted: the owner has not
                  signed off this line. (T-256) */}
              <p className="d-hero-lede">
                Five seafront villas, one private beach fifty metres from the door, on the north
                coast of Crete.
              </p>
            </div>
            <a href="#litany" className="d-cue micro" aria-label="Scroll to the next section">
              <span>Scroll</span>
              <span className="d-cue-line" aria-hidden="true" />
            </a>
          </section>

          {/* ------------------------------------- 01 THE LITANY ---------- */}
          {/* A's intertitles, on light ground. One line per screen; the fifth
              is the FIRST of exactly two dark interludes on this page. */}
          <Litany lines={LITANY} payoffGerund="Living" payoffTail="Whatever that means to you" />

          {/* ---------------------------------------- 02 THREE ACTS ------- */}
          <ActsSection acts={ACTS} />

          {/* ------------------------------------------ 03 ARRIVAL -------- */}
          {/* One statement, one frame. The claim's geographic scope is flagged
              for the owner in TODO (T-233) and is not restated here. */}
          <section className="canon d-statement">
            <Reveal>
              <p className="micro">03 — Arrival</p>
              <div className="clause-field d-statement-clause">
                <Clause
                  gerund="Landing"
                  tail="The only seafront villas with helipad"
                  scale="c2"
                  as="h2"
                />
              </div>
            </Reveal>
          </section>
          <Field
            src={d.frame.path.path}
            alt={d.frame.path.alt}
            height="72svh"
            className="d-bleed"
          />

          {/* --------------------------------------- 04 THE COLLECTION ---- */}
          {/* A's one-villa-per-viewport plates, with C's confident naming — but
              the name sits BELOW the frame, at display-l, never over it and
              never larger than it. */}
          <section id="collection" className="d-collection">
            <Reveal>
              <p className="micro d-collection-mark">04 — The Collection</p>
              <p className="d-collection-lede">
                Four houses behind one gate, and a fifth set apart.
              </p>
            </Reveal>

            {d.villas.all.map((c) => {
              const cta = villaCta(c.villa);
              const isPueblo = c.villa.slug === "villa-pueblo";
              return (
                <article
                  key={c.villa.id}
                  className={`d-plate${isPueblo ? " d-plate--apart" : ""}`}
                >
                  <Link href={`/en/villas/${c.villa.slug}`} className="d-plate-link">
                    <ImageReveal className="d-plate-frame">
                      <Image
                        src={c.src}
                        alt={`${c.villa.name}, Thalasses Villas`}
                        fill
                        sizes="100vw"
                        quality={82}
                        loading="lazy"
                        style={{ objectFit: "cover" }}
                      />
                    </ImageReveal>
                    <div className="canon d-plate-copy">
                      <span className="micro d-plate-index">
                        {c.ordinal}
                        {isPueblo ? " · Adults only" : ""}
                      </span>
                      <span className="display c2 d-plate-name collection-name">
                        {c.villa.name}
                      </span>
                      <span className="d-plate-clause">
                        <span className="display c4">{c.gerund}</span>{" "}
                        <span className="micro d-plate-tail">{c.tail}</span>
                      </span>
                      <span className="caption d-plate-spec tabular">
                        {c.villa.specs.bedrooms} bedrooms · {c.villa.specs.bathrooms} bathrooms ·
                        sleeps {c.villa.specs.maxGuests}
                        {c.villa.specs.sizeSqm ? ` · ${c.villa.specs.sizeSqm} m²` : ""}
                      </span>
                    </div>
                  </Link>
                  <p className="canon d-plate-cta">
                    <a
                      href={cta.href}
                      className="micro d-link"
                      target={cta.kind === "availability" ? "_blank" : undefined}
                      rel={cta.kind === "availability" ? "noopener noreferrer" : undefined}
                      data-cursor="Book"
                    >
                      Book {c.villa.name}
                    </a>
                  </p>
                </article>
              );
            })}
          </section>

          {/* ------------------------------------------- 05 THE ESTATE ---- */}
          {/* C's "numbers as a hero moment", done legibly: display-xl figures on
              the SECOND and last dark interlude, ghost numeral behind as texture
              only — it never sits under a legible figure. */}
          <section className="d-numbers on-dark">
            <span className="ghost ghost--right" aria-hidden="true">
              05
            </span>
            <div className="canon">
              <Reveal>
                <p className="micro">05 — The Estate</p>
                <p className="d-numbers-lede">
                  All four taken together, as one house.
                </p>
              </Reveal>
              <Ledger entries={d.figures} className="d-ledger" />
              <Reveal index={1}>
                <p className="d-numbers-cta">
                  <Magnetic>
                    <Link href={d.cta.href} className="micro d-link d-link--light" data-cursor="Enquire">
                      {d.cta.label}
                    </Link>
                  </Magnetic>
                </p>
              </Reveal>
            </div>
          </section>

          {/* The map is the second half of beat 05, so it does not re-announce. */}
          <EstateMap
            image={d.frame.map.path}
            alt={d.frame.map.alt}
            hotspots={HOTSPOTS}
            ledger={d.figures}
            ctaLabel={d.cta.label}
            ctaHref={d.cta.href}
            beat={null}
          />

          {/* ----------------------------------------- 06 EXPERIENCES ----- */}
          <section id="experiences" className="beat beat--wide d-register">
            <p className="micro">06 — Experiences</p>
            <div className="clause-field">
              <Clause gerund="Asking" tail="For any of the following" scale="c2" as="h2" />
            </div>
            <DragRegister rows={d.rows} />
          </section>

          {/* -------------------------------------------- 07 LOCATION ----- */}
          <CoastLine
            entries={d.location.distances ?? []}
            beaches={(d.location.nearby ?? []).map((n) => ({ name: n.name, distance: n.distance }))}
          />

          {/* -------------------------------------------- 08 WEDDINGS ----- */}
          <Field src={d.frame.wedding.path} alt={d.frame.wedding.alt} height="86svh">
            <div className="canon clause-field" style={{ padding: 0 }}>
              <p className="micro">08 — Weddings &amp; Events</p>
              <Clause gerund="Marrying" tail="On sand, beside the water" scale="c2" as="h2" />
              <p className="beat-cta">
                <Magnetic>
                  <Link
                    href="/en/weddings"
                    className="btn-primary btn-primary--light micro"
                    data-cursor="View"
                  >
                    Plan the day
                  </Link>
                </Magnetic>
              </p>
            </div>
          </Field>

          {/* ------------------------------------------------- PROOF ------ */}
          {/* Off the hero, where it was competing with the photograph, and set
              in the site's own type rather than as an imported colour badge. */}
          <section className="d-proof">
            <Reveal>
              <p className="micro d-proof-label">Featured in</p>
              <p className="display c3 d-proof-name">Condé Nast Traveller</p>
            </Reveal>
          </section>
        </main>
      </div>

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
    </>
  );
}
