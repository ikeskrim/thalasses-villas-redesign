# Session report

**Read this first. It is written at HEAD and updated as each task lands, so it
is the truthful position — not a plan, not a memory.**

# TRANCHE TWELVE — the backlog queue: owner material, performance, security, skills, references, and a 3D map on a branch

**Holding. The owner says yes or no to the 3D estate map on its preview:
https://thalasses-villas-redesign-git-feat-estate-3d-domisi.vercel.app (branch `feat/estate-3d`, not on main).** Seven asks, taken in
the owner's value order and pushed per task. An independent audit then found
that parts of that work were overstated or incomplete, and they were fixed,
re-verified and pushed again. Nothing below is claimed beyond what was run.

| # | Ask | First pass | After the audit |
|---|---|---|---|
| 1 | Owner material pipeline | `7ff32a9` | `7c253fe` — D-015 corrects D-011 |
| 2 | Performance pass | `ecdfb81`, `25e5b9f` (guard) | `5b3d106` — D-016 |
| 3 | Security audit | `9b8afca` | `3d26f78`, `ce62175` (production check) — D-017 |
| 4 | Skills | `af64e9f` | `8df0cd4` — D-018 |
| 5 | Benchmark & references | `56cb859` | `1ddcae0` — D-019 |
| 6 | 3D estate map | `7fa6fb7` on `feat/estate-3d` | `1179011` on `feat/estate-3d` — D-014, D-020 |
| 7 | This report | — | this commit |
| — | Provenance gate (found failing since tranche ten) | — | `3087312` |

## How this tranche was checked, and what the checking found

The first pass ended with every ask pushed and a report drafted. Before the
report was written, each ask was audited: one auditor per ask, requirement by
requirement, and a second agent trying to refute each gap the first one
claimed. It confirmed 52 gaps. Each area was then fixed in its own set of
files, reviewed adversarially, fixed again and re-reviewed. All builds, specs,
measurements and commits were run one at a time afterwards, against served
builds.

Four things the checking found are worth knowing on their own, because each
changed a number or a claim this tranche had already made:

- **The first performance result was wrong.** It said phone TBT on `/` fell
  from 295 to 104 ms. The gate summed the page's own long-task observer, which
  does not report the parser's rendering before first paint, and removing the
  root Suspense boundary moved the whole-page layout into exactly that blind
  spot. The gate now takes TBT from a Chrome trace, in Lighthouse's window after
  first contentful paint, and prints load-blocking and the old figure beside it.
  The superseded evidence is kept (`qa/perf/AB-tranche12.md`).
- **The corrected before/after was contaminated too.** Every baseline was served
  from a git worktree, and a worktree holds only tracked files. `public/images/_chh/*`
  and eight `_pool` files are gitignored, so the baselines were missing 159
  photographs (requests for them came back 400) while main had them. This was
  found when the 3D branch's full QA failed on exactly those images. It passed
  535 / 0 once they were copied in. Both earlier evidence files are marked
  superseded (`AB-tranche12-trace.md`, `AB-tranche12-estate3d.md`). Every
  figure below was measured after copying the files into every worktree and
  rebuilding.
- **The provenance gate had been failing since tranche ten.** Nine licensed
  stock frames placed in `c6c58ae` were never declared, so `npm run verify`
  exited 1. The same failure reproduces on an untouched checkout of `56cb859`.
  They are now declared by hand, with their licence records (`3087312`).
  `--adopt` was not used because it would have stamped them as the owner's own
  photographs.
- **A credential sits in an ignored file.** `.env.local` holds a
  `VERCEL_OIDC_TOKEN`, created on 2026-08-17, before this tranche. It is
  gitignored, has never been tracked, is absent from every client chunk, and is
  very likely expired. It is still a credential in the tree, which the policy
  rules out, so it is an owner question below. This session did not touch it.

## 1. Owner material — how to send it

**For the owner:** make a folder in Google Drive, set it to *Anyone with the
link*, and paste the link into the chat.

**For whoever maintains the site:** `node scripts/ingest-drive.mjs "<the link>"`
(add `--dry-run` to look first). The steps after it are in `CONTENT-GUIDE.md`.

What it does now:

- Photographs are stripped of metadata (GPS included) and staged in gitignored
  `content/owner-staging/`, then queued for the standard grading pass as Tier A
  `owner/drive/<date>`. `npm run grading:sheet -- <new folder> --queue` builds a
  sheet the grade-photo-library workflow can read. `npm run grading:merge`
  publishes only an A or B with no flag to `public/images/_owner/`, with its
  provenance entry. Nothing ungraded is ever deployable.
- A file counts as video only if it carries a video track, so audio in a video
  container is refused. Type is always decided by content, never by name.
- Duplicates are refused by sha256. Unfinished items are retried on the next
  run, not marked duplicate.
- Video waits for ffmpeg. The exact commands are recorded, and
  `--transcode-pending` runs them once ffmpeg exists: a poster first, then two
  loops, each under 2.5 MB.
- A link is taken only from its argument, never from a page or a file. No Drive
  ID or resource key is ever written to the repository.

**Not proven yet, and D-015 says so:**
- It has never run on a real owner link, because none exists. It was tested
  against a mock Drive built on a live capture of Drive's folder listing.
- The download confirmation page is still modelled.
- No real ffmpeg has cut a variant (none is installed here), and HEIC cannot be
  decoded on this machine.
- The grading workflow has not yet been run over a queue sheet.

## 2. Performance

**The target is met, and it already was before the pass.** Phone TBT (from a
Chrome trace, after first contentful paint) is under 200 ms on all eleven route
templates, before the pass and after it. The pass did not measurably move that
figure. What it moved is **load-blocking**: all the long-task time, before
first paint included.

Before (`7ff32a9`) against the final build. Medians of three interleaved runs,
phone profile (4× CPU, Slow 4G, 390×844):

| route | TBT after first paint | load-blocking | first paint | LCP | CLS |
|---|---|---|---|---|---|
| `/` | 72 → 76 ms | 201 → 193 ms | 1096 → 1160 ms | 1136 → 1176 ms | 0 |
| villa (`villa-thoi`) | 61 → 59 ms | **185 → 138 ms** | 1124 → 1108 ms | 1136 → 1108 ms | 0 |
| `/en/the-estate` | 73 → 73 ms | **214 → 174 ms** | 1140 → 1152 ms | 1156 → 1156 ms | 0 |
| `/en/experiences` | 55 → 60 ms | 113 → 95 ms | 988 → 1040 ms | 988 → 1040 ms | 0 |
| experience detail (`boat-trip`) | 64 → 62 ms | 67 → 62 ms | 976 → 1044 ms | 976 → 1044 ms | 0 |
| `/en/weddings` | 64 → 55 ms | **155 → 108 ms** | 1080 → 1124 ms | 1080 → 1124 ms | 0 |
| `/en/gallery` | 59 → 62 ms | 111 → 93 ms | 992 → 1036 ms | 992 → 1036 ms | **0.20 → 0.22** |
| `/en/location` | 54 → 53 ms | 69 → 78 ms | 964 → 1028 ms | 1792 → 1888 ms | 0 |
| `/en/contact` | 57 → 62 ms | 85 → 79 ms | 960 → 1012 ms | 960 → 1012 ms | 0 |
| `/en/careers` | 60 → 56 ms | 73 → 69 ms | 948 → 1000 ms | **2912 → 2984 ms** | 0 |
| `/en/terms` | 58 → 61 ms | 187 → 159 ms | 1072 → 1104 ms | 1072 → 1104 ms | 0 |

Desktop TBT medians are 0 ms on every template, before and after.

- **TBT:** changes run from −9 to +5 ms, inside the spread between runs.
- **Load-blocking** fell on ten of eleven templates, most on the Direction D
  pages (−40 to −47 ms). The changes behind it are in D-012, and their trace
  attribution is in `qa/perf/attribution-*.md`:
  - the root loading boundary and its hidden swap removed;
  - the 404 tree's client code loaded only on a 404;
  - Lenis imported only where it runs;
  - the homepage's motion setup split across frames.
- **First paint** is 12–68 ms later on ten of eleven templates. Three runs
  cannot separate that from noise, but the direction is consistent. It is
  recorded, not explained.
- **The follow-up batch on its own** (the lazy cursor and the contact-page
  nonce) changed phone TBT by −5 to +8 ms on four routes, which is noise. The
  cursor's code is now a 1,328-byte chunk. A request log shows it fetched
  only on a desktop with motion allowed, never on a phone or on `/`.
- **No gate was weakened; the gate got stricter.** TBT now comes from a trace
  instead of the page's own observer, which had been fooled. Phone TBT over
  200 ms now fails the gate, where before it was only printed.
  `qa/looks/HOTEL-CWV.md`, regenerated on `/`, meets every budget.

**Found by this run, present before the pass, and not fixed.** The eleven
templates had never all been measured before. Two fail a budget on both builds,
and both are caused by the shared scroll-reveal animations
(`qa/perf/CHECKS-tranche12.md`):

- **`/en/gallery`, phone CLS 0.20** (budget 0.1). The gallery images start
  clipped shut in the server HTML, and the wipe that opens them after hydration
  registers as layout shift. Under reduced motion, CLS is 0.
- **`/en/careers`, phone LCP 2.9–3.0 s** (budget 2.5 s). The body text is
  served invisible and fades in after hydration, at 3.1 s. Under reduced
  motion it is 2.3 s.

The ask ruled out touching the motion budget, so both wait for a decision
(owner questions).

**Not done, with reasons in D-016:**
- The number of client islands is unchanged.
- framer-motion still loads on the Direction D pages, because moving those
  animations to CSS is motion work.
- The font recommendations wait for their own A/B. The log confirmed that `/`
  downloads an 89,668-byte Literata file for nothing, and preloads Marcellus
  without using it.
- Two images are served oversized at 390 px.
- Partial prerendering is deferred: only `/en/contact` is dynamic, and a
  build-time shell cannot carry its per-request nonce.

## 3. Security

**Verified on production.** The Vercel deployment of `3087312` was checked
with `scripts/check-headers.mjs`, which counts raw CSP header lines per
response (`qa/security/production-headers-2026-09-14.txt`). Every response
carries exactly one policy:
- the nonce policy on `/en/contact`, with a fresh nonce on a second request,
  and on its query-string, `.rsc` and data-URL forms;
