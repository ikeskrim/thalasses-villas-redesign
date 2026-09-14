# Design references

Ten reference sites, read on 2026-09-13. Each entry says what the site does,
whether this site already does it (checked against the served build on
2026-09-14), and which of our sections it belongs to. A ranked gap list follows.

**How this was gathered.** Each site's homepage, at least one room or villa page,
and its booking entry point were read — never a booking started, a form
submitted or a consent banner accepted. Several pages refused scripted reads or
rendered only in a browser; where a detail comes from markup or a published case
study rather than direct observation, the entry says so. Nothing here is copied:
the value of a reference is the *idea*, measured against our own brief
(`DECISIONS.md` D-001, Direction F) and our own registry, never its artwork,
copy or code. Dribbble is cited at the end for component ideas, as links only.

**Checked against the build.** The first version of this file compared the
references with our homepage alone. Five of its "we don't" points were already
on the villa, estate or location pages: the spec strip, the fact sheet, Enquire
beside Check availability, "Your stay includes", and most of a getting-here
block. Every point below was re-checked against what `http://localhost:3005`
serves (build `zvZmrT7ejPvvMsQp89xck`, the app at `56cb859`). After review, the
villa-page counts (booking controls, fact sheet, inclusions, "Good to know",
position, captions, pool area) were taken on all five villa pages, not Villa
Thoi alone. The route-by-route
record is in `qa/references/VERIFY-tranche12.md`. Each point ends with
**Here:**
- **missing**
- **partly present** — where
- **present** — where
- **not scored** — a look rather than a feature; D-001 decides the look
- **not applicable** — why there is nothing here to measure

*Avoid* lines are marked **same here** where this site shares the fault and
**avoided** where it does not.

**Our sections, for mapping:** Top bar · Hero · Villas · Experiences · Weddings ·
Discover Crete · Press · Footer. A section means the homepage section **and** the
inner pages that carry its detail:
- Villas: `/en/villas/*` and `/en/the-estate`
- Experiences: `/en/experiences`
- Weddings: `/en/weddings`
- Discover Crete: `/en/location`
- Footer: every page's footer and `/en/contact`

A point counts as present only if the homepage or one of those inner pages
serves it, whichever section that page maps to (the villa pages' fact sheet
counts for Six Senses' Discover Crete point). `/en/gallery` is linked from every
page's menu but is not one of those pages; it was not fetched and counts for
nothing below.

---

## The ten

### 1. Acro Suites — acrosuites.com
SLH wellbeing resort on a headland at Agia Pelagia, Crete — the same island, and
the same booking platform as ours (WebHotelier). Structure and density were
Direction F's calibration; nothing of its identity is borrowed.

- **Press** — a media and press carousel, and award marks (SLH, Michelin and
  others) in the footer. *One credential line is weak proof at villa prices.*
  **Here: partly present** — one credential line on the homepage (D-007).
- **Top bar** — a loyalty club in the main navigation and a best-price guarantee
  in the engine. *Reasons to book direct rather than through an OTA.*
  **Here: missing.**
- **Villas** — room pages state exact specifications: pool and terrace m², bed
  sizes, maximum adults. *High-ticket guests compare before they pay.*
  **Here: partly present** — villa pages print bedrooms, bathrooms, sleeps,
  pools and area in m² and sq ft, then the bed and bath split and the view. The
  pool area appears only as inventory text: "20 square meters swimming pool"
  under Private pool on the Thoi, Persi, Eeanthe and Melia pages, and "Each
  villa has a 20 square meters swimming pool" on `/en/the-estate`; Villa
  Pueblo's page prints no pool area. No source states a terrace area. Bed sizes
  appear only in the registry's prose and are not printed. (The wedding venue's
  150 m² salt-water pool is stated separately and served on `/en/weddings` and
  the homepage.)
- **Footer** — group sister hotels, FAQs, sustainability, careers.
  **Here: partly present** — sister properties in the homepage footer, careers
  in every inner-page footer; no FAQ or sustainability page.

*Avoid:* a nights dropdown instead of a date range (**same here** — the villa
pages' booking ledger asks for arrival and a number of nights; the engine also
accepts a check-out date); room pages whose Book button does not carry the
chosen suite (**same here**, forced by the host: room preselect is inert on our
WebHotelier account, T-156); third-party overlays that add weight.

### 2. Passalacqua — passalacqua.it
Eighteenth-century villa hotel on Lake Como, 24 rooms in three buildings.

- **Discover Crete** — "Voices": first-person stories from local people and
  staff. *Authenticity an OTA listing cannot copy.* **Here: missing.**
