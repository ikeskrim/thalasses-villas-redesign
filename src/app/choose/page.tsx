import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Choose a direction",
  robots: { index: false, follow: false },
};

/**
 * The index. Deliberately plain — it must not flatter any one of the three, and
 * it must not be a fourth design competing with them.
 */
const DIRECTIONS = [
  {
    letter: "A",
    href: "/a",
    name: "Night Cinema",
    note:
      "Near-black ground, white ink, one grey. Every colour on the page arrives inside a photograph. Full-bleed frames butted edge to edge with a single line of type over each — a reel, not a page.",
  },
  {
    letter: "B",
    href: "/b",
    name: "Light Editorial",
    note:
      "The limestone system at full strength — the current language's last stand. Type one full step larger, photography interrupting the prose instead of following it, and a tighter rhythm so scale carries the emphasis instead of air.",
  },
  {
    letter: "C",
    href: "/c",
    name: "Bold Immersive",
    note:
      "Scale contrast as the organising idea. Type that crops its own photograph, the estate's numbers as the loudest beat on the page, villa names set larger than the frames they sit on. Dense, and never a calm gutter to rest in.",
  },
];

export default function Choose() {
  return (
    <main id="main" className="choose">
      <p className="micro">Thalasses Villas · homepage</p>
      <h1 className="display c2" style={{ marginTop: "var(--spacing-step-4)" }}>
        Three directions
      </h1>
      <p className="lede" style={{ marginTop: "var(--spacing-step-5)", maxWidth: "46ch" }}>
        The same homepage, three ways. Identical content, identical facts, identical booking
        links — only the art direction differs.
      </p>

      <ul className="choose-list">
        {DIRECTIONS.map((d) => (
          <li key={d.letter} className="choose-item">
            <Link href={d.href}>
              <span className="choose-letter">{d.letter}</span>
              <span>
                <span className="choose-name">{d.name}</span>
                <span className="small choose-note">{d.note}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="small choose-foot">
        Comparison artifact, not three finished sites — judge the direction, not the polish.
        Every photograph is a curated A-grade frame, every figure comes from the confirmed
        inventory, and every booking link goes to the real engine on all three. The current
        production homepage is still at <Link href="/">/</Link>.
      </p>
    </main>
  );
}
