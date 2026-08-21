# thalasses.com — legacy URL → new URL migration map

Phase 0 deliverable. Source of truth for every redirect the rebuilt site must serve.

**Scope.** 42 crawled pages (`content/text/*.txt`, one file per crawled URL), plus the homepage
in-page anchors and the legacy URL *aliases* that the live site declares in `og:url` but that were
never crawled as separate files.

**Host.** All legacy paths are on `https://thalasses.com`. All redirects are **301 (permanent)**.

**Nothing here is invented.** Every legacy path comes from a crawled file, a `CANONICAL` /
`og:url` value, an `href` in `site.json`, or a `legacyUrls` array in `villas/*.json`. New routes are
proposals and are marked as such.

---

## 1. Crawled pages (42)

| Legacy URL | Page | New route (proposed) | Redirect type | Notes |
| --- | --- | --- | --- | --- |
| `/` | Homepage (root copy) | `/en` | 301 | `root.html`. Byte-for-byte the same page as `/en/index-1.htm` except that every internal `href` carries an `en/` prefix, the logo `src` is `loggia-cdn/...` not `../loggia-cdn/...`, and **`og:url` is `https://thalasses.com/` while `/en/index-1.htm` declares `https://thalasses.com/en/`**. Both declare the same relative `CANONICAL: index-1.htm`, which is not a valid absolute canonical. Two indexable copies of one page = duplicate content today. Post-launch `/` should 301 to `/en` (or negotiate locale and then redirect); do not serve both. |
| `/en/index-1.htm` | Homepage | `/en` | 301 | Note `.htm`, not `.html` — the only three-letter extension on the site. Carries all seven section anchors (see §2), the booking bar, and the 22-card Experiences grid. |
| `/en/property/200.html` | Villa Thoi | `/en/villas/villa-thoi` | 301 | `villas/200.json`. Bookable. Property template adds a `Gallery` nav item and drops Instagram/YouTube from the footer. |
| `/en/property/201.html` | Villa Persi | `/en/villas/villa-persi` | 301 | `villas/201.json`. Bookable. |
| `/en/property/202.html` | Villa Eeanthe | `/en/villas/villa-eeanthe` | 301 | `villas/202.json`. Bookable. 45 gallery captions recovered in `captions.json`, incl. the **only price string on the site**: "The swimming pool can be heated with additional 35€ per day upon request." |
| `/en/property/203.html` | Villa Melia | `/en/villas/villa-melia` | 301 | `villas/203.json`. Bookable. 44 gallery captions in `captions.json`. |
| `/en/property/2142.html` | Thalasses Villas — "Rent them all together" | `/en/the-estate` | 301 | The whole-complex listing (5 buildings, 12 bedrooms, 9 bathrooms). **Slug conflict:** `villas/2142.json` records `"slug": "rent-them-all-together"`, but the agreed new route is `/en/the-estate`. Reconcile `2142.json` before build so the JSON and the router agree. Also note its `<title>` is "Thalasses Villas, Rethymno, Greece" — identical to the site name, which will read as the homepage in SERPs. |
| `/en/property/200/albums.html` | Villa Thoi — album | `/en/villas/villa-thoi` | 301 | `CANONICAL: albums.html` (relative, non-unique — all five album pages declare the identical canonical value). **GAP CLOSED (T-299):** Per-villa gallery sub-pages were never built; the villa page carries its own photographs. |
| `/en/property/201/albums.html` | Villa Persi — album | `/en/villas/villa-persi` | 301 | Same non-unique `albums.html` canonical. **GAP CLOSED (T-299):** Per-villa gallery sub-pages were never built; the villa page carries its own photographs. |
| `/en/property/202/albums.html` | Villa Eeanthe — album | `/en/villas/villa-eeanthe` | 301 | Same non-unique `albums.html` canonical. **GAP CLOSED (T-299):** Per-villa gallery sub-pages were never built; the villa page carries its own photographs. |
| `/en/property/203/albums.html` | Villa Melia — album | `/en/villas/villa-melia` | 301 | Same non-unique `albums.html` canonical. **GAP CLOSED (T-299):** Per-villa gallery sub-pages were never built; the villa page carries its own photographs. |
| `/en/property/2142/albums.html` | Thalasses Villas — album | `/en/the-estate` | 301 | Same non-unique `albums.html` canonical. **GAP CLOSED (T-299):** Per-estate gallery sub-page was never built; the estate page carries its own photographs. |
| `/en/property/200/map.html` | Villa Thoi — map | `/en/villas/villa-thoi#location` | 301 | **No `<link rel="canonical">` at all** on any of the five map pages — the only pages on the site without one. Content is the property page plus a map; folding it into a `#location` section removes five thin duplicates. |
| `/en/property/201/map.html` | Villa Persi — map | `/en/villas/villa-persi#location` | 301 | No canonical. |
| `/en/property/202/map.html` | Villa Eeanthe — map | `/en/villas/villa-eeanthe#location` | 301 | No canonical. |
| `/en/property/203/map.html` | Villa Melia — map | `/en/villas/villa-melia#location` | 301 | No canonical. |
| `/en/property/2142/map.html` | Thalasses Villas — map | `/en/the-estate#location` | 301 | No canonical. |
| `/en/villa-pueblo-1.html` | Villa Pueblo | `/en/villas/villa-pueblo` | 301 | `villas/pueblo.json`, internal id 10655. **Not bookable** (no booking widget) and lives outside `/property/` — the only villa on a flat path. Adults Only. |
| `/en/thalasses-rituals-1.html` | Thalasses Rituals (wedding venue) | `/en/weddings` | 301 | `villas/rituals.json`, internal id 7798, `pageType: landing`. Not bookable. Keeps its own top-level route — it is a venue, not a villa. **GAP CLOSED (T-299):** D1a made Rituals the Weddings venue rather than a villa, so the URL follows the content. This target also closed a REDIRECT LOOP. |
| `/en/article/1899-1.html` | Sitting outdoor area (amenity article) | `/en/the-estate` | 301 | The **only** amenity with a real crawlable page; the other five amenity cards open Angular modals. `sourceTaxonomy: "Amenities"` (every experience page reads `Experiences`). 58-image album with zero captions. **GAP CLOSED (T-299):** Per-amenity pages were never built; the estate page carries the outdoor areas. |
| `/en/terms-and-conditions-1.html` | Terms & Conditions | `/en/terms` | 301 | `terms.json`. Ships with unresolved legal defects that must be fixed before relaunch: the third-party template name **"Ink Hotel"** appears five times, section 2.0 contains self-contradicting garbled clauses, there is no effective date, and sections 4.0/8.0 reference a privacy/cookies policy that does not exist on the site. |
| `/en/bike-tours-1.html` | Bike Tours | `/en/experiences/bike-tours` | 301 | Slug matches title. |
| `/en/biological-garden-1.html` | **Organic Farm** | `/en/experiences/biological-garden` | 301 | **SLUG/NAME MISMATCH — legacy URL must keep working.** Page `<title>`, `og:title` and homepage card all read "Organic Farm"; the URL still says `biological-garden`. New slug follows the displayed name. **GAP CLOSED (T-299):** Slug drift: the inventory's slug is `biological-garden`. The displayed name stays 'Organic Farm'. |
| `/en/boat-trip-1.html` | **Private Boat Trip** | `/en/experiences/boat-trip` | 301 | **SLUG/NAME MISMATCH — legacy URL must keep working.** Title is "Private Boat Trip", URL is `boat-trip`. **GAP CLOSED (T-299):** Slug drift: the inventory's slug is `boat-trip`. |
| `/en/breakfast-on-the-beach-1.html` | Breakfast on the Beach | `/en/experiences/breakfast-on-the-beach` | 301 | Slug matches title. |
| `/en/chauffeur-1.html` | Chauffeur | `/en/experiences/chauffeur` | 301 | Slug matches title. |
| `/en/chef-in-villa-1.html` | **Private Chef** | `/en/experiences/chef-in-villa` | 301 | **SLUG/NAME MISMATCH — legacy URL must keep working.** Title is "Private Chef", URL is `chef-in-villa`. Distinct from the "Cook (professional chef) in the villa" *service* card (see §4). **GAP CLOSED (T-299):** Slug drift: the inventory's slug is `chef-in-villa`. This one also caught two capture tools pointed at a 404 for a whole night (T-281). |
| `/en/dream-weadding-on-the-beach-1.html` | Dream Wedding on the Beach | `/en/experiences/dream-weadding-on-the-beach` | 301 | **SOURCE TYPO IN A LIVE, INDEXABLE URL — "weadding".** The legacy path is preserved verbatim in this table and *must* be kept as a redirect source forever; the new slug is corrected to `dream-wedding`. Never rewrite the legacy string. **GAP CLOSED (T-299):** Slug drift. The inventory preserves the legacy typo 'weadding' because it is the real indexed URL; correcting the slug is a separate decision and would need its own redirect. |
| `/en/exclusive-tour-1.html` | Exclusive Tour | `/en/experiences/exclusive-tour` | 301 | Slug matches title. |
| `/en/hiking-1.html` | Hiking | `/en/experiences/hiking` | 301 | Slug matches title. |
| `/en/jeep-safari-1.html` | Jeep safari | `/en/experiences/jeep-safari` | 301 | Slug matches. **Source casing typo preserved: "Jeep safari" (lowercase s)** sits directly above "Quad Safari" (capital S) in the same grid. Do not silently fix the display string; the slug is unaffected. |
| `/en/jet-ski-safari-1.html` | **Water Sports** | `/en/experiences/jet-ski-safari` | 301 | **SLUG/NAME MISMATCH — legacy URL must keep working.** Title is "Water Sports", URL is `jet-ski-safari`. The widest gap between slug and name on the site. **GAP CLOSED (T-299):** Slug drift, but ALSO A GUESS: the legacy page was titled 'Water Sports' and the nearest inventory entry is `jet-ski-safari`. There is no combined water-sports page. **OWNER TO CONFIRM** what the legacy page contained; until then this lands a reader on the closest real thing rather than on nothing. |
| `/en/learn-the-secrets-of-cretan-cuisine-1.html` | Learn the secrets of Cretan Cuisine! | `/en/experiences/learn-the-secrets-of-cretan-cuisine` | 301 | Longest slug and the only card label ending in "!". Slug matches title (minus the exclamation mark). |
| `/en/massage-1.html` | Massage | `/en/experiences/massage` | 301 | Slug matches title. |
| `/en/personal-trainer-1.html` | Personal Trainer | `/en/experiences/personal-trainer` | 301 | Slug matches title. |
| `/en/private-helipad-1.html` | Private Helipad | `/en/experiences/private-helipad` | 301 | Slug matches title. |
| `/en/quad-safari-1.html` | Quad Safari | `/en/experiences/quad-safari` | 301 | Slug matches title. |
| `/en/running-1.html` | Running | `/en/experiences/running` | 301 | Slug matches title. |
| `/en/scuba-diving-1.html` | Scuba Diving | `/en/experiences/scuba-diving` | 301 | Slug matches title. |
| `/en/therapist-1.html` | Therapist | `/en/experiences/therapist` | 301 | Slug matches title. |
| `/en/wine-production-1.html` | Wine Production | `/en/experiences/wine-production` | 301 | Slug matches title. |
| `/en/wine-tasting-1.html` | Wine Tasting | `/en/experiences/wine-tasting` | 301 | Slug matches title. |

