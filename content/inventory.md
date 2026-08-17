# Thalasses Villas — Phase 0 Content Inventory

**Site:** thalasses.com (Thalasses Villas, Pigianos Kampos, Rethymno, Crete)
**Prepared:** 2026-08-06 · **Status:** complete, second pass (AJAX/baked-in content recovered)
**Scope:** everything that exists on the live site today, recorded verbatim, with every gap named.

> **Reading rule for this document.** Nothing here has been invented. Every user-facing string quoted
> below exists in the crawled source. Where source copy contains a typo, a broken character or an
> internal contradiction, it is reproduced **verbatim** and flagged — never silently corrected.
> Where content does not exist, the entry says so and the item appears in §9.

---

## 1. Scope & method

### 1.1 What was captured

| Artefact | Count | Location |
|---|---|---|
| HTML pages crawled | **42 unique** (43 files; one byte-identical duplicate) | `content/raw/*.html` |
| Readable text exports | 42 | `content/text/*.txt` |
| Per-page image lists | 42 | `content/assets/*.imgs.txt` |
| Page-level app JS bundles recovered | 11 | `content/raw-js/`, `content/extracted-js/` |
| Client-side article modals recovered | 5 | `content/modals.json` |
| Per-property facilities payloads recovered | 7 | `content/facilities/*.json` |
| Fancybox caption anchors catalogued | **906** across 20 pages | `content/captions.json` |
| Unique images identified | 684 (673 CDN + 11 non-CDN) | `content/assets-manifest.json` |
| Images downloaded at full resolution | **694 files / 372.5 MB** | `public/images/_pool/` |
| Site-chrome / non-CDN images downloaded | 10 files / 14.1 MB | `public/images/_site/` |

`content/raw/` holds 43 files. The 43rd is `en__index-1.htm_q_x=1`, a byte-identical duplicate of
`en__index-1.htm` (same MD5 `0d7d98a1cd0995cb852cb3413c9c6c55`), so **42 URLs were crawled** — which
matches the 42 files in `content/text/` and `content/assets/`. Of those 42, `root.html` and
`en__index-1.htm` are the *same* home page served at two URLs (they differ only in `og:url` —
`https://thalasses.com/` vs `https://thalasses.com/en/` — and in relative-path prefixes).
So: **43 files → 42 crawled URLs → 41 distinct pages of content.**

### 1.2 The platform

The site runs on the **Loggia CMS** (`SimpleLodge` theme_1) with an **AngularJS** front-end
(`data-ng-model`, `data-ng-init`, `data-ng-repeat`, interpolation delimiters `[[ ]]`).
Media is served from `https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/`.
Booking is **WebHotelier** (`reserve-online.net`). The contact form posts to **Formspree**
(`https://formspree.io/f/mrbkgjzw`). Maps are Google Maps iframes.

### 1.3 How the hidden content was recovered

The first crawl pass reported three sections as "empty". **All three were wrong** — the content
exists, but a static HTTP crawl cannot see it. The corrections:

**(a) Article modals — `/en/page/modal/article/<id>` returns 404.**
The site is a *static export*. The Angular helper `loadArticlesModal('en', <id>)` normally fetches
the modal body over AJAX; on the exported site that endpoint does not exist. The modal HTML is
instead **baked into the page bundle** and injected client-side. Five modals were recovered by
rendering the live page and invoking the loader:

| Article id | Heading | Used by |
|---|---|---|
| 1896 | Private Beach | Amenities card → "Read more..." |
| 1898 | Beaches | Location section (`#category570`) → "Read more..." |
| 3795 | Doctor | Amenities card → "Read more..." |
| 3796 | Babysitter | Amenities card → "Read more..." |
| 3869 | Become one of us! | Career Opportunities (`#category1158`) → "Read more..." (2 cards, 1 article) |

Stored in `content/modals.json`, folded into `amenities.json`, `location.json` and `site.json`.

**(b) Villa Facilities is not empty — the data ships in each page's own JS.**
The Facilities block renders only `[[ feature.feature_title ]]` placeholders in the static HTML,
behind `data-ng-init="fetchFacilities('<id>', 'en')"`. The real payload is a hard-coded
`Promise.resolve` object inside `bundles/frontend/theme_1/app/<page>.js`. Extracted to
`content/facilities/<page>.json` — **139 / 134 / 137 / 136 / 127 / 55** features for
200 / 201 / 202 / 203 / 2142 / pueblo respectively.

> **Critical finding.** The Angular controller does `$scope.features = groups[0].group`, so the live
> site renders **only tab 0 ("Amenities")**. Every other tab is real CMS data for that property that
> the current site has **never displayed to a single visitor**. Each tab carries a
> `displayedOnLiveSite` boolean. **Do not drop the hidden tabs — they are content, not noise.**

**(c) Fancybox captions.** Every `data-caption` anchor on every page was catalogued into
`content/captions.json`, grouped by fancybox group. This recovered two bodies of content the first
pass discarded: the six **service cards** present on all five property pages
(`fancyServiceImages<id>`), and **~170 real gallery captions** on the villa pages — including the
only price stated anywhere on thalasses.com.

### 1.4 Word counts in this document

Raw text extraction gives every page a word count of roughly 3,500. That is an artefact: **the
entire Terms & Conditions text (~3,285 words) is duplicated into a footer modal on every single
page**, along with the newsletter and contact chrome. The shared chrome baseline measures
**3,481 words** (line-intersection of two minimal pages). Therefore this document reports
**editorial word count** — the page's own copy — and gives the raw figure only for reference.

---

## 2. Page-by-page inventory

Legacy URLs are the canonical `og:url` values. "Editorial words" excludes the ~3,481-word shared
chrome. "Images" is the count in the page's `.imgs.txt` list.

### 2.1 Home + core

| Legacy URL | Type | `<title>` | Meta description (truncated) | Editorial words | Raw words | Images | Content now lives in |
|---|---|---|---|---|---|---|---|
| `https://thalasses.com/` | home (root copy) | Thalasses Villas | "Five luxurious villas in a privileged seafront location. The clear blue sea and exclusive private beach…" | ~120 | 4099 | 51 | `site.json` |
| `https://thalasses.com/en/` | home | Thalasses Villas | *(identical to above)* | ~120 | 4099 | 51 | `site.json`, `amenities.json`, `location.json`, `modals.json`, `facilities/index.json` |
| `https://thalasses.com/en/terms-and-conditions` | legal | Thalasses Villas - Terms & Conditions | *(generic site blurb — not terms-specific)* | 3285 | 6803 | 4 | `terms.json` |
| `https://thalasses.com/en/article/1899` | amenity article | Sitting outdoor area | "Enjoy your dinner in the outdoor sitting area which provides you a gas barbecue station, as well." | **25** | 3815 | 63 | `article-1899.json`, `amenities.json` |

### 2.2 Villas

| Legacy URL | Type | `<title>` | Meta description (truncated) | Editorial words | Raw words | Images | Content now lives in |
|---|---|---|---|---|---|---|---|
| `/en/property/200` | villa (bookable) | Villa Thoi, Rethymno, Greece | "Living unlimited.Four luxurious villas in a privileged location 50 m from a private beach…" | **749** | 4967 | 15 | `villas/200.json`, `facilities/200.json`, `captions.json` |
| `/en/property/200/albums` | gallery | Villa Thoi, Rethymno, Greece\|Album | "Villa Thoi\|Album" | 0 | 3953 | 94 | `villas/200.json` → `gallery.albums` |
| `/en/property/200/map` | map stub | Villa Thoi, Rethymno, Greece | *(inherits villa description)* | 0 | 70 | 2 | `villas/200.json` → `map` |
| `/en/property/201` | villa (bookable) | Villa Persi, Rethymno, Greece | "Living unlimited.Four luxurious villas…" | **754** | 5000 | 15 | `villas/201.json`, `facilities/201.json`, `captions.json` |
| `/en/property/201/albums` | gallery | Villa Persi…\|Album | "Villa Persi\|Album" | 0 | 3873 | 78 | `villas/201.json` |
| `/en/property/201/map` | map stub | Villa Persi, Rethymno, Greece | *(inherited)* | 0 | 70 | 2 | `villas/201.json` |
| `/en/property/202` | villa (bookable) | Villa Eeanthe, Rethymno, Greece | "Living unlimited.Four luxurious villas…" | **780** | 4951 | 15 | `villas/202.json`, `facilities/202.json`, `captions.json` |
| `/en/property/202/albums` | gallery | Villa Eeanthe…\|Album | "Villa Eeanthe\|Album" | 0 | 3978 | 99 | `villas/202.json` |
| `/en/property/202/map` | map stub | Villa Eeanthe, Rethymno, Greece | *(inherited)* | 0 | 70 | 2 | `villas/202.json` |
| `/en/property/203` | villa (bookable) | Villa Melia, Rethymno, Greece | "Living unlimited.Four luxurious villas…" | **789** | 4964 | 15 | `villas/203.json`, `facilities/203.json`, `captions.json` |
| `/en/property/203/albums` | gallery | Villa Melia…\|Album | "Villa Melia\|Album" | 0 | 3923 | 87 | `villas/203.json` |
| `/en/property/203/map` | map stub | Villa Melia, Rethymno, Greece | *(inherited)* | 0 | 70 | 2 | `villas/203.json` |
| `/en/property/2142` | estate (bookable) | Thalasses Villas, Rethymno, Greece | "Rent them all together.Thalasses Villas are five luxurious independent villas with private beach… 12 bedrooms, 9 bathrooms" *(truncated in source, no full stop)* | **571** | 4629 | 16 | `villas/2142.json`, `facilities/2142.json`, `captions.json` |
| `/en/property/2142/albums` | gallery | Thalasses Villas…\|Album | "Thalasses Villas\|Album" | 0 | 4424 | 139 | `villas/2142.json` |
| `/en/property/2142/map` | map stub | Thalasses Villas, Rethymno, Greece | *(inherited)* | 0 | 61 | 2 | `villas/2142.json` |
| `/en/villa-pueblo` | villa (**not** bookable) | Villa Pueblo, Rethymno, Greece | "Living Unlimited!.Unwind in utter seclusion when you book one of our five Thalasses Villas, Villa Pueblo (Adults Only)." | **249** | 3898 | 11 | `villas/pueblo.json`, `facilities/pueblo.json` |
| `/en/thalasses-rituals` | landing (**not** bookable) | Thalasses Rituals, Rethymno, Greece | "Living unlimited!.Our brand new and truly astonishing Wedding Venue which features a unique pool of 150m2 with salt water!" | **18** | 3717 | 12 | `villas/rituals.json`, `facilities/index.json` |

