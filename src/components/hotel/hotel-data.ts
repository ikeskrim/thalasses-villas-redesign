import mantinada from "@content/mantinada.json";
import grades from "@content/photo-grades.json";
import selects from "@content/photo-selects.json";
import facts from "@content/verified-facts.json";
import {
  experienceFrame,
  experienceImageryNote,
  getAllExperiences,
  getVilla,
  localImage,
} from "@/lib/content";

/**
 * DIRECTION F — "THE CRETAN HOTEL", and everything on it comes from the registry.
 *
 * The genre is the dense, warm, credible luxury-hotel homepage: Book Now always
 * top-right, a slow hero, villa cards, experience cards, a weddings section, a
 * press wall, a real footer. Density is the point — the previous four
 * directions all argue for restraint, and the owner has rejected restraint six
 * times.
 *
 * WHERE THE VILLA PHOTOGRAPHS COME FROM, because this is the one place a look
 * can accidentally lie. A villa card asserts "this is Villa Thoi". Nothing in
 * the grading pass knows which building is which — a grader can see a pool and a
 * white wall, not a name — so choosing a frame myself would have put an
 * unfounded claim on five cards.
 *
 * The registry already holds the answer: each `content/villas/*.json` carries
 * the `gallery.heroImage` the owner's own CMS published for that villa. That is
 * his mapping, not mine, and it is what these cards use.
 */

interface Frame {
  path: string;
  grade: string;
  subject: string;
  flag?: string | null;
}

/* Every graded frame, Phase 1 first — it is the curation of record. */
const FRAMES = new Map<string, Frame>();
for (const s of (selects as { selects: { path: string; grade: string; subject: string }[] }).selects) {
  FRAMES.set(s.path, { path: s.path, grade: s.grade, subject: s.subject ?? "" });
}
for (const f of (grades as { frames: Frame[] }).frames) {
  if (!FRAMES.has(f.path)) FRAMES.set(f.path, f);
}

const BY_SUBJECT = new Map<string, Frame>();
for (const f of FRAMES.values()) if (!BY_SUBJECT.has(f.subject)) BY_SUBJECT.set(f.subject, f);

/**
 * A frame named by its exact subject line, or a build failure.
 *
 * Named rather than indexed for the same reason the experience mapping is: if a
 * re-grade flags or removes a photograph, this stops the build and says which
 * one, instead of quietly sliding onto a different picture.
 */
function bySubject(subject: string): Frame {
  const f = BY_SUBJECT.get(subject);
  if (!f) {
    throw new Error(
      `Direction F wants the frame described "${subject}" and no unflagged graded frame ` +
        `carries that subject any more. Re-run \`npm run reservoir\` and pick again — do not ` +
        `substitute a different photograph, because the caption travels with it.`
    );
  }
  return f;
}

/* The frame the OWNER's CMS published for a villa. His mapping, not mine. */
function villaFrame(key: string): { src: string; alt: string } {
  const v = getVilla(key);
  const src = localImage(v.gallery?.heroImage ?? null);
  if (!src) {
    throw new Error(`No usable hero frame for villa "${key}" — it may have been blocked or removed.`);
  }
  return { src, alt: FRAMES.get(src)?.subject ?? `${v.name}` };
}

/* ------------------------------------------------------------------ hero -- */
/**
 * Three frames, crossfading, Ken Burns on each.
 *
 * The brief asks for "a slow slider/video slot… until real footage". The slot is
 * built so that dropping an MP4 into `public/video/` is a content change rather
 * than a code change — the same shape `content/image-sources.md` §5 already
 * specifies for the hero the owner has not yet supplied.
 */
/*
 * ALL THREE ARE A-GRADE, and the third one was not.
 *
 * The hero used "Aerial of white villas above a blue sea" — `Ritual-drone.webp`,
 * graded **B** in the full grading pass and absent from `photo-selects.json`
 * altogether. Direction F's brief welcomes B-grade frames, and that is true of
 * its cards; it is not true of the hero. The curation ruling is specific about
 * full-bleed, and `tests/parity.spec.ts` asserts it: the frame a visitor meets
 * first is A-grade or it is not full-bleed. The B-grade frame was on the most
 * prominent surface of the site.
 *
 * Replaced with a frame that is A-grade and whose PRIMARY SUBJECT NOUN differs
 * from the other two — umbrellas, then a villa exterior, then the seafront
 * itself. All three read as dusk, which is not a composition choice: the
 * library's A-grades are overwhelmingly golden hour, and that is recorded in
 * RESERVOIR.md rather than papered over here.
 */
