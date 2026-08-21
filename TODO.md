# Thalasses Villas — Phase 0 TODO

Every open gap, contradiction and client decision found in the Phase 0 content inventory,
deduplicated from the `todos` arrays of `content/site.json`, `amenities.json`, `location.json`,
`terms.json`, `booking.json`, `assets-manifest.json`, `article-1899.json`, `villas/*.json`,
`experiences/*.json`, plus the recovery-pass files `modals.json`, `captions.json` and
`facilities/*.json`.

Ids are stable. Do not renumber; append new ids at the end of a section.

**Ground rules carried from Phase 0:** never invent a user-facing string; preserve source typos
verbatim until the client signs off a fix; decode double-encoded UTF-8 mojibake but keep genuine
U+FFFD characters alongside a normalised variant.

**Totals:** 147 items — 26 blocking · 26 missing content · 29 broken on live site · 29 source typos · 20 technical · 17 resolved.

---

## 1. BLOCKING — client decisions needed before build

Nothing can be modelled, priced or laid out until these are answered.

- **T-001 — Four villas or five?** Confirm the canonical villa count and which properties are in it.
  *Files:* `villas/2142.json`, `villas/200.json`, `villas/201.json`, `villas/202.json`, `villas/203.json`, `site.json`, `amenities.json`
  *Source:* `/en/property/2142` hero + all three meta descriptions say "five luxurious independent villas"; the Read-more modal on the same page opens "four luxurious independent villas" then says "5 independent seafront retreats" and lists five (Thoi, Persi, Melia, Eeanthe, Pueblo). Villa pages 200/201/202/203 all say "four brand new luxurious villas". Homepage meta and amenity modal 1896 say "Five".

- **T-002 — Estate bathrooms: 6, 9 or 12?** Confirm the number for `/en/property/2142`.
  *Files:* `villas/2142.json`
  *Source:* Attributes stat strip says "6 Baths"; teaser and modal both say "9 bathrooms"; the per-villa breakdown in `includedVillas` totals 9 (1+1+2+2+3) excluding Villa Pueblo's 3.

- **T-003 — Estate capacity: 18 or 24 guests?**
  *Files:* `villas/2142.json`
  *Source:* Stat strip "24 Sleeps up to" vs modal "The villas can accommodate 18 people in beds" and "a dining table for 18 people".

- **T-004 — Estate pools: 4 or 5?**
  *Files:* `villas/2142.json`
  *Source:* Stat strip "4 Pools" vs modal "Each villa's outdoor area has: swimming pool" while naming five villas.

- **T-005 — Distance to the private beach: 50 m or "a few meters"?**
  *Files:* `villas/200.json`, `villas/201.json`, `villas/202.json`, `villas/203.json`, `villas/2142.json`, `location.json`, `modals.json`
  *Source:* Shared intro says "a privileged location 50 m from a private beach"; the long description on the same pages says "just a few meters away from our organised and well thought out private beach". Modal 1898 says 50m; Villa Thoi facilities feature 710 tooltip says "The nearest beach is 50 m away". `/en/property/2142` states no distance at all.

- **T-006 — Which WebHotelier account is authoritative: `thalassesvillas.reserve-online.net` or `etouri.reserve-online.net`?**
  *Files:* `booking.json`, `villas/200.json`, `villas/201.json`, `villas/202.json`, `villas/203.json`, `villas/2142.json`
  *Source:* The global booking bar on 24 pages posts to `thalassesvillas`; the five property forms post to `etouri` with `room=WH<id>`. 100% consistent per template, irreconcilable from HTML alone.

- **T-007 — Pool heating: is it 35€ per day, and does it apply to every villa?**
  *Files:* `captions.json`, `villas/201.json`, `villas/203.json`, `villas/200.json`, `villas/202.json`, `facilities/*.json`
  *Source:* Only monetary amount on the whole site. Gallery caption "The swimming pool can be heated with additional 35€ per day upon request." appears on **`/en/property/201` (Persi) and `/en/property/203` (Melia) only**. Villa Thoi (200) and Eeanthe (202) state the same charge with no figure, and facilities feature 366 tooltip also omits it. Verify the figure is current before republishing.

- **T-008 — "Ink Hotel" appears 5× in the Terms & Conditions where the operator's own name should be.** Legal decision on the correct entity name.
  *Files:* `terms.json`, `raw/en__terms-and-conditions-1.html`
  *Source:* Sections 1.0, 2.0, 5.0, 7.0 and 9.0 (twice in 9.0). Unreplaced third-party template name.

- **T-009 — Stale promise: "a new villa suitable for 6 guests to be completed by May 2023".** Confirm whether the villa exists; the sentence must be rewritten or removed.
  *Files:* `experiences/dream-weadding-on-the-beach.json`
  *Source:* Body copy of `/en/dream-weadding-on-the-beach`. Date long passed.

- **T-010 — The estate page's short description is truncated mid-sentence.** Client must supply the missing ending.
  *Files:* `villas/2142.json`
  *Source:* `shortDescription` and `meta.description`/`og:description`/`twitter:description` all end at "12 bedrooms, 9 bathrooms" with no full stop.

- **T-011 — Thalasses Rituals renders Villa Pueblo's amenity list.** Confirm with the CMS which facilities really belong to Rituals.
  *Files:* `villas/rituals.json`, `villas/pueblo.json`, `facilities/index.json`, `facilities/pueblo.json`
  *Source:* `/en/thalasses-rituals` loads `app/index-1.js` (the homepage bundle); `facilities/index.json` is identical in content to `facilities/pueblo.json` (same 3 tabs, 55 features). The page's own `fetchFacilities('7798','en')` has no payload anywhere.

- **T-012 — Surface the hidden facility tabs, or keep only tab 0?** Decide before the amenity IA is designed.
  *Files:* `facilities/200.json` (139 features, 65 shown), `201.json` (134/62), `202.json` (137/63), `203.json` (136/63), `2142.json` (127/54), `pueblo.json` (55/43)
  *Source:* The Angular controller does `$scope.features = groups[0].group`, so the live site only ever renders tab 0. The other tabs (Entertainment/Activities, Children, Cleaning, Safety/Security, Environment) are real CMS data never shown to a guest.

- **T-013 — Villa Pueblo and Thalasses Rituals have no booking widget.** Intentionally enquiry-only, or is a booking path missing?
  *Files:* `villas/pueblo.json`, `villas/rituals.json`, `booking.json`
  *Source:* Verified: neither raw file contains `<form id="webHotelierForm">`, and neither links to reserve-online.net at all. Pueblo's only CTA is a `#facilities` anchor; Rituals' is a `#featured_gallery` anchor.

- **T-014 — Is `/en/property/2142` a fifth bookable product or a duplicate listing?**
  *Files:* `booking.json`, `villas/2142.json`
  *Source:* It carries `room=WH2142` and `exclusive=1` (whole-estate buyout) and sits alongside the four individual villas. No page states which villa 2142 is beyond the name "Thalasses Villas".

- **T-015 — Classify Thalasses Rituals: landing page or property?** Evidence is genuinely mixed.
  *Files:* `villas/rituals.json`
  *Source:* For landing: one 103-character sentence of copy, no long description, no Spaces section, no services, no booking, `loadBedroomsModal('en',0)`, no facilities payload of its own. For property: rendered by the property template, listed in "Our Villas" nav and the homepage villa grid, carries accommodation stats. Copy calls it "our brand new and truly astonishing Wedding Venue" while meta keywords say "House". Nothing on the page describes spa treatments or "rituals".

- **T-016 — Confirm the public URL slugs.** None of them exist in the source; all were derived from display names.
  *Files:* `villas/200.json` (`villa-thoi`), `201.json` (`villa-persi`), `202.json` (`villa-eeanthe`), `203.json` (`villa-melia`), `2142.json` (`rent-them-all-together`)
  *Source:* The static export addresses these pages only by numeric id (`/en/property/200` …). The 2142 slug was taken from the page h2.

- **T-017 — Is the homepage section "Location" or "Beaches"?** The redesign needs one identity.
  *Files:* `location.json`, `site.json`
  *Source:* Eyebrow `<h6>` is "Location", `<h2>` is "Beaches". It is the site's only location content but is titled after beaches.

- **T-018 — One service, two names: "Babysitter" (amenity card) vs "Baby sitting" (service card).** Pick one.
  *Files:* `amenities.json`, `captions.json`, `modals.json` (article 3796)
  *Source:* Homepage amenity card "Babysitter" → modal 3796; property-page fancybox service card `fancyServiceImages393` → "Baby sitting".

- **T-019 — Is the "Breakfast" amenity card the same service as "Daily breakfast can be arranged for our guests!" in article 1899?**
  *Files:* `amenities.json`, `article-1899.json`
  *Source:* The Breakfast card has no description anywhere. Article 1899 (Sitting outdoor area) contains that sentence. Do not silently reassign it.

- **T-020 — Careers applications leave the thalasses.com domain.** Confirm `creteholidayhome@gmail.com` is intentional, or replace it with a branded address / form.
  *Files:* `site.json`, `modals.json` (article 3869)
  *Source:* Careers modal says "send your CV at creteholidayhome@gmail.com" — a third-party Gmail matching the partner company `creteholidayhome.com`, not `info@thalasses.com`.

- **T-021 — Confirm the legal entity name in the footer copyright.** Likely an ΑΞΤΕΕ entity.
  *Files:* `site.json`
  *Source:* Stored double-encoded, renders as `ÎÏÎ¼Î·ÏÎ· ...`; decoded to "Δόμηση Ντιβελόπμεντ Αξτεε". Exact legal name and spelling unverified.

- **T-022 — Confirm the partner company's legal/trading name.**
  *Files:* `site.json`
  *Source:* The "Sales and Marketing queries:" logo has alt text "manager logo" only. URL is `https://creteholidayhome.com/`, file `creteholidayhome-logo-1.jpg`; no name string exists anywhere in the page text.

- **T-023 — Terms §2.0 contains self-contradicting, garbled legal sentences.** Lawyer review required before reuse.
  *Files:* `terms.json`
  *Source:* "We will use reasonable skill and care in performing our Service, and we will verify if, so we can guarantee that, all information is accurate, complete or correct." is then disclaimed by "We thought cannot we be held responsible for any errors" — scrambled word order, apparently a corruption of "therefore", with the negation lost. Also "the Suppliers are given access to online and offline tools through which they fully comply for updating all rates".

- **T-024 — Terms §5.0 "Free of charge" describes an intermediary/commission business model** that does not match a direct villa-owner website. Legal/commercial decision.
  *Files:* `terms.json`
  *Source:* "Suppliers pay a commission … to Ink Hotel".

- **T-025 — The Doctor amenity copy explicitly references Covid-19 and rapid tests.** Keep, rewrite or drop.
  *Files:* `amenities.json`, `modals.json` (article 3795)
  *Source:* Modal 3795 body copy.

- **T-026 — Two different id spaces.** Confirm which id the redesign keys on.
  *Files:* `villas/pueblo.json` (`property='10655'`), `villas/rituals.json` (`property='7798'`), `villas/200.json`–`2142.json` (200/201/202/203/2142)
  *Source:* `data-ng-init="page_id='172';property='10655'"` on Pueblo, `'7798'` on Rituals, numeric CMS ids in the URLs of the other five.

---

## 2. MISSING CONTENT — needs writing by the client

- **T-027 — 14 experience pages are under 40 words of body copy.** Commission real copy for each.
  *Files:* `experiences/*.json` (`needsContent: true`)
  *Source, word counts:* massage 12 · hiking 17 · running 17 · bike-tours 19 · breakfast-on-the-beach 20 · exclusive-tour 20 · wine-production 22 · therapist 25 · wine-tasting 25 · quad-safari 28 · personal-trainer 29 · chef-in-villa 31 · jeep-safari 33 · chauffeur 37.

- **T-028 — "A Moment of Fairytale" has no copy, no page and no assets beyond one thumbnail.** Decide: embed the video on a real page, or drop the card.
  *Files:* `site.json` (`experiencesSection` card 2), `assets-manifest.json`
  *Source:* Homepage grid holds 22 cards but `content/experiences/` holds 21 files. This card links straight off-site to `youtube.com/watch?v=nuSIWyTiwBU`, in the same tab, with no title, description or body copy. Only asset is `2984622fa70b8aaa4796d646c5a7c6ea_thumb.jpg`.

- **T-029 — "Playground and vegetable garden" has no description anywhere.**
  *Files:* `amenities.json` (item 1), `modals.json` (`amenityCardsWithNoDescription`)
  *Source:* No modal, no article page, no alt text beyond the card title. Only a fancybox lightbox (`fancyArticleImage1897_2`). Kept null with a todo.

- **T-030 — "Breakfast" has no description anywhere.**
  *Files:* `amenities.json` (item 3), `modals.json` (`amenityCardsWithNoDescription`)
  *Source:* Only a fancybox lightbox (`fancyArticleImage3063_4`). No modal for 3063 is ever loaded. Kept null with a todo. See also T-019.

- **T-031 — No Condé Nast Traveler quote, award name, headline or date exists.** Source the actual endorsement wording.
  *Files:* `site.json` (`press.mention: null`)
  *Source:* Image-only link (`alt="cn_traveller"`, height 350) to `cntraveler.com/story/where-to-stay-in-crete`. No accompanying text on the page.

- **T-032 — No check-in or check-out time is stated anywhere on the site.**
  *Files:* `villas/200.json`, `201.json`, `202.json`, `203.json`, `2142.json`, `pueblo.json`, `rituals.json` (all `specs.checkIn`/`checkOut` null)
  *Source:* The only checkin/checkout tokens on any page are the booking form's date input names and the Terms boilerplate.

- **T-033 — No floor plans exist anywhere.** Verified: zero matches for "floor plan" across the entire content tree.
  *Files:* whole `content/` tree
  *Source:* Grep returned no hits in any raw HTML, text export or JSON.

- **T-034 — Every "Spaces" tile on every property page has no description.** 4 tiles × 6 pages.
  *Files:* `villas/200.json`, `201.json`, `202.json`, `203.json`, `2142.json`, `pueblo.json` (`rooms[].description` all null)
  *Source:* Each tile is only a click handler (`loadPoolModal` / `loadBedroomsModal` / `loadSpaceModal`); the bodies are fetched at runtime from `/en/page/modal/...` which 404s on the static export. Modal ids recorded per file for re-crawl.

- **T-035 — Almost no image on the site has real alt text.** Write alt text for the whole library.
  *Files:* `assets-manifest.json`, `villas/*.json`, `article-1899.json`, `experiences/*.json`
  *Source:* Album images use the generic CMS label `Album Image  #NNNNN` (two spaces); the six villa hero slides and six "Photo gallery" tiles per page have **no alt attribute at all**; homepage hero slides carry only `Jumbotron-Img-1..6`; villa teaser cards only `Gallery-Photo-1..7`; villa featured images use the hidden placeholder "Featured Image".

- **T-036 — Homepage hero slides 2–6 have no copy.**
  *Files:* `site.json` (`hero.subheadings` empty)
  *Source:* Only slide 1 carries a heading ("Living Unlimited", duplicated as h1 for `.hidden-xs` and h2 for `.visible-xs`). Slides 2–6 have caption paragraphs containing only `&nbsp;`.

- **T-037 — Article 1899 "Sitting outdoor area": 25 words of body copy against a 58-image album.**
  *Files:* `article-1899.json`, `amenities.json` (item 2)
  *Source:* Strapline is duplicated as the meta/og/twitter description; the page has one `<p>`.

- **T-038 — Confirm which of the 58 images in article 1899 actually belong to it.** The album appears to mix several amenities.
  *Files:* `article-1899.json`, `captions.json` (`fancyalbum_1899`, 58 anchors, 0 distinct captions)
  *Source:* Album is far larger than a single outdoor sitting area needs; every `data-caption` is empty so nothing can be identified or ordered without visual review.

- **T-039 — All 21 experience pages have no real meta description.** Each is just the page title repeated.
  *Files:* `experiences/*.json`
  *Source:* `meta description` = `og:description` = `twitter:description` = the page title on every one.

- **T-040 — No per-villa SEO copy.** All five property meta descriptions repeat the shared complex intro.
  *Files:* `villas/202.json`, `203.json`, `200.json`, `201.json`, `2142.json`
  *Source:* Each opens with the tagline ("Living unlimited.") then the shared intro paragraph.

- **T-041 — No cancellation, deposit, minimum-stay, house-rule, pet, smoking or children policy exists on any villa page.**
  *Files:* `villas/200.json`, `201.json`, `202.json`, `203.json`, `2142.json`, `pueblo.json`, `rituals.json` (`policies` near-empty)
  *Source:* The only page-level policies recovered are the pool-heating charge and the pool alarm system. The site-wide Terms modal is OTA boilerplate (see §1 and §3).

- **T-042 — No rates, nightly/weekly pricing or seasonality anywhere.**
  *Files:* all `villas/*.json`, all `experiences/*.json`, `amenities.json`
  *Source:* The 35€ pool-heating caption (T-007) is the only monetary amount on thalasses.com. Every experience has `price: null` and `duration: null`.

- **T-043 — No page cross-links to any experience.** All editorial linking must be authored.
  *Files:* all `villas/*.json` (`relatedExperiences` empty)
  *Source:* The `after_promoted_articles` / `after_promoted2_articles` / `after_articles` sections are empty comments in every property page's HTML. Notably the wedding venue page does not link `dream-weadding-on-the-beach`.

- **T-044 — Hiking and Running ship identical body copy.** Needs distinct copy for both.
  *Files:* `experiences/hiking.json`, `experiences/running.json`
  *Source:* Byte-identical except final punctuation ("." on Hiking, "!" on Running).

- **T-045 — Wine Production and Wine Tasting overlap heavily.** Confirm whether to cross-link or merge.
  *Files:* `experiences/wine-production.json`, `experiences/wine-tasting.json`
  *Source:* Neither names a winery, grape variety or venue; Wine Tasting does not say whether it happens in-villa or at a winery.

- **T-046 — Careers section advertises a culture, not a vacancy.** Either supply real job listings or confirm it stays an expression-of-interest block.
  *Files:* `site.json`, `modals.json` (article 3869)
  *Source:* No role, department, location, contract type, salary or closing date is stated anywhere.

- **T-047 — Doctor amenity names no clinic, doctor, phone number, call-out fee or coverage area.**
  *Files:* `amenities.json`, `modals.json` (article 3795)
  *Source:* "24 hours" is the only number in the whole modal.

- **T-048 — Babysitter amenity states no rates, minimum hours, notice period or age range**, and points the guest to "contact us" without naming a channel.
  *Files:* `amenities.json`, `modals.json` (article 3796)
  *Source:* Modal 3796 is a single sentence.

- **T-049 — The six service cards have names and images but no descriptive copy.**
  *Files:* `captions.json` (`fancyServiceImages391/393/1156/329/402/405`), all `villas/*.json` `services[]`
  *Source:* Cook (professional chef) in the villa · Baby sitting · Pool maintenance · Pool Towels · Diving · Daily Excursions. Descriptions live behind `loadServiceModal('en', id)`, which is Angular-loaded and absent from the export. The tab each belongs to (Included / On Request / Services store) is also unrecoverable.

- **T-050 — Experience pages state no operator, partner, meeting point, duration, group size or logistics.** Applies across the set.
  *Files:* `experiences/*.json`
  *Source examples:* Water Sports "our partner" never named; Scuba Diving names no dive centre, dive site, certification agency, skill level or minimum age; Quad Safari names no destination ("our next destination"); Chauffeur names no vehicle types, airports or transfer times; Bike Tours names no route, difficulty or bike type; Private Helipad names no operator, landing fees or pad dimensions; Private Chef gives no menus, dietary options or party sizes; Cretan Cuisine gives no lesson length, group size or dish list.

- **T-051 — None of the 11 beach photos can be matched to a named beach.** Visual review or client input required.
  *Files:* `location.json`, `modals.json` (article 1898)
  *Source:* The 11 modal images have no captions and no alt text identifying which beach each one shows.

- **T-052 — No amenity has an icon.** Every `item.icon` is null.
  *Files:* `amenities.json`
  *Source:* The cards use only a photo (`img.psuedo-background-img`); there is no icon markup, icon font class or SVG anywhere in the section.

---

## 3. BROKEN ON THE LIVE SITE — worth telling the client

- **T-053 — `loadMoreServices` passes `property_id: 10655` (Villa Pueblo) on every property page.** Confirmed on all five.
  *Files:* `raw/en__property__{200,201,202,203,2142}.html`
  *Source:* `loadMoreServices('en',{  property_id: 10655 , addon_type_id:1})` and `…addon_type_id:2` appear identically on 200, 201, 202, 203 and 2142. Every villa's "more services" list therefore queries Villa Pueblo's inventory.

