import type { Metadata } from "next";

import { GalleryGrid, type Cluster } from "@/components/sections/GalleryGrid";
import { PageHead, PageShell } from "@/components/sections/PageShell";
import { frameAlts } from "@/lib/alt";
import { COLLECTION_VILLA_IDS, getVilla, localImage } from "@/lib/content";
import { SELECTS } from "@/lib/selects";
import { alternatesFor } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "The photography of Thalasses Villas — the estate, the beach, and the five houses, in the golden hour.",
  alternates: alternatesFor("/en/gallery"),
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
    /*
     * Alt text through the shared resolver, not `${villa.name}, Thalasses
     * Villas` twelve times over. That fallback is the T4-2 defect, and this
     * page had its own copy of it: the gallery served 66 images under 22
     * distinct descriptions, twelve of them identical.
     *
     * The cluster's own heading already says which villa this is, so the frame
     * only has to say which frame it is.
     */
    const picked = villa.gallery.featured.slice(0, 12);
    const alts = frameAlts(
      villa,
      picked.map((f) => ({ url: f.image, caption: f.caption })),
      villa.name
    );
    const frames = picked
      .map((f, n) => ({ src: localImage(f.image), alt: alts[n]!, caption: f.caption }))
      .filter((f): f is { src: string; alt: string; caption: string | null } => Boolean(f.src));
    return {
      beat: String(i + 2).padStart(2, "0"),
      title: villa.name,
      frames,
    };
  }).filter((c) => c.frames.length > 0);

  /*
   * ONE MORE DEDUPE, AT PAGE LEVEL.
   *
   * `frameAlts` disambiguates within a set, and each villa is its own set — but
   * the villas share captions. "Easy access to our Private beach" is written on
   * a frame in four different villas' galleries, so four clusters each deduped
   * cleanly and the page still said it four times.
   *
   * A sighted reader sees the cluster heading and knows which house they are
   * looking at. Someone listening does not, so the house's name is what makes
   * the repeat distinct — and it is a fact the page is already asserting one
   * heading above.
   */
  const across = new Map<string, number>();
  for (const c of houses) for (const f of c.frames) across.set(f.alt, (across.get(f.alt) ?? 0) + 1);
  for (const c of houses) {
    for (const f of c.frames) {
      if ((across.get(f.alt) ?? 0) > 1 && !f.alt.includes(c.title)) {
        f.alt = `${f.alt} — ${c.title}`;
      }
    }
  }

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