- the static policy on every other route and on every other spelling of the
  contact path, the segment-prefetch `.rsc` form included.

Production and local differ in two status codes, never in policy:
- `/en/contact.rsc` is 200 on Vercel and 404 locally.
- The percent-encoded spelling `/en/%63ontact` returns **500** on Vercel and
  404 locally. It still carries exactly one static policy, but a server error
  on an odd spelling of a real path is recorded as an open item. It was not
  investigated.

| Area | Before | Now |
|---|---|---|
| Response headers | none of the project's own | CSP, HSTS (2 years, subdomains, no preload), X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP — on every response |
| Script policy | — | `'unsafe-inline'` on the prerendered routes (deferred, cost unmeasured); a per-request nonce with `'strict-dynamic'` on `/en/contact`, which is rendered per request anyway |
| `npm audit` | 1 critical, 2 high | **0** (`qa/security/npm-audit-tranche12.*`); next 16.3.1 → 16.3.5, sharp 0.35.3 → 0.35.4, js-yaml 4.3.1 → 4.3.2, patch releases only |
| `?enquiry=` spoofing | any sentence printed on the contact page | allowlist of the site's own subjects |
| Enquiry data in URLs | GET on a pre-hydration or no-JS submit | POST, asserted with scripting off |
| Field limits / rate limit | none | caps from one shared source; a tested stub — the durable limit waits for a mail-provider route |
| Embeds, outbound links, PII in logs | — | no embeds (`frame-src 'none'`), every new-tab link `noopener noreferrer`, no personal data logged |
| Secrets | — | scan clean before every push (477 text files on main, 469 on the branch); one ignored `.env.local` credential, recorded above |

`tests/security.spec.ts` passes **20 / 20** on the served build. The "23/23"
reported earlier was this spec and the perf-structure spec counted together.

A CSP belongs to a document. A guest who reaches the contact page through one
of the site's own `next/link` buttons therefore keeps the static policy of the
page they came from. That is recorded in D-017 and not fixed.

## 4. Skills

Installed from `github.com/anthropics/skills` only, with each SKILL.md read in
full before enabling. No community packs. The screening record covers all 19
upstream skills (`qa/skills/SCREENING-tranche12.md`, D-018).

**Installed: `frontend-design`**, byte-identical to upstream. What it changes
about how I work here:
- A design plan (palette, type, layout, principles) is checked against the
  brief before any code, and revised wherever it reads as a default.
- A named list of generated-page tells is avoided wherever the brief leaves an
  axis free.
- **The brief wins where it pins a direction down.** Direction F (D-001) is
  exactly that, so the skill does not reopen F. Measured against its list,
  F's palette sits near the first look it names, and F uses an all-caps
  eyebrow. Both are recorded for the owner in `DESIGN-REFERENCES.md`, not
  changed.
- Built work is critiqued by looking at it.

**Read in full and declined:**
- `webapp-testing` — it has you write stand-alone Python Playwright scripts,
  duplicating this project's TypeScript harness. The reason first given, that
  its helper kills servers, misdescribed the skill and is withdrawn.
- `web-artifacts-builder` — claude.ai artifacts, not this site.
- `theme-factory` — D-001 decides the palette.
- `canvas-design` — generated art, beside a real-photography rule.
- `brand-guidelines` — Anthropic's own brand.

The other thirteen were screened by description and a recorded keyword grep,
none read in full; none applies here.

## 5. References

`DESIGN-REFERENCES.md` compares the ten named sites with our sections. Every
per-site point and ranked row was then checked against the served build: the
mapped routes, all five villa pages and the five factsheet PDFs
(`qa/references/VERIFY-tranche12.md`, D-019). The first version had compared
with the homepage alone, and five of its "gaps" were already on inner pages.
Of 44 points: 3 present, 24 partly present, 14 missing, 2 not scored (looks,
which D-001 decides), 1 not applicable.

The top of the ranked list needs nobody:
- Enquire, phone and email beside booking on the homepage;
- "what every stay includes";
- a getting-here block (minus drive times from the airports, which no source
  states);
- design provenance (the captions name EMU and Greek marble; the rest of the
  maker list is printed nowhere);
- an Experiences jump bar.

Found in passing and not fixed:
- `/en/location` prints beat 01, then 07.
- `/en/experiences` says "Service" where the homepage says "Arrival".

Dribbble is cited as links only.

## 6. 3D estate map — preview only

**Look at it here:** https://thalasses-villas-redesign-git-feat-estate-3d-domisi.vercel.app/en/the-estate, in a browser with WebGL,
reduced motion off. **Not on main.**

It is a diagram, not a picture. three.js primitives on one canvas, in the
site's own colours, show:
- the sea, the beach line and the lane;
- the helipad on its apron;
- the four villas in two rows of two, one pool each.

The villa labels link to the villa pages, and the helipad label links to its
experience page. A reader without WebGL, or with reduced motion on, gets the 2D
map exactly as on main and never downloads three.js. The diagram fills the 2D
frame's exact box, so nothing on the page moves when it appears. Blender is not
installed, so there is no modelled geometry.

What it leaves out, said on the page and in D-020:
- **Villa Pueblo** is not drawn: no aerial on record shows its plot.
- **The long table and the vegetable garden** are not placed: no aerial shows
  where they are. The list beneath carries all nine places.
- **Which house in each row is which** follows the 2D map's order, and is
  marked for the owner.
- The hotspot cards' ledgers (beds, sleeps, distances) are not in the diagram.
- There is no site plan on record: every coordinate comes from the aerials.

Verified on the branch build: its full QA suite passed 535 / 0 with WebKit
14 / 14, and its own spec 3 / 3. Screenshots at 1440, 1024, 768 and 390 px
show no label overlaps.

**The preview serves this build.** The link above is the branch's alias, and it
follows the branch's latest deployment. On 2026-09-14 it served `1179011`,
checked two ways:
- The three.js chunk it serves contains the shortened note that only that
  commit has.
- In a browser with WebGL and motion allowed, the diagram mounted inside the
  map's frame. It showed the villa, beach and pool-line labels, with the note
  beneath.

**Bundle cost.** three.js 0.186.0 loads as one lazy chunk:
- 546,208 bytes raw (533 KiB), 132 KiB gzip.
- It is fetched only when the map nears the screen, WebGL is available and
  reduced motion is off.
- The page's initial JavaScript grows by 289 bytes gzip, the gate code.
  That was measured at `7fa6fb7`.
- The chunk carries the whole library, not just the dozen classes the diagram
  uses.

**Cost on the page.** Interleaved against main's final build on
`/en/the-estate`, three runs each (`qa/perf/ESTATE3D-cost.md` on the branch):

| | main | branch |
|---|---|---|
| phone TBT after first paint | 85 ms (85/97/78) | **139 ms** (139/137/149) |
| phone load-blocking | 204 ms | 273 ms |
| desktop TBT | 0 ms | 27 ms |
| CLS | 0 | 0 |
| phone first paint / LCP | 1160 / 1164 ms | 1204 / 1204 ms |

- **Under the 200 ms phone target on every run.** The first measurement said
  286 ms, over the target. It came from a worktree missing 159 photographs and
  is superseded.
- **Where the added time goes.** Two tasks run while the reader scrolls towards
  the map:
  - 65 ms evaluating the three.js chunk;
  - 141 ms inside it, building the renderer, compiling shaders and drawing the
    first frame (a minified profile cannot separate the three).

  A tap during that moment would wait. INP on this page was not measured.
- **First step if the answer is yes:** import only the dozen three.js classes
  the diagram uses, then measure again the same way.

## Owner questions

1. **3D estate map: yes or no**, on the preview. If yes:
   - which house in each row is which;
   - where Villa Pueblo's plot is;
   - positions for the long table and the vegetable garden;
   - a site plan, if one exists.
2. **HSTS `preload`** on launch day (D-013).
3. **`.env.local` with a `VERCEL_OIDC_TOKEN`**: delete it, or say it is wanted.
4. **ffmpeg on the maintainer's machine**, so owner video gets its variants
   rather than recorded commands (D-011, D-015).
5. **`theme-factory` or `webapp-testing`**: install anyway? Declined by default (D-018).
6. **Two budget failures caused by the scroll-reveal animations:** the gallery's
   phone CLS, and the careers page's phone LCP. Fixing them means changing how
   reveals start on every page that uses them, which ask 2 ruled out. Change
   the motion, or accept them? (D-016)
7. Carried from earlier tranches and still open: Villa Pueblo's capacity details
   (T-212), the eight beach distances, the Greek corpus, the three quarantined
   frames, the hero MP4.

## Defects of mine this tranche, found and fixed

- A performance result read from a gate that could be fooled (above).
- Every before/after baseline missing 159 photographs (above). When I marked
  those files superseded, I also guessed which way the fault had pushed the
  numbers. On the 3D run the guess was wrong: the fault had inflated the cost
  (286 ms), not hidden it (139 ms re-measured). Both notes now say only that
  the direction was not established.
- The security spec's count reported as 23 when it was two specs.
- The first fix passes overclaimed in several places, caught by the reviews:
  - a grading queue the real pass could not read;
  - a lazy cursor import that could have crashed every page if its chunk failed;
  - design provenance marked missing on a case-sensitive count;
  - a skill decline reason that misread the skill.
- `25e5b9f` has an invisible byte-order mark at the start of its subject
  (PowerShell piping). It is cosmetic and already pushed. Removing it would
  mean rewriting published history, which needs the owner's consent.
- A Suspense change meant to slice hydration re-created the hidden-segment
  pattern. The structure check caught it before it was measured, and it was
  reverted.

## Evidence

- Performance: `qa/perf/AB-tranche12-final.md` (eleven templates), `AB-tranche12-followup.md`, `CHECKS-tranche12.md`, `ISLANDS-`, `FONTS-`, `IMAGES-` and `ROUTES-tranche12.md`, `qa/perf/attribution-*.md`, `qa/looks/HOTEL-CWV.md`; superseded and kept: `AB-tranche12.md`, `AB-tranche12-trace.md`
- Security: `SECURITY-NOTES.md` §4, `qa/security/`
- Owner pipeline: `tests/ingest-drive.spec.ts`, `tests/fixtures/drive/`
- Skills: `qa/skills/SCREENING-tranche12.md`
- References: `qa/references/VERIFY-tranche12.md`
- 3D map (branch): `qa/perf/ESTATE3D-cost.md`, `tests/estate-3d.spec.ts`,
  `qa/perf/AB-tranche12-estate3d-final.md` (superseded and kept: `AB-tranche12-estate3d.md`)
