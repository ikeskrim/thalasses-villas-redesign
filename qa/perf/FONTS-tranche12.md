# Font loading — the audit (tranche twelve)

Every face the site declares: its file, bytes, subset, preload flag and display, and the routes that use it. Nothing about font loading was changed. Every recommendation at the end needs a serial measurement first.

**Sources, read-only.** Declarations: `src/app/layout.tsx:26-105` and `src/app/styleguide/FontAB.tsx:11-26`. Bytes: `ls -la src/app/fonts`, identical to the built `.next/static/media/*.woff2`. Subsets: the `cmap` table of each vendored WOFF2, decompressed and read directly (script in the session scratchpad, `cmap.cjs`). Emitted `@font-face` rules: `.next/static/chunks/15wqfvj3pc1uj.css` and `0jqyx72ndbg-g.css`. Usage: every CSS rule whose `font-family` names a face variable, directly or through `--font-display`, `--font-sans`, `--font-display-sc`, `--font-italic`, `--ho-serif` or `--ho-sans`, matched against the classes present in the served HTML of `/`, `/en/villas/villa-thoi`, `/en/the-estate` and `/en/experiences` (GETs to :3005, build `zvZmrT7ejPvvMsQp89xck`). Class matching is a static approximation, not a network log.

## The faces

| face | file | bytes | subset (from `cmap`) | preload | display | fallback metrics | used by (CSS) |
|---|---|---|---|---|---|---|---|
| Marcellus | `marcellus-latin.woff2` | 14,552 | latin: 214 code points, all 95 of U+0020–007E, `é ü — ’ €`, no `Ā` | **true** (`layout.tsx:30`) | swap | Times New Roman | `--font-display` (`globals.css:109`): `.display` (`register.css:16`), `.nav-mark` (`patterns.css:567`), `.d-spec-value` (`direction-d.css:416`), `.ghost` (`atmosphere.css:76`), `.acts-tab-label`, `.odometer-value`, `.preloader-word` |
| Marcellus SC | `marcellus-sc-latin.woff2` | 14,508 | latin: 214, same coverage | **true** (`layout.tsx:59`) | swap | Arial (default) | `--font-display-sc` (`atmosphere.css:8`): `.micro`, `.acts-tab-index`, `.ledger-spec dt`, `.ledger-inline .micro` (`atmosphere.css:170-176`) |
| Cormorant Italic | `cormorant-italic-latin.woff2` | 23,660 | latin: 231 | false (`layout.tsx:67`) | swap | Arial (default) | `--font-italic` (`atmosphere.css:9`): `.aside-italic` (`atmosphere.css:180`), `.d-villa-lede` (`direction-d.css:428`) |
| Inter | `inter-latin.woff2` (variable 400–500) | 48,256 | latin: 230, all of U+0020–007E | **true** (`layout.tsx:39`) | swap | Arial | `body` (`globals.css:203`), `.clause-tail`, `.ledger-input`, `.cursor-label`; `--ho-sans` (`hotel.css:45`) on `/` |
| Literata (latin) | `literata-latin.woff2` | 110,080 | latin: 230, all of U+0020–007E | false (`layout.tsx:93`) | swap | Times New Roman | `--ho-serif` (`hotel.css:44`) under `[data-look="hotel"]`: `.ho-mark`, `.ho-hero-copy h1`, `h2`, `.ho-card h3`, `.ho-mantinada blockquote`, `.ho-credential`, `.ho-quote blockquote`, `.ho-press a strong` |
| Literata (latin-ext) | `literata-latin-ext.woff2` | 89,668 | latin-ext: 334 code points, **2 of 95** in U+0020–007E, has `Ā ő`, lacks `é ü` | false | swap | (same family) | same as above — the second `src` of the same loader |
| Literata Greek | `literata-greek.woff2` | 41,144 | greek: 92, has `Α` | false (`layout.tsx:103`) | swap | Arial (default) | second family in `--ho-serif`: glyphs Literata lacks |
| Cormorant Garamond | `cormorant-garamond-latin.woff2` | 22,876 | latin: 229 | false (`FontAB.tsx:15`) | swap | Arial (default) | `.ab-cormorant` (`villa.css:394`) — `/styleguide` only |
| GFS Didot | `gfs-didot-latin.woff2` + `gfs-didot-greek.woff2` | 14,540 + 7,192 | latin 219 / greek 91 | false (`FontAB.tsx:25`) | swap | Arial (default) | `.ab-gfs` (`villa.css:398`) — `/styleguide` only, in its own CSS chunk `0jqyx72ndbg-g.css`, linked by none of the four sampled pages |

**Cascade note.** `.micro` is declared twice: Marcellus SC in `atmosphere.css` (layer `components`) and Inter in `register.css:117` (layer `register`). `components` is the later layer in the order statement (`globals.css:73`) and in the served order `tests/cascade-served.spec.ts` asserts, so `.micro` is set in Marcellus SC.

## What each page preloads (served HTML)

All four sampled pages carry the same three `<link rel="preload" as="font">`, because all three loaders live in the root layout:

| page | `inter_latin` 48,256 | `marcellus_latin` 14,552 | `marcellus_sc_latin` 14,508 | total | Literata / Cormorant preloaded |
|---|---|---|---|---|---|
| `/` | yes | yes | yes | 77,316 B | no |
| `/en/villas/villa-thoi` | yes | yes | yes | 77,316 B | no |
| `/en/the-estate` | yes | yes | yes | 77,316 B | no |
| `/en/experiences` | yes | yes | yes | 77,316 B | no |

