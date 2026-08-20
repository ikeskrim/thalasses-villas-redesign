import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

import { localImage } from "@/lib/content";

/**
 * THE OPENGRAPH CARD — one renderer, every route.
 *
 * A share card is the only page of this site most people will ever see. It is
 * built here from the real photography and the real type system rather than
 * hand-made in an image editor, because a hand-made card drifts from the brand
 * the first time the type changes and nobody notices for a year.
 *
 * Three things are enforced centrally so no route can get them wrong:
 *
 *  1. **The frame is resolved through `localImage`**, exactly as `Field` does.
 *     A raw Loggia CDN address here would render an empty card and would also
 *     bypass the ruled-off list — that is T-185 and T-235, twice already.
 *
 *  2. **The scrim is unconditional and bounded.** `Field`'s doctrine applies:
 *     rather than analysing each photograph, the veil is heavy enough that the
 *     WORST case a photograph can physically produce still clears AA. Over pure
 *     white at alpha 0.80 the composite is #45575b and --limestone reads 6.3:1;
 *     the text band never sits above 0.80. No per-image analysis, no surprises
 *     when a brighter frame is swapped in.
 *
 *  3. **The display ceiling holds at 96px**, the same Direction D token the
 *     pages use. A card is not a viewport, so nothing forces this — but the
 *     ceiling is the language, and a card set larger than the site would be the
 *     one place the brand shouts.
 *
 * The measurement is not taken on trust: `tests/og-card.spec.ts` decodes the
 * rendered PNG and computes the real contrast in the band under the headline.
 * (CONVENTIONS §16 — a fix you cannot falsify is not a fix.)
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/** Direction D, verbatim. */
const BASALT = "#16262b";
const LIMESTONE = "#e8e9e3";
const SEAFOAM = "#a4ccc9";

/**
 * satori cannot read woff2 — the build fails with "Unsupported OpenType
 * signature wOF2". These are the same two typefaces in the format the image
 * renderer needs. They are BUILD-TIME ONLY and are never served to a browser;
 * the site itself still loads the woff2 through next/font.
 */
function ogFonts() {
  const read = (f: string) => fs.readFileSync(path.join(process.cwd(), "src", "app", "og", f));
  return [
    { name: "Marcellus", data: read("marcellus.ttf"), style: "normal" as const, weight: 400 as const },
    { name: "Marcellus SC", data: read("marcellus-sc.ttf"), style: "normal" as const, weight: 400 as const },
  ];
}

/**
 * A photograph from the pool, downscaled to card size and inlined.
 *
 * satori has no filesystem and no image pipeline: it needs the bytes, and it
 * will not crop. sharp does the cover-fit so the card gets a correctly composed
 * frame rather than a squashed one. Quality 72 on a 1200x630 JPEG lands around
 * 90 KB, which matters because it is inlined as a data URI into the render.
 *
 * Returns null when the frame is missing or ruled off, and every caller falls
 * back to the plain basalt ground. A card with no photograph is a card; a card
 * with a broken image is a bug someone sees on Twitter.
 */
export async function ogPlate(url: string | null | undefined): Promise<string | null> {
  const local = localImage(url);
  if (!local) return null;
  const file = path.join(process.cwd(), "public", local.replace(/^\//, ""));
  if (!fs.existsSync(file)) return null;
  const buf = await sharp(file)
    .resize(OG_SIZE.width, OG_SIZE.height, { fit: "cover", position: "attention" })
    .jpeg({ quality: 72 })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

export interface OgCardProps {
  /** The letterspaced micro register — place, or section. */
  eyebrow: string;
  /** The display line. Kept short; the ceiling is 96px and it must not wrap twice. */
  title: string;
  /** One sub-line of plain fact. Optional. */
  sub?: string | null;
  /** Registry figures, printed as a rule-separated strip. Optional. */
  facts?: string[];
  /** A data URI from `ogPlate`, or null for the plain basalt ground. */
  plate?: string | null;
}

/**
 * The card itself. Returned as an element so each route file stays four lines
 * and cannot quietly diverge from the others.
 */
export function ogCard({ eyebrow, title, sub, facts, plate }: OgCardProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: BASALT,
        fontFamily: "Marcellus",
      }}
    >
      {plate ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={plate}
          alt=""
          width={OG_SIZE.width}
          height={OG_SIZE.height}
          style={{ position: "absolute", top: 0, left: 0 }}
        />
      ) : null}

      {/*
        THE VEIL. Heaviest at the base, where the type sits, and reaching 0.20
        at 78% so the sky stays visible above the copy. The whole text block is
        below 55% of the height, so no glyph ever sits on less than 0.80.
      */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          background:
            "linear-gradient(to top, rgba(22,38,43,0.94) 0%, rgba(22,38,43,0.88) 30%, rgba(22,38,43,0.80) 45%, rgba(22,38,43,0.34) 72%, rgba(22,38,43,0.10) 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          width: "100%",
          height: "100%",
          padding: 68,
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Marcellus SC",
            fontSize: 21,
            letterSpacing: 5,
            color: SEAFOAM,
          }}
        >
          {eyebrow}
        </div>

        {/*
          The Direction D ceiling. 96px is a CEILING, not a size — a long name
          steps down rather than wrapping into three lines and shoving the
          eyebrow off the top of a fixed 630px frame. The step is measured in
          characters because satori gives no text metrics to measure with, and
          the thresholds were set by rendering the longest real title in the
          inventory rather than guessed.
        */}
        <div
          style={{
            display: "flex",
            fontSize: title.length > 34 ? 60 : title.length > 22 ? 74 : 96,
            lineHeight: 1.04,
            letterSpacing: -2,
            color: LIMESTONE,
            marginTop: 18,
          }}
        >
          {title}
        </div>

        {sub ? (
          <div
            style={{ display: "flex", fontSize: 28, color: SEAFOAM, marginTop: 16, maxWidth: 900 }}
          >
            {sub}
          </div>
        ) : null}

        {facts && facts.length > 0 ? (
          <div
            style={{
              display: "flex",
              fontFamily: "Marcellus SC",
              fontSize: 20,
              letterSpacing: 3,
              color: LIMESTONE,
              marginTop: 22,
            }}
          >
            {facts.join("   ·   ")}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Options for `new ImageResponse(...)`, so no route repeats the font wiring. */
export function ogOptions() {
  return { ...OG_SIZE, fonts: ogFonts() };
}