### 2.3 Experiences (21 detail pages)

All 21 share the pattern: `<title>` = page name, and **`meta description` is the page title repeated** —
no page has a genuine SEO description.

| Legacy URL | `<title>` | Meta description | Editorial words | Images | Content now lives in |
|---|---|---|---|---|---|
| `/en/dream-weadding-on-the-beach` | Dream Wedding on the Beach | "Dream Wedding on the Beach" | **288** | 25 | `experiences/dream-weadding-on-the-beach.json` |
| `/en/learn-the-secrets-of-cretan-cuisine` | Learn the secrets of Cretan Cuisine! | *(title repeated)* | 82 | 5 | `experiences/learn-the-secrets-of-cretan-cuisine.json` |
| `/en/boat-trip` | Private Boat Trip | *(title repeated)* | 78 | 5 | `experiences/boat-trip.json` |
| `/en/jet-ski-safari` | Water Sports | *(title repeated)* | 71 | 5 | `experiences/jet-ski-safari.json` |
| `/en/biological-garden` | Organic Farm | *(title repeated)* | 53 | 13 | `experiences/biological-garden.json` |
| `/en/scuba-diving` | Scuba Diving | *(title repeated)* | 50 | 5 | `experiences/scuba-diving.json` |
| `/en/private-helipad` | Private Helipad | *(title repeated)* | 41 | 13 | `experiences/private-helipad.json` |
| `/en/chauffeur` | Chauffeur | *(title repeated)* | 37 | 5 | `experiences/chauffeur.json` |
| `/en/jeep-safari` | Jeep safari | *(title repeated)* | 33 | 5 | `experiences/jeep-safari.json` |
| `/en/chef-in-villa` | Private Chef | *(title repeated)* | 31 | 17 | `experiences/chef-in-villa.json` |
| `/en/personal-trainer` | Personal Trainer | *(title repeated)* | 29 | 5 | `experiences/personal-trainer.json` |
| `/en/quad-safari` | Quad Safari | *(title repeated)* | 28 | 5 | `experiences/quad-safari.json` |
| `/en/therapist` | Therapist | *(title repeated)* | 25 | 5 | `experiences/therapist.json` |
| `/en/wine-tasting` | Wine Tasting | *(title repeated)* | 25 | 5 | `experiences/wine-tasting.json` |
| `/en/wine-production` | Wine Production | *(title repeated)* | 22 | 5 | `experiences/wine-production.json` |
| `/en/breakfast-on-the-beach` | Breakfast on the Beach | *(title repeated)* | 20 | 5 | `experiences/breakfast-on-the-beach.json` |
| `/en/exclusive-tour` | Exclusive Tour | *(title repeated)* | 20 | 17 | `experiences/exclusive-tour.json` |
| `/en/bike-tours` | Bike Tours | *(title repeated)* | 19 | 5 | `experiences/bike-tours.json` |
| `/en/hiking` | Hiking | *(title repeated)* | 17 | 7 | `experiences/hiking.json` |
| `/en/running` | Running | *(title repeated)* | 17 | 5 | `experiences/running.json` |
| `/en/massage` | Massage | *(title repeated)* | 12 | 5 | `experiences/massage.json` |

**Total editorial copy across all 21 experience pages: 998 words.** For comparison, a single villa
page carries ~750–790 words.

---

## 3. Villas

Seven accommodation entities exist across two different CMS id spaces. Four are individual bookable
villas (`/en/property/{200,201,202,203}`), one is a whole-estate bookable listing
(`/en/property/2142`), and two are slug pages that carry **no booking widget at all**
(`/en/villa-pueblo`, `/en/thalasses-rituals`).

### 3.0 At a glance

| Villa | CMS id | Beds | Baths | Sleeps | Indoor m² | Pools | Room code | Facilities (total / shown) | Gallery | Bookable |
|---|---|---|---|---|---|---|---|---|---|---|
| Villa Thoi | 200 | 2 | 1 | 5 | 60 | 1 | `WH200` | 139 / 65 | 89 unique | ✅ |
| Villa Persi | 201 | 2 | 1 | 5 | 60 | 1 | `WH201` | 134 / 62 | 74 unique | ✅ |
| Villa Eeanthe | 202 | 3 | 2 | 6 | 60 | 1 | `WH202` | 137 / 63 | 104 unique | ✅ |
| Villa Melia | 203 | 2 | 2 | 4 | 60 | 1 | `WH203` | 136 / 63 | 89 unique | ✅ |
| Thalasses Villas (estate) | 2142 | 12 | 6 | 24 | 240 | 4 | `WH2142` | 127 / 54 | 144 unique | ✅ |
| Villa Pueblo | 10655 | 3 | 3 | 6 | 95 | 1 | — | 55 / 43 | **5 images total** | ❌ |
| Thalasses Rituals | 7798 | 3 | 3 | 12 | 97 | 1 | — | 55 / 43 *(borrowed)* | 31 | ❌ |

All spec figures come from each page's Attributes counter strip. `sizeSqm` is labelled
**"Indoor Area"** on the page — it is not plot or total area. **No villa states a check-in time,
check-out time, floor count, price, minimum stay, deposit, cancellation policy, pet policy or
smoking policy anywhere.**

### 3.1 Villa Thoi — `/en/property/200`

- **Tagline:** "Living unlimited" · **Attributes:** Family, Relaxing, Coastal
- **Specs:** 2 bedrooms · 1 bath · sleeps 5 · 60 m² indoor · 1 pool · view "direct view to the sea" ·
  "50 m from a private beach"
- **Layout (verbatim):** *"Villa Thoi is one of the two front villas with a direct view to the sea.
  It is a single-story building with 2 bedrooms and can accommodate 4 people in beds, up to 5 people
  if it is necessary."* Bathroom is *"with hydro-massage shower cabin"*.
- **Facilities:** 139 features in 6 tabs — Amenities **65 (shown)**, Entertainment/Activities 40,
  Children 3, Cleaning 12, Safety/Security 17, Environment/Heating-Cooling 2. **74 features hidden.**
- **Booking:** `WH200` → `https://etouri.reserve-online.net/`, GET, `exclusive=1`
- **Gallery:** 40 featured lightbox images (37 captioned, 36 unique captions) + 2 albums
  ("Outdoors" 68, "Indoors" 19). 89 unique images.
- **Video:** YouTube `3MLPeDij0kU`
- **Highlights (slider captions, verbatim):** "Sunbathing area by the pool, external furniture from
  EMU" · "Hot tub in our garden" · "Safe organised playground area for young children in the complex" ·
  "Easy access to our Private beach" · "Barbecue area"
- **Policies (verbatim, typo preserved):** *"The swimming pool can be heated with **na** additional
  daily charge upon request."* · *"(Please note that the pool heating can be used upon advance request
  for the entire stay and it requires at least one week advance notice.)"* · *"The pool contains a
  pool alarm system for child safety."*
- **Missing:** all four Spaces tiles (Private swimming pool, Bedrooms, Living room, Outdoor) have
  `description: null` — their bodies come from `loadPoolModal('en',362)` / `loadBedroomsModal('en',2)` /
  `loadSpaceModal('en',1234)` / `loadSpaceModal('en',1235)`, which 404 on the static export.
  No check-in/out, no floors, no price.

### 3.2 Villa Persi — `/en/property/201`

- **Tagline:** "Living unlimited" · **Attributes:** Family, Relaxing, Coastal
- **Specs:** 2 bedrooms · 1 bath · sleeps 5 · 60 m² · 1 pool · "direct view to the sea" ·
  "50 m from a private beach"
- **Layout (verbatim):** *"Villa Persi is one of the two front villas with a direct view to the sea.
  It is a single-story building with 2 bedrooms and can accommodate 4 people in beds, up to 5 people
  if it is necessary."* Bathroom: *"an enormous bathroom consisting of Jacuzzi bath and shower cabin"*.
- **Facilities:** 134 in 6 tabs — Amenities **62 (shown)**, Entertainment 38, Children 3, Cleaning 12,
  Safety 17, Environment 2. **72 hidden.**
- **Booking:** `WH201` → `etouri.reserve-online.net`
- **Gallery:** 43 featured (38 captioned) + albums "Outdoors" 61, "Indoors" 10. 74 unique images.
- **Video:** none.
- **Highlights:** "Enjoy Cretan sea views from the hot tub" · "Private swimming pool area with sun beds
  (The pool can be also heated)" · "Safe organised playground area for young children in the complex" ·
  "Easy access to our Private beach" · "Open plan living room with white marble from Greece"
