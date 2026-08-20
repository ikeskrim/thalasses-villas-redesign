import { ImageResponse } from "next/og";

import { getVilla } from "@/lib/content";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard, ogOptions, ogPlate } from "@/lib/og";

export const runtime = "nodejs";
export const alt = "Thalasses Rituals — the wedding and events venue at Thalasses Villas, Crete";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/**
 * THE WEDDINGS CARD.
 *
 * The one page on this site people share at someone else rather than at
 * themselves — a couple sends it to a planner, a planner sends it to a couple —
 * so it is the card most worth building properly.
 *
 * Words taken from the page's own h1, "Marrying / On sand, beside the water".
 * The 150 m² saltwater pool is the venue's registry fact and the only figure
 * here; no capacity, no price, because the registry states neither.
 */
export default async function Image() {
  const venue = getVilla("rituals");
  return new ImageResponse(
    ogCard({
      eyebrow: "THALASSES RITUALS · RETHYMNO · CRETE",
      title: "On sand, beside the water",
      sub: "The wedding and events venue at Thalasses Villas",
      plate: await ogPlate(venue.gallery.heroImage),
    }),
    ogOptions()
  );
}