- Decisions: `DECISIONS.md` D-015 to D-019 on main, and D-014 and D-020 on
  `feat/estate-3d`

# TRANCHE ELEVEN — the delegated defaults, F+ Phase 3, and the launch dress rehearsal

**Holding. The owner reviews on the live URL.** Four commits, each pushed:
the defaults recorded before anything was applied (`a0922f6`), the defaults
applied (`15a45bd`), Phase 3 (`9134190`), and the rehearsal (`b33b1d1`).

## The eight defaults, D-003 to D-010

Each carries an owner veto window that closes at launch-day step 0 or on
**2026-09-25**, whichever is first. A veto is a new entry in `DECISIONS.md`.

- **D-003 — Chauffeur and Private Helipad are cards**, grouped *Arrival*. The
  chauffeur keeps the property's own entrance-sign frame. For the helipad, every
  frame in the graded library and the Crete Holiday Home set that shows the pad
  is graded C, because they read as site surveys. The seaward aerial of the pad,
  the villas and the sea together is used on that card only, with its grade and
  reason recorded. **This is the default most worth the owner's eye.**
- **D-004 — the nine licensed stock frames stand.**
- **D-005 — the mantinada is sourced, not composed.** It is distich 153 from
  Anton Jeannaraki, *Ἄσματα κρητικὰ μετὰ διστίχων καὶ παροιμιῶν / Kretas
  Volkslieder*, Leipzig, F. A. Brockhaus, 1876, page 277, in the book's own
  *Μαντινάδες* section:

  > Να 'χα τη θάλασσα κρασί και τα καράβια κούπα
  > Και τα βουνά χλωρόν τυρί και την αγάπ' απού 'χα.

  In the owner's reading, not on the page: *"If only I had the sea for wine and
  the ships for cups, the mountains for fresh cheese, and the love I had."* It
  was read off the page scan, not the OCR, which cannot be trusted with the
  second line. The imprint was confirmed on the title-page scan. It sits in
  Discover Crete, in Greek, attributed *Παραδοσιακή κρητική μαντινάδα*, with
  the full citation. Every field is in `content/mantinada.json`.
- **D-006 — sister properties:** Ink Hotels (`inkhotels.gr`), Domisignature
  (`domisignature.com`) and Crete Holiday Home (`creteholidayhome.com`). Names
  and links only; the unconfirmed group name is not printed.
- **D-007 — one credential line:** "As featured in — Condé Nast Traveler,
  2024". It is spelled *Traveler* because the owner's own badge carries the US
  masthead and links to cntraveler.com.
- **D-008 — the hero sub-line** has no pending marker.
- **D-009 — no price for pool heating on any page.** It had been printing on
  three routes. The page now uses the registry's own unpriced sentence, and the
  registry keeps the 35 € figure.
- **D-010 — "with private helipad"**, never "the only".

D-009 and D-010 are applied where content is read, and tested both ways: absent
from every rendered route, still present in the registry.

**Found while looking:** the desktop footer had been one narrow column ever
since its reveal was armed. The armed footer is a grid, and a grid item with
auto margins shrinks to its content. It shows four columns across now.

## F+ Phase 3

- **The colour ground.** A pane pinned inside `main` warms the page from ivory
  to sand across Experiences and Discover Crete by opacity alone. A test checks
  every text colour against every tenth of the blend at AA.
- **Two curtain seams**, done with CSS sticky and no animation. The hero's
  photograph holds while the villas rise over it, and Experiences holds its last
  screen while Weddings rises over it. The brief said "villas → weddings", but
  Experiences sits between them on this page, so the second seam is the join
  into Weddings.
- **The easing pass** puts every entrance on `power3.out`.

The legibility gate caught two real defects:

1. **Copy clipped at rest.** Holding the whole hero put its copy half under the
   rising sheet on a phone. Now only the photograph is curtained, and the copy
   and slider dots travel with the scroll.
2. **Dots inside the paragraph.** Removing the draft marker had left the
   paragraph's box ending on the slider dots. The copy now has clearance, and
   the gate itself was not changed.

| gate, lab, 3 runs | desktop | phone |
|---|---|---|
| LCP | 652–1456ms | 1156–1176ms |
| CLS | 0 | 0 |
| worst interaction | 32–48ms | 24–32ms |
| TBT | 53–106ms | 262–341ms |

- **Motion JS:** 68.2 kB gzip, against a budget of about 70.
- **Hero legibility:** 0 runs below AA; the worst is 6.60:1.
- **Suite:** 519 passed, 19 skipped, 0 failed.
- **Phone TBT**, the named watch item, is lower than tranche ten's 318–400ms.

## LAUNCH-READINESS

The rehearsal was run against the Vercel deployment of `9134190`, not
localhost, with `scripts/launch-rehearsal.mjs`. The report is
`qa/launch/LAUNCH-REHEARSAL.md`. **11 green, 5 amber, 0 red.**

### Green

- **Redirects:** 51 of 51 are permanent and each lands on a 200. The gaps file
  is empty, and the parity certificate reads Legacy URLs 51/51.
- **Link integrity:** 40 internal destinations, 0 broken, and no fragment that
  names nothing.
- **Structured data:** 6 JSON-LD blocks across 35 routes parse, declare
  schema.org, and agree with the registry.
- **Indexing:** `robots.txt` still disallows everything, by design.
- **The noindex flip, rehearsed locally:** built, served, and byte-for-byte
  identical to LAUNCH.md step 5. `robots.ts` was restored and nothing was
  committed.
- **`SITE_URL`:** a staging origin moves every canonical, the OG image, the
  sitemap and the robots Sitemap line. A trailing slash is normalised, and a
  path fails the build loudly. The deployment agrees on one origin throughout.
- **Booking links:** every engine link uses the real host, carries `lang=en`,
  and passes nothing but dates and party size.

### Amber — none blocks launch

- **The booking engine refuses scripts.** Its CDN answers 403 to every
  automated request, for this property and for another brand's on the same
  platform, while WebHotelier's own site answers 200. It is not worked around,
  and a human click is the check that counts. LAUNCH.md step 2 now says so.
- **The deployment announces its own origin**, which is correct until
  `SITE_URL` is set.
- **VacationRental markup** lacks `identifier`, 8 or more images, and occupancy
  inside `containsPlace`. Google restricts that rich result to Hotel Center
  partners anyway.
- **LodgingBusiness** has no `image`, `telephone` or `url`; all three are
  recommended, not required.
- **Three external links did not answer the crawler:** the two engine links
  (the scripted 403 above) and `inkhotels.gr`, which answered 200 to a direct
  request the same day.

### What stands between HEAD and domain day — owner only

Before the day:

1. **Veto or let stand D-003 to D-010** before the window closes. The helipad's
   C-grade aerial and the mantinada are the two to look at first.
2. **The terms page names Ink Hotel seven times** and carries a
   correction-pending notice. That notice must not be live at launch, and it is
   a legal call. Ink Hotels is now linked as a sister property, which may be the
   explanation — the owner should say which company is the booking party.
3. **The 12 uninstallable redirect rows** (7 fragments, 5 templates): accept
   the loss, which is the default, or ask for client-side routing (LAUNCH.md §2).
4. **Where `/en/jet-ski-safari-1.html` should land** (LAUNCH.md §1).
5. **Still gated and not delegated:** Villa Pueblo's details (T-212), the eight
   beach distances, the minimum stay, the Greek corpus (it blocks only `/el`),
   the three quarantined frames, and the hero MP4.

Launch day, in LAUNCH.md's order:

6. Set **`SITE_URL=https://thalasses.com`** in Vercel.
7. Point the domain and wait for the certificate.
8. Walk the site and **open a booking link by hand in a normal browser**; a
   script cannot do this.
9. Spot-check the 301s against the live domain.
10. Look for the operating licence in the footer with your own eyes.
11. Only then flip indexing — a developer change, rehearsed byte-for-byte.
12. Set up Search Console.

After launch: rotate the Maps key, add `RESEND_API_KEY` server-side for the
enquiry form, wait at least two weeks before the Loggia sunset, and decide on
analytics.

Open engineering items, none blocking: `og:url` is missing on `/` and the
estate, the LodgingBusiness recommended properties, and the phone TBT that
belongs to the framework.

## Evidence

Stills and scripted-scroll videos of every route at 1440 and 390 are in
`qa/walkthrough/` and `qa/video/`. Those folders are gitignored by the
project's own rule, so they are on this machine and not in the repository. The
rehearsal and gate outputs are `qa/launch/` and `qa/looks/`.

---

# TRANCHE TEN — nine licensed frames, a structural cascade guard, and F+ Phase 2

**Holding for the owner's review on the live URL.** Three things landed, each
its own commit, each pushed: the served-cascade guard (ratified), the sourced
stock under Tier B-Experiences, and Phase 2 of the motion directive. The owner
items named as open — the press list, the mantinada, the sister properties, and
whether the chauffeur and helipad get their own cards — are untouched and still
labelled on the page.

## The eight defects, confirmed closed at HEAD

Asserted against a running build of HEAD rather than read from the commit
message: the skip link and its `#main`; `hotel.css` inside `layer(components)`
in the SERVED sheet; a canonical of `/` and a description of its own; the nav
at `#villas`; all twenty-one experiences, eighteen by name and three placed
(chauffeur and helipad in Discover Crete, the wedding as its own section); the
hero rotating through selected frames only, `Ritual-drone.webp` gone; the
shader painting on `canvas.ho-liquid`; and the figure it paints on positioned.
Eight of eight.

## Stock: nine placed, five refused, and the reason on the card

Fourteen activities went to Pexels and Unsplash, each candidate then handed to
an independent verifier told to refute it against the seven conditions. Nine
survived and are placed: boat-trip, scuba-diving, jet-ski-safari, hiking,
jeep-safari, exclusive-tour, massage, therapist, wine-production. Every one is
Greek by its source page; three are location-tagged Crete. Each is logged with
file, source URL, photographer, licence wording and date in
`content/experience-stock.json` and tabled in `content/image-sources.md` §7.
Resized only — never toned, and `tests/flagged.spec.ts` measures that.

