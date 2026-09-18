import type { Hotspot } from "./EstateMap";
import type { Footprint, RenderElement, RenderPlan } from "@/lib/estate-plan-gate";

/**
 * THE 3D ESTATE MAP'S PLACES, ITS FRAME AND ITS LABEL LAYOUT — pure arithmetic,
 * no three.js and no React, so every rule here can be read (and reasoned about)
 * without a renderer. Imported only by `EstateMap3D`, so it travels in the same
 * lazy chunk and never reaches a reader the provenance gate keeps on the 2D map.
 *
 * WHICH DRAWN THINGS ARE PLACES (step B, B4).
 *
 * The 2D map's contract is a numbered list of nine hotspots (`HOTSPOTS`,
 * src/app/home-data.ts), each a real button that opens a card. The diagram
 * offers the same contract for the ones it can actually draw, in the list's
 * order, and then for the drawn places the list has never carried but the plan
 * gives a route to (the helipad, the Rituals venue). Everything else it draws is
 * context and gets no button:
 *  - the lane, the helipad apron and the compound outline: context shapes with
 *    no name on record (content/estate-plan.json names them descriptively);
 *  - the shoreline: drawn, never a place. The site names a "private beach" only
 *    in captions on a garden-path photograph and a sunbed sign, so a button on
 *    the waterline would place that name where no source puts it (D-022). The
 *    numbered list beneath still carries "The private beach";
 *  - pools, except as the one "The pool line" place the list already has, which
 *    stands for the four villa pools by id. The Rituals pool is a pool but not
 *    one of the pool line.
 *
 * The copy on a card comes from `HOTSPOTS` for a list place, and for an extra is
 * only the plan's own name and its route. Nothing is typed here for the diagram.
 */

/** A storey, in plan units. Only the villas' storey counts are on record (content/villas/203.json:23), not heights. */
export const STOREY = 2.6;

/** The four villa pools "The pool line" stands for — by id, never by "the pools the plan draws". */
export const VILLA_POOL_IDS: readonly string[] = ["thoi-pool", "persi-pool", "melia-pool", "eeanthe-pool"];

/**
 * Which plan elements carry each list hotspot. `beach` is absent on purpose (see
 * the header). `table` and `garden` are listed so the day the plan places them
 * they become places with their list copy, with no change here.
 */
const CARRIED_BY: Record<string, readonly string[]> = {
  thoi: ["thoi"],
  persi: ["persi"],
  eeanthe: ["eeanthe"],
  melia: ["melia"],
  pueblo: ["pueblo"],
  pools: VILLA_POOL_IDS,
  table: ["long-table"],
  garden: ["vegetable-garden"],
};

/** Kinds that are context, never a place of their own, even with a route. */
const NEVER_A_PLACE = new Set<string>(["lane", "apron", "compound", "shore", "pool"]);

export interface Place {
  /** Unique within the diagram; also the card's id suffix. */
  key: string;
  name: string;
  /** 1-based position in the numbered list, or null for a place the list does not carry. */
  index: number | null;
  hotspot: Hotspot | null;
  href: string | null;
  /** The drawn elements this place tints when it is opened. */
  elementIds: string[];
  /** Where its button points, in plan units: [x, height, z]. */
  at: [number, number, number];
  /**
   * A radius around `at`, in plan units, that no button may cover if the layout
   * can avoid it, or null. The helipad has one: its letter is the only mark on
   * the diagram that is itself information, and a button over it hides it.
   */
  clear: number | null;
}

export const rectOf = (f: Footprint | null, fallback: [number, number]): [number, number] =>
  f && "w" in f ? [f.w, f.d] : fallback;

