# Session report

**Read this first. It is written at HEAD and updated as each task lands, so it
is the truthful position — not a plan, not a memory.**

# TRANCHE FIVE — the visual re-skin directive

Tranche four closed the backlog. A visual re-skin research directive then
arrived: three candidate looks, an AI-imagery strategy, and a build template.
Acting on it is `t5/*`, and the record is **`RE-SKIN-DIRECTIVE.md`**.

| | |
|---|---|
| **T5-1 Reservoir** | The directive ranks the looks on "the library skews golden hour". Measured: the SHORTLIST does (15 of 18 A-grades are low light), the library does not — 799 of 871 frames were never graded and average −4.7 warmth against the shortlist's +15.1. Aegean Light is not starved, it is **unmeasured**: 3 proven heroes against 279 candidates nobody has opened. Golden Coast is the inverse — 15 proven heroes and **6** support frames, which will not dress five villa pages. |
| **T5-2 AI imagery gate** | `AI-IMAGERY-POLICY.md` plus a SHA-256 ledger of all 712 shipped frames, inside `npm run verify`. Falsified five ways. Nothing here is AI-touched; the baseline records that so a departure is visible rather than assumed. |
| **T5-3 Three prototypes** | `/looks/aegean`, `/looks/editorial`, `/looks/golden` — his photographs, his words, three ways. One DOM across all three, **asserted** by `tests/looks.spec.ts`, which is what makes "a token swap, not a rebuild" a measured claim. No new fonts: Marcellus, Cormorant Garamond and GFS Didot were already vendored, and GFS Didot carries the Greek that Marcellus lacks. |
| **T5-4 Legibility, measured** | The first build reproduced the defect that got an earlier round rejected — white type on a bright frame. Fixed structurally, then measured against the actual composited pixels at the worst pixel per run: **30 runs, 0 below AA, worst 5.20:1**. |

**Two detectors were wrong before the design was**, which is the recurring
lesson of this project and it recurred twice in one tranche. The capture waited
400ms against a 1400ms reveal and photographed a transition; and the guard
written to catch unstyled pages read its token off the layout's outer wrapper,
where custom properties do not inherit upward — so it failed on every correctly
styled page and sent me hunting a stylesheet that was working. Both fixed at
cause, both now carry the reason in the file.

Full suite after the tranche: **496 passed, 1 skipped** across two engines.

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

