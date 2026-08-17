"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Word-level masked reveal for display lines.
 *
 * Words, not letters. Letter-level staggering everywhere reads as a gimmick and
 * gets tiring by the third beat; it is spent ONCE, on the hero clause, and
 * nowhere else. Each word rides up from behind its own mask, 90 ms apart.
 *
 * The mask is a wrapper with `overflow: hidden` and the word translates inside
 * it — transform only, so there is no layout cost and no CLS.
 *
 * Under reduced motion the whole line simply fades: no masks, no stagger.
 * The text is always real text in the DOM, so it is selectable, searchable and
 * read correctly whether or not the animation runs.
 */
export function WordMask({
  text,
  className = "",
  as: Tag = "span",
  delay = 0,
}: {
  text: string;
  className?: string;
  as?: "span" | "h1" | "h2" | "h3" | "p";
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const words = text.split(" ");

  if (reduced) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 0.25 }}
      >
        <Tag className={className}>{text}</Tag>
      </motion.div>
    );
  }

  return (
    <Tag className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className="wordmask" aria-hidden="true">
          <motion.span
            className="wordmask-inner"
            initial={{ y: "108%" }}
            whileInView={{ y: "0%" }}
            viewport={{ once: true, margin: "-8% 0px" }}
            transition={{
              duration: 0.85,
              delay: delay + i * 0.09,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
