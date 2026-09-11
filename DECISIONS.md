# Decisions

Owner decisions, recorded the moment they are relayed. See `CONVENTIONS.md` §19.

This file exists because of a defect, not a process improvement: the owner
approved a design direction and that approval lived only in a chat window, so a
later session read the register of a brief and built against a different
aesthetic. **A decision that is not in the repository is not a decision anyone
after you can act on.**

---

## D-001 · Direction F, "The Cretan Hotel" — the production direction

**Decided:** September 2026, by the owner.
**Relayed to the repository:** this entry.
**Status:** in force.

Direction F is the production direction. The dense, warm, credible luxury-hotel
homepage: Book Now pinned top-right, a slow hero, villa cards carrying facts and
two buttons, experiences grouped by kind, weddings, distances, a press wall, and
a real hotel footer with the operating licence in it.

**Wanted on top:** more cinematic, and unusual-but-luxurious motion, per
`MOTION-DIRECTIVE.md`.

### What that settles

- `/` is Direction F. The chooser and the four other candidate looks are removed
  from the build; their record and their findings stay in `SESSION-REPORT.md`
  and `RE-SKIN-DIRECTIVE.md`.
- Aesthetic work is measured against **this** direction. Aman-register
  minimalism, oversized display type and type-led layouts were the earlier
  candidates and are no longer the target, however strongly a later brief's
  language leans that way.
- Motion is calibrated by the weirdness dial in `MOTION-DIRECTIVE.md`:
  conversion-critical and dense zones stay at Level 1, narrative zones at Level
  2, and no more than three Level-3 set-pieces on the page.

### What it does not settle

- The Greek locale. `/el` remains unpublished; the corpus is `copyStatus:
  "draft"` with 371 questions awaiting the owner's native review.
- The fourteen quarantined non-property frames (see
  `content/flagged-quarantine.json`). Still owner-pending.
- The section quote, the press wall beyond its single verified mention, and the
  group's sister properties. All still labelled slots.

---

## D-002 · Tier B-Experiences stock — sourced, placed, and awaiting the owner's veto

**Decided:** September 2026, by the owner: free-licence sources only
(Pexels/Unsplash class), zero budget, nothing purchased, nothing generated;
source the fourteen unphotographed experiences under the Tier B-Experiences
rule; reject rather than stretch; the owner reviews every placed frame on the
live page and may veto any.
**Relayed to the repository:** this entry, `content/image-sources.md` §7,
`content/experience-stock.json`.
**Status:** placed — **owner review pending.**

### What was placed (nine)

boat-trip · scuba-diving · jet-ski-safari · hiking · jeep-safari ·
exclusive-tour · massage · therapist · wine-production. Each with file, source
URL, photographer, licence wording and retrieval date in
`content/experience-stock.json`, and each rendered only on its experience card,
the register, and its own detail page — never in a Tier A context, which
`tests/flagged.spec.ts` asserts.

### What was not (five), and why

running · bike-tours · quad-safari · personal-trainer · private-helipad. The
reasons are printed on the cards themselves and tabled in
`content/image-sources.md` §7. Two of these — quad-safari and personal-trainer —
were accepted by their verifiers and overruled on sight in this session; the
overruling is recorded there with the reason, so the owner can disagree with it.

### What the owner decides next

- **Veto any of the nine** on the live page. Removing one is a single line in
  `content/experience-stock.json` and a regenerate; the card returns to its
  typographic treatment.
- **The twelve inherited `pending-licence` frames** stay out until a licence is
  produced. They were found still rendering as detail-page heroes and are now
  off every surface.

### Still open, not guessed

Whether the chauffeur and the helipad should have their own experience cards
rather than being woven into the Discover Crete prose. They are placed, not
carded, until the owner says otherwise. **Answered by D-003.** The nine placed
frames are confirmed as a default by D-004; the owner's veto stands.

---

## Reviewer defaults, D-003 to D-010

**Decided:** 2026-09-11, by the reviewer the owner delegated these calls to.
**Relayed to the repository:** these entries, before any of them was applied
(`CONVENTIONS.md` §19).
**Status:** in force as defaults, each with an **owner veto window** that closes
at launch-day step 0 in `LAUNCH.md` (setting `SITE_URL`), or on **2026-09-25**,
whichever comes first. A veto is recorded here as a new entry that reverses the
default, never as a silent edit to this one. After the window closes the owner
can still change any of them; the window exists so that nothing below goes live
on the real domain without his having had the chance to stop it.

### D-003 · Chauffeur and Private Helipad become their own experience cards

They were placed in the Discover Crete prose rather than carded. Now they are
cards, grouped as **Arrival** — which is what both are — and the prose line in
Discover Crete stays, because it is true and it is where a guest reads about
getting there.

- The chauffeur keeps its entrance-sign frame, the property's own.
- The helipad's frame is searched for in the graded library and the Crete
  Holiday Home set, aerials first: **a real photograph that shows the pad.** If
  none exists, the card stays typographic and prints why.

### D-004 · The nine licensed stock frames stand

The nine placed under D-002 stay unless the owner vetoes one. Veto is one line
in `content/experience-stock.json` and a regenerate.

### D-005 · The Discover Crete quote is a traditional mantinada, from a published collection

A traditional, anonymous Cretan mantinada **taken from a published folk
collection**, attributed on the page as *Παραδοσιακή κρητική μαντινάδα*, with
its source — collection, editor, year, page and number — recorded in the report
and in `content/`. **Nothing composed.** If no documented source can be cited,
the slot stays labelled.

### D-006 · Footer sister properties

Ink Hotels, Domisignature, Crete Holiday Home. **Names and links only** — no
logo is re-hosted until the owner supplies the files. The unconfirmed group name
is not printed.

### D-007 · The press wall collapses to one credential line

"As featured in — Condé Nast Traveler, 2024", set in the site's own type. The
wall layout returns when the owner supplies more mentions.

### D-008 · The hero sub-line is the working line

Approved as it stands; the pending marker comes off the page.

### D-009 · Pool heating is never priced on the page

The page says it is available on request at an extra charge. **The registry
keeps the 35 € figure for the owner**; no page prints it.

### D-010 · No superlative on the helipad

"With private helipad" — never "the only seafront villas with private
helipad" — everywhere, until the owner verifies the scope of that claim. The
registry keeps the original wording as the Phase 0 record.

### NOT delegated — these stay gated and labelled

Villa Pueblo's capacity details (T-212), the eight beach distances, the Greek
corpus, the three quarantined frames, and the hero MP4. None of the defaults
above touches them.
