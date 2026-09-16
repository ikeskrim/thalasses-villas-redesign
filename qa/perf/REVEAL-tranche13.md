# The scroll reveals, rebuilt (tranche thirteen)

DECISIONS.md D-021 is the owner's ruling. It has two conditions:
- `/en/gallery` phone CLS at or under 0.1, "via transform or clip-path with reserved dimensions";
- the `/en/careers` LCP text "never starts at opacity 0".

The build defaults are D-026, and the tests are in `tests/reveal.spec.ts`. Everything below was run on 2026-09-14.

## 1. The cause (CHECKS-tranche12 §4–5, re-established)

`Reveal` and `ImageReveal` were Framer `whileInView` components. Framer writes `initial` into the server HTML, which caused both failures:

- **Careers.** The body text was served inside `<div style="opacity:0;transform:translateY(24px)">`. Phone LCP was 3,100 ms.
- **The gallery.** Every frame was served as `clip-path:inset(0 0 100% 0)`. A fully clipped image has an empty visual rect. So when the wipe opened after the lazy image had loaded, Layout Instability scored a move from `0,0 0x0` to the image's real place: phone 0.2014, desktop 0.0827.

## 2. What replaced them

This is a workflow patch, applied to main at 85899ba, plus the corrections in §3.

- **The markup.** `Reveal` and `ImageReveal` render plain markup: a class, and no inline style that hides or moves anything.
- **The observer.** `src/lib/reveal-observer.ts` keeps one shared IntersectionObserver per kind.
  - It reads every rect in a commit, then writes every attribute.
  - It sets `data-reveal="armed"` only on an element whose top is at or below the real viewport bottom when it registers.
  - It releases on the entrance band: −12% for text, −10% for images.
  - An idle sweep, 200 ms after the last scroll or resize, releases whatever a jump passed.
  - An edge observer on the real viewport schedules that sweep when layout, not scroll, brings an armed element into view.
- **The CSS.** In `src/app/direction-d.css`, the "SCROLL REVEALS" rules key every hidden or moved state to the attribute, under `@media screen`:
  - **Text:** a 24 px rise and a fade over 0.8 s, with the stagger as `--reveal-delay` (80 ms a step, capped at 400 ms).
  - **Images:** a bottom-anchored curtain in the page ground goes from `scaleY(1)` to `scaleY(0)` over 1.1 s, while the photograph settles from 1.05 to 1 over 1.2 s. The photograph's wrapper is absolutely placed over the host's reserved box, so the image is never clipped and never moved by layout.
  - **Reduced motion:** opacity only, over the reduced duration.
- **`src/app/layout.tsx`.** The `<noscript>` comment now says it serves the remaining Framer users.

## 3. Corrections made on main before commit

### 3.1 Blocker: reduced motion faded content out

- **Cause.** `globals.css` forces `transition-duration: 250ms !important` on every element under reduced motion (lines 391–399). The patch's armed rules set no `transition-property`, so arming animated opacity from 1 to 0.
- **Red, recorded first** on build `cw3fU-Cv9ur1BaalocmFD`. `-g "reduced motion"` failed on both routes. An armed frame was sampled at opacity 1, 0.949745, 0.84799 … 3.76e-09.
- **The fix.** `transition-property: none` on the armed rules, in the reduce block. It is also in the no-preference block, for symmetry.
- **Green** on build `fYu6a2z7gk6HviSyWzU26`: 2 of 2. The built CSS chunk carries the rule.

### 3.2 Tests added

These come from the first review's findings, which never reached the patch's fixer.

- **Test 1.** No tag of a `reveal`, `image-reveal` or `image-reveal-media` element may carry an inline `transform` in the served HTML.
- **Test 2.** The careers in-view wrapper's computed transform stays `none` from first paint to the first scroll (`moved`).
- **Test 6b, continuous scroll.** The page scrolls in-page, 24 px per frame. A release must land while scroll events still arrive less than 200 ms apart, with no 200 ms gap since scrolling began. Only the entrance band can release it then. This mirrors the jump test.

### 3.3 The falsification switch was unfaithful, and was removed

- **What happened.** Test 3 with `REVEAL_FALSIFY=clip` on the new build: 2 passed. The switch restored only the clip, over the new DOM, and did not reproduce the defect.
- **What replaced it.** Test 3 run against the Framer build itself goes red (§5). The switch is deleted, and the spec header names that procedure.

