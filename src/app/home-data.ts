import type { Act } from "@/components/sections/ActShowcase";
import type { Hotspot } from "@/components/sections/EstateMap";
import type { LitanyLine } from "@/components/sections/Litany";
import { byN } from "@/lib/selects";

/**
 * Homepage content for the Seasats-pattern rebuild.
 *
 * EVERY FACT HERE RESOLVES AGAINST THE INVENTORY. Where a line is atmosphere
 * rather than fact it is marked draft in TODO.md (T-193) and carries no figure.
 *
 * Corrections made while writing this file, rather than shipping the brief
 * verbatim:
 *  - "nine bedrooms, one booking" -> "taken as one house". The estate is
 *    enquiry-only by owner decision (T-158); "one booking" would promise a
 *    booking flow that deliberately does not exist.
 *  - The helipad was removed from Act I and restored as a standalone beat at
 *    full scale (owner ruling). A card grid is where facts live; a beat is
 *    where icons live. Its Act I slot went to secure parking, which is in the
 *    facilities registry ("Parking", "Car park spaces") and on the villa
 *    captions ("Secure parking space").
 *  - "dinner from fifty metres away" for the garden was cut to the verifiable
 *    part. The garden and the gardener's help are in verified-facts.json; the
 *    distance from garden to table is not stated anywhere.
 */

/* ── Pattern 1 — the litany ─────────────────────────────────────────────── */
export const LITANY: LitanyLine[] = [
  {
    text: "The morning swim, before anyone else is up.",
    image: byN(61).path,
    alt: byN(61).alt,
  },
  {
    text: "The gate that closes behind you.",
    image: byN(41).path,
    alt: byN(41).alt,
  },
  {
    text: "A beach with no one else's towels on it.",
    image: byN(1).path,
    alt: byN(1).alt,
  },
  {
    text: "The table, set for eighteen.",
    image: byN(44).path,
    alt: byN(44).alt,
  },
  {
    text: "The last of the light, from your own terrace.",
    image: byN(21).path,
    alt: byN(21).alt,
  },
];

/* ── Pattern 2 — the three acts ─────────────────────────────────────────── */
export const ACTS: Act[] = [
  {
    eyebrow: "Act one",
    title: "Arrive in private.",
    image: byN(41).path,
    alt: byN(41).alt,
    cards: [
      {
        icon: "gate",
        title: "One gate, the whole estate behind it",
        description: "Four villas share a single entrance, and nothing else does.",
      },
      {
        icon: "key",
        title: "Chauffeur and transfers",
        description: "Arranged before you land, so nobody waits at a rank.",
      },
      {
        icon: "car",
        title: "Secure parking, inside the gate",
        description: "A space of your own, behind the same gate as the houses.",
      },
      {
        icon: "anchor",
        title: "From the airport or the port",
        description: "Heraklion or Chania, whichever suits the crossing.",
        ledger: [
          { label: "Heraklion", value: "72.8 km" },
          { label: "Chania", value: "77.4 km" },
        ],
      },
    ],
  },
  {
    eyebrow: "Act two",
    title: "Live unlimited.",
    image: byN(29).path,
    alt: byN(29).alt,
    cards: [
      {
        icon: "wave",
        title: "A private beach",
        description: "Golden sand, sun loungers and sunshades, shared with four houses.",
        ledger: [{ label: "From the door", value: "50 m" }],
      },
      {
        icon: "pool",
        title: "Four private pools",
        description: "One per villa, heatable on request with a week's notice.",
        ledger: [{ label: "Pools", value: 4 }],
      },
      {
        icon: "bell",
        title: "A Holiday Advisor and concierge",
        description: "A reception desk, daily, and someone who knows the island.",
      },
      {
        icon: "broom",
        title: "Kept, without being noticed",
        description: "Cleaning every three days. Breakfast can be arranged.",
      },
    ],
  },
  {
    eyebrow: "Act three",
    title: "Gather as one.",
    image: byN(31).path,
    alt: byN(31).alt,
    cards: [
      {
        icon: "bed",
        title: "The entire estate",
        description: "Nine bedrooms taken as one house, arranged in conversation.",
        ledger: [
          { label: "Bedrooms", value: 9 },
          { label: "Sleeps", value: 18 },
        ],
      },
      {
        icon: "table",
        title: "The al-fresco table",
        description: "Long enough that nobody sits at a second one.",
        ledger: [{ label: "Seats", value: 18 }],
      },
      {
        icon: "rings",
        title: "Weddings at Thalasses Rituals",
        description: "A venue on the sand, with a saltwater pool beside it.",
      },
      {
        icon: "leaf",
        title: "The organic garden",
        description: "Vegetables you can pick yourself, with the gardener's help.",
      },
    ],
  },
];

/* ── Pattern 3 — the estate map ─────────────────────────────────────────── */
export const HOTSPOTS: Hotspot[] = [
  {
    id: "thoi",
    label: "Villa Thoi",
    line: "Front row, single-storey, the sea at eye level.",
    x: 30,
    y: 58,
    href: "/en/villas/villa-thoi",
    ledger: [
      { label: "Beds", value: 2 },
      { label: "Sleeps", value: 4 },
    ],
  },
  {
    id: "persi",
    label: "Villa Persi",
    line: "Front row, with the largest bathroom of the four.",
    x: 44,
    y: 62,
    href: "/en/villas/villa-persi",
    ledger: [
      { label: "Beds", value: 2 },
      { label: "Sleeps", value: 4 },
    ],
  },
  {
    id: "eeanthe",
    label: "Villa Eeanthe",
    line: "Rear row, two storeys, the sea from the first floor.",
    x: 58,
    y: 44,
    href: "/en/villas/villa-eeanthe",
    ledger: [
      { label: "Beds", value: 3 },
      { label: "Sleeps", value: 6 },
    ],
  },
  {
    id: "melia",
    label: "Villa Melia",
    line: "Rear row, the ground-floor bedroom opening onto the pool.",
    x: 70,
    y: 48,
    href: "/en/villas/villa-melia",
    ledger: [
      { label: "Beds", value: 2 },
      { label: "Sleeps", value: 4 },
    ],
  },
  {
    id: "pueblo",
    label: "Villa Pueblo",
    line: "Apart from the four. Adults only, with its own beach access.",
    x: 84,
    y: 60,
    href: "/en/villas/villa-pueblo",
    ledger: [
      { label: "Beds", value: 3 },
      { label: "Sleeps", value: 6 },
    ],
  },
  {
    id: "beach",
    label: "The private beach",
    line: "Golden sand with loungers and sunshades.",
    x: 50,
    y: 84,
    ledger: [{ label: "From the door", value: "50 m" }],
  },
  {
    id: "pools",
    label: "The pool line",
    line: "One private pool per villa, each heatable on request.",
    x: 38,
    y: 72,
    ledger: [{ label: "Pools", value: 4 }],
  },
  {
    id: "table",
    label: "The long table",
    line: "Set outdoors, under the evening sun.",
    x: 64,
    y: 70,
    ledger: [{ label: "Seats", value: 18 }],
  },
  {
    id: "garden",
    label: "The vegetable garden",
    line: "Planted and picked with the gardener's help.",
    x: 20,
    y: 38,
  },
];
