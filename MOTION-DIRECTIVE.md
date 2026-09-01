# F+ Motion — the motion directive for Direction F

The owner's motion brief for the production direction (`DECISIONS.md` D-001),
recorded here so it is a document rather than a message. Where the build has
departed from it, the departure is noted inline and the reason is in
`RE-SKIN-DIRECTIVE.md` §6d.

---

## TL;DR

- Build a three-tier **weirdness dial** and apply it surgically: the hero, one
  villa-card interaction, and the estate/weddings moment carry Level-3 cinematic
  set-pieces; the manifesto and Discover-Crete sections run Level-2 memorable
  motion; the experience grid, press wall, footer and the Book Now affordance
  stay at Level-1 quiet refinement. This delivers the "cinematic + περίεργα"
  wish without touching the dense hotel IA or burying conversion.
- The "unusual but luxurious" register is WebGL/shader image motion
  (displacement, ripple, RGB-fringe, gooey reveals) plus scroll-scrubbed
  reveals, sticky card decks, split-text masks and mask/curtain section wipes —
  every technique with a touch fallback and a `prefers-reduced-motion` fallback.
- **Core Web Vitals are hard gates, not aspirations:** LCP ≤2.5s, INP ≤200ms,
  CLS ≤0.1, at the 75th percentile of real page views. Poster-first hero, never
  lazy-load the LCP element; WebGL lazy-loaded behind IntersectionObserver and
  capped at one live canvas; total added motion JS ~55–70 kB gzip, with the
  WebGL layer never blocking first paint.

---

## A. Motion principles (the constitution)

1. **Conversion is sacred.** No effect may overlap, delay, or obscure the pinned
   top-right Book Now, the villa-card "Check availability", or any booking bar.
   The Book affordance never animates beyond a ≤150 ms hover/opacity state.
2. **Motion decorates structure; it never replaces it.** The dense Direction-F
   IA stays fully intact and legible with JS disabled.
3. **One set-piece per screenful.** Never two Level-3 effects in one viewport.
4. **Transform and opacity only.** Never animate layout properties.
5. **Poster-first, lazy-everything-else.** The hero LCP element is a poster
   image with `fetchpriority="high"`, never lazy-loaded.
6. **Reduced motion is a first-class path**, collapsing to a simple fade or a
   static state.
7. **Legibility is inviolable.** Display type ≤96px; text motion never leaves
   copy blurred, mid-scramble, or clipped at rest.
8. **Touch has no hover.** Every hover effect has a touch equivalent or is
   disabled via `(hover: none)`.

## B. The weirdness dial

- **Level 1 — Subtle refinement.** Fades, 200–400 ms staggered reveals, gentle
  parallax (≤8% travel), hover zoom (scale ≤1.04), underline/mask link states.
- **Level 2 — Memorable.** Split-text mask reveals, scroll-scrubbed "breathing"
  images, sticky stacked card decks, colour-ground transitions, count-ups.
- **Level 3 — Bold set-piece.** WebGL displacement/gooey transitions, a
  scroll-scrubbed cinematic hero, a curtain/mask reveal, a drag-to-explore
  strip. **Maximum two or three on the page**, lazy-loaded, single canvas.

### Default level per section

| Section | Level |
|---|---|
| Hero | 3 |
| Manifesto | 2 |
| Six villa cards | 3 (one signature interaction) on a Level-1 grid |
| 21 experience cards | 1 — density is the point; they must stay scannable |
| Weddings & Events | 3 (or 2) |
| Discover Crete | 2 |
| Press & awards wall | 1 |
| Footer / booking bar | 1 — micro-states only |

## C. The villa-card signature interaction

WebGL displacement toward the cursor, **scale ≤1.04, displacement ≤6%, slow
lerp, no loud RGB split.** Luxury rating 8/10 if it stays a whisper; gimmicky
above ~10% warp. One shared canvas, textures per card, lazy-loaded when the
villa section nears the viewport, context destroyed on scroll-away.

