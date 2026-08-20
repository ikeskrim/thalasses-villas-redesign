import { ImageResponse } from "next/og";

import { getVilla } from "@/lib/content";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard, ogOptions, ogPlate } from "@/lib/og";

export const runtime = "nodejs";
export const alt = "The whole of Thalasses Villas — four villas behind one gate, Rethymno, Crete";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/**
 * THE ESTATE CARD.
 *
 * Its words are the page's own h1 — "Gathering / All four, one gate" — split
 * into title and sub-line rather than reworded, so a share and the page it
 * opens make the same promise. The estate is the concierge-framed enquiry, not
 * a bookable unit, and the card carries no figures for that reason.
 */
export default async function Image() {
  const estate = getVilla("2142");
  return new ImageResponse(
    ogCard({
      eyebrow: "THE ENTIRE ESTATE · RETHYMNO · CRETE",
      title: "All four, one gate",
      sub: "The whole property, taken privately, arranged by the house",
      plate: await ogPlate(estate.gallery.heroImage),
    }),
    ogOptions()
  );
}