- **The only price on the site is here**, as a gallery caption:
  **"The swimming pool can be heated with additional 35€ per day upon request."**
- **Missing:** same four Spaces descriptions; no check-in/out, floors, or rate card.

### 3.3 Villa Eeanthe — `/en/property/202`

- **Tagline:** "Living unlimited" · **Attributes:** Family, Relaxing, Coastal
- **Specs:** 3 bedrooms · 2 baths · sleeps 6 · 60 m² · 1 pool · **2 floors** ·
  view "direct view to the sea from the first floor bedrooms and balcony" · "50 m"
- **Layout (verbatim):** *"Villa Eeanthe offers 3 bedrooms and can accommodate 6 people in beds. It is
  a two-storey villa designed to offer direct view to the sea from the first floor bedrooms and
  balcony."*
- **Facilities:** 137 in 6 tabs — Amenities **63 (shown)**, Entertainment 40, Children 3, Cleaning 12,
  Safety 17, Environment 2. **74 hidden.**
- **Booking:** `WH202` → `etouri.reserve-online.net`
- **Gallery:** **45 featured lightbox images, 43 captioned (39 unique captions)** — the richest caption
  set on the site — plus albums "Outdoors" 68, "Indoors" 24. 104 unique images.
- **Video:** YouTube `7VWaiDAWPdY`
- **Notable captions (verbatim):** "Our bed mattresses are from \"Cocomat\" which promises the good
  sleep!" · "Our bathroom amenities are from \"Korres\" and \"Cocomat\"" · "Welcome to villa Eeanthe!" ·
  "Daily Cretan Traditional Breakfast upon request with additional fee" · "The perfect spot for
  relaxing..!"
- **Missing:** Spaces descriptions; check-in/out; floors is the only page that states 2.
  `longDescription` on this page **begins by repeating the shared site blurb verbatim** before the
  villa-specific copy.

### 3.4 Villa Melia — `/en/property/203`

- **Tagline:** "Living unlimited" · **Attributes:** Family, Relaxing, Coastal
- **Specs:** 2 bedrooms · 2 baths · sleeps 4 · 60 m² · 1 pool · **2 floors** ·
  "direct view to the sea from the first floor bedrooms and balcony" · "50 m"
- **Layout (verbatim):** *"Villa Melia offers 2 bedrooms and can accommodate 4 people in beds. It is a
  two-storey villa designed to offer direct view to the sea from the first floor bedrooms and balcony."*
- **Facilities:** 136 in 6 tabs — Amenities **63 (shown)**, Entertainment 39, Children 3, Cleaning 12,
  Safety 17, Environment 2. **73 hidden.**
- **Booking:** `WH203` → `etouri.reserve-online.net`
- **Gallery:** **44 featured, 42 captioned (37 unique)** + albums "Outdoors" 64, "Indoors" 17.
  89 unique images.
- **Video:** YouTube `7VWaiDAWPdY` (shared with 202 and 2142)
- **The 35€ pool-heating caption also appears here**, verbatim identical to Villa Persi's.
- **Spaces tile naming diverges:** the third tile is **"Living space"** here but "Living room" on 200/201/202.
- **Missing:** Spaces descriptions; check-in/out; price beyond the single caption.

### 3.5 Thalasses Villas (whole estate) — `/en/property/2142`

- **Tagline:** "Rent them all together" · **Attributes:** Coastal, Luxury · **Slug derived**, not from source
- **Specs (from the stat strip):** 12 bedrooms · **6 baths** · sleeps **24** · 240 m² · **4 pools**
- **`shortDescription` is truncated in the source** and ends mid-sentence with no full stop:
  *"…Renting the whole complex will offer our guests having 5 seafront buildings with 12 bedrooms,
  9 bathrooms"*
- **Per-villa breakdown (verbatim from the modal):**

| Villa | Stated composition |
|---|---|
| Villa Thoi | "2 Bedrooms (1 double and 1 twin room), 1 bathroom (shower cabin), living room with HDTV and Nintendo Wii, fully equipped kitchen and dining area" |
| Villa Persi | "2 Bedrooms (1 double and 1 twin room), 1 bathroom (Jacuzzi bath and shower cabin), living room with HDTV and Nintendo Wii, fully equipped kitchen and dining area" |
| Villa Melia | "2 Bedrooms (1 double and 1 twin room), 2 bathrooms (Jacuzzi bath and shower cabin), living room with HDTV and Nintendo Wii, fully equipped kitchen and dining area" |
| Villa Eeanthe | "3 Bedrooms (1 double and 2 twin rooms), 2 bathrooms (Jacuzzi bath and shower cabin), living room with HDTV and Nintendo Wii, fully equipped kitchen and dining area" |
| Villa Pueblo | "Inside this truly exceptional residence are three large bedrooms… the residence features three bathrooms. This gorgeous retreat can perfectly accommodate up to 6 guests." |

- **Free "hotel services" (verbatim):** *"include cleaning every 3 days, daily operating reception desk
  and Holiday Advisor & concierge centre where you can take advice or suggestions regarding everything
  in our island."*
- **Only stated use case:** *"large groups"*. The words *wedding, ceremony, reception, event, venue,
  yoga, wellness, corporate, team building, reunion* **do not appear on this page at all.**
- **Facilities:** 127 in 6 tabs — Amenities **54 (shown)**, Entertainment 39, Children 3, Cleaning 13,
  Safety 17, Environment 1. **73 hidden.**
- **Gallery:** 40 featured images with **zero captions**, plus 4 albums named after the villas
  (Villa Eeanthe 45, Villa Thoi 44, Villa Melia 45, Villa Persi 46 = 180 slots, heavily duplicated →
  144 unique). **There is no Villa Pueblo album** despite Pueblo being described in the copy.
- **Missing:** view, distance to beach, floors, check-in/out, all four Spaces descriptions, prices.
- **This page carries four numeric contradictions** — see §8.

### 3.6 Villa Pueblo — `/en/villa-pueblo`

- **CMS id 10655** (different id space from the numeric property pages) · **Tagline "Living Unlimited!"**
- **Specs:** 3 bedrooms · 3 baths · sleeps 6 · 95 m² indoor · 1 pool
- **Positioning (verbatim):** *"Unwind in utter seclusion when you book one of our five Thalasses
  Villas, Villa Pueblo (Adults Only)."* — **"(Adults Only)" is the only policy statement on the page.**
- **Copy highlights (verbatim):** *"The indisputable star of Villa Pueblo is the exquisite outdoor
  area… a large and private swimming pool, direct private beach access, and stunning views of your
  tropical island surroundings."* · *"the only seafront villas with private helipad"* ·
  *"Villa Pueblo features the opportunity of a fixture private chef"*
- **Facilities:** 55 in 3 tabs — Amenities **43 (shown)**, Entertainment/Activities 7,
  Safety/Security 5. **12 hidden.**
- **Booking:** **none.** No `webHotelierForm`, no room code, no enquiry CTA. The only page-level call
  to action is a hero button labelled **"Features"** → `#facilities`.
- **Gallery: this page has no gallery at all.** Zero fancybox anchors, zero captions (it is the only
  villa page absent from `captions.json`), no `/albums` page, and no Gallery nav item.
  `gallery.allImages` holds **5 images total**: one hero slide plus four Spaces tile backdrops.
- **Video:** YouTube `x0U8hZkxcJk`
- **Missing:** everything except 249 words of copy — no gallery, no booking, no policies, no price,
  no view/beach-distance spec, no Spaces descriptions.

### 3.7 Thalasses Rituals — `/en/thalasses-rituals`

- **CMS id 7798** · **Tagline "Living unlimited!"** · **`pageType: "landing"` — needs client confirmation**
- **The entire editorial content of this page is one 103-character sentence:**
  **"Our brand new and truly astonishing Wedding Venue which features a unique pool of 150m2 with salt water!"**
  `longDescription` is `null` — the "Read more" modal `#modal_desc` contains only the heading and `<br>` tags.
- **Specs:** 3 bedrooms · 3 baths · sleeps 12 · 97 m² indoor · 1 pool. The Bedrooms counter calls
  `loadBedroomsModal('en',0)` — **the bedroom argument is 0**, unlike Pueblo (3) and 2142 (12).
- **Facilities: borrowed, not its own.** The page loads `app/index-1.js` — the *homepage* bundle — so
  `facilities/index.json` applies. That file is **byte-for-byte identical in content to
  `facilities/pueblo.json`**. The page's own init is `fetchFacilities('7798','en')`, but no 7798
  payload exists in any file. **The amenity list this page renders is Villa Pueblo's.**
  Corroborating evidence: the page contains a hard-coded `loadFeatureGroupModal('en', group.group_id, '10655')` —
  Villa Pueblo's id.
- **Gallery:** 31 images in a block headed literally "Photo gallery". 25 carry an empty `data-caption`;
  the first 6 (also the hero slides) carry none. **No alt text on any image.**
- **Video:** YouTube `7VWaiDAWPdY`
- **Booking:** none. Hero CTA is **"Photos"** → `#featured_gallery`.
- **Missing / structural problem:** for a page positioned as a **wedding venue** there is
  **no wedding-enquiry form, no pricing, no event capacity, no availability calendar, no packages, no
  wedding-specific CTA** — only the generic site-wide contact form. The `meta keywords` classify it as
  **"House"**. Nothing on the page describes spa treatments or "rituals" despite the name.
  The obvious editorial partner page — `/en/dream-weadding-on-the-beach`, which *is* about
  Thalasses Rituals as a wedding venue — **is not linked from here.**

