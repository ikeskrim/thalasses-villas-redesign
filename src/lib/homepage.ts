import "server-only";

import { estateCta } from "@/lib/booking";
import {
  getAllExperiences,
  getBookingConfig,
  getEstate,
  getLocation,
  getSite,
  getVilla,
  localImage,
} from "@/lib/content";
import { toRegisterRows } from "@/lib/register";
import { byN } from "@/lib/selects";
import type { CollectionCell } from "@/components/sections/Collection";

/**
 * ONE HOMEPAGE, THREE ART DIRECTIONS.
 *
 * The comparison is only worth anything if the three routes differ in *design*
 * and in nothing else. So every fact, photograph, villa, price link and booking
 * URL is resolved exactly once, here, and the three pages import it.
 *
 * That is also the guard against the obvious failure mode of a bake-off: three
 * pages drifting into three slightly different sets of claims, and the owner
 * choosing a direction partly on copy he only saw on one of them.
 *
 * Every image is an A-grade select; `byN` throws on anything else.
 */
export function getHomepageData() {
  const site = getSite() as {
    contact?: { addressLines?: string[]; phones?: string[]; phoneHrefs?: string[]; email?: string };
    socials?: { platform: string; url: string }[];
    careers?: { careersEmail?: string };
    legal?: { operatingLicence?: string; operatingLicenceLabel?: string };
  };
  const location = getLocation() as unknown as {
    distances?: { name: string; value: string; note?: string }[];
    nearby?: { name: string; distance: string | null }[];
  };
  const booking = getBookingConfig() as unknown as { host?: string };
  const estate = getEstate();

  const front: CollectionCell[] = [
    { villa: getVilla("200"), ordinal: "I", gerund: "Waking", tail: "At sea level, ground floor" },
    { villa: getVilla("201"), ordinal: "II", gerund: "Bathing", tail: "In the largest bathroom" },
  ];
  const rear: CollectionCell[] = [
    { villa: getVilla("202"), ordinal: "III", gerund: "Waking", tail: "On the upper floor, three rooms" },
    { villa: getVilla("203"), ordinal: "IV", gerund: "Stepping", tail: "From bed into the pool" },
  ];
  const fifth: CollectionCell = {
    villa: getVilla("pueblo"),
    ordinal: "V",
    gerund: "Retreating",
    tail: "Adults only, direct beach access",
  };

  const experiences = getAllExperiences();
  const rows = toRegisterRows(experiences).map((r) => {
    const e = experiences.find((x) => x.slug === r.slug);
    return { ...r, image: localImage(e?.heroImage ?? null), category: e?.categoryProposed };
  });

  return {
    site,
    location,
    host: booking.host ?? "thalassesvillas.reserve-online.net",
    contact: site.contact ?? {},
    estate,
    cta: estateCta(),
    villas: { front, rear, fifth, all: [...front, ...rear, fifth] },
    rows,
    /** The A-grade frames each direction draws from. */
    frame: {
      hero: byN(27),
      dusk: byN(21),
      pool: byN(52),
      beach: byN(1),
      cabanas: byN(13),
      horizon: byN(61),
      path: byN(41),
      map: byN(42),
      wedding: byN(9),
      terrace: byN(18),
      lit: byN(17),
      canopies: byN(44),
    },
    /** The estate's locked capacity table, as ledger entries. */
    figures: [
      { label: "Bedrooms", value: estate.specs.bedrooms ?? 9 },
      { label: "Bathrooms", value: estate.specs.bathrooms ?? 6 },
      { label: "Sleeps", value: estate.specs.maxGuests ?? 18 },
      { label: "Private pools", value: estate.specs.pools ?? 4 },
      { label: "Square metres", value: estate.specs.sizeSqm ?? 240 },
    ],
  };
}

export type HomepageData = ReturnType<typeof getHomepageData>;
