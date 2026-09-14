# Client islands — the inventory (tranche twelve)

Every `"use client"` module under `src/`, the routes whose server modules import it, what it needs from the browser, and whether it could be server-rendered or mounted lazily. Written because the performance pass asked for fewer islands and the pass's own count went up by one (33 → 34, `LazyClause`), with no inventory to say where the rest were.

**Method, read-only.** `grep -rl '^"use client"' src` for the modules (34 at HEAD `56cb859`, 35 with this change's `LazyCustomCursor.tsx`). Then a static import walk from every `src/app/**/page.tsx`, `layout.tsx`, `not-found.tsx` and `error.tsx` — static imports, re-exports and `import()`, resolving `@/` and relative paths, `import type` skipped. Served-output claims are from `next start` on :3005 (build `zvZmrT7ejPvvMsQp89xck`), the build's `page_client-reference-manifest.js` files, and a disk grep of `.next/static/chunks`. No build, no browser.

**Three words, used strictly below.**

- A **boundary** is a `"use client"` module that a *server* module imports. One imported only by another client module is part of that island's bundle, marked **nested**.
- A module **ships** on a route when its code is in that route's client chunks. That is claimed below only where a manifest or chunk grep is cited.
- A module **hydrates** only where the page actually renders an instance of it. The import walk does not check rendering, so a boundary list is an upper bound on what hydrates.

## What every route ships, and what of it hydrates

Three trees reach every route, the homepage included:

| tree | client modules | ships on every route | hydrates on every route | cited |
|---|---|---|---|---|
| Root layout | `SmoothScroll`, `LazyCustomCursor` (was `CustomCursor`), `RouteTransition`, `SiteNav` (with `LanguageSwitcher` nested) | yes | **yes** — the layout renders all four on every page. `LazyCustomCursor` renders `null` until its import resolves, and `LanguageSwitcher` renders `null` while one locale is published; both still hydrate | `src/app/layout.tsx:4-7`, `:185-188` |
| Root 404 | `LazyClause` — twice, the 404's own clause and the one in the `SiteFooter` it renders | yes: the App Router serialises the root 404 element into every page's payload (`src/components/ui/LazyClause.tsx:10-18`, measured in tranche twelve) | **no** — it renders only on a 404. The `Clause` it wraps loads only where one renders | `src/app/not-found.tsx:6`, `src/components/sections/SiteFooter.tsx:5` |
| Root error boundary | `src/app/error.tsx` — Next requires error boundaries to be client components | yes: `[project]/src/app/error.tsx` is listed in the client-reference manifest of `/` and of `/en/villas/[slug]`, in chunks `2rtltvcbcs1l6.js` (the shell chunk) and `2wk6p2tl_v13d.js` | **no** — it renders only when a segment below it throws | `src/app/error.tsx:1` |

So every route hydrates the root layout's four boundaries. It also ships, without rendering them, the client references of the root 404 tree (`LazyClause`) and of `error.tsx`.

Before this change the cursor sat inside the site shell's chunk: `2rtltvcbcs1l6.js` (15,542 B) contains `CustomCursor` and `has-custom-cursor` next to `skip-link`, `nav-toggle` and `d-wipe`, and it is in the initial scripts of `/`, `/en/villas/villa-thoi`, `/en/the-estate` and `/en/experiences` alike.

## Per route — the boundaries the walk finds on top of the trees above

| route | boundaries (server importer:line) | nested inside them |
|---|---|---|
| `/` | `HotelHero`, `FooterReveal`, `LiquidCards`, `HotelMotion`, `Distances`, `VillaMorph` — all from `src/components/hotel/HotelPage.tsx:4-9` (`src/app/page.tsx:3`) | — |
| `/en/villas/[slug]` | `Magnetic` :6, `ViewTransitionTarget` :7, `Reveal`/`ImageReveal` :8, `Inventory` :9, `BookingLedger` :12, `Clause` :13; `Reveal` again through `TheRun` :11 | — |
| `/en/the-estate` | `Magnetic` :4, `Reveal` :5, `EstateMap` :6, `Inventory` :7, `Clause` :10, `Ledger` :12; `Reveal` through `TheRun` :9 | `EstateMap` → `Clause`, `Ledger`, `Magnetic` |
| `/en/weddings` | `Magnetic` :4, `Reveal` :5, `Inventory` :6, `Clause` :9; `Reveal` through `TheRun` :8 | — |
| `/en/experiences` | `DragRegister` :3 | — |
| `/en/experiences/[slug]` | `Reveal`/`ImageReveal` :6 | — |
| `/en/gallery` | `GalleryGrid` :3 | `GalleryGrid` → `ImageReveal`, `Lightbox` |
| `/en/location` | `Reveal`, `Clause` through `src/components/sections/CoastLine.tsx:1-2` | — |
| `/en/contact` | `Reveal` :3, `EnquiryForm` :5 | — |
| `/en/careers`, `/en/terms` | `Reveal` :3 | — |
| `/styleguide` | `Clause` :3 | — |

Line numbers are the import lines in each route's `page.tsx` unless another file is named. This table shows what each route's server modules import. Whether a given boundary is shipped was checked only where cited (the cursor above, framer-motion below). Whether it hydrates on a given page depends on that page rendering it, which was not checked instance by instance.

**framer-motion.** Its chunk `3p7yrr41uomgy.js` (the only chunk containing `framerAppearId`/`MotionConfigContext`) is in the initial scripts of villa-thoi, the-estate and experiences, and not `/`. The modules under `src/` that import `framer-motion` and that some route reaches are `Reveal`, `Clause`, `Inventory` and `Ledger`. `/en/experiences` imports none of them directly; the only one its walk reaches is `Clause`, through `LazyClause`'s `next/dynamic` import in the footer. Why the framer chunk is nevertheless an initial script there was not established.

## Every client module

"Needs" is what it reads or does in the browser. "Could it be server / lazy" is a judgement, and nothing in that column was changed except the cursor.

| module (lines) | boundary on | needs in the browser | server-rendered or lazily mounted? | status |
|---|---|---|---|---|
| `motion/SmoothScroll.tsx` (97) | every route | `matchMedia` pointer + motion, `usePathname`, rAF, Lenis | The wrapper must be mounted to re-measure after each navigation; Lenis is already imported only where it runs | eager wrapper, Lenis deferred (D-012) |
| `motion/LazyCustomCursor.tsx` (70, new) | every route | `matchMedia` ×2, `querySelector('[data-look="hotel"]')`, `import()` | — it is the lazy mount | eager: three checks, then `import()` of `CustomCursor`, a rejected import caught and dropped |
| `motion/CustomCursor.tsx` (111) | nested, imported only by `LazyCustomCursor`: desktop Direction D pages | `pointermove`, rAF loop, body class | **now mounted lazily** | **deferred by this change**; on the rebuilt candidate it is a chunk of its own (`2-2o1ua-qpmde.js`, 1,328 B), and no prerendered D page names it as an initial script |
| `motion/RouteTransition.tsx` (86) | every route | `usePathname`, moves focus to `#main`, `matchMedia`, a DOM sheet | Has to be mounted before the first client navigation, because it moves focus for keyboard and screen-reader users (`tests/direction-d.spec.ts`). No dependencies | eager — critical, accessibility |
| `ui/SiteNav.tsx` (171) | every route | scroll listener (glass), menu state, focus management, Escape | The markup could be server-rendered with a small toggle island. On `/` the whole nav hydrates although `body:has([data-look="hotel"]) .nav` is `display: none` (`src/app/sections.css:459-462`); only its skip link is live there | eager — **non-critical on `/`, left eager**: separating the skip link and not mounting the nav on F is a layout restructure outside this workstream, and it needs an A/B |
| `ui/LanguageSwitcher.tsx` (107) | nested in `SiteNav` | `usePathname`, `useState` | Renders `null` while one locale is published (`PUBLISHED_LOCALES` gate). The gate could run on the server if `SiteNav` is split | eager, negligible |
| `app/error.tsx` (51) | every route (ships; renders only on an error) | `useEffect` (console) | No — framework requirement | shipped by framework |
| `ui/LazyClause.tsx` (28) | every route (root 404 tree; ships, renders only on a 404) | nothing itself | Already lazy (D-012) | shipped wrapper, `Clause` deferred |
| `ui/Clause.tsx` (95) | villas, the-estate, weddings, location, styleguide; lazily everywhere else | framer-motion, `useId` | Text is server-rendered; only the animation needs the client. A CSS animation would take framer off every D page | eager where imported — **non-critical, left eager**: a motion-design change needing the motion budget, visual check and phase specs |
| `motion/Reveal.tsx` (91) | villas, the-estate, weddings, careers, contact, terms, experience detail, location; nested in gallery | framer `whileInView`, `useReducedMotion` | Every `<Reveal>` instance hydrates separately. One IntersectionObserver island toggling CSS classes (the `Distances`/`VillaMorph` pattern) would cut D pages' island count most | eager — **non-critical, left eager**, same reason as `Clause` |
| `motion/Magnetic.tsx` (60) | villas, the-estate, weddings; nested in `EstateMap` | `pointermove` on a fine pointer, `matchMedia` | Wraps server-rendered children, so it can't simply mount later. It could be one delegated listener. Phones evaluate it to reach its early return, like the cursor did | eager — **non-critical, left eager**: small, and the delegated rewrite touches three pages |
| `motion/ViewTransitionTarget.tsx` (40) | villas | `useLayoutEffect`, `data-vt` on `<html>` | Must name the hero before first paint | eager — critical to the morph |
| `sections/Inventory.tsx` (160) | villas, the-estate, weddings | tab state, framer, `useReducedMotion` | Tabs need state; could be server markup with native radio/CSS | eager; candidate |
| `ui/BookingLedger.tsx` (156) | villas | form state, `new Date()` for `min` | The booking affordance; conversion is sacred (`MOTION-DIRECTIVE.md` rule 1) | eager — critical |
| `ui/Ledger.tsx` (100) | the-estate; nested in `EstateMap` | framer `useInView` count-up | Could follow `Distances`: server truth by default, one island animates | eager; candidate |
| `sections/EstateMap.tsx` (166) | the-estate | hotspot open state | Needs state; below the fold | eager; candidate for deferred hydration, not attempted |
| `sections/DragRegister.tsx` (216) | experiences | drag, chips, hash, open state | It is the page's content | eager — critical for that page |
| `sections/GalleryGrid.tsx` (94) | gallery | open index | Grid could be server markup with one delegated island | eager; candidate |
| `sections/Lightbox.tsx` (166) | nested in `GalleryGrid` | `<dialog>`, focus, keys | Needed only at the first open, so it could mount then | eager — **non-critical, left eager**: `/en/gallery` had no baseline when this inventory was written. It has one now (`AB-tranche12-final.md`), and the change was still not attempted in this pass |
| `ui/EnquiryForm.tsx` (223) | contact | form state, validation, focus | It is the page | eager — critical |
| `hotel/HotelHero.tsx` (128) | `/` | slider interval, click state, `matchMedia` | Holds the LCP image, server-rendered; hydration is for the slider | eager — critical |
| `hotel/HotelMotion.tsx` (443) | `/` | `matchMedia`, `ResizeObserver`, idle; GSAP by `import()` | GSAP and the setup already wait for idle (D-012) | eager module, deferred work |
| `hotel/Distance.tsx` (89) | `/` | one IntersectionObserver | One island by design | eager, small |
| `hotel/VillaMorph.tsx` (103) | `/` | delegated click / pointer / focus, router, View Transitions | One island over plain anchors by design | eager |
| `motion/FooterReveal.tsx` (134) | `/` | IntersectionObserver; GSAP by `import()` | GSAP already deferred | eager module, deferred work |
| `motion/LiquidCards.tsx` (328) | `/` | pointer events, WebGL, IntersectionObserver — nothing on touch or under `reduce` | The same shape as the cursor was: a phone evaluates the whole module to reach "nothing is initialised" | eager — **non-critical, left eager**: the obvious next candidate for the `LazyCustomCursor` treatment, but its files (`LiquidCards.tsx`, `HotelPage.tsx`) are outside this workstream and `/` is the route whose A/B is the reference, so it needs its own |

### Reached by no route (9)

`motion/KenBurns.tsx`, `motion/Preloader.tsx`, `motion/WordMask.tsx`, `sections/ActsSection.tsx` (and `ActShowcase.tsx`, imported only by it), `sections/Litany.tsx`, `sections/PinnedEstate.tsx`, `sections/Register.tsx`, `ui/Odometer.tsx`. No file under `src/` imports them, so they ship on no route and cost nothing at runtime. The server modules `sections/Hero.tsx`, `Collection.tsx` and `Estate.tsx`, which import `Clause`/`Reveal`, are likewise unimported (`src/lib/homepage.ts:16` takes only a type from `Collection`). Deleting them is housekeeping, not performance.

## The result

- **Island count was not reduced.** Boundaries per route are unchanged: the layout's cursor boundary is now `LazyCustomCursor` instead of `CustomCursor`, and the file count rises to 35.
- **What changed is when the cursor's code is requested.** In the source, `import("./CustomCursor")` runs only on a page with a fine pointer, motion allowed and no `[data-look="hotel"]`. Both halves were checked against the rebuilt candidate. The build moves the module out of the shell chunk into a chunk of its own (`2-2o1ua-qpmde.js`, 1,328 B). A request log on `/en/villas/villa-thoi` shows that chunk fetched once on a desktop with motion allowed, where one `.cursor` renders. It is not fetched on a touch phone or on a reduced-motion desktop, and not on `/` (Direction F) on desktop; none of those renders a cursor.
- **"Defer every non-critical script" is partly done: only the cursor moved.** No per-route inventory of initial chunks, each marked critical or not, was produced; this document inventories modules. What stays eager, with the reason:
  - **framer-motion on the D pages.** It is in the initial scripts of villa-thoi and the-estate through `Reveal`, `Clause`, `Inventory` and `Ledger`, and of experiences for a reason not established. Taking it off means moving those four onto CSS plus one observer. That is a motion-design change, needing the motion budget, a visual comparison and the phase specs, in files outside this workstream.
  - **`Magnetic`**, evaluated by phones to reach its early return. It wraps server-rendered children, so it cannot simply mount later.
  - **`SiteNav` on `/`**, which needs a layout split.
  - **`LiquidCards` on `/`**, whose files are outside this workstream and whose route is the A/B reference.
  - **`Lightbox`**, on a route that had no baseline when this was written. It has one now, in `AB-tranche12-final.md`.
- **The levers that would reduce islands are motion-design changes** (`Reveal`, `Clause`, `Inventory`, `Ledger` onto CSS plus one observer), or layout restructures (`SiteNav` on F). Each needs the motion budget, a visual comparison and its own A/B. None was attempted here.

## The cursor change, and the one behaviour it deliberately keeps

`LazyCustomCursor` runs the cursor's three checks: `(pointer: fine)`, not `prefers-reduced-motion: reduce`, and no `[data-look="hotel"]`. Only then, inside the effect, does it call `import("./CustomCursor")`, and it renders the component once the module has arrived. This is the pattern `SmoothScroll.tsx` uses for Lenis, with one addition: the rejection is caught and dropped. That matters because the root layout's children sit outside `app/error.tsx` and there is no `src/app/global-error.tsx`. A render-time throw from the cursor (`React.lazy` rethrows a rejected import) would replace the whole document with Next's default error screen. With the catch, a failed cursor chunk leaves the page as it is, without a cursor. `CustomCursor` keeps its own checks. Nothing renders on the server, so the HTML is unchanged and no Suspense segment is streamed. `tests/perf-structure.spec.ts`'s hidden-segment check was expected to be unaffected, and it passed within the full QA run on the rebuilt candidate (553 passed / 0 failed).

**Once per document, as before.** The root layout persists across client navigations, and both effects have empty dependency lists, so the decision is made on the first page loaded:

- Land on `/` and click into a villa: no cursor until a reload. This was already true, because `CustomCursor` returned at the hotel check and never re-ran.
- Land on a villa and navigate home: the cursor stays mounted, with its rAF loop, under the CSS rule that hides it (`sections.css:461`). This was also already true.

Fixing either changes desktop behaviour, which this workstream was told not to do. It is recorded here for a decision.

**Tests that touch the cursor.**

- `tests/villa.spec.ts:241-247` loads `/en/villas/villa-melia` in the `chromium` project (Desktop Chrome: fine pointer, motion allowed), moves the mouse, and expects `.cursor` to have count 1.
  - `toHaveCount` retries, and the import starts at hydration, so the test is expected to hold.
  - It passed within the full QA run on the rebuilt candidate (553 passed / 0 failed), so desktop behaviour on the D pages is unchanged as far as that test reaches. The one known difference on the success path is one extra chunk request before the cursor mounts.
- `tests/visual.spec.ts` emulates reduced motion, so no cursor rendered there before or after.
- No test asserts `has-custom-cursor`, and none covers a failed cursor chunk. A `page.route` abort of that chunk, asserting that `main` stays visible, is suggested for the coordinator.
