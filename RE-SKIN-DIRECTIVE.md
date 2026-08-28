# Re-skin directive — what was received, what was checked, what changed

The visual re-skin research proposes three directions, an AI-imagery strategy,
and a build template. This is the working record of acting on it: what is now
built, what was verified against this repository, and what turned out to be
wrong.

It exists because a directive and a codebase disagree in places, and the
disagreements are the useful part.

---

## 1. What is built

| | |
|---|---|
| **`/looks`** | The chooser. Four cards, Greek first, with the reservoir figures, the font bill and any production risk on each. |
| **`/looks/aegean`** | Aegean Light — Marcellus, paper white, one Aegean blue. |
| **`/looks/editorial`** | Editorial Estate — Cormorant Garamond, bone paper, numbered acts. |
| **`/looks/golden`** | Golden Coast — GFS Didot, warm ivory, full-bleed cinematic. |
| **`/looks/type-alive`** | Direction E — Literata Variable, warm paper, type leads and photography is demoted. See §6a. |

Noindex, unlinked, excluded from the sitemap with a stated reason. Same copy on
all four — every line already on the live homepage — because a comparison in
which the words also change is a comparison of nothing.

Commands: `npm run reservoir` (what each look can be dressed from),
`npm run looks` (photograph all four), `npm run legibility` (measure type
against the pixels behind it), `npm run flagged` (stock photography on the live
site), `npm run verify:provenance` (the imagery gate).

---

## 2. The correction that matters — and then reversed itself

**Round one, on 8% of the library.** The directive ranks the looks on the claim
that the library "skews golden hour". Measured against the 72 frames Phase 1 had
graded, the argument here was that the skew lived in the *curation*: warmth did
not separate the grades (A 15.1, B 15.0, C 14.2), and the 799 ungraded frames
averaged −4.7 warmth against the shortlist's +15.1. Conclusion drawn: Aegean
Light was not starved, only unmeasured, and an afternoon of grading would fix it.

**Round two: the grading pass ran, and that conclusion was wrong.**

All 640 gradeable frames went through the Phase 1 standard verbatim, two
independent graders each, a third adjudicating disagreements. **88% agreement**
across 640 frames; 74 adjudicated.

| | |
|---|---|
| newly graded | 640 |
| grade A | **15** |
| grade B | 251 |
| grade C | 374 (58%) |
| flagged | 109 |

**Thirteen of the fifteen new A-grades are dusk, sunset or low sun.** The
library is now 82% graded, and the picture inverted:

| look | proven hero (A) | proven support (B) | ungraded left |
|---|---|---|---|
| Aegean Light | **5** | 162 | 0 |
| Editorial Estate | 33 | 266 | 0 |
| Golden Coast | 28 | 104 | 0 |

Where the correction was right: the library holds far more usable *support*
material than an 8% sample implied — Aegean went from 23 support frames to 162.

Where it was wrong, and it is the half that decides the ranking: average warmth
across all frames says nothing about where the hero-grade frames are. Grade for
grade, **this property photographs at hero level mainly at golden hour** — not a
surprise, in hindsight, for a west-facing seafront estate. Aegean Light has five
daylight A-grades in the entire library. It is starved, and grading proved that
rather than fixing it.

**The directive's original ranking was right.** Golden Coast and Editorial
Estate can both head every page of the site; Aegean Light cannot, and no amount
of further grading will change it, because there is nothing left to grade.

That is what the pass was for. A measurement that only ever confirms you is not
a measurement.

---

## 2a. What the grading pass found that nobody was looking for

**109 frames carry a flag** — 23 stock, 22 a public place, 1 a different
property, 63 unsure. A flag is not a quality judgement; it is a claim that the
photograph may not be this property.

Cross-referenced against what the built site actually renders
(`npm run flagged`), **25 of them are on a page right now, and 14 carry a
specific claim**:

| flag | on the site |
|---|---|
| `stock` | **12** |
| `public-place` | 2 |
| `unsure` | 11 |

They are all on `/` and `/en/experiences`, illustrating activities: scuba
divers, a gym trainer with a barbell, a quad bike on a birch-woodland track, a
composited wine-barrel still life, a white-gloved hand opening a car door, a
parasailer over a town beach.

**This is the defect the entire project exists to prevent.** The site being
replaced used stock photographs of places that were not Thalasses; the rebuild
inherited the experience imagery wholesale and nothing had ever checked it,
because the grading knew which frames looked bought-in and the site knew which
frames it rendered, and the two had never been put in the same room.

**Nothing has been deleted.** Which photographs represent the property is the
owner's call and this project keeps what it is given. The fourteen are recorded
in `content/flagged-quarantine.json` with each grader's reason, and
`tests/flagged.spec.ts` now fails the build if a hard-flagged frame appears that
is not already on that list. The number can shrink when he rules; it cannot grow
by accident.

