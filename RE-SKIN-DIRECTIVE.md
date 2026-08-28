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
| **`/looks`** | The chooser. Three cards, Greek first, with the reservoir figures on each. |
| **`/looks/aegean`** | Aegean Light — Marcellus, paper white, one Aegean blue. |
| **`/looks/editorial`** | Editorial Estate — Cormorant Garamond, bone paper, numbered acts. |
| **`/looks/golden`** | Golden Coast — GFS Didot, warm ivory, full-bleed cinematic. |

Noindex, unlinked, excluded from the sitemap with a stated reason. Same copy on
all three — every line already on the live homepage — because a comparison in
which the words also change is a comparison of nothing.

Commands: `npm run reservoir` (what each look can be dressed from),
`npm run looks` (photograph all three), `npm run legibility` (measure hero type
against the pixels behind it), `npm run verify:provenance` (the imagery gate).

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
- **`prefers-reduced-motion`** is mandatory and honoured on all three.
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

## 7. What the decision now needs

The grading pass is done, so the list is shorter than it was.

1. **Open the three prototypes** at `/looks` and pick one. They are the
   artifact; the anchor sites are shorthand.
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
