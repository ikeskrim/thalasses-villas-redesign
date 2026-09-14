# Images — formats and sizes, re-verified (tranche twelve)

What `next/image` actually emits and serves on the four sampled routes: every `<img>`, the LCP image, and for the LCP image plus at least two others per route, the format and bytes served for an AVIF-capable browser. Nothing was changed.

**Sources, read-only.** One GET of the HTML of `/`, `/en/villas/villa-thoi`, `/en/the-estate` and `/en/experiences` at :3005 (build `zvZmrT7ejPvvMsQp89xck`), every `<img>` parsed for `src`, `srcset`, `sizes`, `width`/`height`, `loading`, `fetchpriority`. Then 15 GETs of `/_next/image` with `Accept: image/avif,image/webp,*/*`, recording `content-type`, bytes and `x-nextjs-cache`, with the served pixel size decoded from the file (AVIF `ispe`) and the source size read from `public/`. One more GET of villa-thoi's HTML afterwards, to read the four "other villas" sources and their pixel sizes from `public/`. Config: the `images` block of `next.config.ts` at `56cb859` (`formats: ["image/avif", "image/webp"]`, `deviceSizes: [360, 640, 768, 1024, 1280, 1440, 1920, 2560]` at line 91, `imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]`, `qualities` 75/80/82).

**Terms.** *Implied* is the width `sizes` resolves to at a 390 or 1440 CSS px viewport. *Picked at 1×* is the smallest `srcset` candidate at least that wide, which is what a DPR-1 browser requests (the gate runs at `deviceScaleFactor: 1`). The candidates follow Next's `getWidths`: every `deviceSizes` and `imageSizes` entry at least 360 × the smallest `vw` share in `sizes`. So `100vw` and `92vw` get 360, 384 and the larger `deviceSizes` (9); `46vw` gets 256 up (10); `22vw` gets 96 up (12). *Box* is the rendered box from the CSS, where read. Page margin: `.canon` pads each side by `--page-margin: clamp(1.25rem, 4.5vw, 6rem)` (`globals.css:182`, `:341-345`), 20 px at 390 and 64.8 px at 1440. *Needed for cover* is the source width an `object-fit: cover` box needs at 1×: the larger of the box width and the box height × the source's aspect ratio. *Under* means the picked candidate is narrower than that; *over* means wider.

## `/` — 30 images

**LCP: hero slide 1, `/images/_chh/AMZ_7855.jpg`.** It is the only `fetchpriority="high"` image and the only one preloaded (`<link rel="preload" as="image" imagesizes="100vw" fetchpriority="high">`). The gate records an `IMG` as the LCP element (`AB-tranche12-trace.md`).

| images | kind | `sizes` | candidates | loading / priority | q | 390: implied → picked | 1440: implied → picked |
|---|---|---|---|---|---|---|---|
| [0] hero slide 1 | fill | `100vw` | 360…2560 (9) | eager, `fetchpriority=high`, preloaded | 82 | 390 → 640w | 1440 → 1440w |
| [1–2] hero slides 2–3 | fill | `100vw` | 9 | lazy | 82 | 640w | 1440w |
| [3–7] villa cards | 800×600 | `(min-width: 72rem) 22vw, (min-width: 48rem) 45vw, 92vw` | 96…2560 (12) | lazy | 80 | 359 → 360w | 317 → 360w |
| [8] estate aerial | 1200×675 | `(min-width: 48rem) 46vw, 92vw` | 256…2560 (10) | lazy | 80 | 359 → 360w | 662 → 768w |
| [9–24] experience cards | 800×600 | as villa cards | 12 | lazy | 80 | 360w | 360w |
| [25–29] wedding deck | 1600×900 (one 1600×686) | `(min-width: 82rem) 80rem, 92vw` | 360…2560 (9) | lazy | 80 | 359 → 360w | 1280 → 1280w |

## `/en/villas/villa-thoi` — 45 images

**LCP (inferred): the hero, `section.field.d-villa-hero` → `/images/_pool/a3795044c605303bbd6f712209c487e3.jpg`**, the 92svh frame at the top. The gate records an `IMG`, with LCP = FCP = 1212 ms. The hero is **`loading="lazy"`**: `Field` writes `loading={priority ? undefined : "lazy"}` (`src/components/ui/Field.tsx:62-63`), and the villa page's hero `Field` passes no `priority` (`src/app/en/villas/[slug]/page.tsx:210-216`). The page's two image preloads belong to the run's first two frames (`loading={n < 2 ? "eager" : "lazy"}`, `src/components/sections/TheRun.tsx:169`). Run frame 1 is the same photograph at the same `sizes` and quality, so the hero's URL is preloaded only because the run happens to lead with it.