**Two verifier acceptances were overruled here, on sight.** Quad-safari was a
parked quad beside a whitewashed Cycladic cube on Mykonos — a Cretan reader
places it instantly, and it is not the mountain track the card describes.
Personal-trainer was a lit, recognisable profile on a public beachfront deck in
Israel, the only frame outside Greece. Bike-tours' verifier never ran (a
session limit); checked here, the Málaga road frame's riders are specks. With
running (logos or a face on every candidate) and the helipad (livery or a
registration on every candidate), five slots keep their typographic treatment,
and the reason is printed on the card in the labelled-slot register. The owner
may veto any of the nine on the live page; `DECISIONS.md` D-002 records that
review as pending.

**A gap the sourcing exposed.** The twelve inherited `pending-licence` frames
— which the ruling says do not return without paperwork — were still rendering
as the heroes of their experience detail pages. The ratchet allowed them because
they were logged; logged is not licensed. Every surface now resolves through
one function, `experienceFrame`, and the ratchet asserts a pending frame renders
nowhere, on every one of the twenty-one detail pages. The ratchet also gained
the structural half it lacked: a NEW stock file was in no grading pass, so the
old rule could not have seen an unlogged one. Membership of `public/images/
_stock/` is now the fact it holds the site to.

## Phase 2

**The weddings set-piece is a sticky deck, and the photography chose it.** The
Rituals library is one evening in order — gathered by the water in low sun, the
tables laid at golden hour, dinner under the festoon lights, then the dancing
at dusk — seven A-grades and some fifty Bs of one venue. A drag strip flattens
a sequence into a row; a deck stacks in time. CSS `position: sticky` does the
stacking with no script, so touch gets the set-piece without a gesture handler;
GSAP adds only the settle (scale 0.96, dim) on a fine pointer; under `reduce`
it is four photographs in a column. All four are the property's own.

**The villa morph** runs on the browser's own View Transitions API with the
hand-off Next does not provide done by hand: the card names its photograph,
starts the transition, and the villa page names its hero on mount and resolves
the commit. Focus still lands on `#main`; back returns to the card (asserted
within 120px); reduced motion is a 120ms cross-fade with no morph. One
delegated island over plain anchors, not a client Link per card.

**Discover Crete** carries the estate aerial with ≤8% parallax on a fine
pointer only, and the ten distances count up from the registry's own string —
the server prints the truth, the animation lands on it, and "The beach — 0 m"
stays 0 m because that is the fact.

## The gates, and what the measuring found

| | LCP | CLS | worst interaction | TBT | motion JS |
|---|---|---|---|---|---|
| desktop | 700–1500ms | 0 | 24–48ms | 51–125ms | 67.9 kB gzip |
| phone | 1200–1244ms | 0 | 32–40ms | **318–400ms** | (budget ~70) |

Lab, 4× CPU / Slow 4G on the phone profile, several runs; CrUX is unobtainable
until deployment. Hero legibility 6 runs, 0 below AA, worst 5.84:1. Suite: 498
passed, 19 skipped, 0 failed.

**Phone TBT, the named watch item, first rose to 433–462ms.** It was
attributed rather than accepted, with an A/B under the gate's own profile:
motion layer off, stock images blocked, deck images blocked. Every long task
was in the load phase; none during scroll or hover — the deck, the parallax and
the stock cost nothing. Three causes, three fixes: `next/link` prefetching all
five villa routes as the cards scrolled in (now on intent — hover or focus);
the GSAP setup as one 110ms task (now staged on idle with a yield between
stages); and ten client islands where one would do (one `Distances`, one
delegated `VillaMorph`). Result 318–400ms across runs, against 312–377ms in the
same session with the motion layer removed entirely — so the motion layer's
share is now within the lab's own noise. What remains is framework: a
~250–300ms hydration task, and a ~160ms task at 2.4s that a CPU profile
attributes to the 70 kB React/Next runtime finishing its Slow-4G download and
evaluating. Both predate this tranche and are the next thing to look at,
honestly named rather than absorbed.

**Two defects found by the measuring, not by the tests.** The Phase 1 motion
setup had been dying on a temporal-dead-zone ReferenceError before its final
refresh — `gsap.context(() => { ctx.add(…) })` references `ctx` inside the
constructor that assigns it — and no test listened for page errors; Phase 2's
code sat after the throw and never ran until a probe heard it. The suite now
fails on any uncaught error on `/`. And `/` had been running two Lenis
instances, the shell's and Phase 1's own, the fighting-loops stutter the handle's
comment names; the motion layer attaches to the shell's now.

## Evidence

`qa/walkthrough/home-1440-*.png`, `home-390-*.png`, and `qa/video/home-1440.webm`,
`home-390.webm` — with the eleven other routes alongside. `qa/looks/HOTEL-CWV.md`
and `LEGIBILITY.md` are the gate's own output.

## Background tasks that failed or stopped

Every "failed" background task this session was `npx next start -p 3005`: the
harness tears the server down when its shell ends, or a later shell reclaimed
the port. The one marked "stopped" was the same server across a session
boundary. None matters: every measurement in this report was taken against a
server confirmed answering 200 before the run, and the suites start their own.

---

# TRANCHE NINE — Direction F is production

**The chooser is gone. `/` is Direction F.** The owner approved it before this
session's work landed, and that approval lived only in a chat window — which is
the defect the first commit of this tranche fixes. `DECISIONS.md` D-001 records
it, `CONVENTIONS.md` §19 makes recording it the rule, and a session that finds
no recorded decision now ASKS instead of inferring one from a brief's register.

`/looks` and the four candidate directions are deleted from the build. Their
measurements and findings stay below, in tranches five to eight, which is where
a rejected candidate belongs.

**Everything below this line about "holding at `/looks` for the owner's pick" is
the record of a decision that has since been made.** It is left standing rather
than edited, because the reasoning that fed the decision is the useful part.

## This session's five features, remapped to F's register

| Feature | Verdict | Why |
|---|---|---|
| Lenis + Next routing sync | **keep** | Level 1, no visual claim of its own |
| Magnetic cursor hiding the OS pointer | **remove** | `MOTION-DIRECTIVE.md` §E names it. F is conventional hotel UX |
| WebGL shader on the three acts | **retune** | Moved to the six villa cards, §C's own home for it |
| Mega-footer with GSAP unveil | **retune** | Mechanic kept, set-piece dropped: §B puts the footer at Level 1 |
| EN/GR language switcher | **keep** | Still renders nothing until a second locale publishes |

The shader was measured after the move: one canvas, displacement under 1.6%
against §C's 6% ceiling, aligned to its figure to the pixel, a one-shot in-view
ripple on touch, and nothing compiled at all under `reduce`.

## What the verification found

The gates were run against `/`, not against the prototype, and turned up eight
defects on the production homepage and two in this session's own motion work.
The full list is in the commit message for `e6b32c4`; the ones worth naming here:

- **No skip link, and no `id="main"`.** Suppressing Direction D's chrome took
  the skip link with it. A keyboard reader had no way past the header.
- **`hotel.css` was outside every cascade layer** — imported from `layout.tsx`
  rather than the CSS entry. The fourth and fifth occurrence of the defect
  `globals.css`'s own header documents twice.
- **No canonical on `/`**, and its description duplicated `/en/terms`.
- **The nav pointed at `/#collection`**, which no element carries any more.
- **The chauffeur had been reorganised out of existence** — one of twenty-one
  experiences, behind a code comment claiming it was in Discover Crete.
- **The hero rotated through a B-grade frame**, against the curation ruling.

Two instruments were also reporting success without reaching their subject: the
a11y suite's `reveal()` measured the page height once, too early, and audited
600px of a 6,612px page; the ledger guard was pointed at a homepage that no
longer has a ledger and passed on finding nothing.

## Gates

Lab only, 4× CPU and Slow 4G on the phone profile. **The p75 field gate cannot
be met from this repository** — CrUX reports on real visitors and the site is not
deployed. A lab pass is necessary, not sufficient.

| | LCP | CLS | worst interaction | TBT |
|---|---|---|---|---|
| desktop | 640 ms | 0 | 24 ms | 10 ms |
| phone | 1,140 ms | 0 | 40 ms | 268 ms |

Motion JS **66.8 kB gzip** against the ~70 kB budget. Hero legibility 6 runs, 0
below AA, worst 5.84:1. Suite **475 passed, 19 skipped, 0 failed** — every skip
is a guard whose subject renders nowhere since the homepage changed, parked with
its reason and with a test that fails the day it comes back.

TBT of 268 ms on the phone profile is the figure that would threaten INP under a
real field measurement. It is inside the lab gate and it is the number to watch
first after deployment.

## Still open

- **Fourteen experiences need licensed Tier B stock**, with per-slug reasons in
  `content/experience-imagery.json`. Sourcing is the owner's call on licence and
  budget; nothing may be bought or invented from here.
- **The inner pages are still Direction D** while the homepage is F. Stated in
  `src/app/page.tsx`. Converting eleven pages was not in this instruction.
- `/el` unpublished, 371 owner questions. Fourteen quarantined frames still
  owner-pending.

---

# TRANCHE EIGHT — F+ motion, Phase 1

The F+ directive adds a three-tier "weirdness dial" to Direction F and puts the
build behind a Core Web Vitals blocker. **Phase 1 only is built** — its own
Recommendation 1 says not to start Phase 2 until Phase 1 passes, and that is the
right order.

Built: the hero scroll handoff (letterbox closing plus 8% parallax, scrubbed),
the manifesto's split-line mask reveal, quiet staggered reveals elsewhere, Lenis
wired to the GSAP ticker. **No WebGL, no sticky deck, no drag strip.**

## The gate failed first, and that is the point

| | before | after |
|---|---|---|
| LCP, phone (4× CPU, Slow 4G) | **17,576 ms** | **1,116 ms** |
| LCP, desktop | 3,588 ms | 612 ms |
| CLS | 0 | 0 |
| Worst driven interaction | 56 ms | 24 ms |

The cause was a decision I had made and written down: the prototypes used a
plain `<img>` so a throwaway page would not depend on the site's image pipeline.
The hero alone was 2.09 MB and the villa cards another 3.61 MB, unoptimised. The
rationale was about coupling; the measurement is about a guest on a Cretan
mobile connection. Direction F now uses `next/image` — which is what the real
build would use, so measuring without it was measuring the wrong page.

Not a synthetic falsification. The first honest run.

