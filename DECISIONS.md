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

### D-014 · The 3D estate map experiment (written on `feat/estate-3d`; merged under D-021)

**Merged into main under the owner's approval, D-021.** This entry was written on the branch, before that approval. D-021 is the owner decision. This entry records what the experiment built, and where D-021 or a later entry says otherwise, the later entry wins.

- **A diagram, never a picture.** It uses three.js primitives only: planes, boxes and one disc, in the site's own colour tokens, with no textures and no photographs. Blender is not installed on this machine, so there is no modelled geometry, and none was substituted.
- **Geometry only from evidence.** On the branch, positions were typed into `estate-plan.ts` from two aerial frames (`/images/_chh/Ritual-drone.webp`, `/images/_chh/thalasses-all-2.webp`) and the villa copy's front and rear rows. The drawing was schematic, in unitless coordinates, and nothing about it was claimed as a survey. Under D-021 the geometry lives in `content/estate-plan.json`, where every element carries its own provenance and the basis for each value.
- **Not drawn, and said so on the page.** Villa Pueblo: no aerial on record shows which plot is its own.
- **Correction on merge: "set apart from the other four".** The branch entry gave that phrase as the reason Pueblo is not drawn, but it has no source text.
  - It is redesign copy: `src/lib/villa-page.ts:155`, `src/lib/meta-copy.ts:68`, and "Apart from the four" at `src/app/home-data.ts:208`.
  - The Phase 0 source says only "Unwind in utter seclusion" (`content/villas/pueblo.json:20`).
  - It is withdrawn as evidence about Pueblo's position.
  - The copy is still on those pages. Whether it stays is an owner question; the Greek reconciliation already marks its translation for the owner (`content/el/RECONCILIATION.md:534`).
- **Marked for the owner:** which house in each row is which. The branch's order followed the 2D map's, and that map is placed over a photograph of one villa, not over a plan.
- **Who got it, on the branch:** a reader with WebGL, reduced motion off, and the section within 600 px of the viewport. Everyone else kept the 2D map and never downloaded three.js. A failed or lost context fell back to 2D. Under D-021 the provenance gate decides first, on the server, before any of those checks runs.
- **No layout shift by construction.** The diagram fills the 2D frame's exact box. On a phone the note stays inside that box as a short band over the sea, rather than being added below it.

### D-015 · D-011 corrected: what the owner material pipeline actually does

**Decided:** 2026-09-14, by the building session, closing the audit of ask 1 and the review that followed. **Not an owner decision.** D-011 was logged as a build default and described behaviour the code did not have. This entry replaces it where the two disagree.

**What D-011 got wrong**

- *"On no page until the standard grading pass has run."* Photographs were written to `public/images/_owner/<date>/` at ingest, and their `content/image-provenance.json` entry was added at the same time. That path was not gitignored, so committing the repository would have deployed them ungraded. Nothing read `content/grading-queue.json`.
- *"The exact commands."* The commands recorded for a `needs-transcode` clip used a fixed 2300k and dropped `-row-mt`/`-deadline` from the WebM encode. `heroVariants()` computes 2411k.
- *"Each under 2.5 MB."* No variant has ever been produced, and the recorded fallback carried no size check.
- **Not logged at all.**
  - Items left `needs-conversion`, `needs-transcode` or `failed` were marked `duplicate` on every re-run, because their sha256 was in the intake ledger and a clip's own master sat in the scanned `content/media/`.
  - The installed sharp cannot decode HEIC.
  - An M4A, an audio-only 3GP, an `.mka` or an audio-only AVI was admitted as video.
  - A listing that parsed to zero entries exited 0.
  - Mobile folder links were refused, and `resourcekey` was dropped.
- The spec claimed its mock Drive was *"taken from Google's live responses"*. Nothing had been captured.

**What is now true**

- **Ungraded photographs are never deployable.**
  - They are stripped of metadata and staged in `content/owner-staging/<date>/`, which is gitignored.
  - Each is queued with its staged path, publish path, staged and original hashes, `owner/drive/<date>` provenance and Tier A.
  - Ingest writes nothing to `public/` and nothing to the provenance ledger.
- **The queue produces a sheet the grading pass reads.**
  - `npm run grading:sheet -- <new empty folder> --queue` builds the sheet from `pending-grade` entries. It uses the file names and ids the grade-photo-library workflow derives for itself: `g0001.jpg` to `g<total>.jpg`, with no gaps.
  - It prints the workflow arguments (`sheet`, `total`, `batchSize`). Its `index.json` carries `mode: "queue"`, which is what routes the merge.
  - The id format is checked in the spec against the workflow's id function, copied into the test. **The workflow itself has not yet been run over a queue sheet.** Its grader prompt still describes the frames as the raw library.
  - A queue sheet is written once. The tool refuses a non-empty folder, and a library sheet refuses to overwrite a queue index. Rebuilding in place would give an id to a different photograph than the one graded under it.
- **Grades land once.**
  - `npm run grading:merge` writes each grade onto its entry, but only while the entry is still `pending-grade`. A published or held entry is reported and left alone.
  - **A or B with no flag** is the test `scripts/experience-imagery.mjs` already applies. A frame that passes it is copied to `public/images/_owner/<date>/` and declared with the note "owner/drive/<date> — owner-supplied property material, Tier A by provenance; graded X in the standard pass". The copy happens only after two checks: the sheet's recorded hash matches the queue entry's, and the staged file's bytes match the hash recorded at ingest. These checks prove the bytes are unchanged and the entry was not staged again after the sheet was built. They do not prove a grader looked at the file.
  - A C or a flagged frame is `held`.
  - **Nothing takes a published photograph down automatically.** That is a hand edit.
  - `content/photo-grades.json` is not touched, so owner frames are not yet visible to the automatic photo pickers.
- **A video must carry a video track:**
  - an ISO `hdlr` of type `vide` (a moov box with a 32-bit, 64-bit or to-end-of-file size) or a Matroska TrackType of 1, found in the first or last 8 MB of the file. A moov box that starts in neither window is still missed; or
  - an AVI `strh` of type `vids`, found in the first 8 MB only (the tail is not scanned for AVI).
  - Files whose major brand is an audio one (`M4A `, `M4B `, `M4P `, `F4A `, `F4B `) are refused outright.
