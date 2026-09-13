# Design references

Ten reference sites, read on 2026-09-13, and what each does that this site does
not — mapped to our own homepage sections, then ranked.

**How this was gathered.** Each site's homepage, at least one room or villa page,
and its booking entry point were read — never a booking started, a form
submitted or a consent banner accepted. Several pages refused scripted reads or
rendered only in a browser; where a detail comes from markup or a published case
study rather than direct observation, the entry says so. Nothing here is copied:
the value of a reference is the *idea*, measured against our own brief
(`DECISIONS.md` D-001, Direction F) and our own registry, never its artwork,
copy or code. Dribbble is cited at the end for component ideas, as links only.

**Our sections, for mapping:** Top bar · Hero · Villas · Experiences · Weddings ·
Discover Crete · Press · Footer.

---

## The ten

### 1. Acro Suites — acrosuites.com
SLH wellbeing resort on a headland at Agia Pelagia, Crete — the same island, and
the same booking platform as ours (WebHotelier). Structure and density were
Direction F's calibration; nothing of its identity is borrowed.

- **Press** — a media and press carousel, and award marks (SLH, Michelin and
  others) in the footer. *One credential line is weak proof at villa prices.*
- **Top bar** — a loyalty club in the main navigation and a best-price guarantee
  in the engine. *Reasons to book direct rather than through an OTA.*
- **Villas** — room pages state exact specifications: pool and terrace m², bed
  sizes, maximum adults. *High-ticket guests compare before they pay.*
- **Footer** — group sister hotels, FAQs, sustainability, careers.

*Avoid:* a nights dropdown instead of a date range; room pages whose Book button
does not carry the chosen suite; third-party overlays that add weight.

### 2. Passalacqua — passalacqua.it
Eighteenth-century villa hotel on Lake Como, 24 rooms in three buildings.

- **Discover Crete** — "Voices": first-person stories from local people and
  staff. *Authenticity an OTA listing cannot copy.*
- **Top bar** — the menu splits heritage and mood from rooms, dining and
  contact. *Inspiration and logistics stop competing.*
- **Villas** — each unit's name carries its building and its view, and every unit
  page ends with all the others. *Position and view are understood from the
  title.*
- **Discover Crete** — a seasons block arguing every season is worth the visit.
- **Footer** — the sister hotel gets a proper block above the footer, not a link.

*Avoid:* a full-screen cookie wall over the hero on arrival; no per-room booking
path anywhere.

### 3. Aman — aman.com (Amanzoe as the Greek villa example)
- **Villas** — villa cards carry **both** "Check availability", deep-linked to
  the villa, and "Make an enquiry". *Large-villa guests often want to talk first.*
- **Top bar** — the booking screen shows the reservations phone and email beside
  the calendar. *A hesitating guest can reach a person without leaving the flow.*
- **Discover Crete** — a "Getting here" page with directions and a map.
- **Weddings** — "Celebrations", wider than weddings.
- **Footer** — a nearby-properties carousel on every property page.

*Avoid:* brand editorial ahead of the accommodation; a destination-first booking
step, which a single property does not need.

### 4. Cap Rocat — caprocat.com
A nineteenth-century fortress hotel in a nature reserve on the Bay of Palma.

- **Top bar** — booking opens as a modal over the page instead of navigating
  away. *The atmosphere stays on screen while dates are chosen.* (The engine loads
  only on click; its fields were not observed.)
- **Hero** — the homepage is organised as numbered chapters. *A narrative spine
  for a long scroll.*
- **Footer** — a named newsletter and gift cards.
- **Discover Crete** — heritage: the architect, the restoration award, a photo
  collection. *Provenance justifies rate better than amenity lists.*

*Avoid:* room pages with no size or capacity; a chapter sequence that skips
numbers.

### 5. Six Senses — sixsenses.com (Kaplankaya, Aegean, as the example)
Read in a browser; the site refuses scripted requests.

- **Hero** — a dates-and-guests booking bar directly under the hero. *A
  committed guest starts booking in the first viewport.*
- **Villas** — cards with key-facts and amenities tabs, a floorplan link, and
  "add to compare".
- **Villas** — every card prompts for dates to show rates.
- **Discover Crete** — a practical strip: local time, how to get there, and a
  downloadable fact sheet and resort map.
- **Experiences** — a provenance story (local farmers supplying the kitchen) as
  an experience.

*Avoid:* untranslated template keys seen live on cards; carousel overload.

### 6. Ultima Gstaad — ultimacollection.com/our-collection/ultima-hotel-gstaad
Three chalets in Gstaad: suites, private residences, a medical spa.

- **Villas** — a "signature inclusions" block: what every stay includes. *Spelled
  out value justifies a direct rate and ends inclusion questions.*
- **Villas** — separate booking paths for suites and for residences. *Our
  per-villa and Entire Estate split, handled explicitly.*
- **Press** — a stories section beside the awards.
- **Footer** — offers and gift cards in the navigation; GDS codes for advisors.

*Avoid:* the engine opened in a different language from the site (the same
failure `lang=en` exists here to prevent).

### 7. Casa di Legna — casadilegna.com
A single contemporary wooden villa for twelve at Porto-Vecchio, Corsica. The
name was ambiguous; this is the property with an Awwwards mention at that URL.

- **Villas** — publishes weekly rates by season and the changeover rule beside an
  availability calendar. *Pre-qualifies enquiries.*
- **Press** — articles and PDFs in a carousel near the top of the homepage.
- **Discover Crete** — names the architect, the designer and the furniture
  maker.