## Verified against the directive's constitution

| rule | result |
|---|---|
| Conversion is sacred | Book Now hit-tested clickable at 0%, 40%, 90% scroll |
| Transform and opacity only | letterbox `scaleY`, parallax `translate3d` — **CLS 0** |
| Works without JS | 24 cards render, none hidden, heading and Book Now present |
| Reduced motion is a path | **0 motion chunks requested** — GSAP and Lenis never download |
| Legibility inviolable | largest display 56px; 46 legibility runs, 0 below AA |
| Touch has no hover | card zoom gated behind `@media (hover: hover)` |
| Motion JS budget | ~118 KB raw ≈ 39 KB gzip, inside the 55–70 KB budget, imported after paint |

## What the gate cannot say

The directive asks for a pass **at p75 in the field via CrUX**. That is not
obtainable here and will not be until the site is deployed with real traffic.
Everything above is a **lab** measurement and says so in its own output — a pass
here is necessary, not sufficient. **TBT on the phone profile is 269 ms**, and
that is the number that would threaten INP in the field. It is the first thing to
watch when Phase 2 adds a WebGL canvas.

Suite: **502 passed, 1 skipped**. Shard 1 flaked once with a Next
`NoFallbackError` during image optimisation and passed on the two re-runs; noted
rather than smoothed over.

---

# TRANCHE SEVEN — the owner's ruling, and Direction F

Two things landed: the owner's imagery ruling became a rule in the repository,
and a sixth direction was built as a yes/no prototype.

**HOLDING AT `/looks` FOR THE OWNER'S ANSWER. No further look work.**

## 1. Tier B-Experiences — the ruling, committed

Until now it existed only in conversation. It is `content/image-sources.md` now,
beside the tiers it amends. Non-property representational imagery is permitted
**for experience cards only**: own frames first; otherwise properly licensed
stock; it must plausibly depict the activity as delivered in Crete or the
Mediterranean; no landmark from elsewhere; no third-party branding; one log line
per frame; never in a Tier A context; and **stock stays visually honest** — no
shared treatment that blurs a licensed frame into the property's own work.

**The ratchet changed shape with it.** The question is no longer "is this frame
stock" — stock is allowed in one place now — but "is this frame accounted for":

1. every non-property frame the site renders must be in the log; unlogged fails
2. a `withdrawn` frame must not render at all

Both falsified. The fourteen inherited frames do **not** auto-return: twelve are
`pending-licence` (unknown is not licensed), and two are `withdrawn` on brand
grounds — the quad bike in birch woodland that is not Crete, and the composited
wine still life — blocked at the single function every component resolves an
image through.

**Dressed, own frames first: 7 of 21 experiences** now carry a real frame of the
property. The other **14 have no honest own frame** and are marked
`needs-licensed-stock` with the reason per slug. That restraint is the point: a
first pass matched "massage" to a villa at dusk and "hiking" to a garden path,
because a loose keyword search always finds something. A hot tub is not a
massage.

## 2. Direction F — "The Cretan Hotel", at `/looks/hotel`

The dense, warm, credible hotel homepage: Book Now pinned top-right, a slow
hero, six villa cards with facts and two buttons, twenty-one experiences grouped
by kind, weddings, distances, a press wall, a real footer with the licence.
Calibrated on a same-island competitor's **structure and density** and on none of
its identity.

| | |
|---|---|
| CLS | **0** at 1440 and 390 |
| LCP | 140ms / 100ms |
| Largest display | 56px — well under the 96px ceiling |
| Legibility | **46 runs across five looks, 0 below AA**, worst 4.93:1 |
| Overflow | 0px |
| Suite | **502 passed, 1 skipped**, two engines |

**Villa photographs come from the registry's own mapping.** A villa card asserts
"this is Villa Thoi", and nothing in the grading pass knows which building is
which — so the cards use each villa's `gallery.heroImage` as the owner's CMS
published it.

**What the registry would not give is a labelled slot, not a filled one:** the
mantinada (a real cultural form with real authorship), the press wall beyond its
single genuine Condé Nast Traveler 2024 mention, and the group's sister
properties. The CN badge image is deliberately not re-hosted — third-party
trademark.

## Five defects, all mine, found by measuring and by looking

- **The hero scrim was tuned by eye and failed** — headline 2.22:1, paragraph
  3.37:1. The same defect Golden Coast had, made a second time.
- **`.ho-group h3` matched every card title** as well as the group label and won
  on source order; villa names rendered as 11px uppercase labels.
- **The unstyled-page guard failed a third time**, under a comment I had written
  saying a fifth direction could not resurrect it. It no longer lists token
  names — it asks whether any CSS rule targets the look.
- **The legibility sampler measured through an element's own background**,
  reporting the draft marker at a phantom 1.00:1. It now composites the plate
  first; the marker was then a genuine near-miss at 4.25 and got a darker one.
- **The alt-text test called a correct page wrong**, checking against each look's
  picks when Direction F is dressed from the registry.

---

# TRANCHE SIX — Direction E, and one instruction not carried out

A fifth directive proposed **"Type-Alive"**: a typography-led direction where the
display face carries the page and the photography is demoted to small treated
windows. It is built at **`/looks/type-alive`** as a fourth prototype, so the
owner compares it beside the other three rather than in place of them.

**HOLDING AT `/looks` FOR THE OWNER'S PICK. No further look work until he
chooses.**

## Why this direction is different from the other four rounds

It is the first one whose premise the measurements support. The grading pass
found **33 hero-grade frames in 871, and five of them daylight** — a photo-led
direction is rationed by material that does not exist, and six photo-led rounds
have now been rejected. Type-Alive asks for **three** reserved photographs
instead of ten, and the chooser card says so on its own axis rather than quoting
it the "proven hero frames" number that is not its constraint.

## Stage 0 was the blocker, so it was checked first

| claim | result |
|---|---|
| Literata: Greek + variable | **confirmed** — `greek`, `greek-ext`, `opsz 7–72`, `wght 200–900` |
| EB Garamond / Vollkorn / Alegreya | confirmed Greek + variable |
| GFS Didot / GFS Neohellenic / Cardo | confirmed Greek, static |
| "do NOT assume Greek" list | **all confirmed Greek-less** — Cormorant, Cormorant Garamond, Fraunces, Playfair Display, Spectral, Marcellus, Gilda Display |
| **Newsreader**, listed as Greek + variable | **WRONG — no Greek subset** |
| **Old Standard TT**, listed as Greek/static | **WRONG — no Greek subset** |
| body sans, flagged unverified | **caveat closed** — Inter *and* IBM Plex Sans both ship Greek and are variable |

## Measured, not declared

| | |
|---|---|
| Weight settle | wght **300 → 600**, element 242px → 286px — the variable axis is genuinely animating |
| CLS | **0** at 1440 and 390 |
| LCP | 740ms / 708ms |
| Legibility | **40 runs across four looks, 0 below AA**, worst 4.93:1 |
| Overflow | 0px at both viewports |
| Reduced motion | marquee stopped, ambient frozen, settle at final weight, duplicate row removed |
| Suite | **501 passed, 1 skipped**, two engines |

## Five defects, all mine, found by measuring and by looking

- **The signature move shipped a layout shift.** Animating `wght` changes glyph
  widths, so the phone hero flipped between two lines and three and moved the
  page 46px — **0.0376 CLS**. Fixed at cause: each word of the lockup owns its
  line, so the settle changes a width and never a line count. The CSS comment
  claiming it "moves nothing but itself" was written before that was true and is
  corrected in place.
- **A measure rule on the wrong element.** `max-width: 34ch` sat on the `<li>`,
  where `ch` resolves against 17px body text — a 64px display line got a 270px
  measure and broke into three against the left edge of a 1440px screen.
- **Two numbering systems a centimetre apart**, both reading "01".
- **An inline `display:flex` beat the reduced-motion rule** hiding the marquee's
  seam copy, so a reader with motion off saw the register printed twice.
- **The distinctness pass compared file paths**, so two different files that were
  both thatched umbrellas at sunset passed as distinct heroes. It now also
  compares what the photograph is *of*.

## The one-DOM claim held for three directions out of four

`tests/looks.spec.ts` proves Aegean, Editorial and Golden render from **identical
markup**. Type-Alive could not: its act numerals, marginalia and two-copy marquee
are content, not decoration. The test was widened by **name** — `PHOTO_LOOKS` —
rather than by quietly loosening what it asserts, and the exclusion is written
into it as the finding.

## One instruction not carried out

The directive permits licensed stock for experience imagery under an **"Experience
Imagery Policy v2"**. **No such policy exists in this repository.** What exists is
`content/image-sources.md`, the owner's own tiering: Tier A is *"Real photography
of Thalasses only… Guests book what they see"*, and Tier C permits licensed stock
for **abstract texture only** — *"never a place, a building or a person"*.
Experience imagery is representational, so that permission does not reach it.

The second half is sharper: applying one duotone *"so stock and real frames read
as one system"* would make bought-in imagery **less** distinguishable from the
property's own — at the exact moment the grading pass found **twelve
stock-flagged photographs already live** on `/` and `/en/experiences`, quarantined
and awaiting his ruling.

So Direction E is dressed in **Tier A photography only**. If the owner wants stock
to illustrate experiences that is his call to make explicitly, and it should
amend `content/image-sources.md`, where his rule actually lives. Full reasoning in
`RE-SKIN-DIRECTIVE.md` §6c.

---

# TRANCHE FIVE — the re-skin directive, and the grading pass

Tranche four closed the backlog. A visual re-skin research directive arrived,
then a work order: **grade the whole library first, then let the owner pick.**
Both are done. The record is **`RE-SKIN-DIRECTIVE.md`**; the owner's page is
**`/looks`**.

## The headline

**The grading pass proved my own correction wrong, and that is the point of it.**

On 8% of the library this repo argued the golden-hour skew lived in the
*curation* rather than the collection — warmth did not separate the grades, and
the ungraded remainder was cooler on average — so Aegean Light looked merely
unmeasured. All 640 remaining frames were then graded against the Phase 1
standard verbatim, two independent graders each, a third adjudicating. **88%
agreement.** Thirteen of the fifteen new A-grades are dusk, sunset or low sun.

