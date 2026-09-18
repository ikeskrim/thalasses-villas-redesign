import type { Metadata } from "next";

import { Clause } from "@/components/ui/Clause";
import { FontAB } from "./FontAB";
import { PALETTE, contrast, tokenHex, verdict } from "@/lib/contrast";

export const metadata: Metadata = {
  title: "Styleguide",
  description: "Design tokens, type scale and core components.",
  robots: { index: false, follow: false },
};

/* Pairs the UI actually uses — not every mathematical combination. */
const USED_PAIRS: { fg: string; bg: string; used: string }[] = [
  { fg: "basalt", bg: "limestone", used: "All body copy, all clauses, all display type" },
  { fg: "pelagos", bg: "limestone", used: "Links, active states, focus rings, the datum rule" },
  { fg: "phrygana", bg: "limestone", used: "Captions, distances, index one-liners" },
  { fg: "basalt", bg: "ammos", used: "Inventory item names, enquiry card body" },
  { fg: "pelagos", bg: "ammos", used: "Inventory interactive items, expand controls" },
  { fg: "phrygana", bg: "ammos", used: "Inventory secondary text" },
  { fg: "limestone", bg: "basalt", used: "Ledger and footer copy" },
  { fg: "preveli", bg: "basalt", used: "Ledger labels, rules and marks on dark" },
  { fg: "limestone", bg: "pelagos", used: "The Entire Estate set-piece" },
  { fg: "preveli", bg: "pelagos", used: "Estate secondary text" },
];

const DISPLAY_SCALE = [
  { name: "C1", token: "--text-c1", px: "64 – 224px", lh: "0.87", tr: "−0.022em", use: "Home hero, Entire Estate, Weddings opener" },
  { name: "C2", token: "--text-c2", px: "44 – 120px", lh: "0.92", tr: "−0.016em", use: "Section clauses, Chapter openers" },
  { name: "C3", token: "--text-c3", px: "32 – 52px", lh: "1.00", tr: "−0.010em", use: "Villa names, Inventory group names" },
  { name: "C4", token: "--text-c4", px: "28 – 32px", lh: "1.08", tr: "−0.005em", use: "Index rows, beach names" },
];

