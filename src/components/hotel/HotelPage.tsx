import Image from "next/image";
import Link from "next/link";

import HotelHero from "./HotelHero";
import { FooterReveal } from "@/components/motion/FooterReveal";
import { LiquidCards } from "@/components/motion/LiquidCards";
import HotelMotion from "./HotelMotion";
import {
  DISTANCES,
  ESTATE,
  EXPERIENCES,
  EXPERIENCE_GROUPS,
  FOOTER,
  HERO,
  MANIFESTO,
  PRESS,
  SECTION_QUOTE,
  VILLAS,
} from "./hotel-data";

/**
 * DIRECTION F — "THE CRETAN HOTEL".
 *
 * A yes/no prototype, not a fifth entry in a beauty contest. The genre is the
 * dense, warm, credible luxury-hotel homepage, calibrated on the STRUCTURE and
 * DENSITY of a same-island competitor and on none of its identity.
 *
 * The bet it makes: the previous rounds all argued for restraint and restraint
 * has been rejected six times. This one is full — Book Now pinned top-right, a
 * slow hero, six villa cards with facts and two buttons each, twenty-one
 * experiences grouped by kind, weddings, distances, a press wall, a real
 * footer with the licence in it.
 *
 * Everything on it resolves against the registry. Where the registry is silent —
 * the section quote, the group's sister properties, most of the press wall — the
 * slot is built and labelled rather than filled with something plausible.
 *
 * THIS IS A SERVER COMPONENT. `hotel-data.ts` reads the villa registry through
 * `@/lib/content`, which is `server-only`; the hero's slider is the one piece
 * that needs the browser and it lives in `HotelHero.tsx`. So the whole of this
 * direction's JavaScript is three crossfading images.
 */