---

## 3. Anchor sites, and why they are not the deliverable

The directive's first recommendation is to send the owner three sets of anchor
sites tonight and ask him to pick.

**That is still asking him to imagine.** Showing this owner the Aman website
asks him to picture his own five houses inside somebody else's brand — the same
act of translation that failed five verbal rounds, now with pictures attached.
The directive's own fallback — *"build one clickable hero prototype per look and
let him choose from moving pixels"* — is the primary move, and it is what got
built.

The anchors remain useful as shorthand for the register, and they are recorded
in `src/app/looks/looks-data.ts`. Their liveness was checked once, from a
script:

| site | |
|---|---|
| aman.com, villa-vista-magnifika.com, sanlorenzoyacht.com, nobuhotels.com, awwwards.com | 200 |
| sixsenses.com, loropiana.com | **403 to a script** |

A 403 to `curl` is bot protection, not a dead site — both are almost certainly
fine in a browser. It is recorded rather than resolved because a script cannot
tell the difference, and saying "confirmed live" on this evidence would be a
claim the check does not support.

---

## 4. Constraints the directive proposes that already exist

- **The 96px display ceiling.** Already enforced by construction in
  `--text-display-xl` (`clamp(2.75rem, 1.6rem + 5.4vw, 6rem)`), added after the
  two rejected rounds. The prototypes carry their own scale, so
  `tests/looks.spec.ts` asserts it for them separately rather than inheriting
  the reassurance.
- **WebHotelier deep links only**, `lang=en`, dates-only. Unchanged, and the
  prototypes use the real engine.
- **`prefers-reduced-motion`** is mandatory and honoured on all four — and on
  Direction E it also stops the marquee and removes its duplicate row.
- **No horizontal overflow at any width** — asserted per look, per viewport.

---

## 4a. The typographic bill — verified, and it corrects its own premise

The instruction to annotate each look with its font facts came with a premise:
*Golden — free faces, Greek included; Aegean/Editorial — commercial licence
required plus an /el face to source.*

**Half of that is wrong, and it is the money half.** Checked against the Google
Fonts catalogue metadata (`isOpenSource`, `subsets`) rather than recalled:

| look | display face | open licence | Greek subset |
|---|---|---|---|
| Aegean Light | Marcellus | **yes** | **no** — latin, latin-ext only |
| Editorial Estate | Cormorant Garamond | **yes** | **no** — cyrillic, latin, vietnamese |
| Golden Coast | GFS Didot | **yes** | **yes** — greek, greek-ext |
| *(all three, body)* | Inter | **yes** | yes — vendored latin-only here |

**No look as prototyped requires a font purchase.** All four faces are open
licence and all four are already vendored in this repository. The commercial
premise belongs to the directive's *named* faces — Canela, Reckless, GT Sectra,
Söhne — and those are commercial for all three looks equally, so they are not a
differentiator either.

**The real differentiator is Greek, and it is not a licence question.** Neither
Marcellus nor Cormorant Garamond offers a Greek subset *at all*, so `/el` would
need a different display face chosen — not a re-subset of the same family. GFS
Didot ships Greek, so Golden Coast carries the Greek site for free. That also
independently confirms T-176, which was verified in Phase 1 by a different
method.

One piece of good news the check turned up: **Inter does offer Greek**, and is
vendored latin-only here. Greek *body* text is therefore a free re-subset under
any of the three looks. The problem is confined to the display face.

*A method note, because an earlier attempt got this wrong.* A width-comparison
heuristic was tried first — render Greek in each face against a fallback and
compare — and it reported every face as covering Greek, including Marcellus.
Per-glyph fallback changes a string's width for reasons other than coverage. The
table above comes from the catalogue, not from that measurement.

---

## 4b. What "dress five villa pages" actually costs — counted

The production-risk line on the chooser needed a threshold, and inventing one
would have put a fabricated number in front of the owner. So the built site was
counted instead: every distinct frame rendered across ten routes, after a full
scroll.

| route | distinct frames |
|---|---|
| villa-thoi / persi / eeanthe / melia | 44 / 47 / 49 / 48 |
| villa-pueblo | **9** — the known content gap, not a design choice |
| the estate | 46 |
| weddings | 32 |
| experiences | 19 |
| home | 33 |
| **distinct across all ten** | **245** |

A villa page is not "a hero and three supports". It is forty-odd frames, and the
site runs on 245 distinct photographs — against a Phase 1 graded set of 72.

What actually gates a *look*, though, is narrower: galleries can be dressed from
good support frames, but a direction cannot fake the full-bleed frame at the top
of each major page. There are **ten** of those — five villas, the estate,
weddings, experiences, location, home — and that is the number the chooser's
risk line is measured against.

---

## 5. Legibility, which is the part that got rejected before