| | Aegean Light | Editorial Estate | Golden Coast |
|---|---|---|---|
| Hero-grade (A, unflagged) | **5** | 33 | 28 |
| Support (B, unflagged) | 162 | 266 | 104 |
| Heads all 10 pages? | **no** | yes | yes |
| Display face | Marcellus | Cormorant Garamond | GFS Didot |
| Licence | free, vendored | free, vendored | free, vendored |
| Greek | no | no | **yes** |

Right about support: Aegean went from 23 usable support frames to 162. Wrong
about the thing that decides it: average warmth says nothing about where the
hero frames are. This property photographs at hero level mainly at golden hour.
**The directive's original ranking was right**, and there is nothing left to
grade — the library is now 82% graded and Aegean has five daylight A-grades in
all of it.

## And the pass found what nobody was looking for

**Fourteen photographs on the live site are flagged as not this property** —
twelve stock, two public places, all on `/` and `/en/experiences`. Scuba divers,
a gym trainer, a quad bike on a birch-woodland track, a composited wine-barrel
still life, a white-gloved chauffeur.

This is the founding defect of the whole project: the site being replaced used
stock photographs of places that were not Thalasses. The rebuild inherited the
experience imagery wholesale, and nothing had ever checked it — the grading knew
which frames looked bought-in, the site knew which frames it rendered, and the
two had never been put in the same room.

Nothing is deleted; that is the owner's ruling to make. They are recorded in
`content/flagged-quarantine.json` with each grader's reason, and
`tests/flagged.spec.ts` fails the build if a hard-flagged frame appears that is
not already listed. **The list can shrink. It cannot grow by accident.**

| | |
|---|---|
| **T5-1 Reservoir** | Measured the directive's photo claim instead of accepting it. |
| **T5-2 AI imagery gate** | Policy + SHA-256 ledger of 712 frames, inside `npm run verify`, falsified five ways. Nothing here is AI-touched. |
| **T5-3 Three prototypes** | `/looks/aegean|editorial|golden`. One DOM across all three, **asserted**. No new fonts. |
| **T5-4 Directive record** | What was verified here vs what is carried as the directive's claim. |
| **T5-5 Distinct heroes** | Neither sort order could separate them — three daylight A-grades existed in the whole graded set. |
| **T5-6 Chooser** | Wardrobe strip, the font bill (verified — and the premise was wrong on the money half), the production risk (threshold counted from the built site, not invented). |
| **T5-7 Grading pass** | 640 frames, 88% agreement. Reversed the correction. Found the stock photography. |

**Three detectors were wrong before the design was**, in one tranche: a capture
that photographed a transition, a guard that read its token off the wrong
element, and a light classifier that matched "sunset" but not "sun setting" and
was feeding a dusk frame to the bright direction. All fixed at cause.

Full suite: **501 passed, 1 skipped** across two engines. Legibility 30 runs, 0
below AA, worst 5.20:1.

*(Tranche five stopped here by instruction; tranche six added the fourth
direction above, and holds at the same place.)*

---

# QUEUE COMPLETE (tranche four)

**Tasks 0 through 30 and all eight of tranche four are done.** Every one is
committed and pushed with its own commit, and HEAD is green on the full gate:
credential scan, typecheck, lint, build, `npm audit`, the Greek corpus
verifier, and **487 tests across two engines**.

The backlog is empty.

**Tasks 0 through 30 are done.** Every one is committed and pushed, each with its
own `overnight/N` commit, and HEAD is green on the full gate: credential scan,
typecheck, lint, build, `npm audit`, and 414 tests across two engines.

