"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";

import type { ClauseProps } from "@/components/ui/Clause";
import { assertClause } from "@/lib/clause";

export interface ClauseMotionProps extends ClauseProps {
  /** Animate the tail open on mount. Off for below-the-fold instances. */
  animate?: boolean;
}

/**
 * THE ANIMATED CLAUSE, STILL ON FRAMER (D-028, first step).
 *
 * The Framer build of the signature element, unchanged, for the instances that
 * animate: the estate, villa and weddings heroes and the styleguide's specimen.
 * Every other clause is `Clause`, plain server markup. So Framer reaches only
 * the pages that import this, and no longer the footer, the 404 or the pages
 * that preloaded it for them. The next step moves the tail's motion into CSS
 * and deletes this file.
 *
 * See `Clause` for the element's three non-negotiable points, and for why it
 * must never import this.
 */
export function ClauseMotion({
  gerund,
  tail,
  scale = "c2",
  animate = false,
  as: Tag = "h2",
  className = "",
}: ClauseMotionProps) {
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