export const HERO = [
  bySubject("Beach umbrellas and loungers, golden hour, sea behind"),
  bySubject("Villa exterior at dusk, pool lit green-blue"),
  bySubject("Sunset over rocky seafront and horizon"),
].map((f) => ({ src: f.path, alt: f.subject }));

export const MANIFESTO = {
  /* The concept the owner already uses, across every villa record. */
  line: "Living Unlimited",
  /*
   * Warm-voice paragraph. Every clause resolves: five villas, a private beach
   * about fifty metres away, the north coast of Crete, and the estate's own
   * table for eighteen. Nothing here is atmosphere pretending to be a fact.
   */
  paragraph:
    "Five villas on the north coast of Crete, each with its own pool, fifty metres above a " +
    "private beach. Come as a family, or take the four seafront houses together and sit " +
    "eighteen at one table. The sea is the first thing you see and the last thing you hear.",
  /* D-008: approved as the working line. The pending marker is gone from the page. */
} as const;

/* ---------------------------------------------------------- the wedding deck -- */
/**
 * PHASE 2'S SET-PIECE FOR WEDDINGS, AND WHY IT IS A STICKY DECK.
 *
 * `MOTION-DIRECTIVE.md` §G offers a sticky deck or a drag-to-explore strip and
 * says to choose by what the photography supports. The Rituals library is not
 * a gallery of one register; it is an EVENING, photographed in order: guests
 * gathered by the water in low sun, the tables laid around the pool at golden
 * hour, dinner under the festoon lights as the sky goes, and then the dancing
 * at dusk. Seven A-grades and some fifty Bs of one venue, one night.
 *
 * A drag strip scans laterally and flattens a sequence into a row; a deck
 * stacks in time, which is what these frames already do. The deck also
 * degrades honestly: CSS `position: sticky` does the stacking with no script,
 * so touch gets the same set-piece without a gesture handler, and under
 * `reduce` it is simply four photographs in a column.
 *
 * Every frame is the property's own — a wedding at Thalasses is a Tier A
 * subject and no sourced stock may appear here. Named by exact subject so a
 * re-grade fails the build rather than sliding onto a different night.
 */
export const WEDDING_DECK = [
  bySubject("Wedding gathering by the water, backlit"),
  bySubject("Dressed banquet tables and folding chairs around a seafront pool at golden hour"),
  bySubject("Guests dining at tables under festoon lights with a lit pool and the sea beyond"),
  bySubject("Wedding guests dancing on a seafront pool deck at dusk beneath palms"),
].map((f, i) => ({ src: f.path, alt: f.subject, grade: f.grade, n: i + 1 }));

/* ------------------------------------------------------- discover crete -- */
/**
 * The one photograph in Discover Crete: the estate from the air, with the
 * farmland that is literally where you are. Own material; it carries the
 * section's ≤8% parallax (Phase 2, Level 2) and is the only image there.
 */
export const CRETE_FIGURE = (() => {
  const f = bySubject("Aerial of white villas beside the sea at golden hour, farmland in the foreground");
  return { src: f.path, alt: f.subject };
})();

/* ----------------------------------------------------------------- villas -- */
const E = facts as {
  estate: { bedrooms: number; bathrooms: number; sleepsInBeds: number; privatePools: number; diningTableSeats: number; villas: number };
  distances: { name: string; value: string; note?: string }[];
  legal: { operatingLicence: string };
};

export interface VillaCard {
  slug: string;
  name: string;
  frame: { src: string; alt: string };
  /** Two lines, both derived from the locked capacity table. */
  lines: [string, string];
  book: string | null;
  enquire?: boolean;
}

const BOOK = "https://thalassesvillas.reserve-online.net/?lang=en";