**42 rows.** 21 experience pages + 5 property pages + 5 album pages + 5 map pages + Pueblo +
Rituals + article 1899 + terms + `/en/index-1.htm` + `/`.

---

## 2. Homepage anchors (7)

These are the seven entries in `site.json → sectionAnchors`, targeted by the main nav and the footer.

> **A fragment is never sent to the server.** `GET /en/index-1.htm#category571` arrives at the
> origin as `GET /en/index-1.htm`. A `next.config` redirect therefore moves the *path* only; the
> browser re-applies `#category571` to the destination. Two consequences: (a) the new homepage must
> either keep `id="category571"` etc. as aliases, or a small client-side shim must translate the old
> fragment to the new route; (b) these rows cannot be tested with `curl -I`. The `301 *` marker below
> means "path-level 301 + fragment handled client-side".

| Legacy URL | Page | New route (proposed) | Redirect type | Notes |
| --- | --- | --- | --- | --- |
| `/en/index-1.htm#category571` | Amenities section | `/en/amenities` | 301 * | Six cards. Only `Sitting outdoor area` has a real page today (see §1); the other five open Angular modals. `amenities.json` + `modals.json` now supply descriptions for Private Beach (1896), Doctor (3795), Babysitter (3796). **"Playground and vegetable garden" and "Breakfast" have no description anywhere in the source — they stay `null` with a todo.** Promote to a real index page with per-amenity detail routes. |
| `/en/index-1.htm#category570` | Location / "Beaches" | `/en/location` | 301 * | Section heading pair is eyebrow "Location" / h2 "Beaches". Its "Read more…" opens modal 1898, which has **no URL at all** today. `location.json → nearby` now carries the 11 named places from that modal (private beach 50 m, Rethymno beach 8 km, Ammoudaki, Damnoni, Klisidi, Schinaria, Triopetra, Agios Pavlos, Preveli, Plakias village, south coast ~40 min). This section deserves a real, linkable page. |
| `/en/index-1.htm#category1139` | Experiences grid | `/en/experiences` | 301 * | 22 cards → 21 detail pages (see "A Moment of Fairytale" in §3). No per-card description, price, duration or booking control exists anywhere — every card is title + photo + shared "Read more…" string. The strapline is in an `<h5 class="hidden-xs">`, i.e. **hidden on mobile**. |
| `/en/index-1.htm#category1158` | Career Opportunities | `/en/careers` | 301 * | Copy comes from modal 3869 ("Become one of us!"), recovered in `modals.json`; there was no crawlable careers URL. **Applications go to `creteholidayhome@gmail.com`, a third-party Gmail address, not `info@thalasses.com`** — confirm with the client. No role, location, contract type or closing date is stated: it is a culture blurb, not a vacancy. Paragraph 1 contains a genuine U+FFFD where an en dash belongs (kept verbatim; `paragraphsNormalized` supplies "–"). |
| `/en/index-1.htm#featured_gallery` | "Our Villas" featured grid | `/en/villas` | 301 * | The nav's top-level "Our Villas" item points here, with the seven villas as a dropdown. Becomes a real villa index. Note the grid mixes four `/property/` villas, Pueblo, Rituals and the whole-estate listing — three different route shapes today, unified under `/en/villas` + `/en/the-estate` + `/en/thalasses-rituals`. |
| `/en/index-1.htm#contact` | Contact | `/en/contact` | 301 * | Form POSTs to `https://formspree.io/f/mrbkgjzw`. `info@thalasses.com` is Cloudflare-obfuscated in the markup. **No map renders** — the maps script targets `#lodge-map`, which does not exist on the page. A reCAPTCHA site key and a Google Maps API key are exposed in the markup; do not carry them over. |
| `/en/index-1.htm#overview` | (footer "Overview" link) | `/en` | 301 * | **DEAD ANCHOR.** The footer links to `#overview` but **no element with `id="overview"` exists** in the homepage HTML — the intro block is wrapped in `<div id="descriptions">`. The link has been broken on the live site. Decide: repoint to the intro section on `/en`, or drop the footer link. Do not carry the dead fragment forward. |

