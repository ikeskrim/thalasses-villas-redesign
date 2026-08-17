"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

export interface RevealProps {
  children: React.ReactNode;
  /** Stagger index for sibling reveals. */
  index?: number;
  className?: string;
  as?: "div" | "li" | "section" | "article";
}

/**
 * The one reveal primitive (DESIGN-PLAN §8.2). Everything on the site that
 * appears on scroll uses this — a short rise and a fade, 0.8s, once.
 *
 * Under prefers-reduced-motion the movement is dropped entirely and the element
 * fades in over 0.25s. That is a second designed state, not a degradation: no
 * content is hidden and nothing depends on the animation having run.
 */
export function Reveal({ children, index = 0, className = "", as = "div" }: RevealProps) {
  const reduced = useReducedMotion();
  const M = motion[as];

  return (
    <M
      className={className}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
      whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px -12% 0px" }}
      transition={
        reduced
          ? { duration: 0.25 }
          : { duration: 0.8, delay: Math.min(index * 0.08, 0.4), ease: EASE }
      }
    >
      {children}
    </M>
  );
}

/**
 * Image reveal: clip-path wipe plus a 1.05 → 1 settle, per the motion system.
 * The scale sits on an inner wrapper so the clip never animates layout.
 */
export function ImageReveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.25 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      style={{ overflow: "hidden" }}
      initial={{ clipPath: "inset(0 0 100% 0)" }}
      whileInView={{ clipPath: "inset(0 0 0% 0)" }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 1.1, ease: EASE }}
    >
      <motion.div
        initial={{ scale: 1.05 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 1.2, ease: EASE }}
        style={{ height: "100%" }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
