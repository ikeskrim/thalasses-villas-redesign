import "server-only";

import type { Villa } from "@/types/content";

/**
 * THE VILLA PAGE'S EDITORIAL LAYER.
 *
 * Everything here is drafted display copy, and every factual noun inside it
 * resolves against `content/`. The clause, the angle and the story beats are
 * written; the numbers, the bed splits, the views and the distances are read.
 *
 * Story beats follow the One&Only unit — eyebrow, short headline, two sentences —
 * and each one is anchored to a fact the registry actually states, named in the
 * `source` field so the next person can check it without re-deriving it.
 */

export interface StoryBeat {
  eyebrow: string;
  title: string;
  body: string;
  /** Where in the inventory the fact behind this beat comes from. */
  source: string;
}

export interface VillaPageCopy {
  gerund: string;
  tail: string;
  /** Two sentences. The first places it, the second gives it a reason to exist. */
  lede: string;
  beats: StoryBeat[];
}

export const VILLA_PAGE_COPY: Record<string, VillaPageCopy> = {
  "200": {
    gerund: "Waking",
    tail: "At sea level, ground floor",
    lede:
      "Front row and all on one floor, so the sea is at eye level from the moment you open your eyes. " +
      "Fifty metres of garden and sand is the whole distance between the bed and the water.",
    beats: [
      {
        eyebrow: "The position",
        title: "Ground floor, front row",
        body:
          "No stairs between you and the terrace, and nothing between the terrace and the sea. " +
          "The view is direct rather than borrowed from a balcony.",
        source: "specs.view — 'direct view to the sea'; front-row position (D1 collection order)",
      },
      {
        eyebrow: "The rooms",
        title: "One double, one twin",
        body:
          "Two bedrooms sleeping four in beds, with a shower room between them. " +
          "The twin converts to a double if you would rather it did.",
        source: "specs.bedroomsDetail, specs.bathroomsDetail, amenityFacts",
      },
      {
        eyebrow: "The water",
        title: "Fifty metres, and a pool of your own",
        body:
          "A private pool on the terrace, and the estate's own beach fifty metres from the door. " +
          "Neither is shared with anyone outside the gate.",
        source: "specs.pools, specs.distanceToBeach — '50 m from a private beach'",
      },
    ],
  },
  "201": {
    gerund: "Bathing",
    tail: "In the largest bathroom",
    lede:
      "Front row, single-storey, and the one house on the estate built around its bathroom. " +
      "A Jacuzzi bath sits beside the shower, fifty metres from the sea that put the salt on you.",
    beats: [
      {
        eyebrow: "The room that names it",
        title: "A Jacuzzi bath, and a shower beside it",
        body:
          "The largest bathroom of the four, with both. " +
          "It is the room to come back to when the beach is done with you for the day.",
        source: "specs.bathroomsDetail — '1 (Jacuzzi bath + shower)'",
      },
      {
        eyebrow: "The position",
        title: "Ground floor, facing the water",
        body:
          "Single-storey and front row, with a direct view to the sea. " +
          "Two bedrooms, four in beds, and a private pool on the terrace.",
        source: "specs.view, specs.bedrooms, specs.maxGuests, specs.pools",
      },
    ],
  },
  "202": {
    gerund: "Waking",
    tail: "On the upper floor, three rooms",
    lede:
      "Two storeys and three bedrooms, with the sea arriving at the first-floor balcony rather than at the door. " +
      "It is the largest of the four, and the one that suits a family that wants its own floors.",
    beats: [
      {
        eyebrow: "The upper floor",
        title: "The sea, from the balcony",
        body:
          "The first-floor bedrooms open onto a balcony with a direct view of the water. " +
          "It is a different relationship to the sea than the ground-floor houses have — further off, and wider.",
        source: "specs.view — 'direct view to the sea from the first floor bedrooms and balcony'",
      },
      {
        eyebrow: "The rooms",
        title: "One double, two twins, two bathrooms",
        body:
          "Three bedrooms sleeping six in beds, across two floors, with two bathrooms. " +
          "The twins convert to doubles on request.",
        source: "specs.bedroomsDetail, specs.bathroomsDetail, specs.maxGuests, amenityFacts",
      },
      {
        eyebrow: "The photography",
        title: "The most photographed of the four",
        body:
          "More of the estate's picture library belongs to this house than to any other. " +
          "What follows is most of it.",
        source: "gallery.featured — 104 frames, the largest set in the inventory",
      },
    ],
  },
  "203": {
    gerund: "Stepping",
    tail: "From bed into the pool",
    lede:
      "Two storeys, with a ground-floor bedroom that opens straight onto the pool terrace. " +
      "Upstairs the sea reaches the balcony; downstairs it is four steps to the water you swim in.",
    beats: [
      {
        eyebrow: "The ground floor",
        title: "A bedroom that opens onto the pool",
        body:
          "The shortest distance in the collection between waking up and swimming. " +
          "The pool is private, and heatable on request.",
        source: "specs.pools; estate outdoor facts — heatable on advance request",
      },
      {
        eyebrow: "The upper floor",
        title: "The sea, from the balcony",
        body:
          "The first-floor bedrooms carry the direct view and the balcony. " +
          "Two bedrooms, two bathrooms, four in beds.",
        source: "specs.view, specs.bedrooms, specs.bathrooms, specs.maxGuests",
      },
    ],
  },
  pueblo: {
    gerund: "Retreating",
    tail: "Adults only, direct beach access",
    lede:
      "Set apart from the other four, and the only house here that is adults only. " +
      "It has its own way down to the sand, so the beach is reached without crossing anyone else's terrace.",
    beats: [
      {
        eyebrow: "Who it is for",
        title: "Adults only",
        body:
          "The quiet corner of a quiet place, kept that way on purpose. " +
          "Three bedrooms, six in beds, and no one under eighteen.",
        source: "villas/pueblo.json — adults-only designation; specs.bedrooms, specs.maxGuests",
      },
      {
        eyebrow: "The access",
        title: "Its own way to the sand",
        body:
          "Direct beach access belonging to this house alone. " +
          "You do not pass the other four to get to the water.",
        source: "villas/pueblo.json — direct beach access",
      },
    ],
  },
};

