# Phase 3 deliverables

Two items owed from the Phase 2 review, plus the QA evidence.

---

## 1. Font A/B — verdict: **keep Marcellus**

Run on `/styleguide` §4.1 at the real display sizes, on the real `--limestone` ground, with a Greek
line included. Rendered comparison: `qa/font-ab.png`.

| | Marcellus | Cormorant Garamond | GFS Didot |
|---|---|---|---|
| Weight at C2 (44–120px) | holds | noticeably lighter | holds |
| C4 (28–32px), the stress test | stays solid | hairlines thin markedly | high contrast, holds |
| Greek | **falls back to Georgia** | **falls back to Georgia** | **renders natively** |
| Subsets | latin, latin-ext | cyrillic, latin, latin-ext, vietnamese | greek, greek-ext, latin |
| File (latin, woff2) | 14.2 KB | 22.3 KB | 14.2 KB |

**Verdict.** Marcellus stays. The A/B confirms the design plan's stated concern rather than
overturning it: at C4 — the smallest permitted display size, and the one used for villa names and
index rows — Cormorant Garamond's strokes thin visibly against Marcellus's. That is exactly the
size, on exactly the ground colour, where a guest reads on a phone in Mediterranean sun. Cormorant
is also 57% heavier as a file for a worse outcome.

The honest caveat from Phase 1 stands and is not resolved by this test: three of four design
directions independently chose Marcellus with the identical "letters cut into stone" argument, which
makes it a default as much as a decision. The A/B shows it is a *defensible* default, not that it
was chosen adversarially.

### The Greek coverage answer

**Neither display face covers Greek.** This is the finding that matters, and it reframes the
question that was asked. Marcellus has `latin, latin-ext` only; Cormorant Garamond has
`cyrillic, latin, latin-ext, vietnamese`. So switching to Cormorant would **not** have unblocked the
`/el` locale — the two candidates fail identically. In the specimen both Greek lines are rendering
in the Georgia fallback, visibly lighter and of a different texture than their own Latin.

Inter, the body face, **does** have `greek` and `greek-ext`. So Greek body copy is already solved;
only display type is exposed.

Three options for `/el`, in the order I would recommend them:

1. **GFS Didot for Greek display only** (recommended). From the Greek Font Society, `greek`,
   `greek-ext` and `latin`, 14.2 KB — the same weight as Marcellus. Its Greek is drawn as Greek
   rather than extrapolated from Latin, which for a Cretan property is the substantive argument, not
   a sentimental one. Marcellus stays on `/en`; the display face swaps per locale behind the
   existing `--font-display` token, so nothing else changes.
2. **EB Garamond or Literata everywhere** — both carry `greek` + `greek-ext`, so one face serves
   both locales. Cleaner system, but it means giving up Marcellus's inscriptional character on the
   English site to solve a problem the English site does not have.
3. **Set Greek headings in Inter.** Cheapest, and it collapses the display/body distinction that the
   whole type system is built on. Not recommended.

This is a live decision only when `/el` is scheduled. It does not block the English launch.
Logged as **T-150**.

---

## 2. Motion inventory

Every animation on the site, what triggers it, and what it does under
`prefers-reduced-motion: reduce`. Assertion in `tests/qa.spec.ts` verifies the reduced-motion state
programmatically rather than by inspection.

| # | What animates | Where | Trigger | Duration / easing | Reduced motion |
|---|---|---|---|---|---|
| 1 | **Clause tail tracking** — per-character `translateX`, never `letter-spacing` | Hero clauses on `/`, villa pages, estate | Mount, `animate` prop only | 1.05s, `cubic-bezier(0.16,1,0.3,1)`, 12ms stagger | No transform at all; renders at final tracking, fades 0.25s |
| 2 | **Section reveal** — opacity + 24px rise | Every `Reveal` block: statement, collection cells, estate figures, register, coast line | `whileInView`, `once: true`, −12% margin | 0.8s, same easing, ≤0.4s stagger | Opacity only, no rise, 0.25s |
| 3 | **Image reveal** — `clip-path` wipe + 1.05→1 scale | Collection figures, plates | `whileInView`, `once: true`, −10% margin | 1.1s clip / 1.2s scale | Replaced entirely by a 0.25s fade; no clip, no scale |
| 4 | **Inventory group switch** — opacity + 10px rise | Villa page inventory | Click on a group in the rail | 0.5s | Opacity only, 0.25s |
| 5 | **Inventory item expand** | The ~29 items per villa carrying a description | Click / Enter on a real `<button aria-expanded>` | CSS, instant | Unchanged — it is state, not decoration |
| 6 | **Register row expand** | Compact experiences on `/` | Click / Enter, `aria-expanded` | CSS, instant | Unchanged |
| 7 | **Smooth scrolling** (Lenis) | Whole document | Wheel input | 1.1s duration, exponential ease | **Disabled entirely** |
| 8 | **Global transition clamp** | Everything | — | — | All transitions forced to 0.25s, animations to ~0, `scroll-behavior: auto` |

