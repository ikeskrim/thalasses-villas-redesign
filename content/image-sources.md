# Image sources

Every image on this site, where it came from, and under what right it is used.
The rule this file exists to enforce (owner's, §2 of the elevation brief):

- **Tier A — the property.** Villas, interiors, pools, the private beach, the estate. **Real
  photography of Thalasses only.** Never stock, never generated, never a "similar" villa. Guests
  book what they see.
- **Tier B — named places.** Rethymno old town, Preveli, Triopetra, the gorges. Real photographs of
  those actual places, owner material first, otherwise clearly licensed, origin and licence logged.
- **Tier C — abstract texture.** Linen, stone, olive, water surface. Licensed stock permitted.
  Generated imagery permitted **only** for non-representational texture — never a place, a building
  or a person.

---

## 1. `public/images/_pool/` — 694 files, 331 MB · **Tier A**

The property's own photography, as published on thalasses.com.

| | |
|---|---|
| Origin | `s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/` — the Loggia CMS asset store behind thalasses.com |
| Right of use | The client's own site assets, supplied for this redesign |
| How obtained | Full-resolution originals; the site references `_thumb` derivatives, which were stripped to reach the originals |
| Resolution | 1920×1080 to 3300×2200; a few to 5760×3840 |
| Provenance | `content/assets-manifest.json`, `content/image-index.json` |

## 2. `public/images/_chh/` — 168 files, 43.5 MB · **Tier A / Tier B mixed**

The owner's own material from the management company's site, previously unused in the rebuild.

| | |
|---|---|
| Origin | `creteholidayhome.com/wp-content/uploads/` via `creteholidayhome.com/accommodation/thalasses-villas/` |
| Right of use | Crete Holiday Home handles sales and marketing for Thalasses and is credited on the live site; this is the owner's own material |
| Retrieved | 2026-08-06 |
| Provenance | `content/chh-manifest.json` — every file with its source URL and byte size |
| Note | 320 of these overlap with `_pool` — the same photographs republished. Deduplicated in `content/photo-metrics.json`. |

**Caveat.** This folder is the client's *management company's* library, so not every frame is
guaranteed to be Thalasses. Three suspected non-Thalasses frames are flagged in
`content/photo-selects.json` and excluded from the homepage — see §4.

## 3. `public/images/_site/` — 9 files · **Tier A + brand marks**

| File | Origin | Use |
|---|---|---|
| `thalasses-cn-traveller-1.png` | thalasses.com `/assets/customers/thalasses/` | The Condé Nast Traveller mark, used as the proof signal |
| `creteholidayhome-logo-1.jpg` | thalasses.com `/wp-content/uploads/2021/12/` | Partner attribution in the contact area |
| `thoi__Out_1_1.jpg`, `persi__Out_1_1.jpg`, `eanthe__Out_1_1.jpg`, `mailia__Out_1_11.jpg` | thalasses.com `/assets/images/{villa}/` | Per-villa high-resolution originals (up to 5760×3840) |
| theme chrome (`arrow_down`, `progress.svg`, `linear_gradient`) | thalasses.com theme bundle | Not used in the rebuild |

## 4. Excluded from the homepage — failed the Tier A test

Flagged during the curation pass and **not** used on any property-facing beat. They remain in the
inventory because they are on the legacy site, but they do not represent Thalasses.

| Frame | What it is | Why excluded |
|---|---|---|
| `[03]` cyclist on a mountain ridge | Generic stock sports photography, used to illustrate Bike Tours | Not the property, and visibly stock |
| `[06]` bay of municipal umbrellas | A public town beach, most likely Rethymno | Tier B at best; it is not the private beach and must never imply it is |
| `[22]` infinity pool above a valley | A pool overlooking mountains and inland country | Thalasses stands ~50 m from the sea. Almost certainly a different Crete Holiday Home property |

Additional flags raised during the graded pass are recorded in `content/photo-selects.json` under
`flags`, each with its reason.

## 5. Video

| Asset | Origin | Status |
|---|---|---|
| `7VWaiDAWPdY` | Owner's YouTube channel, embedded on thalasses.com and on the CHH Thalasses page | **Not downloadable in this environment** — see below |
| `NNuXKcDlEJs` | Owner's YouTube channel, embedded on the CHH Thalasses page | Same |
| `nuSIWyTiwBU` | "A Moment of Fairytale", linked from the homepage experiences grid | Same |
| `3MLPeDij0kU`, `x0U8hZkxcJk`, `LlitYjfYa3k`, `hOLSbf0zgJg` | Owner's channel, embedded on villa and experience pages | Same |

**The hero video loop could not be produced here.** Extracting a clip requires downloading from
YouTube, which this environment has no tool for and which is not something I will work around. The
hero therefore ships with the specified fallback — a slow Ken Burns move on the single best still —
and the video slot is built so that dropping in an MP4/WebM is a content change, not a code change.

**To supply it:** a 6–10 second silent clip, 1920×1080, H.264 MP4 plus WebM, under ~2 MB, with a
poster frame — placed in `public/video/` and referenced from `content/site.json`. The owner has the
master footage; a clip cut from the source is also better than anything re-encoded from YouTube.

## 6. Nothing generated, nothing stock

As of this pass, **no generated imagery and no third-party stock has been introduced.** Every file
in `public/images/` originates from the client or their management company. If Tier C texture is
added later, each file gets a row here with its origin and licence before it is used.