## Which routes use what

| face | `/` | villa-thoi | the-estate | experiences |
|---|---|---|---|---|
| Inter | body, `--ho-sans` | body | body | body |
| Marcellus | **no rendered text** — `.display` ×6 and `.nav-mark` sit inside `<header class="nav">`, which `body:has([data-look="hotel"]) .nav { display: none }` removes (`sections.css:459-462`) | `.display`, `.nav-mark`, `.d-spec-value` | `.display`, `.nav-mark`, `.ghost` | `.display`, `.nav-mark` |
| Marcellus SC | the skip link only (`.skip-link.micro`, off-screen at `left: -9999px`, `patterns.css:525-533`; laid out, so its font is requested) plus two `.micro` inside the hidden nav | `.micro` | `.micro`, `.ledger-spec dt` | `.micro` |
| Cormorant Italic | no | `.d-villa-lede` | `.d-villa-lede` | `.d-villa-lede` — **the LCP element** (`P.d-villa-lede` in every phone run of `AB-tranche12-trace.md`, LCP = FCP) |
| Literata latin + latin-ext | the wordmark, hero `h1`, section `h2`s, card `h3`s | no | no | no |
| Literata Greek | yes: the served HTML carries 32 runs of Greek text (the mantinada, `Να χα τη θάλασσα κρασί…`) | no | no | no |

The remaining templates (weddings, gallery, location, contact, careers, terms, experience detail, the 404) share the same stylesheet and root layout, so they preload the same three files. Their class usage was not checked.

## Findings

1. **`/` preloads two faces it does not paint with at load.** Marcellus (14,552 B) serves no rendered text on the F homepage. Marcellus SC (14,508 B) serves an off-screen skip link. Both are fetched at preload priority on Slow 4G, alongside the LCP photograph (`AMZ_7855.jpg`, `fetchpriority="high"`).
2. **Literata's latin-ext file downloads for nothing.** `next/font/local` emits the two `src` entries as two `@font-face` rules for family `literata` with identical descriptors and no `unicode-range` (built CSS, latin first, latin-ext second). CSS Fonts resolves overlapping faces in a composite family from the last-defined one, and a face without `unicode-range` claims every code point. So for Latin text the browser has to fetch `literata-latin-ext.woff2` before it can learn the file lacks the glyph (its `cmap` has 2 of the 95 basic Latin code points), and then fetches `literata-latin.woff2`. **Confirmed: both files, 199,748 B, on `/`.** A network log of the final candidate on the phone profile, taken once the serial trace runs had finished, shows `/` requesting `literata_latin_ext` and `literata_latin`. `/en/villas/villa-thoi` requests neither. The inventory's non-ASCII Latin ("Schüco", "Kährs") is inside U+00C0–00FF, which the latin file covers.
3. **Literata Greek (41,144 B) is needed on `/`**, for the Greek mantinada (`.ho-mantinada blockquote`, a section of its own, not the hero). It is not preloaded; where that section sits against the fold at 390 px was not checked.
4. **The LCP text on `/en/experiences` is set in Cormorant Italic, which is not preloaded.** LCP equals FCP in every run, so the metric counts the fallback paint. Preloading would change how long the fallback shows, not the LCP figure.
5. **Vendored and never referenced:** `inter-latin-ext.woff2` (85,068 B), `marcellus-latin-ext.woff2` (8,912 B), `inter.css` (2,504 B) and `marcellus.css` (856 B). A grep of `src`, `scripts` and `tests` finds no reference, and none is in `.next/static/media`, so they cost nothing at runtime. `layout.tsx:21-24` already says the latin-ext files are kept deliberately. `cormorant-garamond-latin` and both GFS Didot files are referenced only by `/styleguide`.

## Recommendations — none applied; each needs a serial A/B

| # | change | expected effect | how to measure |
|---|---|---|---|
| R1 | Stop preloading Marcellus and Marcellus SC on `/`. Either move both loaders out of the root layout into a layout that wraps only the Direction D routes, or keep them site-wide with `preload: false` | `/`: two fewer preload requests (29,060 B) competing with the LCP image; FCP/LCP on the phone profile may improve slightly. D pages: unchanged with a D-only layout. With `preload: false`, the D hero's clause and micro labels swap later, so watch CLS | `hotel-cwv` on `/` and one D page, A/B, medians of 3; check a network log that neither file is requested on `/` |
| R2 | Give the two Literata faces disjoint ranges: two loaders with `declarations: [{ prop: "unicode-range", … }]`, stacked in `--ho-serif`. Or drop latin-ext if no Literata surface needs characters beyond U+00FF | Up to −89,668 B on `/`; the network log confirmed finding 2 | `hotel-cwv` on `/`, A/B, plus a network log showing `literata_latin_ext` no longer requested |
| R3 | (Consider only after R1 and R2) preload `literata-latin` on `/` instead of the two Marcellus files | The hero `h1` and wordmark swap sooner. It also competes with the LCP photograph (+81 kB net), the reason `layout.tsx:83-84` gives for not preloading. Could go either way | A/B on `/`: LCP, FCP, CLS |
| R4 | Keep Inter preloaded everywhere; don't preload Cormorant Italic | — (finding 4) | — |

Changing `font-display` or the choice of face remains a typography decision (D-012 "Not taken"), not a loading one.