**7 rows.**

---

## 3. Legacy URL aliases not crawled as separate files (16)

Real or declared legacy addresses that produce no `content/text/*.txt` file of their own but that
exist in the wild (declared in `og:url`, present as a raw capture variant, or referenced by the CMS).

| Legacy URL | Page | New route (proposed) | Redirect type | Notes |
| --- | --- | --- | --- | --- |
| `/en/` | Homepage, directory form | `/en` | 301 | This is the value `/en/index-1.htm` declares as its own `og:url` (`https://thalasses.com/en/`) — so it is the address social platforms and scrapers hold, even though the crawl only retrieved `index-1.htm`. Normalise the trailing slash. |
| `/en/index-1.htm?x=1` | Homepage with cache-buster query | `/en` | 301 | Captured as `raw/en__index-1.htm_q_x=1`. Same content. Strip unknown query params on the homepage redirect rather than enumerating them. |
| `/en/property/<id>` | Villa pages, extensionless | `/en/villas/<slug>` (2142 → `/en/the-estate`) | 301 (pattern) | **Every page on the site declares an extensionless `og:url`** while serving a `.html` file — e.g. `/en/property/200.html` declares `og:url = https://thalasses.com/en/property/200`, and `villas/200.json → legacyUrls` records the extensionless form. Both forms must redirect. Applies to ids 200, 201, 202, 203, 2142. |
| `/en/property/<id>/albums` | Album pages, extensionless | `/en/villas/<slug>/gallery` (2142 → `/en/the-estate`) | 301 (pattern) | Same extensionless/`.html` duality. Ids 200, 201, 202, 203, 2142. **GAP CLOSED (T-299):** Per-estate gallery sub-page was never built; the estate page carries its own photographs. |
| `/en/property/<id>/map` | Map pages, extensionless | `/en/villas/<slug>#location` (2142 → `/en/the-estate#location`) | 301 (pattern) | Same duality. Ids 200, 201, 202, 203, 2142. |
| `/en/<experience>` | 21 experience pages, extensionless | `/en/experiences/<slug>` | 301 (pattern) | E.g. `og:url = https://thalasses.com/en/jet-ski-safari` for the file `jet-ski-safari-1.html`. All 21 slugs from §1 apply, including the misspelled `dream-weadding-on-the-beach`. |
| `/en/villa-pueblo` | Villa Pueblo, extensionless | `/en/villas/villa-pueblo` | 301 | `villas/pueblo.json → legacyUrls: ["/en/villa-pueblo"]`. |
| `/en/thalasses-rituals` | Thalasses Rituals, extensionless | `/en/weddings` | 301 | `villas/rituals.json → legacyUrls: ["/en/thalasses-rituals"]`. Legacy and new path are identical strings — still declare the redirect so the `-1.html` form and this form both land on one canonical URL. **GAP CLOSED (T-299):** Was both source and target — a genuine loop. Now points at the page the content actually lives on. |
| `/en/terms-and-conditions` | Terms, extensionless | `/en/terms` | 301 | `terms.json` records `canonical: "terms-and-conditions-1.html"` but `og:url: "https://thalasses.com/en/terms-and-conditions"` — the two disagree on the live site. |
| `/en/article/1899` | Sitting outdoor area, extensionless | `/en/the-estate` | 301 | `article-1899.json → legacyUrl: "https://thalasses.com/en/article/1899"`. **GAP CLOSED (T-299):** Per-amenity pages were never built; the estate page carries the outdoor areas. |
| `/en/page/modal/article/1896` | Private Beach (modal) | `/en/location` | 301 | **Returns 404 on the live host** — the site is a static export and the modal HTML is baked into the page bundle, injected by Angular. No inbound equity, but the content is real (`modals.json`) and gets a URL for the first time. Add the redirect defensively in case the CMS pattern was ever indexed. **GAP CLOSED (T-299):** Per-amenity pages were never built; the location page carries the beach. |
| `/en/page/modal/article/1898` | Beaches (modal) | `/en/location` | 301 | 404 today. Source of the entire nearby-beaches list now in `location.json`. |
| `/en/page/modal/article/3795` | Doctor (modal) | `/en/location` | 301 | 404 today. **GAP CLOSED (T-299):** Per-amenity pages were never built; the location page carries the distances. |
| `/en/page/modal/article/3796` | Babysitter (modal) | `/en/the-estate` | 301 | 404 today. **GAP CLOSED (T-299):** Per-amenity pages were never built; babysitting is an estate service and is listed under 'Arranged on request'. |
| `/en/page/modal/article/3869` | Become one of us! (careers modal) | `/en/careers` | 301 | 404 today. |
| *(none — external link only)* | A Moment of Fairytale | `/en/experiences/a-moment-of-fairytale` | n/a — **new URL, no redirect** | **This card has no legacy page.** It is the only external link in the Experiences grid, pointing straight at `https://www.youtube.com/watch?v=nuSIWyTiwBU&ab_channel=CreteHolidayHome`, in the same tab (no `target` attribute). Its only asset anywhere on the site is the card thumbnail. There is no title, description or body copy — the video *is* the content. This is why the grid has 22 cards but `content/experiences/` has 21 JSON files. **Decision required:** build a real page that embeds the video, or drop the card. If dropped, no redirect is owed; if built, it is a brand-new URL with no legacy source. |