const TEXT_SCALE = [
  { name: "Lede", px: "18 – 22px", lh: "1.45", use: "Standfirsts, expanded index rows · 46ch" },
  { name: "Body", px: "17px (16.5 < 768)", lh: "1.68", use: "All prose · 62ch" },
  { name: "Small", px: "15px", lh: "1.62", use: "Inventory items, specs" },
  { name: "Caption", px: "13px", lh: "1.50", use: "Photo captions, inline descriptions" },
  { name: "Datum", px: "14px", lh: "1.20", use: "Every figure · tabular-nums, weight 500" },
  { name: "Tail", px: "12px (13 at C1/C2)", lh: "1.00", use: "Clause tails and micro-labels" },
];

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: "var(--rhythm-prose-prose)" }}>
      <p className="micro" style={{ marginBottom: "var(--spacing-step-4)" }}>
        {eyebrow}
      </p>
      <h2 className="display c3" style={{ marginBottom: "var(--spacing-step-6)" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function StyleguidePage() {
  return (
    <main className="canon" style={{ paddingBlock: "var(--spacing-step-8)" }}>
      <header style={{ marginBottom: "var(--rhythm-prose-prose)" }}>
        <p className="micro" style={{ marginBottom: "var(--spacing-step-5)" }}>
          Thalasses Villas · Internal
        </p>
        <Clause gerund="Building" tail="Six tokens, two faces" scale="c2" as="h1" />
        <p className="lede" style={{ marginTop: "var(--spacing-step-6)" }}>
          Every value on this page is read from the design tokens, and every contrast ratio is
          computed at render time with the WCAG 2.x formula. If a token changes, this page reports
          the truth immediately rather than restating a number from a document.
        </p>
      </header>

      {/* ---------------------------------------------------------- palette */}
      <Section eyebrow="§3" title="Palette">
        <p className="prose-measure" style={{ marginBottom: "var(--spacing-step-6)" }}>
          Six tokens. There is no gold, ochre, brass or terracotta in this system, and no token is
          added later. The accent slot is deleted by construction: the interactive colour is the sea,
          which passes AA at every size and therefore needs no lint rule to police it.
        </p>

        <div
          style={{
            display: "grid",
            gap: "var(--spacing-step-5)",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          }}
        >
          {PALETTE.map((t) => (
            <article key={t.name}>
              <div
                style={{
                  background: t.hex,
                  height: 132,
                  border: "1px solid rgb(22 38 43 / 0.08)",
                }}
              />
              <div style={{ marginTop: "var(--spacing-step-3)" }}>
                <p className="small" style={{ fontWeight: 500 }}>
                  --{t.name}
                </p>
                <p className="caption tabular" style={{ color: "var(--color-phrygana)" }}>
                  {t.hex.toUpperCase()}
                  {t.surfaceOnly ? " · surface only" : ""}
                  {t.darkGroundsOnly ? " · dark grounds only" : ""}
                </p>
                <p className="caption" style={{ marginTop: "var(--spacing-step-2)" }}>
                  {t.role}
                </p>
                <p
                  className="caption"
                  style={{ marginTop: "var(--spacing-step-2)", color: "var(--color-phrygana)" }}
                >
                  {t.rationale}
                </p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* --------------------------------------------------------- contrast */}
      <Section eyebrow="§3.1" title="Contrast — every pair the UI uses">
        <div style={{ overflowX: "auto" }}>
          <table className="small" style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
            <thead>
              <tr>
                {["Sample", "Pair", "Ratio", "Verdict", "Used for"].map((h) => (
                  <th
                    key={h}
                    className="micro"
                    style={{
                      textAlign: "left",
                      padding: "0 var(--spacing-step-4) var(--spacing-step-3) 0",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {USED_PAIRS.map(({ fg, bg, used }) => {
                const ratio = contrast(tokenHex(fg), tokenHex(bg));
                const v = verdict(ratio);
                return (
                  <tr key={`${fg}-${bg}`} style={{ verticalAlign: "top" }}>
                    <td style={{ padding: "0 var(--spacing-step-4) var(--spacing-step-4) 0" }}>
                      <span
                        style={{
                          display: "inline-block",
                          background: tokenHex(bg),
                          color: tokenHex(fg),
                          padding: "10px 14px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Aa 50 m
                      </span>
                    </td>
                    <td
                      className="caption"
                      style={{ padding: "0 var(--spacing-step-4) var(--spacing-step-4) 0", whiteSpace: "nowrap" }}
                    >
                      --{fg} on --{bg}
                    </td>
                    <td
                      className="tabular"
                      style={{ padding: "0 var(--spacing-step-4) var(--spacing-step-4) 0" }}
                    >
                      {ratio.toFixed(2)}:1
                    </td>
                    <td
                      className="caption"
                      style={{
                        padding: "0 var(--spacing-step-4) var(--spacing-step-4) 0",
                        color: v === "fail" ? "#B00" : "var(--color-phrygana)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {v}
                    </td>
                    <td
                      className="caption"
                      style={{ padding: "0 0 var(--spacing-step-4) 0", color: "var(--color-phrygana)" }}
                    >
                      {used}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="caption" style={{ marginTop: "var(--spacing-step-5)", color: "var(--color-phrygana)" }}>
          Worst case over photography: the unconditional scrim reaches alpha 0.72, which over a pure
          white image composites to #576366. --limestone on that is 5.08:1 — AA body. No per-image
          luminance analysis is required.
        </p>
      </Section>

      {/* ------------------------------------------------------- typography */}
      <Section eyebrow="§4" title="Typography">
        <p className="prose-measure" style={{ marginBottom: "var(--spacing-step-7)" }}>
          Marcellus 400 is the only display weight — no bold, no italic — so hierarchy can only be
          built from scale, space, case and tracking. The typeface physically cannot shout. Nothing on
          this site is set between 22px and 28px: Inter tops out at 22, Marcellus floors at 28, and
          that silent register is why the page reads as editorial rather than as a CMS ramp.
        </p>

        {DISPLAY_SCALE.map((s) => (
          <div key={s.name} style={{ marginBottom: "var(--spacing-step-7)" }}>
            <p className="micro" style={{ marginBottom: "var(--spacing-step-3)" }}>
              {s.name} · {s.px} · line-height {s.lh} · tracking {s.tr}
            </p>
            <p
              className="display"
              style={{
                fontSize: `var(${s.token})`,
                lineHeight: s.lh,
                letterSpacing: s.tr.replace("−", "-"),
              }}
            >
              Living Unlimited
            </p>
            <p className="caption" style={{ marginTop: "var(--spacing-step-3)", color: "var(--color-phrygana)" }}>
              {s.use}
            </p>
          </div>
        ))}

        <div style={{ marginTop: "var(--spacing-step-8)" }}>
          {TEXT_SCALE.map((s) => (
            <div key={s.name} style={{ marginBottom: "var(--spacing-step-5)" }}>
              <p className="micro" style={{ marginBottom: "var(--spacing-step-2)" }}>
                {s.name} · {s.px} · line-height {s.lh}
              </p>
              <p
                className={
                  s.name === "Lede"
                    ? "lede"
                    : s.name === "Small"
                      ? "small"
                      : s.name === "Caption"
                        ? "caption"
                        : s.name === "Datum"
                          ? "tabular"
                          : s.name === "Tail"
                            ? "micro"
                            : ""
                }
                style={s.name === "Datum" ? { fontSize: "var(--text-datum)" } : undefined}
              >
                {s.name === "Datum"
                  ? "50 m · 8 km · 60 m² · 115 provisions · WH200"
                  : s.name === "Tail"
                    ? "Fifty metres from the water"
                    : "The clear blue sea and an exclusive private beach, fifty metres from the door."}
              </p>
              <p className="caption" style={{ marginTop: "var(--spacing-step-2)", color: "var(--color-phrygana)" }}>
                {s.use}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* --------------------------------------------------------- font A/B */}
      <Section eyebrow="§4.1" title="Display serif — the A/B">
        <p className="prose-measure" style={{ marginBottom: "var(--spacing-step-7)" }}>
          Compared at the real sizes, on the real ground, including a Greek line — because the
          Greek question turned out to be the deciding one and it is invisible in a Latin specimen.
        </p>
        <FontAB />
      </Section>

      {/* ---------------------------------------------------------- clause */}
      <Section eyebrow="§2" title="The Clause — the signature element">
        <p className="prose-measure" style={{ marginBottom: "var(--spacing-step-7)" }}>
          A gerund in Marcellus and a letterspaced tail in Inter, sharing one baseline, separated by a
          gap rather than punctuation, and never closed by a full stop. The gerund is an act of
          living; the tail is a fact you could check. A tail that does not resolve to a fact in the
          build-time registry fails the build, which is what makes place-specificity a data binding
          rather than a copywriting deliverable.
        </p>

        <div className="clause-field" style={{ marginBottom: "var(--spacing-step-7)" }}>
          <Clause gerund="Living" tail="Unlimited" scale="c1" animate as="p" />
        </div>
        <div className="clause-field" style={{ marginBottom: "var(--spacing-step-6)" }}>
          <Clause gerund="Standing" tail="Fifty metres from the water" scale="c2" as="p" />
        </div>
        <div className="clause-field" style={{ marginBottom: "var(--spacing-step-6)" }}>
          <Clause gerund="Waking" tail="At sea level, ground floor" scale="c3" as="p" />
        </div>
        <div className="clause-field" style={{ marginBottom: "var(--spacing-step-6)" }}>
          <Clause gerund="Swimming" tail="Ammoudaki, then Klisidi, by dive" scale="c4" as="p" />
        </div>

        <div style={{ background: "var(--color-ammos)", padding: "var(--spacing-step-6)" }}>
          <p className="micro" style={{ marginBottom: "var(--spacing-step-3)" }}>
            Enforced in code
          </p>
          <ul className="small" style={{ paddingLeft: "1.1em", listStyle: "disc" }}>
            <li>Terminal punctuation throws in development — no clause is ever closed.</li>
            <li>Gerund capped at 3 words; tail capped at 6.</li>
            <li>The first word must end in -ing, or it is not an act of living.</li>
            <li>letter-spacing is never animated; per-character spans translate, so CLS is 0.</li>
            <li>
              The wrapper carries the full sentence as <code>aria-label</code>; character spans are{" "}
              <code>aria-hidden</code>, so a screen reader hears one sentence, not 22 letters.
            </li>
          </ul>
        </div>
      </Section>

      {/* --------------------------------------------------------- controls */}
      <Section eyebrow="§7" title="Controls">
        <p className="prose-measure" style={{ marginBottom: "var(--spacing-step-6)" }}>
          No state on this site is signalled by colour alone. Every active state carries at least two
          cues — a colour change plus an underline, a tracking change, or <code>aria-current</code> —
          so the site is fully usable by someone who perceives no colour difference at all.
        </p>

        <div style={{ display: "flex", gap: "var(--spacing-step-5)", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            className="micro"
            style={{
              background: "var(--color-basalt)",
              color: "var(--color-limestone)",
              padding: "18px 32px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Reserve
          </button>
          <button
            type="button"
            className="micro"
            style={{
              background: "transparent",
              color: "var(--color-pelagos)",
              padding: "18px 32px",
              border: "1px solid var(--color-pelagos)",
              cursor: "pointer",
            }}
          >
            Check availability
          </button>
          <a
            href="#"
            className="small"
            style={{
              color: "var(--color-pelagos)",
              textDecoration: "underline",
              textUnderlineOffset: "0.35em",
              textDecorationThickness: "1.5px",
            }}
          >
            An inline link, underlined at 1.5px
          </a>
        </div>
      </Section>

      {/* ---------------------------------------------------------- spacing */}
      <Section eyebrow="§5.3" title="Section rhythm">
        <p className="prose-measure" style={{ marginBottom: "var(--spacing-step-6)" }}>
          Spacing between two sections is a function of what they are, not a fixed number. The last
          row is the rule with teeth: two photographs of the sea may never be separated by limestone,
          or the horizon breaks.
        </p>
        <table className="small" style={{ borderCollapse: "collapse" }}>
          <tbody>
            {[
              ["Prose → Prose", "96 – 220px"],
              ["Prose → Photograph", "72 – 152px"],
              ["Photograph → Prose", "48 – 104px"],
              ["Photograph → Photograph", "0. Always. No divider, no exception."],
            ].map(([a, b]) => (
              <tr key={a}>
                <td style={{ padding: "0 var(--spacing-step-6) var(--spacing-step-3) 0" }}>{a}</td>
                <td className="tabular" style={{ padding: "0 0 var(--spacing-step-3) 0" }}>
                  {b}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </main>
  );
}