/** A rectangle's four corners on the ground, turned as three.js turns about the vertical axis (+deg turns +x toward -z). */
export function corners(w: number, d: number, x: number, z: number, deg: number): [number, number][] {
  const c = Math.cos((deg * Math.PI) / 180);
  const s = Math.sin((deg * Math.PI) / 180);
  return (
    [
      [-w / 2, -d / 2],
      [w / 2, -d / 2],
      [w / 2, d / 2],
      [-w / 2, d / 2],
    ] as [number, number][]
  ).map(([px, pz]) => [x + px * c + pz * s, z - px * s + pz * c]);
}

function anchorOf(elements: RenderElement[]): [number, number, number] {
  const first = elements[0]!;
  if (elements.length > 1) {
    /*
     * THE POOL LINE: one button for four pools, as the 2D map has one hotspot
     * for them. It points at the land-side end of the villa pool nearest the
     * lane (lowest x, then highest z), the anchor D-020 derived from the drawn
     * pools rather than typing one in. Opening it tints all four.
     */
    const pool = [...elements].sort((a, b) => a.position.x - b.position.x || b.position.z - a.position.z)[0]!;
    const [, d] = rectOf(pool.footprint, [2.4, 4]);
    return [pool.position.x, 0.1, pool.position.z + d / 2];
  }
  const { x, z } = first.position;
  switch (first.kind) {
    case "villa":
      return [x, STOREY * (first.storeys ?? 1), z];
    default:
      /*
       * The helipad points at its centre too. Its button is kept off the pad by
       * `clearOf`, not by pointing at a rim: which rim faces the camera depends
       * on the view, and step B's first sea-side render put the button squarely
       * on the letter.
       */
      return [x, 0.1, z];
  }
}

/** The keep-clear radius around a place's anchor, in plan units (see `Place.clear`). */
function clearOf(elements: RenderElement[]): number | null {
  const first = elements[0]!;
  if (elements.length !== 1 || first.kind !== "helipad") return null;
  const [w] = rectOf(first.footprint, [8, 8]);
  return w / 2;
}

/** The diagram's places, in tab order: the numbered list's order, then the extras in plan order. */
export function placesFor(plan: RenderPlan, hotspots: Hotspot[]): Place[] {
  const drawn = new Map(plan.elements.map((e) => [e.id, e]));
  const carried = new Set<string>();
  const places: Place[] = [];

  hotspots.forEach((h, i) => {
    const ids = CARRIED_BY[h.id];
    if (!ids) return;
    for (const id of ids) carried.add(id);
    const elements = ids.map((id) => drawn.get(id)).filter((e): e is RenderElement => !!e);
    if (!elements.length) return;
    places.push({
      key: h.id,
      name: h.label,
      index: i + 1,
      hotspot: h,
      href: h.href ?? null,
      elementIds: elements.map((e) => e.id),
      at: anchorOf(elements),
      clear: clearOf(elements),
    });
  });

  const keys = new Set(places.map((p) => p.key));
  for (const e of plan.elements) {
    if (carried.has(e.id) || NEVER_A_PLACE.has(e.kind) || !e.href) continue;
    const key = keys.has(e.id) ? `plan-${e.id}` : e.id;
    keys.add(key);
    places.push({ key, name: e.name, index: null, hotspot: null, href: e.href, elementIds: [e.id], at: anchorOf([e]), clear: clearOf([e]) });
  }
  return places;
}

/** The kinds the camera frames: what a reader needs, not the whole plan (B7). */
const FRAMED_KINDS = new Set<string>(["compound", "helipad", "apron", "venue"]);

/** The shoreline's z at plan x, along its polyline (sorted by x), or null outside the line. */
function shoreAt(points: [number, number][], x: number): number | null {
  const line = [...points].sort((a, b) => a[0] - b[0]);
  for (let i = 0; i < line.length - 1; i++) {
    const [x1, z1] = line[i]!;
    const [x2, z2] = line[i + 1]!;
    if (x >= x1 && x <= x2) return x2 === x1 ? z1 : z1 + ((x - x1) / (x2 - x1)) * (z2 - z1);
  }
  return null;
}