**16 rows.**

---

## 4. Content that has no URL on either side (not redirect rows — do not lose it)

Listed here so it is not mistaken for missing coverage in the tables above.

- **Six service cards** on every property page (`fancyServiceImages<id>` fancybox anchors, captured
  in `captions.json`): *Cook (professional chef) in the villa, Baby sitting, Pool maintenance, Pool
  Towels, Diving, Daily Excursions*. They are lightbox images, not links — no legacy URL exists and
  none is proposed. They belong inside the villa page template, not in the redirect map.
- **Hidden facility tabs.** `facilities/<page>.json` holds 139/134/137/136/127/55 features per
  property, but the live controller does `$scope.features = groups[0].group`, so **only tab 0 ever
  renders**. Use `displayedOnLiveSite` to tell them apart. The hidden tabs are real content that the
  current site never shows — they gain visibility in the rebuild without gaining URLs.
- **Booking engine.** The booking bar POSTs off-site to `https://thalassesvillas.reserve-online.net/`
  (target `_blank`, hidden `exclusive=1`). Out of scope for redirects; see `booking.json`.
- **Newsletter block.** Entirely commented out in the source; its anchor div is misspelled
  `id="newsetter"`. No URL either way.

---

## 5. Implementing this in `next.config`

### 5.1 Shape

