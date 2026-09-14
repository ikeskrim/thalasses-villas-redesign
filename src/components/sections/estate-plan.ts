/**
 * THE ESTATE, AS A DIAGRAM — the geometry the 3D map draws.
 *
 * Schematic units, not metres, and not a survey. The layout is read off the
 * estate's own aerial photographs (`/images/_chh/Ritual-drone.webp`,
 * `/images/_chh/thalasses-all-2.webp`) and the villa copy's "front row" /
 * "rear row": the sea to the north, a beach line along it, the lane down the
 * west side of the compound, the helipad on its apron beyond the lane, and the
 * four villas in two rows of two, one pool each.
 *
 * WHAT IS NOT ESTABLISHED, and is flagged on the page and in the report:
 *  - Which house in each row is which. The order below follows the 2D map's
 *    left-to-right placement, and that map is drawn over a photograph of one
 *    villa (frame 42), not over a plan.
 *  - Villa Pueblo. It is "set apart from the other four", and no aerial on
 *    record identifies its plot, so it is not drawn. It stays in the list
 *    beneath the map.
 * Both are owner questions before any of this reaches main.
 *
 * NOT PLACED, ON PURPOSE. The 2D map has nine hotspots (`HOTSPOTS` in
 * home-data.ts). Six are labelled here: the four villas, the beach and the pool
 * line. The long table and the vegetable garden have no label because no aerial
 * on record establishes where they are, and a label would invent a position.
 * The diagram's note says the list below carries every place ("all listed" in
 * its phone length), and the list does carry all nine.
 * There is no site plan on record either: every coordinate here comes from the
 * aerials.
 *
 * Axes: x runs west → east, z runs north → south, y is up. The shoreline is
 * z = -30.
 */

export type PlanSpotKind = "villa" | "beach" | "helipad" | "pools";

export interface PlanSpot {
  id: string;
  label: string;
  kind: PlanSpotKind;
  href?: string;
  /** Where the label is anchored, in plan units. */
  at: [number, number, number];
  /**
   * Labels sit above their anchor by default. "below" hangs one under it
   * instead, for an anchor whose space above is already taken by another label.
   */
  hang?: "below";
}

export interface PlanBox {
  id: string;
  /** Centre on the ground plane, plus footprint and height. */
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
}

export const SHORE_Z = -30;

/** The four villas, two rows of two, uniform massing — heights are not on record for all four. */
export const PLAN_VILLAS: (PlanBox & { label: string; href: string })[] = [
  { id: "thoi", label: "Villa Thoi", href: "/en/villas/villa-thoi", x: -5, z: -1, w: 7, d: 6, h: 3 },
  { id: "persi", label: "Villa Persi", href: "/en/villas/villa-persi", x: 9, z: -1, w: 7, d: 6, h: 3 },
  { id: "eeanthe", label: "Villa Eeanthe", href: "/en/villas/villa-eeanthe", x: -5, z: 10, w: 7, d: 6, h: 3 },
  { id: "melia", label: "Villa Melia", href: "/en/villas/villa-melia", x: 9, z: 10, w: 7, d: 6, h: 3 },
];

/** One pool per villa (the villa copy), set on the villa's east side. */
export const PLAN_POOLS: PlanBox[] = PLAN_VILLAS.map((v) => ({
  id: `${v.id}-pool`,
  x: v.x + v.w / 2 + 1.6,
  z: v.z,
  w: 2.4,
  d: 4,
  h: 0.15,
}));

/** The compound's boundary, the lane and the helipad apron, as flat shapes. */
export const PLAN_COMPOUND = { x: 2, z: 4.5, w: 26, d: 22 };
export const PLAN_LANE = { x: -13, z: -3, w: 2.2, d: 54 };
export const PLAN_APRON = { x: -23, z: -10, w: 14, d: 12 };
export const PLAN_HELIPAD = { x: -23, z: -10, r: 4 };

/*
 * THE POOL LINE'S ANCHOR: the south end of the western column of drawn pools.
 * It is derived from PLAN_POOLS rather than typed in, so it follows the pools
 * if they move. It is picked geometrically, not by villa, because which house
 * is which is still an owner question.
 *
 * Why there and hanging below. Each villa's label stands over its roof, and
 * each pool is drawn just east of its villa, so the space above the pools is
 * crowded with villa links. The label frames were projected with the real
 * camera at page widths from 768 to 1920 px (the widths at which labels show),
 * using the `.micro` label's size, tracking and padding, for three placements:
 *  - standing above the centre of the four pools: overlapped Villa Melia's
 *    label by about 22 px at every width;
 *  - standing above the midpoint of each pool column: from 11 px of overlap to
 *    5 px of clearance against a neighbouring label, depending on the width;
 *  - this one, hanging below the south end of the western column: cleared
 *    every other label at every width, by an estimated 15–29 px.
 * Other anchors were not tried. The figures are estimates from glyph widths
 * (0.66 em per glyph; the review re-projected at 0.60 and 0.72 em and got the
 * same clearance), not a screenshot.
 */
const WEST_POOL_X = Math.min(...PLAN_POOLS.map((p) => p.x));
const POOL_LINE_END = PLAN_POOLS.filter((p) => p.x === WEST_POOL_X).reduce((a, b) => (b.z > a.z ? b : a));

export const PLAN_SPOTS: PlanSpot[] = [
  ...PLAN_VILLAS.map((v) => ({ id: v.id, label: v.label, kind: "villa" as const, href: v.href, at: [v.x, v.h + 0.6, v.z] as [number, number, number] })),
  { id: "beach", label: "The private beach", kind: "beach", at: [0, 0.4, SHORE_Z + 2] },
  /* A label, not a link: the 2D hotspot it stands for has no href either. */
  {
    id: "pools",
    label: "The pool line",
    kind: "pools",
    hang: "below",
    at: [POOL_LINE_END.x, POOL_LINE_END.h, POOL_LINE_END.z + POOL_LINE_END.d / 2],
  },
  /* Anchored north of the pad, not on it: the first render's label covered the H. */
  { id: "helipad", label: "Private helipad", kind: "helipad", href: "/en/experiences/private-helipad", at: [PLAN_HELIPAD.x, 0.5, PLAN_HELIPAD.z - PLAN_HELIPAD.r - 1.5] },
];

/** The plan's extent, for framing the camera. */
export const PLAN_BOUNDS = { minX: -34, maxX: 22, minZ: -40, maxZ: 22 };
