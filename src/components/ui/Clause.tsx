import type { CSSProperties } from "react";

import type { ClauseScale } from "@/lib/clause";
import { assertClause } from "@/lib/clause";

export interface ClauseProps {
  /** An act of living. Sentence case, max 3 words. */
  gerund: string;
  /** A fact you could check. Uppercased on render, max 6 words, never punctuated. */
  tail?: string;
  scale?: ClauseScale;
  /** Animate the tail open on first paint. Off for below-the-fold instances. */
  animate?: boolean;
  as?: "h1" | "h2" | "h3" | "p" | "div";
  className?: string;
}

/**
 * THE SIGNATURE ELEMENT (DESIGN-PLAN §2).
 *
 * A gerund in Marcellus and a letterspaced tail in Inter, sharing one baseline,
 * separated by a gap rather than punctuation, and never closed by a full stop.
 *
 * Three implementation points are non-negotiable:
 *  1. letter-spacing is never animated — per-character spans translate, so the
 *     tail opens with zero layout cost and zero CLS.
 *  2. The wrapper carries the full sentence as aria-label and every character
 *     span is aria-hidden, so a screen reader hears one sentence, not 22 letters.
 *  3. Overflow is clipped by the section (.clause-field), never the document.
 *
 * PLAIN MARKUP, NOT A CLIENT COMPONENT (D-028). The clause needs no script, so
 * it is rendered where it is used — on the server for a page, the footer and
 * the 404, inside the bundle of a client component that renders one — and the
 * served HTML is the finished clause: the character spans and margins the
 * Framer build produced at rest, with no opacity or transform written into it.
 *
 * THE TAIL TRACKS OPEN IN CSS. An `animate` clause adds `clause--animate`; its
 * tail carries its character count as `--n`, and each character its index as
 * `--i`. `globals.css` runs `clause-track` on those characters, on `screen` and
 * only with motion allowed: from `translateX(--i × step)` to rest over 1.05s
 * with a 12ms stagger — the step is the open tracking at 16px per em, exactly
 * the offsets the Framer build started from. Transform only, so the tail is
 * legible from first paint; the Framer build also faded it in from opacity 0,
 * served that way, and hid it until hydration. The animation starts at first
 * paint rather than at hydration, and under reduced motion, in print and
 * without CSS animations the tail simply sits at its final tracking. A custom
 * property matches none of the `<noscript>` overrides in `layout.tsx`.
 *
 * The stagger runs from the LAST character (`globals.css` says why): with no
 * fade to hide a waiting character, a stagger from the first one piles the
 * waiting characters onto the moving ones for a few hundred milliseconds.
 *
 * This is what retired `LazyClause` and Framer on the D pages. The root 404
 * renders the footer, and the App Router serialises the root 404 element into
 * every page's payload, so the footer's clause was a client reference on every
 * route; behind `next/dynamic` its server render emitted a low-priority preload
 * of the 120 kB Framer chunk on careers, terms, contact, the gallery, the
 * experiences and the 404, for a clause that never moved. A page's client
 * scripts also follow what its server modules IMPORT, rendered or not: an
 * interim build that kept a Framer component for `animate` instances, imported
 * from here, put Framer into the initial scripts of every page with a footer.
 * Keep this file free of client imports.
 */
export function Clause({
  gerund,
  tail,
  scale = "c2",
  animate = false,
  as: Tag = "h2",
  className = "",
}: ClauseProps) {
  // Throws in development if a clause is punctuated or over length.
  assertClause(gerund, tail);

  const upperTail = tail?.toUpperCase();
  const label = upperTail ? `${gerund} ${upperTail}` : gerund;

  // Open tracking per scale (DESIGN-PLAN §4.3).
  const openEm = scale === "c1" || scale === "c2" ? 0.3 : 0.22;
  const chars = upperTail ? Array.from(upperTail) : [];

  return (
    <Tag
      className={`clause clause--${scale}${animate ? " clause--animate" : ""} ${className}`}
      aria-label={label}
      role="text"
    >
      <span className={`display ${scale}`} aria-hidden="true">
        {gerund}
      </span>

      {upperTail ? (
        <span
          className="clause-tail"
          aria-hidden="true"
          style={animate ? ({ "--n": chars.length } as CSSProperties) : undefined}
        >
          {chars.map((ch, i) => (
            <span
              key={i}
              className="clause-char"
              style={
                animate
                  ? ({ marginRight: `${openEm}em`, "--i": i } as CSSProperties)
                  : { marginRight: `${openEm}em` }
              }
            >
              {ch === " " ? " " : ch}
            </span>
          ))}
        </span>
      ) : null}
    </Tag>
  );
}
