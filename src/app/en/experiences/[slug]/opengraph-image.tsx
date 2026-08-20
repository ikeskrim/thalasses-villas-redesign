import { ImageResponse } from "next/og";

import { getAllExperiences, getExperience } from "@/lib/content";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard, ogOptions, ogPlate } from "@/lib/og";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/**
 * PER-EXPERIENCE SHARE CARDS — all twenty-one.
 *
 * These are the pages a guest actually forwards ("look at this one"), and they
 * are also the thinnest pages on the site: fourteen of the twenty-one have
 * almost no copy in the registry. The card is built to survive that.
 *
 * **No sub-line.** `shortDescription` is empty or a fragment on most of them,
 * and a card that prints half a sentence looks broken in a message thread. The
 * name over its own photograph is complete; a truncated paragraph is not. The
 * two-tier policy that governs the pages governs the cards too — build from
 * what exists, never pad to look full.
 */
export function generateStaticParams() {
  return getAllExperiences().map((e) => ({ slug: e.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = getExperience(slug)!;

  return new ImageResponse(
    ogCard({
      eyebrow: "AN EXPERIENCE · THALASSES VILLAS · CRETE",
      title: e.name,
      plate: await ogPlate(e.heroImage),
    }),
    ogOptions()
  );
}
