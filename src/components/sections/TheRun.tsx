import Image from "next/image";

import { ImageReveal } from "@/components/motion/Reveal";
import { localImage } from "@/lib/content";

export interface RunImage {
  url: string;
  caption: string | null;
}

/**
 * THE RUN — the villa gallery (DESIGN-PLAN §5.6).
 *
 * Two variants, chosen by how much photography actually exists. This is the
 * point of T-161: Villa Pueblo has 5 images and Villa Eeanthe has 104, and a
 * single grid cannot serve both. A grid tuned for 104 leaves Pueblo with holes;
 * a grid tuned for 5 wastes Eeanthe. So the low-count case is designed as its
 * own considered layout rather than as a degraded version of the other.
 *
 * PLATES (< 14 images) — few, large, generous. Full-bleed opener, then single
 * plates at 76% measure alternating their alignment, each with air around it.
 * Nothing is repeated and no slot is ever empty: the layout is a function of
 * the count, so five images produce five deliberate moments.
 *
 * RUN (>= 14 images) — the horizon-locked, zero-gap vertical sequence. Frames
 * butt together so the waterline holds still, interrupted by bounded interior
 * plates where a real caption warrants one.
 *
 * Captions are printed only where a real one exists. An empty caption slot is
 * never rendered — of 906 image slots in the inventory only 225 carry text.
 */
const PLATES_THRESHOLD = 14;

export function TheRun({ images, villaName }: { images: RunImage[]; villaName: string }) {
  const usable = images.filter((i) => localImage(i.url));
  if (!usable.length) return null;

  return usable.length < PLATES_THRESHOLD ? (
    <Plates images={usable} villaName={villaName} />
  ) : (
    <Run images={usable} villaName={villaName} />
  );
}

/* ------------------------------------------------------------------ plates -- */

function Plates({ images, villaName }: { images: RunImage[]; villaName: string }) {
  const [opener, ...rest] = images;
  if (!opener) return null;

  return (
    <section className="plates" aria-label={`${villaName} photographs`}>
      <ImageReveal className="plates-opener">
        <Image
          src={localImage(opener.url)!}
          alt={opener.caption ?? `${villaName}, Thalasses Villas`}
          fill
          sizes="100vw"
          quality={82}
          style={{ objectFit: "cover" }}
        />
      </ImageReveal>
      {opener.caption ? <p className="caption plates-caption canon">{opener.caption}</p> : null}

      {rest.map((img, i) => (
        <figure
          key={img.url}
          className={`plate ${i % 2 === 0 ? "plate--left" : "plate--right"}`}
        >
          <ImageReveal className="plate-figure">
            <Image
              src={localImage(img.url)!}
              alt={img.caption ?? `${villaName}, Thalasses Villas`}
              fill
              sizes="(max-width: 767px) 100vw, 76vw"
              quality={82}
              style={{ objectFit: "cover" }}
            />
          </ImageReveal>
          {img.caption ? <figcaption className="caption plate-caption">{img.caption}</figcaption> : null}
        </figure>
      ))}
    </section>
  );
}

/* --------------------------------------------------------------------- run -- */

/**
 * The run is CURATED, not exhaustive.
 *
 * Villa Eeanthe has 45 featured photographs. Rendering all of them full-bleed
 * produced a 35,531px page — roughly forty screens — which is endurance, not
 * cinema. The brief's own standard is "less, but perfect".
 *
 * So: the first RUN_LIMIT frames run full-bleed and horizon-locked, captioned
 * frames preferred because they carry real editorial text; everything else is
 * still shown, as a contact sheet in the manner of a plate index at the back of
 * a book. Nothing is dropped — content parity is preserved — but the page stops
 * asking for forty screens of scroll.
 */
const RUN_LIMIT = 12;

function Run({ images, villaName }: { images: RunImage[]; villaName: string }) {
  // Keep source order, but let captioned frames win the limited slots.
  const ranked = images
    .map((img, i) => ({ img, i, captioned: Boolean(img.caption) }))
    .sort((a, b) => (a.captioned === b.captioned ? a.i - b.i : a.captioned ? -1 : 1));

  const chosen = new Set(ranked.slice(0, RUN_LIMIT).map((r) => r.i));
  const lead = images.filter((_, i) => chosen.has(i));
  const sheet = images.filter((_, i) => !chosen.has(i));

  return (
    <>
      <section className="run" aria-label={`${villaName} photographs`}>
        {lead.map((img, i) => (
          <figure key={`${img.url}-${i}`} className="run-frame">
            <Image
              src={localImage(img.url)!}
              alt={img.caption ?? `${villaName}, Thalasses Villas`}
              fill
              sizes="100vw"
              quality={82}
              loading={i < 2 ? "eager" : "lazy"}
              style={{ objectFit: "cover" }}
            />
            {/*
              A caption over a photograph needs a ground, and the run frames had
              none — `Field` carries an unconditional scrim for exactly this
              reason, and the run does not go through Field. On a frame whose
              lower third is a sunlit timber deck, limestone type on white timber
              was simply unreadable; a full-page screenshot showed it, no
              assertion could.

              Rendered only where a caption exists, so an uncaptioned frame stays
              a clean photograph. Worst case — pure white beneath — the composite
              is #505C60 and limestone reads 5.7:1 on it, AA at body size.
            */}
            {img.caption ? (
              <>
                <span className="run-scrim" aria-hidden="true" />
                <figcaption className="caption run-caption">{img.caption}</figcaption>
              </>
            ) : null}
          </figure>
        ))}
      </section>

      {sheet.length ? (
        <section className="canon contact-sheet" aria-label={`More photographs of ${villaName}`}>
          <p className="micro">
            {sheet.length} more photographs
          </p>
          <ul className="contact-sheet-grid">
            {sheet.map((img, i) => (
              <li key={`${img.url}-sheet-${i}`} className="contact-sheet-item">
                <Image
                  src={localImage(img.url)!}
                  alt={img.caption ?? `${villaName}, Thalasses Villas`}
                  fill
                  sizes="(max-width: 767px) 50vw, 20vw"
                  quality={75}
                  loading="lazy"
                  style={{ objectFit: "cover" }}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