The first build of the prototypes reproduced the exact defect that got an
earlier design round rejected: white display type on a bright photograph,
unreadable. It was worst on Aegean Light, which is not bad luck — that is the
direction whose premise is bright frames, and a bottom scrim fails precisely
there.

Darkening a bright look until its type reads makes it a different look. So the
fix is structural: **Aegean and Editorial set hero copy on paper beneath the
frame**; only **Golden** keeps type on the image, because full-bleed cinema is
what that direction is, and it earns it with a two-axis scrim.

Then measured. `npm run legibility` hides the hero type, screenshots what is
actually composited underneath, and computes the WCAG ratio at the **worst
pixel** in each run — a headline is unreadable if one word lands on a bright
patch, and an average hides exactly that case.

**30 text runs, 0 below AA, worst 5.20:1.** Falsified by weakening Golden's
scrim: fails on Golden only, both viewports, only on runs over photography.

axe cannot do this. It declines contrast checks over background images, and it
is right to — the answer depends on which pixels sit under which glyph.

---

## 6. AI imagery

The policy is in `AI-IMAGERY-POLICY.md` and enforced by
`npm run verify:provenance`, inside `npm run verify`, therefore before every
push. Three categories — allowed, review with owner sign-off, never — and 712
shipped media files recorded by SHA-256 so a frame quietly replaced by an edited
version fails the push under an unchanged filename.

**Nothing in this repository is AI-generated or AI-edited.** The baseline
records that so a departure is visible instead of assumed.

Three things in the directive's Part 2 were **not verified here** and are
carried as its claims, not as findings:

- **California AB 723 / B&P §10140.8.** Adopted as the working disclosure
  standard because it draws its line where this project already draws one, and
  being early costs nothing. It is Californian, governs listings rather than
  hospitality, and does not bind a property in Crete. Confirm any EU or Greek
  obligation with counsel before publishing an AI-touched frame.
- **Kling vs Higgsfield vs Runway**, and the per-clip costs. Not tested. The
  policy is written to be tool-agnostic: whatever produces a frame has to be
  named in the ledger, and the category decides the gate, not the brand.
- **Motion-brush behaviour**, including the reported 5–10% static-brush drift.
  Untested. If a hero loop is ever made, the review gate requires inspecting it
  at full resolution before it can be declared.

---

## 6a. Direction E — "Type-Alive", built as a fourth prototype

The fifth directive proposes a typography-led direction where the display face
and kinetic text carry the page and the library is demoted to small treated
windows. **It is the first direction whose premise the grading pass supports.**
33 hero-grade frames in 871, five of them daylight — a photo-led direction is
rationed by material that does not exist, and this one asks for three reserved
photographs instead of ten.

Built at `/looks/type-alive`: Literata Variable, warm paper, three section
accents, editorial composition (kickers, act numerals, oversized-lede rhythm,
marginalia), and the motion system — weight settle, staggered litany, a 46 px/s
marquee, ambient gradient drift, all with `prefers-reduced-motion` fallbacks.

**Measured, not asserted:**

| | |
|---|---|
| Weight settle | wght **300 → 600** over ~900ms, element 242px → 286px. The variable axis is real, not declared. |
| CLS | **0** at 1440 and 390 — after a defect, see below |
| LCP | 740ms / 708ms |
| Legibility | 40 runs across four looks, **0 below AA**, worst 4.93:1 |
| Overflow | 0px at both viewports |
| Reduced motion | marquee stopped, ambient frozen, settle at final weight, duplicate row removed |

### What it cost to get there

- **The signature move shipped a layout shift.** Animating `wght` changes glyph
  widths, so the hero flipped between two lines and three on a phone and moved
  the page 46px — **0.0376 CLS, mine**. Fixed at cause by locking each word of
  the lockup to its own line: the settle can change a width, never a line count.
  My CSS comment claiming it "moves nothing but itself" was written before that
  was true, and is corrected in place.
- **A measure rule on the wrong element.** `max-width: 34ch` sat on the `<li>`,
  where `ch` resolves against 17px body text — so a 64px display line got a
  270px measure and broke into three, hard against the left edge of a 1440px
  screen. `ch` belongs on the element that carries the type.
- **Two numbering systems a centimetre apart** — section acts and line numerals
  both reading "01".
- **An inline `display:flex` beat the reduced-motion rule** that hides the
  marquee's seam copy, so a reader with motion disabled saw the register twice.
- **The unstyled-page guard failed a fourth time**, because Direction E declares
  `--te-ink` and the guard asked for `--lk-ink`. It now accepts either.

### The one-DOM claim, and where it stops