## 4. Six visual baselines had recorded an old defect

Full QA on `fYu6a2z7gk6HviSyWzU26`: 592 passed, **6 failed**, 19 skipped (the usual 19). WebKit 14 of 14. All six failures were in `visual.spec.ts`:

| baseline | px different | ratio |
|---|---|---|
| careers 1440 / 390 | 17,559 / 17,322 | 0.02 / 0.06 |
| contact 1440 / 390 | 2,802 / 5,842 | 0.01 / 0.02 |
| terms 1440 / 390 | 21,707 / 9,709 | 0.02 / 0.03 |

**What the diffs show.** Every diff was looked at. In each, the only change is text inside a Reveal block sitting exactly 24 px higher; the careers body, for example, moves from y 503 to 479 at 390. Headings, ledes, the notice box and the nav are pixel-identical. No `.reveal` rule exists anywhere else in `src/`.

**Why.** `visual.spec.ts` emulates reduced motion. After the same walk (session script `reduced-offset-check.mjs`), under reduced motion:

| build | careers | terms | contact |
|---|---|---|---|
| new | 0 elements translated | 0 | 0 |
| old (base7ff) | 2 wrappers at `style="opacity: 1; transform: translateY(24px)"` | 13 `.d-terms-section` | `.d-contact-details`, `.d-contact-form` |
| production (old reveal) | identical to base7ff | identical | identical |

The results match at both widths. The server rendered Framer's non-reduced `initial` (`y: 24`), and the reduced `whileInView` animates opacity only. So on the old build, text under reduced motion sat 24 px low **for good**, and the baselines had approved that. The new build renders text at its layout position.

**Updated.** On the clean build `nofPHWiPljPpIDFRROxk1`, `-u` was run for those six only, and all six new images were looked at:
- the type, spacing and box structure are intact;
- nothing collapses or overlaps;
- the body text, addresses and telephone links sit at their layout position.

The new files are byte-identical in size to the failing run's `actual` images.

## 5. Falsifications

Every row went red **at its own named assertion**, not at a precondition. Each mutation was proven present in the build it ran on.

| # | what was broken | red at | result |
|---|---|---|---|
| 3 | test 3 run against the Framer build itself: production and base7ff | the attribution assertion | **Red on both.** Production at 390: 0.2014 at t=7,885 ms, four images `0,0 0x0 → 166x125`. At 1440: 0.0827 at t=2,059 ms, three images `0,0 0x0 → 415x129`. base7ff: the same entries and values. |
| 7 | no `transition-property: none` on the reduced armed rule | reduced motion, "an armed frame sits at opacity …" | **Red** (§3.1) |
| 1 | an inline `transform: translateY(24px)` on the Reveal wrapper (build `6QpY2f1m…`) | "serves a reveal host or media wrapper with an inline transform" | **Red** on careers, contact, terms and boat-trip. The gallery stays green: it has no Reveal text. |
| 2 | `.reveal:not([data-reveal]):has(.d-exp-text) { transform: translateY(24px) }` (build `DqV_A2qc…`) | "the careers body text's reveal wrapper carried a transform in 501 samples" | **Red.** Every precondition, `zero` and `min` passed. |
| 4 | `top >= bottom * 0.88` in `flush()` (build `oL9DtxA_…`) | "a frame at 817 of 844 — on screen at first paint — was armed" | **Red** |
| 5 | the `.reveal[data-reveal="in"]` transition deleted (build `xCsCEHQu…`) | "did not run as 0.8s transitions — the block snapped in" | **Red** |
| 6 | `sweep()` a no-op (build `0_Vv1lF1…`) | "armed blocks at or above the fold stayed hidden after a jump — nothing swept them" | **Red.** Test 6b stayed green. |
| 6b | the band observer's `show()` removed (build `I4bbTu8X…`) | "nothing was released during continuous scrolling" | **Red.** Test 6 stayed green. |

The runner is a session script, not committed. For each mutation it:
1. applies the mutation with an exact once-only match and a fresh write;
2. rebuilds, and proves the mutation is in the built chunks or the served HTML;
3. runs the targeted tests;
4. accepts a failure only if the named assertion's message appears;
5. restores by a fresh write and checks the source hashes;
6. finishes with a clean rebuild and a check that no mutation remains.