Put the map in a standalone data module so it can be unit-tested and reused by the sitemap builder,
then spread it into `redirects()`. Never hand-maintain 65 objects inline.

```js
// redirects/legacy.mjs
export const VILLAS = {
  '200':  'villas/villa-thoi',
  '201':  'villas/villa-persi',
  '202':  'villas/villa-eeanthe',
  '203':  'villas/villa-melia',
  '2142': 'the-estate',
};

// Legacy experience slug -> new experience slug.
// Left side is the on-disk truth and MUST NOT be "corrected" — see `dream-weadding`.
export const EXPERIENCES = {
  'jet-ski-safari':               'water-sports',
  'biological-garden':            'organic-farm',
  'chef-in-villa':                'private-chef',
  'boat-trip':                    'private-boat-trip',
  'dream-weadding-on-the-beach':  'dream-wedding-on-the-beach',
  // identity mappings
  'bike-tours': 'bike-tours',
  'breakfast-on-the-beach': 'breakfast-on-the-beach',
  'chauffeur': 'chauffeur',
  'exclusive-tour': 'exclusive-tour',
  'hiking': 'hiking',
  'jeep-safari': 'jeep-safari',
  'learn-the-secrets-of-cretan-cuisine': 'learn-the-secrets-of-cretan-cuisine',
  'massage': 'massage',
  'personal-trainer': 'personal-trainer',
  'private-helipad': 'private-helipad',
  'quad-safari': 'quad-safari',
  'running': 'running',
  'scuba-diving': 'scuba-diving',
  'therapist': 'therapist',
  'wine-production': 'wine-production',
  'wine-tasting': 'wine-tasting',
};

export const MODALS = {
  '1896': 'amenities/private-beach',
  '1898': 'location',
  '3795': 'amenities/doctor',
  '3796': 'amenities/babysitter',
  '3869': 'careers',
};

const p = (dest) => `/en/${dest}`;

export function legacyRedirects() {
  const out = [];

  // Homepage: both extensions, both locales-of-record, and the root copy.
  out.push(
    { source: '/en/index-1.htm', destination: '/en', permanent: true },
    { source: '/en/index-1.html', destination: '/en', permanent: true },
    { source: '/', destination: '/en', permanent: true },
  );

  for (const [id, dest] of Object.entries(VILLAS)) {
    for (const ext of ['.html', '']) {
      out.push(
        { source: `/en/property/${id}${ext}`,            destination: p(dest),                permanent: true },
        { source: `/en/property/${id}/albums${ext}`,     destination: p(`${dest}/gallery`),   permanent: true },
        { source: `/en/property/${id}/map${ext}`,        destination: p(`${dest}#location`),  permanent: true },
      );
    }
  }

  for (const [oldSlug, newSlug] of Object.entries(EXPERIENCES)) {
    out.push(
      { source: `/en/${oldSlug}-1.html`, destination: p(`experiences/${newSlug}`), permanent: true },
      { source: `/en/${oldSlug}`,        destination: p(`experiences/${newSlug}`), permanent: true },
    );
  }

  for (const [id, dest] of Object.entries(MODALS)) {
    out.push({ source: `/en/page/modal/article/${id}`, destination: p(dest), permanent: true });
  }

  out.push(
    { source: '/en/villa-pueblo-1.html',          destination: p('villas/villa-pueblo'),            permanent: true },
    { source: '/en/villa-pueblo',                 destination: p('villas/villa-pueblo'),            permanent: true },
    { source: '/en/thalasses-rituals-1.html',     destination: p('thalasses-rituals'),              permanent: true },
    { source: '/en/article/1899-1.html',          destination: p('amenities/sitting-outdoor-area'), permanent: true },
    { source: '/en/article/1899',                 destination: p('amenities/sitting-outdoor-area'), permanent: true },
    { source: '/en/terms-and-conditions-1.html',  destination: p('terms'),                          permanent: true },
    { source: '/en/terms-and-conditions',         destination: p('terms'),                          permanent: true },
  );

  return out;
}
```

```js
// next.config.mjs
import { legacyRedirects } from './redirects/legacy.mjs';

