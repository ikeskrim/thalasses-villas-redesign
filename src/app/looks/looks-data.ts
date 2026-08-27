import picks from "../../../content/look-picks.json";

/**
 * THREE LOOKS, ONE PAGE, SO THE OWNER CAN CHOOSE BY LOOKING.
 *
 * Five verbal rounds failed on this project. Both times a design decision
 * actually landed, it landed because he saw something and picked it. The
 * re-skin research reaches the same conclusion and proposes sending him three
 * ANCHOR SITES — aman.com, sanlorenzoyacht.com, nobuhotels.com.
 *
 * That is still asking him to imagine. Showing a Cretan villa owner the Aman
 * website asks him to picture his own five houses inside somebody else's brand,
 * which is the same act of translation that failed five times, only now with
 * pictures attached. The research's own fallback — "build one clickable hero
 * prototype per look and let him choose from moving pixels" — is the primary
 * move, not the fallback.
 *
 * So: his photographs, his words, his property, three ways.
 *
 * THE COPY IS IDENTICAL ACROSS ALL THREE. Same eyebrow, same lede, same five
 * litany lines, all lifted from `src/app/home-data.ts` where every one of them
 * already resolves against the inventory. If the copy changed between looks he
 * would be choosing a manifesto, not a design, and the comparison would prove
 * nothing.
 *
 * WHAT DIFFERS IS EXACTLY THREE THINGS, which is the directive's own claim
 * about what a re-skin is:
 *
 *   1. TOKENS      — palette, type family, display scale, rhythm.
 *   2. CURATION    — which photographs, from `npm run reservoir`.
 *   3. CHOREOGRAPHY — how it moves.
 *
 * The markup does not differ. All three render from one component, and
 * `tests/looks.spec.ts` asserts the DOM is identical across them — which is
 * what makes "a token swap, not a rebuild" a measured claim rather than a hope.
 */

export const LOOK_IDS = ["aegean", "editorial", "golden"] as const;
export type LookId = (typeof LOOK_IDS)[number];

export interface Frame {
  src: string;
  subject: string;
  grade: string;
  n: number;
  w: number;
  h: number;
}

interface Reservoir {
  proven: number;
  support: number;
  candidates: number;
}

interface PicksFile {
  looks: Record<
    string,
    { name: string; promise: string; frames: Frame[]; reservoir: Reservoir }
  >;
}

const PICKS = picks as unknown as PicksFile;

/**
 * The shared copy. Every line is already on the live homepage.
 *
 * The hero lede carries the owner's outstanding flag (T-256) on the real site
 * and it carries it here too — a prototype that quietly drops a draft marker
 * teaches the owner the line is settled.
 */
export const SHARED = {
  eyebrow: "Pigianos Kampos · Rethymno · Crete",
  headline: "Living",
  headlineTail: "Unlimited",
  lede:
    "Five seafront villas, one private beach fifty metres from the door, on the north coast of Crete.",
  ledeStatus: "draft — not signed off (T-256)",
  litany: [
    "The morning swim, before anyone else is up.",
    "The gate that closes behind you.",
    "A beach with no one else's towels on it.",
    "The table, set for eighteen.",
    "The last of the light, from your own terrace.",
  ],
  actLabel: "Arrival",
  actGerund: "Landing",
  actTail: "The only seafront villas with helipad",
  actStatus: "scope flagged for the owner (T-233)",
} as const;

export interface Look {
  id: LookId;
  name: string;
  greekName: string;
  /** One line, in the register the owner reads. */
  promise: string;
  greekPromise: string;
  /** The reference sites the research names, for context — never fetched. */
  anchors: string[];
  /** Named so the owner sees what he is choosing between, not just feels it. */
  character: { type: string; palette: string; motion: string };
  frames: Frame[];
  /** The layout's slots, resolved here so the component never indexes blind. */
  hero: Frame;
  act: Frame;
  strip: Frame[];
  /** What the reservoir says this look can actually be dressed from. */
  reservoir: Reservoir;
}

