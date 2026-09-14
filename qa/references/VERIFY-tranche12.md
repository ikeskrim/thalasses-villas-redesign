# DESIGN-REFERENCES.md, checked against the served build (tranche twelve)

The first version of `DESIGN-REFERENCES.md` (commit `56cb859`) was written about a
minute after the reference research returned, from a brief that described only
the homepage. It was never checked against the site, and five of its "they do,
we don't" points were already on the villa, estate or location pages. This note
records the check that should have happened: every per-site point and every
ranked row, against what `http://localhost:3005` actually serves.

It has two passes. The **first check** (09:46–09:47) fetched seven routes and
Villa Thoi. An independent review then found that the first check marked design
provenance missing while the served Villa Thoi page names EMU and Greek marble,
and that several claims were broader than the evidence. The **fix pass**
(10:29–10:30) fetched the other four villa pages, re-counted every saved page
case-insensitively, and corrected the rows below. Where the two passes disagree,
the fix pass is the record.

Read-only throughout: GETs only, no form submitted, no booking started, no
server started or stopped. The ten reference sites were **not** re-visited — no
correction below depended on one of them.

## The build that was checked

- The first two probes of the first check got no connection (`curl` exit 7,
  status `000`). From **2026-09-14 09:46:36 +03:00** the server answered `200`.
- `.next/BUILD_ID` is `zvZmrT7ejPvvMsQp89xck`, written 2026-09-14 00:23:38 +03:00,
  and was unchanged at the fix pass. Every fetched page, in both passes, embeds
  that same id once, so the served pages are this build.
- At the first check no file under `src/`, `content/` or `public/factsheets/`
  was newer than `BUILD_ID` (`find … -newer .next/BUILD_ID` returned nothing),
  and `git status` showed only the untracked `qa/perf/AB-tranche12-estate3d.md`.
  The commits after the build time (`9b8afca` … `56cb859`) were already in the
  tree it was built from. The app served is HEAD `56cb859`'s. By the fix pass
  other workstreams had uncommitted edits in `src/` and elsewhere; the served
  build contains none of them, and nothing here depends on them.

| time (+03:00) | request | status | bytes |
|---|---|---|---|
| 09:47:18 | `GET /` | 200 | 118,953 |
| 09:47:18 | `GET /en/villas/villa-thoi` | 200 | 173,556 |
| 09:47:18 | `GET /en/the-estate` | 200 | 187,144 |
| 09:47:19 | `GET /en/experiences` | 200 | 67,580 |
| 09:47:19 | `GET /en/weddings` | 200 | 117,474 |
| 09:47:19 | `GET /en/location` | 200 | 38,183 |
| 09:47:19 | `GET /en/contact` | 200 | 28,798 |
| 09:47:19–20 | `GET /factsheets/villa-{eeanthe,melia,persi,pueblo,thoi}.pdf`, `Range: bytes=0-4` | 206 ×5, `application/pdf` | 5 each, all `%PDF-` |
| 10:29:35 | `GET /en/villas/villa-{persi,eeanthe,melia,pueblo}` (fix pass, first attempt) | 200 ×4 | 0 written — `curl -o` left no file; discarded and repeated once |
| 10:29:49 | `GET /en/villas/villa-persi` | 200 | 178,710 |
| 10:29:50 | `GET /en/villas/villa-eeanthe` | 200 | 183,997 |
| 10:29:50 | `GET /en/villas/villa-melia` | 200 | 180,025 |
| 10:29:50 | `GET /en/villas/villa-pueblo` | 200 | 77,375 |

The factsheets are range requests on purpose: the server was shared with a
performance trace, and five bytes prove a PDF is served at the linked path
without pulling 1.5 MB. The files themselves are `public/factsheets/villa-*.pdf`
(212–389 KB). `/en/gallery` was not fetched in either pass: it is not one of the
pages `DESIGN-REFERENCES.md` maps to a section.