/**
 * "Your stay includes" — the Aman split, and it is only generous if it is true.
 *
 * `content/verified-facts.json` states exactly three included services; the
 * private beach is separately confirmed. That is the whole list.
 *
 * BREAKFAST IS NOT INCLUDED — owner-confirmed, 2026-08-18. It carries an extra
 * charge. This list is CLOSED at these four and does not grow without another
 * owner ruling.
 *
 * The standing copy rule that follows from it: wherever breakfast appears — the
 * amenity card, an experience blurb, anywhere — it is phrased as **available on
 * request, extra charge**. Never "included", never "complimentary", and never a
 * bare mention next to inclusions where a reader would infer it. "Breakfast on
 * the Beach" stays what it is: a bookable experience.
 */
export const STAY_INCLUDES: { label: string; note: string }[] = [
  { label: "Cleaning every 3 days", note: "Included, not charged as an extra." },
  { label: "Daily reception desk", note: "On the estate, every day of your stay." },
  { label: "A Holiday Advisor and concierge", note: "Someone who knows the island, not a call centre." },
  { label: "The private beach", note: "Golden sand fifty metres from the door, for the five houses only." },
];

export interface SpecCell {
  label: string;
  value: string;
  /** Secondary unit or qualifier, set smaller beneath the value. */
  sub?: string;
}

/** m² is registry. Square feet is arithmetic on it, and nothing else. */
export function squareFeet(sqm: number): number {
  return Math.round(sqm * 10.7639);
}

/**
 * The spec strip renders ONLY what the registry confirms for this villa.
 *
 * Villa Pueblo has no confirmed bathroom detail, view or distance, and no
 * `specsConfirmed` flag (T-212). The correct treatment for a fact we do not have
 * is to omit the row, not to print a dash — a column of placeholders reads as
 * missing data, which is exactly the defect fixed on the Location module.
 */
export function specStrip(villa: Villa): SpecCell[] {
  const out: SpecCell[] = [];
  const s = villa.specs;
  if (s.bedrooms) out.push({ label: "Bedrooms", value: String(s.bedrooms) });
  if (s.bathrooms) out.push({ label: "Bathrooms", value: String(s.bathrooms) });
  if (s.maxGuests) out.push({ label: "Sleeps", value: String(s.maxGuests) });
  if (s.pools) out.push({ label: s.pools === 1 ? "Private pool" : "Private pools", value: String(s.pools) });
  if (s.sizeSqm) {
    // Metric is the registry value; imperial is arithmetic on it and is set as a
    // sub-note, which keeps the hierarchy honest and stops the cell wrapping.
    out.push({
      label: "Area",
      value: `${s.sizeSqm} m²`,
      sub: `${squareFeet(s.sizeSqm)} sq ft`,
    });
  }
  return out;
}

/**
 * THE DETAIL ROWS — the prose facts the capacity lock added (T-212).
 *
 * Bed split, bath split, view and distance. These reached the page only through
 * JSON-LD until T-212, and the Direction D rebuild briefly dropped them again —
 * so they are their own exported function now, rather than four lines inside a
 * component that a rewrite can quietly lose.
 *
 * Absent fields are OMITTED. Villa Pueblo has none of them confirmed and
 * therefore renders no detail list at all, which is the honest treatment.
 */
export function detailRows(villa: Villa): { label: string; value: string }[] {
  const s = villa.specs;
  return [
    { label: "Bedrooms", value: s.bedroomsDetail },
    { label: "Bathrooms", value: s.bathroomsDetail },
    { label: "View", value: s.view },
    { label: "The beach", value: s.distanceToBeach },
  ].filter((d): d is { label: string; value: string } => Boolean(d.value));
}