| images | kind | `sizes` | candidates | loading | q | 390 → picked | 1440 → picked |
|---|---|---|---|---|---|---|---|
| [0] hero | fill | `100vw` | 9 | **lazy** | 82 | 640w | 1440w |
| [1–12] run frames | fill | `100vw` | 9 | [1], [2] eager + preloaded; rest lazy | 82 | 640w | 1440w |
| [13–40] contact sheet | fill | `(max-width: 767px) 50vw, 20vw` | 96…2560 (12) | lazy | 75 | 195 → 256w | 288 → 360w |
| [41–44] the other villas | fill, frame `aspect-ratio: 4 / 5` in a 4-column grid, 2 columns below 1024 px (`direction-d.css:546-564`, `:583-587`) | `(max-width: 767px) 100vw, 25vw` (`villas/[slug]/page.tsx:402`) | 12 | lazy | 80 | 390 → 640w | 360 → 360w |

The four other-villa sources on villa-thoi: three at 1920×1080 (`851c20a9…`, `56a298fd…`, `65070ce0…`) and one at 2248×1536 (`306268ec…`).

## `/en/the-estate` — 48 images

**LCP (inferred): the hero, `/images/_pool/01e5107612a2f4f472c6b9d19d5025b9.jpg`.** It is lazy for the same reason: no `priority` at `src/app/en/the-estate/page.tsx:191-197`. It is preloaded through run frame 1, which is the same file.

| images | kind | `sizes` | candidates | loading | q | 390 → picked | 1440 → picked |
|---|---|---|---|---|---|---|---|
| [0] hero | fill | `100vw` | 9 | **lazy** | 82 | 640w | 1440w |
| [1] estate map frame | fill, inside the `.canon` section (`EstateMap.tsx:68`, `:86`); box `aspect-ratio: 16 / 9` (`patterns.css:259-265`), `4 / 3` below 768 px (`patterns.css:478-486`) | `100vw` (`EstateMap.tsx:91`) | 9 | lazy | 82 | 640w | 1440w |
| [2–13] run frames | fill | `100vw` | 9 | [2], [3] eager + preloaded | 82 | 640w | 1440w |
| [14–47] contact sheet | fill | `(max-width: 767px) 50vw, 20vw` | 12 | lazy | 75 | 256w | 360w |

## `/en/experiences` — 17 images

**LCP: text, not an image.** The element is `P.d-villa-lede` in every phone run, with LCP = FCP (`AB-tranche12-trace.md`), so no image preload is expected and none is emitted. All 17 drag cards are `fill`, `sizes="(max-width: 767px) 72vw, 30vw"`, candidates 128…2560 (11), lazy, q 80, `objectFit: "cover"` (`src/components/sections/DragRegister.tsx:147-151`). Box: `.drag-card` is `flex: 0 0 clamp(240px, 28vw, 360px)` and its figure `aspect-ratio: 3 / 4` (`elevation.css:324-331`), so 240×320 at 390 and 360×480 at 1440. `sizes` implies 281 → 360w at 390 and 432 → 640w at 1440.

## The served responses

