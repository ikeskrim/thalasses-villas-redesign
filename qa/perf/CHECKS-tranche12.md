# Runtime checks on the final candidate, and two budget failures found (tranche twelve)

These checks ran against main's final candidate (`next start` on :3005) on
2026-09-14, after every serial trace run had finished, so nothing here
competed with a timed run. They are:

- the cursor chunk's request log;
- the font request log;
- attribution of the two budget failures that the eleven-template before/after
  found (`AB-tranche12-final.md`).

The first two close claims that `ISLANDS-tranche12.md` and
`FONTS-tranche12.md` had left open. The failures are on **both** builds, and
neither is fixed.

## 1. The cursor chunk: who requests it

**Method.** Load `/en/villas/villa-thoi` or `/` in a Playwright Chromium
context, move the mouse where the context has a pointer, and wait 3 s. Record
every request for the built cursor chunk (`2-2o1ua-qpmde.js`, 1,328 B, the
only built script holding `CustomCursor`'s code), and count `.cursor`
elements.

```
phone (touch, coarse pointer)    /en/villas/villa-thoi    chunk requested: no  (0)  .cursor elements: 0
desktop, motion allowed          /en/villas/villa-thoi    chunk requested: yes (1)  .cursor elements: 1
desktop, reduced motion          /en/villas/villa-thoi    chunk requested: no  (0)  .cursor elements: 0
desktop, Direction F homepage    /                        chunk requested: no  (0)  .cursor elements: 0
```

Neither prerendered D page (`villa-thoi`, `the-estate`) names the chunk in
its HTML.

## 2. Fonts: what the phone profile requests

**Method.** A Playwright request log and the page's `document.fonts`, on the
phone profile.

```
/
  preloaded (3): inter_latin, marcellus_latin, marcellus_sc_latin
  requested (5): inter_latin, marcellus_latin, marcellus_sc_latin, literata_latin_ext, literata_latin
  loaded faces (6): inter 400 500 | inter Fallback | marcellusSC 400 | literata | literata | literata Fallback
/en/villas/villa-thoi
  preloaded (3): inter_latin, marcellus_latin, marcellus_sc_latin
  requested (4): inter_latin, marcellus_latin, marcellus_sc_latin, cormorant_italic_latin
  loaded faces (5): marcellus 400 | inter 400 500 | marcellusSC 400 | cormorantItalic italic 400 | cormorantItalic Fallback
```

(File names are shortened to the face. The full hashed names are in the
session log.)

**What the log shows:**
- `/` requests both Literata files (199,748 B), which confirms
  `FONTS-tranche12.md` finding 2.
- On `/`, Marcellus is preloaded and fetched, but it is not among the loaded
  faces, which fits finding 1.

## 3. Attribution method (sections 4 and 5)

Both failures were attributed under `hotel-cwv`'s exact conditions:
- **Phone:** 4× CPU, 150 ms latency, 1.6 / 0.75 Mbit/s, 390×844, DPR 1.
- **Desktop:** 2× CPU, 1440×900.
- **Session:** load, settle 2.5 s, then scroll the whole page with the wheel.

**What was recorded:**
- **Layout shifts:** every `layout-shift` entry with its sources (the node and
  its previous and current rect), summed as `hotel-cwv` sums them.
- **Worst session window:** as web-vitals defines CLS (gaps under 1 s, windows
  up to 5 s).
- **LCP:** every `largest-contentful-paint` candidate with its element.

Each route was run once with motion allowed and once with reduced motion.

## 4. `/en/gallery` fails CLS on the phone

In the before/after, phone CLS was 0.2014 on every run of the "before" build,
and 0.2014 or 0.2205 on the final build. The budget is 0.1.

```
/en/gallery phone: CLS summed 0.2206 (hotel-cwv's figure), worst session window 0.2014, 2 shifts counted, 0 after input
  shift t=3944ms value=0.2014 scrollY=0
      button.d-gallery-btn > div.d-gallery-frame > div > img  0,0 0x0 -> 20,532 166x125
      button.d-gallery-btn > div.d-gallery-frame > div > img  0,0 0x0 -> 204,532 166x125
      button.d-gallery-btn > div.d-gallery-frame > div > img  0,0 0x0 -> 20,674 166x125
      button.d-gallery-btn > div.d-gallery-frame > div > img  0,0 0x0 -> 204,674 166x125
  shift t=8209ms value=0.0192 scrollY=7265
      button.d-gallery-btn > div.d-gallery-frame > div > img  0,0 0x0 -> 20,0 166x19
      button.d-gallery-btn > div.d-gallery-frame > div > img  0,0 0x0 -> 204,0 166x19

/en/gallery desktop: CLS summed 0.0827 (hotel-cwv's figure), worst session window 0.0827, 1 shifts counted, 0 after input
  shift t=1836ms value=0.0827 scrollY=0
      button.d-gallery-btn > div.d-gallery-frame > div > img  0,0 0x0 -> 65,771 415x129
      button.d-gallery-btn > div.d-gallery-frame > div > img  0,0 0x0 -> 512,771 415x129
      button.d-gallery-btn > div.d-gallery-frame > div > img  0,0 0x0 -> 960,771 415x129

/en/gallery phone, reduced motion: CLS summed 0.0000, worst session window 0.0000, 0 shifts counted
```

**What it is.**
- **It fails by either definition.** On the phone the failure holds under the
  web-vitals definition too: the worst window alone is 0.2014.
- **The sources.** Every source is a gallery image inside `ImageReveal`
  (`src/components/motion/Reveal.tsx`). The first shift is the first viewport's
  four images at 3.9 s, with the page still at the top.
- **It is not missing dimensions.** The frame reserves its 4:3 box
  (`.d-gallery-frame`, `src/app/direction-d.css`).
- **The mechanism.** The server HTML carries `ImageReveal`'s initial state:
  `clip-path:inset(0 0 100% 0)` on the frame and `transform:scale(1.05)` on the
  inner wrapper. So each image's visible rect is empty until the wipe opens
  after hydration.
- **The confirming run.** Under reduced motion, `ImageReveal` fades instead of
  wiping, and CLS is 0.
- **Desktop.** It shifts the same way, at 0.0827, under the budget.

## 5. `/en/careers` fails LCP on the phone

In the before/after, phone LCP was 2,112, 2,936 and 2,912 ms on the "before"
build, and 2,984, 2,984 and 3,032 ms on the final build. The budget is
2,500 ms, and the LCP element was `P.prose-measure d-exp-text` in every run.

```
/en/careers phone:
  t=1084ms size=20610 ... header.canon.d-pagehead > h1.display.c2 (text)
  t=3100ms size=26950 ... section.canon.d-exp-body > div > p.prose-measure.d-exp-text (text)

/en/careers phone, reduced motion:
  t=1100ms size=20610 ... header.canon.d-pagehead > h1.display.c2 (text)
  t=2312ms size=26950 ... section.canon.d-exp-body > div > p.prose-measure.d-exp-text (text)
```

**What it is.**
- **The late element.** The page's largest element is its body text. It is
  wrapped in `Reveal` (`src/app/en/careers/page.tsx:42`).
- **Hidden in the server HTML.** It serves as `<div style="opacity:0;transform:translateY(24px)">`
  in the prerendered HTML.
- **When it paints.** It becomes a paintable LCP candidate only when `Reveal`
  animates it in, after hydration and its in-view trigger. That is 3,100 ms
  with motion allowed.
- **Reduced motion.** It is 2,312 ms, where `Reveal` still starts at opacity 0
  but fades in 0.25 s. First paint is near 1,000 ms either way.
- **Without JavaScript.** The text is not lost: `layout.tsx`'s `<noscript>`
  style forces reveal content visible.

## Why neither is fixed

> **Fixed in tranche thirteen** (DECISIONS.md D-021 and D-026, `qa/perf/REVEAL-tranche13.md`). Under the same `hotel-cwv` profile, old build against new, gallery phone CLS went from 0.2205 to 0, and careers phone LCP from 2,108–2,972 ms to 1,044–1,056 ms. This section is kept as it was written.

Both causes are the shared motion components, `Reveal` and `ImageReveal`,
which serve their hidden starting state in the server HTML. Changing either
one changes the motion on every page that uses them, and ask 2 set its target
"without touching the motion budget". They are recorded here and in D-016 for
a decision.

**Candidates, not tried:**
- Start above-the-fold reveals visible.
- Reveal by opacity only where layout-instability counts the clip.
- Let the careers body text skip `Reveal`.

Each needs the motion budget, a visual comparison and its own A/B.