- **Top bar** — the menu splits heritage and mood from rooms, dining and
  contact. *Inspiration and logistics stop competing.* **Here: missing** — one
  list on the homepage bar and one in the inner-page navigation.
- **Villas** — each unit's name carries its building and its view, and every unit
  page ends with all the others. *Position and view are understood from the
  title.* **Here: partly present** — every villa page ends with "The other
  houses"; the view is a detail row; Villa Thoi and Villa Persi print their
  front-row position in their own detail beat ("The position"), and the estate
  map gives every house's (front row, rear row, apart from the four); the names
  carry neither.
- **Discover Crete** — a seasons block arguing every season is worth the visit.
  **Here: missing.**
- **Footer** — the sister hotel gets a proper block above the footer, not a link.
  **Here: partly present** — names and links in the homepage footer only (D-006).

*Avoid:* a full-screen cookie wall over the hero on arrival (**avoided** — no
consent UI is rendered); no per-room booking path anywhere.

### 3. Aman — aman.com (Amanzoe as the Greek villa example)
- **Villas** — villa cards carry **both** "Check availability", deep-linked to
  the villa, and "Make an enquiry". *Large-villa guests often want to talk first.*
  **Here: partly present** — every villa page pairs Check availability with
  Enquire (and the fact sheet); the homepage villa cards offer Explore and Check
  availability only.
- **Top bar** — the booking screen shows the reservations phone and email beside
  the calendar. *A hesitating guest can reach a person without leaving the flow.*
  **Here: partly present** — both numbers and the email are in every footer and
  on `/en/contact`, never beside a booking control.
- **Discover Crete** — a "Getting here" page with directions and a map.
  **Here: partly present** — in three places: the homepage's Discover Crete
  (the chauffeur from the airport or port, arrival by helicopter to the estate's
  own pad, distances to both airports and both ports); `/en/location` (the same
  distances, without the arrival services, plus the one travel time any source
  states: the South coast, "about 40 minutes by car"); the chauffeur and helipad
  pages under Experiences. No directions, no map and no drive time from an
  airport or port on any of them.
- **Weddings** — "Celebrations", wider than weddings. **Here: partly present** —
  the section and page are titled "Weddings & Events"; no other occasion is named.
- **Footer** — a nearby-properties carousel on every property page.
  **Here: partly present** — sister-property links, homepage footer only.

*Avoid:* brand editorial ahead of the accommodation; a destination-first booking
step, which a single property does not need.

### 4. Cap Rocat — caprocat.com
A nineteenth-century fortress hotel in a nature reserve on the Bay of Palma.

- **Top bar** — booking opens as a modal over the page instead of navigating
  away. *The atmosphere stays on screen while dates are chosen.* (The engine loads
  only on click; its fields were not observed.) **Here: missing** — every booking
  control leaves for the WebHotelier engine.
- **Hero** — the homepage is organised as numbered chapters. *A narrative spine
  for a long scroll.* **Here: partly present** — the villa, estate and weddings
  pages number their beats; the homepage does not.
- **Footer** — a named newsletter and gift cards. **Here: missing.**
- **Discover Crete** — heritage: the architect, the restoration award, a photo
  collection. *Provenance justifies rate better than amenity lists.*
  **Here: partly present** — the Thoi, Persi, Eeanthe and Melia pages each serve
  a captioned photograph set, and on each of the four a caption credits EMU
  furniture or white marble from Greece (see Casa di Legna). No source names an
  architect or a restoration award; the one credential is the Condé Nast
  Traveler mention (D-007). `/en/gallery` is outside the mapped pages and is not
  counted.

*Avoid:* room pages with no size or capacity (**avoided**); a chapter sequence
that skips numbers (**same here** on `/en/location`, which prints 01 and then 07).

### 5. Six Senses — sixsenses.com (Kaplankaya, Aegean, as the example)
Read in a browser; the site refuses scripted requests.

- **Hero** — a dates-and-guests booking bar directly under the hero. *A
  committed guest starts booking in the first viewport.* **Here: partly
  present** — a sticky dates-and-guests ledger on every villa page; none on the
  homepage.
- **Villas** — cards with key-facts and amenities tabs, a floorplan link, and
  "add to compare". **Here: partly present** — key facts on the homepage cards,
  the villa pages and the estate page, and the full amenity inventory on each
  villa page; no tabs, no floorplans (none in the library), no compare.
- **Villas** — every card prompts for dates to show rates. **Here: missing** — no
  rate is printed anywhere.