- **Touch:** no hover, so the shader binds to the card's in-view state — a
  one-shot gentle ripple as the card scrolls in — and hover distortion is
  disabled via `(hover: none)`.
- **Reduced motion:** plain CSS crossfade; no WebGL initialised at all.

## D. Text that lives, without illegibility

**Do:** line/word mask reveals, gentle character stagger on short labels,
scroll-scrubbed editorial reveal on the manifesto, hover underline/mask on
links, count-ups, one restrained scramble on a short kicker at most.

**Avoid:** per-character animation on long paragraphs; scramble/typewriter on
headings the user must read immediately (also an LCP risk); blur-in that leaves
text soft; display type over 96px; text that re-animates every scroll pass;
low-contrast reveal states; splitting text without restoring `aria-label`.

## E. Avoid-list

- Full-screen WebGL fluid backgrounds behind everything.
- Scroll-jacking that ignores user input.
- Oversized illegible display type (>96px).
- Loud RGB glitch, heavy chromatic aberration, or >10% image warp.
- Cursor-distortion on the whole page.
- **Custom cursors that hide the real pointer over Book Now or form fields.**
- Marquees or carousels as the LCP element above the fold.
- Two Level-3 set-pieces in one viewport; any effect on the booking control.
- Animating layout properties.
- Lazy-loading the hero LCP image/poster.

## F. Libraries and budget

Lenis (~3 kB) for smooth scroll, synced to the GSAP ticker. GSAP core (~23 kB) +
ScrollTrigger (~10 kB) + SplitText (~7 kB, free since 3.13). Framer Motion for
gestures. A minimal WebGL layer for the villa-card shader. **Total added motion
JS ~55–70 kB gzip**, with WebGL and video deferred so first paint ships only
Lenis and GSAP core.

## G. Phased build, with gates

- **Phase 1 — cinematic hero + text life.** Ken Burns crossfade hero,
  poster-first LCP, scroll letterbox/parallax handoff, SplitText manifesto,
  staggered reveals, Lenis + GSAP wired, full reduced-motion path.
  *Gate:* LCP ≤2.5s, CLS ≤0.1, INP ≤200ms at p75; reduced motion verified; Book
  Now never obscured; display type ≤96px.
- **Phase 2 — signature interactions.** Villa-card displacement (lazy, single
  canvas, touch in-view fallback), weddings sticky deck or drag strip,
  Discover-Crete parallax and count-ups, View Transitions to villa detail.
  *Gate:* INP still ≤200ms with WebGL active on a mid-range Android; WebGL
  deferred out of the first-paint bundle; every effect has touch and
  reduced-motion branches; one canvas maximum.
- **Phase 3 — section cinema.** Colour-ground transitions, one or two
  mask/curtain seams, press-wall polish, final easing pass.
  *Gate:* all CWV hold at p75; no effect increases CLS; total motion JS ≤~70 kB
  gzip.

## H. Benchmarks that change the plan

- Field INP p75 > 200 ms → disable WebGL on coarse pointers entirely, fall back
  to CSS crossfades.
- CLS p75 > 0.1 → audit for any layout-animating effect; reserve space for all
  media.
- Mobile bounce rises after Phase 2 → dial the villa-card and weddings
  set-pieces from Level 3 down to Level 2.

---

## Departures, and why

**The footer unveil is CSS, not ScrollTrigger.** A fixed layer behind an opaque
page produces the identical reveal with no scroll listener, no measurement and
no possibility of layout shift. ScrollTrigger is used for the thing it is better
at — staggering the footer's content as it arrives — and is lazily imported.

**The p75 field gate cannot be met from this repository.** CrUX reports on real
visitors' browsers and the site is not deployed. Every CWV figure recorded here
is a **lab** measurement under 4× CPU and Slow 4G throttling, and says so in its
own output. A lab pass is necessary, not sufficient.
