"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const KEY = "thalasses:seen";

/**
 * Entrance choreography, step one (elevation spec §3).
 *
 * The wordmark assembles once per session, then hands over to the staged hero
 * reveal. Hard rules, because a preloader is the easiest way to make a site feel
 * slower rather than more expensive:
 *   - once per session, never again on navigation
 *   - capped at 1.8s and dismissed early the moment the window fires `load`
 *   - skipped entirely under prefers-reduced-motion
 *   - it never gates content: the page is already rendered underneath, so if the
 *     script fails the visitor simply sees the site
 */
export function Preloader({ onDone }: { onDone?: () => void }) {
  const reduced = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (reduced) {
      onDone?.();
      return;
    }
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
    } catch {
      seen = false;
    }
    if (seen) {
      onDone?.();
      return;
    }

    // Scheduled rather than set synchronously: this is a post-paint decision
    // (it depends on sessionStorage, which does not exist during SSR), and
    // setting state synchronously inside an effect cascades a second render.
    const raf = requestAnimationFrame(() => {
      setShow(true);
      document.documentElement.style.overflow = "hidden";
    });

    const finish = () => {
      setShow(false);
      document.documentElement.style.overflow = "";
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {
        /* private mode — the loader simply runs again */
      }
      onDone?.();
    };

    const cap = window.setTimeout(finish, 1800);
    const early = window.setTimeout(finish, 1150);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(cap);
      window.clearTimeout(early);
      document.documentElement.style.overflow = "";
    };
  }, [reduced, onDone]);

  const word = "THALASSES";

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          className="preloader"
          aria-hidden="true"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
        >
          <p className="preloader-word">
            {Array.from(word).map((c, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: "0.35em" }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.05 + i * 0.045, ease: [0.16, 1, 0.3, 1] }}
              >
                {c}
              </motion.span>
            ))}
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
