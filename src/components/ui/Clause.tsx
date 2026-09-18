import type { ClauseScale } from "@/lib/clause";
import { assertClause } from "@/lib/clause";

export interface ClauseProps {
  /** An act of living. Sentence case, max 3 words. */
  gerund: string;
  /** A fact you could check. Uppercased on render, max 6 words, never punctuated. */
  tail?: string;
  scale?: ClauseScale;
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
 * PLAIN MARKUP, NOT A CLIENT COMPONENT (D-028). A clause that does not animate
 * needs no script, so it is rendered where it is used — on the server for a
 * page, the footer and the 404, inside the bundle of a client component that
 * renders one — with the same character spans and margins the Framer build
 * produced at rest, and no opacity or transform written into the HTML.
 *
 * This is what retired `LazyClause`. The root 404 renders the footer, and the
 * App Router serialises the root 404 element into every page's payload, so the
 * footer's clause was a client reference on every route; behind `next/dynamic`
 * its server render emitted a low-priority preload of the 120 kB Framer chunk
 * on careers, terms, contact, the gallery, the experiences and the 404, for a
 * clause that never moved. A server-rendered clause is no client reference at
 * all.
 *
 * AN ANIMATED CLAUSE IS `ClauseMotion`, AND THIS FILE MUST NOT IMPORT IT. A
 * page's client scripts follow what its server modules import, rendered or
 * not. The first build of this step kept an `animate` branch here that
 * returned `ClauseMotion`, and careers, terms, contact, the gallery, the
 * experiences, location and the 404 then loaded Framer as an initial script —
 * worse than the preload it replaced — because the footer imports this file.
 */
export function Clause({ gerund, tail, scale = "c2", as: Tag = "h2", className = "" }: ClauseProps) {
  // Throws in development if a clause is punctuated or over length.
  assertClause(gerund, tail);

  const upperTail = tail?.toUpperCase();
  const label = upperTail ? `${gerund} ${upperTail}` : gerund;

  // Open tracking per scale (DESIGN-PLAN §4.3).
  const openEm = scale === "c1" || scale === "c2" ? 0.3 : 0.22;
  const chars = upperTail ? Array.from(upperTail) : [];

  return (
    <Tag
      className={`clause clause--${scale} ${className}`}
      aria-label={label}
      role="text"
    >
      <span className={`display ${scale}`} aria-hidden="true">
        {gerund}
      </span>

      {upperTail ? (
        <span className="clause-tail" aria-hidden="true">
          {chars.map((ch, i) => (
            <span key={i} className="clause-char" style={{ marginRight: `${openEm}em` }}>
              {ch === " " ? " " : ch}
            </span>
          ))}
        </span>
      ) : null}
    </Tag>
  );
}