/**
 * The layout has six photographic slots. A look that cannot fill them renders
 * holes, so this throws at build time rather than at the owner.
 *
 * It is a real possibility, not defensive noise: Golden Coast has **six** proven
 * support frames in the whole library. If a future grading pass flags two of
 * them, this is the thing that says so, on the build, in words — instead of
 * shipping a prototype with two empty squares in the strip.
 */
const SLOTS = 6;

function framesFor(id: LookId): Frame[] {
  const entry = PICKS.looks[id];
  const n = entry?.frames.length ?? 0;
  if (!entry || n < SLOTS) {
    throw new Error(
      `content/look-picks.json offers ${n} frames for "${id}"; the layout has ${SLOTS} slots. ` +
        `Run \`npm run reservoir\`. If it still comes up short, that look cannot be ` +
        `dressed from graded photography and the honest move is to say so, not to repeat a frame.`
    );
  }
  return entry.frames;
}

/** Slot resolution, once, so neither the component nor the chooser indexes blind. */
function withSlots(base: Omit<Look, "frames" | "hero" | "act" | "strip" | "reservoir">): Look {
  const entry = PICKS.looks[base.id]!;
  const frames = framesFor(base.id);
  const [hero, act] = frames as [Frame, Frame, ...Frame[]];
  return {
    ...base,
    frames,
    hero,
    act,
    strip: frames.slice(2, SLOTS),
    /* Read, never transcribed — see the note in scripts/look-reservoir.mjs. */
    reservoir: entry.reservoir,
  };
}

/**
 * The reservoir figures are NOT here. They come out of
 * `content/look-picks.json`, which `npm run reservoir` writes, because a count
 * typed into this file would be a second source — and the first thing it would
 * do is go stale on the one card whose job is to tell the owner what a look can
 * be dressed from.
 */
export const LOOKS: Look[] = [
  withSlots({
    id: "aegean",
    name: "Aegean Light",
    greekName: "Αιγαίο Φως",
    promise: "The sea, the light, and five white houses — nothing between you and the horizon.",
    greekPromise:
      "Λευκό, φωτεινό, μεσογειακό — μόνο η θάλασσα, το φως και τα πέντε λευκά σπίτια.",
    anchors: ["aman.com", "villa-vista-magnifika.com", "sixsenses.com"],
    character: {
      type: "Marcellus, wide-tracked, small",
      palette: "Paper white, limewash, one Aegean blue",
      motion: "Slow fades. Almost nothing.",
    },
  }),
  withSlots({
    id: "editorial",
    name: "Editorial Estate",
    greekName: "Editorial",
    promise: "A magazine feature about one address — read it top to bottom, then book.",
    greekPromise: "Δομημένο σαν αφιέρωμα περιοδικού, με σιγουριά και σειρά.",
    anchors: ["sanlorenzoyacht.com", "loropiana.com", "awwwards.com/sites/studio-x"],
    character: {
      type: "Cormorant Garamond, numbered, with a mono label",
      palette: "Bone paper, ink, bronze-olive rules",
      motion: "Text sets itself, line by line.",
    },
  }),
  withSlots({
    id: "golden",
    name: "Golden Coast",
    greekName: "Χρυσή Ακτή",
    promise: "Arrive at golden hour and never leave — light that moves, houses stacked to the water.",
    greekPromise: "Ζεστό, κινηματογραφικό golden hour, με σπίτια «στοιβαγμένα» προς τη θάλασσα.",
    anchors: ["nobuhotels.com", "awwwards.com/sites/architecture-studio", "villa-vista-magnifika.com"],
    character: {
      type: "GFS Didot, high contrast, full width",
      palette: "Warm ivory, sand, espresso, gold",
      motion: "Slow push-in. Fills the eye.",
    },
  }),
];

export const getLook = (id: string): Look | undefined => LOOKS.find((l) => l.id === id);
