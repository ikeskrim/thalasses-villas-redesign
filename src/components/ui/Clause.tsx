"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";

import type { ClauseScale } from "@/lib/clause";
import { assertClause } from "@/lib/clause";

export interface ClauseProps {
  /** An act of living. Sentence case, max 3 words. */
  gerund: string;
  /** A fact you could check. Uppercased on render, max 6 words, never punctuated. */
  tail?: string;
  scale?: ClauseScale;
  /** Animate the tail open on mount. Off for below-the-fold instances. */
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
 */
export function Clause({
  gerund,
  tail,
  scale = "c2",
  animate = false,
  as: Tag = "h2",
  className = "",
}: ClauseProps) {
  const reduced = useReducedMotion();
  const id = useId();

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
        <span className="clause-tail" aria-hidden="true" id={id}>
          {chars.map((ch, i) => (
            <motion.span
              key={`${id}-${i}`}
              className="clause-char"
              style={{ marginRight: `${openEm}em` }}
              initial={
                animate && !reduced
                  ? { x: -openEm * i * 16, opacity: 0 }
                  : { x: 0, opacity: 1 }
              }
              animate={{ x: 0, opacity: 1 }}
              transition={
                reduced
                  ? { duration: 0.25 }
                  : {
                      duration: 1.05,
                      delay: i * 0.012,
                      ease: [0.16, 1, 0.3, 1],
                    }
              }
            >
              {ch === " " ? " " : ch}
            </motion.span>
          ))}
        </span>
      ) : null}
    </Tag>
  );
}
