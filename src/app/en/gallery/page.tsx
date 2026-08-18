import type { Metadata } from "next";

import { GalleryGrid, type Cluster } from "@/components/sections/GalleryGrid";
import { PageHead, PageShell } from "@/components/sections/PageShell";
import { COLLECTION_VILLA_IDS, getVilla, localImage } from "@/lib/content";
import { SELECTS } from "@/lib/selects";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "The photography of Thalasses Villas — the estate, the beach, and the five houses, in the golden hour.",
  alternates: { canonical: "/en/gallery" },
};

/**
 * THE GALLERY.
 *
 * A-GRADE FRAMES LEAD. The eighteen curated selects open the page, because they
 * are the only frames graded twice and ruled on by the owner; everything else
 * follows, grouped by house. A gallery that opens on whatever the CMS returned
 * first is a folder, not a gallery.
 *
 * Captions come from the inventory and nowhere else. Of 906 image slots only
 * 225 carry text, so most frames are shown without one rather than captioned
 * with something invented.
 *
 * Video slots are ready: `content/video-slots.json` is read if present, so the
 * owner's MP4s appear here as soon as they land, without a code change.
 */
export default function GalleryPage() {
  const opening: Cluster = {
    beat: "01",
    title: "The selects",
    frames: SELECTS.map((s) => ({ src: s.path, alt: s.alt, caption: null })),
  };

  const houses: Cluster[] = COLLECTION_VILLA_IDS.map((key, i) => {
    const villa = getVilla(key);
    const frames = villa.gallery.featured
      .map((f) => ({ src: localImage(f.image), alt: `${villa.name}, Thalasses Villas`, caption: f.caption }))
      .filter((f): f is { src: string; alt: string; caption: string | null } => Boolean(f.src))
      .slice(0, 12);
    return {
      beat: String(i + 2).padStart(2, "0"),
      title: villa.name,
      frames,
    };
  }).filter((c) => c.frames.length > 0);

  return (
    <PageShell>
      <PageHead
        beat="Gallery"
        title="Looking at all of it"
        lede="Eighteen frames earned their place across two grading passes. The rest follow, house by house."
      />
      <GalleryGrid clusters={[opening, ...houses]} />
    </PageShell>
  );
}