- **Unfinished items are retried.**
  - From the intake ledger only `ingested` and `variants-ready` count as taken, and `content/media/originals/` no longer counts as library.
  - For photographs the queue decides. An entry counts once it is graded, or while its staged file is on disk. A pending photograph whose staged file is gone (staging is gitignored) is staged again, and its entry is replaced.
- **One plan, run and recorded.**
  - `heroVariantPlan()` is what `heroVariants()` spawns and what a `needs-transcode` clip records.
  - `node scripts/ingest-drive.mjs --transcode-pending` runs it once ffmpeg exists, whether on PATH or via `FFMPEG_PATH`. The 2.5 MB budget is enforced on each loop.
  - **Still no variant has been cut by a real ffmpeg.**
- **Empty or partial listings are loud.**
  - A `/drive/folders/` listing that yields nothing exits 1 unless `--allow-empty` is passed.
  - A listing where fewer entries parse than the page shows exits 1 in every case.
  - An `/open?id=` or `/uc?id=` link whose listing is refused or shows no entry is tried as a single file.
- **Mobile links and resource keys are accepted and forwarded to Drive, and recorded nowhere.** This is verified only against a mock Drive.
- **HEIC stays `needs-conversion`,** with instructions: send JPEG (iPhone: Most Compatible) or convert, then re-run the same link.
- **Evidence.**
  - Drive's folder listing format was captured live on 2026-09-14 from gdown's public test folder, and the parser reads all 16 entries on that page. That capture has no resource key.
  - The download and its large-file confirmation page are still modelled.
  - The pipeline has not yet been run against a real owner link.

### D-016 · The performance pass, second half: islands, the cursor, fonts, images, prerendering, and a TBT budget

An addendum to D-012. The evidence is in `qa/perf/ISLANDS-tranche12.md`, `FONTS-tranche12.md`, `IMAGES-tranche12.md` and `ROUTES-tranche12.md`. All of it was checked on the rebuilt candidate: the full QA suite passed 553 / 0, and the before/after figures of record are in `qa/perf/AB-tranche12-final.md` (eleven templates, against `7ff32a9`) and `AB-tranche12-followup.md` (this batch alone, against `56cb859`).

- **The island count was not reduced, and the inventory says why.**
  - There are 34 `"use client"` modules at `56cb859`, 25 of them imported on some route and 9 imported nowhere. With the cursor wrapper there are 35, 26 of them imported on some route.
  - Every route hydrates the root layout's four boundaries: `SmoothScroll`, `LazyCustomCursor`, `RouteTransition`, and `SiteNav` with `LanguageSwitcher` nested.
  - Every route also ships, without rendering, the client references of the root 404 tree (`LazyClause`) and of `error.tsx`. They render only on a 404 or an error. For `error.tsx`, the build's client-reference manifest lists two chunks, the shell chunk `2rtltvcbcs1l6.js` and `2wk6p2tl_v13d.js`; a grep of the built chunks finds its code only in the second (1,034 B).
  - What would cut islands on the Direction D pages is motion design: `Reveal`, `Clause`, `Inventory` and `Ledger` moved onto CSS plus one observer. On the F homepage it is a layout change: stop mounting the hidden `SiteNav`. Each needs the motion budget, a visual comparison and its own A/B, so none was attempted.
- **The contextual cursor is imported only where it runs, in the source.**
  - `LazyCustomCursor` runs the cursor's three checks: fine pointer, motion allowed, and not `[data-look="hotel"]`. Only then does it call `import()` inside its effect, and it renders the cursor once the module has arrived.
  - A rejected import is caught and dropped. A failed chunk therefore leaves the page without a cursor, not on Next's default error screen: the root layout's children sit outside `app/error.tsx`, and there is no `global-error.tsx`. `React.lazy`, which rethrows a rejected import during render, was not used for that reason.
  - The cursor's code used to sit in the shell chunk every route loads: `2rtltvcbcs1l6.js`, 15,542 B, shared with the nav and the route wipe.
  - Checked on the rebuilt candidate. The build moves it into a chunk of its own, `2-2o1ua-qpmde.js` at 1,328 B. That chunk is the only built script holding its code, and neither prerendered D page (`villa-thoi`, `the-estate`) names it as an initial script. Desktop behaviour on the D pages is unchanged: `tests/villa.spec.ts:241` passed in the full QA run on that build (553 passed / 0 failed). The one known difference on the success path is a chunk request before the cursor mounts. After that build, only comments in the two cursor files changed.
  - The old once-per-document decision is kept: land on `/`, click into a villa, and there is no cursor until a reload. That is recorded, not fixed.
- **"Defer every non-critical script" is partly closed: only the cursor moved.** No per-route inventory of initial chunks, each marked critical or not, was produced; the inventory is of modules. Left eager, with the reasons:
  - **framer-motion on the D pages** (`3p7yrr41uomgy.js`). It is an initial script on villa-thoi and the-estate through `Reveal`, `Clause`, `Inventory` and `Ledger`. It is also one on experiences, for a reason not established: that route's only import path to it is `LazyClause`'s `next/dynamic` import. Taking it off means rebuilding those four animations on CSS. That is a motion-design change needing the motion budget, a visual comparison, the phase specs and its own A/B, in files outside this pass.
  - **`Magnetic`** on the villa, estate and weddings pages. Phones evaluate it to reach its early return, but it wraps server-rendered children, so it cannot simply mount later, and the delegated rewrite touches three pages.
  - **`LiquidCards` on `/`**: the same early-return shape as the cursor, but outside this change's files, and `/` is the reference route of the A/B.
  - **`SiteNav` on `/`**: needs the layout split.
  - **`Lightbox`**: could mount at first open. The gallery had no baseline when this pass was planned; it has one now (`AB-tranche12-final.md`), and the change was not attempted.
  - **Critical, and staying eager:** `RouteTransition` (it moves focus on every navigation), `ViewTransitionTarget` and `BookingLedger`.