- **Discover Crete** — a practical strip: local time, how to get there, and a
  downloadable fact sheet and resort map. **Here: partly present** — a
  downloadable fact sheet for every villa (**present**, villa pages) and a
  hotspot map of the estate (**present**, `/en/the-estate`, not downloadable);
  how to get there as in Aman above; no local time.
- **Experiences** — a provenance story (local farmers supplying the kitchen) as
  an experience. **Here: partly present** — the estate's own organic garden is an
  experience; no named outside supplier.

*Avoid:* untranslated template keys seen live on cards; carousel overload.

### 6. Ultima Gstaad — ultimacollection.com/our-collection/ultima-hotel-gstaad
Three chalets in Gstaad: suites, private residences, a medical spa.

- **Villas** — a "signature inclusions" block: what every stay includes. *Spelled
  out value justifies a direct rate and ends inclusion questions.*
  **Here: partly present** — "Your stay includes" on every villa page and the
  estate page; not on the homepage.
- **Villas** — separate booking paths for suites and for residences. *Our
  per-villa and Entire Estate split, handled explicitly.* **Here: present** —
  villas book (Check availability); the Entire Estate enquires. On
  `/en/the-estate` that is "Enquire — we design your stay", linking
  `/en/contact?enquiry=estate`; on the homepage it is a plain "Enquire" on the
  estate card and "Enquire about the estate" in the footer, both linking
  `/en/contact` with no `enquiry=estate`.
- **Press** — a stories section beside the awards. **Here: missing.**
- **Footer** — offers and gift cards in the navigation; GDS codes for advisors.
  **Here: missing.**

*Avoid:* the engine opened in a different language from the site (**avoided** —
every engine link pins `lang=en`).

### 7. Casa di Legna — casadilegna.com
A single contemporary wooden villa for twelve at Porto-Vecchio, Corsica. The
name was ambiguous; this is the property with an Awwwards mention at that URL.

- **Villas** — publishes weekly rates by season and the changeover rule beside an
  availability calendar. *Pre-qualifies enquiries.* **Here: missing** — the
  registry states no rates and no minimum stay.
- **Press** — articles and PDFs in a carousel near the top of the homepage.
  **Here: partly present** — one credential line, below Discover Crete.
- **Discover Crete** — names the architect, the designer and the furniture
  maker. **Here: partly present** — photograph captions on four villa pages
  name two of the credits the registry gives: EMU furniture (Villa Thoi twice,
  Villa Melia once) and white marble from Greece (Thoi, Persi, Eeanthe). The
  rest of the list in the four seafront villas' descriptions — Compac, Kahrs,
  Grohe, Augenti, Beca, Schüko, Cocomat, Poul Christiansen and Boris Berlin for
  Gubi, Paola Navone for Emu — is in no page's visible text; Grohe and Cocomat
  occur only as photograph alt text. No source names an architect.
- **Top bar** — one bold brand colour and a monospace accent carried through to
  the 404. **Here: not scored.**

*Avoid:* no booking or enquiry action on the suites page (**avoided** — every
villa page has both); a colour preloader that delays the first photograph
(**avoided** — none is rendered).

### 8. Maison Mastrorelli — maisonmastrorelli.com
An eighteenth-century coaching inn near Cannes — guest rooms, whole-house hire,
a host's table.

