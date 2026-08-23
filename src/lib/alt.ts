import "server-only";

import photoSelects from "../../content/photo-selects.json";

import { localImage } from "@/lib/content";
import type { Villa } from "@/types/content";

/**
 * ALT TEXT THAT SAYS SOMETHING.
 *
 * The estate page rendered **48 photographs, 46 of which had the identical alt
 * text** — "The Entire Estate, Thalasses Villas", forty-six times in a row. The
 * wedding venue rendered 31 the same way. A screen-reader user heard one
 * sentence, repeated, for the entire photographic heart of two pages.
 *
 * **axe passed it**, every time, because axe checks that an alt attribute
 * EXISTS. Whether it says anything is not a machine question, and that is
 * exactly why it survived eleven routes of automated accessibility testing.
 *
 * The cause was a reasonable-looking fallback: `img.caption ?? villaName`.
 * Villas Thoi and Eeanthe carry captions on 37 of 40 and 43 of 45 frames, so on
 * those pages the fallback almost never fired and the code looked fine. The
 * estate and Rituals carry **zero** captions, so on those two it fired every
 * time.
 *
 * THE RULE HERE: never invent a specific. This resolver only ever says things
 * the inventory already knows, in this order of preference —
 *
 *   1. The frame's own caption, recovered in Phase 0. The best answer, because
 *      somebody looked at the photograph and wrote what was in it.
 *   2. The curated `subject` from `content/photo-selects.json` — 72 frames were
 *      graded by eye during the curation pass and each got a written subject
 *      line ("Beach umbrellas and loungers, golden hour, sea behind").
 *   3. WHICH HOUSE IT SHOWS. The estate's gallery is organised into four
 *      albums, one per villa, so an uncaptioned estate photograph is not
 *      anonymous at all — the inventory knows it is a photograph of Villa
 *      Eeanthe. That single fact turns 46 identical alts into four meaningful
 *      groups, and it was sitting in the registry the whole time.
 *   4. A positional fallback that is at least distinct: "photograph 12 of 46".
 *      Honest, unhelpful, and better than the same sentence forty-six times —
 *      and it makes the gap visible in the audit instead of hiding it.
 */

interface Select {
  path?: string;
  subject?: string;
}
const SELECTS: Select[] = ((photoSelects as { selects?: Select[] }).selects ?? []).filter(
  (s) => s.path && s.subject
);

const SUBJECT_BY_PATH = new Map(SELECTS.map((s) => [s.path!, s.subject!]));

/**
 * Which album a frame belongs to, by resolved local path.
 *
 * Built per villa rather than globally: the same photograph can appear in the
 * estate's "Villa Thoi" album and on Villa Thoi's own page, where saying "Villa
 * Thoi" adds nothing the page has not already said.
 */
function albumIndex(villa: Villa): Map<string, string> {
  const map = new Map<string, string>();
  for (const album of villa.gallery.albums ?? []) {
    for (const url of album.images ?? []) {
      const local = localImage(url);
      if (local && !map.has(local)) map.set(local, album.title);
    }
  }
  return map;
}

export interface AltContext {
  /** The frame's own caption from the inventory, if it has one. */
  caption?: string | null;
  /** The inventory URL, used to look up curated and album descriptions. */
  url?: string | null;
  /** The page's subject — "Villa Thoi", "The Entire Estate". */
  subjectName: string;
  /** Position in the set, one-based, for the last-resort fallback. */
  index?: number;
  total?: number;
}

/**
 * Build the alt text for one photograph.
 *
 * `albums` is passed in rather than recomputed per image: a villa page renders
 * up to 104 frames and rebuilding the index for each one would walk the whole
 * gallery 104 times.
 */
export function frameAlt(ctx: AltContext, albums?: Map<string, string>): string {
  const caption = ctx.caption?.trim();
  if (caption) return caption;

  const local = localImage(ctx.url);

  const position = ctx.index && ctx.total ? ` — photograph ${ctx.index} of ${ctx.total}` : "";

  if (local) {
    const subject = SUBJECT_BY_PATH.get(local);
    if (subject) return `${subject}, ${ctx.subjectName}`;

    const album = albums?.get(local);
    /*
     * An album name only helps when it NAMES something. On the estate the four
     * albums are the four villas, which is exactly the fact worth saying — it
     * turns 46 anonymous frames into "this one is Villa Eeanthe".
     *
     * Thalasses Rituals has one album and it is called "Photo gallery". That
     * fired for all 31 of its frames and produced "Photo gallery, at Thalasses
     * Rituals" twenty-eight times — the original defect with an extra clause
     * bolted on. A generic album title is not a description and is refused
     * here, so those frames fall through to the positional form, which is at
     * least honest about knowing nothing.
     */
    const generic = /^(photo gallery|gallery|photos?|album|images?|untitled)$/i;
    if (album && !generic.test(album.trim()) && album.toLowerCase() !== ctx.subjectName.toLowerCase()) {
      /*
       * The position is appended even here. Fourteen frames all saying "Villa
       * Eeanthe" is better than forty-six saying "The Entire Estate", and it is
       * still fourteen identical announcements to anyone listening. The section
       * carries an aria-label naming the set, so the frame only has to say
       * which one it is.
       */
      return `${album}${position}`;
    }
  }

  return `${ctx.subjectName}${position}`;
}

/**
 * A whole set at once: builds the album index once, and disambiguates any
 * description the set repeats.
 *
 * THE INVENTORY ITSELF CONTAINS DUPLICATE CAPTIONS. The legacy site captioned
 * four different frames "Easy access to our Private beach" and three "Barbecue
 * area" — a content fact, not a code defect, and not something to correct in
 * `content/`, which is the Phase 0 record.
 *
 * But four images announcing the same sentence is the same experience for a
 * screen-reader user whatever the cause. So a repeated description keeps its
 * words and gains its position: "Easy access to our Private beach — photograph
 * 7 of 12". Nothing is invented, nothing is lost, and no two frames in a set
 * sound identical.
 *
 * Descriptions that occur ONCE are left exactly as written. Appending "1 of 12"
 * to a good caption would be noise.
 */
export function frameAlts(
  villa: Villa | null,
  frames: { url: string | null; caption: string | null }[],
  subjectName: string
): string[] {
  const albums = villa ? albumIndex(villa) : undefined;
  const base = frames.map((f, i) =>
    frameAlt(
      { caption: f.caption, url: f.url, subjectName, index: i + 1, total: frames.length },
      albums
    )
  );

  const seen = new Map<string, number>();
  for (const a of base) seen.set(a, (seen.get(a) ?? 0) + 1);

  return base.map((a, i) =>
    (seen.get(a) ?? 0) > 1 && !a.includes("— photograph ")
      ? `${a} — photograph ${i + 1} of ${frames.length}`
      : a
  );
}
