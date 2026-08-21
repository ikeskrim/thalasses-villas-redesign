/**
 * Types for the Phase 0 content inventory in /content.
 * These mirror the JSON exactly — every page renders from this data, never from
 * hard-coded copy. `null` means "the source site does not state this"; see TODO.md.
 */

export type Nullable<T> = T | null;

/* ---------------------------------------------------------------- shared -- */

export interface PageMeta {
  title: Nullable<string>;
  description: Nullable<string>;
  keywords: Nullable<string>;
  ogImage: Nullable<string>;
  ogUrl: Nullable<string>;
  twitterCard?: Nullable<string>;
}

export interface CaptionedImage {
  image: string;
  caption: Nullable<string>;
}

export interface Album {
  title: string;
  images: string[];
}

/* ----------------------------------------------------------------- villa -- */

export type VillaPageType = "property" | "landing";

/** Where a highlight line was lifted from on the legacy site. */
export type HighlightSource =
  | "slider-caption"
  | "attributes"
  | "gallery-caption"
  | "spaces-tile";

export interface Highlight {
  text: string;
  source: HighlightSource;
}

export interface VillaSpecs {
  bedrooms: Nullable<number>;
  bathrooms: Nullable<number>;
  maxGuests: Nullable<number>;
  sizeSqm: Nullable<number>;
  pools: Nullable<number>;
  floors: Nullable<number>;
  view: Nullable<string>;
  distanceToBeach: Nullable<string>;
  checkIn: Nullable<string>;
  checkOut: Nullable<string>;
  /**
   * Added to villas/{200,201,202,203}.json when the owner locked the capacity
   * table, and never mirrored here — so the bed and bath breakdowns were
   * invisible to TypeScript and, in consequence, to every page. Optional
   * because Villa Pueblo carries none of them (T-212).
   */
  bedroomsDetail?: Nullable<string>;
  bathroomsDetail?: Nullable<string>;
  maxGuestsBasis?: Nullable<string>;
  specsSource?: Nullable<string>;
  specsConfirmed?: boolean;
}

export interface FacilitiesRef {
  ref: string;
  totalFeatures: number;
  shownOnLiveSite: number;
  tabs: { tab: string; count: number; displayedOnLiveSite: boolean }[];
}

export interface VillaService {
  name: string;
  image: string;
}

export interface VillaRoom {
  name: string;
  description: Nullable<string>;
}

export interface VillaGallery {
  heroImage: Nullable<string>;
  albums: Album[];
  featured: CaptionedImage[];
  allImages: string[];
}

export interface VillaVideo {
  youtubeId: string;
  embedUrl: string;
}

export interface VillaMap {
  lat: Nullable<number>;
  lng: Nullable<number>;
  embedUrl: Nullable<string>;
  mapsLink: Nullable<string>;
  /** Composed from JSON-LD parts — no source page prints this as one line. */
  address: Nullable<string>;
}

export interface BookingInput {
  name: string;
  label: Nullable<string>;
  type: Nullable<string>;
  value: Nullable<string>;
  min: Nullable<string>;
  placeholder: Nullable<string>;
}

export interface VillaBooking {
  hasWidget: boolean;
  engine: Nullable<string>;
  formAction: Nullable<string>;
  method: Nullable<string>;
  roomCode: Nullable<string>;
  hiddenFields: Record<string, string>;
  inputs: BookingInput[];
  submitLabel: Nullable<string>;
  ctaLabel: Nullable<string>;
  ctaHref: Nullable<string>;
}

