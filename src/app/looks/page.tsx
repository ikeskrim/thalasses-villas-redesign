import type { Metadata } from "next";

import { LOOKS } from "./looks-data";

export const metadata: Metadata = {
  title: "Three looks — Thalasses",
  robots: { index: false, follow: false },
};

/**
 * THE CHOOSER — the page the owner opens on his phone.
 *
 * It is deliberately plain. It is a menu, not a fourth design, and a chooser
 * that has a look of its own competes with the three things it is asking about.
 *
 * Greek first in each card, because he reads Greek first.
 */
export default function LooksIndex() {
  return (
    <div className="lk-chooser">
      <div className="lk-chooser-inner">
        <h1>Τρεις όψεις. Διάλεξε μία.</h1>
        <p className="lk-chooser-lede">
          Three directions for the same site — your photographs, your words, your
          property, three ways. Nothing here is a mock-up of somebody else&rsquo;s
          hotel: every frame is from the estate, and every line is already on the
          site. Open each one, then pick the one you want to live in.
        </p>

        <div className="lk-cards">
          {LOOKS.map((look) => (
            <a className="lk-card" href={`/looks/${look.id}`} key={look.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={look.hero.src}
                alt={look.hero.subject}
                width={look.hero.w}
                height={look.hero.h}
                loading="lazy"
                decoding="async"
              />
              <div className="lk-card-body">
                <h2>
                  {look.greekName}
                  <span style={{ display: "block", fontSize: "0.8rem", letterSpacing: "0.12em", opacity: 0.6 }}>
                    {look.name}
                  </span>
                </h2>
                <p className="lk-card-el">{look.greekPromise}</p>
                <p className="lk-card-meta">
                  {look.character.type}
                  <br />
                  {look.character.palette}
                  <br />
                  {look.character.motion}
                </p>
                {/*
                  The reservoir figures are on the card because they are the
                  part of this decision the owner cannot see by looking. A look
                  can be beautiful in a hero and impossible to dress across five
                  villa pages, and that is exactly what "6 support frames" means.
                */}
                <p className="lk-card-meta">
                  <strong>{look.reservoir.proven}</strong> proven hero frames ·{" "}
                  <strong>{look.reservoir.support}</strong> support ·{" "}
                  {look.reservoir.candidates} ungraded
                </p>
                <span className="lk-card-open">Open →</span>
              </div>
            </a>
          ))}
        </div>

        <div className="lk-note">
          <p>
            <strong>What these are.</strong> Working prototypes of one screen, not
            finished sites — hero, the five lines, one act, a strip and the real
            booking link. They exist so the choice is made by looking rather than
            by describing.
          </p>
          <p>
            <strong>The photography is the constraint, not the design.</strong>{" "}
            Only 72 of 871 frames have ever been graded by a person, and the
            grader reached for sunset light — so Golden Coast has 15 proven hero
            frames and only 6 support frames behind them, while Aegean Light has 3
            proven heroes and 279 candidates nobody has opened. Whichever you
            pick, one afternoon of grading comes first. See{" "}
            <code>qa/looks/RESERVOIR.md</code>.
          </p>
          <p>
            <strong>Nothing here is AI-generated.</strong> Every frame is a
            photograph of this property from the Phase 0 inventory. The policy
            that keeps it that way is in <code>AI-IMAGERY-POLICY.md</code> and is
            enforced on every push.
          </p>
        </div>
      </div>
    </div>
  );
}
