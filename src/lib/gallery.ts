import type { Villa } from "@/types/content";
import { isBlockedImage, localImage } from "@/lib/content";

/**
 * GALLERY SLOT ARCHITECTURE — data plumbing, not composition.
 *
 * One place decides how a set of photographs is laid out, so the answer moves
 * with the data instead of with the markup. Villa Pueblo has 5 images today and
 * will have 20+ after the shoot; Villa Eeanthe has 104. The same call handles
 * both, and neither needs a component edited when the count changes.
 *
 * Thresholds live here rather than inside the rendering component so that the
 * decision is inspectable, testable, and adjustable in one edit.
 */

export interface GalleryImage {
  url: string;
  caption: string | null;
}

/** Below this, the low-count "plates" layout. At or above it, the run. */
export const PLATES_THRESHOLD = 14;

/** How many frames run full-bleed before the remainder becomes a contact sheet. */
export const RUN_LIMIT = 12;

export type GalleryMode = "plates" | "run";

export interface GalleryPlan {
  mode: GalleryMode;
  /** Full-bleed frames, in reading order. */
  lead: GalleryImage[];
  /** Everything else, shown as a plate index. Empty in plates mode. */
  sheet: GalleryImage[];
  total: number;
  captioned: number;
  /** True when the shoot has not landed yet and the page is running thin. */
  sparse: boolean;
}

/**
 * Resolve a villa's photographs into a layout plan.
 *
 * Blocked images are dropped here as well as in `localImage()` — belt and
 * braces, because this function also reports counts, and a count that includes
 * an image that will never render is a lie the layout would act on.
 */
export function planGallery(images: GalleryImage[]): GalleryPlan {
  const usable = images.filter((i) => !isBlockedImage(i.url) && localImage(i.url));
  const total = usable.length;
  const captioned = usable.filter((i) => i.caption).length;

  if (total < PLATES_THRESHOLD) {
    return { mode: "plates", lead: usable, sheet: [], total, captioned, sparse: total < 8 };
  }

  // Captioned frames earn the limited full-bleed slots; source order is kept
  // within each tier so the sequence still reads as the photographer shot it.
  const ranked = usable
    .map((img, i) => ({ img, i, captioned: Boolean(img.caption) }))
    .sort((a, b) => (a.captioned === b.captioned ? a.i - b.i : a.captioned ? -1 : 1));
  const chosen = new Set(ranked.slice(0, RUN_LIMIT).map((r) => r.i));

  return {
    mode: "run",
    lead: usable.filter((_, i) => chosen.has(i)),
    sheet: usable.filter((_, i) => !chosen.has(i)),
    total,
    captioned,
    sparse: false,
  };
}

/** A villa's photographs, preferring captioned featured frames over the raw set. */
export function villaGalleryImages(villa: Villa): GalleryImage[] {
  if (villa.gallery.featured.length > 0) {
    return villa.gallery.featured.map((f) => ({ url: f.image, caption: f.caption }));
  }
  return villa.gallery.allImages.map((u) => ({ url: u, caption: null }));
}