Nothing below is a plan. What remains is named in three places and nowhere else:
**open engineering work** (the homepage's hydration cost), **the owner-pending
list** (facts and photographs only he can confirm), and **`LAUNCH.md`** (a
runbook, owner-triggered, that does nothing by itself).

Last updated: after `t4/wrap` — tranche four complete.

---

## Where the run actually is

| Task | State |
|---|---|
| **0 — DEPLOY.md** | **DONE** — `6987cd1` |
| **1 — Villa template on D** | **DONE** — `03f62e1`, `10b0d39` |
| **2 — Estate page on D** | **DONE** — `86a6594`, `ccb9896` |
| 3 — Content pages onto D | **DONE** — `overnight/3` |
| 4 — Pelagos page transitions | **DONE** — `overnight/4` |
| 5 — Copy pass to the voice rules | **DONE** — `overnight/5` |
| 6 — SEO migration | **DONE** — 301 map, sitemap, robots; OG images landed in Task 16 |
| 7 — Full QA + evidence | **DONE** — `overnight/7` |
| 8 — Morning report | superseded by this file |
| 9 — Kill the cascade family at the cause | **DONE** — `overnight/9`, falsified |
| 10 — Gallery page | **DONE** — `overnight/10` |
| 11 — Accessibility deep pass | **DONE** — `overnight/11` |
| 12 — Performance hardening | **MEASURED, within budget** — see numbers |
| 13 — Error and edge states | **DONE** — `overnight/13`, class guard `overnight/13b` |
| 14 — Enquiry form UI | **DONE** — `overnight/14` |
| 15 — T-189 Greek face verdict | **DONE** — `overnight/15` |
| 16 — OG images and SEO extras | **DONE** — `overnight/16`, falsified |
| 17 — Handoff documentation | **DONE** — `overnight/17` |
| 18 — Taste-audit polish loop | **DONE** — `overnight/18`, falsified |
| 19 — Webkit smoke + final sweep | **DONE** — `overnight/19` |
| 20 — /el locale scaffold | **DONE** — `overnight/20` |
| 21 — CHH re-admission + Weddings | **DONE** — `overnight/21`, `overnight/21b` |
| 22 — Villa pages deepened | **DONE** — `overnight/22` |
| 23 — Redirect verification harness | **DONE** — pulled forward, T-259 |
| 24 — Content-parity certification | **DONE** — `overnight/24`, falsified |
| 25 — Suite consolidation | **DONE** — `overnight/25` |
| 26 — Dependencies & security refresh | **DONE** — `overnight/26` |
| 27 — Second taste-audit loop | **DONE** — `overnight/27` |
| 28 — Greek pass | **DONE** — `overnight/28`; the premise did not hold, see below |
| 29 — Launch dress rehearsal | **DONE** — `overnight/29`; all 15 redirect gaps closed |
| 30 — Media & repo weight | **DONE** — `overnight/30`; 471 MB → 304 MB tracked |
| **T4-1 — Greek corpus** | **DONE** — `t4/1`, verified against the English |
| **T4-2 — Alt-text quality audit** | **DONE** — `t4/2`, falsified |
| **T4-7 — Amenity tooltips render** | **DONE** — `t4/7` |
| **T4-8 — Domain readiness (SITE_URL)** | **DONE** — `t4/8` |
| **T4-4 — Booking deep-link hardening** | **DONE** — `t4/4`, re-verified live, falsified |
| **T4-5 — Crafted meta layer** | **DONE** — `t4/5` |
| **T4-6 — Villa fact-sheet PDFs** | **DONE** — `t4/6` |
| **T4-3 — Visual-regression baselines** | **DONE** — `t4/3`, falsified |
| **T4 wrap** | **DONE** — `t4/wrap`; QUEUE COMPLETE |

**A correction worth naming.** The previous message closed with "Continuing with
Task 3." That was intent, not work: the turn ended before any of it happened, and
the next queue arrived assuming Tasks 3–19 were behind us. Reading HEAD is what
caught it. This is the same discipline as §14 — the repository is the source of
truth, not a session's account of itself — applied to my own reporting rather
than to someone else's.

### Routes that exist at HEAD

`/` · `/en/the-estate` · `/en/villas/{thoi,persi,eeanthe,melia,pueblo}` ·
`/en/experiences` + 21 detail pages · `/en/weddings` · `/en/location` ·
`/en/careers` · `/en/contact` · `/en/terms` · `/styleguide`

**The Greek corpus is complete** — ~18,000 words in `content/el/`, verified
figure-by-figure against the English and held at `copyStatus: "draft"` for the
owner's native review, with 371 questions collected for him. What remains for
`/el` is the routes, not the words. `/el` deliberately does **not** exist yet, and `TRANSLATION-BRIEF.md` (1,123
strings, 7,630 words) is what a translator would need to quote for it and is asserted to 404 — the legacy site is
English-only, so there is no Greek copy to ship and inventing it is not
available. The plumbing is built and flag-gated (`src/lib/locale.ts`).



---

## What is live and verifiable

- **Pipeline:** auto-deploys on every push to `main`, team `domisi`,
  protection off, `noindex` on by design. See `DEPLOY.md`.
- **Tests:** **487 passing, 1 skipped**, run as three shards (`npm run qa`), which
  covers **both engines** — Chromium for everything, and WebKit 26.5 for a
  fourteen-test smoke run (`npm run qa:webkit`). Scan, typecheck
  and lint clean at HEAD — **lint was not, until this task**: two React
  correctness errors had arrived with an earlier commit while this line still
  claimed clean. Found by running the gate instead of trusting the record, and
  fixed (T-273).
- **Core Web Vitals, measured** (`npm run perf`) — mobile 390x844, CPU 4x,
  Slow-4G, PerformanceObserver reading the same entries Lighthouse does:

  | route | LCP | CLS | long-task | transfer |
  |---|---|---|---|---|
  | homepage | 1052ms | 0.001 | **275ms — OVER** | 430 KB |
  | villa (104 photos) | 1076ms | 0.023 | **207ms — OVER** | 391 KB |
  | estate | 1056ms | 0 | 187ms | 394 KB |
  | experiences | 944ms | 0 | 120ms | 393 KB |

  Budgets LCP <= 2500ms, CLS <= 0.1, long-task <= 200ms. **LCP and CLS pass
  everywhere with room to spare. Two routes are over the long-task budget.**

  This table previously read 183ms for the homepage and claimed all four routes
  passed. That number was never reproducible. Bisected rather than guessed
  (T-294): reverting Framer Motion, disabling `text-wrap: balance`, and removing
  the `:has()` rule each left it at 263–283ms — and building the **exact source
  that produced 183ms** on this machine now gives 248ms. The host, not the page.

  **The budget was not moved to make the number pass.** A lab figure under 4×
  CPU throttling measures the machine as much as the site; only field CrUX data
  decides. Reducing the homepage's hydration cost is named as open work below.
- **Evidence lives outside the gate.** `npm run capture` (walkthrough stills and
  video), `npm run capture:composites` (the pinned acts, Eeanthe/Pueblo side by
  side, the nav in both states), `npm run taste`, `npm run coverage`,
  `npm run parity`. None of them is a test: a screenshot proves nothing about
  behaviour, and until T-291 two of these were in the suite, dirtying the tree
  on every run.
- **Evidence: complete.** `npm run capture` produced **120 stills and all 24
  route/width video clips** in the closing cycle — the previous run had managed
  12 of 24 — and `npm run capture:composites` produced the 18 composites. On
  disk, not in git (T-302): regenerable evidence is not committed.
- **Direction D** is the site's language: light limestone ground, display capped
  at 96px, `--section-y` rhythm, one idea per viewport, one or two dark
  interludes per page.

---

## Defaults taken without waking the owner

| Decision | Reasoning |
|---|---|
| Breakfast omitted from "your stay includes" | The registry states three services and breakfast is not among them. **Since confirmed by the owner: it carries an extra charge.** The default was right and is now permanent (T-245) |
| Villa page spends one dark interlude, on the generosity list | D permits one or two per page; the template had none and read flat over a long scroll |
| Estate figures moved to the shared `Ledger` | The estate and the villas now print figures through one component instead of two |
| Scroll odometer retired | A gadget; D's brief is explicit that confidence comes from timing and whitespace |

---

### Weight

**471 MB → 309.6 MB tracked** (the fact sheets added 1.5 MB, the visual baselines 4.0 MB). `npm run weight` measures it from what git tracks,
not from what is on disk.

- **104.6 MB of byte-identical duplicate photographs removed.** The legacy CDN
  served the same frame under many hashes — one under ten. `content/` was NOT
  rewritten to a canonical hash: that a photograph was published under ten URLs
  is a fact about the old site. The record stays, the bytes went, and every
  legacy address resolves through `content/image-aliases.json` (T-301).
- **62 MB of evidence left git**, on a rule rather than a list: regenerable
  evidence and spent evidence are not committed; evidence waiting on an owner
  ruling is (T-302).
- **The packed history is unchanged**, and deliberately so. Shallow clones — what
  a Vercel build does — get the smaller tree today. Removing the old blobs needs
  a history rewrite, which breaks every existing clone of a public repository
  (T-303).

---

### Content parity

`PARITY-CERTIFICATE.md`, generated by `npm run parity`. The single answer to the
one rule that has governed this project throughout: keep all existing content.

**4 of 6 domains complete** — villas and venues 7/7, experiences 21/21, legacy
text captures 42/42, photography 862/862. Outstanding: 15 redirect targets that
do not resolve, and 46 registry facts that appear on no page.

**Neither is a deletion.** Every item exists in the repository; what it lacks is
a route or a place on a page. The certificate deliberately prints no single
overall percentage — summing the domains gives 94.8%, and 862 of those items are
photographs, so the aggregate could not get worse when a redirect broke.

---

### Registry coverage

`npm run coverage` asks the question that four separate defects had been
instances of without anyone asking it: **of every fact in the registry, which
ones appear in the rendered text of the page that owns it?**

The answer was **108 of 191**. It is **145 of 191** at HEAD.

Among those recovered: a pool alarm, a week's notice for pool heating, twin beds
that convert, six arrangeable services, each house's actual contents on the
estate page — and **a price**, 35€ a day for pool heating, the only price
anywhere in this inventory and printed nowhere until now.

The remainder is legacy prose the Direction D copy pass deliberately replaced,
plus Villa Pueblo, whose registry is thin and stays thin until T-212 is
answered. `qa/coverage/REGISTRY-COVERAGE.md` lists every one.

---

### The taste audit

`npm run taste` measures the mechanical half of "more expensive, or just more?"
across thirteen routes at 1440 and 390 — widows, collisions, congestion,
off-system spacing, `ch` measures resolving against the wrong font, and small
capitals set without tracking. `npm run look <route> <selector> <width>`
photographs one element for the half that has to be judged by eye.

At HEAD: **collisions 0, off-system 0, measure 0, tracking 0**, two widows and
one congestion, all three reviewed and recorded in `qa/taste/ACCEPTED.md` with
reasons. Three of those categories were not zero when the audit was first run.

The audit found three things no existing guard could see, because none of them
overflows, misreports contrast, or uses the wrong size:

1. **The hero's own word was invisible.** "UNLIMITED" rendered in dark olive on
   a dark photograph at ~1.6:1, because the fix for T-242 left `globals.css`
   unlayered and unlayered rules beat every layer. axe could not catch it — it
   declines to compute contrast over a background image. (T-274)
2. **Every homepage intertitle was set at 40% of its measure**, because
   `max-width: 22ch` sat on a 17px `<li>` wrapping 44px type. (T-276)
3. **Sixty Clause tails carried no tracking**, and the litany's carried
   **-0.107em**, inherited as pixels from the display above it. (T-277)

---

### The share cards

Twenty-nine OpenGraph cards, one per route that has its own subject: the
homepage, the estate, weddings, five villas and twenty-one experiences. Built at
build time from the real photography and the real type system, so they cannot
drift from the brand the way a hand-made JPEG does.

Every card is **measured, not asserted**. `tests/og-card.spec.ts` decodes each
rendered PNG and computes the actual contrast under the copy. Worst case at
HEAD: **6.71:1**, against an AA floor of 4.5. Dropping the veil turns
twenty-seven of them red, so the guard is load-bearing (§16).

**Two experience cards carry no photograph** — `bike-tours` and
`learn-the-secrets-of-cretan-cuisine` — because their hero frames are on the
ruled-off list. They fall back to the plain basalt ground, which is the designed
behaviour and not a defect. Both become photographic the moment the owner
supplies a frame; nothing in the code needs to change.

---

## Defects found and fixed this run

1. **Every primary CTA on the site was 2.27:1** and had been since the elevation
   pass. `.micro` sets a colour, globals imports partials at the top, so its rule
   cascaded after `.btn-primary`'s at equal specificity and won. (T-242)
2. **The estate enquiry CTA was 1.43:1** — same family, via `.on-dark .micro`.
   Found by the contrast guard within an hour of writing it. (T-247)
3. **Five villa plates rendered as empty rectangles** — raw CDN URLs passed to
   `next/image` instead of through `localImage`, which also bypasses the
   ruled-off list. (T-235)
4. **The hero scrim left ~0.28 alpha across the copy band**; limestone read
   ~1.6:1 over a bright sky. Recomputed to 0.72. (T-236)
5. **The credential scanner reported clean on a real `VERCEL_OIDC_TOKEN`** — its
   generic pattern required quotes and an env assignment has none. (T-237)
6. **The D rebuild silently dropped the T-212 detail rows.** My own regression,
   caught in the same session. (T-243)
7. **The gallery's cluster offsets were accumulated by a counter mutated during
   render**, which Strict Mode's double render would have desynchronised — every
   lightbox opening on the wrong photograph. (T-273)
8. **The lightbox flashed the previously-viewed frame on every open**, because
   it synced its index to the prop in an effect rather than during render.
   (T-273)
10. **The contrast guard for the share cards was itself wrong**, and failed all
   twenty-nine correct cards at 2.2:1: a thin light stroke never reaches its
   full colour, so the classifier missed the 21px eyebrow entirely and measured
   its own antialiasing as ground. Rewritten with a structurally glyph-free
   measurement beside the classifier. (T-272)
11. **The hero tail was dead CSS at ~1.6:1** — the cascade family a fourth time,
    now guarded at the source: nothing in this codebase is unlayered. (T-274)
12. **The litany measure resolved `ch` against 17px while setting 44px type**,
    making every intertitle 40% of its intended width. (T-276)
13. **Sixty Clause tails inherited display tracking**, one at -0.107em on
    capitals. One cause, one line. (T-277)
14. **Twenty-four widows in display type**, killed in the register with
    `text-wrap: balance` rather than by rewriting correct copy. (T-278)

**The cause behind 1 and 2 is now fixed, and the fix was falsified.** They were
one family with T-217. `@layer` puts components above the typographic register,
so a register rule can no longer beat a component rule by import order. All
three specificity patches were then **deleted**, and the contrast guard still
passes on eight routes — the layer order is what holds the colours, not the
patches. (T-253, CONVENTIONS §16.)

---

## Open engineering work, named rather than absorbed

- **The homepage hydrates too much on first paint.** Lenis, the contextual
  cursor, the route transition, the preloader, the drag register, the acts and
  the litany are all client components mounted at load, and together they cost
  250–280ms of long tasks at mobile settings. Nothing is broken and nothing
  regressed; it is simply more main-thread work than the budget allows, and the
  fix is deferral or reduction, not a larger budget.
- **46 registry facts still reach no page** — `qa/coverage/REGISTRY-COVERAGE.md`
  lists each one. Most are legacy prose the copy pass replaced deliberately.
- ~~15 redirect targets do not resolve~~ — **all closed (T-299), including the
  loop. Legacy URLs now read 51/51.** The pre-DNS gate in `LAUNCH.md` §1 is a
  verification step rather than a blocker.

---

## Waiting only on the owner

- **The minimum stay.** Stated nowhere in the inventory for any villa, so the
  booking bar's nights field opens at an arbitrary five (T-314).

- The legacy `/en/jet-ski-safari-1.html` was titled **"Water Sports"** and there
  is no combined water-sports page in the inventory. The redirect now lands on
  `/en/experiences/jet-ski-safari`, the nearest real thing. If that page covered
  more than jet skis, the destination should change (T-299).

- T-212 — Villa Pueblo's bathroom detail, view, distance, and a `specsConfirmed` flag
- The geographic scope of the "only seafront villas with helipad" claim
- The hero sub-line, shipping as a working default: "Five seafront villas, one private beach fifty metres from the door, on the north coast of Crete."
- The eight beach distances
- The hero MP4
- The three quarantined frames in `qa/curation/owner-review/`
- The Google Cloud console: restrict or rotate the legacy Maps key (alert #1 stays open until confirmed)

---

## What this build is, and what it is not

Written last, deliberately. Everything above says what was done; this says what
it is worth, including where it is thin.

### What is actually proven

- **Both engines render it.** Chromium for the full suite, and WebKit 26.5 for
  a smoke run across ten routes at 390 / 768 / 1440: every page serves 200, none
  scrolls sideways, none logs a console error or a failed request, the display
  face resolves rather than falling back, cascade layers apply, every booking
  link reaches the real engine with `lang=en`, and the operating licence is on
  the page. Every feature this design leans on — `@layer`, `:has()`,
  `text-wrap: balance` and `pretty`, `svh`, `content-visibility`, `color-mix()`
  — is supported in both.
- **Content parity with the legacy site**, asserted against the Phase 0
  inventory rather than eyeballed.
- **Accessibility to AA**, axe across eleven routes with one documented
  exception, plus keyboard, focus and heading-structure assertions. **The audit
  now scrolls before it runs** — until T-283 it was checking only what painted
  on load, which on the estate was 569 nodes instead of 636.
- **Core Web Vitals inside budget** on four routes.
- **No credential of any kind in the repository**, scanned over everything git
  can see before every push.

### What is NOT proven, and should not be claimed

- **A smoke run is not a suite.** WebKit was checked for the failures that are
  catastrophic and silent; it was not checked for the enquiry form, the gallery
  lightbox, the route transitions, the hotspot map or the scroll-driven litany.
  Those pass on Chromium only.
- **No Firefox. No real device.** WebKit-the-engine is not Safari-the-browser,
  and neither is an iPhone in sunlight. Nothing here has been opened on a phone.
- **The performance numbers are lab numbers** — localhost with synthetic
  throttling. Real-field CrUX data will differ and only field data decides.
- **axe passed 77 photographs that all said the same sentence.** It checks
  that an alt attribute exists, not that it says anything — a question no
  generic engine can ask. Caught by a project-specific guard, not by axe
  (T-304).
- **axe could not see below the fold at all until T-283.** Every revealed
  section ships at `opacity: 0` and axe skips invisible elements, so the audit
  was checking the top of each page. Fixed, guarded and falsified — but every
  accessibility statement made before that commit was narrower than it sounded.
- **axe cannot see contrast over a photograph.** It reports "incomplete", not a
  violation, and that blind spot already hid a real defect for the length of
  this project: the hero's own word was rendering at roughly 1.6:1 (T-274). The
  taste audit covers some of that gap; it does not close it.
- **The taste audit is the mechanical half only.** "More expensive, or just
  more?" is a judgement, and the person who has to make it has not seen this
  yet.

### What is deliberately unfinished

- **The enquiry form is not wired.** It validates, and says so in plain words on
  the page. It needs `RESEND_API_KEY` in Vercel — server-side, never
  `NEXT_PUBLIC_`-prefixed — and a developer to connect the send.
- **`noindex` is on, by design.** Indexing is the LAST step of the launch
  runbook, after the domain moves and the redirects are verified against it.
- **Fifteen redirect gaps remain, and one of them is a loop.** The harness is
  the pre-DNS gate; `LAUNCH.md` §1.
- **The terms name another company seven times.** The correction is shown
  visibly and the page states that legal review is pending. Do not launch with
  that notice still on the page without a decision.
- **`/el` does not exist.** The display face for it is decided on evidence and
  recommended (`qa/greek-face/VERDICT.md`); nothing ships until the owner, who
  reads Greek natively, agrees.
- **Two experience share cards carry no photograph**, because their hero frames
  are ruled off. They fall back to the plain ground, which is the designed
  behaviour, and become photographic the moment a frame is supplied.

### The thing worth knowing about how this was built

Five times in this project, an instrument reported success because it never
reached its subject: a hook resolving a percent-encoded path, `test.skip()`
reporting "30 skipped" as green, `vercel whoami` answering a different question,
a contrast guard walking DOM ancestors of a fixed element, and a taste audit
printing "0 findings" above twenty-six connection failures. Two more reported
failure for the same reason — a classifier that missed a thin light stroke, and
a collision detector reading a multi-column flow.

None of those was a hard bug. Every one of them was a tool that looked like it
was working. That is why the guards in this repository assert that they found
their subject before they assert anything about it, and why `CONVENTIONS.md`
§16 and §18 say what they say. It is the single most useful thing to carry
forward from this build.

---

## The closing QA cycle, in full

Run at HEAD, in this order, after the last task landed.

| # | check | result |
|---|---|---|
| 1 | credential scan | **CLEAN** — 366 text files, nothing credential-class |
| 2 | typecheck | clean |
| 3 | lint | clean |
| 4 | build | 69 static pages, compiled in 835ms |
| 5 | `npm audit` | **0 vulnerabilities** |
| 6 | full suite, both engines | **414 passed, 1 skipped** |
| 7 | Core Web Vitals | LCP and CLS pass everywhere; **three routes over the long-task budget** |
| 8 | link crawl | 35 destinations, **0 broken**, 0 dead fragments |
| 9 | taste audit | 5 findings, **all accepted with written reasons** |
| 10 | registry coverage | 145 of 191 facts on a page |
| 11 | parity certificate | **5 of 6 domains complete** |
| 12 | weight | 304 MB tracked, down from 471 MB |
| 13 | translation brief | 1,125 strings, 7,636 words |

**Line 7 got worse during the cycle, and it is reported worse.** The homepage read
275ms when Task 26 measured it and 323ms here; the estate crossed the budget for
the first time. This is the same machine that produced 248ms from the *pre-tonight*
source three hours ago, and nothing in the intervening work touched the homepage's
client bundle. It is host load, and the honest thing to say is that **a lab
long-task figure on this machine is not stable enough to certify against** —
which is itself the finding. LCP and CLS, which are stable, pass everywhere with
room to spare.

The budget was not moved to make any of it pass. Reducing the homepage's
hydration cost stays on the open-work list, where a real number from field CrUX
can settle it.

## What the run cost, and what it caught

Thirty-one commits. The defects worth naming are the ones **no existing guard
could see**, because each one is a class rather than an instance:

- The hero's own word, "UNLIMITED", rendering at ~1.6:1 on the first screen —
  dead CSS caused by the fix for three earlier contrast failures (T-274).
- The accessibility audit checking only what painted on load, for the length of
  the project (T-283).
- Every homepage intertitle set at 40% of its measure (T-276).
- Sixty Clause tails carrying no tracking, one at −0.107em (T-277).
- 83 recovered facts on no page, including the only price in the inventory
  (T-285).
- Eleven experience pages indexable and unreachable (T-297).
- A redirect **loop** in the pre-DNS map, closed with the other fourteen gaps
  (T-299).
- 104.6 MB of byte-identical duplicate photographs (T-301).

And seven times, an instrument reported success without reaching its subject —
a hook resolving a percent-encoded path, `test.skip()` reporting "30 skipped" as
green, `vercel whoami` answering a different question, a contrast guard walking
DOM ancestors of a fixed element, a taste audit printing "0 findings" above
twenty-six connection failures, two capture tools pointed at a 404 for a whole
night, and axe skipping everything below the fold. **None of them was a hard
bug. Every one of them was a tool that looked like it was working.** That is
what `CONVENTIONS.md` §16 and §18 exist for, and it is the most useful thing to
carry out of this build.

---

## Tranche four, and what it cost to be sure

Eight tasks. The pattern of the whole build held: **most of what mattered was
found by checking something that already looked finished.**

| | |
|---|---|
| **T4-1 Greek corpus** | ~18,000 words across eight domains, one glossary, `copyStatus: "draft"`, 371 questions for the owner. Then verified figure-by-figure against the English — and the reconciliation's own report was wrong: descriptions were keyed by featureId, the same id carries different English in different villas, and **the estate would have told a Greek reader there was one kitchen** where the English says four. 15 silent collisions. |
| **T4-2 Alt text** | The estate served **48 photographs under 3 descriptions**, 46 identical. axe passed it every run for the whole project, because axe checks that alt *exists*. Now 48 of 48 distinct. |
| **T4-3 Visual baselines** | 22 approved viewports, photography masked — 13.4 MB of JPEG noise reduced to 4.0 MB of layout. **The first two falsifications passed**, and measuring rather than adjusting is what caught why. |
| **T4-4 Booking** | Re-verified against the live engine, which **had been redeployed**. The recorded reason for `lang=en` was wrong. A past check-in is accepted silently and shows nothing. |
| **T4-5 Meta** | Four villa pages shipped **the same 597-character description**. |
| **T4-6 Fact sheets** | Five PDFs from the registry. 7.7 MB → 1.5 MB; Pueblo had no photographs; the lede said "Four luxurious villas" on a sheet about one. |
| **T4-7 Amenity tooltips** | A `??` discarded **269 words** of recovered text — and the guard then found that **the estate rendered no inventory at all**, 127 items reaching nobody. |
| **T4-8 SITE_URL** | The domain was hard-coded in three files. A preview deployment was emitting OpenGraph cards **fetched from the client's live site**. |

### The closing cycle

| # | check | result |
|---|---|---|
| 1 | credential scan | **CLEAN** — 390 text files |
| 2 | typecheck / lint / build | clean; 69 static pages |
| 3 | `npm audit` | **0 vulnerabilities** |
| 4 | Greek corpus verifier | **CLEAN** across 8 files, 6 checks |
| 5 | full suite, both engines | **487 passed, 1 skipped** |
| 6 | Core Web Vitals | LCP and CLS pass everywhere; **three routes over the long-task budget** |
| 7 | link crawl | **40 destinations, 0 broken**, 0 dead fragments |
| 8 | taste audit | 5 findings, all accepted with written reasons |
| 9 | registry coverage | 145 of 191 |
| 10 | parity certificate | **5 of 6 domains complete** |
| 11 | weight | 309.6 MB tracked, from 471 MB |
| 12 | evidence | 120 stills, **all 24 videos**, 18 composites |

**Line 6 is reported worse than last time and the reason is unchanged.** The
homepage read 275ms in T4-4's measurement and 302ms here, on the same machine
that produced **248ms from the pre-tranche-three source** three hours earlier.
Nothing in this work touched the homepage's client bundle. It is host load, and
the honest statement remains that a lab long-task figure on this machine is not
stable enough to certify against. The budget was not moved to make it pass.

### What is still open, and it is short

- **The owner's review of the Greek.** 371 questions are collected on one page.
- **`/el` routes.** The words are done and verified; the routes are not built,
  and `PUBLISHED_LOCALES` fails the suite if anyone publishes early.
- **The homepage's hydration cost** — named as engineering work, not absorbed.
- **46 registry facts** that reach no page, most of them legacy prose the copy
  pass deliberately replaced.
- **The owner-pending list** below: facts and photographs only he can confirm.