/**
 * THE POINTS THE CAMERA FITS (B7).
 *
 * Step A fitted the whole plan. The shoreline reaches about 100 units sea-ward
 * and spans the frame's width, so the compound came out as a small patch in the
 * lower right with empty ground beside it, and the villa labels piled onto each
 * other (3 overlaps at 1440 px, 5 at 1024, 7 at 768, measured on its
 * screenshots). The frame is now the compound, the helipad, its apron and the
 * Rituals terrace. Villa roofs are included at their height, so a tall roof near
 * an edge is never cut.
 *
 * THE WATERLINE IN FRONT OF THE RITUALS TERRACE, AND NO MORE OF THE SHORE.
 * Framed on those four alone, the only water in the picture was a pelagos
 * wedge about 45 × 35 px in the bottom corner at 1440 px, under 0.2% of the
 * frame. It read as a rendering fault at the edge, not as the sea, on a page
 * whose cards say "the sea at eye level". The terrace is the seafront venue, and
 * where its water is is part of what a reader needs from it. So the fit also
 * takes the waterline across the terrace's own width: its vertices there, and
 * the line's z at the terrace's two sides. From the sea-side camera that line
 * runs along the bottom of the frame, so the sand band and the shallows reach
 * the frame's edge as a band, and the rest of the shore still runs past the
 * edges as a backdrop. It costs scale: measured against the screenshots, about
 * a quarter at every width. Taking only the two shore vertices nearest the
 * terrace cost an eighth and still left a triangle in the corner.
 */
export function framingPoints(plan: RenderPlan): [number, number, number][] {
  const pts: [number, number, number][] = [];
  let framed = plan.elements.filter((e) => FRAMED_KINDS.has(e.kind));
  /* A plan with none of them yet still frames what it draws, the shore excepted. */
  if (!framed.length) framed = plan.elements.filter((e) => e.kind !== "shore");
  for (const e of framed) {
    const f = e.footprint;
    if (f && "points" in f) {
      for (const [x, z] of f.points) pts.push([x, 0, z]);
    } else {
      const [w, d] = rectOf(f, [2, 2]);
      for (const [x, z] of corners(w, d, e.position.x, e.position.z, e.orientationDeg)) pts.push([x, 0, z]);
    }
  }
  for (const e of plan.elements.filter((v) => v.kind === "villa")) {
    const [w, d] = rectOf(e.footprint, [7, 6]);
    const h = STOREY * (e.storeys ?? 1);
    for (const [x, z] of corners(w, d, e.position.x, e.position.z, e.orientationDeg)) pts.push([x, h, z]);
  }
  const shore = plan.elements.find((e) => e.kind === "shore" && e.footprint && "points" in e.footprint);
  const shoreLine = shore?.footprint && "points" in shore.footprint ? shore.footprint.points : null;
  if (shoreLine) {
    for (const venue of plan.elements.filter((e) => e.kind === "venue")) {
      const f = venue.footprint;
      const outline = f && "points" in f ? f.points : corners(...rectOf(f, [2, 2]), venue.position.x, venue.position.z, venue.orientationDeg);
      const minX = Math.min(...outline.map((p) => p[0]));
      const maxX = Math.max(...outline.map((p) => p[0]));
      for (const x of [minX, maxX]) {
        const z = shoreAt(shoreLine, x);
        if (z !== null) pts.push([x, 0, z]);
      }
      for (const [x, z] of shoreLine) if (x > minX && x < maxX) pts.push([x, 0, z]);
    }
  }
  return pts;
}

