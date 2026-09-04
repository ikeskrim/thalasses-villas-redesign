# Image sources

Every image on this site, where it came from, and under what right it is used.
The rule this file exists to enforce (owner's, §2 of the elevation brief):

- **Tier A — the property.** Villas, interiors, pools, the private beach, the estate. **Real
  photography of Thalasses only.** Never stock, never generated, never a "similar" villa. Guests
  book what they see.
- **Tier B — named places.** Rethymno old town, Preveli, Triopetra, the gorges. Real photographs of
  those actual places, owner material first, otherwise clearly licensed, origin and licence logged.
- **Tier B-Experiences — the activities.** *(Owner's ruling, added after the graded pass.)*
  Non-property, representational imagery **is permitted for experience cards only**. A jeep safari,
  a dive, a massage: these happen off the estate and the estate has never photographed them.
  Conditions, all of them:
  1. **Own real frames first.** If the property has a genuine frame of the activity, it wins.
  2. Otherwise **properly licensed stock**; free-licence sources are fine.
  3. It must **plausibly depict the activity as delivered here** — Crete or the wider
     Mediterranean. No landmark from somewhere else, no alpine pass, no tropical reef.
  4. **No third-party branding** in frame.
  5. **One log line per frame** in `content/experience-imagery.json`: file, source, licence.
  6. **Never in a Tier A context.** Not a villa page, not the estate, not the beach, not a hero.
     An experience card is the whole of the permission.
  7. **Stock stays visually honest.** No shared treatment — no common duotone or grade — that
     blurs a licensed frame into the property's own photography. It may sit in the same layout;
     it may not be disguised as Thalasses.
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

## 6. Nothing generated; stock only where Tier B-Experiences allows it

**No generated imagery has been introduced, and none is permitted outside Tier C texture.** Every
file in `public/images/` originates from the client or their management company.

Tier B-Experiences (above) opens one narrow door, and it is enforced rather than trusted:
`content/experience-imagery.json` is the log, and `tests/flagged.spec.ts` **fails the build on any
non-property frame the site renders that is not logged there.**

### The fourteen inherited frames

The graded pass found fourteen frames on `/` and `/en/experiences` that two independent graders
flagged as stock or as a public place. They came from the owner's own Loggia CMS, so somebody put
them there — but **their licences are unknown, and unknown is not licensed.**

**They do not automatically return under the new rule.** Each is logged with
`status: "pending-licence"`, and clearing one means producing its licence, not asserting it.

Two are out for a second reason and do not come back even with paperwork:

| frame | why it stays out |
|---|---|
| Blue quad bike on a dirt track in birch-and-scrub woodland | The landscape is not Crete. It fails condition 3 on sight. |
| Composited wine barrel, bottles, glasses and grapes before a vineyard at sunset | Textbook composited stock. It reads as an advertisement, not as an evening here. |

Both carry `status: "withdrawn"`, and the suite fails if either renders again.

## 7. `public/images/_stock/` — 9 files · **Tier B-Experiences, sourced**

Free-licence stock for the experience cards the estate has never photographed, sourced under the
Tier B-Experiences rule above on the owner's final authorisation: Pexels and Unsplash only, zero
budget, nothing purchased, nothing generated. Fourteen activities were searched; each candidate
was then handed to an independent verifier instructed to **refute** it against the seven
conditions; nine survived. Resized to 1800px on the long edge and JPEG q82 — **never graded,
toned or filtered** (condition 7). `scripts/fetch-stock.mjs` fetches and logs;
`content/experience-stock.json` is the log of record; `scripts/experience-imagery.mjs` merges it.

**The owner reviews all nine on the live page and may veto any.** That review is recorded as
pending in `DECISIONS.md` (D-002).

| experience | file | source | id | photographer | licence | retrieved |
|---|---|---|---|---|---|---|
| `boat-trip` | `boat-trip--unsplash-bkQw8TB4uwc.jpg` | Unsplash | [bkQw8TB4uwc](https://unsplash.com/photos/bkQw8TB4uwc) | Elena Dimaki | Free to use under the Unsplash License | 2026-09-04 |
| `exclusive-tour` | `exclusive-tour--pexels-15248184.jpg` | Pexels | [15248184](https://www.pexels.com/photo/ruins-of-arkadi-monastery-in-greece-15248184/) | Mike Kw | Free to use | 2026-09-04 |
| `hiking` | `hiking--pexels-13720991.jpg` | Pexels | [13720991](https://www.pexels.com/photo/a-man-walking-beside-the-river-13720991/) | Jeremy de Blok | Free to use | 2026-09-04 |
| `jeep-safari` | `jeep-safari--unsplash-GDooCGr61UY.jpg` | Unsplash | [GDooCGr61UY](https://unsplash.com/photos/a-group-of-cars-driving-down-a-dirt-road-GDooCGr61UY) | Daan Sonneveld | Free to use under the Unsplash License | 2026-09-04 |
| `jet-ski-safari` | `jet-ski-safari--pexels-18582039.jpg` | Pexels | [18582039](https://www.pexels.com/photo/jet-ski-on-blue-sea-18582039/) | Pit | Free to use | 2026-09-04 |
| `massage` | `massage--pexels-38407789.jpg` | Pexels | [38407789](https://www.pexels.com/photo/relaxing-back-massage-therapy-at-spa-38407789/) | Tommaso | Free to use | 2026-09-04 |
| `scuba-diving` | `scuba-diving--unsplash-qInbZtAP2OQ.jpg` | Unsplash | [qInbZtAP2OQ](https://unsplash.com/photos/a-person-scubas-in-the-water-near-a-rock-formation-qInbZtAP2OQ) | Artists Eyes | Free to use under the Unsplash License | 2026-09-04 |
| `therapist` | `therapist--pexels-18187122.jpg` | Pexels | [18187122](https://www.pexels.com/photo/woman-on-jetty-at-sunset-18187122/) | Wolfgang Weiser | Free to use | 2026-09-04 |
| `wine-production` | `wine-production--unsplash-xJ9Waej_omI.jpg` | Unsplash | [xJ9Waej_omI](https://unsplash.com/photos/a-person-working-on-a-machine-xJ9Waej_omI) | Carmen Laezza | Free to use under the Unsplash License | 2026-09-04 |

Locations as stated on the source pages: boat-trip, jeep-safari and wine-production are
location-tagged **Crete**; hiking is the Samaria Gorge; exclusive-tour is Arkadi Monastery,
Rethymno; scuba-diving and jet-ski-safari are Rhodes; therapist is Kos; massage states no
location and shows nothing but hands and linen. Every one is Greek.

### Five slots stay empty, and the card says why

Reject rather than stretch — an adjacent picture is worse than no picture. Each of these keeps
its typographic treatment, and the reason is printed on the card in the labelled-slot register
until a frame is found or the owner supplies one.

| experience | why nothing was placed |
|---|---|
| `private-helipad` | every candidate carried an operator's livery or a legible registration, which condition 4 names as an outright rejection |
| `running` | the only Cretan frame is a front-on, recognisable face; the two back-view frames carry a LURBEL logo on the shorts |
| `quad-safari` | the verifier accepted a parked quad beside a whitewashed cube on Mykonos; overruled here — a Cretan reader places it at once, and it is not the mountain track the card describes |
| `personal-trainer` | the verifier accepted a TRX row on a beachfront deck at Herzliya; overruled here on sight — a lit, recognisable profile on a public deck, and the only frame outside Greece |
| `bike-tours` | its verifier never ran (session limit); checked here instead — two riders too small to read as cycling at card size on a Costa del Sol road |

The twelve inherited `pending-licence` frames remain out. They were still rendering as the
heroes of their experience detail pages — logged, so the ratchet allowed them, but logged is not
licensed. Every surface now resolves through one function (`experienceFrame`), and
`tests/flagged.spec.ts` asserts a pending frame renders nowhere, including all twenty-one detail
pages.
