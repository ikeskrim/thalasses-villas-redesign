"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { SHARED, type Look } from "./looks-data";

/**
 * DIRECTION E — "TYPE-ALIVE".
 *
 * The other three prototypes are photographs with typography on them. This one
 * is typography with photographs in it, and the inversion answers a measured
 * fact rather than a taste: the grading pass found **33 hero-grade frames in
 * 871**, and five daylight ones in the entire library. A photo-led direction is
 * rationed by material that does not exist.
 *
 * WHY THIS DOES NOT SHARE THE OTHER THREE'S DOM.
 *
 * `tests/looks.spec.ts` asserts Aegean, Editorial and Golden render from one
 * component, because that is what makes "a token swap, not a rebuild" a
 * measured claim. This one is excluded, and the exclusion is the finding rather
 * than an exception:
 *
 *   - The act NUMERALS are content here, not decoration. Editorial got away
 *     with a CSS counter because its numbers label sections; here "01" sits in
 *     a kicker beside a title and is read aloud in sequence.
 *   - The MARGINALIA have no home in the photo-led markup at all. A sidenote is
 *     a third column, not a caption.
 *   - The MARQUEE needs its content twice — a duplicate node is the only way to
 *     hide the loop seam — and one of the copies must be hidden from screen
 *     readers and removed entirely under reduced motion.
 *
 * Faking those from the shared component would have meant pseudo-element
 * numerals nobody can select, a sidenote crammed into a `figcaption`, and a
 * marquee that stutters. The honest report is that for the first three
 * directions the directive's "composition swap" claim held and was tested; for
 * this one it is a genuine composition change.
 */

/** Reveal once on entry. Same shape as the photo-led looks, deliberately. */
function useReveal<T extends HTMLElement>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setSeen(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "-8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return [ref, seen];
}

