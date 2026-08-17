"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export interface LitanyLine {
  text: string;
  image: string;
  alt: string;
}

/**
 * PATTERN 1 — THE LITANY OPENER.
 *
 * A short list read by scrolling. The active line takes full ink, the rest sit
 * back, and the photograph beside them crossfades as the active line changes.
 * It resolves into one payoff line at display scale.
 *
 * Driven by IntersectionObserver on the lines themselves rather than by a
 * scroll-position calculation: the observer cannot drift out of sync with the
 * layout, needs no measurement, and if the script never runs the reader simply
 * gets every line at full ink with the first photograph — which is a legible
 * page, not a broken one. (CONVENTIONS.md §3.)
 *
 * These lines are DRAFT copy pending owner approval; every fact inside them
 * resolves against the inventory.
 */
export function Litany({
  lines,
  payoffGerund,
  payoffTail,
}: {
  lines: LitanyLine[];
  payoffGerund: string;
  payoffTail: string;
}) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  const reduced = useReducedMotion();

  useEffect(() => {
    const els = refs.current.filter(Boolean) as HTMLLIElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const i = els.indexOf(visible.target as HTMLLIElement);
        if (i >= 0) setActive(i);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.5, 1] }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [lines.length]);

  const current = lines[active] ?? lines[0];

  return (
    <section className="litany" aria-label="What a stay here is">
      <div className="litany-media" aria-hidden="true">
        {lines.map((l, i) => (
          <motion.div
            key={l.image}
            className="litany-frame"
            initial={false}
            animate={{ opacity: i === active ? 1 : 0 }}
            transition={{ duration: reduced ? 0.2 : 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src={l.image}
              alt=""
              fill
              sizes="(max-width: 1023px) 100vw, 52vw"
              quality={82}
              priority={i === 0}
              style={{ objectFit: "cover" }}
            />
          </motion.div>
        ))}
      </div>

      <div className="litany-copy">
        <ol className="litany-list">
          {lines.map((l, i) => (
            <li
              key={l.text}
              ref={(el) => {
                refs.current[i] = el;
              }}
              className={`litany-line${i === active ? " is-active" : ""}`}
            >
              <span className="display c3">{l.text}</span>
            </li>
          ))}
        </ol>

        {/* The payoff is a Clause — the poetic register — never an imperative. */}
        <p className="litany-payoff display c2">
          {payoffGerund}{" "}
          <span className="clause-tail litany-payoff-tail">{payoffTail}</span>
        </p>
      </div>

      {/* Screen readers get the whole litany as one list, not a moving target. */}
      <p className="sr-only">{`${lines.map((l) => l.text).join(". ")}. ${current?.alt ?? ""}`}</p>
    </section>
  );
}