export interface Villa {
  id: string;
  slug: string;
  name: string;
  pageType: VillaPageType;
  bookable: boolean;
  legacyUrls: string[];
  canonical: Nullable<string>;
  meta: PageMeta;
  tagline: Nullable<string>;
  shortDescription: Nullable<string>;
  longDescription: Nullable<string>;
  attributes: string[];
  highlights: Highlight[];
  specs: VillaSpecs;
  facilities: FacilitiesRef;
  services: VillaService[];
  rooms: VillaRoom[];
  gallery: VillaGallery;
  video: Nullable<VillaVideo>;
  map: VillaMap;
  booking: VillaBooking;
  policies: string[];
  relatedExperiences: string[];
  /** Owner-confirmed facts added in Phase 3, e.g. twin-to-double conversion. */
  amenityFacts?: string[];
  /**
   * 2142 only — what each house in the estate actually contains.
   *
   * This was typed `string[]` and the registry has always held objects. It
   * never failed because nothing read it: the estate page showed three figures
   * per house and none of the prose. A type that describes data nobody consumes
   * is unverified by definition, and this one was wrong from the start. (T-285.)
   *
   * Five entries, not four — Villa Pueblo is named here and is not part of the
   * four-villa collection, so callers must look these up BY NAME rather than
   * zipping them against `getEstateVillas()`.
   */
  includedVillas?: { name: string; description: string | null }[];
  useCases?: string[];
  todos: string[];
}

/* ------------------------------------------------------------ facilities -- */

export interface FacilityItem {
  featureId: number;
  name: string;
  description: Nullable<string>;
  extraDescription: Nullable<string>;
  /** 5/6 = boolean amenity, 1/2 = numeric value, 7 = unresolved enum id. */
  featureType: number;
  value: Nullable<string | number>;
  icon: Nullable<string>;
  slug: Nullable<string>;
  valueIsUnresolvedEnumId: boolean;
}

export interface FacilityGroup {
  group: string;
  slug: Nullable<string>;
  items: FacilityItem[];
}

export interface FacilityTab {
  tab: string;
  tabIndex: number;
  groupId: Nullable<number>;
  icon: Nullable<string>;
  /** The legacy site rendered only tab 0; the rest is data it never showed. */
  displayedOnLiveSite: boolean;
  groups: FacilityGroup[];
}

export interface Facilities {
  page: string;
  property: string;
  totalFeatures: number;
  featuresShownOnLiveSite: number;
  tabs: FacilityTab[];
}

/* ------------------------------------------------------------ experience -- */

/** Editorial grouping added for the redesign — the legacy site has no categories. */
export type ExperienceCategory = "Sea" | "Land" | "Wellness" | "Taste" | "Service";

/** Set by the D3 draft-copy policy; drafts render with a dev-only badge. */
export type CopyStatus = "source" | "draft" | "approved";

export interface Experience {
  slug: string;
  name: string;
  legacyUrl: Nullable<string>;
  canonical: Nullable<string>;
  meta: PageMeta;
  sourceTaxonomy: Nullable<string>;
  categoryProposed: ExperienceCategory;
  shortDescription: Nullable<string>;
  longDescription: Nullable<string>;
  highlights: string[];
  wordCount: number;
  /** true when the page has <= 40 words of real copy. */
  needsContent: boolean;
  brokenCta?: boolean;
  sectionLabel?: string;
  images: string[];
  heroImage: Nullable<string>;
  gallery: { heroImage: Nullable<string>; images: { url: string; caption: Nullable<string> }[] };
  externalLinks: { label: string; url: string }[];
  cta: Nullable<{ label: string; href: string }>;
  duration: Nullable<string>;
  price: Nullable<string>;
  copyStatus?: CopyStatus;
  todos: string[];
}

/* ---------------------------------------------------------------- others -- */

export interface AmenityItem {
  id: Nullable<string>;
  title: string;
  description: Nullable<string>;
  paragraphs?: string[];
  images: string[];
  source: Nullable<string>;
  copyStatus?: CopyStatus;
  todos?: string[];
}

export interface NearbyPlace {
  name: string;
  description?: Nullable<string>;
  distance: Nullable<string>;
  source?: Nullable<string>;
}

export interface BookingConfig {
  engine: string;
  properties: {
    host: string;
    webhotelierPropertyCode: string;
    brandedTitle: string;
    usedBy: string;
    sendsRoomCode: boolean;
  }[];
  parameters: { name: string; required: boolean; format?: string; notes?: string }[];
  childrenAges: { supported: boolean; evidence: string; consequence: string };
  deepLinkPattern: { global: string; perVilla: string };
  implementationDecision: Record<string, string>;
  openQuestions: string[];
}
