import localFont from "next/font/local";

/**
 * The font A/B, run on the styleguide so the comparison is made at the real
 * sizes on the real ground colour rather than in a specimen PDF.
 *
 * Cormorant Garamond and GFS Didot are loaded ONLY on this route. They are not
 * referenced anywhere in the product, so they add nothing to any page a guest
 * will ever see.
 */
const cormorant = localFont({
  src: [{ path: "../fonts/cormorant-garamond-latin.woff2", weight: "400", style: "normal" }],
  variable: "--font-cormorant",
  display: "swap",
  preload: false,
});

const gfsDidot = localFont({
  src: [
    { path: "../fonts/gfs-didot-latin.woff2", weight: "400", style: "normal" },
    { path: "../fonts/gfs-didot-greek.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-gfs-didot",
  display: "swap",
  preload: false,
});

const SPECIMENS = [
  { label: "Marcellus — the incumbent", cls: "display", note: "latin, latin-ext. No Greek." },
  {
    label: "Cormorant Garamond — the challenger",
    cls: "ab-cormorant",
    note: "cyrillic, latin, latin-ext, vietnamese. No Greek either.",
  },
  {
    label: "GFS Didot — the Greek-capable option",
    cls: "ab-gfs",
    note: "greek, greek-ext, latin. From the Greek Font Society.",
  },
];

export function FontAB() {
  return (
    <div className={`${cormorant.variable} ${gfsDidot.variable}`}>
      {SPECIMENS.map((s) => (
        <div key={s.label} style={{ marginBottom: "var(--spacing-step-8)" }}>
          <p className="micro" style={{ marginBottom: "var(--spacing-step-3)" }}>
            {s.label}
          </p>

          {/* C1 — the hero size, where a hairline serif either holds or dissolves. */}
          <p className={s.cls} style={{ fontSize: "var(--text-c2)", lineHeight: 0.92, letterSpacing: "-0.016em" }}>
            Living Unlimited
          </p>

          {/* C4 — the smallest permitted display size, the real stress test. */}
          <p
            className={s.cls}
            style={{ fontSize: "var(--text-c4)", lineHeight: 1.08, marginTop: "var(--spacing-step-4)" }}
          >
            Villa Eeanthe — Waking on the upper floor
          </p>

          {/* Greek, to make the coverage question visible rather than theoretical. */}
          <p
            className={s.cls}
            style={{ fontSize: "var(--text-c4)", lineHeight: 1.08, marginTop: "var(--spacing-step-3)" }}
          >
            Θάλασσες — Ρέθυμνο, Κρήτη
          </p>

          <p className="caption" style={{ marginTop: "var(--spacing-step-3)", color: "var(--color-phrygana)" }}>
            {s.note}
          </p>
        </div>
      ))}
    </div>
  );
}