- **T-054 — The wedding page's closing CTA is a bare `<span>`, not a link.** The site's highest-value enquiry route goes nowhere.
  *Files:* `experiences/dream-weadding-on-the-beach.json`
  *Source:* "…or book a visit please click here." — "click here" is plain text inside a styled `<span>` with no `<a href>`.

- **T-055 — Three "Contact us" CTAs are plain text with no anchor, mailto or form.**
  *Files:* `experiences/exclusive-tour.json`, `experiences/jet-ski-safari.json`, `experiences/wine-tasting.json`
  *Source:* "Contact us for more informations." (Exclusive Tour, Water Sports) and "Ask us for more informations." (Wine Tasting, inside `<span class="JsGRdQ">`). Each page is a dead end.

- **T-056 — `#overview` is a dead anchor.** The footer links to it but no such element exists.
  *Files:* `site.json` (`sectionAnchors.overview`)
  *Source:* The intro/description section is wrapped in `<div id="descriptions">` instead. Decide whether to repoint the link or add the anchor.

- **T-057 — Genuine U+FFFD replacement characters in the Beaches text (modal 1898).** Broken encoding upstream, not a decode error.
  *Files:* `location.json`, `modals.json`
  *Source:* An apostrophe in "Rethymno's" and "Crete's", and curly double quotes around Schinaria, Triopetra, Agios Pavlos, are all U+FFFD in the live source. `paragraphs` preserves them; `paragraphsNormalized` supplies the intended characters. (The fourth beach, "Preveli", uses straight ASCII quotes — inconsistency is in the source.)

- **T-058 — Genuine U+FFFD in the careers text (modal 3869).**
  *Files:* `site.json`, `modals.json`
  *Source:* "the same employer � We share a vision" — an en dash lost upstream. `paragraphsNormalized` supplies "–".

- **T-059 — The Greek company name in the footer copyright is stored double-encoded** and renders as mojibake to every visitor.
  *Files:* `site.json`
  *Source:* Renders `ÎÏÎ¼Î·ÏÎ· ÎÏÎ¹Î²ÎµÎ»ÏÏÎ¼ÎµÎ½Ï ÎÎ¾ÏÎµÎµ`. See T-021 for the naming decision.

- **T-060 — The Terms page's `og:title`, `og:description` and `og:image` do not match the page.**
  *Files:* `terms.json`
  *Source:* `<title>` is "Thalasses Villas - Terms & Conditions" but `og:title`/`twitter:title` are the site-wide "Thalasses Villas - Living Unlimited", and the meta/og description is the generic villa marketing blurb. `og:image` is the generic site image.

- **T-061 — Every property, Pueblo and Rituals page emits a single malformed `tel:` link that cannot dial.**
  *Files:* `site.json`
  *Source:* `href="tel:+6974069475, (+30) 2114445757"` — both numbers crammed into one `tel:` URI with the `+30` country code dropped from the first. The homepage correctly renders two anchors: `tel:+306974069475` and `tel:+302114445757`.

- **T-062 — The per-child age inputs are rendered outside the booking form and are silently dropped on submit.**
  *Files:* `booking.json`
  *Source:* `frm_book_kid` inputs sit outside `<form id="webHotelierForm">` and carry no `form=` attribute, so a native GET submission never transmits them. Likely a live bug.

- **T-063 — The homepage renders no map at all.**
  *Files:* `site.json`, `location.json`
  *Source:* The Google Maps script targets `document.querySelector('#lodge-map')` but no `#lodge-map` element is output; `id="lodge-map"` is styled in CSS only, and the `after_map` SECTION is empty.

- **T-064 — The Google Map block on `/en/property/2142` is entirely commented out**, including the "Discover the surroundings" / "Directions" buttons.
  *Files:* `villas/2142.json`
  *Source:* `<!-- START GOOGLE MAP - 5 -->` block is inside an HTML comment. What renders instead is a plain Maps `<iframe>`.

- **T-065 — The map's marker-cluster array is empty**, so none of the 11 named beaches is plotted.
  *Files:* `location.json`
  *Source:* `var clusters = [];` in the page script; the map has a single marker for the villas.

- **T-066 — The whole newsletter section is commented out.** Confirm whether to revive it.
  *Files:* `site.json` (`newsletter.present: false`)
  *Source:* Heading, placeholder, submit label, eyebrow "Stay in touch", privacy note and First name / Last name / Email Address fields all exist only inside the comment.

- **T-067 — The newsletter anchor is misspelt `id="newsetter"`** (missing the second "l").
  *Files:* `site.json`
  *Source:* Homepage HTML. Check nothing links to it before fixing.

- **T-068 — The Therapist page renders "yourinner" with no space.**
  *Files:* `experiences/therapist.json`
  *Source:* The sentence is split across two `<span>` elements with an empty `<span>` between them ("…help you find your" + "" + "inner peace…").

- **T-069 — Instagram and YouTube are unreachable from any property page.** Three different header/footer variants exist for one site.
  *Files:* `site.json`
  *Source:* `/en/property/{id}` pages carry an extra "Gallery" nav item and exactly one social link (Facebook, with a `?ref=bookmarks` query string the homepage lacks). `villa-pueblo` and `thalasses-rituals` match the homepage nav but have **no social links at all**. The homepage has all three.

- **T-070 — The canonical URL is a relative filename on every page**, and `og:url` differs between the two homepage copies.
  *Files:* `site.json`, `terms.json`, all `villas/*.json`
  *Source:* `<link rel="canonical">` is "index-1.htm" / "200.html" / "terms-and-conditions-1.html" — not a valid absolute canonical. `root.txt` declares `og:url https://thalasses.com/` while `en__index-1.txt` declares `https://thalasses.com/en/`.

- **T-071 — The Terms page's canonical and `og:url` disagree on the URL shape.**
  *Files:* `terms.json`
  *Source:* Canonical "terms-and-conditions-1.html" vs `og:url` "https://thalasses.com/en/terms-and-conditions" (no `-1.html`).

- **T-072 — 74–95 real facilities per villa are shipped to the browser and never rendered.**
  *Files:* `facilities/*.json`, all `villas/*.json`
  *Source:* `$scope.features = groups[0].group` in the page's own app JS. See T-012 for the decision.

- **T-073 — The careers email is exposed to scrapers.** Unlike `contact.email` it is not Cloudflare-obfuscated and is not even a `mailto:` link.
  *Files:* `site.json`, `modals.json`
  *Source:* Plain text inside the modal paragraph.

- **T-074 — A reCAPTCHA site key and a Google Maps API key are exposed in the page markup.** Do not carry them over blindly.
  *Files:* `site.json`
  *Source:* `span#captchaSiteKey` and the Maps script `src`.

- **T-075 — Four "Outdoor" space tiles point at site-local theme assets, not the CDN**, and two of the folders are misspelt.
  *Files:* `villas/200.json`, `201.json`, `202.json`, `203.json`, `assets-manifest.json` (`nonCdnAssets`)
  *Source:* `/assets/images/thoi/Out_1_1.jpg`, `/assets/images/persi/Out_1_1.jpg`, `/assets/images/eanthe/Out_1_1.jpg` (villa is "Eeanthe"), `/assets/images/mailia/Out_1_11.jpg` (villa is "Melia"). Re-host or re-point before the redesign.

- **T-076 — A featured-gallery caption on Villa Melia is truncated in the source.**
  *Files:* `villas/203.json`, `captions.json`
  *Source:* Caption 39 reads "Each villa has its own outdoor area with pool & hot" — Villa Eeanthe's equivalent ends "…pool & hot tub".

- **T-077 — A caption is duplicated in the Villa Persi gallery.**
  *Files:* `villas/201.json`, `captions.json`
  *Source:* "Private swimming pool area with sun beds (The pool can be also heated)" appears on both `851c20a9…` and `283fe190…`.

