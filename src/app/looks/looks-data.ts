import picks from "../../../content/look-picks.json";

/**
 * FOUR LOOKS, ONE PAGE, SO THE OWNER CAN CHOOSE BY LOOKING.
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
 * So: his photographs, his words, his property, four ways.
 *
 * THE COPY IS IDENTICAL ACROSS ALL FOUR. Same eyebrow, same lede, same five
 * litany lines, all lifted from `src/app/home-data.ts` where every one of them
 * already resolves against the inventory. If the copy changed between looks he
 * would be choosing a manifesto, not a design, and the comparison would prove
 * nothing.
 *
 * For the three PHOTO-LED looks, what differs is exactly three things — tokens,
 * curation, choreography — and nothing else. They render from ONE component and
 * `tests/looks.spec.ts` asserts their DOM is identical, which is what makes the
 * directive's "a token swap, not a rebuild" a measured claim rather than a hope.
 *
 * DIRECTION E BREAKS THAT, AND THE BREAK IS THE FINDING. Type-Alive puts
 * typography in front and demotes photography to small treated windows; its
 * numerals, marginalia and marquee are content rather than decoration, so it
 * needs its own markup. The claim held for three directions and did not hold
 * for the fourth, and both halves are recorded rather than the convenient one.
 */

export const LOOK_IDS = ["aegean", "editorial", "golden", "type-alive", "hotel"] as const;
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
  /**
   * One quiet line, present only when this look genuinely cannot dress the
   * site from graded photography. Null otherwise — see WARDROBE.
   */
  risk: string | null;
  /**
   * The typographic bill, so the owner decides with it visible.
   *
   * VERIFIED, not assumed. Every fact here was read from the Google Fonts
   * catalogue metadata (`isOpenSource`, `subsets`) rather than recalled, because
   * this text sits on a decision page and a wrong licence claim there is a
   * wrong claim about money.
   *
   * It also corrects the premise it was asked under. The brief assumed Aegean
   * and Editorial would need a COMMERCIAL licence and Golden would not. They do
   * not: Marcellus, Cormorant Garamond, GFS Didot and Inter are all
   * open-licence and all four are already vendored in this repository, so no
   * look as prototyped implies a font purchase. The directive's own NAMED faces
   * — Canela, Reckless, GT Sectra, Söhne — are commercial, but they are
   * commercial for all three looks equally, so they are not a differentiator.
   *
   * The real differentiator is Greek, and it is not about money: neither
   * Marcellus nor Cormorant Garamond offers a Greek subset AT ALL, so /el would
   * need a different display face sourced, not a re-subset of the same one.
   * GFS Didot ships greek and greek-ext.
   */
  fonts: {
    /** The display face this look uses. */
    face: string;
    /** Open licence, already in this repo. True for all four — see above. */
    free: boolean;
    /** Does the family offer a Greek subset at all? */
    greek: boolean;
    /** One line for the card, in the owner's terms. */
    bill: string;
  };
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

/**
 * WHAT DRESSING THIS SITE ACTUALLY COSTS, MEASURED FROM THE BUILT SITE.
 *
 * "Can it dress five villa pages" needed a number, and inventing one would have
 * put a fabricated threshold on the owner's decision page. So it was counted:
 * every distinct frame rendered across the ten main routes, after a full scroll.
 *
 *   villa pages       44, 47, 49, 48 distinct frames — and Pueblo just 9,
 *                     which is the known content gap, not a design choice
 *   the estate        46
 *   weddings          32
 *   experiences       19
 *   home              33
 *   ---------------------------------------------------------------
 *   distinct frames across those ten routes   245
 *
 * So a villa page is not "a hero and three supports" — it is FORTY-ODD frames,
 * and the site as a whole runs on 245. Against that, the entire Phase 1 graded
 * set was 72.
 *
 * `heroSlots` is the number that actually gates a LOOK, though. Galleries can
 * be dressed from good support frames; what a direction cannot fake is the
 * full-bleed frame at the top of each major page. There are ten of those:
 * five villas, the estate, weddings, experiences, location, home.
 */
export const WARDROBE = { heroSlots: 10, siteFrames: 245, routesCounted: 10 } as const;

