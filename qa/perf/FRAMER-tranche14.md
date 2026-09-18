# Framer, deferred: what it cost and what replaced it (tranche fourteen)

DECISIONS.md D-028: "Remaining Framer on the estate page and footer: measure the cost, then defer." D-034 records the mechanism and the build defaults; this file is the evidence. `REVEAL-tranche13.md` has the class's history, including the footer preload that D-026 was corrected for.

**The state of this record.** The bytes are measured, on one machine, from the served HTML of three builds. The reader-facing times are the fixer's captures. **The interleaved lab A/B (TBT, FCP, LCP) is not in this file yet:** it needs a machine that is not also building another checkout of this repository, and at the hour these commits landed another agent of this session was doing exactly that (§6). The driver, the three-arm build script and the summary are written; the measurement is owed, and §4 says precisely what it will report.

## 1. The answer, in bytes

| what | measured from | on |
|---|---|---|
| **Step one** took a **119,916 B low-priority script preload** off careers, terms, contact, the gallery and the experiences index — a preload of the Framer chunk, emitted by the footer's clause through `next/dynamic`, for a clause that never moved. It also took **8,738 B** off those routes' initial scripts (careers 608,617 → 599,879 B). | the served HTML of 17 routes, `served-scan.mjs` | HEAD d20fa2b (the fixer's worktree) → f84048b: two different bases, so arm A will confirm it on one |
| **Step two** took **121,154 B** off the estate's initial scripts (732,008 → 610,854 B), **120,636 B** off each villa (726,857 → 606,221), 120,636 B off weddings and 121,067 B off the styleguide. | the same scan, both builds on `main`, one machine, one pipeline | f84048b → dd15e64, adjacent commits |
| **After both,** no public route carries Framer in a script or a script preload, and no clause character or inventory panel carries inline `opacity:0` or `transform`. The seven footer-only routes are unchanged to within one byte (careers 599,879 → 599,878). | the same scan | dd15e64 |

So the remaining Framer cost **about 121 kB of initial JavaScript on each of the eight templates whose tail animates**, and about 120 kB of preloaded-but-unused JavaScript plus 8.7 kB of initial scripts on each footer-only route.

## 2. The three arms

| arm | commit | what it is |
|---|---|---|
| A | 6a6d163 | the Framer build: the footer's clause is a client reference on every route, and four templates run their tail on Framer |
| B | f84048b | step one: a clause that does not animate is server markup; Framer only on the animated templates |
| C | dd15e64 | step two: the tail tracks open in CSS, the inventory switch is a Web Animation, the ledger has its own observer |

For the lab A/B each arm is built into its own dist dir from its own commit in one checkout (`.next-arm{A,B,C}`, ignored by `.gitignore`) and served on its own port at the same time, so the three differ only in the build.

## 3. Bytes, route by route

Initial `<script src>` bytes of the served HTML, and whether any script or script preload carries Framer's three minified literals together.

| route | A (d20fa2b, the fixer's worktree) | B (f84048b) | C (dd15e64) | Framer in A / B / C |
|---|---|---|---|---|
| `/en/the-estate` | 735,681 | 732,008 | **610,854** | script / script / **none** |
| `/en/villas/villa-thoi` | 731,191 | 726,857 | **606,221** | script / script / **none** |
| `/en/weddings` | — | 724,018 | **603,382** | script / script / **none** |
| `/styleguide` | — | 718,841 | **597,774** | script / script / **none** |
| `/en/careers` | 608,617 | 599,879 | 599,878 | **preload** / none / none |
| `/en/terms`, `/en/contact`, `/en/gallery`, `/en/experiences` | — | 599,878–618,494 | 599,878–618,491 | **preload** / none / none |
| `/`, `/en/location`, an experience, the 404 | 632,633 (`/`) | 599,765–616,587 | 599,764–616,584 | none throughout |

**Production carries the same figures.** After f84048b (`scan-prod-f84048b`): no Framer in any script preload on any of the 17 routes, and none in any script on the ten non-animated ones. After 48f2ba2 (`scan-prod-48f2ba2`, taken 2026-09-18T09:48Z): **no Framer in any script or preload on any of the 17 routes**, no inline `opacity:0` or `transform` on any clause character, `--n` on every animated tail and `--i` on each of its characters — and the same deltas as locally, to the byte: the estate 732,536 → 611,382 B (−121,154), each villa 727,375 → 606,739 B (−120,636).

One orphan chunk in the C build still holds the Framer literals (70,637 B). No manifest references it: the six components that still import Framer — `KenBurns`, `Preloader`, `WordMask`, `ActShowcase`, `Litany`, `PinnedEstate` — are dead code no route reaches, so no reader downloads it.

## 4. The lab A/B, owed

`perf-abc.ps1` drives `scripts/hotel-cwv.mjs` against the three ports, rotating **and** reversing the order across runs so a machine that drifts during the window does not load the drift onto one arm; `perf-ab-summary.mjs` prints medians with every run beside them. Four routes: the estate, a villa, careers, and the home page as a control that no arm changes. It will report, per arm and per profile: trace TBT after FCP (the figure the phone budget of 200 ms is set against), load-blocking, FCP, LCP, CLS and the worst interaction — each a median of four runs, with the runs printed.

## 5. What no measurement here can say

- Lab, not field. There is no CrUX for this site, and the "worst interaction" figure is a stand-in driven by synthetic input. A pass is necessary, not sufficient.
- The machine is shared with other sessions and with this session's own agents (§6).
- A tail that animates in CSS from first paint cannot be compared with one that waited for hydration on TBT alone. §7 is the comparison that matters to a reader.

## 6. The machine

The byte scans are deterministic and load-independent. The commits' checks ran between 12:05 and 12:40 local on 2026-09-18, and the machine was **not** quiet: another agent of this session registered a worktree of this repository at 12:13 and built in it at 12:31; the `domisignature` session committed at 12:03, `ink-hotels` at 12:01 (a before/after measurement instrument, with two of its own servers live), and `routes-crete` last at 11:44. One QA test failed once in that window and passed on every re-run — step two's commit message records it rather than dropping it.

## 7. What the reader sees, which is the point

From the fixer's captures (`captures/fix-step2/`, `captures/fix-throttled-step2/`, and the throttled pair `captures/fix-throttled-before/`):

- **The Framer build served the tail at `opacity: 0`** and it became readable only at hydration: **1.12–1.17 s** unthrottled, **2.54–2.76 s** on the hotel-cwv phone profile.
- **The CSS build serves it legible.** The lowest effective opacity in every sequence is 1; the tail is readable from before FCP and comes to rest at about **1.0–1.1 s** — before hydration on the throttled profile.
- The stagger's direction is a build default and the owner's to overturn (D-034). From the last character the closest any two neighbours come is the closed tail's own **−4.80 px**, on all three heroes and both profiles; from the first character it is **−9.56 / −12.83 / −11.83 px**, which is the tail overprinting itself. Three candidates are captured for the ruling.

## 8. Not established

- **The lab A/B** (§4), and with it whether removing about 121 kB of initial JavaScript from the animated templates moves TBT or FCP measurably on the phone profile.
- **Arm A's bytes on one base.** The A column in §3 comes from the fixer's worktree at d20fa2b, four commits behind f84048b, so the A-to-B figures are an estimate until arm A is built on this machine beside B and C. The B-to-C figures are already same-base.
- **Whether any reader notices the stagger's direction.** Only the owner's ruling settles that.
- **The dead components.** They stay in the tree, `framer-motion` stays in `package.json`, and D-016's separate conditions for the D pages are unmet.