**Refused, explicitly:** scroll-jacking, parallax on photography, a page loader, a custom cursor,
carousel auto-advance, hover-only affordances, and any animation on the booking ledger. There is
**no hover-dependent interaction anywhere on the site** — every expandable is a real button, so the
behaviour is identical on a phone and a 1920 display.

**Also disabled on touch:** Lenis is skipped entirely when `pointer: coarse`, so mobile keeps native
momentum scrolling. Hijacking momentum on a phone is the fastest way to make a "premium" site
unusable, and mobile is a first-class surface here.

**Performance notes.** No animation touches layout — the clause animates `transform`, never
`letter-spacing`, so CLS stays at 0. The only paint-heavy candidate in the design plan (a
three-value background ramp) was deleted in Phase 1 rather than demoted.

---

## 3. QA harness status

`npx playwright install chromium` **succeeded** — the sandbox did not block the binary download.
Chromium 151.0.7922.34 launches. **T-152 is closed with real evidence, not owner-side screenshots.**

| Command | Covers |
|---|---|
| `npm run qa:overflow` | `scrollWidth === clientWidth` at 360/768/1024/1440/1920 on 5 routes |
| `npm run qa:screens` | full-page screenshots, same matrix → `qa/screens/` |
| `npm run qa:parity` | content-parity assertions against `/content` |
| `npm run qa` | all of the above |
| `npm run verify` | typecheck → lint → build → qa |

**53 tests, all passing.**

Screenshots walk the page in viewport-sized steps before capturing. The first run did not, and
returned blank Collection, Register and Coast Line sections — because `whileInView` reveals never
fired for content that was scrolled past rather than through. That was a QA artifact, but it exposed
a real defect (see below).


---

# Addendum — Phase 2.5 motion inventory (updated)

Supersedes §2. Every animation, its trigger, and its reduced-motion behaviour.
Verified by `tests/qa.spec.ts` (`reduced motion renders the clause at final tracking`).

| # | What animates | Where | Trigger | Duration / easing | Reduced motion |
|---|---|---|---|---|---|
| 1 | **Preloader** — wordmark assembles letter by letter | First view of a session | Mount, once per session (`sessionStorage`) | 0.7s per letter, 45ms stagger; hard cap 1.8s, early dismiss at 1.15s | **Not rendered at all** |
| 2 | **Hero Ken Burns** — scale 1.0 → 1.06 | Homepage hero | Mount | 20s linear | No scale; the still is static |
| 3 | **Clause tail** — per-character `translateX`, never `letter-spacing` | Hero, section clauses | Mount, `animate` prop only | 1.05s, `cubic-bezier(0.16,1,0.3,1)`, 12ms stagger | No transform; final tracking, 0.25s fade |
| 4 | **Section reveal** — opacity + 24px rise | Every `Reveal` block | `whileInView`, once, −12% margin | 0.8s, ≤0.4s stagger | Opacity only, 0.25s |
| 5 | **Image reveal** — clip-path wipe + 1.05 → 1 | Collection figures, plates | `whileInView`, once | 1.1s / 1.2s | Replaced by a 0.25s fade |
| 6 | **Pinned Estate** — sticky viewport, scroll-linked veil 0.15 → 0.72 and media scale 1.04 → 1 | Homepage beat 05 | Scroll progress through a 260svh section | Scroll-linked | **Pin remains** (it is layout); veil fixed at 0.62, no scale |
| 7 | **Ground transition** — limestone → pelagos → limestone | Into and out of beat 05 | Section background | — | Unchanged; it is colour, not motion |
| 8 | **Custom cursor** — trailing dot, expands to a labelled disc | Desktop pointer-fine only | `pointermove`, label from `data-cursor` | 0.22 lerp; 0.3s size | **Not rendered** |
| 9 | **Magnetic CTA** — inner wrapper leans ≤10px toward the pointer | Primary CTAs | `pointermove` within the button | 0.45s spring back | **Disabled**; no listener attached |
| 10 | **Drag Register** — horizontal pointer drag | Experiences | `pointerdown` + move, pointer-fine only | Direct manipulation | Native scroll only |
| 11 | **Inventory group switch** | Villa pages | Click | 0.5s | Opacity only |
| 12 | **Expand in place** — Register cards, Inventory items | Homepage, villa pages | Click / Enter, real `aria-expanded` | CSS, instant | Unchanged — state, not decoration |
| 13 | **Smooth scrolling** (Lenis) | Document | Wheel | 1.1s exponential | **Disabled entirely** |
| 14 | **Global clamp** | Everything | — | — | All transitions 0.25s, animations ~0 |

