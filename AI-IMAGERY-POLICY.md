# AI imagery policy

**Status: in force. Enforced by `npm run verify:provenance`, which runs inside
`npm run verify` and therefore before every push.**

This site exists because the previous one used stock photography of places that
were not this property. That is the whole origin of the standing rule — *real
property photography only* — and it is the rule most likely to be eroded by
accident now that turning a still photograph into a moving one costs about two
dollars.

So the rule is written down as three categories with a gate behind them, rather
than as an intention.

---

## 1. The three categories

### ALLOWED — no review

1. **Ambient motion synthesis on the property's own frames**, where the motion is
   confined to things that genuinely move on their own — water surface, curtains,
   foliage — and the architecture is masked static. The building must stay the
   building.
2. **A slow push-in or parallax that invents no geometry.** If the move reveals
   anything that was not in the source frame, it is not this category.
3. **Abstract, non-depictive texture** — gradients, bokeh, caustics — that shows
   nothing a guest could book or stand in.
4. **Routine non-AI retouch**: exposure, white balance, crop, lens correction,
   dust spotting. The same edits a photographer has always made.

### REVIEW — owner sign-off, per image, original archived

1. **Removal of transient non-structural clutter** — a bin, a hose, a cable, a
   parked scooter. This is the industry grey zone. It is permitted only when it
   conceals no defect, alters no permanent feature and changes no view.
2. **Any push-in strong enough to change what is visible** through a window or
   over a terrace edge.

Both require: the original file archived, the tool and prompt recorded, and the
owner's explicit sign-off *for that image*. Sign-off on one image is not
sign-off on a technique.

### NEVER

- Generating property imagery or interiors that do not exist.
- Adding, enlarging or improving pools, beaches, gardens or views.
- Sky or landscape replacement that changes the sold reality.
- AI-generated people presented as guests.
- Virtual staging presented as real furniture.
- Anything that makes the property look like something a guest would not find on
  arrival.

The last line is the test the other lines are shorthand for. When a case is
genuinely unclear, it is a REVIEW case, not an ALLOWED one.

---

## 2. Why a disclosure standard is being adopted before anyone requires it

The re-skin research cites California AB 723, codified as B&P Code §10140.8,
effective 1 January 2026, which requires a conspicuous statement near any listing
image whose physical elements were added, removed or changed, plus a link to the
original — while exempting routine exposure and white-balance work.

**Three honest qualifications, because this file will be read as legal advice if
they are missing:**

1. That statute is Californian and this property is in Crete. It does not bind
   Thalasses.
2. It was not independently verified in this repository. It is quoted from the
   research directive, which flags it as needing confirmation with counsel.
3. It governs real-estate *listings*. Thalasses is hospitality.

It is adopted anyway, as the working standard, because it is a concrete line in
a field with very few, it draws that line in the same place this project already
draws it, and being early costs nothing. **Nothing in this repository currently
requires disclosure, because nothing in it is AI-touched.** The policy exists so
that the first time something is, the answer is already written.

Confirm any EU or Greek disclosure obligation with counsel before publishing an
AI-touched frame.

---

## 3. The gate

`scripts/verify-provenance.mjs` holds a manifest of every image the site ships,
recorded by SHA-256 content hash in `content/image-provenance.json`.

It fails when:

| condition | why |
|---|---|
| A file appears that the manifest does not know | new media has to be declared before it can ship |
| A file's hash changes | a photograph whose bytes changed was edited; say how |
| A REVIEW-tier entry has no `ownerSignoff` | that is what the tier means |
| A REVIEW-tier entry names no archived `original` | the original is the only thing that makes the edit checkable |
| Any entry declares the NEVER tier | it should not exist; failing loudly beats a comment |
| An AI-touched entry names no `tool` | "AI" is not a provenance record |

The hash is the part that matters. A policy that depends on someone remembering
to declare an edit is a policy that holds until the first hurried afternoon. A
hash notices.

### Declaring a new image

Add an entry to `content/image-provenance.json`:

```json
{
  "path": "/images/_pool/example.jpg",
  "tier": "allowed",
  "origin": "camera",
  "note": "Owner's photograph, Phase 0 inventory."
}
```

`tier` is `allowed` | `review`. `origin` is `camera` | `retouch` | `ai-motion` |
`ai-edit` | `abstract`. Anything with an `ai-` origin also needs `tool`, and a
`review` tier also needs `ownerSignoff` (a date and a name) and `original` (a
path inside `content/originals/`).

Then run `npm run verify:provenance` and commit the manifest with the image.

---

## 4. The current position

Every image in `public/images/` is from the Phase 0 inventory: the owner's own
site, the manager's listing, and the property's photographer. **No frame in this
repository has been AI-generated or AI-edited.** The manifest records that as the
baseline so that any departure from it is visible rather than assumed.

Motion synthesis is *permitted* by category 1 above and has *not been used*. If a
hero loop is ever produced, it lands as a new file, the gate stops the push, and
it gets declared with its tool, its source frame, and its category — which is
exactly the moment this document was written for.