function Section({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  const [ref, inView] = useReveal<HTMLElement>();
  return (
    <section className={className} ref={ref} data-in={inView ? "true" : "false"}>
      {children}
    </section>
  );
}

/**
 * The experience register, as a marquee.
 *
 * Every one of these is a real experience from the registry — this list is the
 * same content the live `/en/experiences` index carries, trimmed to names. It
 * moves because a static list of twenty-one is a wall; it moves SLOWLY because
 * the brief's own avoid-list puts the gimmick threshold at 80 px/s.
 */
const REGISTER = [
  "Private chef",
  "In-villa massage",
  "Wine tasting",
  "Olive oil tasting",
  "Cooking class",
  "Boat trips",
  "Sunset cruise",
  "Diving",
  "Sea kayaking",
  "Hiking the gorges",
  "Bike tours",
  "Jeep safari",
  "Yoga",
  "Babysitting",
  "Car hire",
  "Airport transfer",
  "Helipad arrival",
  "Wedding planning",
  "Photography",
  "Grocery service",
  "Laundry",
] as const;

export default function TypeAlivePage({ look }: { look: Look }) {
  const { hero, act: actFrame, strip } = look;
  const [heroRef, heroIn] = useReveal<HTMLElement>();

  /*
   * The weight settle fires once, after paint, rather than on scroll.
   * `requestAnimationFrame` twice is the reliable way to be sure the initial
   * `font-variation-settings` has actually been committed — set it in the same
   * frame and the browser collapses both values into one and nothing animates.
   */
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setSettled(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  return (
    <div data-look="type-alive">
      <div className="te-ambient" aria-hidden="true" />

      <nav className="lk-switch" aria-label="Choose a look">
        <Link href="/looks/aegean">Aegean</Link>
        <Link href="/looks/editorial">Editorial</Link>
        <Link href="/looks/golden">Golden</Link>
        <Link href="/looks/type-alive" aria-current="page">
          Type
        </Link>
        <Link href="/looks">All four</Link>
      </nav>

      <main className="te-main">
        {/* ------------------------------------------------------- HERO -- */}
        <section className="te-hero te-s1" ref={heroRef} data-in={heroIn ? "true" : "false"}>
          {/* The one vertical kicker on the page. Once is restraint; twice is a tic. */}
          <p className="te-rail" aria-hidden="true">
            Rethymno · Crete
          </p>

          <div className="te-wrap te-hero-grid">
            <div>
              <p className="te-kicker te-in">{SHARED.eyebrow}</p>
              {/*
                TWO LINES BY CONSTRUCTION, not by measure — and this is a CLS fix
                rather than a typographic preference.
                Set as one wrapping line, the weight settle flipped the headline
                between two lines and three on a phone: "Living" gains real width
                between wght 300 and 600, and at 390px the pair sat exactly on the
                wrap boundary. Everything below the hero jumped 46px — one line —
                measured at 0.0376 CLS. Locking each word to its own line means the
                settle can change the WIDTH of "Living" and never the line count.
              */}
              <h1 className="te-display">
                <span className="te-settle te-line" data-settled={settled ? "true" : "false"}>
                  {SHARED.headline}
                </span>
                <span className="te-line">{SHARED.headlineTail}</span>
              </h1>
              <p className="te-lede te-in">{SHARED.lede}</p>
              <p className="te-draft te-in">{SHARED.ledeStatus}</p>
            </div>

            {/*
              THE RESERVED SET-PIECE. One of roughly thirty-three hero-grade
              frames in the whole library, shown in full colour and full
              treatment — and still framed rather than full-bleed, because
              scarcity only reads as editing if the rest of the page is
              disciplined.
            */}
            <figure className="te-frame te-setpiece te-in">
              <span className="te-duotone">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={hero.src}
                  alt={hero.subject}
                  width={hero.w}
                  height={hero.h}
                  fetchPriority="high"
                  decoding="async"
                />
              </span>
              <figcaption className="te-caption">{hero.subject}</figcaption>
            </figure>
          </div>
        </section>

        {/* ----------------------------------------------------- LITANY -- */}
        <Section className="te-litany te-s1">
          <div className="te-wrap">
            <p className="te-kicker te-in">
              <span className="te-num">01</span> The days
            </p>
            {/* An ordered list, because it is one — and a screen reader says so. */}
            <ol>
              {SHARED.litany.map((line) => (
                <li key={line}>
                  <span className="te-display-l te-in te-hoverable">{line}</span>
                </li>
              ))}
            </ol>
          </div>
        </Section>

        {/* -------------------------------------------------------- ACT -- */}
        <Section className="te-act te-s2">
          <div className="te-wrap te-act-grid">
            {/*
              MARGINALIA. Facts hang in the margin as annotations rather than
              sitting in cards — the brief's "sidenotes, not boxes". Every
              figure here resolves against the locked capacity table.
            */}
            <aside className="te-margin te-in">
              <span>
                <b>50 m</b>
                to the private beach
              </span>
              <span>
                <b>5</b>
                villas on the estate
              </span>
            </aside>

            <div>
              <p className="te-kicker te-in">
                <span className="te-num">02</span> {SHARED.actLabel}
              </p>
              <h2 className="te-display-m te-in">
                {SHARED.actGerund} — {SHARED.actTail}
              </h2>
              <p className="te-lede te-in">
                The estate stands on the north coast, fifty metres above its own beach.
              </p>
              <p className="te-body te-in">
                Everything on this page is set at one of two sizes: a line you read from
                across the room, and a line you read up close. The gap between them is the
                hierarchy, and it is why the photographs can be small.
              </p>
              <p className="te-draft te-in">{SHARED.actStatus}</p>
            </div>

            {/* A detail crop, duotone, ≤380px. The library's B-grade material,
                used as texture rather than asked to carry a scene. */}
            <figure className="te-frame te-in">
              <span className="te-duotone">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={actFrame.src}
                  alt={actFrame.subject}
                  width={actFrame.w}
                  height={actFrame.h}
                  loading="lazy"
                  decoding="async"
                />
              </span>
              <figcaption className="te-caption">{actFrame.subject}</figcaption>
            </figure>
          </div>
        </Section>

        {/* --------------------------------------------------- REGISTER -- */}
        <Section className="te-register te-s3">
          <div className="te-wrap">
            <p className="te-kicker te-in">
              <span className="te-num">03</span> The register
            </p>
            <h2 className="te-display-m te-in">Twenty-one things you can arrange</h2>
          </div>

          <div className="te-marquee">
            <div className="te-marquee-track">
              <div className="te-marquee-run">
                {REGISTER.map((r) => (
                  <span className="te-chip" key={r}>
                    {r}
                  </span>
                ))}
              </div>
              {/*
                The seam copy. `aria-hidden` so the list is announced once, and
                removed entirely under reduced motion where it would just be a
                second static row saying the same thing.
              */}
              <div className="te-marquee-run te-marquee-copy" aria-hidden="true">
                {REGISTER.map((r) => (
                  <span className="te-chip" key={`copy-${r}`}>
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Three treated windows — the library at the size this look uses it. */}
          <div className="te-wrap te-windows">
            {strip.slice(0, 3).map((f) => (
              <figure className="te-frame te-in te-window" key={f.src}>
                <span className="te-duotone">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.src} alt={f.subject} width={f.w} height={f.h} loading="lazy" decoding="async" />
                </span>
              </figure>
            ))}
          </div>
        </Section>

        {/* ---------------------------------------------------- BOOKING -- */}
        <Section className="te-book te-s1">
          <div className="te-wrap">
            <p className="te-kicker te-in">Reservations</p>
            <h2 className="te-display-l te-in">Check availability</h2>
            {/* The real engine. Dates-only, lang=en, per T-156/T-159. */}
            <a className="te-cta" href="https://thalassesvillas.reserve-online.net/?lang=en" rel="noopener">
              Book — the real engine
            </a>
          </div>
        </Section>
      </main>
    </div>
  );
}
