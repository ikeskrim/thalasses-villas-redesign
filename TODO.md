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