/* ---- Label layout ----------------------------------------------------------

   WHY A LAYOUT AND NOT A LABEL ON EACH ANCHOR. The four villas stand 15–20
   plan units apart, which at 768 px is 50–65 px, and a button is at least 44 px
   tall and about 100 px wide with its name in it. No framing makes four named
   buttons fit on their roofs at that width. So each button stands as close to
   its anchor as the others allow, and a hairline leader joins it to the anchor
   when it has had to move.

   The layout is a small, deterministic search, measured on the real button
   sizes after the fonts have loaded: every button tries a fixed set of
   positions around its anchor (above first, then below, beside, diagonal, at
   growing distances), and each picks the cheapest given the others, round after
   round, until nothing changes. Overlapping another button or leaving the frame
   costs more than any distance, so they only happen if no position avoids
   them — and tests/estate-3d-preview.spec.ts fails if that happens at 768,
   1024, 1440 or 1920 px.

   Softer costs keep the result readable rather than merely legal: a button over
   another place's anchor, a leader through another button, and two leaders that
   cross. The last was added after step B's first 1024 px screenshot, where Villa
   Thoi's leader and the pool line's crossed over Thoi's roof and each read as
   pointing at the other's place.

   THE MASSING IS WHAT THE BUTTONS LABEL, SO THEY MUST NOT HIDE IT. The review of
   step B's screenshots found the compound unreadable as four houses at 768 and
   1024 px: Villa Thoi's house was mostly under its own button and the pool
   line's, and at 768 the pool line's leader ran ~110 px straight down beside
   Thoi's pool and read as pointing at it. Covering another place's anchor was
   the only massing cost. So each villa's and pool's outline on screen is now an
   obstacle: a button over a neighbour's house costs several times what one over
   its own does, a leader through a neighbour's house or pool costs as much as
   one through a button, and a leader costs more for every pixel past a
   comfortable length.

   The outline is the convex hull of the projected roof and ground corners, not
   their bounding box. Seen from a diagonal, a house's bounding box is about half
   empty ground, and the first version measured against boxes: the pool line's
   anchor, drawn just past Villa Thoi's roof, sat inside Thoi's box, so its
   leader straight down through Thoi's house was never charged for it. */

/** A drawn villa or pool on screen: its outline (a convex polygon, px) and the index of the place it belongs to (-1 for none). */
export interface Massing {
  hull: [number, number][];
  owner: number;
}

/** The convex hull of a set of points (Andrew's monotone chain), counter-clockwise in screen axes. */
export function convexHull(points: [number, number][]): [number, number][] {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;
  const cross = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: [number, number][] = [];
  for (const p of [...pts].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** Whether a point lies inside a polygon (ray casting). */
function inPolygon(px: number, py: number, poly: [number, number][]): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!;
    const [xj, yj] = poly[j]!;
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** How much of a box a polygon covers, in px², sampled on a 6 × 4 grid (a cost, not a measurement). */
function coverOf(box: Box, poly: [number, number][]): number {
  let n = 0;
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) if (inPolygon(box.x + ((i + 0.5) * box.w) / 6, box.y + ((j + 0.5) * box.h) / 4, poly)) n++;
  return (n / 24) * box.w * box.h;
}

/** Whether a segment passes through a polygon: an end inside it, or a crossing of one of its edges. */
function segmentThrough(x1: number, y1: number, x2: number, y2: number, poly: [number, number][]): boolean {
  if (inPolygon(x1, y1, poly) || inPolygon(x2, y2, poly)) return true;
  return poly.some((a, i) => {
    const b = poly[(i + 1) % poly.length]!;
    return segmentsCross([x1, y1, x2, y2], [a[0], a[1], b[0], b[1]]);
  });
}

/** Cost per px² of a button over a house or pool: a neighbour's, then its own. */
const COVER_NEIGHBOUR = 0.2;
const COVER_OWN = 0.03;
/** A leader through another place's massing. */
const LEADER_THROUGH_MASSING = 700;
/** Past this length (px) a leader costs LEADER_PER_PX more per px. */
const LEADER_LONG = 70;
const LEADER_PER_PX = 2;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LabelInput {
  /** The anchor, in px from the frame's top-left. */
  ax: number;
  ay: number;
  /** The button's size, in px. */
  w: number;
  h: number;
  /** A keep-clear radius around the anchor, in px: no button should cover it (0 for none). */
  clear?: number;
}

const DIRECTIONS: [number, number, number][] = [
  /* dx, dy, preference (px-equivalent) */
  [0, -1, 0],
  [0, 1, 8],
  [1, 0, 14],
  [-1, 0, 14],
  [1, -1, 18],
  [-1, -1, 18],
  [1, 1, 24],
  [-1, 1, 24],
];
const GAPS = [4, 18, 34, 54, 78, 106, 138];
const HARD = 100_000;

const intersection = (a: Box, b: Box, pad = 0) => {
  const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) + pad;
  const iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) + pad;
  return ix > 0 && iy > 0 ? ix * iy : 0;
};