**Method.** The HTML was saved and counted by read-only scripts outside git.
"Visible text" is the page with `<script>` and `<style>` removed and tags
stripped; markup strings are counted in the raw HTML.
- First check: `scratchpad/refs-verify/analyse.mjs`. Its needles are
  **case-sensitive**. That is how it missed the served `EMU` (it looked for
  `Emu`), and why its `Your stay includes ×1` on Villa Thoi does not count the
  lower-case "what your stay includes".
- Fix pass: `scratchpad/ci-count.mjs`, the same visible-text rule with
  **case-insensitive** needles, plus `perl` to strip scripts before listing
  `<figcaption>` and `<img alt>` text.

The counts that matter are copied below so this note stands on its own.

## What each route serves (first check, case-sensitive counts)

| route | visible text | markup |
|---|---|---|
| `/` | Check availability ×7 · Book Now ×1 · Enquire ×3 · Heraklion airport, Heraklion port, Chania airport, Chania port ×1 each · "airport or the port" ×2 · helicopter ×1 · Arrival ×1 · Sister properties ×1 · As featured in ×1 · Condé Nast Traveler ×1 · **Your stay includes ×0** · **€ ×0** | `class="ho-distances` ×1 · **`type="date"` ×0** · `href="tel:` ×2 · `href="mailto:` ×1 |
| `/en/villas/villa-thoi` | Check availability ×2 (nav + CTA) · Enquire ×1 · Fact sheet (PDF) ×1 · Your stay includes ×1 · Area ×1 · sq ft ×1 · Sleeps ×1 · Good to know ×1 · The other houses ×1 · Arriving · Nights · Adults · Reserve ×1 each · **Compac ×0** · **king size ×0** · € ×0 | `href="/factsheets/` ×1 · `href="/en/contact?villa=` ×1 · `type="date"` ×1 · `href="tel:` ×2 · `href="mailto:` ×2 |
| `/en/the-estate` | Enquire ×3 · Your stay includes ×1 · Good to know ×1 · Also on the property ×1 · "Front row" ×4 | `href="/en/contact?enquiry=estate"` ×3 · `estate-map-marker` ×9 |
| `/en/experiences` | "Filter by where they happen. All 21 · Sea 3 · Land 6 · Wellness 3 · Taste 6 · Service 3" · Arrival ×0 (case-sensitive; case-insensitive ×1, the chauffeur card's "upon arrival" — there is no Arrival chip) | `aria-label="Filter experiences"` ×1 · `aria-pressed` ×6 |
| `/en/weddings` | "01 — Weddings & Events" · Area ×1 · sq ft ×1 · Sleeps ×1 · Enquire ×1 · **celebration ×0** | — |
| `/en/location` | "01 — Location" … "07 — Location" · Heraklion airport … Chania port ×1 each · **"airport or the port" ×0** · helicopter ×0 | `id="location"` ×1 |
| `/en/contact` | "By telephone (+30) 6974069475 (+30) 2114445757 By email info@thalasses.com" | `href="tel:` ×4 · `href="mailto:` ×3 |

No saved page contains `google.com/maps`, `maps.google` or an `<iframe>`, and
nothing in `src/` reads `content/location.json`'s `mapUrl`.

## Fix-pass re-checks (case-insensitive unless marked)

Pages: the four fetched at 10:29 and the seven saved at 09:47, same build.

| # | for | URL(s) | needle · case | result |
|---|---|---|---|---|
| F1 | every villa page as served | `/en/villas/villa-{persi,eeanthe,melia,pueblo}` | build id; Check availability; Enquire; Fact sheet (PDF); The other houses; `type="date"` (raw, exact); Reserve (context) · insensitive | on each of the four: build id ×1, Check availability ×2, Enquire ×1, Fact sheet (PDF) ×1, The other houses ×1, `type="date"` ×1; the ledger reads "Villa <name> Arriving Nights Adults Children Reserve" on all four. Pueblo's spec strip: "Bedrooms 3 Bathrooms 3 Sleeps 6 Private pool 1 Area 95 m² 1023 sq ft" |
| F2 | 7.3, 4.4, row 5 (provenance) | the five villa pages | `EMU`, `white marble` · insensitive, visible | Thoi EMU ×2, marble ×1 · Persi EMU ×0, marble ×1 · Eeanthe EMU ×0, marble ×1 · Melia EMU ×1, marble ×0 · Pueblo ×0, ×0 |
| F3 | 7.3, 4.4 | the five villa pages | `<figcaption>` text naming a maker or material · insensitive, scripts stripped | Thoi: "Sunbathing area by the pool, external furniture from EMU", "Comfortable sun beds from EMU by the pool", "Open plan living room with white marble from Greece" · Persi, Eeanthe: the marble caption · Melia: the sun-beds caption · Pueblo: no `<figcaption>` at all (Thoi, Persi, Eeanthe, Melia ×12 each) |
| F4 | 7.3, row 5 | all eleven saved pages | Compac, Kahrs, Grohe, Augenti, Beca, Schüko, Schuko, Cocomat, Gubi, Navone, Christiansen, architect · insensitive, visible | ×0 on every page. EMU and white marble ×0 outside the villa pages |
| F5 | 7.3 | the five villa pages | `<img alt>` naming a maker · insensitive, scripts stripped | Grohe: "GROHE products in all the water systems" (Thoi, Eeanthe); Cocomat: two alts on Eeanthe, one on Melia; plus EMU and marble alts, including an EMU alt on Persi and a marble alt on Melia that no visible caption repeats. Not visible text |
| F6 | 7.3 source | `content/villas/200-203.json:23` | maker sentence | "Kitchen worktop from “Compac”, bedroom floors from “Kahrs”, white marbles from Greece, water systems from “Grohe”, lights from “Augenti" and “Beca”, “Schüko” doors & windows, beds from “Cocomat” and furniture designed by Poul Christiansen & Boris Berlin (“Gubi dk”) and “Emu” designer Paola Navone"; Villa Pueblo's registry names none. `grep -rli architect content` (excluding the manifest) hits only "architecture" in photo-grading notes |
| F7 | 1.3 (pool and terrace area) | five villa pages; `/en/the-estate`, `/en/weddings`, `/` | `square met`, `150` · insensitive, visible | Thoi, Persi, Eeanthe, Melia ×1 each: "Private pool 20 square meters swimming pool…" (inventory, from `content/facilities/200.json:410`, `201.json:366`, `202.json:377`, `203.json:377` via `src/lib/inventory.ts:90`) · Pueblo ×0 visible · the estate: "Each villa has a 20 square meters swimming pool" (`content/facilities/2142.json:366`) · weddings: "pool of 150m2 with salt water" (`content/villas/rituals.json:13`) and "150sqm sea water pool" (`content/experiences/dream-weadding-on-the-beach.json:16`) · `/`: "150 m² salt-water pool" ×1. A regex for an area beside "terrace" over `content/` (excluding the manifest, `el/`, `extracted-js/`) → nothing. `king size` ×0 visible on all five villa pages |
| F8 | 3.3, row 4 (drive times) | `/en/location` | `forty minutes`, `40 minutes`, `by car` · insensitive, visible | "Wandering south, forty minutes" ×1 (page title); "South coast about 40 minutes by car" ×1. Source `content/location.json:126` (the prose at `:17`, `:26`). `grep -i "minute\|by car\|drive from\|driving"` over `content/` (excluding `assets-manifest.json`) finds no travel time from an airport or port; those are given in km (`location.json:179-193`) |
| F9 | 8.1, row 8 | the five villa pages | `Good to know` · insensitive, visible | Thoi, Persi, Eeanthe, Melia ×1 each ("05 — Good to know The swimming pool can be heated…"); **Pueblo ×0**, and its detail beat is numbered "05 — Villa Pueblo, in detail". `page.tsx:173` records that Villa Pueblo has no policies and no services; `:182` `hasPractical` drops the beat |
| F10 | 2.3 | five villa pages; `/en/the-estate` | `The position`, `in detail` (context) · insensitive, visible | Thoi: "06 — Villa Thoi, in detail The position Ground floor, front row"; Persi: "The position Ground floor, facing the water" (`src/lib/villa-page.ts:43`, `:84`). Eeanthe's detail beat opens "The upper floor", Melia's "The ground floor", Pueblo's "Who it is for": no position row. The estate: Thoi and Persi "Front row", Eeanthe and Melia "Rear row", Pueblo "Apart from the four" |
| F11 | 6.2 | `/`, `/en/the-estate` | `Enquire`, `we design your stay` · insensitive, visible; `enquiry=estate` · raw, exact | `/`: estate card "Explore Enquire" linking `/en/contact` (`HotelPage.tsx:192-194`), footer "Enquire about the estate" (`:481`), "we design your stay" ×0, `enquiry=estate` ×0 · the estate: "Enquire — we design your stay" ×3 (`booking.ts:142-149`), `?enquiry=estate` ×3 |
| F12 | 6.1, row 3 | five villa pages; code | `Your stay includes`, `Cleaning every 3 days` · insensitive, visible | the block on all five (Pueblo: "Your stay includes Cleaning every 3 days Included, not charged as an extra. Daily reception desk…"). Its rows: three services from `content/verified-facts.json:26-30`, and "The private beach", which `src/lib/villa-page.ts:210-213` (`stayIncludes()`) adds from the villa specs |

## Per-site points, row by row

Statuses: **missing** · **partly present** (where) · **present** (where) ·
**not scored** (a look, governed by D-001, not a feature) · **not applicable**
(why). On *Avoid* lines, **same here** marks a fault this site shares and
**avoided** one it does not.

| # | Site · section | Their point | Checked | Result |
|---|---|---|---|---|
| 1.1 | Acro · Press | press carousel, award marks in footer | `/` text: "As featured in — Condé Nast Traveler, 2024", one line (`HotelPage.tsx:422-438`, D-007) | **partly present** — one credential line |
| 1.2 | Acro · Top bar | loyalty club, best-price guarantee | seven routes' text; `grep -i "best price\|book direct\|loyalty"` in `src/` → nothing | **missing** |
| 1.3 | Acro · Villas | exact specs: pool and terrace m², bed sizes, max adults | villa-thoi: "Bedrooms 2 Bathrooms 1 Sleeps 4 Private pool 1 Area 60 m² 646 sq ft · 1 double + 1 twin · 1 (shower cabin) · direct view to the sea" (`villa-page.ts:236-274`); pool area as inventory text on four villa pages and the estate, none on Pueblo, no terrace area in any source (F7); "king size" only in registry prose (`content/villas/200.json:23`), ×0 visible on all five (F7) | **partly present** — villa pages |
| 1.4 | Acro · Footer | sister hotels, FAQs, sustainability, careers | `/` footer "Sister properties: Ink Hotels, Domisignature, Crete Holiday Home"; inner footers "Careers" (`SiteFooter.tsx:72-86`); `src/app/en/` has no FAQ or sustainability route | **partly present** — sisters on `/`, careers in inner footers |
| 1.A | Acro · Avoid | nights dropdown, not a date range | villa ledger "Arriving · Nights · Adults · Children · Reserve" on all five (`BookingLedger.tsx:86-152`, F1) | **same here** — a nights field; the engine also accepts `checkout` (`booking.ts:33`) |
| 1.B | Acro · Avoid | Book button forgets the suite | `villaCta` links to the undated engine; "room preselect is inert on this host (T-156)" (`booking.ts:118-128`) | **same here**, forced by the host |
| 2.1 | Passalacqua · Discover Crete | "Voices" | seven routes' text | **missing** |
| 2.2 | Passalacqua · Top bar | menu splits mood from logistics | `/` bar: The Villas · Experiences · Weddings · Discover Crete · Contact (`HotelPage.tsx:62-68`); inner nav 01–06 (`SiteNav.tsx:155-171`) | **missing** |
| 2.3 | Passalacqua · Villas | name carries building and view; unit page ends with all the others | "The other houses" on all five villa pages (F1); view is a detail row; "The position" in the detail beat of Thoi and Persi only, every house's row on the estate map (F10) | **partly present** — cross-sell on villa pages; position on two villa pages and `/en/the-estate`; not in the names |
| 2.4 | Passalacqua · Discover Crete | seasons block | seven routes' text | **missing** |
| 2.5 | Passalacqua · Footer | sister hotel as a block | `/` footer column, names and links only (D-006); `SiteFooter` has no sister field | **partly present** — `/` only |
| 2.A | Passalacqua · Avoid | cookie wall over the hero | no cookie or consent UI in `src/`; `Preloader.tsx` is imported by nothing | **avoided** |
| 3.1 | Aman · Villas | Check availability **and** Make an enquiry | all five villa pages "Check availability · Enquire · Fact sheet (PDF)" (F1), villa-thoi `?villa=` ×1; `/` villa cards "Explore · Check availability" (`HotelPage.tsx:150-163`) | **partly present** — villa pages; not the homepage cards |
| 3.2 | Aman · Top bar | phone and email beside the calendar | villa ledger has no phone; `tel:` and `mailto:` in every footer and on `/en/contact` | **partly present** — footers and `/en/contact`, never beside a booking control |
| 3.3 | Aman · Discover Crete | "Getting here" with directions and a map | `/`: "We can meet you at the airport or the port and drive you here, or you can arrive by helicopter to the estate's own pad" + both airports and ports (`HotelPage.tsx:352-356, 412`); `/en/location`: the same distances, no arrival services, and the South coast "about 40 minutes by car" (F8); Arrival cards → `/en/experiences/chauffeur`, `/private-helipad`; no map served; no drive time from an airport or port in any source (F8) | **partly present** — three places; no map, no directions, no airport or port drive time |
| 3.4 | Aman · Weddings | "Celebrations" | `/en/weddings` titled "Weddings & Events"; "celebration" ×0 | **partly present** — the name only |
| 3.5 | Aman · Footer | nearby properties on every page | as 2.5 | **partly present** — `/` footer links |
| 4.1 | Cap Rocat · Top bar | booking in a modal | every booking control links to `thalassesvillas.reserve-online.net` (nav `target="_blank"`, `/` Book Now same tab) | **missing** |
| 4.2 | Cap Rocat · Hero | numbered chapters | villa-thoi 01–07, estate and weddings number their beats from a derived spine (`page.tsx:169-192`); `/` does not | **partly present** — inner pages |
| 4.3 | Cap Rocat · Footer | named newsletter, gift cards | `grep -i "newsletter\|gift card\|voucher"` in `src/` → nothing | **missing** |
| 4.4 | Cap Rocat · Discover Crete | architect, restoration award, photo collection | mapped pages only: captioned photograph sets on Thoi, Persi, Eeanthe, Melia, each with an EMU or Greek-marble caption (F2, F3); no architect in any source (F6); no restoration award — the one credential is the Condé Nast Traveler mention (D-007), which `content/assets-manifest.json:8502` files as an "award/press badge"; `/en/gallery` exists but is outside the mapping and was not fetched | **partly present** — villa-page photographs and captions; no architect, no award |
| 4.A | Cap Rocat · Avoid | rooms with no size or capacity; skipped chapter numbers | spec strip on all five villa pages (F1); `/en/location` prints "01 — Location" then "07 — Location" | size **avoided**; numbering **same here** on `/en/location` |
| 5.1 | Six Senses · Hero | dates-and-guests bar under the hero | villa pages: sticky ledger (`sections.css:231-238`), `type="date"` ×1 on all five (F1); `/`: ×0 | **partly present** — villa pages |
| 5.2 | Six Senses · Villas | key facts, amenities tabs, floorplan, compare | facts on `/` cards, villa spec strip, estate "bd · ba · sleeps"; amenities as the villa inventory, not tabs; no floorplan in `content/`, `public/`, `src/`; no compare | **partly present** — facts and amenities |
| 5.3 | Six Senses · Villas | cards prompt for dates to show rates | "€" ×0 on all seven first-check routes | **missing** |
| 5.4 | Six Senses · Discover Crete | local time, getting there, fact sheet, resort map | five factsheet PDFs served (206, `%PDF-`), linked from all five villa pages (F1); `/en/the-estate` hotspot map (nine markers, `home-data.ts:156-250`); getting there as 3.3; no local time (`grep "local time\|timeZone"` → nothing) | **partly present** — fact sheet and map **present**, local time missing |
| 5.5 | Six Senses · Experiences | provenance (farmers supply the kitchen) | `/` Taste card "Organic Farm": the estate's own garden, vegetables from it (registry copy) | **partly present** — own garden, no named supplier |
| 6.1 | Ultima · Villas | "signature inclusions" | all five villa pages and `/en/the-estate`: "Your stay includes: Cleaning every 3 days · Daily reception desk · Holiday Advisor and concierge · The private beach" — three services from `verified-facts.json:26-30`, the beach row added by `villa-page.ts:210-213` (F12); `/` ×0 | **partly present** — villa pages and the estate |
| 6.2 | Ultima · Villas | separate paths for suites and residences | villas → Check availability; `/en/the-estate` → "Enquire — we design your stay" ×3, `?enquiry=estate` ×3 (`booking.ts:142-149`); `/` → estate card "Enquire" and footer "Enquire about the estate", both `/en/contact`, `enquiry=estate` ×0 (F11) | **present** — villa pages, `/`, `/en/the-estate` |
| 6.3 | Ultima · Press | stories beside the awards | seven routes' text | **missing** |
| 6.4 | Ultima · Footer | offers, gift cards, GDS codes | as 4.3 | **missing** |
| 6.A | Ultima · Avoid | engine opens in another language | `lang=en` pinned (`booking.ts:97`); served engine links carry `?lang=en` | **avoided** |
| 7.1 | Casa di Legna · Villas | weekly seasonal rates, changeover rule | "€" ×0; `booking.json:348-351` `minimumStay.stated: false` | **missing** |
| 7.2 | Casa di Legna · Press | articles and PDFs near the top | as 1.1; the line sits after Discover Crete | **partly present** — one line, low |
| 7.3 | Casa di Legna · Discover Crete | names architect, designer, maker | captions name EMU (Thoi ×2, Melia ×1) and white marble from Greece (Thoi, Persi, Eeanthe) (F2, F3); Compac, Kahrs, Grohe, Augenti, Beca, Schüko, Cocomat, Gubi, Christiansen, Navone ×0 visible on every saved page (F4), Grohe and Cocomat only as `<img alt>` (F5); registry list at `content/villas/200-203.json:23` (F6); no architect in any source | **partly present** — two credits in villa-page captions; the fuller maker list and any architect printed nowhere |
| 7.4 | Casa di Legna · Top bar | one brand colour, mono accent, to the 404 | — | **not scored** |
| 7.A | Casa di Legna · Avoid | no booking or enquiry on the rooms page; colour preloader | both on all five villa pages (F1); no preloader rendered | **avoided** |
| 8.1 | Mastrorelli · Villas | practical block directly above a named Book button | "05 — Good to know", opening with the pool-heating policy, on Thoi, Persi, Eeanthe, Melia, **not Pueblo** (F9), and it sits **below** the CTA in 02; the sticky ledger names the villa on all five (F1); no check-in times in the registry (`villas/*.json` `checkIn: null`) | **partly present** — four of the five villa pages |
| 8.2 | Mastrorelli · Villas | rooms sold only with the whole house, labelled | all five houses carry Check availability (`hotel-data.ts:186-222`); nothing is estate-only | **not applicable** — every house is also sold on its own |
| 8.3 | Mastrorelli · Experiences | a named, host-led table | "Private Chef" (an associate network of chefs) and the Cretan-cuisine lesson are experiences; no host's table | **missing** |
| 8.4 | Mastrorelli · Weddings | shoots, filming, residencies | as 3.4 | **missing** |
| 8.5 | Mastrorelli · Footer | photography and video credits | `/` and inner footers | **missing** |
| 8.A | Mastrorelli · Avoid | a generic engine breaks continuity | WebHotelier's engine | **same here** |
| 9.1 | Primland · Villas | estate as an interactive map, a hotspot per building | `/en/the-estate`: aerial frame, nine buttons (five houses, beach, pools, table, garden) and a permanent list (`EstateMap.tsx:97-155`); 3D only on `feat/estate-3d` | **partly present** — `/en/the-estate` |
| 9.2 | Primland · Discover Crete | seasons toggle | seven routes | **missing** |
| 9.3 | Primland · Top bar | one persistent Inquire | persistent *booking* control (`/` Book Now; inner nav Check availability); enquiry is not persistent | **partly present** — booking, not enquiry |
| 9.4 | Primland · Villas | compare, filters, Book Now with preset dates | villa ledger carries date, nights and party (`BookingLedger.tsx:61-74`); no compare, no filters | **partly present** — preset dates on villa pages |
| 9.A | Primland · Avoid | WebGL-only content | the served map is HTML with a permanent list | **avoided** — on main |
| 10.1 | Editorial New · Hero | narrow serif as a magazine cover | — | **not scored** |
| 10.2 | Editorial New · Experiences | sticky contents with jump links | `/en/experiences` filter chips (they hide rows, they do not jump); `/` group headings, no bar | **partly present** — `/en/experiences` |
| 10.3 | Editorial New · Villas | specimen-style labelled figures | villa spec strip; estate ledger of six figures | **present** — villa pages, `/en/the-estate` |
| 10.4 | Editorial New · Footer | inverted colour as a close | `/` `.ho-footer` on `--ho-ink` (`hotel.css:605-610`); inner `site-footer on-dark` | **present** — every route |

**Tally of the 44 scored points (rows 1.1–10.4, *Avoid* lines excluded), after
the fix pass:** present 3 · partly present 24 · missing 14 · not scored 2 · not
applicable 1. The first check recorded partly present 23 and missing 15; the
difference is 7.3.

## Ranked rows

| old # | row | checked | result | new # |
|---|---|---|---|---|
| 1 | Dates-and-guests entry on the homepage | `/` `type="date"` ×0; villa pages ×1 each + ledger (F1) | **partly present** — villa pages only | 1 |
| 2 | What every stay includes | `/` ×0; all five villa pages and the estate (F12) | **partly present** — villa pages and the estate | 3 |
| 3 | Enquire beside Check availability; phone and email at booking | 3.1, 3.2; phones and email at `content/site.json:365-373` | **partly present** — villa pages; phone never beside booking | 2 |
| 4 | Jump bar through Experiences | 10.2 | **partly present** — `/en/experiences` filter chips | 6 |
| 5 | Getting here | 3.3; distances at `content/location.json:152-193`; arrival copy at `content/experiences/chauffeur.json:15`, `private-helipad.json:15`; coordinates and a maps URL at `location.json:58-62`, unused; the only travel time is the South coast's (F8) | **partly present** — three places; airport and port drive times owner-dependent | 4 |
| 6 | Design provenance | 7.3 (F2–F6) | **partly present** — two credits in villa-page captions; the fuller maker list printed nowhere | 5 |
| 7 | The estate as a map | 9.1 | **partly present** — 2D map on `/en/the-estate` | 7 |
| 8 | Practical block at the decision point | 8.1 (F9); `booking.json:348-351` | **partly present** — "Good to know" on four of five villa pages, below the CTA | 8 |
| 9 | Press with depth | 1.1 | **partly present** — one line | 9 |
| 10 | Floorplans and compare | 5.2 | **missing** | 10 |
| 11 | Seasons | 2.4 | **missing** | 11 |
| 12 | Voices | 2.1 | **missing** | 12 |
| 13 | Celebrations beyond weddings | 3.4 | **partly present** — the name | 13 |
| 14 | Newsletter and gift stays | 4.3 | **missing** | 14 |
| 15 | Published seasonal rates | 7.1 | **missing** | 15 |

Across the 15 rows: 10 partly present, 5 missing.

**Why the top six moved.** The ranking rule is unchanged: direct bookings first,
then buildable from what the project holds, then effort. What changed is what
it is applied to, which is now the **remaining** work, not the idea. After the
fix pass all six of the top rows are partly built, so their order rests on the
first criterion, what the remaining work would do for a booking. The order of
rows 4–6 is a judgement on that criterion, not a measurement.
- Old row 3 goes above old row 2. Half of it (a phone beside a booking control)
  is missing everywhere and the other half is one button on five cards. The
  inclusions already reach anyone who opens a villa page; they miss only a guest
  who books straight from a homepage card.
- Getting here rises from 5 to 4. It answers a question a guest has before
  paying — how to arrive, and how far it is — and the block and a map link need
  nothing; only airport and port drive times wait on the owner.
- Design provenance goes from 6 to 5. The first check moved it to 4 as "the only
  row of the six … not already partly built". That was wrong: its needle was
  case-sensitive and missed the served "EMU". The move is withdrawn. What is
  left is printing the rest of a list whose first two credits are already in
  captions, which supports the rate rather than answering a booking question.
- The jump bar drops from 4 to 6: `/en/experiences` already filters, and it is
  the furthest of the six from a booking.

Rows 7–15 keep their order: each still waits on the owner, and the checks
changed their notes, not their dependency.

## The registry claims in the old table

"Contact details are in the registry" and "both arrival services are in the
registry" were true of `content/site.json` and `content/experiences/*.json`, not
of `verified-facts.json`, which holds no phone, email, chauffeur or helipad. The
corrected table names the file each row draws on.

## Claims the first check made that the fix pass narrowed

- "No pool or terrace area exists in the registry" — false. Four villa pages and
  the estate serve a 20 m² pool area as inventory text, and the wedding venue's
  150 m² pool is in content and served (F7). What holds is: no terrace area,
  and no pool area in the spec strip.
- "No source in `content/` states a drive time" — false. `location.json:126`
  gives the South coast as about 40 minutes by car, served on `/en/location`
  (F8). What holds is: no drive time from an airport or port.
- "Villa pages carry 'Good to know'" — four of five; not Villa Pueblo (F9).
- "Position is on the estate map" — also in the detail beat of Villa Thoi and
  Villa Persi (F10).
- Cap Rocat 4.4 cited `/en/gallery`, which is outside the mapped pages and was
  never fetched; it now rests on the villa pages (F2, F3). "No award in the
  registry" is now "no architect or restoration award; the one credential is the
  Condé Nast Traveler mention".
- Ultima 6.2 quoted "Enquire — we design your stay" as the homepage label; the
  homepage says "Enquire" and "Enquire about the estate" and carries no
  `enquiry=estate` (F11). 6.1 cited `verified-facts.json` for four inclusions;
  it holds three (F12).
- The status legends listed four statuses while the files also used *not
  applicable*, *avoided* and *same here*; both legends now list all of them.

## Found in passing — not acted on (outside this workstream's files)

- `/en/location` prints "01 — Location" (page head) and then "07 — Location"
  (`src/components/sections/CoastLine.tsx:36` hard-codes `07`, from the
  homepage it was built for). This is the skipped chapter number that the Cap
  Rocat *Avoid* line warns against, and that the derived spine on the villa
  pages exists to prevent.
- The experiences hub filters by **Service** (`DragRegister.tsx:14`) where the
  homepage groups the chauffeur and helipad as **Arrival** (`hotel-data.ts:272`,
  D-003), so the two surfaces disagree on the taxonomy.

## Not checked

- The ten reference sites (not re-visited; no correction depended on them).
- The nine Dribbble links (links only, not fetched, unchanged).
- `/en/gallery` (outside the mapped pages; not fetched).
- `tests/factsheets.spec.ts` was not run: its Playwright `webServer` runs
  `npm run start` when nothing answers on 3005, and starting a server is outside
  this pass.
