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

---

## Build defaults, tranche twelve (D-011 onward)

**Decided:** 2026-09-13, by the building session, carrying out the owner's
backlog queue. **These are not owner decisions.** They are the calls the queue
left open, logged so that nobody later mistakes a default for a ruling. Any of
them is reversed by a new entry here; each is a one-line change where it lives.

### D-011 · The owner material pipeline (`scripts/ingest-drive.mjs`)

- **Drive IDs never enter the repository.** An "anyone with the link" ID is a
  key to the owner's folder and this repository is public; the intake ledger
  (`content/owner-intake.json`) keeps a 12-character one-way hash.
- **Every published photograph loses its metadata, GPS included.** No colour,
  crop or retouch: rotated upright, long edge capped at 3000 px, JPEG q86.
- **Owner photographs are Tier A by provenance but ungraded on arrival.** They
  land in `content/grading-queue.json` and on no page until the standard grading
  pass has run.
- **Video originals stay local** (`content/media/originals/`, gitignored, as is
  `content/inbox/`). Variants are a poster first, then an 8-second silent
  1920-wide MP4 and WebM each under 2.5 MB — the first 8 seconds, labelled a
  **draft cut**, because choosing the in and out points is editorial.
- **No ffmpeg is installed on this machine, and none is installed by the
  pipeline.** Without it the video is recorded `needs-transcode` with the exact
  commands; installing a binary is the owner's or maintainer's call.
- Limits: three folder levels, 500 items, 2 GB a file.

### D-012 · The performance pass

Measured on the phone profile (4× CPU, Slow 4G) with `scripts/perf-attribute.mjs`;
the numbers are in `SESSION-REPORT.md` tranche twelve.

- **The root `loading.tsx` is removed.** Its Suspense boundary made every
  prerendered page arrive as a hidden segment that React's inline script then
  moved into place, so the whole page was styled and laid out in one task of
  250–340 ms, on every route. The same markup and CSS with scripts stripped had
  no long task at all. Client navigations keep the outgoing page until the next
  one is ready, under the existing pelagos wipe, so there was never a white
  flash for the loading state to prevent.
- **The clause in the root 404 tree loads through `next/dynamic`.** That covers
  the 404's own clause and the one in the `SiteFooter` it renders, because the
  App Router ships the root 404's client components on every route. It keeps
  framer-motion off the Direction F homepage, which never uses it.
- **Lenis is imported only where it runs** (fine pointer, no reduced motion), so
  a phone never downloads it.
- **HotelMotion's idle setup yields a rendering frame where a stage measures
  right after the one before it wrote styles.** That falls between hiding the
  reveals and `ScrollTrigger.batch`, before the ground triggers, and between
  the hero's two scrubbed pieces. The effects, their timings and the motion
  budget are unchanged. On the homepage the setup went from five or six long
  tasks to two (traced).
- **Tried and rejected:** `content-visibility: auto` on the homepage's
  below-fold sections, which moved the cost into a 218 ms ScrollTrigger refresh
  and put trigger positions at risk; and neutralising `text-wrap`, which had no
  measurable effect. **Considered and rejected:** refreshing ScrollTrigger
  before arming `.ho-motion`, because that class changes layout (sticky and
  relative seams), so the triggers would measure positions without the seams.
  **Built and rejected:** Suspense boundaries around the homepage's below-fold
  sections, meant to let React hydrate them in interruptible slices. React
  outlined them into four hidden segments swapped in by script, the same
  pattern the `loading.tsx` removal got rid of. `tests/perf-structure.spec.ts`'s
  check caught it before it was measured, and it was reverted.
- **The TBT gate is taken from a trace.** `scripts/hotel-cwv.mjs` summed the
  page's own `longtask` observer, which does not report the parser's rendering
  before first paint. Removing the Suspense boundary moved the whole-page
  layout into exactly that blind spot, and the observer's figure fell far more
  than the real blocking did. The gate now reports Lighthouse's TBT (after
  first contentful paint) from a Chrome trace, with load-blocking and the old
  observer figure printed beside it. That makes it stricter, not looser: a
  change can no longer pass by moving work out of the gate's sight.
- **Not taken:** `font-display: optional`. It would remove the font-swap
  relayout by showing fallback type to a first-time guest on a slow connection.
  That is a typography decision, not a build one.

### D-013 · The security audit

- **CSP ships with `'unsafe-inline'` for scripts and styles. A per-request nonce
  is deferred**, because a nonce makes every page dynamic: no CDN-cached HTML,
  and a slower first byte on the connection the site is tuned for. Everything
  else in the policy is `'self'` or `'none'`.
- **HSTS runs two years with `includeSubDomains` and no `preload`.** Preload
  binds every subdomain of the owner's domain to HTTPS for years and is hard to
  undo, so it is the owner's call on launch day.
- **The site cannot be framed** (`X-Frame-Options: DENY`, `frame-ancestors
  'none'`). If a partner ever needs to embed a page, that is the line to change.
- **Unknown `?enquiry=` subjects are dropped, never echoed.**
- **Dependency fixes are patch or minor only.**

### D-014 · The 3D estate map experiment (branch `feat/estate-3d` only)

**Not on main.** This entry travels with the branch. It reaches main only if the
owner says yes to the preview, and then it is re-dated as an owner decision.

- **A diagram, never a picture.** It uses three.js primitives only: planes,
  boxes and one disc, in the site's own colour tokens, with no textures and no
  photographs. Blender is not installed on this machine, so there is no
  modelled geometry, and none was substituted.
- **Geometry only from evidence.** Positions are read off the estate's own
  aerial photographs (`/images/_chh/Ritual-drone.webp`,
  `/images/_chh/thalasses-all-2.webp`) and the villa copy's "front row" and
  "rear row". The drawing is schematic, in unitless coordinates, and nothing
  about it is claimed as a survey.
- **Not drawn, and said so on the page.** Villa Pueblo is "set apart from the
  other four", and no aerial on record shows which plot is its own.
- **Marked for the owner:** which house in each row is which. The order follows
  the 2D map's, and that map is placed over a photograph of one villa, not over
  a plan. The page carries `[TODO: owner to confirm which house in each row is which]`.
- **Who gets it:** WebGL present, reduced motion off, and the section within
  600 px of the viewport. Everyone else keeps the 2D map and never downloads
  three.js. A failed or lost context falls back to 2D.
- **No layout shift by construction.** The diagram fills the 2D frame's exact
  box. On a phone the note stays inside that box as a short band over the sea,
  rather than being added below it.