export const VILLAS: VillaCard[] = [
  {
    slug: "villa-thoi",
    name: "Villa Thoi",
    frame: villaFrame("200"),
    lines: ["Two bedrooms, one bathroom, four in beds.", "Its own pool, and the sea directly in front."],
    book: BOOK,
  },
  {
    slug: "villa-persi",
    name: "Villa Persi",
    frame: villaFrame("201"),
    lines: ["Two bedrooms, four in beds, a Jacuzzi bath.", "A private pool, fifty metres from the water."],
    book: BOOK,
  },
  {
    slug: "villa-eeanthe",
    name: "Villa Eeanthe",
    frame: villaFrame("202"),
    lines: ["Three bedrooms over two floors, six in beds.", "The sea from the upstairs bedrooms and the balcony."],
    book: BOOK,
  },
  {
    slug: "villa-melia",
    name: "Villa Melia",
    frame: villaFrame("203"),
    lines: ["Two bedrooms, two bathrooms, over two floors.", "The sea from the first floor, and its own pool."],
    book: BOOK,
  },
  {
    slug: "villa-pueblo",
    name: "Villa Pueblo",
    frame: villaFrame("pueblo"),
    lines: ["Three bedrooms, three bathrooms, ninety-five square metres.", "Adults only, in its own seclusion."],
    book: BOOK,
  },
];

/**
 * The sixth card, larger — and it is FOUR villas, not five.
 *
 * `rent-them-all-together` is the four seafront houses; Villa Pueblo is
 * adults-only and stands apart. Writing "all five" here would be the easy,
 * wrong sentence, and the capacity table says otherwise: 9 bedrooms, 6
 * bathrooms, 18 in beds, 4 pools.
 *
 * It ENQUIRES rather than books, because the estate is enquiry-only by the
 * owner's decision (T-158). A Book button here would promise a flow that
 * deliberately does not exist.
 */
export const ESTATE = {
  slug: "the-estate",
  name: "The Entire Estate",
  frame: villaFrame("2142"),
  lines: [
    /* Prose here, figures on the next line — a sentence opening on "4" reads
       like a spreadsheet, and the capacity table is quoted in full below. */
    "The four seafront villas, taken as one house.",
    `${E.estate.bedrooms} bedrooms, ${E.estate.sleepsInBeds} in beds, ${E.estate.privatePools} pools, one table for ${E.estate.diningTableSeats}.`,
  ] as [string, string],
  enquire: true,
};

/* ------------------------------------------------------------ experiences -- */
export interface ExperienceCard {
  slug: string;
  name: string;
  blurb: string;
  frame: { src: string; alt: string } | null;
  /** True when Tier B-Experiences licensed stock is still to be sourced. */
  needsImagery: boolean;
  /** Crop focus for a portrait stock frame on a 4:3 card. */
  position?: string;
  /** Why the slot is still empty after sourcing — shown on the card. */
  note: string | null;
}

/**
 * Five groups. The registry files three experiences under "Service"; two of
 * them are ARRIVAL — the chauffeur who meets a guest at the airport or the port,
 * and the helipad — and D-003 gives them their own cards under that name, which
 * is what both of them are. The third, the wedding, keeps its own section.
 *
 * They were placed in the Discover Crete prose before, and that line stays: it
 * is true, and it is where a guest reads about getting here.
 */
export const EXPERIENCE_GROUPS = ["Sea", "Land", "Taste", "Wellness", "Arrival"] as const;

/** D-003: the two Service experiences that are arrival, carded as such. */
const ARRIVAL = new Set(["chauffeur", "private-helipad"]);