Three measurement errors of my own were found and corrected along the way:
- **F2's first form was a transform on every unarmed `.reveal`.** It went red at the arming precondition, which proves nothing about `moved`, and the runner then compared exit codes only. The runner now requires the named message, and the targeted F2b is the record.
- **The runner's first final check reported "a mutation left in the build".** Its CSS needle lacked the space the minifier keeps: `opacity .8s var(--ease-thalasses), transform .8s …`. A direct search showed the build clean.
- **The same needle had made F5's first "proven" line vacuous.** F5 was rerun after first confirming the corrected needle is present in the clean build.

## 6. Verified

- `tests/reveal.spec.ts` on the corrected build: 19 of 19.
- Typecheck is clean, and ESLint shows zero warnings on the reveal files.
- Full QA on the final build `nofPHWiPljPpIDFRROxk1`, which includes the six updated baselines: **598 passed, 0 failed**. By shard: 218, 179 and 201.
  - That is 19 more than the 579 before this change, which are the 19 reveal tests.
  - 19 skipped, the same 19 as earlier runs: direction-d 7, patterns 11, villa 1.
- WebKit smoke: **14 of 14**.

## 7. The budgets, measured

### Core Web Vitals under `scripts/hotel-cwv.mjs`, same machine, old build against new

The two arms:
- **old:** base7ff (:3016), with the Framer reveal and the photographs;
- **new:** `nofPHWiPljPpIDFRROxk1` (:3005).

How it was run:
- **Order per route:** old, new, new, old, old, new, new, old, so four runs per arm.
- **Where:** from a scratch directory, so the tracked `qa/looks/HOTEL-CWV.md` was never written.
- **Throttling:** hotel-cwv's own, 4× CPU and Slow 4G on the phone, 2× CPU on desktop.
- **When:** after full QA, with no other build, test or measurement running on the machine.

| route | view | old: LCP median (range) | new: LCP median (range) | old: CLS | new: CLS | LCP element, old → new |
|---|---|---|---|---|---|---|
| gallery | phone | 996 ms (992–1012) | 1056 ms (1048–1072) | **0.2205** ×3, 0.2014 ×1 | **0** ×4 | `P.d-villa-lede` both |
| gallery | desktop | 334 ms (324–356) | 356 ms (336–396) | **0.0827** ×4 | **0** ×4 | `P.d-villa-lede` both |
| careers | phone | **2538 ms (2108–2972)**, 2 of 4 over 2,500 | **1050 ms (1044–1056)** | 0 | 0 | `P.prose-measure d-exp-text` both |
| careers | desktop | 320 ms (316–332) | 356 ms (332–388) | 0 | 0 | `H1 d-pagehead-title` both |
| boat-trip | phone | 980 ms (964–992) | 1068 ms (1064–1076) | 0 | 0 | `A.nav-mark` → `IMG` |
| boat-trip | desktop | 332 ms (316–340) | 572 ms (560–588) | 0 | 0 | `A.nav-mark` → `IMG` |

What the table establishes:

- **Gallery: the ruling's CLS condition is met in the lab.** Phone CLS went from 0.2205 to 0 in every run, and desktop from 0.0827 to 0.
- **Careers: the text no longer waits.** The LCP element is still the body text. It now paints at about 1.05 s, with the first paint, instead of at 2.1–3.0 s. Every run is under the 2,500 ms budget; before, 2 of 4 were over.
- **Boat-trip: the LCP number rose because the LCP element changed.**
  - On the old build, the experience's hero photograph was clipped to an empty rect at first paint, so it was not an LCP candidate. The largest paint was the nav wordmark.
  - On the new build the photograph paints unclipped from the first load. It becomes the LCP element at about 1.07 s on the phone and 0.57 s on desktop, well within budget.
  - When the old hero photograph actually became visible, after hydration and the wipe, was not measured.
- **Every other LCP moved by at most 60 ms,** which is within the spread of the runs.
- **Budgets on the new build:**
  - every route and view is within LCP ≤ 2,500 ms and CLS ≤ 0.1;
  - phone TBT medians are 61.5–64 ms, against a budget of 200 ms.

Limits:
- **Lab, not field.** CrUX is not obtainable here.
- **Four runs per arm,** on one machine.
- **The two builds differ in more than this change.** base7ff predates later tranche-twelve commits. So the table compares the old mechanism with the new one; it does not attribute every millisecond. The CLS and careers results do match the mechanism exactly: the shift sources, the element and the timing.
- **The per-run reports** are in the session's scratch, not committed.