export default {
  trailingSlash: false,
  async redirects() {
    return legacyRedirects();
  },
};
```

### 5.2 Rules and gotchas

1. **`permanent: true` everywhere.** Next emits 308 for `permanent: true`, not 301. 308 preserves the
   HTTP method; Google treats it identically to 301 for consolidation. If the client's SEO
   contract literally requires a 301 status code, use `statusCode: 301` instead of `permanent`
   (the two options are mutually exclusive) or handle the redirect at the CDN edge.
2. **`/en/index-1.htm?x=1`** — Next matches on path only, so the `?x=1` row needs no separate entry;
   the `/en/index-1.htm` rule already catches it and the query is forwarded. If the query must be
   stripped, add `has`/`missing` conditions or drop it at the edge.
3. **Fragments are not server-visible.** Destinations containing `#location` work (the browser
   applies the fragment to the redirect target), but §2's *sources* cannot be matched server-side.
   Keep the legacy ids (`category570`, `category571`, `category1139`, `category1158`,
   `featured_gallery`, `contact`) as `id` aliases on the new homepage sections, or ship a tiny
   client-side shim that maps a legacy hash on `/en` to the new route. **Do not carry `#overview`
   forward — it never worked.**
4. **Do not enable `trailingSlash: true`.** The legacy site mixes `/en/` (og:url) with
   `/en/index-1.htm` (actual file); pick the no-slash form and let Next normalise.