---

## 4. Experiences

### 4.1 The grid vs. the pages

The homepage Experiences section (`#category1139`) is headed **"Experiences"** with the strapline
**"For getting the maximum which you deserve we offer exclusive experience packages!"** (rendered in an
`<h5 class="hidden-xs">`, i.e. **hidden on mobile**). Every card is a photo + label + the shared string
**"Read more..."**. There is **no per-card description, price, duration or booking control anywhere.**

- **22 cards** in the grid
- **21 real detail pages** (`content/experiences/*.json`)
- **1 external card with no page:** **"A Moment of Fairytale"** links straight to
  `https://www.youtube.com/watch?v=nuSIWyTiwBU&ab_channel=CreteHolidayHome`. It is the only external
  link in the grid, it opens in the **same tab** (no `target` attribute), and its only asset anywhere on
  the site is the card thumbnail `2984622fa70b8aaa4796d646c5a7c6ea_thumb.jpg`. **There is no title,
  description or body copy for it — the video is the content.**

### 4.2 Card label ≠ URL slug (five mismatches)

The labels were renamed but the URLs were not. Preserve the old paths as redirects.

| Card label | Actual URL |
|---|---|
| Organic Farm | `biological-garden-1.html` |
| Water Sports | `jet-ski-safari-1.html` |
| Private Chef | `chef-in-villa-1.html` |
| Private Boat Trip | `boat-trip-1.html` |
| Dream Wedding on the Beach | `dream-weadding-on-the-beach-1.html` *(typo "weadding" is live and indexable)* |

Casing is also inconsistent in the grid: **"Jeep safari"** (lowercase s) sits directly above
**"Quad Safari"** (capital S). **"Learn the secrets of Cretan Cuisine!"** is the only label ending in
an exclamation mark and by far the longest — it will break a uniform card grid.

### 4.3 Content depth — which pages cannot be redesigned as-is

**12 of 21 pages are flagged `needsContent: true`.** The distribution:

| Band | Pages | Verdict |
|---|---|---|
| 288 words | Dream Wedding on the Beach | Only genuinely publishable page. Full editorial article. |
| 50–82 words | Cretan Cuisine (82), Private Boat Trip (78), Water Sports (71), Organic Farm (53), Scuba Diving (50) | Thin but usable as intro copy. |
| 29–41 words | Private Helipad (41), Chauffeur (37), Jeep safari (33), Private Chef (31), Personal Trainer (29) | **One or two sentences. Not a page.** |
| 12–28 words | Quad Safari (28), Therapist (25), Wine Tasting (25), Wine Production (22), Breakfast on the Beach (20), Exclusive Tour (20), Bike Tours (19), Hiking (17), Running (17), **Massage (12)** | **Too thin to redesign as a standalone page.** Merge into a services list, or commission copy. |

**Massage** is the shortest page on the site: *"Book your appointment for a relaxing massage in comfort
of your villa!"* — 12 words, one image, no price, no duration, no therapist name.

**Duplicate copy:** Hiking and Running are near-identical.
Hiking: *"Ask us for **routs** in Crete. Explore the enchanting paths and enjoy the unique landscapes of Crete."*
Running: *"Ask us for **routs** in Crete. Explore the enchanting paths and enjoy the unique landscapes of Crete!"*
The only difference is the final punctuation mark. Typo "routs" (for "routes") preserved verbatim on both.

### 4.4 Dead-end calls to action (4 pages)

Four experience pages end with a call to action rendered as **plain text with no `<a href>`** — no
link, no mailto, no form. A guest reading them has no way to act:

| Page | Dead CTA (verbatim) |
|---|---|
| **Dream Wedding on the Beach** | *"For further information on hiring Thalasses Rituals as a wedding venue or to request a brochure with pricing and packages, or book a visit please **click here**."* — "click here" is bare text in a styled `<span>`. **This is the site's highest-value enquiry route and it goes nowhere.** |
| Exclusive Tour | *"Contact us for more **informations**."* |
| Water Sports | *"Contact us for more **informations**."* |
| Wine Tasting | *"Ask us for more **informations**."* |

"informations" (non-standard plural) preserved verbatim on all three.

### 4.5 Other experience-page facts

- **Working external links (3):** Organic Farm → `https://www.youtube.com/watch?v=hOLSbf0zgJg`
  ("Check out our planting process here!"); Breakfast on the Beach →
  `https://www.youtube.com/watch?v=3MLPeDij0kU` ("Check out our latest Video here!");
  Private Helipad → `https://youtu.be/LlitYjfYa3k` ("Check our video here!").
- **Stale content:** Dream Wedding states *"…with a new villa suitable for 6 guests **to be completed
  by May 2023**."* The date has passed. Kept verbatim; must be rewritten or removed.
- **Gallery captions:** Dream Wedding's 20 album images all share one caption,
  "Thalasses Rituals - Wedding Venue". Private Helipad's 8 images share "Thalasses Villas - Private
  Helipad". Organic Farm's 8 images share **"Thalasses Villas - Oganic Farm"** — *typo preserved
  verbatim*, and note the page's own body copy spells the brand **"Thallasses Villas"** (doubled l).
  Chef in Villa (12), Exclusive Tour (12) and Hiking (2) have **zero** captions.
- **Categories:** the live site has **no categories**. `categoryProposed` (Land / Sea / Taste /
  Wellness / Service) is an editorial grouping added for the redesign — confirm with the client.
- **`sourceTaxonomy`** for all 21 is "Experiences". Article 1899 ("Sitting outdoor area") is
  taxonomised **"Amenities"** and is deliberately not in this set.

---

## 5. Amenities, Location & Beaches, Careers, Contact, Terms

### 5.1 Amenities (`amenities.json`)

Section heading pair: eyebrow **"Amenities"** / heading **"Amenities"** / intro
**"Amenities of Thalasses villas"** *(lowercase "villas" — typo preserved)*. Six cards, each with a
photo and the identical link label **"Read more..."**. **No icons exist for any amenity** — the cards
use only a photo; every `icon` is `null`.

| Card | Description status | Source | Destination |
|---|---|---|---|
| Private Beach | ✅ recovered | modal 1896 | `javascript:void(0)` + Angular modal — **no URL** |
| Playground and vegetable garden | ❌ **none anywhere** | — | fancybox image only (`fancyArticleImage1897_2`) |
| Sitting outdoor area | ✅ | real page `/en/article/1899` | `article/1899-1.html` — **the only real URL** |
| Breakfast | ❌ **none anywhere** | — | fancybox image only (`fancyArticleImage3063_4`) |
| Doctor | ✅ recovered | modal 3795 | Angular modal — **no URL** |
| Babysitter | ✅ recovered | modal 3796 | Angular modal — **no URL** |

**Verbatim copy:**

- **Private Beach:** *"Five luxurious - seafront villas with a private golden - sandy beach !"*
  *(spacing around both hyphens and before the exclamation mark preserved)* /
  *"The clear blue sea and exclusive private beach equipped with sun loungers and sunshades will
  satisfy the most demanding sea and sun worshipers."* — 13 full-size images.
- **Sitting outdoor area:** *"Enjoy your dinner in the outdoor sitting area which provides you a gas
  barbecue station, as well."* / *"Daily breakfast can be arranged for our guests!"* — **25 words of
  copy against a 58-image album.** Every `data-caption` in that album is empty and every alt is the
  generic CMS label **"Album Image  #NNNNN"** (two spaces before the hash). The album is far larger
  than one outdoor sitting area needs and appears to mix several amenities.
- **Doctor:** *"Doctor who can come to your place 24 hours a day."* / *"For each of your emergencies
  there is a doctor who can come to your place 24 hours a day. **Due to the disease Covid-19** a doctor
  can come to your place in case you need a rapid test."* — **dated copy**; names no clinic, doctor,
  phone number, call-out fee or coverage area.
- **Babysitter:** *"We can provide babysitting services. Please contact us for more information."* —
  no rates, minimum hours, notice period or age range, and "contact us" names no channel.
  The same service is sold again on every property page as **"Baby sitting"** — two labels, one service.

**Still missing:** "Playground and vegetable garden" and "Breakfast" have **no description anywhere in
the source** — no modal, no article page, no alt text beyond the card title. Copy must be commissioned.
Related but **not** a description of the Breakfast card: article 1899 says *"Daily breakfast can be
arranged for our guests!"* — that sentence belongs to a different amenity and must not be silently
reassigned.

**No amenity anywhere states a number** — no count, size, capacity, price or opening hours.

### 5.2 Location & Beaches (`location.json`)

Section heading pair: eyebrow **"Location"** (h6) / heading **"Beaches"** (h2). The teaser paragraph
carries class `hidden-xs` — **it is not shown on mobile at all**. "Read more..." opens
`loadArticlesModal('en',1898)`; **there is no linkable Location page.**

Address (verbatim, including the trailing comma):

```
Thalasses Villas
Pigianos Kampos area
Rethymno,
74100
Greece
```

Coordinates `35.380146561951, 24.57279329824`. **The homepage renders no map at all** — the Google
Maps script targets `#lodge-map` but no such element is output; the marker cluster array is empty
(`var clusters = [];`). The info-window writes the place name as **"Pigianos kampos "** (lowercase k,
trailing space) while the contact block writes **"Pigianos Kampos area"**.

**Named places recovered from modal 1898 (the first pass wrongly recorded `nearby: []`):**

