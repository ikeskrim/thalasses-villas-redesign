import "server-only";

import type { Villa } from "@/types/content";

/**
 * SEARCH DESCRIPTIONS, WRITTEN RATHER THAN INHERITED.
 *
 * Four villa pages shipped the same **597-character** description: the legacy
 * `meta.description`, which is one 580-character paragraph the registry gives
 * identically to Villas Thoi, Persi, Eeanthe and Melia, prefixed with "Living
 * unlimited."
 *
 * Two problems, and the second is worse than the first. It is roughly four
 * times what a search engine shows, so the useful part is cut off mid-sentence.
 * And it is **identical across four pages**, so the one place a searcher sees
 * a difference between four houses says nothing at all.
 *
 * These are AUTHORED, and marked as such — the only authored strings in this
 * file, held to the same rule as every other authored line on this site: every
 * factual noun resolves against `content/villas/*.json`, and the `source` field
 * on each names the fields it draws on so the next person can check it without
 * re-deriving it.
 *
 * `copyStatus: "draft"`. The owner has not signed these off, and a meta
 * description is a sales line — it is his voice, not mine, and the marker says
 * so where anyone editing would look.
 *
 * WHY NOT DERIVE THEM FROM THE SPEC STRIP? Because "2 bd · 1 ba · sleeps 4" is
 * not a sentence, and a generated one reads like a listing. The whole argument
 * of this rebuild is that specifics in plain prose sell a villa and adjectives
 * do not. A description is the one place a search result gets to be written.
 */

export interface MetaCopy {
  /** At most 160 characters — beyond that a search engine truncates it. */
  description: string;
  /** The registry fields every fact here resolves against. */
  source: string;
}

export const VILLA_META: Record<string, MetaCopy> = {
  "200": {
    description:
      "Ground floor and front row: two bedrooms sleeping four, a private pool on the terrace, and fifty metres of garden and sand between the bed and the sea.",
    source:
      "specs.bedrooms 2, specs.maxGuests 4, specs.pools 1, specs.distanceToBeach '50 m from a private beach', specs.view 'direct view to the sea'",
  },
  "201": {
    description:
      "Single-storey and facing the water, with a Jacuzzi bath beside the shower and a private pool on the terrace. Fifty metres from the sea.",
    source:
      "specs.bathroomsDetail '1 (Jacuzzi bath + shower)', specs.pools 1, specs.view, specs.distanceToBeach",
  },
  "202": {
    description:
      "Two storeys and three bedrooms sleeping six, with the sea arriving at the first-floor balcony rather than at the door. Two bathrooms, one private pool.",
    source:
      "specs.bedrooms 3, specs.maxGuests 6, specs.bathrooms 2, specs.floors 2, specs.pools 1, specs.view 'direct view to the sea from the first floor bedrooms and balcony'",
  },
  "203": {
    description:
      "Two storeys, two bedrooms and two bathrooms, with the sea at the first-floor balcony and a private pool on the terrace. Fifty metres from the water.",
    source:
      "specs.bedrooms 2, specs.bathrooms 2, specs.floors 2, specs.pools 1, specs.view, specs.distanceToBeach",
  },
  pueblo: {
    description:
      "Adults only, set apart from the other four, with its own way down to the sand. Three bedrooms, three bathrooms, six in beds, ninety-five square metres.",
    source: "specs.bedrooms 3, specs.bathrooms 3, specs.maxGuests 6, specs.sizeSqm 95; adults-only designation",
  },
  "2142": {
    description:
      "All four houses behind one gate: nine bedrooms, six bathrooms, eighteen in beds, four private pools, and a private beach fifty metres from the door.",
    source: "sum of specs across villas 200/201/202/203; specs.distanceToBeach",
  },
  rituals: {
    description:
      "Thalasses Rituals — the estate's own wedding and events venue, on the sand beside the water, with a 150 m² saltwater pool.",
    source: "villas/rituals.json shortDescription; specs",
  },
};

/**
 * The description for a villa page, falling back to the registry's own.
 *
 * The fallback is deliberate: a sixth villa added tomorrow gets the registry's
 * description rather than nothing, and the guard in `tests/meta.spec.ts` will
 * say so by failing the length and uniqueness checks — which is the right way
 * to find out that a page needs a line written for it.
 */
export function villaDescription(villa: Villa, key: string): string {
  const authored = VILLA_META[key];
  if (authored) return authored.description;
  return (villa.meta.description ?? villa.shortDescription ?? "").slice(0, 160);
}