const inside = (px: number, py: number, b: Box, grow = 0) =>
  px >= b.x - grow && px <= b.x + b.w + grow && py >= b.y - grow && py <= b.y + b.h + grow;

/** Which side of the line through a and b the point c lies on: -1, 0 or 1. */
const side = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) =>
  Math.sign((bx - ax) * (cy - ay) - (by - ay) * (cx - ax));

/** Whether the segment from (x1, y1) to (x2, y2) crosses box b. */
function crosses(x1: number, y1: number, x2: number, y2: number, b: Box): boolean {
  if (inside(x1, y1, b) || inside(x2, y2, b)) return true;
  const edges: [number, number, number, number][] = [
    [b.x, b.y, b.x + b.w, b.y],
    [b.x + b.w, b.y, b.x + b.w, b.y + b.h],
    [b.x + b.w, b.y + b.h, b.x, b.y + b.h],
    [b.x, b.y + b.h, b.x, b.y],
  ];
  return edges.some(
    ([ex1, ey1, ex2, ey2]) =>
      side(x1, y1, x2, y2, ex1, ey1) !== side(x1, y1, x2, y2, ex2, ey2) &&
      side(ex1, ey1, ex2, ey2, x1, y1) !== side(ex1, ey1, ex2, ey2, x2, y2)
  );
}

/** Whether two segments cross strictly: sharing an end point or merely touching does not count. */
function segmentsCross(a: [number, number, number, number], b: [number, number, number, number]): boolean {
  const [x1, y1, x2, y2] = a;
  const [x3, y3, x4, y4] = b;
  return side(x1, y1, x2, y2, x3, y3) * side(x1, y1, x2, y2, x4, y4) < 0 && side(x3, y3, x4, y4, x1, y1) * side(x3, y3, x4, y4, x2, y2) < 0;
}

export type LayoutOptions = { inset?: number; pad?: number; massing?: Massing[] };

/**
 * The label layout, all at once. The same search as `layoutLabelsSteps`, run to
 * the end in one call. Nothing in the page calls this: the diagram's build and
 * every resize drive the generator a step per task (EstateMap3D's
 * `layoutFrame`), because the whole search in one task is the longest task the
 * diagram has. It stays for the tests, which check step for step that the two
 * agree, and it is the definition of what they must agree on.
 */
export function layoutLabels(labels: LabelInput[], frame: { w: number; h: number }, avoid: Box[] = [], options: LayoutOptions = {}): Box[] {
  const steps = layoutLabelsSteps(labels, frame, avoid, options);
  for (;;) {
    const r = steps.next();
    if (r.done) return r.value;
  }
}

/**
 * THE LABEL LAYOUT, IN STEPS (D-028: "split the first-frame work into yielding
 * tasks"). A generator that pauses after each unit of work, so a caller can
 * give the main thread back between them: the fixed costs of one label's
 * positions, then each of the three solve orders. The steps are the one search
 * `layoutLabels` has always run, in the same order, so the result is the same
 * whether it is run in one task or in many.
 */