| Place | Stated distance |
|---|---|
| Villas' private beach | **50m** |
| Rethymno beach | **8 km** ("located 500m east of the city centre") |
| Ammoudaki beach | *(none stated)* |
| Damnoni beach | *(none stated)* |
| Klisidi | *(none stated — reached from Ammoudaki "only with a dive")* |
| Schinaria | *(none stated)* |
| Triopetra | *(none stated)* |
| Agios Pavlos | *(none stated)* |
| Preveli | *(none stated)* |
| Plakias village | *(none stated)* |
| South coast (region) | **"about 40 minutes by car"** |

These three quantities — 50m, 8 km, ~40 minutes — are the **only** distances stated anywhere on the
site. **No airport, port or town-centre distance exists.** Do not estimate the null ones.

**Encoding:** modal 1898 contains **genuine U+FFFD replacement characters** in the live source
(irrecoverable upstream mojibake, not a decoding error on our side): "Rethymno**�**s beach",
"Crete**�**s most amazing", "**�**Schinaria**�**", "**�**Triopetra**�**", "**�**Agios Pavlos**�**".
`paragraphs` preserves them verbatim; `paragraphsNormalized` supplies the intended apostrophes and
curly quotes. The fourth beach is quoted with straight ASCII quotes in the source (`"Preveli"`) and is
left that way in **both** variants — the inconsistency is in the source.

**Source typos preserved:** *"the adjacent beaches of **Ammoudakii**"* (doubled i) vs "Ammoudaki"
elsewhere vs *"the beaches of **Ammoudi**"* — **three spellings for one place**;
*"Damnoni beach **:**"* (space before colon); *"Furthermore, **On** the South coast"* (capital mid-sentence).

**None of the 11 modal images has a caption or alt text**, so no photo can be matched to a named beach.

### 5.3 Careers (`site.json` → `careers`, from modal 3869)

Section: heading **"Career Opportunities"**, body **"Become a member of our team!"**, card label
**"Become one of us!"**, CTA **"Read more..."**. The identical card is rendered twice (once
`.hidden-xs`, once `.visible-xs`) — **one job listing, not two.**

Verbatim copy:

> "Become part of our team! A team that shares more than the same employer **�** We share a vision."
> "Push your ambitions in a work atmosphere characterized by freedom, autonomy and growth culture."
> "Become one of us and send your CV at **creteholidayhome@gmail.com**."

- The **U+FFFD** in paragraph 1 is a genuine broken character in the live source where an en dash
  belongs. `paragraphsNormalized` supplies the intended "–".
- **The careers email is `creteholidayhome@gmail.com`, not `info@thalasses.com`.** It is a third-party
  Gmail address matching the partner company `creteholidayhome.com`. Applications therefore leave the
  thalasses.com domain entirely.
- The address appears **only as plain text** — it is not a `mailto:` link and, unlike the contact email,
  it is **not Cloudflare-obfuscated**, so it is exposed to scrapers as-is.
- **No role, department, location, contract type, salary or closing date is stated anywhere.** The
  section advertises a culture, not a vacancy. There is no crawlable careers URL (`href` is `null`).

### 5.4 Contact (`site.json` → `contact`)

- **Heading:** "How can we assist you?" · **Form intro:** "Fill up this form to contact us if you have
  any further questions"
- **Address:** Pigianos Kampos area / Rethymno, 74100 / Greece
- **Phones:** `(+30) 6974069475` and `(+30) 2114445757`
- **Email:** `info@thalasses.com` — recovered by decoding Cloudflare obfuscation
  `data-cfemail="630a0d050c23170b020f02101006104d000c0e"` (XOR key `0x63`). The rendered page shows
  only "[email protected]".
- **Form:** POSTs to `https://formspree.io/f/mrbkgjzw`. Fields: First Name, Last Name, Email, Message
  (all required). Placeholders: email = *"You will get your reply to this email"*, message = *"Type the
  message you wish to send"*. Consent line: *"I hereby certify that the information above is true and
  accurate."* Submit label: **"Submit"**. A second, older AngularJS contact form (`sendContact()`) is
  present but fully commented out.
- **Socials:** Facebook `https://www.facebook.com/villasthalasses`, Instagram
  `https://www.instagram.com/thalasses_villas/`, YouTube
  `https://www.youtube.com/channel/UCiHumP-cMIBORj4fVf9tCvw/videos`
- **Partner:** logo `creteholidayhome-logo-1.jpg` → `https://creteholidayhome.com/`, introduced by
  *"Sales and Marketing queries:"*. **The company name is not stated anywhere** — the alt text is only
  "manager logo".
- **Press:** an image-only link to `https://www.cntraveler.com/story/where-to-stay-in-crete`
  (alt "cn_traveller", height 350, `target="_blank"`). **No quotation, award name, headline or date
  accompanies it.**
- **Footer copyright:** `Copyright © 2025 Δόμηση Ντιβελόπμεντ Αξτεε All Rights Reserved.` — the Greek
  name is stored **double-encoded** in the source bytes and renders as
  `ÎÏÎ¼Î·ÏÎ· ÎÏÎ¹Î²ÎµÎ»ÏÏÎ¼ÎµÎ½Ï ÎÎ¾ÏÎµÎµ`. The value recorded is the correctly decoded text.
  Confirm the exact legal name (likely an ΑΞΤΕΕ entity) before publishing.

### 5.5 Terms & Conditions (`terms.json`)

`<h1>` **"Terms and Conditions"**. 13 sections (1 unheaded intro + 12 numbered), **3,285 words**.

| Section | Words | Section | Words |
|---|---|---|---|
| *(intro, no heading)* | 131 | 6.0 Credit card or bank transfer | 393 |
| 1.0 Definitions | 128 | 7.0 Pre-payment, cancellation, no-show and fine print | 523 |
| 2.0 Scope of Service | 321 | 8.0 (Further) correspondence and communication | 305 |
| 3.0 Prices, crossed-out rates and Best Price Guarantee | 318 | 9.0 Disclaimer | 594 |
| 4.0 Privacy and cookies | 18 | 10.0 Intellectual property rights | 201 |
| 5.0 Free of charge | 70 | 11.0 Miscellaneous | 230 |
| | | 12.0 About the company and the support companies | 53 |

**This document is unmodified third-party OTA boilerplate.** Findings:

- **"Ink Hotel" appears five times where the operator's own name should be.** Verbatim:
  *"\"Platform\" means the (mobile) website and app on which the Service is made available owned,
  controlled, managed, maintained and/or hosted by **Ink Hotel**."* (1.0) ·
  *"By making a reservation through **Ink Hotel**…"* (2.0) ·
  *"Suppliers pay a commission … to **Ink Hotel** after the end user has consummated the service…"* (5.0) ·
  plus 7.0 and 9.0.
- **Encoding bug preserved verbatim:** section 1.0 opens
  `"�Thalasses Villas�, "us", "we" or "our" means Thalasses Villas…"` — the served bytes are
  double-encoded UTF-8 (`C3 A2 C2 80 C2 9D`) for a curly quote. Section 6.0 has the same fault:
  *"Thalasses Villas**â** secure server"* (intended: `Thalasses Villas’ secure server`).
- **Registered address, stated twice, inconsistently:** *"Trantallidou 13-15 Rethymno, 74100 Crete"*
  (1.0) vs *"Trantallidou 13**- **15 Rethymno, 74100 Crete"* (12.0). **This is a different address from
  the villas' location** and must not be used as the property address.
- **Unverified identifiers (12.0):** Chamber of Commerce number **998802380**, VAT **EL998802380**.
- **Typos preserved:** *"**providded** by Thalasses **Villa**"* (intro — missing final s);
  *"a company incorporated under the laws of **the** Greece"* (1.0).
- **No `<ul>`, `<ol>` or `<li>` exists on the page** — every section, including the definitions, is a
  run of plain `<p>` elements. The twelve numbered headings are **plain paragraphs**, not headings.
  Only the page title is an `<h1>`.
- **Section 3.0 promises a "Best Price Guarantee" that is never described.** Sections 4.0 and 8.0 refer
  to "our privacy and cookies policy" — **no such page exists and no link is given.** Section 3.0
  mentions a currency converter, 9.0 mentions photo uploads and guest reviews — **none of these
  features exist on this site.** Section 5.0 describes an intermediary/commission business model that
  does not match a direct villa-owner website.
- **No effective date or last-updated date is stated anywhere.**
- **The full text is duplicated a second time** inside the site-wide footer modal
  `<div id="modal_termsAndConditions">` (headed "Terms & Conditions", with an ampersand) — on **every
  page of the site**. This is what inflates every page's raw word count by ~3,300.
- **Meta mismatch:** `<title>` is "Thalasses Villas - Terms & Conditions" but `og:title`/`twitter:title`
  are the generic "Thalasses Villas - Living Unlimited", and the meta description is the generic villa
  marketing blurb.

---

## 6. Booking

**Engine: WebHotelier (`reserve-online.net`).** Two different hostnames are in use, chosen
**server-side per page template** — no JavaScript touches the `action` attribute.

### 6.1 The two hosts

| Scope | Action URL | Method | Pages | Room code sent |
|---|---|---|---|---|
| **Global** | `https://thalassesvillas.reserve-online.net/` | GET *(inferred)* | 24 (home ×2, all 21 experiences, article 1899) | none |
| **Property** | `https://etouri.reserve-online.net/` | GET *(inferred)* | 5 (`/property/200,201,202,203,2142`) | `room=WH<propertyId>` |

