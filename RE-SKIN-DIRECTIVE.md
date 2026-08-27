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

## 2. The correction that matters

**The directive says the library "skews golden hour", and ranks the looks on
it** — Look C a natural fit, Look A needing re-curation *away* from the skew.

Measured, half of that is right and the half that is wrong changes what to do.

The **A-grade shortlist** is golden-hour dominated: 15 of 18 frames are sunset,
dusk, blue hour or low sun, by their own curator's subject lines. True.

The **library** is not. Only 72 of 871 scored frames were ever visually graded.
The other 799 average a warmth of **−4.7** against the shortlist's **+15.1** —
and warmth does not separate the grades at all (A 15.1, B 15.0, C 14.2), so warm
light was never a grading criterion. It is what the grader reached for.

| look | proven hero | proven support | ungraded candidates |
|---|---|---|---|
| Aegean Light | 3 | 23 | 279 |
| Editorial Estate | 18 | 29 | 146 |
| Golden Coast | 15 | **6** | 95 |

Two consequences the directive does not name:

1. **Aegean Light is not starved, it is unmeasured.** Its shortage is an
   afternoon of grading over frames that already sit in `public/images/`, not a
   re-shoot and not a compromise.
2. **Golden Coast is hero-rich and support-poor.** Six proven support frames
   will not dress five villa pages, an estate page and an experiences index. It
   is the only look whose hero photography is proven today and the one with the
   least room left to grow.

**The recommendation is therefore not a different pick.** It is that the pick
should follow one grading pass, because as things stand the ranking is decided
by which 8% of the library somebody happened to look at in Phase 1.

Candidate counts are upper bounds: 22 of the 72 graded frames were rejected for
air-conditioning units, cables, plastic furniture and catering gear, none of
which any metric can see. Expect roughly a third of any candidate set to fall
away on sight. Regenerate with `npm run reservoir`.

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

## 4a. A Greek consequence the directive does not mention

The directive treats font names as "register examples… final choices depend on
licensing and web-font performance budgets". True, and there is a constraint it
does not know about: **the Greek corpus exists and `/el` is unbuilt, and this
project's display face has no Greek.**

That was recorded during Phase 3 (T-176, verified by inspecting the served
woff2): **Marcellus carries latin and latin-ext, no Greek.** It is why the
chooser page had to stop reaching for Marcellus — «Τρεις όψεις» was silently
rendering in a Georgia fallback beside Latin set in Marcellus.

Of the three prototype display faces:

| look | display face | Greek |
|---|---|---|
| Aegean Light | Marcellus | **none** — T-176, verified in repo |
| Editorial Estate | Cormorant Garamond | vendored subset is latin-only by filename; **not independently verified** |
| Golden Coast | **GFS Didot** | ships a Greek subset — `gfs-didot-greek.woff2`, wired and loading |

So Golden Coast is the only one of the three that carries its own Greek. If
either of the others wins, `/el` needs a display face sourced, licensed and
weighed before the Greek corpus can be published — which is real work that
attaches to the choice and should be priced into it, not discovered afterwards.

*A caveat on method:* a quick width-comparison heuristic was tried here to test
all four faces at once and it reported every face as covering Greek, including
Marcellus. That is wrong, and it is wrong because per-glyph fallback changes a
string's width for reasons other than coverage. The table above therefore rests
on the repository's existing verified finding and on which subset files actually
exist, not on that measurement. Confirm Cormorant Garamond by the T-189 method
before relying on its row.

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

1. **Open the three prototypes.** They are the artifact; the anchors are
   shorthand.
2. **One grading pass** over the ungraded candidates for whichever look is
   short — 279 for Aegean, 95 for Golden. This is the cheapest item on the whole
   document and it is currently deciding the ranking by accident.
3. **Golden Coast needs a support-frame answer** before it can be committed to,
   independent of whether it wins on looks.
4. Only then the token swap, the re-curation, and the re-choreography, per the
   directive's Part 3 — which the prototypes support: all three render from one
   DOM, asserted by `tests/looks.spec.ts`, so the swap really is a swap.