export function* layoutLabelsSteps(
  labels: LabelInput[],
  frame: { w: number; h: number },
  avoid: Box[] = [],
  { inset = 4, pad = 6, massing = [] }: LayoutOptions = {}
): Generator<void, Box[], void> {
  const inner: Box = { x: inset, y: inset, w: frame.w - 2 * inset, h: frame.h - 2 * inset };

  const options = labels.map((l) => {
    const list: { box: Box; base: number }[] = [];
    for (const gap of GAPS) {
      for (const [dx, dy, pref] of DIRECTIONS) {
        const cx = l.ax + dx * (l.w / 2 + gap * (dy ? 0.7 : 1));
        const cy = l.ay + dy * (l.h / 2 + gap * (dx ? 0.7 : 1));
        list.push({ box: { x: Math.round(cx - l.w / 2), y: Math.round(cy - l.h / 2), w: l.w, h: l.h }, base: gap * 1.6 + pref });
      }
    }
    return list;
  });

  /*
   * What a position costs whatever the other buttons do: leaving the frame,
   * covering the note, covering massing, a leader through massing or longer than
   * it needs to be, covering the helipad's letter. Computed once per option; the
   * search below then only adds what depends on the others. Its cost on a
   * throttled phone is not established (D-027), so the work is split: one
   * label's options per step, then one solve order per step.
   */
  const fixedCost = (i: number, box: Box, base: number) => {
    const l = labels[i]!;
    let c = base;
    const within = intersection(box, inner);
    const outside = box.w * box.h - within;
    if (outside > 0) c += HARD + outside * 10;
    for (const a of avoid) {
      const hit = intersection(box, a);
      if (hit > 0) c += HARD / 4 + hit * 4;
    }
    const lx = box.x + box.w / 2;
    const ly = box.y + box.h / 2;
    /* The massing the buttons label (see "The massing is what the buttons label"). */
    for (const m of massing) {
      const hit = coverOf(box, m.hull);
      if (hit > 0) c += hit * (m.owner === i ? COVER_OWN : COVER_NEIGHBOUR);
      /* A leader that starts inside a neighbour's outline (an anchor drawn over it) cannot help crossing it. */
      if (m.owner !== i && !inPolygon(l.ax, l.ay, m.hull) && segmentThrough(l.ax, l.ay, lx, ly, m.hull)) c += LEADER_THROUGH_MASSING;
    }
    const leader = Math.hypot(lx - l.ax, ly - l.ay) - Math.min(box.w, box.h) / 2;
    if (leader > LEADER_LONG) c += (leader - LEADER_LONG) * LEADER_PER_PX;
    /* A keep-clear disc (the helipad's letter): nearest point of the box to its centre, inside the radius. */
    labels.forEach((k, j) => {
      if (!k.clear) return;
      const nx = Math.min(Math.max(k.ax, box.x), box.x + box.w);
      const ny = Math.min(Math.max(k.ay, box.y), box.y + box.h);
      if (Math.hypot(nx - k.ax, ny - k.ay) < k.clear) c += j === i ? HARD / 5 : HARD / 10;
    });
    return c;
  };
  for (const [i, list] of options.entries()) {
    for (const o of list) o.base = fixedCost(i, o.box, o.base);
    yield;
  }

  const cost = (i: number, box: Box, fixed: number, placed: (Box | null)[]) => {
    const l = labels[i]!;
    let c = fixed;
    const lx = box.x + box.w / 2;
    const ly = box.y + box.h / 2;
    placed.forEach((other, j) => {
      if (j === i || !other) return;
      const hit = intersection(box, other, pad);
      if (hit > 0) c += HARD + hit * 10;
      const o = labels[j]!;
      /* Covering another place's anchor hides what that button points at. */
      if (inside(o.ax, o.ay, box, 5)) c += 2500;
      /* Leaders that cross a button read as pointing at the wrong place. */
      const ox = other.x + other.w / 2;
      const oy = other.y + other.h / 2;
      if (crosses(l.ax, l.ay, lx, ly, other)) c += 700;
      if (crosses(o.ax, o.ay, ox, oy, box)) c += 700;
      /* So do two leaders that cross each other. */
      if (segmentsCross([l.ax, l.ay, lx, ly], [o.ax, o.ay, ox, oy])) c += 900;
    });
    return c;
  };

  /*
   * ONE SEARCH IS GREEDY, SO IT IS RUN FROM THREE ORDERS. Each button takes its
   * cheapest position given the ones already placed, round after round, until
   * nothing changes; which button goes first decides where that settles. At
   * 768 px the list order let Villa Thoi and Villa Eeanthe take the ground
   * beside the pool line's anchor, and the pool line ended ~120 px away with a
   * leader past Thoi's house. So the search runs in the list's order, in
   * reverse, and with the button that came out most expensive going first, and
   * the layout with the lowest total cost wins (the list's order on a tie, so a
   * layout never changes for nothing).
   */
  type Option = { box: Box; base: number };
  const solve = (order: number[]) => {
    const placed: (Option | null)[] = labels.map(() => null);
    const boxesNow = () => placed.map((p) => p?.box ?? null);
    const choose = (i: number) => {
      const now = boxesNow();
      let best = options[i]![0]!;
      let bestCost = Infinity;
      for (const o of options[i]!) {
        const c = cost(i, o.box, o.base, now);
        if (c < bestCost) {
          bestCost = c;
          best = o;
        }
      }
      return best;
    };
    for (const i of order) placed[i] = choose(i);
    for (let round = 0; round < 12; round++) {
      let changed = false;
      for (const i of order) {
        const next = choose(i);
        if (next !== placed[i]) {
          placed[i] = next;
          changed = true;
        }
      }
      if (!changed) break;
    }
    const boxes = boxesNow() as Box[];
    const each = placed.map((p, i) => cost(i, p!.box, p!.base, boxes));
    return { boxes, each, total: each.reduce((s, c) => s + c, 0) };
  };

  const listOrder = labels.map((_, i) => i);
  let best = solve(listOrder);
  yield;
  const worst = best.each.indexOf(Math.max(...best.each));
  for (const order of [[...listOrder].reverse(), [worst, ...listOrder.filter((i) => i !== worst)]]) {
    const next = solve(order);
    if (next.total < best.total) best = next;
    yield;
  }
  return best.boxes;
}