export const EXPERIENCES: Record<string, ExperienceCard[]> = (() => {
  const out: Record<string, ExperienceCard[]> = { Sea: [], Land: [], Taste: [], Wellness: [], Arrival: [] };
  for (const e of getAllExperiences()) {
    const group = ARRIVAL.has(e.slug) ? "Arrival" : e.categoryProposed;
    if (!group || !(group in out)) continue;
    /* One resolver for every surface — see `experienceFrame` in lib/content. */
    const frame = experienceFrame(e.slug);
    out[group]!.push({
      slug: e.slug,
      name: e.name,
      blurb: (e.shortDescription ?? "").trim(),
      frame: frame ? { src: frame.src, alt: frame.alt } : null,
      needsImagery: !frame,
      position: frame?.position,
      note: frame ? null : experienceImageryNote(e.slug),
    });
  }
  /*
   * WITHIN a group, photographed cards lead.
   *
   * Fourteen of twenty-one experiences are still waiting on licensed stock, and
   * left in registry order the Sea group opened with three cards in a row that
   * had no picture at all. That is an accident of alphabetical order reading as
   * a broken page. The group ORDER is the brief's — Sea, Land, Taste, Wellness —
   * and nothing is hidden: every unphotographed card still says so.
   */
  for (const g of Object.keys(out)) {
    out[g]!.sort((a, b) => Number(a.needsImagery) - Number(b.needsImagery));
  }
  return out;
})();

/* --------------------------------------------------------------- location -- */
export const DISTANCES = E.distances;

/**
 * THE DISCOVER CRETE QUOTE — a traditional mantinada, from a published
 * collection, never composed (DECISIONS.md D-005).
 *
 * A mantinada is a real cultural form with real, if anonymous, authorship.
 * Writing a plausible one would be the worst kind of invention this project
 * forbids, so the couplet is TAKEN — from a printed folk collection, with its
 * editor, year, page and number recorded in `content/mantinada.json` — and set
 * in Greek, attributed as the tradition it belongs to. There is no English
 * rendering on the page: a translation would be composition, and the Greek
 * corpus is the owner's to sign off.
 *
 * If the file carries no couplet, the slot stays labelled.
 */
type Mantinada = {
  lines: [string, string] | null;
  attribution: string;
  cite: string;
};
const M = mantinada as unknown as Mantinada;
export const SECTION_QUOTE = {
  lines: M.lines,
  attribution: M.attribution,
  cite: M.cite,
  placeholder: "[owner to supply — a mantinada or a Cretan proverb, in his own choice and approval]",
};

/* ----------------------------------------------------------------- press -- */
/**
 * ONE CREDENTIAL, SET AS ONE LINE (D-007).
 *
 * The inventory holds exactly one mention, and it is real: a Condé Nast
 * Traveler badge served from the owner's site, linked to the magazine's Crete
 * story. A wall of four tiles with three of them empty read as a wall waiting
 * to be filled; one line in the site's own type reads as a credential. The wall
 * returns when the owner supplies more — `real` is still a list for that day.
 *
 * "Traveler", the magazine's own spelling: the owner's badge carries the US
 * masthead and links to cntraveler.com. The badge image itself is not re-hosted
 * — it is a third-party trademark, and `content/assets-manifest.json` marks
 * assets of that kind "do not re-host without permission".
 */
export const PRESS = {
  lead: "As featured in",
  real: [
    {
      title: "Condé Nast Traveler",
      year: "2024",
      href: "https://www.cntraveler.com/story/where-to-stay-in-crete",
    },
  ],
};

/* ---------------------------------------------------------------- footer -- */
export const FOOTER = {
  email: "info@thalasses.com",
  phones: ["+30 6974 069475", "+30 211 4445757"],
  licence: (facts as { legal: { operatingLicence: string } }).legal.operatingLicence,
  socials: [
    { platform: "Facebook", url: "https://www.facebook.com/villasthalasses" },
    { platform: "Instagram", url: "https://www.instagram.com/thalasses_villas/" },
    { platform: "YouTube", url: "https://www.youtube.com/channel/UCiHumP-cMIBORj4fVf9tCvw/videos" },
  ],
  /**
   * SISTER PROPERTIES (D-006) — names and links only.
   *
   * Given by the owner's delegated reviewer; each address checked to resolve to
   * the brand's own site before it went in. No logo is re-hosted until the owner
   * supplies the files, and the group name is not printed because it has not
   * been confirmed.
   */
  sisters: [
    { name: "Ink Hotels", url: "https://inkhotels.gr/" },
    { name: "Domisignature", url: "https://www.domisignature.com/" },
    { name: "Crete Holiday Home", url: "https://creteholidayhome.com/" },
  ],
  booking: BOOK,
};