100% consistent across all 29 pages. **Neither form declares a `method` attribute** — GET is the HTML
default, not a stated value.

### 6.2 Parameters

| Name | Type | Required | Example | Notes |
|---|---|---|---|---|
| `room` | hidden | no | `WH200` | **Property form only.** Value pattern = `WH` + Loggia property id. |
| `exclusive` | hidden | no | `1` | **Both forms**, identical hardcoded value. Meaning undocumented in the source. |
| `checkin` | text | **no** | — | `type="text"`, no value/placeholder/pattern/min/max, `autocomplete="off"`. Filled by a JS datepicker. |
| `checkout` | text | **no** | — | Same. |
| `adults` | number | **yes** | `2` | `min=1`. Global form: `id="adults1"`, no default, placeholder `"Max"`. Property form: `id="adults"`, `value="2"`, placeholder `"Max "` (trailing space). |
| `children` | number | **yes** | `0` | `min=0`. Global form element id is `kids` but the **submitted name is `children`**. |
| `frm_book_kid` | number | no | — | Repeated per child, `min=1 max=17`. **See the bug below.** |

Room codes: `WH200` = Villa Thoi · `WH201` = Villa Persi · `WH202` = Villa Eeanthe ·
`WH203` = Villa Melia · `WH2142` = Thalasses Villas (whole estate).

### 6.3 What is established (high confidence)

The engine; both action URLs; `target="_blank"`; the exact parameter names and their hidden/visible
status; the `exclusive=1` constant; the mechanical `WH` + property_id room-code derivation; and
which pages do and do not carry the widget. All of this is literal, unambiguous markup, 100%
consistent across 29 pages.

**Pages with no booking widget at all (13):** `/en/villa-pueblo`, `/en/thalasses-rituals`,
`/en/terms-and-conditions`, and all ten `/albums` and `/map` sub-pages. On Villa Pueblo and Thalasses
Rituals there is also **no anchor or button to `reserve-online.net` anywhere** — the only
booking-adjacent CTA is `<a href="#contact">Contact</a>`.

### 6.4 What is NOT established (low confidence)

- **The date format is unknown.** Exhaustive search of all 43 raw files found zero format tokens, zero
  literal dates, and no `datepicker` / `.format(` / `moment(` strings in any inline script. All ten
  inline scripts in `root.html` were dumped and inspected (Analytics, New Relic, JSON-LD, gtag, two
  Facebook pixels, reCAPTCHA, a POI-modal helper, Swiper init, an img-alt patch) — **none touch the
  calendar.** The logic lives in uncaptured bundles; the presence of `moment.min-1.js` +
  `vendor/twix/dist/twix.min-1.js` confirms a moment-based range picker but not its output format.
- **Likely live bug — child ages are silently dropped.** The `frm_book_kid` inputs sit **outside** the
  `<form id="webHotelierForm">` element (byte offsets in `root.html`: form spans 57023–58910; the
  inputs are at 59457 and 60052) and carry **no `form=` attribute**. A native browser submission
  cannot include them.
- **`booking_domain='https://booking.loggia.gr/en/book'`** is declared via `data-ng-init` on the
  homepage only and **is never used as a form action anywhere.** Purpose unknown.
- **The relationship between the two hosts cannot be resolved from HTML alone** — same inventory under
  two slugs, two separate accounts, or one stale value?

### 6.5 Candidate deep-link shape — NOT VERIFIED, do not ship

```
https://etouri.reserve-online.net/?room=WH200&exclusive=1&checkin=<DATE>&checkout=<DATE>&adults=2&children=0
https://thalassesvillas.reserve-online.net/?exclusive=1&checkin=<DATE>&checkout=<DATE>&adults=2&children=0
```

The parameter names and the method are certain; **the date serialisation is not**, and a WebHotelier
search URL with mis-formatted dates will not prefill. **Overall confidence: medium.**

---

## 7. Assets

### 7.1 Counts

`assets-manifest.json` identifies **684 unique files** from the HTML crawl: 673 CDN images + 11
non-CDN files. By role:

| Role | Count |
|---|---|
| gallery | 485 |
| experience | 78 |
| amenity | 63 |
| hero | 44 |
| icon | 1 |
| logo | 1 |
| other | 1 |
| **Total CDN** | **673** |

For **666 of 673** the full-size URL was literally present in the source (`fullSizeObserved: true`).
For **7** only a `_thumb` URL was ever exposed, so the un-suffixed URL is **inferred** from the
site-wide pattern: `b622671c688bf1d7e961ee48e409f2e3` (Babysitter),
`14e77715b78ae6ce96ada21da4e1c939` (Breakfast), `2119a061fcb9f948a11656d6c8a75ab0` (Doctor),
`b1bbe80a75b67db2c4370e62f6f836f3` (Playground), `ae3b9459e2e659faf3e93e5ab2e3e196` (Private Beach),
`2984622fa70b8aaa4796d646c5a7c6ea` (A Moment of Fairytale card),
`df2bacefb7d7d5df11c75781c3e5249f` (Careers).

**Reconciling the manifest (673) against what is on disk (694):**

| | Count | Explanation |
|---|---|---|
| CDN hashes in `assets-manifest.json` | 673 | Derived from the crawled HTML |
| …of which downloaded | 672 | — |
| …not downloaded | **1** | The favicon hash `75464c620f03fc7b66873934f4392ada` — the CDN only ever served `_square_thumb_{60,76,120,152,256}.png` for it, never a full-size original (see §7.2) |
| Extra hashes on disk, not in the manifest | **22** | The modal images recovered *after* the manifest was built — the 13 Private Beach (1896) images and the 11 Beaches (1898) images, minus overlap |
| **Total in `public/images/_pool/`** | **694** | |

**`content/missing-assets.txt` is stale.** It lists 68 hashes, and **all 68 are now present in
`public/images/_pool/`** — they were downloaded after that list was written. It should be regenerated
or deleted; do not treat it as a to-do list.

### 7.2 The full-size URL rule

> Take the 32-hex image hash and request it with **no size suffix**:
> `https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/<hash>.jpg`
> Strip any `_thumb` / `_square_thumb_<n>` suffix **and** any crawler `-<n>` mirror suffix first.

Size variants observed:

| Suffix | Where used | What it is |
|---|---|---|
| *(none)* `<hash>.jpg` | fancybox targets, parallax backgrounds, hero swiper slides, modal backdrops — 1046 refs | **Full-size original** |
| `_thumb.jpg` | album grid tiles, home cards, gallery strips, **every `og:image`/`twitter:image`** — 840 refs | Server-resized thumbnail |
| `_thumb.webp` | `data-webp` paired with `_thumb.jpg` — 231 refs | WebP re-encode, same pixels |
| `.webp` | `data-webp` on jumbotron slides — 91 refs | WebP re-encode, same pixels |
| `.png` | header logo `3e3b5013ec554338704411496c011ec4` only — 81 refs | Full-size transparent PNG |
| `_square_thumb_{60,76,120,152,256}.png` | apple-touch-icon + favicon, hash `75464c620f03fc7b66873934f4392ada` | **Exception** — only these variants were ever served; largest observed is `_square_thumb_256.png` |
| `-1`, `-2`… | local mirror only | **Not a CDN variant** — the crawler's dedup suffix. Strip it. |

The `.webp` forms are same-dimension re-encodings, **not larger renditions**.

### 7.3 Where the files are on disk

| Path | Contents |
|---|---|
| `public/images/_pool/` | **694 files, 372.5 MB**, flat, named `<hash>.jpg` |
| `public/images/_site/` | 10 files, 14.1 MB — non-CDN host assets |
| `content/image-index.json` | 704 entries: `{store, bytes, width, height, format, path, aspect}` |
| `content/assets-manifest.json` | 673 CDN assets with `hash / sourceUrl / absoluteUrl / localPath / usedOnPages / role / alt / fullSizeObserved` |
| `content/all-assets.txt` | 697 raw URL strings (the inflation is the same hash appearing in relative + absolute + variant forms) |
| `content/missing-assets.txt` | 68 hashes — **stale, all 68 are downloaded** |

Downloaded originals are genuinely large: **93 of 694 are ≥3000 px wide**; the widest is 3300 px;
median width 2248 px. Formats: 698 JPEG, 5 PNG, 1 SVG.

The 10 `_site` files include the four villa Spaces backdrops served from the site host rather than the
CDN — note the **folder spellings do not match the villa names**: `/assets/images/eanthe/Out_1_1.jpg`
(villa is "Eeanthe"), `/assets/images/mailia/Out_1_11.jpg` (villa is "Melia"), plus `persi/` and `thoi/`.
Also here: the Condé Nast Traveler badge, the `creteholidayhome` partner logo (a **third-party brand
asset served from a WordPress uploads path — do not re-host without permission**), and CMS chrome.

### 7.4 Video

Three YouTube iframe embeds (560×315, `span.videoWrapper`), **none with a title attribute, caption or
transcript**:

| Video | Pages |
|---|---|
| `3MLPeDij0kU` | `/en/property/200` (Villa Thoi) |
| `7VWaiDAWPdY` | `/en/property/202`, `/en/property/203`, `/en/property/2142`, `/en/thalasses-rituals` |
| `x0U8hZkxcJk` | `/en/villa-pueblo` |

Plus four YouTube links in body copy or cards (see §4.5 and §4.1).

### 7.5 Alt text — a site-wide accessibility failure

- Most album/gallery images have alt of the form **"Album Image  #<id>"** (double space preserved) —
  a CMS internal id, not a description.