/** How much of a box the given boxes cover, in px² (overlaps between them counted twice). */
export const coveredBy = (box: Box, others: Box[]) => others.reduce((s, o) => s + intersection(box, o), 0);

/**
 * Where an open card stands, from 768 px up.
 *
 * It must fit whole inside the frame and under `top`, the foot of the note band:
 * a card over the note would cover "Preview — unverified", which a screenshot of
 * the review build must always show (step B's first 1920 px screenshot had
 * exactly that). It must not touch its own button, and it stands within
 * CARD_REACH px of it, so it still reads as that button's card.
 *
 * Among those positions (every 8 px, plus the four centred on each side of the
 * button) it takes the cheapest: covering any of `obstacles`, the other places'
 * buttons, costs far more than distance, then nearer is better, then centred on
 * the button is better.
 *
 * Why the obstacles, and why a search rather than four fixed sides. The card is
 * drawn above the buttons, and the first version took the first side that
 * fitted. The review of its screenshots found the Villa Thoi card at 1440 px
 * hiding Villa Eeanthe and The pool line completely, the 768 px card hiding the
 * Private Helipad, and the pool line's card at 1920 px leaving "Villa P". A
 * pointer reader could not reach those places without closing the card first.
 * Choosing the least-covering of the four sides, each slid to either end, still
 * left Thoi's 1440 px card over the end of "The pool line": the clear position
 * was diagonal, below and to the right.
 *
 * Only when nothing fits is the card clamped into the frame above its button.
 * The result says how much of the obstacles it still covers (`covered`, px²):
 * where every position beside the button covers some place, EstateMap3D turns
 * the card into a band across the frame instead (see `bandEdge`). Below 768 px
 * the card is always that band.
 */