export function HotelPage() {
  return (
    <div data-look="hotel">
      {/*
        PHASE 1 MOTION. A client island that mounts nothing under reduced
        motion and imports its libraries only after paint — see HotelMotion.
      */}
      <HotelMotion />

      {/* ---------------------------------------------------------- BAR -- */}
      <header className="ho-bar">
        <Link className="ho-mark" href="/">
          Thalasses Villas
        </Link>
        <nav className="ho-nav" aria-label="Sections">
          <a href="#villas">The Villas</a>
          <a href="#experiences">Experiences</a>
          <a href="#weddings">Weddings</a>
          <a href="#crete">Discover Crete</a>
          <a href="#contact">Contact</a>
        </nav>
        {/* Always top-right, on every scroll position. The genre's one rule. */}
        <a className="ho-book" href={FOOTER.booking} rel="noopener">
          Book Now
        </a>
      </header>

      {/* `id="main"` is the skip link's target. The site shell gives every
          other page one via PageShell; this page renders its own `<main>`,
          so it states it here. Without it the skip link points at nothing. */}
      <main id="main">
        <HotelHero
          frames={HERO}
          line={MANIFESTO.line}
          paragraph={MANIFESTO.paragraph}
          status={MANIFESTO.status}
        />

        {/* ----------------------------------------------------- VILLAS -- */}
        <section className="ho-section" id="villas">
          <div className="ho-wrap">
            <div className="ho-head">
              <div>
                <p className="ho-eyebrow">The Villas</p>
                <h2>Five houses, and the estate that holds them</h2>
              </div>
            </div>

            {/*
              THE ONE LEVEL-3 SHADER ON THE PAGE, and the directive puts it
              here: the villa cards, on an otherwise Level-1 grid. Scoped to
              this grid by id so the twenty-one experience cards below — which
              must stay scannable — never get it.
            */}
            <LiquidCards selector="#villas .ho-card-figure" />

            <div className="ho-grid">
              {VILLAS.map((v) => (
                <article className="ho-card" key={v.slug}>
                  <figure className="ho-card-figure">
                    <Image
                      src={v.frame.src}
                      alt={v.frame.alt}
                      width={800}
                      height={600}
                      sizes="(min-width: 72rem) 22vw, (min-width: 48rem) 45vw, 92vw"
                      quality={80}
                    />
                  </figure>
                  <div className="ho-card-body">
                    <h3>{v.name}</h3>
                    <p>{v.lines[0]}</p>
                    <p>{v.lines[1]}</p>
                    <div className="ho-actions">
                      <a className="ho-btn" href={`/en/villas/${v.slug}`}>
                        Explore
                      </a>
                      <a className="ho-btn ho-btn--solid" href={v.book ?? FOOTER.booking} rel="noopener">
                        Check availability
                      </a>
                    </div>
                  </div>
                </article>
              ))}

              {/*
                The sixth card, larger, and it ENQUIRES rather than books — the
                estate is enquiry-only by the owner's decision (T-158), so a
                Book button here would promise a flow that does not exist.
              */}
              <article className="ho-card ho-card--wide">
                <figure className="ho-card-figure">
                  <Image
                    src={ESTATE.frame.src}
                    alt={ESTATE.frame.alt}
                    width={1200}
                    height={675}
                    sizes="(min-width: 48rem) 46vw, 92vw"
                    quality={80}
                  />
                </figure>
                <div className="ho-card-body">
                  <h3>{ESTATE.name}</h3>
                  <p>{ESTATE.lines[0]}</p>
                  <p>{ESTATE.lines[1]}</p>
                  <div className="ho-actions">
                    <a className="ho-btn" href="/en/the-estate">
                      Explore
                    </a>
                    <a className="ho-btn ho-btn--solid" href="/en/contact">
                      Enquire
                    </a>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ EXPERIENCES -- */}
        <section className="ho-section ho-section--sand" id="experiences">
          <div className="ho-wrap">
            <div className="ho-head">
              <div>
                <p className="ho-eyebrow">Experiences</p>
                <h2>Twenty-one things we can arrange</h2>
                <p className="ho-lede">
                  Grouped by where they happen. The wedding has its own section below; the
                  helipad and the chauffeur belong to arrival, and sit under Discover Crete.
                </p>
              </div>
            </div>

            {EXPERIENCE_GROUPS.map((group) => (
              <div className="ho-group" key={group}>
                <h3>{group}</h3>
                <div className="ho-grid">
                  {(EXPERIENCES[group] ?? []).map((e) => (
                    <article className={`ho-card${e.needsImagery ? " ho-card--text" : ""}`} key={e.slug}>
                      {e.frame ? (
                        <figure className="ho-card-figure">
                          <Image
                            src={e.frame.src}
                            alt={e.frame.alt}
                            width={800}
                            height={600}
                            sizes="(min-width: 72rem) 22vw, (min-width: 48rem) 45vw, 92vw"
                            quality={80}
                          />
                        </figure>
                      ) : null}
                      <div className="ho-card-body">
                        <h3>{e.name}</h3>
                        {e.blurb ? <p>{e.blurb}</p> : null}
                        {/*
                          Said out loud rather than papered over. Fourteen of the
                          twenty-one wait on licensed stock under Tier
                          B-Experiences; borrowing a picture of something
                          adjacent would be the dishonest fix.
                        */}
                        {e.needsImagery ? <p className="ho-tosource">Imagery to source</p> : null}
                        <div className="ho-actions">
                          <a className="ho-btn" href={`/en/experiences/${e.slug}`}>
                            Explore
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------ THE QUOTE ---- */}
        <section className="ho-section ho-quote">
          <div className="ho-wrap">
            {SECTION_QUOTE.text ? (
              <blockquote>{SECTION_QUOTE.text}</blockquote>
            ) : (
              /*
                Deliberately empty. A mantinada is a real cultural form with real
                authorship; writing a plausible one and setting it large on a
                Cretan family's own site would be exactly the invention this
                project forbids.
              */
              <p className="ho-slot">{SECTION_QUOTE.placeholder}</p>
            )}
          </div>
        </section>

        {/* --------------------------------------------------- WEDDINGS -- */}
        <section className="ho-section" id="weddings">
          <div className="ho-wrap">
            <div className="ho-head">
              <div>
                <p className="ho-eyebrow">Weddings &amp; Events</p>
                <h2>Thalasses Rituals</h2>
                <p className="ho-lede">
                  The estate&rsquo;s wedding venue, with a 150 m² salt-water pool. The whole
                  property can be taken for the weekend.
                </p>
              </div>
              <div className="ho-actions">
                <a className="ho-btn" href="/en/weddings">
                  Explore
                </a>
                <a className="ho-btn ho-btn--solid" href="/en/contact">
                  Enquire
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------- CRETE --- */}
        <section className="ho-section ho-section--sand" id="crete">
          <div className="ho-wrap">
            <div className="ho-head">
              <div>
                <p className="ho-eyebrow">Discover Crete</p>
                <h2>Where you are</h2>
                {/*
                  THE CHAUFFEUR IS NAMED HERE, and it was not.

                  `hotel-data.ts` says the three "Service" experiences are placed
                  where they belong rather than in the grid — the wedding in its
                  own section, "the helipad and the chauffeur are arrival, and sit
                  in Discover Crete". The helipad did. The chauffeur did not: the
                  line said "Arrival by car", which is how anyone arrives anywhere
                  and is not the offer. One of twenty-one experiences was
                  reorganised out of existence, which is the one thing the content
                  rule forbids, and the parity guard found it.

                  The wording is the registry's own: Thalasses meets guests at the
                  airport or the port and drives them to the villa.
                */}
                <p className="ho-lede">
                  Pigianos Kampos, on the north coast between Rethymno and Heraklion. We can meet
                  you at the airport or the port and drive you here, or you can arrive by
                  helicopter to the estate&rsquo;s own pad.
                </p>
              </div>
            </div>

            {/* Every figure from the locked distance table, none rounded. */}
            <div className="ho-distances">
              {DISTANCES.map((d) => (
                <div key={d.name}>
                  <span>{d.name}</span>
                  <b>{d.value}</b>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------- PRESS --- */}
        <section className="ho-section">
          <div className="ho-wrap">
            <div className="ho-head">
              <div>
                <p className="ho-eyebrow">Press &amp; Awards</p>
                <h2>What has been written</h2>
              </div>
            </div>

            <div className="ho-press">
              {PRESS.real.map((p) => (
                <a key={p.title} href={p.href} rel="noopener noreferrer" target="_blank">
                  <strong>{p.title}</strong>
                  <em>{p.detail}</em>
                </a>
              ))}
              {/*
                Labelled slots, not filler. The inventory holds exactly one
                mention; a press wall padded with invented accolades is the
                fastest way to lose a client.
              */}
              {Array.from({ length: PRESS.slots }, (_, i) => (
                <div className="ho-press-slot" key={i}>
                  {PRESS.slotLabel}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------- FOOTER ---- */}
        {/*
          THE UNVEIL, KEPT — WITH F'S OWN CONTENT AT LEVEL 1.
          The mechanic is worth keeping: a fixed layer behind an opaque page,
          revealed as the content scrolls off, with no scroll listener and no
          way to shift layout. What went is the set-piece that was wrapped
          around it — an oversized wordmark on Direction D's footer, built
          before D-001 was recorded. `MOTION-DIRECTIVE.md` puts the footer at
          Level 1: this is a real hotel footer with contact, booking, socials
          and the licence, revealed quietly.
        */}
        <div className="footer-reveal">
          <FooterReveal selector=".ho-footer" />
        <footer className="ho-footer" id="contact">
          <div className="ho-wrap">
            <div className="ho-footer-grid">
              <div>
                <h4>Thalasses Villas</h4>
                <ul>
                  <li>Pigianos Kampos</li>
                  <li>Rethymno, Crete</li>
                  <li>
                    <a href={`mailto:${FOOTER.email}`}>{FOOTER.email}</a>
                  </li>
                  {FOOTER.phones.map((t) => (
                    <li key={t}>
                      <a href={`tel:${t.replace(/\s/g, "")}`}>{t}</a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4>Book</h4>
                <ul>
                  <li>
                    <a href={FOOTER.booking} rel="noopener">
                      Check availability
                    </a>
                  </li>
                  <li>
                    <a href="/en/contact">Enquire about the estate</a>
                  </li>
                </ul>
              </div>

              <div>
                <h4>Follow</h4>
                <ul>
                  {FOOTER.socials.map((s) => (
                    <li key={s.platform}>
                      <a href={s.url} rel="noopener noreferrer" target="_blank">
                        {s.platform}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4>{FOOTER.group.name}</h4>
                <ul>
                  {FOOTER.group.properties.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                {/*
                  Marked, not asserted. Nothing in the inventory links these
                  brands to Thalasses, and a footer claiming a corporate
                  relationship is making a legal statement.
                */}
                <p className="ho-draft" style={{ marginTop: "0.6rem" }}>
                  {FOOTER.group.status}
                </p>
              </div>
            </div>

            {/* Greek short-term-rental rules require this on every page. */}
            <p className="ho-licence">
              Permission of legality {FOOTER.licence} · © Thalasses Villas
            </p>
          </div>
        </footer>
        </div>
      </main>
    </div>
  );
}
