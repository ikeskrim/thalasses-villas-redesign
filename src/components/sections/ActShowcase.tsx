"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useMotionValueEvent } from "framer-motion";
import { useRef, useState } from "react";

import { Icon, type IconName } from "@/components/ui/Icons";
import { LedgerInline, type LedgerEntry } from "@/components/ui/Ledger";

export interface ActCard {
  icon: IconName;
  title: string;
  description: string;
  ledger?: LedgerEntry[];
}

export interface Act {
  /** The product register: short, closed, confident. Never a Clause. */
  title: string;
  eyebrow: string;
  image: string;
  alt: string;
  cards: ActCard[];
}

/**
 * PATTERN 2 — THE THREE-ACT PINNED SHOWCASE.
 *
 * The section pins for three viewport-heights; the act advances with scroll
 * progress, and a visible selector lets a reader jump straight to one. Each act
 * is a photograph and four cards.
 *
 * Pinned with CSS `position: sticky` and a scroll-progress read, never a
 * measured pin (CONVENTIONS.md §3): sticky cannot desynchronise from the
 * scrollbar, needs no layout measurement, and degrades to a tall section if the
 * script never runs.
 *
 * Touch and reduced-motion get the stacked version — three acts one after
 * another, everything visible, no pinning and no scroll capture. That is a
 * different layout rather than a degraded one, and it is the majority platform.
 *
 * TYPOGRAPHIC REGISTER: act titles are imperatives and they CLOSE with a full
 * stop. The Unclosed Clause never heads an act, and an imperative never takes a
 * fact-tail. The two registers coexist by rule and never inside one element.
 */
export function ActShowcase({ acts }: { acts: Act[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const i = Math.min(acts.length - 1, Math.max(0, Math.floor(p * acts.length)));
    setActive(i);
  });

  const jumpTo = (i: number) => {
    setActive(i);
    const el = ref.current;
    if (!el) return;
    const top = el.offsetTop + (el.offsetHeight / acts.length) * i;
    window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <div ref={ref} className="acts" style={{ height: `${acts.length * 100}svh` }}>
      <div className="acts-sticky">
        {/* Selector — real buttons, keyboard operable, three cues on the active one. */}
        <nav className="acts-nav canon" aria-label="Capabilities">
          <ol>
            {acts.map((a, i) => (
              <li key={a.title}>
                <button
                  type="button"
                  className={`acts-tab${i === active ? " is-active" : ""}`}
                  aria-current={i === active ? "true" : undefined}
                  onClick={() => jumpTo(i)}
                >
                  <span className="micro acts-tab-index">{String(i + 1).padStart(2, "0")}</span>
                  <span className="acts-tab-label">{a.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="acts-stage">
          {acts.map((a, i) => (
            <motion.article
              key={a.title}
              className="act"
              initial={false}
              animate={{ opacity: i === active ? 1 : 0 }}
              transition={{ duration: reduced ? 0.2 : 0.55, ease: [0.16, 1, 0.3, 1] }}
              style={{ pointerEvents: i === active ? "auto" : "none" }}
              aria-hidden={i !== active}
            >
              <div className="act-media echo">
                <Image
                  src={a.image}
                  alt={a.alt}
                  fill
                  sizes="(max-width: 1023px) 100vw, 46vw"
                  quality={82}
                  style={{ objectFit: "cover" }}
                />
              </div>

              <div className="act-body canon">
                <p className="micro">{a.eyebrow}</p>
                {/* Product register: closed, imperative. */}
                <h2 className="display c2 act-title">{a.title}</h2>
                <ul className="act-cards">
                  {a.cards.map((c) => (
                    <li key={c.title} className="act-card">
                      <Icon name={c.icon} />
                      <h3 className="act-card-title">{c.title}</h3>
                      <p className="small act-card-desc">{c.description}</p>
                      {c.ledger ? <LedgerInline entries={c.ledger} /> : null}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * The stacked version, rendered on touch and under reduced motion. Same content,
 * no pin, no cross-fade, nothing hidden behind an interaction.
 */
export function ActStack({ acts }: { acts: Act[] }) {
  return (
    <div className="acts-stack">
      {acts.map((a, i) => (
        <article key={a.title} className="act act--stacked">
          <div className="act-media">
            <Image
              src={a.image}
              alt={a.alt}
              fill
              sizes="100vw"
              quality={80}
              loading={i === 0 ? "eager" : "lazy"}
              style={{ objectFit: "cover" }}
            />
          </div>
          <div className="act-body canon">
            <p className="micro">{a.eyebrow}</p>
            <h2 className="display c2 act-title">{a.title}</h2>
            <ul className="act-cards">
              {a.cards.map((c) => (
                <li key={c.title} className="act-card">
                  <Icon name={c.icon} />
                  <h3 className="act-card-title">{c.title}</h3>
                  <p className="small act-card-desc">{c.description}</p>
                  {c.ledger ? <LedgerInline entries={c.ledger} /> : null}
                </li>
              ))}
            </ul>
          </div>
        </article>
      ))}
    </div>
  );
}