- **Fonts: no loading change.**
  - Every route preloads Inter, Marcellus and Marcellus SC, 77,316 B in all. On `/`, Marcellus paints nothing (it sits only inside the hidden nav), and Marcellus SC paints only the off-screen skip link.
  - Literata's latin and latin-ext files are emitted as two overlapping `@font-face` rules with no `unicode-range`. The latin-ext file holds 2 of the 95 basic Latin characters, and a phone-profile network log on the final build confirms that `/` requests both files (199,748 B). `/en/villas/villa-thoi` requests neither. On `/`, Marcellus is preloaded and fetched, but it never appears among the loaded faces in `document.fonts`.
  - The audit's preload recommendations wait for a serial A/B. `font-display` stays a typography decision (D-012).
- **Images: formats hold; no hero or run frame is oversized, but two bounded images are.**
  - 15 of 15 sampled `/_next/image` responses were AVIF, each at exactly the width requested.
  - **The-estate map frame.** At 390 px it is a 350×262.5 box whose 3:2 source needs 394 px, and it gets 640w: 1.62× over. `sizes="100vw"` resolves to 390, past the 360 and 384 candidates, and the next candidate is 640. At 1440 px it is 1.10× over (1440w for a 1310 px frame, from the 1280→1440 step).
  - **Villa-thoi's other-villa cards.** At 390 px they are two-column 4:5 frames of about 166×208 that need 369 or 304 px, and they get 640w: 1.73× and 2.11× over. `sizes` says 100vw for a two-column grid, and past 384 the next candidate is 640. At 1440 px they are under. These picks are computed from the markup and CSS; only the map frame's 640w response was fetched.
  - **Phones, the other way.** The tall cover-cropped heroes and run frames are drawn from images 1.54–2.16× too small at 1×.
  - **Both Direction D LCP heroes are `loading="lazy"`.** They are preloaded only because the run's first frame is the same photograph.
  - None of these was changed. Each changes bytes or the preload set, in files outside this pass.
- **Prerendering: every page but `/en/contact` is already prerendered, and `cacheComponents` is deferred.**
  - The build: nine static pages, 26 SSG pages from the villa and experience templates, and `/en/contact` dynamic because it reads `searchParams`.
  - In 16.3.5, partial prerendering *is* `cacheComponents`; `experimental.ppr` is gone. It would split only `/en/contact`, where a build-time shell cannot carry the per-request nonce proposed for that page.
  - It would also require dropping `dynamicParams = false`, moving `new Date()` out of the sitemap's prerender, and accepting Activity-based navigation. That keeps hidden pages in the DOM, under the route wipe's `#main` focus hand-off.
  - The measured cost is client hydration, which the flag does not touch. Revisit if a page gains per-request data.
- **TBT is a budget now.**
  - `scripts/hotel-cwv.mjs` fails when phone TBT (the trace figure, after first contentful paint) is over 200 ms.
  - This is stricter only: TBT, load-blocking and the harness exclusion are computed exactly as before.
  - Load-blocking stays printed and unbudgeted, because budgeting it would set a new target instead of enforcing the one set.
  - On the final build every template's phone median is under it, at 53–76 ms. The 3D branch was first measured at 221–301 ms, from a worktree missing the gitignored photographs. Re-measured with them, its runs are 137–149 ms, so they pass too (`qa/perf/ESTATE3D-cost.md` on `feat/estate-3d`). Before, nothing in the budget referred to TBT.
- **What the before/after shows** (`qa/perf/AB-tranche12-final.md`, `7ff32a9` against the final candidate):
  - **Phone TBT after first contentful paint did not measurably move.**
    - It was under the 200 ms target on every template before the pass, with medians of 54–73 ms, and it still is, at 53–76 ms.
    - The changes run from −9 to +5 ms, inside the spread between runs.
  - **Load-blocking**, which counts the rendering before first paint as well, fell on ten of eleven phone templates. The largest falls were on the Direction D pages:
    - villa-thoi 185 → 138 ms;
    - weddings 155 → 108 ms;
    - the-estate 214 → 174 ms;
    - terms 187 → 159 ms.
  - **Phone FCP medians are 12–68 ms later after the pass on ten of eleven templates.** Three runs cannot separate that from noise, but the direction is consistent. It is recorded, not explained.
  - **Desktop TBT medians** are 0 ms on every template, before and after.
  - **The follow-up batch alone** (`AB-tranche12-followup.md`, against `56cb859`): phone TBT changes run from −5 to +8 ms on the four routes, inside the spread.
- **Found by the eleven-template run, on both builds, and not fixed** (`qa/perf/CHECKS-tranche12.md`):
  - **`/en/gallery` fails CLS on the phone.**
    - The worst session window is 0.2014, as web-vitals defines CLS. hotel-cwv's summed figure is 0.20–0.22.
    - The shifting nodes are the gallery images inside `ImageReveal`'s clip-path wipe (`src/components/motion/Reveal.tsx`). The wipe starts closed in the server HTML and opens after hydration. The frames themselves reserve their 4:3 box.
    - Under reduced motion, where `ImageReveal` fades instead, CLS is 0.
    - Desktop is 0.0827, under the budget.
  - **`/en/careers` fails LCP on the phone**, at 2.9–3.0 s in five of six runs.
    - The LCP element is the body text, which `Reveal` serves at `opacity:0`. It paints only after hydration and its in-view trigger: 3,100 ms with motion, 2,312 ms under reduced motion.
    - First paint is near 1,000 ms.
  - **Why neither was fixed.** Both causes sit in the shared motion components, and ask 2 set its target "without touching the motion budget". They are recorded for a decision.
- **Measurement defaults, logged as defaults.**
  - **Routes.** The before/after covers eleven route templates:
    - `/`;
    - one villa (`villa-thoi`);
    - `/en/the-estate`;
    - `/en/experiences`;
    - one experience detail (`boat-trip`);
    - `/en/weddings`, `/en/gallery`, `/en/location`, `/en/contact`, `/en/careers` and `/en/terms`.

    The follow-up batch alone was measured on the first four.
  - **Runs.** Medians of three interleaved runs. The phone profile is 4× CPU and Slow 4G at 390×844, DPR 1.
  - **That is a sample.** The other four villa pages, the other experience details and the 404 were not measured; they share their templates' code.

### D-017 · A nonce policy on the contact page; the static policy everywhere else