- **T-078 — Every album page ships zero captions.** All `data-caption` attributes on `/albums` are empty across all five properties, plus article 1899.
  *Files:* `captions.json`, all `villas/*.json`, `article-1899.json`
  *Source:* Only the on-page featured galleries are captioned; the album grids (68+19, 61+10, 68+24, 64+17, and 2142's 4 tabs = 180 slots) are not.

- **T-079 — Thalasses Rituals' "Read more" modal opens blank.**
  *Files:* `villas/rituals.json`
  *Source:* `#modal_desc` exists but its body contains only the heading "Thalasses Rituals" and `<br>` tags. `longDescription` is genuinely null.

- **T-080 — The full Terms text is duplicated inside a site-wide footer modal on every page**, wrapped in a stray `<form id="frm_03_add">`.
  *Files:* `terms.json`
  *Source:* `<div id="modal_termsAndConditions">` (headed "Terms & Conditions", with an ampersand) is global chrome on every crawled page; body text matches the page's own copy.

- **T-081 — The Loggia credit and the W3C/AChecker validator badges are commented out** and never render.
  *Files:* `site.json` (`footer.poweredBy: null`), `booking.json`
  *Source:* "Made with Loggia's SimpleLodge" (`loggia.gr`) plus the AChecker form (`achecker.achecks.ca`) are inside an HTML comment in the footer.

---

## 4. SOURCE TYPOS — preserved verbatim, client to confirm before we fix

Every string below exists in the source exactly as written. Nothing here has been changed.

- **T-082 — `weadding`** in the live, indexable URL slug `dream-weadding-on-the-beach-1.html`. The page title and H1 both spell it correctly. Fixing it requires a redirect.
  *Files:* `experiences/dream-weadding-on-the-beach.json`, `site.json`

- **T-083 — "hot tube for 3 people"** (should be "hot tub"). The slider and gallery captions on the same pages spell it "hot tub".
  *Files:* `villas/200.json`, `201.json`, `202.json`, `203.json`

- **T-084 — "with na additional daily charge upon request"** (should be "an"). The Villa Persi page spells the same sentence "with an additional charge per day".
  *Files:* `villas/200.json`

- **T-085 — "routs"** (should be "routes"), on both pages.
  *Files:* `experiences/hiking.json`, `experiences/running.json`

- **T-086 — "informations"** (should be "information"), on three pages.
  *Files:* `experiences/exclusive-tour.json`, `experiences/jet-ski-safari.json`, `experiences/wine-tasting.json`

- **T-087 — "Piganos Kampos" vs "Pigianos Kampos"** — the same place, two spellings, sometimes in the same document.
  *Files:* `villas/200.json`, `201.json`, `202.json`, `203.json`, `2142.json`, `location.json`, `site.json`
  *Source:* Address and second paragraph say "Pigianos Kampos"; the benefits bullet says "Piganos Kampos". The map info-window writes "Pigianos kampos " (lowercase k, trailing space).

- **T-088 — "Oganic Farm"** (should be "Organic"), repeated on 7 of the 8 gallery captions.
  *Files:* `experiences/biological-garden.json`, `captions.json`

- **T-089 — "Jeep safari"** (lowercase s) sits directly above "Quad Safari" (capital S) in the same homepage grid, and is the page title/H1/meta on the detail page.
  *Files:* `experiences/jeep-safari.json`, `site.json`

- **T-090 — "Ammoudakii" / "Ammoudaki" / "Ammoudi"** — three spellings for one beach, two of them in the same modal.
  *Files:* `location.json`, `modals.json` (article 1898)
  *Source:* "the adjacent beaches of Ammoudakii" (¶6), "the beaches of Ammoudi" (¶5), "Ammoudaki" elsewhere.

- **T-091 — "single-story" vs "single-storey"** in adjacent paragraphs of the same description.
  *Files:* `villas/200.json`, `201.json`, `202.json`, `203.json`

- **T-092 — "Thalasses Villa"** (missing the final s) and **"providded"** in the Terms intro paragraph.
  *Files:* `terms.json`

- **T-093 — "Thallasses Villas"** (double l) in the Organic Farm body copy.
  *Files:* `experiences/biological-garden.json`

- **T-094 — Tagline cased three different ways:** "Living Unlimited!" (Villa Pueblo), "Living unlimited!" (Thalasses Rituals), "Living unlimited" (Thoi, Melia, Eeanthe, Persi).
  *Files:* `site.json`, `villas/pueblo.json`, `villas/rituals.json`, `villas/200.json`–`203.json`

- **T-095 — Missing space after a full stop, five occurrences.**
  *Files:* `experiences/biological-garden.json` ("…biological garden.Plant with us and…"), `villas/2142.json` ("Rent them all together.Thalasses Villas are…"), `villas/pueblo.json` ("Living Unlimited!.Unwind…"), `villas/rituals.json` ("Living unlimited!.Our brand new…"), `villas/202.json` + `203.json` ("Living unlimited." then the intro, no space)

- **T-096 — "the clear blue waters of crete"** — island name lowercase mid-sentence.
  *Files:* `experiences/scuba-diving.json`

- **T-097 — "in comfort of your villa"** — missing the article "the".
  *Files:* `experiences/massage.json`

- **T-098 — Four typos in the Villa Pueblo long description:** "two of them features master beds", "which designed by well know designers", "a fixture private chef ," (stray space before the comma), "it is worth to mention".
  *Files:* `villas/pueblo.json`

- **T-099 — "Living space" (Melia) vs "Living room" (Eeanthe)** for the same spaces tile.
  *Files:* `villas/203.json`, `villas/202.json`

- **T-100 — "Damnoni beach :"** (space before the colon) and **"Furthermore, On the South coast"** (capitalised mid-sentence).
  *Files:* `location.json`, `modals.json` (article 1898)

- **T-101 — "Amenities of Thalasses villas"** — lowercase v in the section intro.
  *Files:* `amenities.json`

- **T-102 — Unbalanced quote: `“Augenti"`** — the closing quote is straight ASCII while every other brand name uses curly quotes.
  *Files:* `villas/200.json`, `201.json`, `202.json`, `203.json`

- **T-103 — "Album Image  #NNNNN"** — two spaces before the hash, in every CMS-generated alt across the site.
  *Files:* `assets-manifest.json`, `article-1899.json`, all `villas/*.json`, several `experiences/*.json`

- **T-104 — Booking form label casing: "Adults" capitalised, "kids" lowercase**, on every page.
  *Files:* `booking.json`, `site.json`

- **T-105 — Stray whitespace in booking form strings:** `" Arriving"` (leading space) and `"Max "` (trailing space) on property pages, vs `"Arriving"` / `"Max"` on the global form. Also `"  Terms of Use"` (two leading spaces) inside the footer `<strong>`.
  *Files:* `booking.json`, `site.json`, all `villas/*.json`

- **T-106 — Five homepage card labels do not match their URL slugs.** Preserve the old paths as redirects.
  *Files:* `site.json`, `experiences/biological-garden.json`, `jet-ski-safari.json`, `chef-in-villa.json`, `boat-trip.json`, `dream-weadding-on-the-beach.json`
  *Source:* "Organic Farm" → `biological-garden`, "Water Sports" → `jet-ski-safari`, "Private Chef" → `chef-in-villa`, "Private Boat Trip" → `boat-trip`, "Dream Wedding on the Beach" → `dream-weadding-on-the-beach`.

- **T-107 — Three garbled sentences needing an editorial pass** (separate from the legal ones in T-023).
  *Files:* `experiences/scuba-diving.json` ("The clear blue waters of crete are so tempting to swim in the magic of these blue waters."), `experiences/boat-trip.json` ("…the rocky landscape are an exceptional landscape ideal for…"), `experiences/private-helipad.json` ("…also are the only seafront villas with private helipad in the property.")

- **T-108 — "Five luxurious - seafront villas with a private golden - sandy beach !"** — spaces around both hyphens and before the exclamation mark.
  *Files:* `amenities.json`, `modals.json` (article 1896)

- **T-109 — Terms §1.0: "a company incorporated under the laws of the Greece"** — stray definite article. §12.0 gets it right.
  *Files:* `terms.json`

- **T-110 — Terms address inconsistency: "Trantallidou 13-15" (§1.0) vs "Trantallidou 13- 15" (§12.0).**
  *Files:* `terms.json`

---

## 5. TECHNICAL / PHASE 5

- **T-111 — Confirm the WebHotelier deep-link parameter serialisation.** Shape is known, date format is not.
  *Files:* `booking.json` (`deepLinkPattern: null`)
  *Source:* Unverified candidate: `https://etouri.reserve-online.net/?room=WH200&exclusive=1&checkin=<DATE>&checkout=<DATE>&adults=2&children=0`. Do not ship without confirmation — mis-formatted dates will not prefill.

- **T-112 — Establish the datepicker's date format.** Not determinable from the mirror.
  *Files:* `booking.json` (`dateFormat.value: null`)
  *Source:* All date logic lives in uncaptured bundles (`app/index-1.js`, `app/{200,2142,pueblo-1}.js`, `loggia.min-1.js`, `moment.min-1.js`, `twix.min-1.js`). moment+twix confirms a moment-based range picker but not the format string.

- **T-113 — Confirm what `exclusive=1` means to the engine** — is it required, and does dropping it change results?
  *Files:* `booking.json`

- **T-114 — Confirm whether the room codes `WH200`–`WH2142` work on the `thalassesvillas` host or only on `etouri`.**
  *Files:* `booking.json`

- **T-115 — Determine the purpose of `booking_domain='https://booking.loggia.gr/en/book'`.**
  *Files:* `booking.json`
  *Source:* Declared only on `/` and `/en/`, never used as a form action in any delivered HTML.

- **T-116 — Confirm the booking form's HTTP method by observing a real submission.** GET is inferred, not stated.
  *Files:* `booking.json`, all `villas/*.json`
  *Source:* No `method` attribute on any `webHotelierForm` in any crawled file; the form carries `target="_blank"`.

- **T-117 — Metadata migration: replace relative canonicals with absolute ones, reconcile the two `og:url` variants, and stop pointing `og:image` at `_thumb` derivatives.**
  *Files:* `site.json`, `terms.json`, all `villas/*.json`, all `experiences/*.json`
  *Source:* Every `og:image`/`twitter:image` in the source is a `_thumb.jpg`. No `og:image:width`/`height` on content pages and no `twitter:card=summary_large_image`. See also T-070, T-071.

- **T-118 — Build the redirect map before launch.** Numeric property URLs, `/albums`, `/map`, the five label/slug mismatches, and the `weadding` slug all need preserving.
  *Files:* all `villas/*.json` (`legacyUrls`), `site.json`, `experiences/*.json`
  *Source:* Three distinct pages exist per property: `/en/property/<id>`, `/en/property/<id>/albums`, `/en/property/<id>/map`.

- **T-119 — Decide the locale strategy.** The URL structure implies multilingual but only English exists.
  *Files:* `raw/*` (all files), `site.json`
  *Source:* Every URL is `/en/`-prefixed and `root.html` serves the identical page with an `en/` prefix on every href; `<html lang="en">`; **no `hreflang` tags and no second locale anywhere in the mirror**. The Terms text references "the English language version" and translated courtesy versions. The only Greek on the site is the (mojibake) footer company name.

- **T-120 — Asset library: 673 distinct CDN images + 11 non-CDN files.** Plan the download/re-host.
  *Files:* `assets-manifest.json`
  *Source:* `all-assets.txt` holds 697 URL strings; inflation is the same hash appearing as relative path, absolute URL and several size variants.

- **T-121 — 47 image hashes referenced in `raw/*.html` are missing from `all-assets.txt`.** They are recovered in the manifest but the crawl list is incomplete.
  *Files:* `assets-manifest.json`, `missing-assets.txt`
  *Source:* Includes the favicon (`75464c62…`), the homepage Beaches parallax background (`33dfaa1f…`) and ~45 fancybox lightbox targets on the villa pages.

- **T-122 — 7 assets have an inferred, unverified full-size URL.** Only a `_thumb` URL was ever exposed.
  *Files:* `assets-manifest.json`
  *Source:* `b622671c…`, `14e77715…`, `2119a061…`, `b1bbe80a…`, `ae3b9459…`, `2984622f…`, `df2bacef…`. Each asset carries a `fullSizeObserved` boolean.

- **T-123 — No image dimensions, byte sizes or MIME types exist in any local source.** Capture them during the re-host.
  *Files:* `assets-manifest.json`

- **T-124 — Audit and re-decide every third-party script before carrying it over.**
  *Files:* `site.json`, `booking.json`, `villas/203.json`, `assets-manifest.json`
  *Source:* Google Analytics + gtag, New Relic RUM, **two** Facebook Pixels (one is `fbq init 434580631066362`, on Villa Melia only), Google reCAPTCHA, Google Maps JS + embed iframe, Formspree (`https://formspree.io/f/mrbkgjzw`, POST), Cloudflare email obfuscation.

- **T-125 — Migrate the schema.org JSON-LD.** It is the only structured data and it disagrees with the visible address.
  *Files:* `location.json`, `villas/202.json`, `villas/203.json`
  *Source:* Organization JSON-LD declares `addressLocality: "Rethymno"` and `streetAddress: "Pigianos Kampos area"` — no actual street name or number is given for the villas. A different address (the registered office, `Trantallidou 13-15`) appears only in the Terms.

- **T-126 — Re-crawl with JS enabled to recover the space-tile modals.** Nothing else can supply this copy.
  *Files:* all `villas/*.json`
  *Source:* `loadPoolModal` / `loadBedroomsModal` / `loadSpaceModal` ids recorded per villa (e.g. 200: 362 / 2 / 1234 / 1235; 2142: 1374 / 12 / 5477 / 5478; pueblo: 3776 / 3 / 27935 / 27936). See T-034.

- **T-127 — Re-crawl to recover the Angular Services block.** The Included / On Request / Services store tabs are fetched at runtime.
  *Files:* all `villas/*.json`, `captions.json`
  *Source:* `loadServices('en',{property_id: <id>, limit: shownServices})`. The six fancybox cards recovered in Phase 0 may be an incomplete picture. See also T-053.

- **T-128 — Three YouTube embeds, none with a title, caption, duration or transcript.**
  *Files:* `assets-manifest.json` (`videos`), `villas/200.json`, `villas/202.json`, `villas/203.json`, `site.json`
  *Source:* `3MLPeDij0kU` (Villa Thoi), `7VWaiDAWPdY` (shared by Eeanthe and Melia — complex-wide footage, not villa-specific), `nuSIWyTiwBU` ("A Moment of Fairytale", off-site card). Villa Persi has no video at all — a real difference, not a crawl gap. Several experience pages also link YouTube behind bare "here" anchor text.

- **T-129 — Every property page embeds the identical Google Maps iframe and identical coordinates.** There are no per-villa coordinates.
  *Files:* all `villas/*.json`, `assets-manifest.json`
  *Source:* Marker label "Thalasses", `35.380146561951, 24.57279329824`, zoom 11, marker id 2291 — the same on 200, 201, 202, 203, 2142, `villa-pueblo` and `thalasses-rituals`.

- **T-130 — `raw/en__index-1.htm_q_x=1` is a byte-identical duplicate of `raw/en__index-1.htm`** (MD5 `0d7d98a1cd0995cb852cb3413c9c6c55`). Counted once everywhere; do not treat as a separate page.
  *Files:* `booking.json`, `assets-manifest.json`

---

## 6. RESOLVED IN PHASE 0 — do not re-open

The recovery pass fixed these. They are recorded so nobody re-investigates them.

- **T-131 — Villa facilities are NOT empty.** Recovered from each page's own hard-coded app JS payload.
  *Files:* `facilities/200.json` (139), `201.json` (134), `202.json` (137), `203.json` (136), `2142.json` (127), `pueblo.json` (55), `index.json` (55)
  *Note:* `displayedOnLiveSite` distinguishes the rendered tab 0 from the hidden tabs. Open decisions remain: T-011, T-012.

- **T-132 — The five client-side article modals are recovered in full.**
  *Files:* `modals.json`
  *Source:* 1896 Private Beach (2 ¶, 13 images), 1898 Beaches (7 ¶, 11 images), 3795 Doctor (2 ¶), 3796 Babysitter (1 ¶), 3869 Become one of us! (3 ¶). `/en/page/modal/article/<id>` 404s because the site is a static export; the HTML is baked into the page bundle and injected by Angular.

- **T-133 — `location.nearby` is no longer empty.** Eleven named places folded in from modal 1898.
  *Files:* `location.json`, `modals.json`
  *Source:* Private beach 50m · Rethymno beach 8 km · Ammoudaki · Damnoni · Klisidi · Schinaria · Triopetra · Agios Pavlos · Preveli · Plakias village · South coast ~40 min by car. The earlier "no distances, no named attractions" note was wrong.

- **T-134 — Amenity descriptions recovered** for Private Beach (1896), Doctor (3795) and Babysitter (3796).
  *Files:* `amenities.json`, `modals.json`
  *Note:* "Playground and vegetable garden" and "Breakfast" genuinely have none — see T-029, T-030.

- **T-135 — "Sitting outdoor area" has a real crawlable page** (`/en/article/1899`), the only amenity card that does.
  *Files:* `article-1899.json`, `amenities.json`
  *Note:* Correctly filed under Amenities, not Experiences — its meta keywords read "…Sitting outdoor area,Amenities,…" while all 21 experience pages read "…Experiences,…".

- **T-136 — Careers copy recovered**, including the careers email `creteholidayhome@gmail.com`.
  *Files:* `site.json`, `modals.json` (article 3869)
  *Note:* The card renders twice (`.hidden-xs` + `.visible-xs`), both calling `loadArticlesModal('en',3869)` — one listing, not two.

- **T-137 — The six service cards are recovered** on all five property pages.
  *Files:* `captions.json`, all `villas/*.json`
  *Source:* `fancyServiceImages391/393/1156/329/402/405` = Cook (professional chef) in the villa · Baby sitting · Pool maintenance · Pool Towels · Diving · Daily Excursions. Images are byte-identical across every property (shared catalogue, not per-villa photography) and are excluded from `gallery.allImages`.

- **T-138 — All featured-gallery captions restored.**
  *Files:* `captions.json`, `villas/200.json` (40), `201.json` (43), `202.json` (45), `203.json` (44), `2142.json` (46)
  *Note:* The first pass dropped 202's 45 and 203's 44 entirely.

- **T-139 — The only price on the site was found** and traced to two pages, not one.
  *Files:* `captions.json`, `villas/201.json`, `villas/203.json`
  *Source:* "The swimming pool can be heated with additional 35€ per day upon request." on `/en/property/201` and `/en/property/203`. Decision open: T-007.

- **T-140 — Double-encoded UTF-8 decoded across the villa pages.** Schüko, Compac, Kährs, 35€, water's edge, curly quotes. No wording was changed.
  *Files:* `villas/200.json`, `201.json`, `202.json`, `203.json`, `2142.json`, `pueblo.json`
  *Note:* Genuine U+FFFD survives only in modals 1898 and 3869 (T-057, T-058) and the footer copyright (T-059), where a raw/normalised pair is provided.

- **T-141 — Villa Pueblo and Thalasses Rituals map data added.** It was missing from the first pass.
  *Files:* `villas/pueblo.json`, `villas/rituals.json`
  *Source:* Same iframe embed and same "View on map" coordinates as the property pages.

- **T-142 — All 31 Thalasses Rituals gallery URLs normalised** to absolute full-size CDN form; 25 had been left as relative `../loggia-cdn/…` paths.
  *Files:* `villas/rituals.json`

- **T-143 — Correction: six experience pages carry a fancybox album, not one.**
  *Files:* `experiences/hiking.json`, `captions.json`
  *Source:* dream-weadding-on-the-beach (20), chef-in-villa (12), exclusive-tour (12), biological-garden (8), private-helipad (8), hiking (2).

- **T-144 — Correction: the 8 Private Helipad album images DO have captions.**
  *Files:* `experiences/private-helipad.json`, `captions.json`
  *Source:* Every anchor in `fancyalbum_3927` carries `data-caption="Thalasses Villas - Private Helipad"`. Only the alt text is a CMS placeholder.

- **T-145 — Correction: "Photo gallery" is not a third album on 202/203.** It is the overlay caption of the first featured tile.
  *Files:* `villas/202.json`, `villas/203.json`
  *Source:* The real albums are the two tab panes on `/albums`: Outdoors 68 / Indoors 24 (202) and Outdoors 64 / Indoors 17 (203).

- **T-146 — Synthetic strings removed.** The stat-strip sentences on Pueblo and Rituals, and the prepended hero caption in Villa Thoi/Persi `highlights`, existed nowhere in the source.
  *Files:* `villas/pueblo.json`, `villas/rituals.json`, `villas/200.json`, `villas/201.json`
  *Note:* `data-value="200"` on every counter is a `pages-animate` attribute, not a value.

- **T-147 — `bookable: false` verified for Villa Pueblo and Thalasses Rituals** by exhaustive search of their raw HTML for `webHotelierForm`. Not a crawl gap. Decision open: T-013.
  *Files:* `villas/pueblo.json`, `villas/rituals.json`, `booking.json`

---

## 7. PHASE 1 — SCAFFOLD, TOKENS, TYPOGRAPHY

Added when the design system was built. Items T-148 onward.

- **T-148 — Dev port is 3005, not 3003.** `routes-crete` holds 3003 and `domisignature` holds 3004 (both are entries in the workspace's shared `.claude/launch.json` and both were running). `package.json` pins `next dev -p 3005` and `next start -p 3005`. A `thalasses-villas-redesign` entry was appended to the shared launch config; the three existing entries were not altered.
  *Files:* `package.json`, `../.claude/launch.json`

- **T-149 — Fonts are self-hosted via `next/font/local`, not `next/font/google`.** The Google loader fetches from `fonts.gstatic.com` at build time; the dev sandbox has no outbound access to that host, so the server returned 500 on every route. The woff2 files are now vendored in `src/app/fonts/`, which also makes the build hermetic and reproducible. Marcellus 14.2 KB + Inter 47.1 KB, both preloaded, both with `adjustFontFallback` metrics so CLS stays at 0.
  *Files:* `src/app/layout.tsx`, `src/app/fonts/`

- **T-150 — Only the `latin` subset is wired up.** It covers U+00C0–00FF, so `Schüco` and `Kährs` render correctly. `latin-ext` woff2 files are vendored but unused. **The `greek` subset has not been fetched and is a prerequisite for the `/el` locale** — blocks the Greek locale, not the English launch. Relates to T-103.
  *Files:* `src/app/fonts/`, `src/app/layout.tsx`

- **T-151 — ESLint 10 needs an explicit React version.** `eslint-config-next@16.3.0` bundles an `eslint-plugin-react` whose auto-detection calls an ESLint 9 context API that was removed in ESLint 10, throwing `contextOrFilename.getFilename is not a function`. Declaring `settings.react.version` skips that code path. Revisit when `eslint-config-next` ships an ESLint 10-compatible plugin; the workaround can then be deleted.
  *Files:* `eslint.config.mjs`

- **T-152 — Visual verification at 360/768/1024/1440/1920 is still outstanding.** The Browser pane could not be displayed in the session that built Phase 1, so no screenshot or live viewport measurement was possible. Build, typecheck, lint, HTTP status, served font files and computed styles were all verified; **layout at breakpoints was not.** Must be done before Phase 2 is signed off, including the CI assertion that `document.scrollWidth === clientWidth` at every breakpoint (DESIGN-PLAN §2.4).
  *Files:* `src/app/styleguide/page.tsx`, `src/app/globals.css`

- **T-153 — The clause fact registry is specified but not built.** `DESIGN-PLAN.md` §2.2 requires tails to be validated at build time against a registry compiled from `content/`, so a tail that does not resolve to a fact fails the build. Phase 1 ships the grammar guards only (terminal punctuation, word caps, `-ing` check) in `src/lib/clause.ts`. The registry itself is Phase 2 work — until it exists, place-specificity is still a copywriting deliverable, which is exactly the weakness all three design judges identified.
  *Files:* `src/lib/clause.ts`

- **T-154 — The waterline needs an `image-meta.json` sidecar.** DESIGN-PLAN §2.5 locks every full-bleed photograph's horizon to `--datum: 56%`, which requires a hand-tagged `horizonY` for roughly 110 frames, plus a build assertion that refuses an untagged image in a full-bleed `Field`. Not started. `content/image-index.json` currently carries dimensions only (704 entries, no subject or horizon metadata).
  *Files:* `content/image-index.json`, `src/app/globals.css`

- **T-155 — Tailwind v4 is installed but the design system is CSS-token-driven.** Tokens live in `@theme` in `src/app/globals.css` and components consume CSS custom properties directly rather than utility classes. This is deliberate — the palette must not be reachable via ad-hoc utilities — but it means most of Tailwind's utility surface is unused. Decide in Phase 2 whether to keep Tailwind for layout utilities or drop it.
  *Files:* `src/app/globals.css`, `postcss.config.mjs`

---

## 8. DECISIONS LOCKED — AND WHAT VERIFICATION FOUND

- **T-156 — `room=` is INERT on `thalassesvillas.reserve-online.net`. No villa CTA can preselect its villa.**
  Verified against the live rendered engine by comparing the `[data-room]` set across four requests — no room param, `room=THOI`, `room=WH200`, and a deliberately bogus `room=BOGUSXX`. All four render the identical five room blocks. Path forms (`/room/THOI`, `/accommodation/villa/THOI`) all 404.
  Per D4's contingency, villa CTAs link with **dates only** and do not fall back to etouri.
  *Ask WebHotelier whether room preselect can be enabled for the THALASSES account, or which parameter replaces it.*
  *Files:* `content/booking.json`, `src/lib/booking.ts`

- **T-157 — Villa Pueblo IS in the booking engine, which contradicts D1b's premise.**
  D1b states "Pueblo has no WebHotelier room code → its CTA is Enquire". The engine's availability table carries five room codes: `THOI`, `PERSI`, `MELIA`, `EEANTH`, **`PUEBLO`**. So Pueblo is bookable on the confirmed host. (It is absent from the engine's own `/accommodation/villa` page, which lists only four — an inconsistency on their side.)
  Implemented as instructed — Pueblo is enquiry-only — but **this is very likely costing bookings.** Owner to confirm.
  *Files:* `src/lib/booking.ts`, `content/booking.json`

- **T-158 — The Entire Estate has no room type in the engine.**
  The legacy `WH2142` "rent them all together" listing has no equivalent on the Thalasses host. The estate cannot be booked as a unit. Its CTA is an enquiry until the owner chooses between a five-room booking flow and an enquiry flow.
  *Files:* `src/lib/booking.ts`

- **T-159 — `lang=en` is mandatory on every generated booking link.**
  The engine **defaults to Greek**. Without `lang=en` a guest lands on a Greek availability page. Now set on every link built by `bookingUrl()`. This also resolves T-103 — `lang` is supported, which de-risks the future `/el` locale.
  *Files:* `src/lib/booking.ts`

- **T-160 — The engine states guest capacities that differ from the site copy.**
  `/accommodation/villa` lists **Thoi 4, Persi 4, Melia 4, Eeanthe 6 guests**. The marketing copy says Thoi "sleeps up to 5" and Persi 5. The booking engine is the system that actually sells the rooms, so it is the stronger source — but it is not the owner's word, so nothing was changed. **Feed these numbers into the open capacity question in §1** rather than treating them as settled.
  *Files:* `content/booking.json`, `villas/200.json`, `villas/201.json`, `villas/203.json`

- **T-161 — Villa Pueblo has only 5 images; the villa template must degrade.**
  Build the cinematic villa template so a low image count produces no empty gallery slots and no repeated images. **Owner to supply Pueblo photography — interiors and exteriors, ideally 20+.**
  *Files:* `villas/pueblo.json`

- **T-162 — Wire a room code for Villa Pueblo if it becomes bookable.** Superseded in practice by T-156 (no code works on this host) — reopen if WebHotelier enables preselect.
  *Files:* `src/lib/booking.ts`

- **T-163 — Count policy updated.** The collection is five villas (Thoi, Persi, Eeanthe, Melia, Pueblo) plus The Entire Estate (the four combined). "Five villas" is now structurally accurate site-wide, so the legacy five-vs-four contradiction (T-001) is **resolved by the IA**. Bedrooms / baths / max-guests remain `[CONFIRM]`-gated pending the owner.
  *Files:* `src/lib/content.ts`

---

## 9. CLOSED BY THE FINAL DECISIONS ADDENDUM

- **T-157 CLOSED — Villa Pueblo takes bookings.** Owner confirms the `PUEBLO` code is live. Its CTA is now the standard "Check availability" (dates-only, identical to the other four), with "Enquire" retained as a secondary option.
- **T-158 CLOSED — The Entire Estate is enquiry BY DESIGN.** A concierge sale suits a full-buyout product and avoids allotment conflicts with the individual villas. The CTA reads "Enquire — we design your stay" and must never be framed as a missing booking feature.
- **T-160 CLOSED — capacities locked** (owner source + booking engine agree): Thoi 2/1/4, Persi 2/1/4, Melia 2/2/4, Eeanthe 3/2/6, Estate 9/6/18. The four-villa sums reconcile exactly with the estate (9 bedrooms, 6 baths, 18 in beds). The legacy "Thoi/Persi sleep 5" is superseded as stale.
- **T-001 CLOSED — the five-vs-four contradiction is resolved by the IA.** The collection is five villas; the estate is "four villas combined as one".
- **T-103 CLOSED — `lang` is supported.** `lang=en` verified on the live engine and now mandatory on every generated link.
- **T-162 CLOSED** — superseded by T-156; no room code works on this host.

## 10. PHASE 2 — HOMEPAGE

- **T-164 — Estate direct booking is a one-line switch.** If an estate unit is later created on the THALASSES WebHotelier account, change `estateCta()` in `src/lib/booking.ts` from enquiry to `bookingUrl()`. Nothing else changes.
  *Files:* `src/lib/booking.ts`

- **T-165 — `horizonY` values on the homepage are estimates, not measured.** The three frames in The Position and the hero carry hand-guessed horizon fractions (0.40–0.46). The waterline only truly holds still once the `image-meta.json` sidecar from T-154 exists and the values are measured. Until then the effect is approximate.
  *Files:* `src/app/page.tsx`, `src/components/ui/Field.tsx`

- **T-166 — Villa Pueblo photography.** Still the only open owner item. 5 images against 88 for Villa Thoi. The collection cell renders correctly at that count, but the villa page in Phase 3 will need the template's low-image path, and the owner has agreed to supply interiors and exteriors (20+ ideally).
  *Files:* `villas/pueblo.json`

- **T-167 — Statement and Estate lede copy is newly written.** The homepage Statement paragraphs and the Estate lede are composed for the redesign from verified facts only (no invented amenities, distances or figures), but they are not verbatim legacy copy. They fall under the D3 draft policy and need owner sign-off before launch.
  *Files:* `src/app/page.tsx`

- **T-168 — Next 16 rejects undeclared image qualities.** `images.qualities` must list every `quality` value used or the optimizer returns HTTP 400 and every photograph silently fails. Currently `[75, 80, 82]`. Add to this list before using a new value.
  *Files:* `next.config.ts`

- **T-169 — Villa id spaces differ.** `villas/pueblo.json` has `id: "10655"` and `rituals` has `"7798"` (CMS ids), while the property villas use `"200"`–`"2142"` (URL ids). Look villas up by FILE KEY or slug, never by `id`. This already caused the fifth collection cell to silently not render.
  *Files:* `src/lib/content.ts`, `src/app/page.tsx`

---

## 11. PHASE 3 — VILLA TEMPLATE, FIVE VILLAS, THE ESTATE

- **T-152 CLOSED — `npx playwright install chromium` succeeded.** The sandbox did not block the binary; Chromium 151.0.7922.34 launches. Breakpoint screenshots and `scrollWidth === clientWidth` assertions now run for real at 360/768/1024/1440/1920 across 5 routes. Evidence in `qa/screens/`, harness in `tests/`.

- **T-170 — Scroll reveals ship as `opacity: 0` in the server HTML.** Framer Motion serialises its `initial` state, so without JS every revealed section was permanently invisible — to a reader with scripting off, to a non-executing crawler, and in print. Fixed with a `<noscript>` override in `layout.tsx` that forces the final state. Worth revisiting in Phase 5: a CSS-first reveal (`@starting-style`) would remove the need for the override entirely.
  *Files:* `src/app/layout.tsx`

- **T-171 — The Run is capped at 12 frames and the remainder becomes a contact sheet.** Rendering all 45 of Villa Eeanthe's featured photographs full-bleed produced a **35,531px page — roughly forty screens**. Now 12 horizon-locked frames (captioned ones preferred) plus a plate-index grid for the other 33, which brings the page to 13,918px. Nothing is dropped, so content parity holds. The cap is a judgement call: revisit with the owner once Pueblo's new photography lands.
  *Files:* `src/components/sections/TheRun.tsx`

- **T-172 — Clause density audit.** The Inventory section header was originally the clause `Living ALL N PROVISIONS`, which collided with the inventory's own first group, also `Living`, on a page whose hero and footer already carry `Living UNLIMITED`. Four uses of the brand's core clause on one page dilutes the device. The Inventory header now spends no clause at all — the group rail carries the grammar. **Re-audit at every new page type.**
  *Files:* `src/components/sections/Inventory.tsx`

- **T-173 — "Tempering" never renders.** The Environment / Heating-Cooling domain contains exactly two items and **both are `featureType 7`** — unresolved enum ids pointing into a CMS lookup table we do not have. The type-7 guard omits them, so the domain has nothing honest to show and is not printed. The design plan lists "Tempering 2" as a group shown at full dignity; that is not achievable until the enum table is obtained. Ask Loggia/the owner for the `feature_value` lookup, which would also resolve the 8 other omitted rows per villa.
  *Files:* `src/lib/inventory.ts`, `content/facilities/*.json`

- **T-174 — 24 amenity rows moved off the villa pages to Location.** Sports and Adventure (15), Attractions (5) and Leisure (4) are not contents of a 60 m² villa — Mountain Climbing, Winery Tours, Bird Watching. They are cut to a "Beyond the Gate" block on the Location page, where they are true. `beyondTheGate()` is implemented and ready; **the Location page that consumes it is Phase 4.**
  *Files:* `src/lib/inventory.ts`

- **T-175 — Font A/B resolved: Marcellus stays.** See `PHASE-3-DELIVERABLES.md` §1. Cormorant Garamond thins visibly at C4 and is 57% heavier as a file.

- **T-176 — Greek display type is unsolved and the A/B does not solve it.** Neither Marcellus nor Cormorant Garamond has a `greek` subset, so the choice between them was never the Greek blocker. Inter (body) does have `greek`/`greek-ext`. Recommended: **GFS Didot** for Greek display only, swapped behind `--font-display` per locale. Decision is live only when `/el` is scheduled. Supersedes the framing in T-150.
  *Files:* `PHASE-3-DELIVERABLES.md`, `src/app/styleguide/FontAB.tsx`

- **T-177 — Villa page statement copy is newly written.** The one-line "angle" per villa (front row / rear row / adults-only retreat) is composed from verified facts in each villa's own `longDescription`, but is not verbatim legacy copy. Falls under the D3 draft policy — owner sign-off before launch.
  *Files:* `src/app/en/villas/[slug]/page.tsx`

---

## 12. PHASE 2.5 — PREMIUM ELEVATION (photography foundation)

- **T-178 — Ten images on the live site are not Thalasses.** Found by the curation pass and excluded from the homepage. Two are **generic stock sports photography** (a cyclist on a mountain ridge, a cyclist silhouetted on a road) used to illustrate Bike Tours. Two are **branded Mythos beer product shots** carrying another company's logo. Two are **public places** presented inside the property set — a bay of municipal umbrellas and the Venetian Fortezza gate in Rethymno town, complete with a restoration signboard and tourists. One is **very likely a different Crete Holiday Home property** — an infinity pool overlooking mountains, where Thalasses stands ~50 m from the sea. Three more are flagged `unsure`. All ten are listed with reasons in `content/photo-selects.json`.
  **Owner decision needed:** confirm each, then decide whether they stay anywhere on the site at all. The private-beach implication of the municipal-umbrella frame is the one I would remove first.
  *Files:* `content/photo-selects.json`, `content/image-sources.md`

- **T-179 — Only 18 frames are hero-grade, against the 24–36 the brief asked for.** 871 images scored, 320 duplicates collapsed to 551 unique, 72 shortlisted, 72 graded across two passes. Eighteen earned an A. This is a real ceiling in the library, not an under-delivery of effort: the rest fail on air-conditioning units, utility poles and cabling, wheelie bins, plastic-wrapped loungers, wall-mounted televisions and AV clutter, catering trays, or flat midday light. **The homepage can be built on 18.** Reaching 30 needs a shoot, not a better search.
  *Files:* `content/photo-selects.json`

- **T-180 — The 18 A-grade frames skew heavily to dusk and golden hour.** Good for cohesion — it hands the "one consistent photographic treatment" almost for free — but there is very little strong daylight material, and almost no strong interior. Villa Pueblo contributes none. Worth pairing with the Pueblo shoot (T-166) as one brief.
  *Files:* `content/photo-selects.json`

- **T-181 — The hero video cannot be produced in this environment.** It requires downloading from YouTube, for which there is no tool here and which I am not going to work around. The Ken Burns fallback is the specified behaviour and ships; the video slot is built so an MP4/WebM drop-in is a content change. Spec for the clip is in `content/image-sources.md` §5. A clip cut from the owner's master footage will also beat anything re-encoded from YouTube.
  *Files:* `content/image-sources.md`

- **T-182 — A second owner video was discovered:** `NNuXKcDlEJs`, embedded on the Crete Holiday Home Thalasses page and not referenced anywhere on thalasses.com. Added to the video inventory.
  *Files:* `content/image-sources.md`

- **T-183 — 320 duplicate photographs across the two libraries.** The Crete Holiday Home page republishes many frames the Loggia CDN already serves. Deduplicated for curation, but both copies remain on disk. Harmless now; worth collapsing before deployment to save ~40 MB.
  *Files:* `content/photo-metrics.json`, `public/images/_chh/`

- **T-184 — ELEVATION PASS NOT COMPLETE.** Delivered: photography import, scoring, dedupe, curation, sourcing ledger. **Not delivered:** homepage recomposition to 65% imagery, ground transitions, preloader, custom cursor, magnetic CTAs, pinned Estate beat, horizontal drag Register, the marketing copy pass, and the 1440/390 review screenshots. The homepage is currently still the Phase 2 composition.

- **T-185 — The ruled-off images are now blocked centrally, not per component.** `localImage()` in `src/lib/content.ts` returns `null` for any blocked hash or filename, so a blocked frame cannot render anywhere. This was found the hard way: after the rulings were applied to the curation data, the stock cyclist was **still rendering in the Register**, because the Register reads `experience.heroImage` directly. Eight Playwright tests now assert the eight hashes appear in neither the DOM nor the markup on all 7 routes.
  *Files:* `src/lib/content.ts`, `tests/parity.spec.ts`

- **T-186 — Bike Tours renders as a typographic card.** Its only image was stock and is gone; per the ruling no substitute was introduced. The card shows the name on the sand stock and reads as awaiting photography. **Content TODO: a real, licensed photograph of actual Cretan riding routes (Tier B).**
  *Files:* `src/components/sections/DragRegister.tsx`

- **T-187 — Fortezza frame is quarantined pending quality review.** Ruled Tier B / Location-only, but the frame carries tourists and a restoration signboard. It is blocked from rendering until the Location page exists (Phase 4) and someone judges whether it clears the bar. If not, log a Tier B replacement.
  *Files:* `content/excluded-images.json`

- **T-188 — Three unsure frames await the owner.** Contact sheet at `qa/curation/owner-review/unsure-frames.jpg`. Blocked from every render until confirmed.

- **T-189 — Greek display face: evaluate by inspecting the font files, not the documentation.** When `/el` is scheduled, test candidates by downloading and rendering them rather than trusting any published subset claim — this is exactly how the Cormorant Garamond assumption was caught. Candidates: **GFS Didot** (Greek Font Society; greek, greek-ext, latin; 14.2 KB), **EB Garamond**, **Noto Serif Display**, **Literata**. Verify for each: (a) the `greek` subset is genuinely present in the served woff2, (b) Greek renders at C1–C4 without falling back, and (c) **letterspaced uppercase Greek works for clause tails** — Greek uppercase with `+0.22em` tracking and accents behaves differently from Latin and must be checked at 12–13px, not assumed. Supersedes the framing in T-150 and T-176.
  *Files:* `src/app/layout.tsx`, `PHASE-3-DELIVERABLES.md`

- **T-190 — Imagery-ratio assertion declined, on the record.** An automated 65% imagery test was considered and **rejected by the owner**: the number was directional, and asserting it would invite composing to a metric instead of to the page. The screenshot gate plus the owner's eye is the verification. Do not add this test later without revisiting the decision.
  *Files:* `CONVENTIONS.md`

- **T-191 — Standing rules codified in `CONVENTIONS.md`:** the screenshot gate, content policy in single resolvers, and prefer-mechanisms-that-cannot-drift. Each traces to a specific failure. Read before Phase 3 composition.

---

## 13. SEASATS-PATTERN REBUILD

- **T-193 — Litany copy is draft.** Five lines, owner approval required (D3 draft policy). Every fact inside them resolves against the inventory; the atmosphere carries no figures. The payoff clause "Living — WHATEVER THAT MEANS TO YOU" is also draft, per the brief's own note.
  *Files:* `src/app/home-data.ts`

- **T-194 — Two facts in the brief were corrected rather than shipped verbatim.** (a) "nine bedrooms, one booking" became "taken as one house" — the estate is enquiry-only by owner decision (T-158), so "one booking" would promise a flow that deliberately does not exist. (b) "the organic garden, dinner from fifty metres away" was cut to the verifiable part: the garden and the gardener's help are in `verified-facts.json`; the distance from garden to table is stated nowhere.
  *Files:* `src/app/home-data.ts`

- **T-195 — I invented a fact and caught it in review.** The Estate Map heading was drafted as "Nine acres of it, marked." **The estate's area appears nowhere in the inventory.** Replaced with the Clause. Recorded because it is the third time a fabrication has been caught by looking rather than by testing, and the pattern is worth watching in myself.
  *Files:* `src/components/sections/EstateMap.tsx`

- **T-196 — The estate briefly lost its call to action.** When the pinned beat gave way to the map, the estate — the highest-value thing Thalasses sells — had no CTA on the homepage. The clause, the five-figure ledger and the concierge enquiry all now travel with the map. Caught by the parity suite, which failed on the missing figures.
  *Files:* `src/components/sections/EstateMap.tsx`, `src/app/page.tsx`

- **T-197 — Helipad folded into Act I rather than kept as its own beat.** Stating it at full scale two beats after Act I already argues arrival would spend the signal twice. Scarcity is what makes it land. Reversible in one line if the owner disagrees.
  *Files:* `src/app/home-data.ts`

- **T-198 — Estate Map markers are withdrawn below 768px.** A 260px card anchored to a marker at 84% always overflows a 360px viewport. On phones the map is a photograph and the numbered list carries the information — which it does in full at every size, for every reader. Designed mobile layout, not a squeezed desktop one.
  *Files:* `src/app/patterns.css`

- **T-199 — Screenshot method changed for pinned sections.** A fullPage capture cannot represent `position: sticky`: it paints the sticky child once and leaves the tall container empty, which reads as a broken block. `tests/acts-shots.spec.ts` captures viewport frames of each act, the estate map with a marker open, and the litany mid-list. **Review pinned sections from `qa/acts/`, not from the fullPage image.**
  *Files:* `tests/acts-shots.spec.ts`

---

## 14. THE FABRICATION GUARD

- **T-200 — The numeric-token guard is live and PROVEN.** `tests/facts.spec.ts` scans every display-register string on 4 routes for digits, number-words and claim words (`only`, `acres`, `first`, `largest`, `unique`), and fails with the offending string unless the token resolves against `content/`. **Verified by injecting a fabrication:** *"Nine acres of it, and seventeen olive trees."* fails on `seventeen` and `acres`, and correctly passes `nine` — nine bedrooms is real. A guard that has never failed is not a guard. `NON_FACTUAL` holds 7 idiom exemptions; each is a hole, so keep the list short and defensible.
  *Files:* `tests/facts.spec.ts`, `CONVENTIONS.md` §4

- **T-201 — Helipad restored as a standalone beat** at C1, full scale, beat 04. Owner ruling: a card grid is where facts live, a beat is where icons live. Its Act I slot went to **secure parking, inside the gate** — verified in the facilities registry ("Parking", "Car park spaces") and in the villa captions ("Secure parking space"). A fourth card was added for the airports **and ports** (`anchor` icon, new), since Heraklion and Chania ports are both in `verified-facts.json` and were previously unused.
  *Files:* `src/app/page.tsx`, `src/app/home-data.ts`, `src/components/ui/Icons.tsx`

- **T-202 — Conventions §4, §5, §6 added:** display copy compiled against facts; sticky sections captured per-viewport and never fullPage; the registry beats the brief (with both accepted applications recorded).
  *Files:* `CONVENTIONS.md`

---

## 15. AESTHETIC DEEPENING PASS

- **T-203a — RESOLVED: the atmosphere layer un-stuck the pin.** H1 confirmed, though by a different mechanism than predicted. The ancestor walk came back **completely clean** — no `transform`, `filter`, `backdrop-filter`, `will-change`, `contain` or non-visible `overflow` anywhere on the sticky chain. The kill was direct: `atmosphere.css` added `.acts > * { position: relative; z-index: 1 }` to lift children above the sea-light glow, and `.acts-sticky` is a direct child. Same specificity (0,1,0), later import — so `relative` overrode `sticky`. Measured proof: `getComputedStyle(.acts-sticky).position === "relative"`. Fixed at the cause: the glow moved to `z-index: -1` behind the flow, so the children need no positioning at all. Guarded by two permanent tests — an ancestor/computed-position walk, and a behavioural check through the run.
  *Files:* `src/app/atmosphere.css`, `tests/patterns.spec.ts`

- **T-203b — RESOLVED: the page was correct; the TEST was wrong.** All three ordered hypotheses ruled out by measurement, logged rather than inferred. (a′) stacked variant: **ruled out** — `.acts-sticky` mounted, `reduce: false`, `pointer: fine`, `hover: true`, wide: true. (2) zero-travel geometry: **ruled out** — sticky 900px inside a 2700px container, **1800px of travel**, `position: sticky`, `top: 0px`, parent `.acts`. (3) `svh`: **ruled out** — `100svh` resolved to 900 = `innerHeight` = `clientHeight`.
  The residual cause was the test precomputing the container's document offset once at `scrollY 0`, then scrolling to fractions of it. Lazy images below the fold load as you descend, so every offset above the acts section moves and the target lands outside the pinned run — where a sticky child is *supposed* to travel. H2's spirit (stale targets) was right; its stated cause (the type-scale push) was not. Fixed by reading live geometry after every scroll and asserting `withinRun` before asserting the pin.
  *Files:* `tests/patterns.spec.ts`


- **T-203b (superseded entry) — with `position: sticky` correctly restored, the stage still does not pin.** The ancestor/position test passes; the behavioural test fails with the stage at `-441px` while `window.scrollY` is **exactly** at the target (5582 = 5582), which rules out Lenis interception and stale capture targets (H2) alike. So there is a second, distinct cause beyond the override. Not yet root-caused, and **not guessed at a fourth time** per Conventions §8. Next: check whether `.acts-sticky` is being measured while the stacked variant is mounted, whether `svh` resolves differently under the Playwright viewport, and whether the sticky box's own height equals its containing block.
  *Files:* `src/components/sections/ActShowcase.tsx`, `src/app/patterns.css`

- **T-203 (original entry) — the pinned-act capture shows the heading and tab bar cut off.** I mis-diagnosed this **twice**: first as the ≥1440 type push overflowing the sticky container, then as viewport-vs-document scroll coordinates. Measurement contradicts both — `.act-body` is 517px inside a 784px stage, the title computes to 60px, and at `scrollY: 0` a bounding box already IS the document offset, so the "coordinate fix" was a no-op. **Root cause unknown.** Next session: measure at the exact capture scroll position rather than after `scrollIntoViewIfNeeded`, and check whether `.acts-nav` is being clipped by `.acts-sticky { overflow: hidden }` when the sticky child is mid-release. Do not ship this to the owner as working.
  *Files:* `tests/acts-shots.spec.ts`, `src/app/atmosphere.css`, `src/components/sections/ActShowcase.tsx`

- **T-204 — A decoration stated a false fact, and it shipped through a clean build.** The count-up ledger initialised at `0`, so the estate block rendered **"0 Bedrooms"** in the server HTML, for every reader without JS, and for anyone whose observer never fired. The truth is now the default state and the animation is the exception. Guarded by *"no animated numeral ever renders a false value"*. Codified as `CONVENTIONS.md` §7.
  *Files:* `src/components/ui/Ledger.tsx`, `tests/facts.spec.ts`, `CONVENTIONS.md`

- **T-205 — Two faces added, verified from the served woff2 (T-189 method).** Marcellus SC 14.2 KB (latin, latin-ext — **no Greek**, same gap as Marcellus, so T-176 applies to it too) and Cormorant Garamond Italic 23.1 KB (genuinely declares `font-style: italic`). Four voices total; the cap holds.
  *Files:* `src/app/layout.tsx`, `src/app/fonts/`

- **T-206 — Cut from this pass, audited as "just more":** duotone pelagos treatment, match-cut transitions, FLIP chip reflow, glass navigation. Reasons in the STOP report. Do not re-add without an argument that survives the taste law.

---

## 16. PHASE 3 — NAVIGATION, ESTATE MAP, VILLA TEMPLATE

- **T-207 — The navigation shipped, and with it the deferred glass spec.** Fixed bar, transparent over the hero, `backdrop-filter: blur(18px)` + hairline after it. Numbered register 01–05, booking affordance always in the bar at every width (never behind the toggle), skip link to `#main`, `aria-expanded`, focus into the panel on open and back to the toggle on Escape. Wired once in `layout.tsx`. **A T-203 regression guard asserts the nav is never an ancestor of `.acts-sticky`** — `backdrop-filter` is now on the site and that is exactly the property class that un-pinned the showcase.
  *Files:* `src/components/ui/SiteNav.tsx`, `src/app/patterns.css`, `src/app/layout.tsx`, `tests/nav.spec.ts`

- **T-208 — The Estate page carries the map at full depth**, with the inherited `Ledger` component in place of its bespoke figures block, all nine markers, the permanent numbered legend and the concierge CTA. This page is the map's true home.
  *Files:* `src/app/en/the-estate/page.tsx`

- **T-209 — `networkidle` broke 67 tests the moment the nav shipped.** One cause, zero real defects: the nav's ten in-viewport `<Link>`s keep Next prefetching, so the network never idles. Replaced suite-wide with `load`, then — where hydration matters — with `waitForSelector` on the actual element, because `load` fires before React swaps the stacked acts variant for the pinned one. Codified as `CONVENTIONS.md` §10.
  *Files:* all seven spec files, `CONVENTIONS.md`

- **T-210 — RESOLVED, and it was a REAL BUG, not a test artifact.** The built rule contained **only** `-webkit-backdrop-filter`, never the standard property: writing the unprefixed declaration first and a hand-written `-webkit-` twin second made Lightning CSS collapse the pair to the prefixed form alone. **Safari would have shown glass; Chrome and Firefox would have shown none.** Removing the hand-written twins lets the build prefix from its own browser targets, and the rule now ships both. Confirmed in the built CSS, not inferred.
  Note for the record: my first check looked in `.next/static/css/` and found nothing, which nearly produced a fourth wrong diagnosis — Next 16 emits CSS to `.next/static/chunks/`. Locate build output by searching for a known token, never by assuming a path.
  *Files:* `src/app/patterns.css`

- **T-210 (superseded) — the glass `backdrop-filter` assertion reads `"none"`.** The `is-solid` class applies correctly and the transition has completed before the read. Two unmeasured candidates: headless Chromium not compositing `backdrop-filter`, or Lightning CSS dropping it for the configured browser targets. **Not guessed at** (§8). Verify in a headed browser first — if it renders there, the test needs `--enable-features` or the assertion should target the stylesheet rather than the computed value.
  *Files:* `tests/nav.spec.ts`, `src/app/patterns.css`

- **T-211 — CLOSED. Phase 3 is complete.** The villa template is deepened onto the inherited language, the side-by-side captures exist at 1440 and 390, the nav is captured in all three of its states, and the motion inventory delta is in `PHASE-3-DELIVERABLES.md`. Details in T-212 – T-217 below.

---

## 17. PHASE 3 COMPLETION — THE VILLA TEMPLATE ON THE INHERITED LANGUAGE

- **T-212 — Five owner-confirmed facts per villa were reaching the page only through JSON-LD.** Bedrooms, bathrooms, floor area, the bed breakdown, the bath breakdown, the view and the distance to the water were all in `villas/*.json` and printed nowhere a guest could read them — legible to a crawler, invisible to a reader. **The cause was upstream of the component:** `VillaSpecs` in `src/types/content.ts` never mirrored the fields the capacity lock added, so `bedroomsDetail` and `bathroomsDetail` did not exist as far as TypeScript was concerned and nothing complained. The type now mirrors the JSON, the figures print in the approved `Ledger`, and the prose details print as a hairline list. Guarded per villa, read from `/content`, in `tests/parity.spec.ts`.
  *Open, non-blocking:* **Villa Pueblo carries none of the four detail fields** and its specs have no `specsConfirmed` flag, unlike the other four. Worth an owner confirmation alongside the Pueblo shoot (T-166).
  *Files:* `src/types/content.ts`, `src/app/en/villas/[slug]/page.tsx`, `src/app/villa.css`, `tests/parity.spec.ts`

- **T-213 — The mobile menu was unreachable on every phone, and the overflow suite could not see it.** Measured at 320, 360, 390 **and** 430: `.nav-inner` was 447px wide against the viewport, and the Menu button sat entirely off the right edge. `qa.spec.ts` asserts `documentElement.scrollWidth === clientWidth` at six widths on five routes and passed throughout — **a `position: fixed` element contributes nothing to the document's scroll width.** The instrument measured the document; the defect lived in the fixed layer.
  Fixed by tightening the bar below 767 and swapping the booking label to "Book" via two spans, exactly one of which is `display: none` — so the accessible name is always identical to the visible text, which an `aria-label` override would have broken (WCAG 2.5.3). The structural fix is a new guard that measures the fixed layer in its own coordinate space: every interactive child of the bar must lie inside the viewport, at seven widths.
  *Files:* `src/components/ui/SiteNav.tsx`, `src/app/patterns.css`, `tests/nav.spec.ts`

- **T-214 — The villa template now carries the one deep passage.** Beat 02 moved to pelagos, matching the Estate page so the two read as one document rather than two templates sharing tokens. It brings the atmosphere layer with it: sea-light and the ghost numeral only exist on a deep ground, which is why the template could not reach them before. Villa and estate pages both carry a numbered spine 01–05, asserted in order.
  **The T-203 reflex:** the ghost numeral needs `overflow: hidden`, and overflow on any ancestor silently kills `position: sticky` on a descendant — the same shape as the rule that un-pinned the acts. The inventory rail is the only sticky element on a villa page, so a guard now asserts it is still sticky and that no ancestor clips it. Added *because* clipping entered the template.
  *Files:* `src/app/en/villas/[slug]/page.tsx`, `src/app/en/the-estate/page.tsx`, `src/app/villa.css`, `src/app/atmosphere.css`, `src/app/sections.css`, `src/components/sections/Inventory.tsx`, `src/components/sections/EstateMap.tsx`, `tests/villa.spec.ts`, `tests/parity.spec.ts`

- **T-215 — `SmoothScroll` and `CustomCursor` were mounted per page.** Lenis and the contextual cursor existed on `/` and vanished the moment you opened a villa — including on the nav's own `data-cursor="Book"`, which sat there labelling nothing on every page but the homepage. A site-wide affordance mounted per page is not a site-wide affordance. Hoisted into `layout.tsx`; both still self-disable on touch and under reduced motion. Guarded on a villa route.
  Also fixed in passing: `EstateMap` hard-coded the homepage's `"06 — The Estate"`, so `/en/the-estate` printed a beat number belonging to a different document. It is a prop now.
  *Files:* `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/en/the-estate/page.tsx`, `src/app/en/villas/[slug]/page.tsx`, `src/components/sections/EstateMap.tsx`

- **T-216 — A run caption was set on bare photograph, and only a screenshot could show it.** `Field` carries an unconditional scrim for exactly this reason; the run does not go through `Field`. On a frame whose lower third is sunlit timber decking, limestone type on white timber was simply unreadable. A `.run-scrim` gradient now renders **only** where a caption exists, so an uncaptioned frame stays a clean photograph. Worst case — pure white beneath — the composite is `#505C60` and limestone reads **5.7:1**, AA at body size. Guarded both ways: no caption without a scrim, no scrim without a caption.
  *Files:* `src/components/sections/TheRun.tsx`, `src/app/villa.css`, `tests/villa.spec.ts`

- **T-217 — The fourth voice was rendering at a fifth of its designed weight.** `globals.css` imports every partial at the **top** of the file, so its own `.lede` rule cascades *after* `atmosphere.css` and was quietly winning the font-size: the Cormorant italic aside rendered at 20px lede scale instead of 38px, reading as a caption stranded in an empty column. Raised specificity on `.lede.villa-angle` rather than reordering the imports, which would have moved every partial's cascade at once. **Found in a capture, not by a test** — nothing was broken, it was just wrong.
  *Files:* `src/app/villa.css`

- **T-218 — My own measurement rig produced a false reading, twice in one session.** I started `next start` by hand to measure the nav, then rebuilt `.next` underneath it; `playwright.config.ts` has `reuseExistingServer: true`, so the suite silently ran against a server serving stale chunks and reported three failures that did not exist. Separately, the first side-by-side harness wrote its iframes into `document.body` of a real page — React hydrates a moment later and reclaims the body it owns, so the panes were removed under the harness while the wait, quite correctly, reported nothing. Both are rig faults, not code faults, and both cost a diagnosis. Codified as `CONVENTIONS.md` §12.
  *Files:* `tests/phase3-shots.spec.ts`, `CONVENTIONS.md`

---

## 18. SECURITY

- **T-219 — A live Google Maps API key reached the public repository inside 43 Phase 0 scrapes.** Not ours: it is the **old site's** key, embedded by the Loggia CMS template on every page, so every scrape under `content/raw/` carried one occurrence. Found by GitHub secret scanning (alert #1, `google_api_key`) and scoped by an independent clone-audit before I touched anything. Nothing in `src/` or the content JSONs referenced the literal value, and the redesign uses no Maps key at all — `EstateMap` is a photograph with hotspots, not an embed.
  **My four pre-commit gates were real and they held for everything they covered** — zero hits for `sk-`, `ghp_`/`gho_`, `AKIA`, `xox*` and PEM blocks, all true. Two things were missing, on two different axes: the pattern list had no Google format, and — the worse one — `content/raw/` **was not being scanned at all**, because the scraped dumps were treated as data rather than as text that can hold a secret. Third-party HTML lifted off someone else's live production server is the likeliest carrier of a credential in this entire project, and it was the one directory exempted. Same shape as T-213: the instrument was pointed at the layer I was authoring, not at the layer the defect lived in.
  Redacted to `AIZA_KEY_REDACTED` in all 43 files with the URL structure intact, history rewritten (`--amend` + `--force-with-lease`, one commit deep so the rewrite is complete), remote verified over HTTP. **Rotation at the Google console is the actual fix and is the owner's** — a key that has been public is harvested, and GitHub still serves the pre-rewrite blob by SHA (verified: HTTP 200). Alert #1 stays **open** until the owner confirms the console action, then resolves as revoked.
  Codified as `CONVENTIONS.md` §13 — filed as 13, not 12, because §12 was already taken by last session's rule. Guard: `scripts/scan-secrets.mjs`, wired into `npm run verify` and `npm run scan:secrets`, whole-tree, NUL-sniffing, masked output.
  *Files:* `content/raw/*` (43), `scripts/scan-secrets.mjs`, `SECURITY-NOTES.md`, `CONVENTIONS.md`, `README.md`, `package.json`

- **T-220 — reCAPTCHA site keys and GA/GTM ids judged public by design, and registered as such.** Two reCAPTCHA *site* keys, one UA property, three GA4 measurement ids and one GTM container id live in the captured old site under `content/raw/`, `content/raw-booking/`, `content/raw-chh/` and `content/text/`. All are values a browser must receive to work; the reCAPTCHA **secret** key is the credential and appears nowhere here. Listed with reasons in `SECURITY-NOTES.md` §2 so a future scanner alert on any of them is answerable in one line. They match no current pattern; if one ever does, the fix is an exact-value entry in `PUBLIC_BY_DESIGN`, never a loosened regex.
  *Files:* `SECURITY-NOTES.md`, `scripts/scan-secrets.mjs`

---

## 19. THE DIRECTIVE AUDIT — measured before built

A section-by-section critique arrived with eleven or so findings. Five were
confirmed by measurement against HEAD, three were refuted, and one was worse
than reported. Everything below was measured first; nothing was accepted on
description. Conventions §12 in spirit: an instrument pointed at the layer the
defect lives in, not at the layer the reviewer was describing.

- **T-221 — CONFIRMED, and worse than reported: the numbered spine was incoherent.** Reported as "two Arrival beats". Measured: `01 — Arrival`, `02 — The stay`, `03 — Together`, `04 — Arrival`, `05`, `06`, `07`, **[08 missing]**, `09`. Three sections carried no number at all (hero, litany, location) and beat 08 did not exist. **Root cause the critique did not reach:** the three act *eyebrows* in `home-data.ts` were written as beat numbers (`"01 — Arrival"`), so three acts inside one beat each claimed a beat, and the helipad beat collided with act one. Acts are now named (`Act one/two/three`), the acts section carries a single beat label, and the spine runs 01–08 gapless with every section labelled and no repeated name. Guarded by a gapless/unique/named assertion.
  *Files:* `src/app/home-data.ts`, `src/app/page.tsx`, `src/components/sections/{Litany,ActShowcase,Collection,EstateMap,CoastLine}.tsx`, `tests/patterns.spec.ts`

- **T-222 — CONFIRMED, but it is an ACCESSIBILITY bug, not a visual one.** Reported as the litany "repeated inline as a concatenated run-on string with doubled full stops". Located precisely: a single `.sr-only` paragraph in `Litany.tsx` joining already-terminated lines with `". "`, producing `"…is up.. The gate…"`. Invisible on screen; heard twice, malformed, by anyone using a screen reader — and it is what a text-extraction pass of the page surfaces, which is how the reviewer met it. Deleted rather than repaired: every line is already in the `<ul>` at full text, so the paragraph was pure duplication. Guarded two ways — no doubled full stop in rendered text, and the first litany line appears exactly once.
  *Files:* `src/components/sections/Litany.tsx`, `tests/patterns.spec.ts`

- **T-223 — CONFIRMED: eight of eleven beaches rendered as an em dash.** `{b.distance ?? "—"}` printed a placeholder for every beach the inventory has no distance for — Ammoudaki, Damnoni, Klisidi, Schinaria, Triopetra, Agios Pavlos, Preveli, Plakias. Inventing the eight is not available; nothing in the registry states them. So the layout stops asking: beaches WITH a confirmed distance keep the measured two-column treatment, the rest are set as a named run under "Further south". The split is computed from the data, so when the owner supplies distances they simply move columns. Guarded: no distance cell may be an em dash or empty.
  *Files:* `src/components/sections/CoastLine.tsx`, `src/app/patterns.css`, `tests/patterns.spec.ts`

- **T-224 — CONFIRMED, and not in the critique: `/#experiences` pointed at nothing.** The site nav has linked to `/#experiences` on every page since the nav shipped, and no element carried that id. A dead anchor in persistent chrome. Guarded by a test that resolves **every** in-page anchor on the homepage.
  *Files:* `src/app/page.tsx`, `tests/patterns.spec.ts`

- **T-225 — CONFIRMED: no scroll cue.** Added as a real anchor to `#litany` — keyboard- and tap-operable, not a decorative glyph. **Then I introduced a defect fixing it:** at `bottom: 2rem` it sat underneath the sticky booking ledger at every width — 62px of overlap at 768/1440, 198px at 390. Measured, not noticed: the first screenshot showed the label and hid the hairline. Offset is now a `--ledger-clearance` token, the cue is not rendered below 768 (the ledger is 230px of an 844px viewport there — the bottom edge is already broken by real chrome), and a test asserts the cue never intersects the ledger at 390/768/1440.
  *Files:* `src/app/page.tsx`, `src/app/elevation.css`, `tests/patterns.spec.ts`

- **T-226 — THREE CLAIMS REFUTED BY MEASUREMENT, now asserted in the opposite direction.** (a) *"No preloader"* — there is one; it renders at 674–1081ms with the wordmark and dismisses inside ~1.8s, which is why a late look misses it. (b) *"A static image with no motion"* — the hero is `KenBurns`, a 20s 1.0→1.06 push. (c) *"The Collection reads as a text-link list"* — all five cells are image-forward; 5 cells, 5 images. A fourth claim was half right: two experience cards carry no photograph, but they already get a designed typographic treatment rather than a hole — and the two are Bike Tours and Cretan Cuisine, whose only images the owner ruled off, not the four cards named in the critique. Each is now a test, so the next reader of this page gets a measurement rather than an argument.
  *Files:* `tests/patterns.spec.ts`

- **T-227 — OPEN, for the owner: the nav register and the beat spine are two numbered systems on one page.** The nav reads `01 The Villas / 02 The Estate / 03 Experiences / 04 Weddings / 05 Location`; the page now reads `01 — What a stay here is` … `08 — Weddings`. Both are set in the same letterspaced micro register, so "02" means two different things depending on where you look. Two of the five nav entries point at other pages, so the two systems cannot simply be reconciled by renumbering. **Not fixed unilaterally** — dropping the nav's numerals, or restyling them, touches every page and is a design decision. Recommendation: drop the numerals from the nav and keep numbering for the page spine alone.

---

## 20. THREE ART DIRECTIONS — THE BAKE-OFF

- **T-228 — Owner rejected the design language after three refinement rounds. Method changed to options, not adjectives.** Three complete art directions of the homepage at `/a`, `/b`, `/c`, indexed from `/choose`. **Skins and compositions, not three codebases:** every fact, photograph, villa, figure and booking URL resolves once in `src/lib/homepage.ts` and all three import it; the components (`Field`, `Clause`, `Ledger`, `Collection`, `EstateMap`, `DragRegister`, `CoastLine`, `Litany`, `KenBurns`, `BookingLedger`, `SiteFooter`) are reused unchanged. What differs is CSS scoped under `.dir-a/.dir-b/.dir-c` and the order and scale of the beats.
  **A — Night Cinema:** near-black / white / one grey, colour only inside the photographs, full-bleed frames butted edge to edge with a single line over each; the litany becomes intertitles and the five villas become five plates. **B — Light Editorial:** the limestone system at full strength — type one step up, photography interrupting prose rather than following it, rhythm tightened so scale carries emphasis instead of air. **C — Bold Immersive:** scale contrast as the organising idea — 22vw type cropping its own frame, the estate's numbers as the loudest beat, villa names set larger than the photographs they sit on.
  Marked `noindex` and excluded from search. Production `/` is untouched.
  *Files:* `src/lib/homepage.ts`, `src/app/{a,b,c,choose}/page.tsx`, `src/app/directions.css`, `tests/directions.spec.ts`

- **T-229 — The bake-off guard.** A comparison is worthless if the three drift apart on content, and equally worthless if they are not visibly distinct. Both are asserted: each route states the locked capacity table and all five villa names, books against the real engine dates-only with `lang=en`, renders no ruled-off frame, and does not scroll sideways at 390 or 1440 — **and** a test fails if all three share a ground colour or a hero type scale.
  *Files:* `tests/directions.spec.ts`

- **T-230 — Three legibility defects found by looking, fixed before shipping.** (a) The first pass restyled the shared nav with `mix-blend-mode: difference`, which turned the wordmark mid-grey against A's bright sky and put the booking affordance below AA — replaced with explicit light chrome over its own scrim. (b) C's ghost button was white type on a bright frame and could not be read — it keeps its secondary role by ground and weight, not by transparency. (c) On a phone, C's 26vw hero type and its lede were landing on top of each other; the type moved to the upper third and the copy now clears the 230px booking bar. All three were visible only in a screenshot.
  *Files:* `src/app/directions.css`

- **T-231 — OPEN, for the owner: pick one.** These are comparison artifacts, not three finished sites — distinctness over completeness, per the brief. Whichever direction wins, the losing two routes and `directions.css` come out, and the winner is finished properly against the full convention set.

---

## 21. DIRECTION D — THE PRODUCTION HOMEPAGE

- **T-232 — The bake-off resolved into one direction, and the comparison routes are gone.** D is the light limestone ground carrying **A's composition** (full-bleed frames as film plates, the litany as intertitles at one line per screen, one villa per viewport) and **C's confidence** (display scale, the estate's numbers as their own beat) — with every failure mode of both discarded: no 22vw cropped type, no deliberate overflow, no edge-butted stacking, no name over-and-larger than its photograph, no near-black global ground. `/a`, `/b`, `/c`, `/choose`, `directions.css` and `tests/directions.spec.ts` deleted.
  *Files:* `src/app/page.tsx`, `src/app/direction-d.css`, `src/lib/homepage.ts`, `tests/direction-d.spec.ts`

- **T-233 — The display ceiling is now structural, not a habit.** A fluid scale with rem anchors and hard clamp maxima (`display-xl` 96px, `display-l` 64px, `headline-m` 44px, `title-s` 26px), and the legacy `c1–c4` register RESOLVES to it, so the cap is one edit rather than a rule every component must remember. **The ≥1440 scale push in `atmosphere.css` is deleted** — it took c1 to 288px, which is where "scale is the cheapest luxury" stopped being true. Guarded at six widths on four routes: nothing legible above 96px. The ghost numeral is exempt by construction — `aria-hidden` and under 10% ink — and the test says so rather than special-casing a class name.
  *Files:* `src/app/globals.css`, `src/app/atmosphere.css`, `tests/direction-d.spec.ts`

- **T-234 — Rhythm tokens, and one idea per viewport.** `--section-y` / `--section-y-tight` / `--plate-inset` / `--card-gap`. Villa plates are 88svh with 150px between them, asserted: consecutive plates may never be closer than 48px, and a plate may never fill the viewport. The three acts moved onto limestone, so the deep ground is spent exactly **twice** on the page — the last litany line and the estate numbers — asserted as ≤2.
  *Files:* `src/app/direction-d.css`, `tests/direction-d.spec.ts`

- **T-235 — Five villa plates rendered as five empty rectangles, and it was my own rule I broke.** I passed `villa.gallery.heroImage` — a Loggia CDN address — straight to `next/image`. Nothing is hotlinked, so no `remotePatterns` exist and every plate painted the ammos placeholder. Worse than the blank frames: **bypassing `localImage` bypasses the owner's ruled-off list**, so a blocked frame could have walked back onto the homepage. Identical in shape to T-185. Resolved centrally in `getHomepageData` and guarded twice — no remote URL may reach an `<img>` on any route, and all five plates must actually paint.
  *Files:* `src/lib/homepage.ts`, `src/app/page.tsx`, `tests/direction-d.spec.ts`

- **T-236 — The hero scrim was computed, then found wanting, then computed properly.** The first ramp reached 0.62 at the very bottom, which left ~0.28 across the band the copy occupies; over a near-white sky that composites to ~#BABEC0 and limestone reads about **1.6:1**. The headline survived only because it happened to land on dark rock. Worst case is what has to pass: limestone needs the ground at or below sRGB ~105 for 4.5:1, which needs **alpha ≥ 0.68** — so the copy band holds 0.72, the same number `Field` already carries for the same reason. Two further failures found in the same screenshot and fixed: the clause TAIL was preveli (a deep-ground colour) over a golden sky, and the nav register sat at roughly 1.4:1 over bright sky until the bar gained a faint top scrim.
  *Files:* `src/app/direction-d.css`, `tests/direction-d.spec.ts`

- **T-237 — The credential scanner had a hole, found by accident.** `vercel` wrote a real `VERCEL_OIDC_TOKEN` into `.env.local`; the scanner read the file and reported the tree **clean**, because the generic-assignment pattern required quotes and an env assignment has none. Two fixes: JWT and unquoted-assignment patterns added, and the scope changed from a filesystem walk to `git ls-files --cached --others --exclude-standard` — what can actually reach a commit. Scanning ignored files is worse than useless: a legitimate local credential failing `npm run verify` trains people to ignore the scanner. Proven with a canary that previously passed and now exits 1.
  *Files:* `scripts/scan-secrets.mjs`

- **T-238 — The scroll odometer is retired**, asserted absent rather than deleted quietly. It was a charming gadget, and this direction's brief is explicit that confidence comes from timing and whitespace rather than devices.
  *Files:* `tests/patterns.spec.ts`

- **T-239 — OPEN, owner to verify:** the geographic scope of "the only seafront villas with helipad"; the press line (Condé Nast Traveller) now set as type above the footer rather than as a hero badge; per-villa m²/sq ft for the imperial pairing the villa-page template still needs; and the eight beach distances. None blocks the homepage.

---

## 22. OVERNIGHT BATCH — DIRECTION D EVERYWHERE

- **T-240 — DEPLOY.md written; the stale-pipeline claim is dead.** The pipeline has been live throughout: `git connect` done, auto-deploy on `main`, protection disabled, team `domisi`, no env vars, `noindex` on by design until the domain move. I told the owner twice to run `vercel login` / `link` / `git connect` / `--prod`; all four were already done. The error came from reading `npx vercel whoami` → `Logged out`, which reports the **local CLI's** auth on one machine and says nothing about a **server-side** GitHub↔Vercel link. Codified as `CONVENTIONS.md` §15, and `noindex`'s launch-day sequencing is recorded so nobody "fixes" it early and splits the client's own rankings.
  *Files:* `DEPLOY.md`, `CONVENTIONS.md`

- **T-241 — The villa template rebuilt on Direction D, in the Aman/One&Only order.** Hero → spec strip → accent lede + book → gallery → **two lists** → story beats → cross-sell → booking bar, on D's tokens and composition rules. Spec strip carries metric as the registry value and imperial as a sub-note (arithmetic, and the hierarchy says so). Two or three eyebrow story beats per villa, each with a `source` field naming the inventory field the fact comes from, so the next reader can check it without re-deriving it. Cross-sell offers the other four and never itself.
  **Decisions taken without waking the owner:** (a) **breakfast is NOT listed under "your stay includes"** — the brief asked for it, but `verified-facts.json` states exactly three included **services** and "Breakfast on the Beach" exists as a bookable *experience*; listing it as included would invent a commercial term. Asserted as absent, so confirming it is a one-line change. (b) The villa page spends **one** dark interlude, on the generosity list — D permits one or two and the template had none, which read flat over a very long scroll.
  *Files:* `src/lib/villa-page.ts`, `src/app/en/villas/[slug]/page.tsx`, `src/app/direction-d.css`, `tests/direction-d.spec.ts`

- **T-242 — Every primary CTA on the site was 2.27:1, and had been since the elevation pass.** `.btn-primary micro` — `.micro` sets `color: var(--color-phrygana)`, and globals.css imports every partial at the top, so its own rule cascaded after `.btn-primary`'s at equal specificity and won. Phrygana on basalt, on the single most important element on every page. Invisible as a bug because the button still looked like a button. **Same cascade trap as T-217 and T-236 — third occurrence.** Specificity fixed the instance; a new guard (D9) now computes WCAG contrast for every CTA on every route and fails below AA, which is what stops the fourth.
  *Files:* `src/app/elevation.css`, `tests/direction-d.spec.ts`

- **T-243 — The D rebuild dropped the T-212 detail rows, and I caught it in the same session.** Bed split, bath split, view and distance vanished from the villa template when I rewrote it. They are now `detailRows()` in `src/lib/villa-page.ts` — their own exported function rather than four lines inside a component a rewrite can lose — and Pueblo, which confirms none of them, renders no list at all rather than a column of dashes.
  *Files:* `src/lib/villa-page.ts`, `src/app/en/villas/[slug]/page.tsx`

- **T-244 — The accent register was unused on villa pages.** D's type table assigns `body-l` to Cormorant Italic for leads and pull-quotes; the villa lede was rendering in Inter. It is the accent now — one lyrical sentence per beat, which is the voice rule — and the test measures the computed font family rather than a class name.
  *Files:* `src/app/direction-d.css`, `tests/villa.spec.ts`

- **T-245 — OWNER-CONFIRMED, CLOSED: breakfast is not included.** It carries an extra charge. The overnight default (omit it, assert its absence) was correct and is now permanent: "Your stay includes" is **closed at four rows — the three registry *services* plus the private beach**, which is a property feature confirmed by every villa's `specs.distanceToBeach` rather than by the services array — and does not grow without another ruling. **Standing copy rule:** wherever breakfast appears — the amenity card, an experience blurb, anywhere — it is phrased as *available on request, extra charge*. Never "included", never "complimentary", and never a bare mention beside the inclusions where a reader would infer it. "Breakfast on the Beach" remains a bookable experience, which is how it was already built.
  *Files:* `src/lib/villa-page.ts`, `tests/direction-d.spec.ts`

- **T-246 — The Estate page rebuilt on Direction D.** Villa-template logic at estate scale: hero → the numbers as this page's single dark interlude → the four houses → the hotspot map at full depth → outdoors → inclusions → the rooms → enquiry close. Locked figures 9 / 6 / 18 in beds / 4 pools / 240 m² carry the beat at `display-xl`, with the m²→sq ft pairing as a sub-line. Enquiry-only throughout, three touchpoints, and the page never frames the absence of a dates-only link as something missing. Spine 01–07, gapless. The bespoke `estate-figures` block is gone — it is the shared `Ledger` now, so the estate and the villas print figures through one component.
  *Files:* `src/app/en/the-estate/page.tsx`, `src/app/direction-d.css`

- **T-247 — The contrast guard earned its keep within an hour of being written.** Pointed at `/en/the-estate` it failed immediately: the enquiry CTA was **1.43:1** — preveli on limestone. Cause: `.on-dark .micro` is also (0,2,0) and also cascades after `.btn-primary--light`, so the light button inside the dark numbers section took the dark-ground text colour and put it on a light-ground button. **Third distinct instance of one family:** a colour set on `.micro` beats any single-class component rule, and globals' import order guarantees it wins. Fixed with explicit `.on-dark .btn-primary…micro` pairs; the guard is what will find the fourth.
  *Files:* `src/app/elevation.css`, `tests/direction-d.spec.ts`

- **T-248 — CONSISTENCY: "exactly three" and "the four inclusions" were both true, about different things.** The registry's `includedServices` array holds **three services**; the rendered list holds **four rows**, because the private beach is a property feature confirmed by every villa's `specs.distanceToBeach` ("50 m from a private beach") rather than by the services array. Two report lines stated the two counts without saying they measured different things.
  Fixed structurally rather than editorially: `stayIncludes()` now **derives** the list from `getVerifiedFacts().includedServices` and appends the beach, so adding a service to the registry adds a row and nothing else is touched. The test reads the registry, asserts the service count is 3, asserts the rendered count is `services.length + 1`, and asserts each registry string appears — so the two numbers can never drift apart again, and neither can be typed by hand.
  *Files:* `src/lib/content.ts`, `src/lib/villa-page.ts`, `src/app/en/the-estate/page.tsx`, `src/app/en/villas/[slug]/page.tsx`, `tests/direction-d.spec.ts`

- **T-249 — A Stop hook, because intent is not a mechanism.** Twice a turn ended on "continuing with Task N" and the run idled. `.claude/hooks/queue-guard.mjs` now blocks a stop while `SESSION-REPORT.md` lacks `QUEUE COMPLETE` **and** HEAD has moved since the last check; it allows the stop on `stop_hook_active` (the documented loop guard), on an `ALLOW-STOP` file, on completion, or when HEAD has not moved — a stalled run should surface, not spin.
  **It tested green while doing nothing.** The first version resolved the workspace with `new URL(...).pathname`, which is percent-encoded — and this path has spaces and Greek characters — so it never found the report and allowed every stop. Same family as every other instrument failure here: it reported success because it never reached its subject. `fileURLToPath` fixed it, and all five cases were then re-tested by piping sample JSON.
  *Files:* `.claude/hooks/queue-guard.mjs`, `.claude/settings.json`

- **T-250 — Content pages on D: experiences hub + 21 details, weddings, location, careers, contact, terms.** One `PageShell` so the skip-link target and the footer facts have a single definition. The register is the homepage's own component, so the two can never disagree about what is offered. Fourteen experiences have almost no legacy copy; the two-tier policy renders what exists and marks the thin ones as draft where they are read rather than padding them.
  **Terms — a judgement worth recording.** The inherited boilerplate names another company, **"Ink Hotel", seven times** (the brief said five; seven is what the file contains — measured, not assumed). This is legal text: silently substituting the client's name would be me editing a contract, and shipping the wrong company name is not acceptable either. So the page renders the correction *visibly marked*, with a notice naming the count and stating that the document awaits the owner's legal review. Both readings are on the page; neither is hidden.
  **Careers** carries a U+FFFD replacement character from the legacy bytes. Not silently repaired — flagged, like the two documented Terms encoding faults.
  *Files:* `src/app/en/{experiences,weddings,location,careers,contact,terms}/`, `src/components/sections/PageShell.tsx`, `src/components/ui/EnquiryForm.tsx`, `src/app/direction-d.css`, `src/components/ui/SiteNav.tsx`

- **T-251 — `npm run verify` split in two.** The combined Playwright run now exceeds a single process budget and was being killed mid-suite — 197 tests, of which 30 are full-page screenshots across six breakpoints. `qa:fast` (167) and `qa:screens` (30) run separately and both pass. No assertion weakened; the harness limit was real and the split is honest about it.
  *Files:* `package.json`

- **T-252 — Route transitions: the pelagos wipe, and an honest substitution.** The View Transitions API was the intended mechanism and was tried first. It needs the router to signal when the new DOM commits, which in the App Router is `experimental.viewTransition` — **and this Next version rejects that key as invalid** (measured: `next build` warns "invalid experimental key"; no such option exists in its config schema). Without it, wrapping `router.push` in `startViewTransition` snapshots before the new page exists and animates a page against itself.
  So the wipe is a controlled overlay: one pelagos sheet up over the outgoing page, navigation underneath, withdrawal when the new pathname commits. Not the native mechanism, and the code says so rather than implying otherwise. The `::view-transition-*` rules are kept inert, ready for the day the flag lands. It removes the inter-route white flash for free, which the native path would not have.
  The sheet is an imperative DOM node, not React state — a transient visual should not cost a render on every navigation, and the cleanup makes a stuck overlay impossible after a fast double-navigation.
  **The part that actually matters is the focus hand-off:** a client-side route change does not move focus, stranding a keyboard or screen-reader user on the previous page's last focused element. Focus now moves to the new `#main` on every navigation, **including under reduced motion**, because that is an accessibility behaviour and not a decorative one. Three tests: focus lands on `#main`, the sheet always cleans itself up, and reduced motion navigates with no sheet but keeps the hand-off.
  *Files:* `src/components/motion/RouteTransition.tsx`, `src/app/layout.tsx`, `src/app/direction-d.css`, `next.config.ts`, `tests/direction-d.spec.ts`

- **T-253 — The cascade family is dead at the cause, and the cure was falsified before it was believed.** T-217, T-242 and T-247 were one bug: `globals.css` imported every component partial at the top and defined the typographic register below them, so `.micro { color }` beat `.btn-primary { color }` at equal specificity by source order alone. Three instances patched, mechanism untouched, a fourth guaranteed.
  Cure: `@layer tokens, base, register, components, utilities`, declared once, with each partial imported into its layer and the register extracted to `register.css`. Later layers win regardless of specificity or import order, so nobody has to remember the order again.
  **Then the falsification:** all three specificity patches were deleted — zero remaining — and the contrast guard re-run across eight routes. Green. The layer order carries it alone, so the patches stayed deleted and the comment where they used to live says why. "The tests are green after my change" and "my change is what makes them green" are different claims, and only the second is evidence.
  **The fix immediately exposed a blind spot in the guard that was meant to catch it:** with `.nav-book` finally taking its component colour, D9 failed at 1.00:1 — it resolved background by walking DOM ancestors, which is meaningless for a `position: fixed` bar over a photograph. Fixed, absolute and gradient grounds are now *unresolvable* rather than failures, and belong to the scrim rule instead.
  Codified as `CONVENTIONS.md` §16, with the second rule attached: **a fix I cannot falsify is not a fix.**
  *Files:* `src/app/globals.css`, `src/app/register.css`, `src/app/elevation.css`, `CONVENTIONS.md`, `tests/direction-d.spec.ts`

- **T-254 — The screenshot suite was killing the runner, and the fix was architectural.** The suite kept dying mid-run with an aborted worker and no failure message — which reads exactly like a flaky test and was nothing of the kind. Measured: the homepage is **22,165px tall at 1920**, so a `fullPage` capture is a 42-megapixel bitmap (~170 MB raw), and the estate page loads **144 photographs**. Thirty of those in one worker exhausts memory.
  Two wrong turns before the right one, both worth recording. Tiling instead of full-page got further but still died. Limiting widths with `test.skip()` inside the describe body **skipped all thirty and reported "30 skipped" as a pass** — the skip form applies to the whole file once, evaluated against whichever loop value it happened to see last.
  The real problem was structural: **evidence generation is not a correctness gate.** A screenshot proves nothing about behaviour; it exists so a person can look at it. Keeping it in the suite meant a memory ceiling could fail a build with nothing wrong in it. Screenshots left the suite for `scripts/capture.mjs`, which launches a **fresh browser per route** so memory is released between them. `npm run qa` is one process again, exit 0.
  *Files:* `tests/qa.spec.ts`, `scripts/capture.mjs`, `package.json`

- **T-255 — Walkthrough VIDEO, so the owner can review motion.** The standing gap: every review so far has been stills, and the animation has never been seen. `npm run capture` records a scripted slow scroll — reading pace, not test pace, so the scroll-driven reveals actually fire — at 1440 and 390 into `qa/video/`, alongside tiled stills in `qa/walkthrough/`.
  **Partial at this commit:** 12 of 24 combinations, 62 stills and 12 clips. The run exceeded its process budget partway through; re-running completes it. Also worth flagging: this evidence is ~65 MB and regenerates on every run, in a repository already carrying 390 MB of photography. Worth pruning after review rather than accumulating.
  *Files:* `scripts/capture.mjs`, `qa/walkthrough/`, `qa/video/`

- **T-256 — Hero sub-line shipped as the working default, flagged not asserted.** "Five seafront villas, one private beach fifty metres from the door, on the north coast of Crete." It names the offer in the first second — seafront, private, Crete — instead of opening on brand abstraction. **The owner has not signed this line off;** it is recorded here and in the report as awaiting confirmation, and the code comment says so at the point of use.
  *Files:* `src/app/page.tsx`

- **T-257 — The fact guard was reading four routes of an eleven-route site.** Direction D added six pages and a set of new copy classes, and none of them were in the guard's selector list or route list — so it scanned `/`, the estate and two villas, found nothing wrong, and reported the site clean. Green because it never reached its subject: the same failure this project has now hit with `networkidle`, the credential scanner, the Stop hook and the contrast guard.
  Extended to **twelve routes** and ten Direction D selectors, then **verified by counting the strings it actually reads per route** — 117 on the homepage, 9 to 39 on the new pages — rather than by trusting the pass. No fabrications found in the new copy.
  Voice rules recorded as `CONVENTIONS.md` §17, including the standing obligation: adding a page means adding its route, adding a copy class means adding its selector.
  *Files:* `tests/facts.spec.ts`, `CONVENTIONS.md`

- **T-258 — The 301 map is wired, DERIVED from `content/url-map.md`.** `scripts/build-redirects.mjs` parses the map at build time into `src/generated/redirects.json`, which `next.config.ts` reads. Hand-copying it would have created a second source that drifts from the document the owner edits — the same resolution as the inclusions count (T-248). 51 redirects installed, **13 skipped and every one reported**, because a legacy URL silently dropped is a lost ranking:
  · `/` would loop (this build serves English at the root)
  · four template rows (`/en/property/<id>/…`) — Next rejects the entire config if one placeholder gets through
  · **eight fragment sources** (`/en/index-1.htm#category571`) — a fragment is never sent to the server, so no server redirect can honour them; they belong in the launch runbook as client-side handling
  Also: `sitemap.ts` derived from the inventory, and `robots.ts` disallowing everything with the launch-day ordering written in.
  *Files:* `scripts/build-redirects.mjs`, `next.config.ts`, `src/app/{sitemap,robots}.ts`, `package.json`

- **T-259 — The redirect harness (Task 23, pulled forward) found real damage immediately.** Every installed redirect is driven through the built app and its status and target asserted. It caught three classes of defect on first run:
  · **the map's proposed targets no longer match the built routes** — written in Phase 0 before the slugs settled. Fifteen dead targets: five per-villa gallery routes that do not exist, four amenity pages, and four experience slugs that drifted (`private-chef` → `chef-in-villa`, `organic-farm` → `biological-garden`, `private-boat-trip` → `boat-trip`, `water-sports` → no equivalent)
  · **a redirect LOOP** — `/en/thalasses-rituals` is both a source and a target in the map, so it points at itself. Worse than a 404: a 404 loses one page, a loop hangs the request
  · trailing-slash normalisation happening *before* the redirect table, so `/en/` never matched its rule
  Rather than assert an empty list (shipping red) or delete the check (losing the information), the fifteen are tracked in `content/redirect-gaps.json` with a reason and a closing move each, and the test asserts the dead set is **exactly** that set — an existing gap cannot be forgotten and a new one cannot appear unnoticed.
  *Files:* `tests/redirects.spec.ts`, `content/redirect-gaps.json`

- **T-260 — The suite runs in three shards, and that is a real limit not a workaround.** It kept dying around test 118 with an aborted worker and no failure message. Cause measured, not guessed: every route is a page over 20,000px tall carrying up to 144 photographs, and ~120 in one worker exhausts the machine. Two genuine reductions first — the curation tests stopped scroll-walking 20,000px to populate `currentSrc` when `next/image` puts every `src` in the server markup anyway (cheaper *and* stricter, since it catches a blocked hash that is never scrolled into view) — then three sequential shards. **232 passing, exit 0.** No assertion weakened.
  *Files:* `package.json`, `playwright.config.ts`, `tests/parity.spec.ts`, `tests/direction-d.spec.ts`

- **T-261 — The Stop hook had a hole big enough to end the run through, and it was the "correct" branch.** It exited 0 whenever `stop_hook_active` was set, which looked like respecting the documented loop guard. But that flag stays true for **every** stop attempt after the first block — so one block disarmed the hook for the rest of the session and every later stop sailed past. The run ended with credits remaining and the queue incomplete: the exact failure the file exists to prevent, caused by the file.
  `stop_hook_active` no longer allows on its own. **The progress check is the honest loop guard**, because it separates the two cases the flag conflates: "you already blocked me" (says nothing) from "you blocked me and I have shipped nothing since" (means stuck). Two adjacent holes closed with it — an unreadable stdin and a malformed payload were both treated as allow, when neither is a reason to permit a stop; they only mean the hook learns nothing from the payload while every other check still applies.
  Six branches re-verified by piping sample JSON. This is the **second** time this hook has been green while doing nothing: the first was a percent-encoded path that never found the report.
  *Files:* `.claude/hooks/queue-guard.mjs`

- **T-262 — Core Web Vitals measured, and every budget passes.** `scripts/perf.mjs`, mobile 390x844 with 4x CPU throttle and Slow-4G over CDP, reading the same `PerformanceObserver` entries Lighthouse reads — LCP from `largest-contentful-paint`, CLS from `layout-shift`, long-task total as the TBT-style proxy. Lighthouse itself is not installed and there is no network to fetch it, so the method is stated rather than implied.
  Homepage **LCP 1052ms / CLS 0.001 / long-task 183ms / 426 KB**; villa page (104 photographs) 996ms / 0.023 / 137ms; estate 1020ms / 0 / 91ms; experiences 952ms / 0 / 93ms. Budgets are 2500ms, 0.1 and 200ms. **No route is over on any metric**, so there is nothing to harden — the honest outcome of Task 12 is "measured, within budget, changed nothing", not a round of optimisation theatre.
  Stated plainly because it matters: these are **lab numbers on localhost with synthetic throttling**. Only field data at the 75th percentile decides, and that cannot exist until the domain moves.
  *Files:* `scripts/perf.mjs`, `package.json`

- **T-263 — Error and edge states on D, and a real soft-404 found in the process.** A 404 that keeps the register — sea horizon, one clause, and two ways onward (home, and a person) — plus a global error boundary in the same voice and a loading state that is the limestone ground held rather than a spinner or a white flash. Neither page is cute about it: "Oops!" is a brand deciding its own mistake is charming.
  **The find:** `/en/villas/anything-invalid` was returning **200**, not 404. `notFound()` was reached, the not-found boundary rendered, and the status stayed 200 — a soft 404, which tells a crawler the page is real. After a domain move that is exactly how dead URLs stay in the index and a migration leaks authority. The slug sets are fully enumerable from the inventory, so `dynamicParams = false` now refuses them at the routing layer. Verified by status code, not by looking at the page: villas 404, experiences 404, nonsense route 404, real villa 200.
  The error boundary deliberately does not use `PageShell` — that reads content off the filesystem on the server, and this must render when the server work is what failed.
  *Files:* `src/app/{not-found,error,loading}.tsx`, `src/app/en/villas/[slug]/page.tsx`, `src/app/en/experiences/[slug]/page.tsx`, `src/app/direction-d.css`, `tests/direction-d.spec.ts`

- **T-264 — Enquiry form completed, and its accessibility bug was silent.** Accessible validation (real labels, `aria-invalid`, `aria-describedby`, an error summary with `role="alert"`), a honeypot that is visually hidden and out of the tab order but never `display: none` (a bot reads the DOM; a hidden-but-focusable field traps keyboard users), subject preselect, and a success state that admits it did not send.
  **The bug:** the error summary never received focus. The first version called `.focus()` inside the submit handler immediately after `setErrors` — React had not rendered the summary yet, so the element did not exist and the call silently did nothing. A screen-reader user submitting an empty form got an alert with **no landing point**, which is the entire reason a summary exists. Moved to an effect that runs after render. **Caught only because the test asserted focus rather than asserting the summary was visible** — it was visible the whole time.
  Subject resolution accepts **both** params already in the wild — `villaCta` emits `?villa=<slug>`, `estateCta` emits `?enquiry=estate` — and turns the slug into the villa's real name, so the note says "Villa Eeanthe" rather than "villa-eeanthe". Accepting both beat rewriting every call site and risking a missed one.
  `DEPLOY.md` now names the single future env var, `RESEND_API_KEY`, with the warning that matters: **never `NEXT_PUBLIC_`-prefixed**, which would ship the key to every browser.
  *Files:* `src/components/ui/EnquiryForm.tsx`, `src/app/en/contact/page.tsx`, `src/app/en/experiences/[slug]/page.tsx`, `DEPLOY.md`, `tests/direction-d.spec.ts`

- **T-265 — Accessibility deep pass: axe-core on eleven routes, plus the checks axe cannot make.** axe finds roughly a third of real accessibility problems, so focus order, the skip link's destination, the amenity accordion, the hotspot map, focus visibility **on the deep ground**, and one-h1-per-page are asserted separately rather than inferred from a green axe run. axe-core is injected from `node_modules` because the build is hermetic.
  **Three real colour-contrast failures found, all the same idea — hierarchy expressed as opacity:**
  · the litany dimmed inactive lines to `opacity: 0.34`, putting body text at roughly **1.35:1**. Reaching AA with opacity alone needs ~0.9, at which point there is no dimming left — so the recede is colour now, phrygana (5.63:1) stepping to basalt. The device survives; both values pass
  · the act tabs used `opacity: 0.6`, same fix. The active state never depended on colour alone — it keeps its underline and `aria-current`
  · **the active filter chip's label was 2.27:1 — and `@layer` could not reach it.** The layer fix makes component rules outrank register rules when they are on the *same* element; here `.chip.is-active` colours the button and a `.micro` span *inside* it sets its own ink. Inheritance is the fix: a label inside a coloured control has no business choosing its own colour. **A fourth variant of the family, and the first the structural cure does not cover** — worth knowing that `@layer` bounds the problem rather than eliminating every form of it.
  **One finding deliberately not fixed**, recorded in `content/a11y-exceptions.json` with its reason: the ghost numeral at 5% ink, aria-hidden, whose number is printed legibly beside it in every case. WCAG 1.4.3 exempts pure decoration, and raising it would create a second competing headline. The test asserts violations are **exactly** the accepted set, so nothing can be silenced by disabling a rule — colour-contrast in particular stays on.
  *Files:* `tests/a11y.spec.ts`, `content/a11y-exceptions.json`, `src/app/patterns.css`, `src/app/direction-d.css`

- **T-266 — The Gallery, with a lightbox that does not strand anyone.** A-grade selects lead — the eighteen frames graded twice and ruled on by the owner — then house-by-house clusters. Captions come from the inventory only; of 906 image slots just 225 carry text, so most frames appear uncaptioned rather than captioned with something invented. Low-image discipline is inherited from `TheRun`: a cluster of one or two frames becomes a large plate, never a grid with holes, because the layout is a function of the count.
  The lightbox is focus-trapped by construction, which is the failure this genre is known for: an overlay that leaves focus behind it lets a screen-reader user tab "past" the image into a page they cannot see, with no way back. Escape closes and restores, arrows move, the page beneath is `aria-hidden` and cannot scroll, and every thumbnail is a real `<button>` so it opens by keyboard and by tap.
  *Files:* `src/app/en/gallery/page.tsx`, `src/components/sections/{GalleryGrid,Lightbox}.tsx`, `src/app/direction-d.css`

- **T-267 — Adding a sixth nav entry broke the bar at 1024, and only the fixed-layer guard saw it.** The Gallery took the register from five entries to six and pushed it past the viewport at 1024 — while the document-level overflow check stayed green, because a `position: fixed` element contributes nothing to `documentElement.scrollWidth`. That is precisely why T-213 exists, and it caught this on the first run. The register collapses to the Menu toggle at 1199 now, and the guard runs at nine widths including 1200 and 1920.
  Also: `tests/nav.spec.ts` hard-coded the register count at five, so a legitimate change failed four unrelated tests. The count is **derived from `SiteNav.tsx`** now — the ratified derive-don't-type rule applies to tests as much as to content.
  *Files:* `src/app/patterns.css`, `tests/nav.spec.ts`

- **T-268 — Handoff documentation for people who are not me.** `CONTENT-GUIDE.md` teaches the owner's team to edit `content/` safely: the common jobs (change a fact, add an experience, add photographs after the shoot, correct a distance), and — more usefully — **what each guard rejects and why**, in plain language. A build that fails with "unverifiable display copy" is useless to someone who does not know that three invented facts once reached a live page.
  `LAUNCH.md` is the domain-move runbook, ordered so that indexing comes **last**: close the redirect gaps (the harness is the gate), decide the eight fragment redirects, point DNS, verify 301s against the live domain, check the licence, then allow indexing. Plus the Loggia sunset, the Maps key rotation, the enquiry-form wiring with the `NEXT_PUBLIC_` warning, analytics as an owner decision, and a rollback that is "point DNS back" rather than "push a fix under traffic".
  Both are runbooks. **Launch stays owner-triggered** — neither document does anything by itself.
  *Files:* `CONTENT-GUIDE.md`, `LAUNCH.md`

- **T-269 — The soft-404 was a CLASS, and fixing two routes was fixing instances.** `tests/soft404.spec.ts` guards it structurally, in two layers. **Source:** every dynamic segment under `src/app` is *discovered from the filesystem* and must export `dynamicParams = false`, or opt out with a comment containing `SOFT-404-OPT-OUT:` and a reason — so a `[slug]` route added next month fails on the day it is written, before anyone thinks to test its 404 behaviour. **Behaviour:** each discovered family is driven with a nonsense slug and must answer 404, asserted on the **status**, because the original bug was invisible in the rendered output.
  Families are read from disk rather than listed, so the guard cannot fall behind the app — and there is an explicit assertion that discovery found something, because a discovery bug would make every other assertion vacuously pass. That failure mode has bitten this project twice already (the Stop hook's percent-encoded path; `test.skip()` reporting "30 skipped" as green).
  **Falsified before being trusted:** removing `dynamicParams` from the villa route turns the suite red, and restoring it turns it green. The guard is load-bearing (§16).
  *Files:* `tests/soft404.spec.ts`

- **T-270 — T-189 EXECUTED. The Greek display face: Noto Serif Display, runner-up GFS Didot.** Open since Phase 1, decided on evidence. All four candidates fetched, **every subset verified from the served woff2** rather than from documentation, and rendered with the strings `/el` would really set at the exact D tokens — 96px / 64px / 44px / 14px at +0.14em.
  The specimen **asserts each face resolved** (`document.fonts.check`), because a comparison where all four silently fell back to Georgia would look like a comparison and be a photograph of one font. All four returned true.
  **Verdict:** Noto Serif Display is the only candidate that holds its strokes at `headline-m` while still reading as display type at `display-xl` — the same criterion that kept Marcellus over Cormorant in the original Latin A/B, applied so the two languages feel like one brand. **GFS Didot is the runner-up and its argument is not weak:** Greek Font Society, drawn for Greek, and for a Cretan property that is substantive rather than sentimental. It is the most beautiful of the four at 96px and the weakest everywhere below the hero. If the owner weighs provenance above that, it is defensible — stated so he can choose knowing the trade.
  Nothing ships to the UI. `/en` is untouched. Two open questions recorded: the owner's native eye, and whether Latin inside a Greek page stays Marcellus.
  *Files:* `qa/greek-face/VERDICT.md`, `qa/greek-face/*.png`, `scripts/greek-specimen.mjs`

- **T-271 — Twenty-nine OpenGraph cards, built from the real photography and the real type.** A share card is the only page of this site most people will ever see, and until now every route resolved to one generic estate card — five different houses, twenty-one different experiences and a wedding venue, all behind the same photograph. `src/lib/og.tsx` is one renderer; each route file is four lines and cannot quietly diverge.
  Three things are enforced centrally because no route should be able to get them wrong. **The frame resolves through `localImage`**, exactly as `Field` does — a raw Loggia address here would render an empty card *and* bypass the ruled-off list, which is T-185 and T-235 for the third time. **The veil is unconditional and bounded**, on `Field`'s doctrine: heavy enough that the worst photograph physically possible still clears AA, so no per-image analysis and no surprise when a brighter frame is swapped in. **The display holds at the 96px ceiling** — a card is not a viewport and nothing forces this, but the ceiling is the language, and a card set larger than the site would be the one place the brand shouts. Long titles step down rather than wrap to three lines.
  Facts come off `villa.specs`, the same locked capacity table the page prints and JSON-LD asserts against — one source, so a card can never claim a different bedroom count from the page it links to. The **words** are not `specStrip`'s: its labels are table headings sitting above their values, which is right in a grid and wrong set inline. The first draft read "1 BATHROOMS · 4 SLEEPS". An inline strip is a sentence and has to agree like one.
  The sub-line is **not** `shortDescription` — the registry gives four of the five villas the same 580-character paragraph, so a card built from it would make four houses read as one listing. It uses the villa's own `tail`, already the second half of the h1 on the page the card opens.
  Experiences get **no sub-line at all**. Fourteen of the twenty-one have almost no copy, and a card printing half a sentence looks broken in a message thread. The two-tier policy that governs the pages governs the cards: build from what exists, never pad to look full. Two experience cards fall back to the plain basalt ground because their hero frames are ruled off — correct behaviour, and visible in the report rather than hidden.
  satori cannot read woff2 ("Unsupported OpenType signature wOF2"), so Marcellus and Marcellus SC are vendored as TTF under `src/app/og/`. Build-time only; never served.
  *Files:* `src/lib/og.tsx`, `src/app/opengraph-image.tsx`, `src/app/en/{villas/[slug],experiences/[slug],the-estate,weddings}/opengraph-image.tsx`, `src/app/og/*.ttf`

- **T-272 — The card guard was wrong before the card was, and it failed loudly for the right reason.** `tests/og-card.spec.ts` decodes every rendered PNG and computes the real contrast under the copy, because a claim about pixels can only be checked by looking at pixels (§16).
  Its first version classified anything above luminance 0.35 as type and measured the rest as ground. Every one of the twenty-nine cards failed at ~2.2:1 — and the cards were fine. **A thin light stroke never reaches its full colour:** the 21px letterspaced eyebrow is seafoam at 0.57, but at that size no pixel in it clears 0.35, so nothing was masked and the test read the eyebrow's own antialiasing as ground. The instrument was broken, not the subject. Same family as the Stop hook's percent-encoded path and `test.skip()` reporting "30 skipped" as green.
  The rewrite takes **two** measurements. The **gutter** is the honest one: type is laid out inside 68px of padding, so the outer strip is glyph-free *by construction* rather than by any assumption about the answer — whatever is found there is the veiled photograph and nothing else. The **band** covers where the type actually sits, which requires a classifier, and any classifier assumes part of its own answer — so it is capped: if the veil ever broke, most of the band would classify as "type" and be masked away, and the max would come back reassuringly dark. Real cards mask 8–20%; the ceiling is 45%.
  **Falsified.** Dropping the veil to 0.10 turns twenty-seven cards red — and it is the masked-fraction ceiling that catches it, exactly the guard added to stop the classifier hiding a broken veil. Without it the falsification would have *passed*. The two plain-basalt cards correctly stay green: they have no photograph to show through. Measured worst case at HEAD: **6.71:1**, against an AA floor of 4.5.
  *Files:* `tests/og-card.spec.ts`

- **T-273 — HEAD was not lint-clean, and the report said it was.** Two React correctness errors sat in files this task never touched, so they arrived with an earlier commit and the "lint clean at HEAD" line in `SESSION-REPORT.md` had gone stale without anyone noticing. Found by running the gate rather than trusting the record — the same §14 discipline, applied to my own reporting.
  **`GalleryGrid`** accumulated cluster offsets with a `let` counter mutated inside `.map()` during render. It worked, and would have kept working right up until React rendered the component twice without remounting it — which Strict Mode does, and `reactStrictMode` is on. The second pass would resume from whatever the first left behind and every lightbox would open on the wrong photograph. Replaced with a pure derivation.
  **`Lightbox`** synced its frame index to the `openAt` prop inside an effect, so opening the overlay rendered the *previously viewed* photograph once before correcting itself — a visible flash on every open, plus a cascading second render. Replaced with React's documented prop-change adjustment during render, which discards the in-progress output before anything reaches the screen.
  *Files:* `src/components/sections/GalleryGrid.tsx`, `src/components/sections/Lightbox.tsx`

- **T-274 — THE HERO'S OWN WORD WAS INVISIBLE, AND THE FIX FOR T-242 IS WHY.** `.d-hero-copy .clause-tail { color: limestone }` in `direction-d.css` was **dead**. "UNLIMITED" — the second half of the site's signature line, on the first screen anyone sees — was rendering in dark olive phrygana on a dark scrimmed photograph at roughly 1.6:1.
  The cause is the T-242 family a fourth time, with its polarity reversed. Putting every partial into `@layer components` left `globals.css`'s own rules — the Clause, the Field, `.on-dark`, the canon grid — sitting **outside every layer**, and unlayered declarations outrank all layers regardless of specificity. The cure for three contrast failures quietly created a fourth. Six classes were exposed; the hero tail is the one that had already gone wrong.
  **Why nothing caught it:** axe declines to compute contrast over a background image and reports "incomplete" rather than a violation, so the one guard that should have seen it was structurally unable to.
  Fixed at the cause with a `primitives` layer between `register` and `components`, so this file's rules keep their old position relative to the register and lose to the partials written to override them. **Nothing in the codebase is unlayered any more**, which is what makes the rule small enough to keep: the cascade is decided by one line at the top of `globals.css` and by nothing else.
  **Guarded and falsified.** `tests/cascade.spec.ts` asserts the invariant at the SOURCE — a rendered-page check can only catch instances on routes someone remembered to test, which is how three of the four reached HEAD. Adding a single unlayered rule turns it red; removing it turns it green.
  *Files:* `src/app/globals.css`, `tests/cascade.spec.ts`, `CONVENTIONS.md` §16

- **T-275 — The taste audit, and the four times its own instruments were wrong before the page was.** `scripts/taste-audit.mjs` measures the mechanical half of "more expensive, or just more?": widows, collisions, congestion, off-system spacing, `ch` measures resolving against the wrong font-size, and untracked small capitals.
  Its first run reported **174 findings and almost none were real**. It read the villa inventory's `columns: 3` flow as an 858px collision. It descended into the enquiry form's `aria-hidden` honeypot and found a label sitting on an input — which is what a visually-hidden field looks like. It counted the nav's six-entry register as six ideas in one viewport, and every `Clause` twice because its gerund and tail are an element inside an element. And it measured gaps BETWEEN boxes on a design that carries `--section-y` as padding INSIDE each beat, reporting "0px of air" ninety-six times on pages with three hundred pixels of it.
  Each was corrected by fixing what the detector measured, never by raising a threshold until the number fell. The off-system check that replaced it is the useful one: it reads the rhythm tokens from `:root` at runtime and flags air matching **no** token — the tell-tale of a number typed by hand. That reports zero across thirteen routes at both widths, which is a real statement about the spacing system.
  Then it printed twenty-six `ERR_CONNECTION_REFUSED` lines followed by "**0 findings**" — the fifth instrument in this project to report success because it never reached its subject. It now refuses to start without a server and exits non-zero naming every page it could not open.
  *Files:* `scripts/taste-audit.mjs`, `scripts/look.mjs`, `qa/taste/ACCEPTED.md`, `CONVENTIONS.md` §18

- **T-276 — Every homepage intertitle was set at 40% of its measure, because `ch` resolved against the wrong font.** `max-width: 22ch` sat on `.litany-line`, an `<li>` inheriting 17px body type, while the intertitle inside it is 44px. `ch` is one zero-width in the element's OWN font, so the browser computed **236px** for a line written to run to about 780px — inside a 590px column with 354px standing empty beside it. Every line shattered: "A beach / with no / one else's / towels on it."
  **No guard could see it.** The page did not overflow, the contrast was fine, the spacing was on-system and the type was exactly the right size. It took looking at a screenshot, and then measuring what the eye had objected to. The measure now sits on the display span, where `ch` resolves against the serif that actually sets the line, and `scripts/taste-audit.mjs` guards the class by comparing every `ch` rule against the largest type its elements contain — mixed-register blocks excluded, since a 62ch measure on a beat holding a heading over a paragraph is written for the paragraph and is correct.
  *Files:* `src/app/patterns.css`, `scripts/taste-audit.mjs`

- **T-277 — Sixty untracked Clause tails, on every page of the site.** `.clause-tail` declared no `letter-spacing`, and `letter-spacing` is inherited **as a computed pixel value, not as an em**. So every tail took whatever the display above it was set to: zero on the hero, "ALL FOUR, ONE GATE", "AT SEA LEVEL, GROUND FLOOR" — and **-1.28px** on the litany payoff, where a 12px capital label sat inside a 64px line tracked at -0.02em. That is -0.107em on capitals. The label looked condensed and slightly broken beside type that looked correct, and no rule anywhere said anything was wrong.
  This is the Clause — the site's signature typographic device — and its second half was the one part of the register never letterspaced. Sixty instances, one cause, one line: +0.14em, the letterspaced register from the Direction D type table, deliberately below `.micro`'s +0.22em because a tail is running text and 0.22em would push the longest of them past a 390px viewport. `white-space: nowrap` relaxes below 1024px for the same reason — `.clause-field` is `overflow: hidden`, so an overrunning tail would not spill, it would silently lose its last words.
  *Files:* `src/app/globals.css`

- **T-278 — Twenty-four widows, killed in the register rather than in the copy.** "One gate, the whole estate behind / it". "Holiday Advisor and / concierge". "Fifty metres, and a pool of your / own". A single-word last line in 96px type is the clearest tell that a page was typed rather than typeset.
  `text-wrap: balance` on the display registers and `pretty` on prose, applied once — not as twenty-four rewrites of copy that is correct as written. The browser evens the lines instead, so the fix survives an edit to the words, a change of viewport, and translation into Greek, none of which a hand-broken line does.
  Sixteen went immediately and eight survived, **all of them spans**: the litany's lines are `<li><span class="display c3">`, and line breaking happens on the block, not on an inline child, so `text-wrap` set on the span does nothing at all. `:has()` reaches the block that owns the lines. Four remain, and are recorded as accepted in `qa/taste/ACCEPTED.md` — two are what balance correctly produces for a nine-word line in a narrow column, and a three-word heading at 390 has no non-widow arrangement to find.
  *Files:* `src/app/register.css`, `scripts/taste-audit.mjs`

- **T-279 — A second engine, and what a smoke run is worth.** `npx playwright install webkit` succeeded — no sandbox blocker — so the claim "it works" now rests on more than one renderer. WebKit 26.5 runs `tests/smoke.spec.ts`: ten routes at 390 / 768 / 1440 asserting status, no horizontal scroll, no console errors, no failed requests, plus the display face resolving, cascade layers applying, every booking link reaching the real engine with `lang=en`, and the licence on the page. **14 of 14 green.** Every feature this design leans on — `@layer`, `:has()`, `text-wrap: balance` and `pretty`, `svh`, `content-visibility`, `color-mix()` — is supported in both engines, checked with `CSS.supports` rather than assumed from a compatibility table.
  The smoke suite runs on **both** engines deliberately. A cross-engine test that only ever runs on the engine under suspicion cannot tell you whether a red is a WebKit difference or a real defect.
  **Two of its own assertions were wrong before the page was**, both the same shape as everything else in this project. It measured `getComputedStyle(h1).fontFamily` and reported Inter — because the Clause's h1 is a flex wrapper and the display class sits on its child, so the assertion was reading the wrapper of a headline that was correctly Marcellus. Then it evaluated on `load` and found *every* display element at zero width, which reads as "no display type on this page" and really meant "the preloader has not lifted yet". Fixed by measuring what the question actually asks — the face of the largest type on the page — and by waiting on a locator rather than a sleep.
  **`npm run qa` now covers both engines in one command: 369 passing, 1 skipped.**
  *Files:* `tests/smoke.spec.ts`, `playwright.config.ts`, `package.json`

- **T-280 — The `/el` scaffold: plumbing, not invented Greek.** `content/url-map.md` §5.3 records that **the legacy site is English-only**, so there is no Greek copy anywhere in the Phase 0 inventory and `/el` cannot ship without inventing content about a real property. What ships is the machinery, arranged so publishing Greek is a one-line change in `src/lib/locale.ts` and every page in the site starts declaring it correctly on the same deploy.
  Two things are now **derived** rather than typed per route: the canonical, and the hreflang set. That second one is the point. Declaring an alternate for a locale that does not exist tells a search engine to fetch a page that will 404 — strictly worse than declaring nothing — and a hand-written alternates block gets it wrong the day someone adds `/el` to one route and forgets the other nine.
  **The commented-out hreflang block in `layout.tsx` is gone**, replaced by the live mechanism. Commented code is a plan, not a mechanism: it would have had to be uncommented in ten files on one day.
  `PUBLISHED_LOCALES` has teeth. `tests/locale.spec.ts` asserts every published locale actually serves, so flipping the flag before the pages exist turns the suite red instead of shipping a locale of 404s to a crawler. It also asserts `/el` and everything under it **ends at a 404** — following redirects, because Next normalises `/el/` to `/el` with a 308 before routing and asserting on the first hop says nothing about whether the locale exists — that no legacy path resolves under `/el` (url-map §5.3), and that the language switcher renders nothing while one locale is published, because dead UI offering a language that does not exist is a promise the site cannot keep.
  *Files:* `src/lib/locale.ts`, `tests/locale.spec.ts`, `src/app/layout.tsx`, and the eleven routes' `generateMetadata`

- **T-281 — The walkthrough and the taste audit had been looking at a 404 page, and calling it clean.** `scripts/capture.mjs` and `scripts/taste-audit.mjs` both listed `/en/experiences/private-chef`. That slug does not exist — the registry says `chef-in-villa`. So every still filed as `experience-detail`, and every taste-audit pass over that route, was photographing and auditing the **not-found boundary**.
  **`page.goto` does not throw on a 404.** It loads the not-found page and resolves happily, so nothing anywhere said a word; the audit reported the route clean because the error page genuinely has no widows. Found only because a third tool typed the same wrong slug and its assertion happened to need a canonical.
  Fixed twice over, at the cause: the experience route is **derived from the registry** in all three tools, and both scripts now **assert a 200** per route rather than trusting that a page loaded. The status is the only thing that knew.
  This is the sixth instrument in this project to report success without reaching its subject, and the first where the subject was a different page rather than nothing at all. §18.
  *Files:* `scripts/capture.mjs`, `scripts/taste-audit.mjs`, `tests/locale.spec.ts`, `qa/taste/ACCEPTED.md`

- **T-282 — CHH RE-ADMITTED: the partner's words, held at arm's length.** `creteholidayhome.com/accommodation/thalasses-villas/` is a page about this property written by the company that manages the rentals. Its **photographs** were admitted in Phase 1 — 168 of them under `public/images/_chh/` — and its **words** never were, though they have been sitting in the Phase 0 capture since the beginning.
  `scripts/extract-chh.mjs` recovers them into `content/chh-facts.json` and reconciles every figure against the owner's registry, sorting each into CORROBORATES / ADDS / CONFLICTS. **Five figures, five corroborations, zero conflicts** — the manager independently publishes 9 bedrooms, 6 bathrooms, 18 in beds, 4 pools and 240 m², which is exactly the locked capacity table. Two independent sources, no disagreement. That is the reason to read the rest of the page.
  **It is not the reason to believe it.** A third party agreeing about bedroom counts earns a hearing, not a byline. So of what it ADDS, the amenity inventory turned out to be 40-of-54 already in the owner's registry and the unmatched fourteen are listing-platform boilerplate ("hangers", "dishes and silverware"); the airport and port distances were already recovered AND owner-confirmed in `content/location.json` and are already rendered. What is genuinely new is seven specifics and two policies: a **pool alarm**, a **playground**, a **vegetable garden**, **pool heating** at an extra daily charge with a week's notice, **twin beds that convert**, **private sunbeds**, a **daily reception desk**, smoking outdoors only, and Greek/English spoken.
  Those are now on the estate page at beat 06 **behind a visible `Draft` mark naming the source**. Shown rather than hidden, because that is this project's convention for recovered-but-unconfirmed material and because the owner cannot confirm what he cannot see. Each line stops rendering if its exact source phrase leaves the capture — a fact must not outlive its evidence.
  **Two regressions of my own, both caught within a minute.** The block first reused `.d-includes-label`, which is written for the dark interlude, so seven limestone labels rendered on the limestone ground and vanished. And the provenance mark printed the full source URL — one unbreakable token that runs to 445px at +0.22em and scrolled the whole estate page sideways at 360. The overflow guard caught the second immediately; the first is what uncovered T-283.
  *Files:* `scripts/extract-chh.mjs`, `src/lib/chh.ts`, `content/chh-facts.json`, `content/CHH-RECONCILIATION.md`, `src/app/en/the-estate/page.tsx`, `src/app/direction-d.css`

- **T-283 — THE ACCESSIBILITY AUDIT HAD BEEN CHECKING THE TOP OF EACH PAGE AND CALLING IT THE PAGE.** Framer Motion serialises its `initial` state into the server HTML, so every scroll-revealed section on this site ships at `opacity: 0` and stays there until it enters the viewport. **axe skips elements it considers invisible**, and `runAxe` went straight from `page.goto` to `axe.run` without ever scrolling.
  Measured, not assumed: on the estate axe saw **569 nodes as-loaded and 636 after a scroll**, and found **1 colour-contrast violation instead of 8**. On the homepage and the villa pages the scrolled run finds nothing new — so the damage was limited, and the guard was still only ever auditing part of its subject.
  This is the seventh instrument in this project to report success without reaching its subject, and the most consequential of them: it is the guard the entire accessibility claim rests on. Found by accident, because a regression I had introduced two minutes earlier made seven labels invisible and axe passed anyway.
  Fixed by revealing the page before auditing, and **guarded on the guard**: the suite now asserts that no text-carrying element outside an `aria-hidden` subtree is still at `opacity: 0` afterwards, so a future change that makes the reveal a no-op turns red instead of quietly shrinking the audit. The exemptions are precise — the litany's four cross-fading frames and the inactive acts panel are faded on purpose, carry no readable text, and are `aria-hidden`.
  **Falsified:** disabling the reveal leaves eight to nine text elements invisible to axe on every route, and the suite goes red.
  *Files:* `tests/a11y.spec.ts`, `CONVENTIONS.md` §18

- **T-284 — The wedding venue had figures and an inventory and printed neither.** `rituals.json` has carried three bedrooms, three bathrooms, twelve in beds, 97 m², a pool and **43 features the legacy site displayed** since Phase 0. The weddings page showed a hero, a one-line description, a photograph run and an enquiry CTA — and none of it. Exactly the T-212 class: a registry fact that reaches no page, invisible because nothing on screen looks wrong.
  Both are read through the **same functions the villa template uses** — `specStrip()` and `buildInventory()` — so the venue and the houses can never disagree about how a figure is derived or how an item is filtered. Unresolved ids and empty groups are omitted rather than dashed, as everywhere else.
  Rendered and counted: 3 / 3 / 12 / 1 pool / 97 m² with 1,044 sq ft as the sub-note, and **43 items in three groups** — Living, Playing, Guarding — matching the 43 the legacy site displayed exactly. The spine runs 01–06 gapless (T-221).
  *Files:* `src/app/en/weddings/page.tsx`

- **T-285 — 83 recovered facts had never reached a page, and nothing could tell.** `scripts/registry-coverage.mjs` asks the question this project had fixed four times without ever asking: **of every fact in the registry, which ones appear in the rendered text of the page that owns it?** The answer was **108 of 191**.
  T-212, T-243, T-223 and T-284 were all instances of it. Every one was invisible for the same reason: *nothing on screen looks wrong when a fact is simply absent*. A fact recovered in Phase 0, stored in the registry and never rendered has been lost as surely as if it had been deleted — it just leaves no trace when it goes, which is the whole risk this rebuild was set up to avoid.
  **Now on the pages, from the owner's own registry:** the pool alarm; that pool heating needs a week's notice; that the twin beds convert to doubles; six services (cook, babysitting, pool maintenance, pool towels, diving, daily excursions); each house's actual contents on the estate page — which bathroom has the Jacuzzi and which the shower cabin; and **a price. 35€ per day for pool heating, the only price anywhere in this inventory.**
  **Deduplication was the whole difficulty.** The capture recorded the same policy two or three times per villa in slightly different words, and one variant carries the figure while the other says "an additional charge". Printing both reads as a mistake and choosing per villa is a judgement nobody can audit — so it is a rule: lines that match once numbers, currency and generic words are stripped are one line, and **the survivor is the one carrying a figure**. Villas whose own registry has no figure print what theirs says. No villa borrows another's number (T-212 discipline).
  **Services are deliberately NOT "your stay includes"**, which stays at three permanently (T-245). A cook and a babysitter are arranged and charged; one list would imply they are free — the exact error breakfast nearly made.
  **145 of 191 now.** The rest is legacy prose the D copy pass deliberately replaced, plus Pueblo, whose registry is thin and stays thin until T-212 is answered.
  *Files:* `scripts/registry-coverage.mjs`, `src/lib/villa-page.ts`, `src/app/en/villas/[slug]/page.tsx`, `src/app/en/the-estate/page.tsx`, `src/types/content.ts`, `src/app/direction-d.css`

- **T-286 — Three facts I had attributed to the partner were the owner's own.** An hour after shipping T-282, the coverage report showed the pool alarm, the pool heating terms and the convertible twin beds sitting in `content/villas/*.json` under `policies` and `amenityFacts` — where they have been since Phase 0. They had been on the estate page for an hour marked *"recovered from the manager's own listing"*.
  They were never CHH facts. They were owner facts nobody had rendered, and the owner's registry states **more** than the partner's page does — 35€ a day, which CHH never mentions. Removed from `src/lib/chh.ts`; they now print as fact on the villa pages, unmarked, because that is what they are.
  Mis-attributing an owner's fact to a third party is a smaller error than inventing one and it is the same kind: **a claim about provenance made without checking.** What is left in the partner list is genuinely CHH-only — a playground, a vegetable garden, private sunbeds, a daily reception desk.
  *Files:* `src/lib/chh.ts`, `src/app/en/the-estate/page.tsx`

- **T-287 — A typed beat number is a claim about every other beat.** Adding one conditional section broke Villa Pueblo's spine to `01, 02, 03, 04, 06, 07` — Pueblo has no policies and no services in its registry, so "Good to know" did not render and left a hole. The gapless-spine guard (T-221) caught it on the first run, which is exactly what it exists for.
  Both templates now **derive** their numbering from the sections that will actually render, so a conditional beat cannot renumber the page wrongly. `Inventory`'s `beat` prop is derived too. Verified across all three shapes: Persi 01–07, Pueblo 01–06, the estate 01–09, all gapless.
  Also merged: "Good to know" and "Arranged on request" are one beat with two lists rather than two beats. They are one idea — the terms of a stay — and as two short sections they pushed the taste audit's congestion count from 3 to 9.
  *Files:* `src/app/en/villas/[slug]/page.tsx`, `src/app/en/the-estate/page.tsx`

- **T-288 — `includedVillas` was typed `string[]` and has always held objects.** It never failed, because nothing read it: the estate page showed three figures per house and none of the prose. **A type describing data nobody consumes is unverified by definition.** Corrected, and callers must look these up BY NAME — the list names five houses including Pueblo, while `getEstateVillas()` returns the four in the collection, so an index-based pairing would describe Melia with Eeanthe's bathroom the day the two lists diverge.
  *Files:* `src/types/content.ts`

- **T-289 — The parity certificate, and the number it refuses to print.** One rule has governed this project from the first message: *keep all existing content — reorganise it, never delete it.* It was asserted piecemeal — a villa-count test here, a redirect harness there — with no single answer to "is it all still here?". `PARITY-CERTIFICATE.md` is that answer, **generated** rather than written, because a certificate someone typed is a claim while one derived from the inventory is a measurement that goes stale loudly instead of quietly.
  **4 of 6 domains complete.** Villas and venues 7/7, experiences 21/21, legacy text captures 42/42, photography 862/862. Outstanding: **15 redirect targets that do not resolve** and **46 registry facts that appear on no page**. Neither is a deletion — every item exists in the repository and lacks a route or a place on a page. The distinction is stated in the document, because "the copy pass replaced it" and "nobody rendered it" are very different answers and a parity report that blurs them is worthless.
  **The first draft summed every domain and led with "1113 of 1174 — 94.8%".** Arithmetically correct and actively misleading: 862 of those items are photographs, all present, so the aggregate drowned fifteen broken redirects in a sea of JPEGs and *could not get worse when a redirect broke*. Weighting the domains would mean inventing weights, so the headline counts **domains**, not items — a shape that cannot flatter — and the caveat explaining why is in the document and asserted by the suite.
  *Files:* `scripts/parity-certificate.mjs`, `PARITY-CERTIFICATE.md`

- **T-290 — A generated document nobody regenerates is worse than a written one.** It carries the authority of a measurement and the accuracy of a memory. Add an experience, delete a photograph, close a redirect gap, and the committed certificate keeps asserting yesterday's numbers with a straight face.
  `tests/parity-certificate.spec.ts` recomputes the five server-free domains from the same inputs and checks them against the committed text; the registry-coverage row needs a rendered page and belongs to `npm run coverage`, which is **stated in the test rather than quietly skipped** — a guard covering four of six rows while looking like it covers six is the failure mode this project keeps meeting (§18). It also asserts the anti-flattery caveat survives a future edit, and that the shortfall count matches the shortfalls actually listed.
  **Falsified:** adding one experience file turns it red with the exact row it expected.
  *Files:* `tests/parity-certificate.spec.ts`

- **T-291 — Two evidence generators had been sitting in the correctness suite the whole time.** `tests/acts-shots.spec.ts` and `tests/phase3-shots.spec.ts` carried, between them, **zero `expect()` calls and seven `screenshot()` calls**. They could not fail in a way that meant anything, and they were spending the gate's time and dirtying the working tree to produce pictures.
  This project already learned that lesson once: thirty screenshot tests exhausted the runner's memory and were moved to `scripts/capture.mjs` under a doctrine worth restating — **evidence generation is not a correctness gate**. A screenshot proves nothing about behaviour; it exists so a person can look at it. These two survived that move by being small enough not to hurt, and the cost showed up somewhere else instead: `qa/acts/*.png` and `qa/phase3/*.png` were modified on **every single suite run**, so every unrelated commit tonight swept up four to six regenerated PNGs.
  Moved to `scripts/capture-composites.mjs`, with every hard-won comment intact — measuring the sticky run in document space rather than viewport space, serving the side-by-side shell from a fulfilled same-origin route so React cannot reclaim the body, waiting on `.d-spec-strip` rather than on `readyState` because a page-level heuristic measures the absence of activity and never the presence of the thing being captured (§10).
  **Measured effect:** the suite drops 5 test cases and **loses no assertion, because there were none**. Shard 2 falls from **1.2 minutes to 34.8 seconds**. And a full `npm run qa` now leaves the working tree clean, which it had not done once all night.
  *Files:* `scripts/capture-composites.mjs`, `tests/acts-shots.spec.ts` (deleted), `tests/phase3-shots.spec.ts` (deleted)

- **T-292 — The rest of the suite turned out not to need consolidating, which is worth recording as a result.** Sixteen spec files, 398 cases, **no duplicate test titles anywhere** and no two specs asserting the same property of the same route. The overlap that looked like duplication is not: `qa.spec.ts` checks overflow at nine widths including the fixed-layer case (T-213), while `smoke.spec.ts` checks three widths **on two engines** — same subject, different question, and the smoke run is the only WebKit coverage there is.
  Recorded rather than "tidied". Merging specs that share a subject but not an assertion would have cost coverage for the appearance of order, and a consolidation that removes an assertion class is a regression wearing a housekeeping label.
  *Files:* none — this is a measurement

- **T-293 — One high-severity advisory closed; four packages updated; two majors deliberately refused.** `npm audit` reported **nanoid <3.3.18** (GHSA-2v37-7h3g-55p8, custom generators can loop indefinitely at size zero), transitively via `postcss` from both `next` and `@tailwindcss/postcss`. Fixed to 3.3.18; **0 vulnerabilities** now.
  Updated within semver, each verified by the full gate: **next 16.3.0 → 16.3.1**, **framer-motion 13.0.0 → 13.1.1**, **eslint-config-next 16.3.0 → 16.3.1**, **eslint 10.8.0 → 10.8.1**.
  **Two majors NOT taken, and the reasons are not "it might break":**
  - **typescript 5.9.3 → 7.0.2.** A major jump to the native port, with `typescript-eslint` and `eslint-config-next` both sitting on top of it. "The gate is green" is the only evidence one night could produce, and it is not enough evidence for a compiler change on a project about to be handed over.
  - **@types/node 24 → 26.** Refused because it would be **wrong**, not risky: the runtime here is Node v24.19.0, and `@types/node` describes the APIs of its own major. Types ahead of the runtime would let code compile against APIs that do not exist at run time. It should move when Node does.
  *Files:* `package.json`, `package-lock.json`

- **T-294 — THE REPORT'S PERFORMANCE TABLE WAS NOT REPRODUCIBLE, AND THE UPDATE IS NOT WHY.** After the dependency bump the homepage's long-task total measured **275ms against a 200ms budget**, where the report claimed 183ms and "all four routes pass every budget". That looked exactly like a Framer Motion regression.
  It is not. Bisected properly rather than guessed:
  - `framer-motion` back to **13.0.0** → homepage still **263ms**. Not Framer.
  - `text-wrap: balance` disabled → **283ms**. Not the type fix.
  - the `:has()` rule removed entirely → **276ms**. Not the selector, which was the better hypothesis: the earlier probe had disabled the *property* and left the *selector*, and `:has()` is the expensive half.
  - and then the decisive one: **`git checkout 1189b5b -- src/`** — the exact source that measured 183ms — built and measured on this machine, right now: **248ms and 260ms.**
  So the homepage costs 250–280ms of long tasks on this machine whatever the source, and **nothing in tonight's work regressed it.** The 183ms was measured on a differently-loaded host in an earlier session and was never reproducible. A lab number under 4× CPU throttling is a measurement of the host as much as of the page, and quoting one across sessions as if it were a property of the site is the same error as trusting any instrument without re-running it.
  **The report is corrected rather than the budget.** Moving a budget to make a number pass is how a budget stops meaning anything. Two routes are over, it is recorded as over, and reducing the homepage's hydration cost — Lenis, the cursor, the route transition, the preloader, the drag register, the acts and the litany all hydrate on first paint — is named as open work rather than quietly absorbed.
  *Files:* `SESSION-REPORT.md`

- **T-295 — Four houses that read as one, and a fix that broke a sentence in half.** The estate's per-house descriptions landed in T-285 and the second taste loop looked at them: four near-identical paragraphs side by side, each ending in the same twelve words — *"…living room with HDTV and Nintendo Wii, fully equipped kitchen and dining area"*. The repetition was louder than the difference, which on the page that exists to distinguish four houses is the opposite of the job, and it read as filler. What actually differs — a bed split and a bathroom type — was buried mid-sentence, three times over.
  `splitSharedTail()` computes the shared tail across **exactly the descriptions being rendered** — never including Villa Pueblo, whose entry is different prose entirely and would collapse the common suffix to nothing — states it once below the list, and leaves each house only its own. **Nothing is deleted: every word still appears, once.**
  **The first version compared word by word and shipped a broken sentence.** Three of the four end `(Jacuzzi bath and shower cabin)` and one ends `(shower cabin)`, so `cabin),` is a common trailing *word* — and the cut landed inside a parenthetical. The live page read *"1 bathroom (shower"* under Villa Thoi and *"Every house also has a cabin), living room with HDTV…"* underneath. One fact split across two sentences, and a third invented that meant nothing.
  These descriptions are comma-separated lists of facts, so the only safe cut is between facts. The split is now **depth-aware** — a comma inside brackets is not a separator — it refuses to hoist when fewer than two clauses are shared or when a house would be left with nothing of its own, and it **checks the result for balanced brackets before trusting it**.
  Guarded: `tests/villa.spec.ts` asserts no rendered house detail has unbalanced brackets or a dangling comma, that the shared line is a complete sentence, and that the four houses do not all read the same — which is the whole point of the beat.
  *Files:* `src/lib/villa-page.ts`, `src/app/en/the-estate/page.tsx`, `src/app/direction-d.css`, `tests/villa.spec.ts`
