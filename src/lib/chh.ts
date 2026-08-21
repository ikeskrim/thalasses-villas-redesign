import chhFacts from "../../content/chh-facts.json";

/**
 * THE PARTNER'S ACCOUNT OF THIS PROPERTY, held at arm's length.
 *
 * `creteholidayhome.com/accommodation/thalasses-villas/` is a page about
 * Thalasses Villas written by the company that manages the rentals. Its
 * photographs were admitted in Phase 1; its words were not. They carry facts
 * that exist nowhere on thalasses.com — a pool alarm, a playground, a vegetable
 * garden, a week's notice for pool heating — and they independently state every
 * figure in the owner's locked capacity table, exactly (see
 * `content/CHH-RECONCILIATION.md`, 5 corroborated, 0 in conflict).
 *
 * That corroboration is why this is worth surfacing at all. It is NOT why it is
 * safe to state as fact: a third party's marketing page agreeing with the owner
 * about bedroom counts does not make it authoritative about a pool alarm.
 *
 * So every line that reaches a page from here is **marked**, using the same
 * `Draft` note the thin experience pages use. That is this project's existing
 * convention for recovered-but-unconfirmed content — shown with a visible mark
 * rather than hidden — and hiding it would be the worse error: the owner cannot
 * confirm what he cannot see, and it is genuinely good material about his own
 * property that has been sitting in a scrape since Phase 0.
 *
 * Nothing here is merged into `content/villas/*.json`. The owner's registry
 * stays the registry. Regenerate with `node scripts/extract-chh.mjs`.
 */

interface ChhFacts {
  source: string;
  ownerConfirmed: boolean;
  prose: Record<string, string>;
  policies: Record<string, string>;
}

const FACTS = chhFacts as unknown as ChhFacts;

export const CHH_SOURCE = FACTS.source;

/**
 * What the on-page marker SAYS, as distinct from what the data records.
 *
 * The marker first printed the full source URL, and
 * `creteholidayhome.com/accommodation/thalasses-villas/` is a single unbreakable
 * token — at 12px with +0.22em tracking it runs to 445px and scrolled the whole
 * estate page sideways on a phone. The overflow guard caught it within a minute.
 *
 * A provenance mark has to be readable, not exhaustive. The full URL, the
 * captured filename and the reconciliation all live in `content/chh-facts.json`
 * and `content/CHH-RECONCILIATION.md`, which is where someone checking
 * provenance would actually look.
 */
export const CHH_MARK = "recovered from the manager's own listing";

/**
 * The recovered specifics, in the site's own voice.
 *
 * The partner's page is written in listing-platform English ("Would you like to
 * enjoy your breakfast on your own private beach? In our villas this can become
 * true!"). Restating a fact in this site's register is editing, not inventing —
 * but the FACT must survive the edit unchanged, so each line carries the exact
 * phrase it came from and `scripts/extract-chh.mjs` is what proves that phrase
 * is really in the capture. A line whose `source` phrase disappears from the
 * scrape stops being renderable rather than quietly becoming ours.
 */
/*
 * THREE OF THESE TURNED OUT NOT TO BE THE PARTNER'S AT ALL.
 *
 * The pool alarm, the pool heating terms and the convertible twin beds were
 * attributed here for about an hour, marked "recovered from the manager's own
 * listing" — and every one of them is in the OWNER'S registry, in
 * `content/villas/*.json` under `policies` and `amenityFacts`, and has been
 * since Phase 0. The registry states more than the partner does: 35€ a day,
 * which is the only price anywhere in this inventory.
 *
 * They were never CHH facts. They were owner facts nobody had rendered, and
 * `scripts/registry-coverage.mjs` is what found them — by asking which registry
 * values appear in the text of the page that owns them. They now print as fact
 * on the villa pages, unmarked, because that is what they are (T-285).
 *
 * Marking an owner's own fact as a third party's is a smaller error than
 * inventing one, and it is the same kind: a claim about provenance made without
 * checking. What is left below is genuinely CHH-only.
 */
const RECOVERED: { key: string; label: string; note: string }[] = [
  {
    key: "playground",
    label: "A playground",
    note: "Organised and enclosed, for children.",
  },
  {
    key: "vegetableGarden",
    label: "A vegetable garden",
    note: "Picked with the gardener, and eaten the same day.",
  },
  {
    key: "sunbeds",
    label: "Sunbeds at the water",
    note: "Private, on the edge of the beach.",
  },
  {
    key: "receptionDesk",
    label: "A reception desk",
    note: "Open daily.",
  },
];

/**
 * Only lines whose source phrase is still present in the extracted capture.
 *
 * This is the guard against the failure this project keeps meeting: a fact that
 * outlives its evidence. If the extractor stops finding "pool alarm system for
 * child safety", this stops printing it — rather than continuing to state it on
 * the authority of a comment.
 */
export function recoveredFromPartner() {
  return RECOVERED.filter((r) => Boolean(FACTS.prose[r.key])).map((r) => ({
    ...r,
    source: FACTS.prose[r.key]!,
  }));
}

/** Standard guest-policy facts the site states nowhere else. */
export function partnerPolicies() {
  const out: { label: string; value: string }[] = [];
  if (FACTS.policies.smoking) out.push({ label: "Smoking", value: FACTS.policies.smoking });
  if (FACTS.policies.languagesSpoken) {
    out.push({ label: "Languages spoken", value: FACTS.policies.languagesSpoken });
  }
  return out;
}
