import { ImageResponse } from "next/og";

import { getHomepageData } from "@/lib/homepage";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard, ogOptions, ogPlate } from "@/lib/og";

export const runtime = "nodejs";
export const alt = "Thalasses Villas — five seafront villas in Rethymno, Crete";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/**
 * THE SITE-WIDE CARD, and the fallback for every route that does not declare
 * its own. Its frame is the homepage hero, read from the same resolver the
 * homepage uses rather than named again here — one hero, one source.
 *
 * The sub-line is the hero sub-line shipping as a working default (T-256). If
 * the owner changes it on the page it must change here too; that is why it is
 * written once in this file and nowhere else in the OG layer.
 */
export default async function Image() {
  const d = getHomepageData();
  return new ImageResponse(
    ogCard({
      eyebrow: "PIGIANOS KAMPOS · RETHYMNO · CRETE",
      title: "Living Unlimited",
      sub: "Five seafront villas, one private beach fifty metres from the door",
      plate: await ogPlate(d.frame.hero.path),
    }),
    ogOptions()
  );
}
