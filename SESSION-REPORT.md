# Session report

**Read this first. It is written at HEAD and updated as each task lands, so it
is the truthful position — not a plan, not a memory.**

Last updated: after `overnight/21b`.

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
| 22 — Villa pages deepened | **NOT STARTED** |
| 23 — Redirect verification harness | **DONE** — pulled forward, T-259 |
| 24 — Content-parity certification | **NOT STARTED** |
| 25 — Suite consolidation | **NOT STARTED** |
| 26 — Dependencies & security refresh | **NOT STARTED** |
| 27 — Second taste-audit loop | **NOT STARTED** |

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

`/el` deliberately does **not** exist and is asserted to 404 — the legacy site is
English-only, so there is no Greek copy to ship and inventing it is not
available. The plumbing is built and flag-gated (`src/lib/locale.ts`).



---

## What is live and verifiable

- **Pipeline:** auto-deploys on every push to `main`, team `domisi`,
  protection off, `noindex` on by design. See `DEPLOY.md`.
- **Tests:** **369 passing, 1 skipped**, run as three shards (`npm run qa`), which
  now covers **both engines** — Chromium for everything, and WebKit 26.5 for a
  fourteen-test smoke run (`npm run qa:webkit`). Scan, typecheck
  and lint clean at HEAD — **lint was not, until this task**: two React
  correctness errors had arrived with an earlier commit while this line still
  claimed clean. Found by running the gate instead of trusting the record, and
  fixed (T-273).
- **Core Web Vitals, measured** (`npm run perf`) — mobile 390x844, CPU 4x,
  Slow-4G, PerformanceObserver reading the same entries Lighthouse does:

  | route | LCP | CLS | long-task | transfer |
  |---|---|---|---|---|
  | homepage | 1052ms | 0.001 | 183ms | 426 KB |
  | villa (104 photos) | 996ms | 0.023 | 137ms | 387 KB |
  | estate | 1020ms | 0 | 91ms | 390 KB |
  | experiences | 952ms | 0 | 93ms | 383 KB |

  Budgets LCP <= 2500ms, CLS <= 0.1, long-task <= 200ms. **All four routes pass
  every budget.** These are lab numbers against localhost with synthetic
  throttling — real-field CrUX data will differ, and only field data decides.
- **Evidence:** `qa/walkthrough/` stills and `qa/video/` clips, produced by
  `npm run capture`. **Partial at this commit** — 12 of 24 route/width
  combinations; the run exceeded its process budget partway. Re-run the command
  to complete it.
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

## Waiting only on the owner

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

