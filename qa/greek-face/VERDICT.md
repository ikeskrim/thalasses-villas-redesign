# T-189 — the Greek display face

**Recommendation: Noto Serif Display. Runner-up: GFS Didot.**

Nothing in this document ships. It is the decision paper for a future `/el`, and
the recommendation is a recommendation — the owner is a native reader and sees
these letterforms in a way I do not.

Specimens: `all-four-1440.png`, and one file per face.
Regenerate with `node scripts/greek-specimen.mjs`.

---

## Why this was needed

Marcellus carries `latin` and `latin-ext` and **no Greek at all**. Every Greek
heading on `/el` would silently fall back to Georgia — visibly lighter, a
different texture, and not the brand. The reader would not see a missing font;
they would see a site that looks slightly cheap in their own language.

Inter, the body face, **does** carry `greek` and `greek-ext`, so Greek body copy
is already solved. Only display type is exposed.

## What was actually tested

Not specimen pages. The four candidates were rendered with the strings `/el`
would really set, at the exact Direction D tokens:

| Slot | Size | Tracking | String |
|---|---|---|---|
| `display-xl` | 96px | −0.025em | Ζώντας + ΧΩΡΙΣ ΟΡΙΑ |
| `display-l` | 64px | −0.02em | Κολυμπώντας |
| `headline-m` | 44px | −0.015em | Το πρωινό μπάνιο, πριν ξυπνήσει κανείς. |
| eyebrow | 14px | **+0.14em**, uppercase | ΠΗΓΙΑΝΟΣ ΚΑΜΠΟΣ · ΡΕΘΥΜΝΟ · ΚΡΗΤΗ |

Every subset was verified **from the served woff2**, not from documentation, and
the specimen asserts each face actually resolved — a comparison where all four
silently fell back to Georgia would look like a comparison and be a photograph
of one font. All four returned `document.fonts.check() === true`.

| Face | Subsets served | greek | greek-ext |
|---|---|---|---|
| GFS Didot | greek-ext, greek, vietnamese, latin | 7.2 KB | 9.0 KB |
| EB Garamond | + cyrillic, latin-ext | 10.8 KB | 6.5 KB |
| Noto Serif Display | + cyrillic, latin-ext | 9.7 KB | 5.4 KB |
| Literata | + cyrillic, latin-ext | 8.1 KB | 6.0 KB |

File weight does not decide this. The spread is 3 KB.

---

## The verdict

**Noto Serif Display.** It is the only candidate that holds its strokes at
`headline-m` while still reading as display type at `display-xl`. That is the
test that matters, and it is the same test that settled the original Latin A/B:
Marcellus was kept over Cormorant Garamond precisely because *"at the smallest
permitted display size, Cormorant's strokes thin visibly"*. The Greek decision
should be made on the same criterion or the two languages will not feel like one
brand.

At 44px — the litany line, the section headings, the size a guest reads on a
phone in Mediterranean sun — GFS Didot's hairlines visibly attenuate. Noto's do
not. Its Greek is properly drawn rather than extrapolated from Latin, its
contrast is high enough to sit beside Marcellus without looking like a different
category of face, and the letterspaced uppercase register holds at 14px.

**GFS Didot is the runner-up, and the argument for it is not weak.** It comes
from the Greek Font Society, it is drawn for Greek by people who set Greek, and
for a Cretan property that is a substantive argument rather than a sentimental
one. At `display-xl` it is the most beautiful of the four — the Didone contrast
is genuinely lovely at 96px.

It loses on one thing only: it is the weakest of the four everywhere below the
hero. If the owner weighs provenance above that, it is a defensible choice and I
would not argue hard against it — but he should make it knowing the trade.

**Not recommended.** *EB Garamond* is warm and correct and simply less
distinctive; it reads as a book face doing display duty. *Literata* is the most
legible of the four and the least like this brand — low contrast, sturdy,
designed for long reading on screens. It would make `/el` look like a different
company from `/en`.

---

## How it would ship

Behind a flag, per locale, so **`/en` never changes**:

- `--font-display` resolves to Marcellus on `/en` and to the chosen face on
  `/el`. Nothing else in the type system moves — the scale, the tracking and the
  ceiling are language-independent.
- The Greek face is vendored as `woff2` under `src/app/fonts/` and loaded with
  `next/font/local`, like the other four, so the build stays hermetic.
- `unicode-range` splits `greek` and `greek-ext`, so a `/en` reader never
  downloads a byte of it.

## What is still open

- **The owner's eye.** He reads these letterforms natively; I am judging stroke
  weight and colour, which is the measurable part and not the whole of it.
- **The `latin` question on `/el`.** Greek pages contain Latin — "Villa Thoi",
  "Condé Nast Traveller". Either the Greek face carries those too (all four have
  `latin`), or Marcellus handles Latin inside a Greek page. The second is more
  faithful and needs a `unicode-range` split; worth deciding with the face.
