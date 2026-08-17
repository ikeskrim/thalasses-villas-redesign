import "server-only";

import fs from "node:fs";
import path from "node:path";

import type {
  BookingConfig,
  Experience,
  Facilities,
  Villa,
} from "@/types/content";

/**
 * Single source of truth: the Phase 0 inventory in /content.
 * Everything is read at build time (server components only) so no content
 * JSON ships to the browser.
 */
const CONTENT_DIR = path.join(process.cwd(), "content");

function readJson<T>(...segments: string[]): T {
  const file = path.join(CONTENT_DIR, ...segments);
  return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
}

function readDir(...segments: string[]): string[] {
  const dir = path.join(CONTENT_DIR, ...segments);
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort();
}

/* ---------------------------------------------------------------- villas -- */

/**
 * D1a/D1b (owner-confirmed): the public Villa Collection is FIVE villas —
 * Thoi, Persi, Eeanthe, Melia and Pueblo — with The Entire Estate (the four
 * original villas combined) as the crown piece. Thalasses Rituals leaves the
 * collection entirely and becomes the Weddings & Events venue.
 *
 * Because the collection is five, "five villas" is now structurally accurate
 * site-wide and the legacy five-vs-four contradiction is resolved by the IA
 * itself. Estate copy says "four villas combined as one". Capacity figures
 * remain gated behind [CONFIRM] — see needsConfirm() below.
 */
export const COLLECTION_VILLA_IDS = ["200", "201", "202", "203", "pueblo"] as const;
export const ESTATE_ID = "2142";
export const ESTATE_VILLA_IDS = ["200", "201", "202", "203"] as const;
export const WEDDINGS_VENUE_ID = "rituals";

export function getVilla(id: string): Villa {
  return readJson<Villa>("villas", `${id}.json`);
}

/** The five villas of the collection, in the order they are presented. */
export function getCollectionVillas(): Villa[] {
  return COLLECTION_VILLA_IDS.map(getVilla);
}

/** The four villas that make up The Entire Estate. */
export function getEstateVillas(): Villa[] {
  return ESTATE_VILLA_IDS.map(getVilla);
}

export function getEstate(): Villa {
  return getVilla(ESTATE_ID);
}

export function getWeddingsVenue(): Villa {
  return getVilla(WEDDINGS_VENUE_ID);
}

/** Every villa file on disk, including the ones not published. */
export function getAllVillas(): Villa[] {
  return readDir("villas").map((f) => readJson<Villa>("villas", f));
}

export function getVillaBySlug(slug: string): Villa | undefined {
  return getAllVillas().find((v) => v.slug === slug);
}

/* ------------------------------------------------------------ facilities -- */

/**
 * Amenity data recovered from the legacy JS bundles. The old site rendered only
 * tab 0; `includeHidden` (the default) returns all six real groups.
 */
export function getFacilities(page: string, includeHidden = true): Facilities {
  const data = readJson<Facilities>("facilities", `${page}.json`);
  if (includeHidden) return data;
  return { ...data, tabs: data.tabs.filter((t) => t.displayedOnLiveSite) };
}

export function getFacilitiesForVilla(villa: Villa, includeHidden = true): Facilities {
  const page = villa.facilities.ref.replace(/^.*\//, "").replace(/\.json$/, "");
  return getFacilities(page, includeHidden);
}

/* ----------------------------------------------------------- experiences -- */

export function getAllExperiences(): Experience[] {
  return readDir("experiences").map((f) => readJson<Experience>("experiences", f));
}

export function getExperience(slug: string): Experience | undefined {
  return getAllExperiences().find((e) => e.slug === slug);
}

/**
 * D3: experiences render in two tiers. Flagship pages have enough real copy to
 * carry a full editorial layout; compact ones are title + image + one line until
 * copy is approved. `needsContent` is set in the inventory from the word count.
 */
export function getExperienceTiers(): { flagship: Experience[]; compact: Experience[] } {
  const all = getAllExperiences();
  const isFlagship = (e: Experience) =>
    !e.needsContent || e.copyStatus === "approved";
  return {
    flagship: all.filter(isFlagship),
    compact: all.filter((e) => !isFlagship(e)),
  };
}

/* --------------------------------------------------------------- generic -- */

export const getSite = () => readJson<Record<string, unknown>>("site.json");
export const getAmenities = () => readJson<Record<string, unknown>>("amenities.json");
export const getLocation = () => readJson<Record<string, unknown>>("location.json");
export const getTerms = () => readJson<Record<string, unknown>>("terms.json");
export const getModals = () => readJson<Record<string, unknown>>("modals.json");
export const getBookingConfig = () => readJson<BookingConfig>("booking.json");
export const getImageIndex = () =>
  readJson<Record<string, { width: number; height: number; path: string }>>("image-index.json");

/* ---------------------------------------------------------------- images -- */

const HASH_RE = /lodgeContent\/([0-9a-f]{32})\.(jpg|jpeg|png)/i;

/**
 * Images the owner ruled off the site entirely — stock photography, branded
 * third-party product shots, public places sitting inside the property set, and
 * one frame that is almost certainly a different property. Plus three whose
 * provenance is unverified, quarantined until the owner reviews them.
 *
 * Enforced HERE, in the single function every component uses to resolve an
 * image, rather than at each call site. "Off the site" has to mean off the
 * site: a per-component filter is one forgotten component away from putting a
 * stock cyclist back on the homepage, which is exactly what happened once.
 *
 * Reasons and provenance: content/excluded-images.json.
 */
const BLOCKED = new Set([
  "bc870bf24a014973d25acd877b7cf856", // stock: cyclist on a mountain ridge
  "635d506527ac868f8d19826ccd2cd581", // stock: cyclist silhouetted on a road
  "d75844e8e4b2b9664d2eb3e2103373e5", // branded product: Mythos beer
  "d46d74613184883ec42184d66d1eef0a", // public place: municipal umbrellas
  "fafea700c4a888003811c8139e89ec87", // different property: pool over mountains
  "4088b922635567e2a388c664796a8760", // public place: Fortezza gate (Location only)
  "9e80231c072456bb5f5b0de3f1943b64", // quarantined: provenance unverified
  "89b9b7d0649de8eaf9e70763e3b9c2f5", // quarantined: provenance unverified
]);

const BLOCKED_FILES = new Set(["Rituals-p-4.webp", "AMZ_7491.jpg"]);

export function isBlockedImage(url: string | null | undefined): boolean {
  if (!url) return false;
  const m = HASH_RE.exec(url);
  if (m?.[1] && BLOCKED.has(m[1])) return true;
  const file = url.split("/").pop();
  return Boolean(file && BLOCKED_FILES.has(file));
}

/**
 * Legacy CDN URLs in the inventory map onto the local pool in public/images.
 * Falls back to the original string if it is already a local path.
 */
export function localImage(url: string | null | undefined): string | null {
  if (!url) return null;
  // A blocked image resolves to nothing, so any component asking for it simply
  // renders no image rather than a substitute.
  if (isBlockedImage(url)) return null;
  const m = HASH_RE.exec(url);
  if (m) return `/images/_pool/${m[1]}.${m[2]!.toLowerCase() === "png" ? "png" : "jpg"}`;
  if (url.startsWith("/")) return url;
  return null;
}

/** Intrinsic dimensions for next/image, from the Phase 0 image index. */
export function imageDimensions(
  url: string | null | undefined
): { width: number; height: number } | null {
  const local = localImage(url);
  if (!local) return null;
  const key = local.split("/").pop();
  if (!key) return null;
  const entry = getImageIndex()[key];
  return entry ? { width: entry.width, height: entry.height } : null;
}
