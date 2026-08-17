"use client";

import { useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/**
 * THE SPEC LEDGER — an approved element as of the Seasats redirection.
 *
 * The earlier ruling was "no spec anywhere", written against spec *tables* and
 * badge rows. That ban stands. This is the replacement the owner asked for:
 * confident numbers, beautifully set, in the system's own letterspaced register.
 *
 * Label in the micro register, value in tabular Inter so a column of figures
 * holds still. No borders, no cards, no icons, no units invented — every value
 * arrives as a string already formatted by whoever knows the fact.
 */

export interface LedgerEntry {
  label: string;
  value: string | number;
}

export function Ledger({
  entries,
  className = "",
}: {
  entries: LedgerEntry[];
  className?: string;
}) {
  if (!entries.length) return null;
  return (
    <dl className={`ledger-spec ${className}`}>
      {entries.map((e) => (
        <div key={e.label} className="ledger-spec-item">
          <dt className="micro">{e.label}</dt>
          <dd className="tabular ledger-spec-value">
            <CountUp value={e.value} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * The count-up — an EVENT, not a texture. It runs once, on first entry, for
 * 600ms, and only on a plain integer: "72.8 km" and "50 m" are left alone,
 * because animating a unit reads as a slot machine rather than as confidence.
 *
 * Figures are tabular, so the column does not shift a single pixel while it
 * counts. Under reduced motion the final value is simply printed.
 */
function CountUp({ value }: { value: string | number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const reduced = useReducedMotion();
  const target = typeof value === "number" ? value : Number(value);
  const animatable = Number.isFinite(target) && String(value).trim() === String(target);
  // null means "show the real value". The truth is the DEFAULT state, not the
  // end state: an earlier version initialised at 0, so the ledger rendered
  // "0 Bedrooms" in the server HTML, for anyone without JS, and for any reader
  // whose observer never fired. A decoration must never be able to state a
  // false fact — the parity suite caught it, reading 0 where 9 was required.
  const [n, setN] = useState<number | null>(null);

  useEffect(() => {
    if (!animatable || reduced || !inView) return;
    const from = performance.now();
    const dur = 600;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - from) / dur);
      // Same weighted curve as everything else on the site.
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animatable, inView, reduced, target]);

  if (!animatable || reduced || n === null) return <span ref={ref}>{value}</span>;
  return <span ref={ref}>{n}</span>;
}

/** Inline variant for a card, where a stacked list would outweigh the copy. */
export function LedgerInline({ entries }: { entries: LedgerEntry[] }) {
  if (!entries.length) return null;
  return (
    <p className="ledger-inline">
      {entries.map((e, i) => (
        <span key={e.label}>
          {i > 0 ? <span aria-hidden="true"> · </span> : null}
          <span className="micro">{e.label}</span>{" "}
          <span className="tabular">{e.value}</span>
        </span>
      ))}
    </p>
  );
}
