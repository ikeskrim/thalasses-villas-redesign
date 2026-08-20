import { ImageResponse } from "next/og";

import { COLLECTION_VILLA_IDS, getVilla } from "@/lib/content";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard, ogOptions, ogPlate } from "@/lib/og";
import { VILLA_PAGE_COPY } from "@/lib/villa-page";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/**
 * PER-VILLA SHARE CARDS.
 *
 * A villa link shared into a message is the first frame of the sale, and until
 * now all five resolved to the same generic estate card — five different houses
 * behind one photograph.
 *
 * The slug set is derived from the registry, exactly as the page's own
 * `generateStaticParams` derives it, so a sixth villa in the inventory produces
 * a sixth card with no edit here. (CONVENTIONS §14 — derive, do not type.)
 */
export function generateStaticParams() {
  return COLLECTION_VILLA_IDS.map((key) => ({ slug: getVilla(key).slug }));
}

const KEY_BY_SLUG = Object.fromEntries(
  COLLECTION_VILLA_IDS.map((key) => [getVilla(key).slug, key])
);

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const key = KEY_BY_SLUG[slug]!;
  const villa = getVilla(key);

  /*
   * The figures come straight off `villa.specs` — the same locked capacity
   * table `specStrip` prints on the page and JSON-LD asserts against. One
   * source, so a card can never claim a different number of bedrooms from the
   * page it links to.
   *
   * The WORDS are not `specStrip`'s. Its labels are table headings sitting
   * above their values ("1" over "Bathrooms"), which is correct in a spec grid
   * and wrong set inline — the first draft of this card read "1 BATHROOMS ·
   * 4 SLEEPS". An inline strip is a sentence and has to agree like one.
   *
   * Absent fields are omitted rather than dashed. Villa Pueblo simply carries a
   * shorter strip. (T-212.)
   */
  const s = villa.specs;
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const facts = [
    s.bedrooms ? plural(s.bedrooms, "BEDROOM", "BEDROOMS") : null,
    s.bathrooms ? plural(s.bathrooms, "BATHROOM", "BATHROOMS") : null,
    s.maxGuests ? `SLEEPS ${s.maxGuests}` : null,
    s.pools ? plural(s.pools, "PRIVATE POOL", "PRIVATE POOLS") : null,
  ].filter((f): f is string => Boolean(f));

  return new ImageResponse(
    ogCard({
      eyebrow: "THALASSES VILLAS · RETHYMNO · CRETE",
      title: villa.name,
      /*
       * NOT `shortDescription`. The registry gives the same 580-character
       * paragraph to four of the five villas — a sub-line from it would make
       * four different houses read as one listing. `tail` is the villa's own
       * distinguishing line and it is already the second half of the h1 on the
       * page the card links to, so the card and the page say the same thing.
       */
      sub: VILLA_PAGE_COPY[key]?.tail ?? null,
      facts,
      plate: await ogPlate(villa.gallery.heroImage),
    }),
    ogOptions()
  );
}