### framer-motion in the initial scripts

Method: every `<script src>` in the served HTML was fetched. A script counts as carrying framer-motion if it contains all three of the string literals `transformPerspective`, `originX` and `pathLength`, which framer's value tables keep through minification. The check was calibrated on the old build first.

| route | old build (base7ff) | new build |
|---|---|---|
| `/en/careers` | framer chunk (120,835 B) in 12 scripts, 738,782 B | **none**; 11 scripts, 608,550 B |
| `/en/terms` | framer chunk; 12 scripts, 738,782 B | **none**; 11 scripts, 608,550 B |
| `/en/contact` | framer chunk; 12 scripts, 742,569 B | **none**; 11 scripts, 612,649 B |
| `/en/experiences/boat-trip` | framer chunk; 11 scripts, 738,668 B | **none**; 10 scripts, 604,067 B |
| `/en/gallery` | framer chunk; 12 scripts, 757,395 B | **none**; 11 scripts, 627,163 B |
| `/en/the-estate` | framer chunk; 11 scripts, 747,322 B | framer chunk; 12 scripts, 734,469 B |

The estate page keeps the chunk, because `Clause`, `Inventory` and `Ledger` still use Framer there. That result is also the check's positive control on the new build.

On the other five routes, the initial scripts are about 130 KB lighter, uncompressed. The byte counts compare two builds that differ in more than this change: base7ff predates later tranche-twelve commits. So they show that the chunk left, not an exact attribution of every byte.

**Corrected in the tranche-thirteen report commit: framer-motion still downloads on these five routes, at low priority.** The check above reads `<script src>` only.
- **What production serves.** On production on 2026-09-16 (13:21Z, session scratch `prod-framer-preload.mjs`), each of the five routes also carries a `<link rel="preload" as="script" fetchPriority="low">` for a 119,916 B chunk.
  - The chunk has all three signature literals and `clause-char`.
  - It is the footer's lazy `Clause`: `SiteFooter` renders `LazyClause` (`src/components/ui/LazyClause.tsx`, added in ecdfb81) on every `PageShell` page.
  - `/` carries no such preload.
- **What that means.** framer-motion left the initial scripts, but the browser still fetches it on these routes, at low priority.
- **What was measured with it in place.** The new build measured above contains that preload, because ecdfb81 precedes f45e850, while base7ff does not. What the preload costs on its own was not measured.

## 8. Production, after the deploy of f45e850

Vercel reported `success` on the tenth check. At 18:48Z, `prod-reveal-check.mjs` (session scratch) ran read-only GETs against the production alias.

| route | status | reveal hosts | inline `opacity:0` | `translateY(24px)` | empty clip | server `data-reveal` | framer-motion in initial scripts |
|---|---|---|---|---|---|---|---|
| `/en/careers` | 200 | 2 | 0 | 0 | 0 | 0 | none |
| `/en/gallery` | 200 | 66 | 0 | 0 | 0 | 0 | none |
| `/en/terms` | 200 | 13 | 0 | 0 | 0 | 0 | none |
| `/en/contact` | 200 | 2 | 0 | 0 | 0 | 0 | none |
| `/en/experiences/boat-trip` | 200 | 6 | 0 | 0 | 0 | 0 | none |
| `/en/the-estate` | 200 | 10 | **19** | 0 | 0 | 0 | present (expected) |

**Production serves the finished page on every route where the reveal was Framer's only user.** The last column reads `<script src>` only: these five routes still preload the footer `Clause`'s framer chunk at low priority (§7, corrected).

The estate page's 19 are not the reveal. None of them is a reveal host:
- 18 are `span.clause-char`, the Framer `Clause` headline characters, each served at `opacity:0` with a staggered `translateX`;
- 1 is `div.inventory-flow`, the Framer `Inventory` panel, at `opacity:0; transform: translateY(10px)`.

My check flagged the route only because it applied the no-hidden-state rule to its own positive control.

## 9. Still open

- **The estate page still serves hidden content from Framer.** Its clause headline and one inventory panel arrive at `opacity:0` and wait for hydration (§8). This predates D-026, lies outside D-021's two named failures, and is what `layout.tsx`'s `<noscript>` rule still exists for. Whether the remaining Framer components get the same treatment is a separate change, with its own measurement.
- **The motion-on appearance.** `.plate-figure` now shows its box-shadow once revealed, which the Framer build clipped away. It needs a capture for the owner.