| route | image | request | content-type | bytes | served | source (bytes) | cache |
|---|---|---|---|---|---|---|---|
| `/` | hero, LCP (phone) | `AMZ_7855.jpg` w=640 q=82 | image/avif | 32,656 | 640×427 | 1920×1280 (780,305) | STALE |
| `/` | hero, LCP (desktop) | `AMZ_7855.jpg` w=1440 q=82 | image/avif | 144,117 | 1440×960 | 1920×1280 | STALE |
| `/` | villa card | `a3795044….jpg` w=360 q=80 | image/avif | 9,073 | 360×203 | 1920×1080 (637,340) | STALE |
| `/` | estate aerial | `01e51076….jpg` w=360 q=80 | image/avif | 8,944 | 360×246 | 2248×1536 (848,945) | STALE |
| villa-thoi | hero, LCP (phone) | `a3795044….jpg` w=640 q=82 | image/avif | 23,921 | 640×360 | 1920×1080 | STALE |
| villa-thoi | hero, LCP (desktop) | `a3795044….jpg` w=1440 q=82 | image/avif | 111,124 | 1440×810 | 1920×1080 | STALE |
| villa-thoi | run frame 2 (preloaded) | `8a3dfa7a….jpg` w=640 q=82 | image/avif | 18,035 | 640×360 | 1920×1080 (440,705) | STALE |
| villa-thoi | contact-sheet thumb | `9ca52cea….jpg` w=256 q=75 | image/avif | 2,933 | 256×144 | 1920×1080 (228,944) | STALE |
| the-estate | hero, LCP (phone) | `01e51076….jpg` w=640 q=82 | image/avif | 26,016 | 640×437 | 2248×1536 | STALE |
| the-estate | hero, LCP (desktop) | `01e51076….jpg` w=1440 q=82 | image/avif | 135,171 | 1440×984 | 2248×1536 | STALE |
| the-estate | estate map frame | `47dc65d0….jpg` w=640 q=82 | image/avif | 19,180 | 640×427 | 2304×1536 (750,335) | STALE |
| the-estate | contact-sheet thumb | `36db30aa….jpg` w=256 q=75 | image/avif | 4,058 | 256×171 | 3300×2200 (705,279) | STALE |
| experiences | drag card 1 | `Untitled-design.webp` w=360 q=80 | image/avif | 11,049 | 360×202 | 1920×1080 (533,076) | STALE |
| experiences | drag card 2 | `boat-trip--unsplash-bkQw8TB4uwc.jpg` w=360 q=80 | image/avif | 7,810 | 360×270 | 1800×1350 (415,383) | STALE |
| experiences | drag card 3 (desktop width) | `99ee7129….jpg` w=640 q=80 | image/avif | 12,717 | 640×427 | 3300×2200 (686,850) | STALE |

The other-villa cards were not fetched; their picks below are computed from `srcset` and the CSS.

## Rendered box against what is served

| image | viewport | box (CSS) | needed for cover | picked at 1× | verdict |
|---|---|---|---|---|---|
| `/` hero (3:2) | 390×844 | 390×658 — `.ho-hero` height `min(78vh, 44rem)`, img `object-fit: cover` (`hotel.css:150-153`, `:169-172`) | 987 | 640w | **under**, 1.54× upscaled |
| `/` hero | 1440×900 | 1440×702 | 1440 | 1440w | matches |
| `/` villa card (16:9 source) | 390 | ≈359×269, 4:3 (`hotel.css:365-371`) | 478 | 360w | under, 1.33× |
| villa-thoi hero (16:9) | 390×844 | 390×776 (92svh) | 1380 | 640w | **under**, 2.16× |
| villa-thoi hero | 1440×900 | 1440×828 | 1472 | 1440w | under, 1.02× |
| villa-thoi run frame (16:9) | 390×844 | 390×658 (78svh, `villa.css:107-112`) | 1170 | 640w | **under**, 1.83× |
| villa-thoi run frame | 1440×900 | 1440×702 | 1440 | 1440w | matches |
| villa-thoi other-villa card, 16:9 source (3 of 4) | 390 | ≈166×208: (350 − 17.85 gap) ÷ 2, 4:5 | 369 | 640w | **over, 1.73×** |
| villa-thoi other-villa card, 2248×1536 source (1 of 4) | 390 | ≈166×208 | 304 | 640w | **over, 2.11×** |
| villa-thoi other-villa card, 16:9 source | 1440 | ≈304×380: (1310.4 − 3 × 32 gap) ÷ 4, 4:5 | 675 | 360w | under, 1.87× |
| villa-thoi other-villa card, 2248×1536 source | 1440 | ≈304×380 | 555 | 360w | under, 1.54× |
| the-estate hero (1.46:1) | 390×844 | 390×776 | 1136 | 640w | **under**, 1.78× |
| the-estate hero | 1440×900 | 1440×828 | 1440 | 1440w | matches |
| the-estate map frame (3:2 source) | 390 | 350×262.5, 4:3 | 394 | 640w | **over, 1.62×** |
| the-estate map frame | 1440 | 1310×737, 16:9 | 1310 | 1440w | over, 1.10× |
| experiences card, 16:9 source | 390 | 240×320 | 569 | 360w | under, 1.58× |
| experiences card, 4:3 source | 390 | 240×320 | 427 | 360w | under, 1.19× |
| experiences card, 3:2 source | 1440 | 360×480 | 720 | 640w | under, 1.13× |