5. **Ordering.** `redirects()` is evaluated in array order and runs *before* the filesystem. Keep the
   specific `/en/property/2142/albums` rules ahead of any future catch-all, and never add a
   `/en/:slug` catch-all — it would swallow `/en/villas`, `/en/terms` and every real route.
6. **Verify after build.** Assert one `curl -sI` per row in CI against the 65 sources in this
   document; a silent 200 on a legacy path means a real page is shadowing a redirect.

### 5.3 Adding Greek later without refactoring

The route shape is locale-first (`/{locale}/...`) from day one, so `/el/...` drops in with no
structural change.

- Configure `i18n: { locales: ['en', 'el'], defaultLocale: 'en' }` (Pages Router) or an
  `app/[locale]/` segment with middleware (App Router). Either way **every** new route in this
  document already lives under a locale segment — nothing needs to move.
- **Redirect sources must stay locale-agnostic.** In the Pages Router, `redirects()` sources are
  matched *after* locale detection and are prefixed with the locale by default; set
  `locale: false` on every legacy rule so `/en/property/200.html` is matched literally and is never
  rewritten to `/el/en/property/200.html`. The legacy site is English-only — no legacy URL should
  ever resolve under `/el/`.
- **Slugs are translatable, the map is not.** Keep `EXPERIENCES` / `VILLAS` as the *English* slug
  tables and add a parallel `el` table later, resolved through a shared slug registry. Legacy
  redirects keep pointing at `/en/...`; Greek visitors reach `/el/...` through the language switcher
  and `hreflang`, not through this map.
- Emit `hreflang` alternates (`en`, `el`, `x-default`) from the same registry once `el` exists.
  Today `x-default` should point at `/en`.
- Villa proper nouns (Thoi, Persi, Eeanthe, Melia, Pueblo) will almost certainly keep their Latin
  slugs in Greek; confirm with the client rather than transliterating.

---

## 6. Open items for whoever builds this

- `villas/2142.json` says `slug: "rent-them-all-together"`; this map routes it to `/en/the-estate`.
  One of the two must change.
- `/en/thalasses-rituals` is both a legacy and a new path. Confirm that is intentional.
- Amenity detail routes (`/en/amenities/private-beach`, `/doctor`, `/babysitter`) are proposed here
  for modal content that has never had a URL. If the rebuild renders those inline instead, retarget
  rows 11, 13, 14 of §3 to `/en/amenities` and drop the detail routes.
- "A Moment of Fairytale": build or drop (§3, last row).
- The `-1` suffix in every legacy slug (`bike-tours-1.html`) is CMS revision chrome, not content.
  It is dropped in all new routes.
