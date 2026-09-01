import experienceImagery from "@content/experience-imagery.json";
import grades from "@content/photo-grades.json";
import selects from "@content/photo-selects.json";
import facts from "@content/verified-facts.json";
import { getAllExperiences, getVilla, localImage } from "@/lib/content";

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
export const HERO = [
  bySubject("Beach umbrellas and loungers, golden hour, sea behind"),
  bySubject("Villa exterior at dusk, pool lit green-blue"),
  bySubject("Aerial of white villas above a blue sea"),
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
  status: "draft — voice not signed off (T-256)",
} as const;

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
const IMAGERY = experienceImagery as {
  experiences: Record<string, { status: string; src?: string; alt?: string }>;
};

export interface ExperienceCard {
  slug: string;
  name: string;
  blurb: string;
  frame: { src: string; alt: string } | null;
  /** True when Tier B-Experiences licensed stock is still to be sourced. */
  needsImagery: boolean;
}

/**
 * Four groups, and the three the registry files under "Service" are not among
 * them — they appear where they belong on this page instead. The wedding is its
 * own section; the helipad and the chauffeur are arrival, and sit in Discover
 * Crete. Inventing a fifth group to hold them would be tidier and less true.
 */
export const EXPERIENCE_GROUPS = ["Sea", "Land", "Taste", "Wellness"] as const;

export const EXPERIENCES: Record<string, ExperienceCard[]> = (() => {
  const out: Record<string, ExperienceCard[]> = { Sea: [], Land: [], Taste: [], Wellness: [] };
  for (const e of getAllExperiences()) {
    const group = e.categoryProposed;
    if (!group || !(group in out)) continue;
    const mapped = IMAGERY.experiences[e.slug];
    const cleared = mapped?.status === "cleared" && mapped.src;
    out[group]!.push({
      slug: e.slug,
      name: e.name,
      blurb: (e.shortDescription ?? "").trim(),
      frame: cleared ? { src: mapped.src!, alt: mapped.alt ?? e.name } : null,
      needsImagery: !cleared,
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
 * The section quote is EMPTY on purpose.
 *
 * The brief asks for a Cretan proverb or a mantinada. There is no proverb in
 * the inventory, and a mantinada is a real cultural form with real authorship —
 * writing a plausible-sounding one and setting it in 40px type on a Cretan
 * family's own website would be the worst kind of invention this project
 * forbids. The slot is built, labelled, and waiting.
 */
export const SECTION_QUOTE = {
  text: null as string | null,
  placeholder: "[owner to supply — a mantinada or a Cretan proverb, in his own choice and approval]",
};

/* ----------------------------------------------------------------- press -- */
/**
 * ONE real mention, and it is real: the inventory holds a Condé Nast Traveler
 * 2024 badge served from the site host, linked to the magazine's Crete story.
 *
 * THE BADGE IMAGE IS NOT RE-HOSTED. It is a third-party trademark, and
 * `content/assets-manifest.json` marks assets of that kind "do not re-host
 * without permission". The mention is set as type and linked instead, which is
 * also the better design.
 *
 * Everything else is an empty labelled slot. A press wall padded with invented
 * accolades is the single fastest way to lose a client's trust.
 */
export const PRESS = {
  real: [
    {
      title: "Condé Nast Traveler",
      detail: "2024 — “Where to Stay in Crete”",
      href: "https://www.cntraveler.com/story/where-to-stay-in-crete",
    },
  ],
  slots: 3,
  slotLabel: "[owner to add — award, magazine or guide]",
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
   * The group's other properties, as given to me and NOT as found in this
   * repository — nothing in the inventory names a Domisi group or links these
   * brands to Thalasses. Marked for the owner rather than asserted, because a
   * footer that claims a corporate relationship is making a legal statement.
   */
  group: {
    name: "Domisi",
    properties: ["Ink Hotels", "Domisignature"],
    status: "[owner to confirm the group name and the full list]",
  },
  booking: BOOK,
};