Gaps are `--card-gap: clamp(1rem, 0.75rem + 1.5vw, 2rem)` (`globals.css:143`): 17.85 px at 390, 32 px at 1440.

**Not assessed against a box, although the pick is wider than `sizes` implies:** the contact sheets (195 → 256w at 390, 1.31×; 288 → 360w at 1440, 1.25×), because their cell aspect ratio was not read (2 columns below 768 px, 5 above: `villa.css:368-371`, `:385-389`); and on `/` at 1440, the villa and experience cards (317 → 360w, 1.14×), the estate aerial (662 → 768w, 1.16×). Whether any of these is over what its box needs is not known.

## Findings

1. **Format: 15 of 15 served as `image/avif`.** No sampled image was served as JPEG or WebP to an AVIF-capable browser.
2. **No hero and no run frame is served larger than it needs at 1×, but two bounded images are.** Every response came back at exactly the width asked for, and every source is at least 1800 px wide, so there was no silent cap. The oversizing comes from which candidate `sizes` selects:
   - **The-estate map frame, 1.62× at 390.** It is a 350×262.5 box, and its 3:2 source needs 394 px for cover. `sizes="100vw"` resolves to 390, past the 360 and 384 candidates, and the next candidate is 640, so 640w is requested (the served response is 640×427, 19,180 B). At 1440 it is 1.10×: a 1310 px frame gets 1440w, which even an exact `sizes` would pick, because the step below is 1280.
   - **Villa-thoi's other-villa cards, 1.73× and 2.11× at 390.** Each frame is about 166×208. The three 16:9 sources need 369 px and the 2248×1536 source needs 304 px. `sizes` says `100vw` below 768 px, but the grid there is two columns. So `sizes` resolves to 390, past the 360 and 384 candidates, and the next is 640w. At 1440 the same cards are under, not over (360w against 675 and 555).
   - Where `sizes` overstates the box on experiences (72vw and 30vw against a 240 or 360 px card), the cover crop of landscape photographs into a 3:4 card needs more than the box width anyway, so those are under.

   Not changed. The components (`EstateMap.tsx`, `villas/[slug]/page.tsx`) are outside this workstream, and a corrected `sizes` changes the bytes the gate loads.
3. **On phones, tall cover-cropped frames get undersized images.** `sizes="100vw"` describes the box width, but the heroes and run frames are far taller than a landscape photograph at that width, and `cover` scales the image up to fill the height. At 390×844 and 1×, the villa hero is drawn from an image 2.16× too small, the run frames 1.83×, the estate hero 1.78× and the `/` hero 1.54×. That is sharpness, not bytes. A DPR-3 phone requests 1280w for the same frames, which covers most of it, but the gate never loads those bytes. A height-aware `sizes` would trade bytes for sharpness on the LCP image, so it needs measuring. Not changed.
4. **Both Direction D LCP heroes are `loading="lazy"`,** and arrive early only because the run's first frame is the same photograph and is preloaded. If a villa's run ever leads with another photograph, its hero loses the preload and stays lazy. `Field` already has a `priority` prop for this (`Field.tsx:18`, `:42`, `:62-63`). Not changed, because it changes the preload set on every D page, which is a measured change.
5. **The gate measures images at 1×.** `scripts/hotel-cwv.mjs` creates its contexts with `deviceScaleFactor: 1`, so its LCP and network load are for the smallest candidates. This is a property of the lab profile, stated so it is not mistaken for real-phone bytes.
6. **Every response was `x-nextjs-cache: STALE`.** They were served from the optimiser's cache past its TTL, which makes Next re-optimise those variants in the background. The 15 requests were made shortly before 09:59 (GTB) on 14 September 2026 and may have cost :3005 some background CPU. A trace running at that moment should not be trusted.

## Not covered

- The other templates: weddings, gallery (the most image-heavy page), location, contact, careers, terms, the experience detail pages (whose other-experience cards use the same `(max-width: 767px) 100vw, 25vw`, `experiences/[slug]/page.tsx:145`; their grid was not read), and the 404.
- Contact-sheet geometry, and the `/` cards and aerial at 1440.
- Real-device DPR.
- Per-route image byte totals.
