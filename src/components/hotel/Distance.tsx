"use client";

import { useEffect, useRef, useState } from "react";

/**
 * THE DISTANCES, COUNTING UP — and stating the truth first.
 *
 * Phase 2 of `MOTION-DIRECTIVE.md` asks for count-ups on the Discover Crete
 * figures. Direction D's ledger deliberately refused to animate anything with a
 * unit ("72.8 km" reads as a slot machine), and every distance here has one.
 * The owner asked for the count-up on THESE figures specifically, so the unit
 * stays still and only the number moves — a compromise that keeps the column
 * tabular and the figure legible at every frame.
 *
 * THE TRUTH IS THE DEFAULT STATE. The server renders the registry's own string,
 * verbatim, for every row. The animation is a client-side exception that runs
 * once, on first entry, and lands on the same string. So with scripting off,
 * under reduced motion, for a crawler, or for a reader whose observer never
 * fires, the page says "72.8 km" and never "0 km" — the fabrication the ledger
 * once shipped and `tests/facts.spec.ts` guards against.
 *
 * ONE ISLAND, NOT TEN. A first version was a component per figure: ten client
 * components, ten observers, ten hydrations on a page whose phone-profile
 * blocking time is the named watch item. This is one, with one observer on
 * the list, and it renders exactly the same markup.
 */
const NUMERIC = /^(\d+(?:\.\d+)?)\s*(m|km)$/;

export function Distances({ items }: { items: { name: string; value: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<string[] | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!ref.current) return;

    const parsed = items.map((d) => {
      const m = NUMERIC.exec(d.value.trim());
      const whole = m?.[1] ?? "";
      const target = Number(whole);
      return {
        value: d.value,
        target: m && target > 0 ? target : null,
        decimals: (whole.split(".")[1] ?? "").length,
        unit: m?.[2] ?? "",
      };
    });
    if (!parsed.some((p) => p.target !== null)) return;

    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const from = performance.now();
        const dur = 700;
        const tick = (t: number) => {
          const p = Math.min(1, (t - from) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          setShown(
            parsed.map((d) =>
              /* The final frame prints the registry string itself, not a rounding of it. */
              d.target === null || p >= 1 ? d.value : `${(d.target * eased).toFixed(d.decimals)} ${d.unit}`
            )
          );
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(ref.current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [items]);

  return (
    <div className="ho-distances" ref={ref}>
      {items.map((d, i) => (
        <div key={d.name}>
          <span>{d.name}</span>
          <b data-distance={d.value}>{shown?.[i] ?? d.value}</b>
        </div>
      ))}
    </div>
  );
}
