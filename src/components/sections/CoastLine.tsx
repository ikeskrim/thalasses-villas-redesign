import { Reveal } from "@/components/motion/Reveal";
import { Clause } from "@/components/ui/Clause";

export interface CoastEntry {
  name: string;
  value: string;
  note?: string;
}

/**
 * Beat 07 — THE COAST LINE (DESIGN-PLAN §6.5).
 *
 * Not map-left / list-right. One line runs down the page and everything hangs
 * off it in order of distance, so the page itself is a scale: the beach at the
 * top at zero metres, Chania port at the bottom at 61.2 km. Reading it is the
 * experience of moving away from the water.
 *
 * Every figure is tabular so the column holds still, and every one of them is
 * owner-confirmed — nothing here is estimated.
 */
export function CoastLine({
  entries,
  beaches,
}: {
  entries: CoastEntry[];
  beaches: { name: string; distance: string | null }[];
}) {
  const measured = beaches.filter(
    (b): b is { name: string; distance: string } => Boolean(b.distance)
  );
  const unmeasured = beaches.filter((b) => !b.distance);

  return (
    <section className="canon coastline" id="location">
      <Reveal>
        <p className="micro">07 — Location</p>
        <div className="clause-field" style={{ marginTop: "var(--spacing-step-4)" }}>
          <Clause gerund="Wandering" tail="South, forty minutes" scale="c2" as="h2" />
        </div>
      </Reveal>

      <div className="coastline-grid">
        <Reveal className="coastline-col">
          <p className="micro coastline-heading">From the door</p>
          <dl className="coastline-list">
            {entries.map((e, i) => (
              <div key={e.name} className="coastline-entry" style={{ ["--i" as string]: i }}>
                <dt className="small coastline-name">{e.name}</dt>
                <dd className="tabular coastline-value">
                  {e.value}
                  {e.note ? <span className="caption coastline-note">{e.note}</span> : null}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        {/*
          THE BLANKS.

          Eight of the eleven beaches in the inventory carry no distance, and the
          old markup printed `—` for each of them: a column of dashes that reads
          as missing data rather than as a design. Inventing the eight distances
          is not available — nothing in the registry states them.

          So the layout stops asking. Beaches WITH a confirmed distance keep the
          measured two-column treatment; the rest become what they honestly are —
          a list of names, set as a sentence. Absence is no longer rendered as a
          hole, and not one figure was invented to close it.

          When the owner supplies the distances they simply move columns: the
          split is computed from the data, not hard-coded.
        */}
        <Reveal className="coastline-col" index={1}>
          <p className="micro coastline-heading">Beaches we send you to</p>
          <dl className="coastline-list">
            {measured.map((b) => (
              <div key={b.name} className="coastline-entry">
                <dt className="small coastline-name">{b.name}</dt>
                <dd className="tabular coastline-value">{b.distance}</dd>
              </div>
            ))}
          </dl>
          {unmeasured.length ? (
            <p className="small coastline-further">
              <span className="micro coastline-further-label">Further south</span>
              {unmeasured.map((b) => b.name).join(" · ")}
            </p>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
