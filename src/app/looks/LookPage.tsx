"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { SHARED, type Look } from "./looks-data";

/**
 * ONE COMPONENT. THREE LOOKS. THAT IS THE EXPERIMENT.
 *
 * The re-skin directive's structural claim is that changing direction is a
 * token, curation and choreography swap rather than a rebuild. This file is
 * where that claim is either true or false, because all three prototypes render
 * from exactly this markup and differ only in the `data-look` attribute on the
 * root and the photographs passed in.
 *
 * `tests/looks.spec.ts` asserts the resulting DOM is identical across the three
 * — same elements, same order, same classes — so nobody can quietly fork one of
 * them later and keep calling the exercise a re-skin.
 *
 * Two things had to be resisted while writing it:
 *
 *   Editorial's numbered acts wanted a `<span>01</span>` in the markup. They are
 *   a CSS counter instead. A numeral in the DOM would have been the first crack.
 *
 *   Golden Coast's terraced stack wanted per-line wrappers. It is `nth-child`
 *   margins instead.
 *
 * If either had genuinely needed different markup, the honest thing would have
 * been to report that a re-skin is not what this is. Neither did.
 */

/**
 * Reveal on entry, once, with no library — this page must not depend on the
 * site's motion stack.
 *
 * Returns a TUPLE rather than an object. An object carrying the ref meant every
 * read of its sibling field was a ref access during render, which is a real
 * rule and not a lint quibble: React cannot guarantee what a ref holds while
 * rendering.
 *
 * There is no `typeof IntersectionObserver === "undefined"` fallback. It looked
 * like defensiveness and was dead code twice over — effects do not run during
 * server rendering, and every browser that runs React 19 has had the API since
 * 2019. What it actually did was call setState synchronously inside an effect.
 * The case it pretended to cover, a reader with no JavaScript at all, is covered
 * where it belongs: a `<noscript>` rule in the layout.
 */
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

export default function LookPage({ look }: { look: Look }) {
  const { hero, act: actFrame, strip } = look;
  const [heroRef, heroIn] = useReveal<HTMLElement>();

  return (
    <div data-look={look.id}>
      {/* One thumb-reach between the three, because he is comparing them. */}
      <nav className="lk-switch" aria-label="Choose a look">
        <Link href="/looks/aegean" aria-current={look.id === "aegean" ? "page" : undefined}>
          Aegean
        </Link>
        <Link href="/looks/editorial" aria-current={look.id === "editorial" ? "page" : undefined}>
          Editorial
        </Link>
        <Link href="/looks/golden" aria-current={look.id === "golden" ? "page" : undefined}>
          Golden
        </Link>
        <Link href="/looks">All three</Link>
      </nav>

      <main className="lk-main">
        {/* ------------------------------------------------------- HERO -- */}
        <section className="lk-hero" ref={heroRef} data-in={heroIn ? "true" : "false"}>
          <div className="lk-hero-frame">
            {/*
              A plain <img>, not next/image. These prototypes are throwaway and
              must not depend on the site's image pipeline, its breakpoints or
              its quality table — if a look is chosen, the real build inherits
              all of that. `fetchPriority` keeps the hero the LCP element.
            */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero.src}
              alt={hero.subject}
              width={hero.w}
              height={hero.h}
              fetchPriority="high"
              decoding="async"
            />
          </div>
          <div className="lk-hero-scrim" aria-hidden="true" />
          <div className="lk-hero-copy">
            <p className="lk-eyebrow lk-reveal">{SHARED.eyebrow}</p>
            <h1 className="lk-headline lk-reveal">
              {SHARED.headline}
              <span className="lk-headline-tail">{SHARED.headlineTail}</span>
            </h1>
            <p className="lk-lede lk-reveal">{SHARED.lede}</p>
            <p className="lk-draft lk-reveal">{SHARED.ledeStatus}</p>
          </div>
        </section>

        {/* ----------------------------------------------------- LITANY -- */}
        <Section className="lk-litany">
          <div className="lk-litany-inner">
            {SHARED.litany.map((line) => (
              <p className="lk-line lk-reveal" key={line}>
                {line}
              </p>
            ))}
          </div>
        </Section>

        {/* -------------------------------------------------------- ACT -- */}
        <Section className="lk-act">
          <div className="lk-act-inner">
            <figure className="lk-figure lk-reveal">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={actFrame.src}
                alt={actFrame.subject}
                width={actFrame.w}
                height={actFrame.h}
                loading="lazy"
                decoding="async"
              />
              <figcaption className="lk-caption">{actFrame.subject}</figcaption>
            </figure>
            <div className="lk-act-copy lk-reveal">
              <p className="lk-act-label">{SHARED.actLabel}</p>
              <h2 className="lk-act-title">
                {SHARED.actGerund}
                <span className="lk-headline-tail">{SHARED.actTail}</span>
              </h2>
              <p className="lk-draft lk-reveal">{SHARED.actStatus}</p>
            </div>
          </div>
        </Section>

        {/* ------------------------------------------------------ STRIP -- */}
        <Section className="lk-strip">
          <div className="lk-strip-inner">
            {strip.map((f) => (
              <figure key={f.src} className="lk-reveal">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.src}
                  alt={f.subject}
                  width={f.w}
                  height={f.h}
                  loading="lazy"
                  decoding="async"
                />
              </figure>
            ))}
          </div>
        </Section>

        {/* ---------------------------------------------------- BOOKING -- */}
        <Section className="lk-book">
          <div className="lk-book-inner">
            <p className="lk-act-label">Reservations</p>
            <h2 className="lk-act-title lk-reveal">Check availability</h2>
            {/*
              THE REAL BOOKING ENGINE, on a throwaway prototype.
              A prototype that fakes the booking step teaches the owner the
              wrong thing about the one flow that earns money — and this project
              has a standing rule that booking always leads to WebHotelier.
              Dates-only, lang=en, per T-156/T-159.
            */}
            <a
              className="lk-cta"
              href="https://thalassesvillas.reserve-online.net/?lang=en"
              rel="noopener"
            >
              Book — the real engine
            </a>
          </div>
        </Section>
      </main>
    </div>
  );
}