- The six villa hero-swiper slides and the six "Photo gallery" tiles on each villa page have
  **no alt attribute at all**.
- Homepage hero slides carry only **"Jumbotron-Img-1"…"Jumbotron-Img-6"**; villa teaser cards carry
  only **"Gallery-Photo-1"…"Gallery-Photo-7"**.
- **No image dimensions, byte sizes or MIME types are stated anywhere in the source.**

**All alt text must be written from scratch.**

### 7.6 Captions (`captions.json`)

**906 fancybox anchors** across 20 pages. The distribution is stark:

| Page group | Anchors | With caption |
|---|---|---|
| Villa pages 200/201/202/203 (featured galleries) | 172 | **160** |
| Villa page 2142 (featured gallery) | 40 | **0** |
| Service cards (6 per property page × 5) | 30 | **30** |
| All `/albums` pages (200/201/202/203/2142) | 511 | **0** |
| Article 1899 album | 58 | **0** |
| Thalasses Rituals gallery | 25 | **0** |
| Experience albums | 62 | 35 (3 repeated strings) |
| Homepage article thumbnails | 8 | 0 |

**The six service cards recovered from `fancyServiceImages<id>`** — present on **every** property page,
dropped entirely by the first pass:

| Group id | Name (verbatim) |
|---|---|
| 391 | Cook (professional chef) in the villa |
| 393 | Baby sitting |
| 1156 | Pool maintenance |
| 329 | Pool Towels |
| 405 | Diving |
| 402 | Daily Excursions |

Casing is inconsistent in the source: "Pool **T**owels" and "Daily **E**xcursions" are title case,
"Baby **s**itting" and "Pool **m**aintenance" are not. **These six are names only — no descriptions,
prices or booking exist.** The rest of the Services block (Included Services / On Request / Services
store tabs) is rendered at runtime by `loadServices('en', {property_id: <id>})` and is **not in the crawl**.

---

## 8. Source contradictions

Every item below is a genuine conflict inside the live source. **None has been resolved** — the client
must decide. Quotes are verbatim.

**1. Four villas or five?**
Homepage/meta: *"**Five** luxurious villas in a privileged seafront location."*
Property page teaser (2142): *"Thalasses Villas are **five** luxurious independent villas…"*
Property page modal (2142), same page: *"Thalasses Villas are **four** luxurious independent villas…"*
…then, two clauses later: *"…offer our guests having **5** independent seafront retreats…"*
Individual villa pages 200/201/202/203: *"Thalasses Villas are **four** brand new luxurious villas…"*
Villa Pueblo: *"…when you book one of our **five** Thalasses Villas, Villa Pueblo"*
The "Our Villas" nav lists **seven** entries (Pueblo, Rituals, Thoi, Melia, Eeanthe, Persi, and the
whole-estate listing). The 2142 modal's per-villa breakdown names **five** villas (Thoi, Persi, Melia,
Eeanthe, Pueblo) in the very paragraph that says "four".

**2. Six bathrooms or nine (or twelve)?**
2142 Attributes stat strip: **"6 Baths"**.
2142 teaser and modal: *"12 bedrooms, **9** bathrooms"*.
Per-villa breakdown totals **9** (1+1+2+2+3) excluding Villa Pueblo's 3 — **12** including it.
`specs.bathrooms` is recorded as 6 because specs must come from the structured stat field.

**3. Eighteen guests or twenty-four?**
2142 stat strip: **"24 Sleeps up to"**.
2142 modal: *"The villas can accommodate **18** people in beds"* and *"a dining table for **18** people"*.
Dream Wedding page: *"The on-site accommodation consists of four luxurious villas for up to **18**
guests, with a new villa suitable for 6 guests to be completed by May 2023."*
Individual villa capacities sum to 5+5+6+4 = **20** (or +6 for Pueblo = **26**).

**4. Four pools or five?**
2142 stat strip: **"4 Pools"**.
2142 modal: *"Each villa's outdoor area has: swimming pool…"* — while naming **five** villas.

**5. 50 metres from the beach, or "a few meters"?**
Every villa meta description: *"…in a privileged location **50 m** from a private beach."*
Every villa long description, same page: *"…just **a few meters away** from our organised and well
thought out private beach."*
Gallery captions: *"Each villa will have private lux sun beds in our private beach which is **50m** away"*
Facilities tooltip (feature "Beach"): *"The nearest beach is **50 m** away from the villa"*
Modal 1898: *"Villas' private beach which is only **50m** distance."*

**6. "Ink Hotel" is named as the platform operator in the Terms.**
*"…the Service is made available owned, controlled, managed, maintained and/or hosted by **Ink Hotel**."*
Five occurrences. This is unreplaced third-party boilerplate on a page that also declares
*"Thalasses Villas, a company incorporated under the laws of the Greece"*.

**7. Two different registered addresses.**
Villas: *"Pigianos Kampos area, Rethymno, 74100, Greece"*.
Terms 1.0/12.0: *"Trantallidou 13-15 Rethymno, 74100 Crete"* / *"Trantallidou 13- 15 Rethymno, 74100 Crete"*.

**8. Pool heating price stated four different ways.**
Villa Thoi: *"…with **na** additional daily charge upon request."*
Villa Persi & Eeanthe: *"…with **an additional charge per day** upon request."*
Villa Melia: *"…with **an additional daily charge  upon request.**"* (double space)
Gallery captions on **201 and 203**: *"The swimming pool can be heated with **additional 35€ per day**
upon request."* — **the only price anywhere on thalasses.com.**
Facilities tooltip (feature "Private pool", villa 200): *"**20 square meters** swimming pool. The
swimming pool can be heated with an additional daily charge upon request."* — and **20 m² is the only
pool dimension stated anywhere**, contradicting Thalasses Rituals' *"unique pool of 150m2 with salt water"*.

**9. Two contact email addresses on the same page.**
General: `info@thalasses.com` (Cloudflare-obfuscated).
Careers: `creteholidayhome@gmail.com` (plain text, third-party domain).

**10. Thalasses Rituals renders Villa Pueblo's amenities.**
`/en/thalasses-rituals` loads `app/index-1.js`; `facilities/index.json` is identical in content to
`facilities/pueblo.json`; the page hard-codes `loadFeatureGroupModal('en', group.group_id, '**10655**')`
— Villa Pueblo's id — while its own init is `fetchFacilities('**7798**','en')`.

**11. Two contradictory ways of counting bedrooms on Thalasses Rituals.**
Stat strip: **"3 Bedrooms"**. The counter's own handler: `loadBedroomsModal('en',**0**)`.

**12. Three different header/footer variants for one site.**
`/property/<id>` pages carry an extra **"Gallery"** nav item and **one** social link — Facebook at
`https://www.facebook.com/villasthalasses/?ref=bookmarks` (note the query string the homepage lacks).
The homepage has **no** Gallery item and **all three** socials. `/villa-pueblo` and
`/thalasses-rituals` match the homepage nav but have **no social links at all**. Instagram and YouTube
are unreachable from any property page.

**13. The phone link is broken on every non-home page.**
Homepage: two anchors, `tel:+306974069475` and `tel:+302114445757`.
Every property, Pueblo and Rituals page: a single malformed anchor
`tel:+6974069475, (+30) 2114445757` — both numbers in one URI with the `+30` country code dropped
from the first. **This link cannot dial.**

**14. Place name spelled two ways.**
"Pigianos Kampos" (address, page 2142, villa paragraph 2) vs
"**Piganos** Kampos" (villa benefits bullet: *"the complex is located in Piganos Kampos"*) vs
"Pigianos kampos " (map info-window, lowercase k, trailing space).

**15. Tagline cased three ways.**
"Living **U**nlimited!" (Villa Pueblo) · "Living **u**nlimited!" (Thalasses Rituals) ·
"Living **u**nlimited" (no exclamation mark, all four property pages) ·
"Living Unlimited" (homepage hero/h1).
Featured-villa card taglines repeat the same three-way split.

**16. `og:url` differs between the two copies of the home page.**
`root.txt` declares `https://thalasses.com/`; `en__index-1.txt` declares `https://thalasses.com/en/`.
Both declare the same relative `CANONICAL` value `index-1.htm`, **which is not a valid absolute canonical.**

**17. Dead anchor.** The footer links to `#overview`, but **no element with `id="overview"` exists** —
the intro is wrapped in `<div id="descriptions">`. The newsletter anchor is spelled
`id="newsetter"` (missing an l).

### 8.1 Source typos preserved verbatim (do not silently fix)

| Typo | Where | Should be |
|---|---|---|
| `weadding` | live URL slug `dream-weadding-on-the-beach-1.html` | wedding — **indexable URL, needs a redirect** |
| `hot tube` | long description of all four villas | hot tub *(captions on the same page say "hot tub")* |
| `na additional` | Villa Thoi pool-heating sentence | an additional |
| `routs` | Hiking and Running body copy | routes |
| `informations` | Exclusive Tour, Water Sports, Wine Tasting | information |
| `Piganos Kampos` | villa benefits bullet | Pigianos Kampos |
| `Jeep safari` | homepage card (next to "Quad Safari") | casing inconsistency |
| `Oganic Farm` | Organic Farm album caption ×7 | Organic |
| `Thallasses Villas` | Organic Farm body copy | Thalasses |
| `Ammoudakii` / `Ammoudi` / `Ammoudaki` | modal 1898 | three spellings, one beach |
| `single-story` vs `single-storey` | same paragraph pair, villas 200/201 | pick one |
| `providded by Thalasses Villa` | Terms intro | provided / Villas |
| `laws of the Greece` | Terms 1.0 | laws of Greece |
| `two of them features master beds` | Villa Pueblo | feature |
| `which designed by well know designers` | Villa Pueblo | well known |
| `a fixture private chef ,` | Villa Pueblo | stray space before comma |
| `Amenities of Thalasses villas` | amenities intro | lowercase v |
| `kids` (vs `Adults`) | booking bar label, every page | casing |
| `“Augenti"` | brand paragraph, all four villas | unbalanced quote (curly open, straight close) |
| `Living space` vs `Living room` | Melia vs Eeanthe Spaces tile | pick one |
| `Album Image  #NNNNN` | every album alt | double space |
| `  Terms of Use` | footer link `<strong>` | two leading spaces |
| `eanthe/` `mailia/` | asset folder names | Eeanthe / Melia |