- **Villas** — every unit page repeats a practical block (breakfast, check-in
  and check-out, terms) directly above a named "Book [room]" button.
  **Here: partly present** — four of the five villa pages carry "Good to know"
  (the villa's own policies), below the booking call rather than above it; Villa
  Pueblo's does not, because its registry holds no policies or services. The
  sticky ledger names the villa on all five. No check-in or check-out times,
  which the registry does not hold.
- **Villas** — rooms that exist only as part of a whole-house booking are
  labelled and routed that way. *A model for anything sold only with the Entire
  Estate.* **Here: not applicable** — today every house in the Entire Estate is
  also bookable on its own.
- **Experiences** — a named, host-led table as its own section. **Here: missing**
  — a private chef and a cooking lesson are offered, not a host's table.
- **Weddings** — events include shoots, filming and residencies. **Here: missing.**
- **Footer** — photography and video credits. **Here: missing.**

*Avoid:* a generic engine that breaks visual continuity with the site (**same
here** — WebHotelier's engine).

### 9. Explore Primland — explore.ownprimland.com (and auberge.com/primland)
An immersive estate site for a 12,000-acre resort in the Blue Ridge Mountains.
Only its loader and intro rendered within 15 seconds; the map and seasons details
come from the agency case study, not direct observation.

- **Villas** — the whole estate told through an interactive map with a hotspot
  per building. *Shows how the houses relate — the Entire Estate's whole
  argument.* This is the idea behind the `feat/estate-3d` experiment.
  **Here: partly present** — `/en/the-estate` serves an aerial frame with nine
  hotspots (the five houses, the beach, the pools, the table, the garden) and the
  same places as a permanent list; the 3D version exists only on the branch.
- **Discover Crete** — a seasons toggle that re-skins the landscape.
  **Here: missing.**
- **Top bar** — one persistent "Inquire" for high-value leads. **Here: partly
  present** — the persistent control is Book Now (homepage) or Check availability
  (inner pages); enquiry is not persistent.
- **Villas** (resort site) — compare, bedroom and view filters, and Book Now
  carrying preset dates. **Here: partly present** — the villa pages' ledger
  carries the chosen date, nights and party into the engine; no compare, no
  filters.

*Avoid:* WebGL-only content with almost no crawlable text (**avoided** — on main
the estate map is HTML with a permanent list); a forced-portrait notice on
phones; audio prompts; no route from the experience to a booking.

### 10. Editorial New — editorialnew.com (Pangram Pangram × Locomotive)
Not hospitality: a type showcase, read as a typography and interaction reference.

- **Hero** — a large narrow serif composed like a magazine cover.
  **Here: not scored.**
- **Experiences** — a sticky table of contents with jump links through a long
  page. *Twenty cards in five groups need a way in.* **Here: partly present** —
  `/en/experiences` filters by chip, which hides rows rather than jumping to
  them; the homepage's five groups have headings and no bar.
- **Villas** — facts set as specimen-style figures with labelled values.
  **Here: present** — the villa pages' spec strip and the estate's figures.
- **Footer** — an inverted colour state as a designed close. **Here: present** —
  a dark footer on every page.

*Avoid:* novelty controls (sliders, randomise) that would distract from booking.

---

## Ranked gap list

Ranked by what the **remaining** work would do for **direct bookings**, then by
whether it can be built from what this project already holds, then by effort.
A row that is partly built is ranked on what is left, not on the idea. "Owner"
means the work cannot start until the owner supplies a decision or material — it
is listed honestly rather than dropped. Against the first version, the re-check
moved five of the top six rows, and `qa/references/VERIFY-tranche12.md` says why
for each.

| # | Gap | Here today | Our section | Seen at | Needs | Effort |
|---|---|---|---|---|---|---|
| 1 | **Dates-and-guests entry on the homepage**, not only a Book Now button — the WebHotelier deep link accepts check-in, nights (or check-out) and party size | **partly present** — the sticky ledger on every villa page; the homepage has no date field | Hero / Villas | Six Senses, Aman, Primland | nothing | medium — reuse the ledger, and measure it: it is a client component on the page whose phone blocking time is watched (D-012) |
| 2 | **Enquire on the homepage villa cards, and the reservations phone and email beside the booking controls** | **partly present** — villa pages pair Check availability with Enquire; phone and email only in footers and on `/en/contact` | Villas / Top bar | Aman | nothing — phones and email in `content/site.json` | small |
| 3 | **What every stay includes, where a homepage booker sees it** — the homepage's Check availability goes straight to the engine, past every villa page | **partly present** — "Your stay includes" on every villa page and `/en/the-estate` | Villas | Ultima Gstaad | nothing — `content/verified-facts.json` `includedServices`, plus the private-beach row `src/lib/villa-page.ts` adds | small — surface the existing list |
| 4 | **Getting here in one practical block**: airports, ports, the chauffeur, the helipad, a map | **partly present** — split across the homepage's Discover Crete, `/en/location` and the two arrival experiences; no map | Discover Crete | Aman, Six Senses | nothing for the block and a map link — distances in `content/location.json`, arrival copy in `content/experiences/`, coordinates and a maps URL in `content/location.json`; **owner** for drive times from the airports and ports, which no source states (the only travel time in content is the South coast's "about 40 minutes by car", already served on `/en/location`) | small |
| 5 | **Design provenance**: the makers and materials the owner's own copy names | **partly present** — captions on four villa pages name EMU furniture and white marble from Greece; the fuller maker list is printed nowhere, and no source names an architect | Villas / Discover Crete | Casa di Legna, Cap Rocat | nothing for the four seafront villas — their descriptions in `content/villas/` name them; Villa Pueblo's names none | small |
| 6 | **A jump bar through Experiences** (Sea · Land · Taste · Wellness · Arrival) | **partly present** — `/en/experiences` filters by chip, under a different taxonomy (Service, not Arrival) | Experiences | Editorial New | nothing | small |
| 7 | **The estate as a map** that shows how the houses relate | **partly present** — the 2D hotspot map on `/en/the-estate` | Villas (Entire Estate) | Primland | the `feat/estate-3d` preview, owner yes/no; its measured cost is in `qa/perf/AB-tranche12-estate3d.md` | large — built on the branch |
| 8 | **Practical block at the decision point**: check-in and check-out times, breakfast, terms, above a named Book button | **partly present** — "Good to know" on four of the five villa pages (not Villa Pueblo), below the booking call | Villas (villa pages) | Maison Mastrorelli | owner — check-in times and minimum stay are not in the registry | small once supplied |
| 9 | **Press with depth**: more than one named mention, higher on the page | **partly present** — one credential line | Press | Acro, Casa di Legna, Passalacqua | owner — only one mention is verified | small once supplied |
| 10 | **Floorplans and compare** for choosing between villas | **missing** | Villas | Six Senses, Primland | owner — no floorplans in the library | medium |
| 11 | **Seasons**: why to come in May or October | **missing** | Discover Crete | Passalacqua, Primland | owner — no seasonal claims may be invented | small once supplied |
| 12 | **Voices**: the host, the gardener, the chef, in their own words | **missing** | Discover Crete / Experiences | Passalacqua, Mastrorelli | owner — real people, real words | medium |
| 13 | **Celebrations beyond weddings**: anniversaries, birthdays, shoots | **partly present** — "Weddings & Events" in name only | Weddings | Aman, Mastrorelli | owner decision | small |
| 14 | **Newsletter and gift stays** | **missing** | Footer | Cap Rocat, Aman, Ultima | owner decision — a consent and analytics question first | medium |
| 15 | **Published seasonal rates** | **missing** | Villas | Casa di Legna | owner decision — commercial | small |

Rows 1–6 can start without waiting on anyone; row 4's drive times from the
airports and ports are the one part that cannot.

## A distinctiveness note, recorded rather than acted on

Anthropic's `frontend-design` skill (installed in `.claude/skills/`) lists the
looks that currently read as machine-made. The first is a warm cream ground, a
high-contrast serif and a terracotta accent — which is Direction F's palette —
and it names an all-caps eyebrow above every heading, which F uses. The skill
itself says the brief's own words win, and D-001 is the owner's brief, so
nothing changes because of it. It is here so the owner knows that the approved
look sits close to a common default, and that the references that feel most
distinctive (Casa di Legna's single brand colour, Passalacqua's literary voice,
Editorial New's type) earned it through one bold choice, not through density.

## What the references do badly — keep avoiding

- A cookie wall or preloader over the hero on arrival (Passalacqua, Casa di Legna, Primland). *Here: neither is rendered.*
- A booking engine that opens in a different language from the site (Ultima Gstaad). *Here: `lang=en` on every engine link.*
- Room pages with no size or capacity (Cap Rocat, Ultima Gstaad). *Here: every villa page has both.*
- A Book button that forgets which room the guest was looking at (Acro Suites). *Here: the same, and not ours to fix — the host ignores room preselect (T-156).*
- Content that exists only in WebGL, with nothing a crawler or a slow phone can read (Primland). *Here: the estate map on main is HTML with a permanent list.*

## Component ideas on Dribbble — links only, nothing copied

Booking bar:
- https://dribbble.com/shots/26138088-Hotel-Booking-Widget — a compact step-through date and guest picker
- https://dribbble.com/shots/4817022-Hotel-Booking-Interaction — chosen dates and guests kept visible as a summary
- https://dribbble.com/shots/2098475-Calendar-date-range-picker — clear date-range selection states

Cards:
- https://dribbble.com/shots/21613164-Hotel-Villa-Booking-Website-Single-Card-UI — fact and action hierarchy on one villa card
- https://dribbble.com/shots/22273983-Rental-Real-Estate-Card-UI — beds, guests and area arranged around the photograph
- https://dribbble.com/shots/22674172-Luxury-Hotel-Website-Design — how room cards sit in a premium page rhythm

Footer:
- https://dribbble.com/shots/17531323-Neringa-Website-Footer-Design — a characterful, branded hotel footer
- https://dribbble.com/shots/1241228-Footer-Design-for-Travel-Website — sister properties with imagery in the footer
- https://dribbble.com/shots/8827313-Newsletter-Sign-Up-Footer — newsletter capture merged into the footer