const CARD_REACH = 48;

export function cardPosition(
  button: Box,
  card: { w: number; h: number },
  frame: { w: number; h: number },
  { inset = 8, top = inset, obstacles = [] }: { inset?: number; top?: number; obstacles?: Box[] } = {}
) {
  const clampX = (x: number) => Math.min(Math.max(x, inset), Math.max(inset, frame.w - card.w - inset));
  const clampY = (y: number) => Math.min(Math.max(y, top), Math.max(top, frame.h - card.h - inset));
  const fits = (o: { x: number; y: number }) => o.x >= inset && o.x + card.w <= frame.w - inset && o.y >= top && o.y + card.h <= frame.h - inset;
  const near = { x: button.x - 4, y: button.y - 4, w: button.w + 8, h: button.h + 8 };
  const cost = (x: number, y: number) => {
    const box = { x, y, w: card.w, h: card.h };
    if (!fits(box) || intersection(box, near) > 0) return Infinity;
    const gap = Math.hypot(Math.max(button.x - (x + card.w), x - (button.x + button.w), 0), Math.max(button.y - (y + card.h), y - (button.y + button.h), 0));
    if (gap > CARD_REACH) return Infinity;
    const covered = obstacles.reduce((s, b) => s + intersection(box, b), 0);
    const offCentre = Math.hypot(x + card.w / 2 - (button.x + button.w / 2), y + card.h / 2 - (button.y + button.h / 2));
    return covered * 20 + gap * 2 + offCentre * 0.05;
  };
  const cx = button.x + button.w / 2 - card.w / 2;
  const cy = button.y + button.h / 2 - card.h / 2;
  let best = { x: clampX(cx), y: clampY(button.y - card.h - 4), c: Infinity };
  const consider = (x: number, y: number) => {
    const c = cost(x, y);
    if (c < best.c) best = { x, y, c };
  };
  for (const [x, y] of [
    [cx, button.y - card.h - 4],
    [cx, button.y + button.h + 4],
    [button.x + button.w + 4, cy],
    [button.x - card.w - 4, cy],
  ] as const)
    consider(x, y);
  for (let x = inset; x <= frame.w - card.w - inset; x += 8) for (let y = top; y <= frame.h - card.h - inset; y += 8) consider(x, y);
  const x = Math.round(best.x);
  const y = Math.round(best.y);
  return { x, y, covered: coveredBy({ x, y, w: card.w, h: card.h }, obstacles) };
}

/**
 * Which edge of the frame a card's band stands on: always below 768 px, and
 * from 768 px up when no position beside its button leaves the other places in
 * view (at 768 px no 210 × 173 px card fits anywhere under the note without
 * covering one of seven labels).
 *
 * The band is the full width of the frame and, on a phone, for a villa's card,
 * close to half its height. Standing always on the bottom edge, the review found
 * it over the very disc that opened it (Villa Thoi, 01, at 390 px): the reader
 * could not see which place was open or tap it again to close it, and a Tab from
 * the card landed under the band. So the band takes the bottom edge, or the top
 * edge just under the note, whichever covers less of the open button; then
 * whichever covers fewer other buttons; the bottom on a tie. `top` is the foot
 * of the note.
 */
export function bandEdge(button: Box, band: number, frame: { w: number; h: number }, top: number, others: Box[] = []): "top" | "bottom" {
  const cost = (y: number) => {
    const b = { x: 0, y, w: frame.w, h: band };
    return intersection(button, b) * 1000 + others.reduce((s, o) => s + intersection(o, b), 0);
  };
  return cost(top) < cost(frame.h - band) ? "top" : "bottom";
}