### 8.2 Encoding

The CMS stored **double-encoded UTF-8** (UTF-8 bytes re-read as Latin-1) in several places. These have
been decoded back to real characters throughout the JSON: **Schüko, Compac, Kährs, water's edge, 35€,
Δόμηση Ντιβελόπμεντ Αξτεε**, and all curly quotes/apostrophes.

Separately, three strings contain a **genuine U+FFFD replacement character in the live source** —
irrecoverable upstream corruption, not a decoding error on our side. For these the raw string is
preserved **and** a normalised variant supplied (`paragraphs` + `paragraphsNormalized`):

1. Careers modal 3869: *"the same employer **�** We share a vision"* → en dash
2. Beaches modal 1898: *"Rethymno**�**s"*, *"Crete**�**s"*, *"**�**Schinaria**�**"*, *"**�**Triopetra**�**"*,
   *"**�**Agios Pavlos**�**"* → apostrophes and curly quotes
3. Terms 1.0 and 6.0: *"**�**Thalasses Villas**�**"*, *"Thalasses Villas**â** secure server"*

---

## 9. What is genuinely missing and must come from the client

### 9.1 Blocking — the redesign cannot ship without these

| # | Item | Why blocking |
|---|---|---|
| 1 | **Resolve contradictions 1–5 in §8** (villa count, bathrooms, guests, pools, beach distance) | These are the headline facts on every page. They cannot be guessed. |
| 2 | **Copy for "Playground and vegetable garden" and "Breakfast"** | Two of six amenity cards have **zero** description anywhere in the source. |
| 3 | **A real destination for every "Read more..."** | Five of six amenity cards, the entire Location section and the Careers card open Angular modals with **no URL**. Nothing is linkable, bookmarkable or indexable. |
| 4 | **The Dream Wedding "click here" destination** | The site's highest-value enquiry route (venue hire, brochure, pricing, site visit) is **plain text with no link**. |
| 5 | **A real Terms & Conditions document** | The current one names **"Ink Hotel"** five times, describes an OTA commission model, references a currency converter, photo uploads and guest reviews that do not exist, promises an undescribed Best Price Guarantee, and links to a privacy/cookies policy **that does not exist**. Needs legal review, not a rewrite. |
| 6 | **A privacy & cookies policy** | Referenced twice in the Terms. **No such page exists on the site.** |
| 7 | **Which WebHotelier host is authoritative** | `thalassesvillas.` vs `etouri.reserve-online.net` — cannot be reconciled from HTML. |
| 8 | **The WebHotelier date format** | Without it no deep link will prefill. Recoverable by reading the live datepicker output, or from WebHotelier. |
| 9 | **Confirm the legal entity name** | Footer renders mojibake; decoded as "Δόμηση Ντιβελόπμεντ Αξτεε". Terms give a **different** address and unverified CoC/VAT numbers. |
| 10 | **Alt text for 694 images** | Every album alt is "Album Image  #NNNNN"; hero and gallery images have **no alt at all**. This is an accessibility and SEO failure across the whole site. |

### 9.2 Content that must be written

| Item | Current state |
|---|---|
| Meta descriptions for all 21 experience pages | Each is the page title repeated |
| Body copy for the 12 thin experience pages | 12–41 words each; ten are under 30 words |
| Thalasses Rituals page copy | **18 words total.** No long description exists — the modal is empty. |
| Villa Pueblo gallery | **5 images, zero captions, no album, no /albums page** |
| Spaces / room descriptions (all villas) | Every one is `null` — bodies live behind `loadPoolModal` / `loadBedroomsModal` / `loadSpaceModal`, which 404 |
| Services detail | Six service names, **no descriptions, no prices, no booking** |
| Hero slides 2–6 copy | Only slide 1 has a heading; slides 2–6 have `&nbsp;`-only captions |
| Per-slide/album captions for 511 uncaptioned `/albums` images | All empty |
| The 58-image article-1899 album | 25 words of copy; album appears to mix several amenities |
| The 2142 featured gallery (40 images) | Every `data-caption` is empty |
| "A Moment of Fairytale" | A YouTube link and one thumbnail. **No title, no description, no page.** |
| Careers vacancy detail | Culture copy only — no role, department, location, contract type, salary or closing date |
| Condé Nast Traveler endorsement wording | Image link only; **no quote, award name, headline or date** |
| Partner company name | Alt text is "manager logo"; **the name is not stated anywhere** |
| `shortDescription` for property 2142 | **Truncated mid-sentence in the source** |

### 9.3 Commercial and operational data absent from the entire site

**Not one of these appears anywhere on thalasses.com:**

prices and rate cards (the sole exception being the 35€ pool-heating caption) · seasonal pricing ·
minimum stay · deposit · cancellation policy · no-show policy · check-in time · check-out time ·
house rules · pet policy · smoking policy · children policy (beyond Pueblo's "(Adults Only)") ·
airport transfer information · **distance to airport, port or town centre** · guest reviews ·
testimonials · awards · staff or team names · a sitemap · a booking confirmation flow ·
accessibility statement · **any date on the Terms**.

### 9.4 Technical decisions required

- **Hidden facilities tabs:** 74 / 72 / 74 / 73 / 73 / 12 features per property are **real CMS data the
  live site has never displayed**. Surface them, or confirm they should stay hidden.
- **Unresolved enum values:** `featureType: 7` items (TV, Channels, Movies, Music, Legal coverage, Car
  park type, Cooling, Hot waters) carry numeric ids that **cannot be resolved without the CMS lookup
  table** — e.g. `Cooling = 45`, `Hot waters = 51`. Request the table.
- **Exposed keys:** a Google reCAPTCHA site key (`span#captchaSiteKey`) and a Google Maps API key (in
  the maps script `src`) are in the page markup. **Do not carry these over blindly.**
- **The `frm_book_kid` bug** (§6.4) is probably live today. Verify against the running site.
- **Newsletter:** the entire section is **commented out** in the HTML. Its markup contains the eyebrow
  "Stay in touch", the heading "Sign up now and receive exclusive offers and benefits.", the note
  "We value your privacy. None of the details supplied will be shared with external parties" and
  fields First name / Last name / Email Address. Confirm whether to revive it.
- **`footer.poweredBy`** ("Made with Loggia's SimpleLodge" + W3C/AChecker badges) is present but wrapped
  in an HTML comment — not rendered.
- **URL normalisation:** nav hrefs are relative and differ between the root and `/en/` copies of the
  home page. Normalise to absolute paths and set real canonicals.
- **Redirects:** preserve `dream-weadding-on-the-beach`, `biological-garden`, `jet-ski-safari`,
  `chef-in-villa`, `boat-trip`, and all `/en/property/{id}` + `/albums` + `/map` paths.

---

## Appendix — file map

| File | What it holds |
|---|---|
| `content/site.json` | Brand, nav, hero, booking bar, intro, press, featured villas, experiences grid (22 cards), careers, contact, partner, socials, footer, newsletter + 42 todos |
| `content/amenities.json` | 6 amenity cards with recovered descriptions, images, sources + todos |
| `content/location.json` | Beaches modal (7 paragraphs, raw + normalised), address, coordinates, **11 named places**, 11 images + 18 todos |
| `content/terms.json` | 13 sections, 3,285 words, verbatim + 22 todos |
| `content/booking.json` | 2 endpoints, 7 parameters, hostname analysis, room codes, date-format evidence, 8 open questions |
| `content/modals.json` | The 5 client-side article modals: full text (raw + normalised) and images |
| `content/captions.json` | **906** `data-caption` anchors across 20 pages, grouped by fancybox group |
| `content/assets-manifest.json` | 673 CDN assets + 11 non-CDN + 3 videos + size-variant rules + 18 todos |
| `content/image-index.json` | 704 downloaded files with bytes, pixel dimensions, format, aspect |
| `content/article-1899.json` | The only real amenity article page (25 words, 58-image album) |
| `content/villas/{200,201,202,203,2142,pueblo,rituals}.json` | Per-villa specs, copy, highlights, services, rooms, gallery, video, map, booking, policies + 25–39 todos each |
| `content/experiences/<slug>.json` | 21 experience pages with word counts, `needsContent`, `brokenCta`, images |
| `content/facilities/{200,201,202,203,2142,pueblo,index}.json` | Recovered facility payloads, tabbed, with `displayedOnLiveSite` per tab |
| `content/raw/` · `content/text/` · `content/assets/` | Source HTML, readable text, per-page image lists |
| `content/raw-js/` · `content/extracted-js/` | Page bundles and the payloads extracted from them |
| `public/images/_pool/` · `public/images/_site/` | 704 downloaded images, 386.6 MB total |