`tests/looks.spec.ts` proves the three photo-led looks render from **identical
markup** — the directive's "token/composition swap" is true and measured for
them. **It is not true for Direction E.** Its act numerals, marginalia and
two-copy marquee are content, and forcing them through the shared component
would have meant pseudo-element numbers nobody can select and a sidenote crammed
into a `figcaption`. The claim held for three directions out of four; both
halves are recorded, including in the test, which was widened by *name* rather
than by quietly loosening what it asserts.

---

## 6b. The type verification — and two errors in the recommended pool

Stage 0 was named the blocker. Checked against the Google Fonts catalogue:

**Confirmed exactly as claimed:** Literata (Greek, `opsz 7-72` + `wght 200-900`),
EB Garamond, Vollkorn, Alegreya (all Greek + variable); GFS Didot, GFS
Neohellenic, Cardo (Greek, static); and every face on the "do NOT assume Greek"
list — Cormorant, Cormorant Garamond, Fraunces, Playfair Display, Spectral,
Marcellus, Gilda Display all confirmed to have **no Greek subset**.

**Two entries are wrong:**

- **Newsreader is listed in the "verified Greek + variable" recommended pool.
  It has no Greek subset** — cyrillic, latin, latin-ext, vietnamese only. It
  cannot serve the role the table gives it.
- **Old Standard TT is listed under "verified Greek but static". The catalogue
  shows no Greek subset** for it either. (GFS Bodoni is simply absent from the
  Google Fonts catalogue, so it could not be checked this way — not disproven.)

**And the caveat can be closed:** the body-sans question was flagged as
unverified. Both candidates work — **Inter** ships `greek` + `greek-ext` and is
variable (`opsz`, `wght`); **IBM Plex Sans** ships Greek and is variable
(`wdth`, `wght`). Inter is already vendored here, latin-only, so Greek body text
is a free re-subset.

---

## 6c. One instruction not carried out

The directive's photography rules include: *"Experience imagery: licensed stock
permitted (Experience Imagery Policy v2) with logging; same duotone treatment so
stock and real frames read as one system."*

**There is no Experience Imagery Policy v2 in this repository.** What exists is
`content/image-sources.md`, which records the owner's own three-tier rule:

- **Tier A — the property.** *"Real photography of Thalasses only. Never stock,
  never generated, never a 'similar' villa. Guests book what they see."*
- **Tier B — named places.** Real photographs of those actual places, logged.
- **Tier C — abstract texture.** Linen, stone, olive, water surface. *Licensed
  stock permitted* — and generated imagery only for non-representational
  texture, *"never a place, a building or a person."*

Experience imagery is representational: a scuba diver, a jeep on a track, a
wine tasting. Under the owner's tiering that is Tier B at best. **Tier C's stock
permission covers abstract texture and nothing else**, so the instruction as
written would widen a rule the owner set, using the name of a policy that does
not exist.

The second half is the sharper problem. Applying one duotone *"so stock and real
frames read as one system"* would make bought-in imagery **less** distinguishable
from the property's own — at the exact moment the grading pass found **twelve
stock-flagged photographs already live** on `/` and `/en/experiences`, quarantined
and awaiting the owner's ruling (§2a).

**So Direction E is built with Tier A photography only**, and its duotone is
applied to the estate's own frames. If the owner rules that licensed stock may
illustrate experiences, that is his call to make explicitly — and it should
amend `content/image-sources.md`, which is where his rule actually lives.

---

## 7. What the decision now needs

The grading pass is done, so the list is shorter than it was.

1. **Open the four prototypes** at `/looks` and pick one. They are the
   artifact; the anchor sites are shorthand. Three lead with photography; the
   fourth leads with type and needs three reserved frames instead of ten.
2. **Rule on the fourteen flagged frames.** Twelve stock and two public-place
   photographs are on the homepage and the experiences index today. They are
   quarantined and guarded, not removed — see §2a and
   `qa/looks/FLAGGED-ON-SITE.md`.
3. **Know what Aegean Light costs before choosing it.** Five hero-grade daylight
   frames against ten pages that need one. It is the only look that would
   require new photography, and the library has nothing left to grade.
4. Only then the token swap, the re-curation and the re-choreography per the
   directive's Part 3 — which the prototypes support: all three render from one
   DOM, asserted by `tests/looks.spec.ts`, so the swap really is a swap.

### The coverage table, for the record

| | Aegean Light | Editorial Estate | Golden Coast |
|---|---|---|---|
| Hero-grade frames (A, unflagged) | **5** | 33 | 28 |
| Support frames (B, unflagged) | 162 | 266 | 104 |
| Can head all 10 pages? | **no** | yes | yes |
| Display face | Marcellus | Cormorant Garamond | GFS Didot |
| Licence | free, vendored | free, vendored | free, vendored |
| Greek | **no** | **no** | **yes** |
| `/el` display face needed? | yes | yes | no |

Library: 871 scored, 713 on disk, **712 graded (82%)** — 72 in Phase 1, 640 in
this pass. Nothing gradeable remains.