/**
 * HOW MANY HERO FRAMES A LOOK ACTUALLY NEEDS — which is not the same number for
 * every look, and pretending it was would have hidden Direction E's whole point.
 *
 * The three photo-led directions each head every major page with a photograph,
 * so they need all ten. Type-Alive heads its pages with TYPE and rations
 * photography to two or three reserved set-pieces; ten would be a requirement
 * invented by the measuring tool rather than by the design.
 *
 * That difference is the argument for the direction, so it is modelled rather
 * than smoothed over.
 */
const HERO_SLOTS_NEEDED: Record<LookId, number> = {
  aegean: WARDROBE.heroSlots,
  editorial: WARDROBE.heroSlots,
  golden: WARDROBE.heroSlots,
  "type-alive": 3,
  /*
   * A hotel homepage heads every page with a photograph and fills the body with
   * more. It needs the full ten, and it is the only direction that also needs
   * real DEPTH behind them — which is why its card quotes support frames too.
   */
  hotel: WARDROBE.heroSlots,
};

function riskFor(id: LookId, r: Reservoir): string | null {
  const need = HERO_SLOTS_NEEDED[id];
  if (r.proven >= need) return null;
  return (
    `Only ${r.proven} frames in this look are strong enough to head a page, and it needs ` +
    `${need}. Choosing it means shooting or finding more.`
  );
}

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
function withSlots(base: Omit<Look, "frames" | "hero" | "act" | "strip" | "reservoir" | "risk">): Look {
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
    risk: riskFor(base.id, entry.reservoir),
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
    fonts: {
      face: "Marcellus",
      free: true,
      greek: false,
      bill: "Free face, already in the build. No Greek — the Greek site needs a second display face chosen.",
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
    fonts: {
      face: "Cormorant Garamond",
      free: true,
      greek: false,
      bill: "Free face, already in the build. No Greek — the Greek site needs a second display face chosen.",
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
    fonts: {
      face: "GFS Didot",
      free: true,
      greek: true,
      bill: "Free face, already in the build. Greek included — the Greek site is covered by the same face.",
    },
  }),
  withSlots({
    id: "type-alive",
    name: "Type-Alive",
    greekName: "Ζωντανά Γράμματα",
    promise:
      "The words lead and they move. Photographs are small, treated, and rationed to two or three moments.",
    greekPromise:
      "Τα γράμματα πρωταγωνιστούν και κινούνται. Οι φωτογραφίες είναι λίγες, μικρές και δουλεμένες.",
    /* Named in the brief as the category proof; recorded, never fetched. */
    anchors: ["bottegaveneta.com", "aesop.com", "locomotive.ca"],
    character: {
      type: "Literata Variable — the weight moves",
      palette: "Warm paper, cobalt, coral, citron",
      motion: "Type settles, lines arrive, the register drifts.",
    },
    fonts: {
      face: "Literata",
      free: true,
      greek: true,
      bill: "Free face, newly added. Greek included, and it is variable — which is what lets the type move.",
    },
  }),
  withSlots({
    id: "hotel",
    name: "The Cretan Hotel",
    greekName: "Το Κρητικό Ξενοδοχείο",
    promise:
      "The dense, warm hotel homepage: Book Now always in reach, many photographs, every fact on the card.",
    greekPromise:
      "Η ζεστή, γεμάτη σελίδα ξενοδοχείου: κράτηση πάντα μπροστά σου, πολλές φωτογραφίες, όλα τα στοιχεία στην κάρτα.",
    /* Calibrated on a same-island competitor's STRUCTURE, never its identity. */
    anchors: ["acrosuites.com (structure and density only)"],
    character: {
      type: "Literata + Inter, nothing oversized",
      palette: "Ivory and sand, terracotta, olive, Aegean blue",
      motion: "Slider crossfades, gentle hover zooms.",
    },
    fonts: {
      face: "Literata",
      free: true,
      greek: true,
      bill: "Free face, already in the build. Greek included — the Greek site is covered.",
    },
  }),
];

export const getLook = (id: string): Look | undefined => LOOKS.find((l) => l.id === id);
