import type { Metadata } from "next";

import { LOOKS } from "./looks-data";

export const metadata: Metadata = {
  title: "Four looks — Thalasses",
  robots: { index: false, follow: false },
};

/**
 * THE CHOOSER — the page the owner opens on his phone.
 *
 * It is deliberately plain. It is a menu, not a fifth design, and a chooser
 * that has a look of its own competes with the four things it is asking about.
 *
 * Greek first in each card, because he reads Greek first.
 */
export default function LooksIndex() {
  return (
    <div className="lk-chooser">
      <div className="lk-chooser-inner">
        <h1>Τέσσερις όψεις. Διάλεξε μία.</h1>
        <p className="lk-chooser-lede">
          Four directions for the same site — your photographs, your words, your
          property. Nothing here is a mock-up of somebody else&rsquo;s hotel: every
          frame is from the estate, and every line is already on the site. Three
          lead with photography; the fourth leads with the words and keeps the
          photographs small. Open each one, then pick the one you want to live in.
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
              {/*
                THE WARDROBE STRIP — four more frames, so the card shows the
                look wearing its real clothes rather than its best single
                photograph. A hero flatters every direction; what separates them
                is what the fifth-best frame looks like.
              */}
              <div className="lk-card-strip" aria-hidden="true">
                {look.strip.map((f) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={f.src}
                    src={f.src}
                    alt=""
                    width={f.w}
                    height={f.h}
                    loading="lazy"
                    decoding="async"
                  />
                ))}
              </div>

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
                {/*
                  Direction E is measured on a different axis on purpose. Its
                  argument is that it needs THREE reserved photographs rather
                  than ten, so quoting it the same "proven hero frames" line as
                  the photo-led looks would flatter it with a number that is not
                  its constraint.
                */}
                <p className="lk-card-meta">
                  {look.id === "type-alive" ? (
                    <>
                      Needs <strong>3</strong> reserved photographs, not 10 ·{" "}
                      {look.reservoir.proven} available
                    </>
                  ) : (
                    <>
                      <strong>{look.reservoir.proven}</strong> proven hero frames ·{" "}
                      <strong>{look.reservoir.support}</strong> support ·{" "}
                      {look.reservoir.candidates} ungraded
                    </>
                  )}
                </p>

                {/*
                  The typographic bill. Verified from the font catalogue, not
                  recalled — this line is about money and coverage, and the owner
                  is making a decision on it.
                */}
                <p className="lk-card-meta">{look.fonts.bill}</p>

                {/*
                  The production risk, and ONLY when there is one. A warning that
                  appears on every card is decoration; a warning that appears on
                  one is information.
                */}
                {look.risk ? <p className="lk-card-risk">{look.risk}</p> : null}

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
            The whole library has now been graded — 712 of 871 frames, two
            independent graders each. It holds <strong>33</strong> hero-grade
            photographs, and only <strong>five</strong> of those are daylight.
            That is why Aegean Light carries a warning and why the fourth
            direction exists: Type-Alive leads with words, so it needs three
            reserved photographs instead of ten. See{" "}
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