- **When `/en/contact` is loaded as a document, `src/proxy.ts` sends it a per-request nonce CSP.** Its script-src is `'self' 'nonce-…' 'strict-dynamic'`, with no `'unsafe-inline'`.
  - The page reads `searchParams`, so it is already rendered on every request. It is not in the prerender manifest and is served `private, no-store`, so the nonce costs it nothing.
  - The mechanism is the one Next 16.3.5 documents: the policy is set on the request, and Next stamps the nonce on its own scripts.
- **Where the nonce policy applies.** A CSP belongs to a document, so the nonce policy is in force on a direct visit, a reload, the legacy-URL 301, and the plain-`<a>` links (the homepage's enquiry buttons and the error page).
  - The site's `next/link` CTAs into the contact page are client-side navigations: Weddings, each experience, each villa's "Enquire", and the 404 page's link. After one of those, the contact page runs under the static policy of the page the guest came from.
  - Closing that would take a nonce on the prerendered routes (deferred below) or full page loads for those CTAs. Neither is done.
- **Every other directive matches the static policy word for word,** and `tests/security.spec.ts` compares the two. style-src keeps `'unsafe-inline'`, because no nonce can cover `style` attributes.
- **Each path gets its CSP from exactly one place, by construction.**
  - `next.config.ts` sends the static CSP on every path the proxy's matcher does not admit.
  - The proxy sends a policy on every path it does admit: the nonce policy on every request whose `nextUrl.pathname` is `/en/contact` (the document, and its RSC and `_next/data` requests, which Next normalises to that pathname before the proxy runs), and the static policy on every other spelling it admits. All of those are 404 pages.
  - The config's exclusion and the proxy's matcher are one regex fragment, character for character:
    - the contact path in any letter case, spelled with character classes, because Next matches header sources case-insensitively and proxy matchers case-sensitively;
    - any `.…` or `/…` tail, which absorbs the `.json`, `.rsc` and segment-prefetch suffixes Next appends;
    - any `_next/data/<id>/` prefix.
  - **Replaces an earlier carve-out.** It replaces the first carve-out, written earlier the same day. That one gave `/en/contact.html`, `/en/contact.txt`, `/EN/contact` and similar spellings no policy, and gave `/_next/data/<id>/en/contact.json` two.
  - **One overlap remains, from Next.** Next also matches the proxy against the percent-decoded path, so `/en/%63ontact` matches both sources, and both send the static policy. That spelling is a 404 locally. On the Vercel production deployment it returns 500, still with exactly one static policy. That 500 is recorded as open and has not been investigated.
- **Why a script as well as the spec.** Under `next start` the proxy's header replaces the config's (differently-cased keys, Node's `setHeader`). A local one-policy assertion therefore cannot detect stacking.
  - `node scripts/check-headers.mjs --compile` checks the partition with Next's own route compilers. It passed on 25,533 spellings. It models Next's routing and makes no request.
  - `node scripts/check-headers.mjs <url>` counts raw header lines. It is the check for the Vercel deployment. It passed against the served candidate build, and then on the production deployment of `3087312` on 2026-09-14 (`qa/security/production-headers-2026-09-14.txt`): exactly one policy on every response, and a fresh nonce on the contact page's second request.
- **The proxy runs on every request to these paths, prefetches included,** unlike the docs' example. A request it skipped would otherwise go out with no policy.
- **The prerendered routes keep `'unsafe-inline'`.** A nonce there means giving up the prerendered HTML. The cost has not been measured, so this stays a deferral, not a finding.
  - `experimental.sri` is not enabled. In this Next version it hashes external chunks only (read from the source, not tried in a build), and the inline flight scripts are not hashed.
- **`frame-src` stays `'none'`.** There are no embeds, and the policy is not loosened for a host nobody uses.
  - A YouTube embed needs `www.youtube-nocookie.com` in the markup and in `frame-src` in both policy files, on the same day.
  - The spec's no-frame guard then becomes a host check.

### D-018 · Skills

The queue asked for `frontend-design` and any UI/UX skill from
`github.com/anthropics/skills`, and nothing else. The screening record, with one
row for each of the repository's 19 skills at `main` `34040c9`, is
`qa/skills/SCREENING-tranche12.md`. "Any UI/UX skill" was read generously
(anything about designing, styling, building or testing an interface or a
visual artefact), then filtered by whether it applies to this site. The file
keeps the two tests in separate columns.

- **One skill is installed: `frontend-design`**, at project scope in
  `.claude/skills/frontend-design/`, with its Apache-2.0 `LICENSE.txt`. Both
  files are byte-identical to upstream: local `git hash-object` equals the
  GitHub blob SHA (`a5333457…`, `f433b1a5…`). `git ls-files .claude` lists
  only these two files, so no community pack or other skill is tracked in the
  repository.
- **Five were read in full and declined.**
  - `webapp-testing` is a UI testing skill that could run against :3005. It
    has you write stand-alone Python Playwright scripts (SKILL.md:9, 53-63).
    Its `with_server.py` helper is used only when no server is running; for a
    running server it goes straight to navigate, screenshot and act
    (SKILL.md:24-33). This project's QA is already a TypeScript
    `@playwright/test` harness (`playwright.config.ts`, 34 specs, `npm run qa`
    sharded), so the decline is a duplication call, not a safety ban. Server
    lifecycle is not the difference: the harness also reuses a running :3005
    and starts `npm run start` otherwise (`playwright.config.ts:50-55`).
  - `web-artifacts-builder` is a React/Tailwind UI skill, but it builds
    single-file claude.ai artifacts, not this Next.js site.
  - `theme-factory` applies preset and generated palettes. Direction F's
    palette and type are the owner's (D-001).
  - `canvas-design` produces poster and art output, and generated imagery sits
    badly beside the real-photography rule.
  - `brand-guidelines` is Anthropic's own brand.
- **The other thirteen were screened by description and a web-UI keyword grep,
  and not installed:** academy-guide, algorithmic-art, claude-api,
  discernment-nudge, doc-coauthoring, docx, internal-comms, mcp-builder, pdf,
  pptx, skill-creator, slack-gif-creator, xlsx. None was read in full. Three
  of them could reasonably be called visual design: algorithmic-art
  (interactive p5.js artwork), pptx (slide design guidance) and
  slack-gif-creator (animation). None of the thirteen applies to this site.
- **The skill does not reopen Direction F.** Its own rule is that the brief's
  words win where the brief pins a direction down, and D-001 is that brief. It
  applies to new surfaces and as a critique lens. Where F sits close to a look
  the skill calls a generated default (the cream, serif and warm-accent palette;
  the all-caps eyebrow), that is recorded for the owner in
  `DESIGN-REFERENCES.md` and not changed.
- **Open for the owner:** whether to install `theme-factory` or `webapp-testing`
  anyway. Either is a new entry here plus one copied folder from upstream.

### D-019 · The design benchmark (`DESIGN-REFERENCES.md`)

**Decided:** 2026-09-13, corrected 2026-09-14 (checked against the served build, then again after an independent review), by the building session carrying out the owner's queue. **These are not owner decisions.** They are defaults the ask left open, and a later entry reverses any of them.

- **Which property stands for a brand, and how each was read.**
  - Aman is **Amanzoe**, the Greek villa example.
  - Six Senses is **Kaplankaya**, on the Aegean. It was read in a browser only, because the site refuses scripted requests.
  - Casa di Legna is **the Porto-Vecchio villa at casadilegna.com**, the one with the Awwwards mention; the name matches more than one property.
  - Locomotive's "showcase" is **editorialnew.com**, read beside Locomotive's own case study.
  - Primland is **explore.ownprimland.com**. Only its loader and intro rendered, so the entry says its map and seasons details come from the agency case study.
  - Method: for every site, the homepage, one room or villa page, and the booking entry. No booking was started, no form submitted, no consent accepted. The file discloses the exceptions: Passalacqua's engine was identified but not rendered, Cap Rocat's booking modal was inspected in markup only, and Editorial New has no rooms.
  - The visit record is the research run's own transcript, cited by the tranche-twelve verification. It is not in git.
- **"Mapped to our sections" means the homepage section together with the inner pages that carry its detail.**
  - Villas: `/en/villas/*` and `/en/the-estate`
  - Experiences: `/en/experiences`
  - Weddings: `/en/weddings`
  - Discover Crete: `/en/location`
  - Footer: every page's footer and `/en/contact`

  A point counts if the homepage or any of these pages serves it, whichever section that page maps to. `/en/gallery` is not a mapped page and counts for nothing. The first version mapped to the homepage only, which is how five features already on inner pages were recorded as gaps.
- **"Present" means served, not written.** Every point is checked against the running build and marked missing, partly present (where), present (where), not scored or not applicable. The record is `qa/references/VERIFY-tranche12.md`.
  - The fix-pass counts (F1–F12) are taken on all five villa pages and are case-insensitive. The first-check route table is case-sensitive and says so. That first check fetched only Villa Thoi and matched `Emu` case-sensitively, so it missed the served "EMU".
  - *Not scored* is for looks, such as Casa di Legna's single colour or Editorial New's serif, because D-001 decides the look.
  - An *Avoid* line is marked "same here" when this site shares the fault and "avoided" when it does not.
- **Ranking.**
  - Rows are ranked on the remaining work, not on the idea: first what it would do for direct bookings, then whether it can be built from what the project holds, then effort.
  - Owner-dependent rows stay in the list rather than being dropped.
  - Partly built rows rank on what is left. That moved Enquire and phone-at-booking to 2, the inclusions to 3, getting here to 4, design provenance to 5 and the jump bar to 6.
  - All six top rows are partly built, so the order of rows 4–6 is a judgement on the first criterion.
  - A first draft put provenance at 4 as the only unbuilt row of the six. That rested on the case-sensitive miss and was withdrawn.
- **Dribbble is links only**, nine shots under booking bar, cards and footer. Nothing is fetched, copied or templated.
- **Not settled here:**
  - Drive times from the airports and ports for a getting-here block. No source states one; the only travel time in content is the South coast's "about 40 minutes by car". This waits on the owner.
  - The `01 → 07` beat skip on `/en/location` (`CoastLine.tsx:36`).
  - The Service/Arrival taxonomy split between `/en/experiences` and the homepage.
  - Whether `feat/estate-3d` replaces the 2D estate map. That is the owner's yes or no. **Answered by D-021.**

### D-020 · Addendum to D-014: what the 3D estate map leaves out, and what it costs (written on `feat/estate-3d`; merged under D-021)

**Merged into main with D-014, under the owner's approval in D-021.** This entry records defaults the branch took without saying so, as they stood at `1179011`. The provenance gate (D-021) and the build defaults logged after it change several of them. Where a later entry says otherwise, the later entry wins.

- **The diagram does not carry every hotspot.** The 2D map has nine: five villas, the private beach, the pool line, the long table and the vegetable garden. The diagram labels six of them: four villas, the beach and, since this addendum, the pool line, as a label with no link, the same as its 2D hotspot. **The long table and the vegetable garden are not placed**, because no aerial on record establishes where they are, and a label would invent a position. Villa Pueblo stays undrawn (D-014). The diagram's note says so in both lengths: "The list below carries every place" on desktop, and "Villa Pueblo not drawn; all listed" in the shorter phone length. The numbered list beneath the map is unchanged and carries all nine. On the 3D path, `tests/estate-3d.spec.ts` checks that the two unplaced names are absent from the drawing and present in the list, and that the list has one item per 2D hotspot, in order and by name.
- **No card detail survives in the diagram.** The 2D hotspot cards carry a line, a ledger (Beds/Sleeps per villa, 50 m to the beach, Pools 4, Seats 18) and, where the hotspot has one, a link. The 3D labels are bare names, and the villa and helipad labels are links. The list shows name and line but no ledger. A reader on the 3D path does not see those ledgers in the map section.
- **A link the 2D map never had.** The helipad label links to `/en/experiences/private-helipad`. There was no helipad hotspot in 2D.
- **Labels are hidden below 768 px** (`patterns.css`, `@media (max-width: 767px)`). On a phone the diagram has no labels, and the list is the whole map. The 2D markers are hidden at that width too, so no function is lost against main. It is still a default, and it is logged here. D-021 asks for tap-to-focus, which reopens this.
- **Render defaults:** an orthographic camera with the sea at the top of the frame. Render on demand, with no animation loop (one frame after build, one per resize). Device pixel ratio capped at 1.5. `powerPreference: "low-power"`. Everything disposed and the context released on unmount.
- **The pool line hangs below its anchor.** The anchor is the lane-side end of the column of drawn pools nearest the lane, derived from the plan rather than typed in, and chosen geometrically rather than by villa. Three placements were projected against the other labels at 768–1920 px: standing above the pools' centre, standing above each pool column's midpoint, and hanging below that column's end. Only the last cleared every other label at every width, by an estimated 15–29 px (from glyph widths). No other anchor was tried. Screenshots of the rebuilt branch at 1440, 1024, 768 and 390 px then showed no label overlapping another.
- **What it costs, and it stays under the phone TBT target.**
  - **Bundle.** three.js 0.186.0 loads as one lazy chunk, 546,208 B raw (533 KiB) and 132 KiB gzip on the final branch build. Initial JavaScript was 224 kB gzip on both builds when measured at `7fa6fb7`, and has not been measured again since.
  - **Figures of record.** Interleaved against main's final candidate on `/en/the-estate`, three runs each, trace gate:
    - **phone TBT after FCP 85 → 139 ms** (runs 85/97/78 → 139/137/149);
    - load-blocking 204 → 273 ms;
    - desktop TBT 0 → 27 ms;
    - CLS 0/0.

    All three branch phone runs are under ask 2's 200 ms target.
  - **Superseded first measurement.** It gave 123 → 286 ms, with every branch run over the target. The branch's worktree was missing the gitignored photographs, and why that raised the figures was not established.
  - **Where the time goes.** A phone trace of each build shows two long tasks that only the branch has, both while the reader scrolls towards the map: 65 ms evaluating the three.js chunk, then 141 ms inside it. That second task covers the renderer, the shaders and the first frame, which a minified profile cannot separate. **INP was not measured on this route.** The harness drove no interaction that Event Timing records there: the page has no `.ho-dots` or `.ho-card` to click or hover, and a wheel scroll is not an Event Timing type. The "0 ms worst interaction" is the observer's starting value, not a reading. Evidence: `qa/perf/ESTATE3D-cost.md` and `qa/perf/AB-tranche12-estate3d-final.md`.
- **No site plan exists on record.** Every coordinate in `estate-plan.ts` was read off the aerial photographs (D-014), and nothing is surveyed. A site plan, if one exists, joins the owner questions beside which house is which and where Villa Pueblo's plot is. D-021 records that the owner will send one.
- **Correction on merge.** The branch described its axes and camera in compass terms ("x west → east", "from the south-west"). No aerial on record carries a bearing, so those words had no basis. The plan's frame is now defined by the shore and the lane (`content/estate-plan.json`).

---

## D-021 · The 3D estate map is approved, behind a provenance gate — and the tranche-twelve owner questions answered

**Decided:** 2026-09-14, by the owner, after the preview of `feat/estate-3d` at `1179011`.
**Relayed to the repository:** this entry, before any of the work it authorises (`CONVENTIONS.md` §19).
**Status:** in force. The work it authorises is tranche thirteen.

### What it settles

- **The 3D estate map is approved, and it is merged into main behind a provenance gate.**
  - **One source of geometry.** `content/estate-plan.json` holds every element of the map, each with a position, an orientation, a footprint and a provenance field:
    - the villas: Thoi, Persi, Melia, Eeanthe and Pueblo;
    - the four pools;
    - the beach line, the long table, the vegetable garden, the helipad and the Rituals venue.
  - **Nothing in it is fact yet.** It is populated now from the aerial and drone frames, with provenance `inferred-from-aerials, unverified`, and nothing in it is labelled as fact.
  - **The public sees 3D only when provenance is `owner-verified`.** Until then the 2D hotspot map stays live, and a test asserts that the 3D canvas never mounts.
  - **The plan's arrival is a data edit.** In the owner's words, correcting positions "is a data edit, not a rebuild".
- **Map quality while the plan is awaited.**
  - **Register:** luxury. Soft daylight lighting, limestone and sea materials, and no gimmick.
  - **Hotspots:** they link to the villa pages, and each has a keyboard equivalent.
  - **Touch:** tap-to-focus, with no dependence on hover.
  - **Reduced motion:** either a static rendered frame or the 2D map.
  - **Loading:** a single lazy canvas, with a fallback where WebGL is unsupported.
  - **Measurement:** INP is measured on the estate page with the map active, so that the decision carries its full cost.
- **Plans come through the same door as the photographs.** The owner material pipeline (`scripts/ingest-drive.mjs`) accepts plan files (PDF, image, DWG) from the owner's Drive link into `content/plans/`, with provenance.
- **The two motion-caused budget failures are fixed** (tranche twelve, owner question 6):
  - `/en/gallery`: phone CLS at or under 0.1, via transform or clip-path with reserved dimensions;
  - `/en/careers`: the LCP text never starts at opacity 0.
- **Two open items are investigated, not left open.**
  - `/en/%63ontact` returning 500 is treated as a path-encoding class, with an encoding table across four routes.
  - The first-paint regression is attributed.
- **The stale `VERCEL_OIDC_TOKEN` in `.env.local` is deleted** (question 3).
- **HSTS preload is staged in `LAUNCH.md`** (question 2). Staged, not applied.
- **ffmpeg is installed, and the video path is verified on a dummy clip** (question 4). This overrides D-011's "none is installed": that entry left the install to the owner or maintainer, and the owner has now made that call.
- **Skills stay as ruled** (question 5). `theme-factory` and `webapp-testing` stay declined (D-018).

### What it does not settle

- **Which house is which, and where the unplaced elements stand.** This covers Villa Pueblo's plot and the positions of the long table, the vegetable garden and the Rituals venue, and it waits on the site plan. Until an element is marked `owner-verified`, its position in `content/estate-plan.json` is an inference, and no public page presents it as fact.
- **Where `owner-verified` comes from.** The status means the owner's own confirmation, relayed and recorded in this file. No session sets it from its own reading of a plan or a photograph.
- **The site plan and the owner's Google Drive link** are still to arrive. The link will carry the photographs, the helipad, the MP4 and the phone video. Everything that does not depend on them is built now.
- **Carried, and still open:** Villa Pueblo's capacity details (T-212), the eight beach distances, the Greek corpus and the three quarantined frames.

---

## Build defaults, tranche thirteen (D-022 onward)

**Decided:** 2026-09-14, by the building session, carrying out D-021. **These are not owner decisions.** They are the calls D-021 left open, logged so that nobody later mistakes a default for a ruling. Any of them is reversed by a new entry here.

### D-022 · The 3D estate map on main: the gate, the plan file, and the review build

- **What opens the gate.** D-021 says two things. The 3D map is public only when provenance is `owner-verified`. And until an element is verified, no public page presents its position as fact. Read together, the gate (`src/lib/estate-plan-gate.ts`) opens only when:
  - every element the diagram draws is `owner-verified`;
  - the four villas are among the drawn elements.

  Two consequences:
  - The context shapes the diagram draws count as elements: the lane, the compound outline, the helipad apron and the shore.
  - An element with no position is not drawn and does not block the gate. The note names it, and the numbered list carries it.
- **`owner-verified` names its entry.** An element marked `owner-verified` must carry `decision: "D-0NN"`, the entry that relayed the owner's confirmation. Otherwise the build fails, and `tests/estate-plan.spec.ts` checks that the entry exists.
- **"A data edit, not a rebuild" means no code change.** `/en/the-estate` is prerendered, so a change to `content/estate-plan.json` reaches the public page on the next deploy of main.
  - **Rendering per request was not chosen.** It would put the estate page in the class of per-request pages Vercel answers with 500 on percent-encoded spellings (SECURITY-NOTES.md §4.1). It would also give up the prerendered HTML that D-012 and D-016 protect.
- **The plan's frame.**
  - schematic units, not metres;
  - origin at the centre of the four-villa compound;
  - negative z is sea-ward, and negative x is the side where the lane and the helipad apron are;
  - bearing null.

  No aerial on record carries a bearing, so the branch's compass words are withdrawn (D-020, correction on merge).
- **Populated conservatively.**
  - **How it was built.** Two independent readings, one from the most nearly overhead frame (`758a144c`) and one from the oblique drone frames, then a conservative merge. Three refutation passes followed, on identity, layout and invention. Of the 57 claims they checked, 1 was refuted, 22 were overstated and 34 held. A final correction applied all 30 corrections and rejected none.
  - **Placed, all `inferred-from-aerials, unverified` (15):**
    - the compound's outer wall;
    - the four villas and their four pools;
    - the Rituals pool and venue terrace;
    - the shoreline;
    - the helipad, its apron and the lane.
  - **Not established (3), with position, orientation and footprint null:**
    - Villa Pueblo: leads only, no identity.
    - The long table: the frames show four separate tables under the shade sail, not one table for 18.
    - The vegetable garden: its only match fits an older state of the site.
  - **Assumed, not observed.** Which house in each row is which. The rows come from `content/villas/203.json:23`; the sides copy the 2D map's order. Which pool belongs to which villa follows from that assumption, and each element's `basis.identity` says so.
  - **Names come from the source, or say they have none.** "the complex"; "Private swimming pool"; "Shoreline (no site name on record)". "Private beach" is kept only as a stated caption, because those captions sit on a garden-path photograph and a sunbed sign.
  - **No metres.** The units are schematic. The "50 m to the beach" caption and a layout that puts the water 75–100 units from the villas are recorded as unreconciled, not resolved.
  - **Site states.** The frames show at least four states of the site, and every cross-state combination is stated in the file. The helipad's H comes from the frames where it is painted, placed against the compound wall. The apron outline is marked cross-state.
  - **The base frame.** `758a144c` is flagged "unsure" in `content/photo-grades.json`. Its layout passes every ordering check made against the frames whose identity is anchored.
  - **Kept in the file.** 34 recorded disagreements between readings stay with the plan.
- **The review build.**
  - **How it opens.** `ESTATE_3D_PREVIEW=1` opens the gate for a local build only: `npm run build:estate3d` into `.next-estate3d`, served on :3035.
  - **Never on Vercel.** The gate throws on any Vercel build, because preview deployments here are public by link (DEPLOY.md, deployment protection disabled).
  - **Labelled.** The diagram says "Preview — unverified" on its face.
  - **Two test runs.** `npm run qa` keeps testing the closed public build; `npm run qa:estate3d` tests the diagram.
- **What the public build proves.** `tests/estate-3d.spec.ts` sets up the conditions under which the 3D map would mount: WebGL2 present, motion allowed, the section in range. It then checks:
  - no 3D frame and no canvas;
  - nine 2D markers;
  - no three.js fetched;
  - no render plan in the HTML or the flight data.

  `scripts/check-estate-gate.mjs <origin>` checks the same on a deployment against the committed plan, so it needs no edit the day the plan is verified.
- **Changed on merge.**
  - The probe asks for WebGL2 only: three.js r163+ refuses WebGL1, which used to download the chunk and fall back anyway.
  - The helipad's H is basalt, not gold (DESIGN-PLAN.md bans gold, ochre and brass).
  - Main's motion-allowed 2D map specs (a11y, nav, patterns) are kept. The branch had moved them under reduced motion to avoid racing a 3D swap that a closed gate no longer makes.
  - The note is derived from the plan rather than typed for one state of it.
  - The shoreline is drawn but carries no label, because the site has no name for it on record. The numbered list beneath still carries "The private beach", as the 2D map does.
  - The pool-line label is anchored on the four villa pools by id. The plan also draws the Rituals pool, which is not one of them.
- **Found, not changed.** "Set apart from the other four" (D-014, correction on merge) stays on the Pueblo pages. It is an owner question, not a silent edit.

### D-023 · Site plans through the owner material pipeline (`scripts/ingest-drive.mjs --plans`)

Carries out D-021's "accept plan files (PDF, image, DWG) from the owner's Drive link into `content/plans/`, with provenance". A build default, not a ruling. Built in an isolated worktree, reviewed by two adversarial reviewers (correctness and security; test adequacy), and fixed:

- **A major defect, found by both reviewers.** A normal run described a binary DXF as "text" and gave no `--plans` hint. It compared the 18-character sentinel against a 16-byte slice.
- **A minor defect.** DWG codes were prefix-matched, so `AC1.29` passed as `AC1.2`.
- **Six gaps in the tests:**
  - the photo-queue half of the dedupe rule;
  - replacement of a ledger entry on a new date;
  - the `%%EOF` and NUL byte bounds;
  - the folder trail;
  - the stored-status rule;
  - `.gitignore` read as text, not as git applies it.

All are fixed. The ingest spec passes 8 of 8, typecheck and lint are clean, and 10 deliberate mutations of the plans logic were each caught by the tests.

- **Intent is declared, never guessed.** `node scripts/ingest-drive.mjs "<link>" --plans` treats every admitted file in that run as a plan and nothing in it as a photograph or a video.
  - Folder names, a manifest inside the Drive folder, and pixel heuristics were all rejected. A misrouted plan image would enter photo grading, and a graded A or B is published to `public/`.
  - A normal run still refuses a PDF, DWG or DXF, and the reason now says to re-run the link with `--plans`. A PDF is not auto-routed, because it could as easily be a contract.
- **Recognised by content, not by name.**
  - **PDF:** `%PDF-` plus a version, and `%%EOF` near the end, so a truncated file is refused.
  - **DWG:** a version code from an allowlist taken from the local file(1) magic database, compared on all six bytes. The five-character codes AC1.2 and AC1.3 are stored NUL-terminated, so `AC1.29` is refused. The file also needs a NUL within the first 128 bytes, so a text file that begins `AC1015` is refused. `AC1035` is excluded, because it is not established as a real format code.
  - **DXF:** the full 22-byte binary sentinel from Autodesk's DXF reference (not verified against a local sample), or ASCII group-code pairs opening a known section with no NUL anywhere.
  - **Images:** photograph signatures reused.
  - **Refused:** SVG, HTML, archives, text, audio and video are not plans.
  - DXF was admitted beyond D-021's list, because CAD plans commonly travel as DXF.
- **Stored byte-exact, off the public repository.**
  - Plans go to `content/plans/<date>/<sha12>-<name>.<ext>`, which is gitignored, and are never decoded, resized, stripped, graded or published.
  - A site plan shows boundaries, access and the helipad, and this repository is public. Only derived, owner-approved coordinates reach `content/estate-plan.json`.
  - The committed ledger, `content/plans/manifest.json`, records for each plan:
    - sha256, size, type and version;
    - the Drive filename and folder;
    - provenance `owner/drive/<date>`;
    - verification `unverified`.

    It records no Drive ID or resource key.
- **The ingest never writes `owner-verified`.** That value is the owner's ruling and the key the 3D map's gate turns on (D-021, D-022). Receiving a plan verifies nothing, and the spec asserts the string appears nowhere the ingest writes.
- **Dedupe.** A plan counts as taken when its ledger entry is stored and the file is still on disk. If the file is gone, as after a `git clean -X` or on another machine, it is stored again. The same bytes sent earlier as a photograph are not refused; the plan records `alsoPhotograph`.
- **Owner-facing privacy note.** The Drive filename is committed in the ledger. A personal name in a filename would therefore be published, and only a maintainer reviewing the manifest before commit can prevent that.
- **Not proven.** No real owner link has been run, and no real DWG, DXF or binary-DXF file was available: the fixtures are built to spec. CONTENT-GUIDE.md carries the owner's side.

### D-024 · The stale token, ffmpeg, and HSTS preload (carrying out D-021)

- **The stale `VERCEL_OIDC_TOKEN`.**
  - **What was removed.** `.env.local` held one key, that token, plus a Vercel CLI comment. It was never tracked, it was gitignored, and nothing in the project reads it.
  - **How.** The file was sent to the Windows Recycle Bin on 2026-09-14, not deleted permanently: permanent deletion is the owner's own action, and emptying the Recycle Bin is that action.
  - **Could it come back?** Running `vercel env pull` again would recreate it.
  - **Not established.** Whether the token is still valid, and whether it should also be revoked on Vercel's side.
- **ffmpeg installed.** This overrides D-011's "none is installed".
  - **The build.** gyan.dev full build 9.0.1, through winget's `Gyan.FFmpeg`, which is the Windows build ffmpeg.org links. It was installed per user. libx264 and libvpx-vp9 are present.
  - **How the pipeline finds it.** Through `FFMPEG_PATH` as an absolute path. winget created no command alias shim here, and a shell started earlier does not see the new PATH.
- **The video path, verified with real ffmpeg on synthetic clips only.** The report is `qa/media/FFMPEG-tranche13.md`, 19 of 19 checks.
  - **4K test pattern with audio, 12 s.**
    - Poster: 1920×1080.
    - MP4: H.264 High, yuv420p, 1920×1080, 8.0 s, no audio, faststart, 2,533,297 B.
    - WebM: VP9, 1920×1080, 8.0 s, no audio, 2,044,050 B.
  - **Missing ffmpeg.** The run exits 1 and changes nothing.
  - **The repository.** Untouched.
  - **Not observed.** That ffmpeg received exactly the planned arguments; the outputs were verified instead.
  - **Re-run after the plan-file change.** `--plans` (D-023) edits the same `main()` that `--transcode-pending` runs through, so the check was run again on it. With no other edits in the tree, it passed 19 of 19. An earlier re-run failed only its git-status check, because this session was editing `LAUNCH.md` and `DECISIONS.md` while it ran.
- **Found: VP9 cannot hold the budget on pathological input.** On full-strength temporal noise:
  - H.264 stayed under budget, at 2,379,225 B.
  - VP9 came out at 17,225,636 B, and the pipeline correctly recorded `transcode-failed`.
  - Constant bitrate with `-minrate` reached 11,985,922 B, and constrained quality with a bitrate cap stayed at 17 MB.

  So no single-pass setting fixes it, and the encoder settings were not changed. Whether an over-budget WebM should fall back to a lower resolution, or to MP4 only, is an editorial and design call, raised in the report.
- **HSTS preload is staged in `LAUNCH.md`, not applied.**
  - **Where.** An owner-pending bullet, a subsection under "After launch" placed after the Loggia sunset, and a Rollback sentence saying DNS cannot undo it.
  - **Nothing live changes.** The header stays `max-age=63072000; includeSubDomains`.
  - **Before it can be applied.** The owner's inventory of every hostname in the `thalasses.com` DNS zone, each serving HTTPS.