**Refused, explicitly:** scroll-jacking, parallax on photography, carousel auto-advance,
hover-only affordances, animation on the booking ledger, and any motion that gates content.

**Touch:** Lenis, the custom cursor, magnetic CTAs and pointer-drag are all disabled when
`pointer: coarse`. The Register falls back to native horizontal scroll with snap.

**Performance:** nothing animates layout. The clause moves `transform`, the pin is CSS `sticky`
rather than a measured GSAP pin (it cannot desynchronise from the scrollbar and needs no layout
read), and the hero image is `priority` + `fetchPriority="high"`. CLS budget remains 0.

---

# Addendum — Phase 3 motion inventory DELTA

Against the Phase 2.5 table above. Only what changed. The full site inventory is
that table **plus** these rows, minus nothing.

## Newly present on villa and estate pages (inherited, not invented)

| # | What animates | Where it is new | Trigger | Duration / easing | Reduced motion |
|---|---|---|---|---|---|
| 6 | **Sea-light** — two radial gradients drifting on the deep ground | Villa beat 02 (`.villa-statement`) | Autoplay, 74s alternate | 74s ease-in-out, infinite alternate | Clamped to ~0 by the global rule; the gradient remains as static light |
| 8 | **Contextual cursor** | **Every page.** It was mounted on `/` only | `pointermove` | 0.22 lerp | Not rendered |
| 9 | **Magnetic CTA** | Villa "Check availability" | `pointermove` within the button | 0.45s spring back | Disabled; no listener attached |
| 13 | **Lenis smooth scroll** | **Every page.** It was mounted per page | Wheel | 1.1s exponential | Disabled entirely |
| — | **Count-up** (existing element, new placement) | Villa spec ledger, four figures | First entry, `once` | 600ms, weighted cubic | Final value printed; truth is the default state (§7) |
| — | **Section reveal** (existing) | Villa beat 02 clause and prose columns | `whileInView`, once | 0.8s | Opacity only |

## Added to the motion system

Nothing. Every row above is an existing device reaching a page it did not
previously reach. **No new animation was authored for Phase 3.**

## Static, deliberately — things that could have moved and do not

| What | Why it is still |
|---|---|
| **Ghost numerals** (villa 02/05, estate 02) | Atmosphere, not event. A moving 34rem numeral is a screensaver. |
| **The `03 — The rooms` marker + datum rule** | A marker before photography must not delay the photograph. |
| **`.run-scrim`** | A legibility ground. Fading it in would make the caption briefly unreadable, which is the defect it was added to fix. |
| **The plate lift** (`box-shadow` on `.plate-figure`) | Depth is a property of the object, not an entrance. |
| **The letterbox** | Spent once, on the helipad beat, by ruling. Not reused on villa pages. |
| **The scroll odometer** | A homepage closing device. A villa page is a single-subject document and does not close the same way. |
| **The preloader** | Once per session, on entry. A deep link from search should open, not perform. |

## Reduced motion — verified, not asserted by inspection

Unchanged in kind: `tests/qa.spec.ts` still verifies the reduced-motion state
programmatically. The two hoisted devices (Lenis, cursor) read
`prefers-reduced-motion` inside their own effect and return before attaching any
listener, so hoisting them into the layout widened their reach without widening
what they do under `reduce`.

**Performance:** unchanged. Nothing added animates layout. The one new painted
surface is a `box-shadow` on bounded plates and a gradient span on captioned run
frames — both composited, neither on the critical path. CLS budget remains 0.

---

# Addendum — Phase 3 captures

`qa/phase3/`, regenerated by `npx playwright test tests/phase3-shots.spec.ts`.

| File | What it shows |
|---|---|
| `sidebyside-{1440,390}-01-arrival.png` | Beat 01 — Eeanthe and Pueblo heroes, same width, same frame |
| `sidebyside-{1440,390}-02-the-house.png` | Beat 02 — the deep passage, sea-light, ghost numeral, spec ledger |
| `sidebyside-{1440,390}-03-the-rooms.png` | Beat 03 — **the comparison that matters**: the run (104 photographs) against the plates (5) |
| `sidebyside-{1440,390}-04-inside.png` | Beat 04 — the inventory, 137 provisions against 55 |
| `nav-a-transparent-{1440,390}.png` | The nav over the hero — no background, no rule |
| `nav-b-glass-{1440,390}.png` | The nav after the hero — `backdrop-filter` visibly blurring the copy beneath it |
| `nav-c-panel-390.png` | The panel open. Below 1024 only: on desktop the register is inline and the toggle is `display: none`, so there is no third state |

Both panes are real pages in same-origin iframes — genuine origin, genuine fonts,
genuine image pipeline. Each pane is walked to its beat **by selector**, never by
a precomputed offset, because lazy images move the geometry as they load. That is
the T-203b lesson applied to the capture harness (`CONVENTIONS.md` §10).