- **Top bar** — one bold brand colour and a monospace accent carried through to
  the 404.

*Avoid:* no booking or enquiry action on the suites page; a colour preloader
that delays the first photograph.

### 8. Maison Mastrorelli — maisonmastrorelli.com
An eighteenth-century coaching inn near Cannes — guest rooms, whole-house hire,
a host's table.

- **Villas** — every unit page repeats a practical block (breakfast, check-in
  and check-out, terms) directly above a named "Book [room]" button.
- **Villas** — rooms that exist only as part of a whole-house booking are
  labelled and routed that way. *A model for anything sold only with the Entire
  Estate.*
- **Experiences** — a named, host-led table as its own section.
- **Weddings** — events include shoots, filming and residencies.
- **Footer** — photography and video credits.

*Avoid:* a generic engine that breaks visual continuity with the site.

### 9. Explore Primland — explore.ownprimland.com (and auberge.com/primland)
An immersive estate site for a 12,000-acre resort in the Blue Ridge Mountains.
Only its loader and intro rendered within 15 seconds; the map and seasons details
come from the agency case study, not direct observation.

- **Villas** — the whole estate told through an interactive map with a hotspot
  per building. *Shows how the houses relate — the Entire Estate's whole
  argument.* This is the idea behind the `feat/estate-3d` experiment.
- **Discover Crete** — a seasons toggle that re-skins the landscape.
- **Top bar** — one persistent "Inquire" for high-value leads.
- **Villas** (resort site) — compare, bedroom and view filters, and Book Now
  carrying preset dates.

*Avoid:* WebGL-only content with almost no crawlable text; a forced-portrait
notice on phones; audio prompts; no route from the experience to a booking.

### 10. Editorial New — editorialnew.com (Pangram Pangram × Locomotive)
Not hospitality: a type showcase, read as a typography and interaction reference.

- **Hero** — a large narrow serif composed like a magazine cover.
- **Experiences** — a sticky table of contents with jump links through a long
  page. *Twenty cards in five groups need a way in.*
- **Villas** — facts set as specimen-style figures with labelled values.
- **Footer** — an inverted colour state as a designed close.

*Avoid:* novelty controls (sliders, randomise) that would distract from booking.

---

## Ranked gap list

Ranked by what each would do for **direct bookings**, then by whether it can be
built from what this project already holds, then by effort. "Owner" means the
work cannot start until the owner supplies a decision or material — it is listed
honestly rather than dropped.

| # | Gap | Our section | Seen at | Needs | Effort |
|---|---|---|---|---|---|
| 1 | **Dates-and-guests entry on the homepage**, not only a Book Now button — the WebHotelier deep link already accepts check-in, nights and party size, and the villa pages already have the ledger | Hero / Villas | Six Senses, Aman, Primland | nothing | medium |
| 2 | **"What every stay includes"** as a block beside the villas | Villas | Ultima Gstaad | nothing — `verified-facts.json` holds the included services | small |
| 3 | **Enquire beside Check availability** on each villa card, and the reservations phone and email at the moment of booking | Villas / Top bar | Aman | nothing — contact details are in the registry | small |
| 4 | **A jump bar through Experiences** (Sea · Land · Taste · Wellness · Arrival) | Experiences | Editorial New | nothing | small |
| 5 | **Getting here**: airports, ports, drive times, the chauffeur and the helipad in one practical block | Discover Crete | Aman, Six Senses | nothing — distances and both arrival services are in the registry | small |
| 6 | **Design provenance**: the makers and materials the owner's own copy already names | Villas / Discover Crete | Casa di Legna, Cap Rocat | nothing — the villa descriptions list them | small |
| 7 | **The estate as a map** that shows how the houses relate | Villas (Entire Estate) | Primland | the `feat/estate-3d` preview, owner yes/no | large |
| 8 | **Practical block at the decision point**: check-in and check-out times, breakfast, terms, above a named Book button | Villas (villa pages) | Maison Mastrorelli | owner — check-in times and minimum stay are not in the registry | small once supplied |
| 9 | **Press with depth**: more than one named mention, higher on the page | Press | Acro, Casa di Legna, Passalacqua | owner — only one mention is verified | small once supplied |
| 10 | **Floorplans and compare** for choosing between villas | Villas | Six Senses, Primland | owner — no floorplans in the library | medium |
| 11 | **Seasons**: why to come in May or October | Discover Crete | Passalacqua, Primland | owner — no seasonal claims may be invented | small once supplied |
| 12 | **Voices**: the host, the gardener, the chef, in their own words | Discover Crete / Experiences | Passalacqua, Mastrorelli | owner — real people, real words | medium |
| 13 | **Celebrations beyond weddings**: anniversaries, birthdays, shoots | Weddings | Aman, Mastrorelli | owner decision | small |
| 14 | **Newsletter and gift stays** | Footer | Cap Rocat, Aman, Ultima | owner decision — a consent and analytics question first | medium |
| 15 | **Published seasonal rates** | Villas | Casa di Legna | owner decision — commercial | small |

Rows 1–6 can start without waiting on anyone.

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

- A cookie wall or preloader over the hero on arrival (Passalacqua, Casa di Legna, Primland).
- A booking engine that opens in a different language from the site (Ultima Gstaad).
- Room pages with no size or capacity (Cap Rocat, Ultima Gstaad).
- A Book button that forgets which room the guest was looking at (Acro Suites).
- Content that exists only in WebGL, with nothing a crawler or a slow phone can read (Primland).

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
