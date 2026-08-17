# THALASSES VILLAS — FINAL DESIGN PLAN

**Direction:** LIVING UNLIMITED — *The Unclosed Clause*
**Status:** Decided. Build from this document.
**Stack:** Next 16 (App Router, `app/[locale]/`), React 19, Tailwind 4, Framer Motion 13, GSAP 3.15 (one set-piece), Lenis 1.3.
**Supersedes:** the four Phase-1 directions and all three judgements.

---

## 0. DECISION RECORD & VERIFIED CONTENT LEDGER

The spine is the **typographic** direction (*The Unclosed Clause*), which won two of three judging lenses and placed second by three points on the third. Three grafts are folded in, every disqualification raised by the judges is resolved below, and the palette has been rebuilt from scratch because all three judges independently found that all four candidate palettes had converged on the same six values.

### 0.1 What was grafted, and what it replaced

| From | Grafted | Replaces |
|---|---|---|
| **SEA LEVEL** (horizon) | The horizon lock + the zero-gap rule between consecutive photographs | Generic "snap-scroll gallery" and section spacing-by-number |
| **In Antis** (architecture) | The qualitative `[CONFIRM]` Figure fallback; the editorial cut of 24 non-villa amenity rows; villa differentiation from `specs.floors` / `specs.view` | The en-dash placeholder (read as a bug); "the only differentiators are the photograph and the clause" |
| **FOLIO** (editorial-object) | CSS multi-column **flow** for the schedule; `featureType 7` silent omission; `featureType 1/2` numeric rendering; the live `find:` filter | A grid or accordion for 139 uneven items |

### 0.2 Disqualifications and errors, resolved

| Finding | Resolution |
|---|---|
| Winning direction **fabricated five experience word counts** and invented a "Water Sports 80w" entry | All counts re-derived from `content/experiences/*.json` (§0.3). "Water Sports" is the real display name of `jet-ski-safari` (71w) — not a separate item. |
| Winner claimed **32 amenity subgroups**; "roughly a third" carry descriptions | Actual: **28 groups** (Villa Thoi), **29 of 139** items carry a description or extraDescription (**21%**). |
| Winner's flagship photo-essay specified for 9 experiences, **7 of which have exactly one image** | The Chapter gate is now **photographs, not words**: `images >= 6`. Exactly **five** experiences qualify. Everything else is an Index row that expands in place. |
| Winner's `--sand` accent **fails AA as text everywhere** (3.11:1) and was policed by a lint rule | **The gold token is deleted.** There is no gold, ochre or brass anywhere in this system. The accent on light ground is `--pelagos` (7.07:1, passes at every size). See §3.4. |
| Winner's `--sand` role string assigned it to 13px tail text on `--aegean` (3.17:1 — a straight AA failure) | Token does not exist. Contradiction cannot recur. |
| Winner's hero tail "runs past the right edge and gets cut by the viewport" — expands `scrollWidth`, contradicting its own no-horizontal-scroll rule | The clause sits inside `.clause-clip { overflow: hidden; }` scoped to the section, not the document. Specified in §2.4. |
| Winner's per-character spans destroy screen-reader and text-selection behaviour | Wrapper carries `aria-label` with the full clause; every `<span>` is `aria-hidden="true"`. Specified in §2.4. |
| Winner's `[CONFIRM]` en-dash "still looks like a bug" | Replaced wholesale with In Antis's qualitative Figure component (§6.2). |
| Winner **deferred mobile amenities** | Designed in §6.4.5, and made materially shorter by the 24-row editorial cut. |
| Winner named the **Greek locale / Marcellus Greek coverage** as a go/no-go and walked past it | Resolved: the legacy site is **English-only**; `content/url-map.md` §5.3 defines Greek as a post-launch addition. This is a Phase-2 decision with a named budget, not a launch gate. See §10. |
| SEA LEVEL shipped **two** signature systems (the Datum *and* the light ramp) | The light ramp is **deleted**, not demoted. There is one signature. |
| SEA LEVEL's Collection **site plan assumed four distinct villa coordinates** — all four records share one lat/lng | Not built. Villa position is expressed from the *verified prose* ("to the front... to the rear"), not from geodata. See §6.1. |
| In Antis assigned **eight flagships** its own build gate would reject; banned 3:2 when 403 of 704 images are 3:2 | Chapter gate is arithmetic (§6.3.1). No crop policy bans any native aspect ratio. |
| FOLIO's plate mark **depends on captions that do not exist** | Not built. The 96 real captions are used as captions where they exist and nowhere else. |
| All four palettes converged within a few RGB points | Palette rebuilt (§3). The break-out value is `--preveli`, and the structural break is the **removal of the accent slot**. |
| Judges: "six of eight homepage beats are generic" | Four of the six are structurally rethought in §5.4 and §6. The two kept (booking rail, section rhythm) are re-argued, not laundered. |

### 0.3 Verified content ledger — build against these numbers, not the brief's

Derived directly from `content/` on 2026-08-06. **Do not re-derive from the Phase-1 documents; several of their figures are wrong.**

**Experiences — 21 records, `content/experiences/*.json`**

| Experience | Words | Images | Category | Tier |
|---|---:|---:|---|---|
| Dream Wedding on the Beach | 288 | 21 | Service | **Chapter** → moves to `/weddings` |
| Private Chef (`chef-in-villa`) | 31 | 13 | Taste | **Chapter** |
| Exclusive Tour | 20 | 13 | Land | **Chapter** |
| Organic Farm (`biological-garden`) | 53 | 9 | Taste | **Chapter** |
| Private Helipad | 41 | 9 | Service | **Chapter** |
| Learn the secrets of Cretan Cuisine! | 82 | 1 | Taste | Index |
| Private Boat Trip | 78 | 1 | Sea | Index |
| Water Sports (`jet-ski-safari`) | 71 | 1 | Sea | Index |
| Scuba Diving | 50 | 1 | Sea | Index |
| Chauffeur | 37 | 1 | Service | Index |
| Jeep Safari | 33 | 1 | Land | Index |
| Personal Trainer | 29 | 1 | Wellness | Index |
| Quad Safari | 28 | 1 | Land | Index |
| Therapist | 25 | 1 | Wellness | Index |
| Wine Tasting | 25 | 1 | Taste | Index |
| Wine Production | 22 | 1 | Taste | Index |
| Breakfast on the Beach | 20 | 1 | Taste | Index |
| Bike Tours | 19 | 1 | Land | Index |
| Hiking | 17 | 2 | Land | Index — **merged with Running** |
| Running | 17 | 1 | Land | *(merged)* |
| Massage | 12 | 1 | Wellness | Index |

Result: **5 Chapters** (one of which is the Weddings page), **15 Index rows**.

**Facilities — `content/facilities/*.json`**

| Property | Total | Live site showed | Groups | With description | Unresolved enum (`featureType 7`) | Numeric (`featureType 1/2`) |
|---|---:|---:|---:|---:|---:|---:|
| Villa Thoi (200) | 139 | 65 | 28 | 29 | 8 | 6 |
| Villa Persi (201) | 134 | 62 | 29 | 28 | 8 | 6 |
| Villa Eeanthe (202) | 137 | 63 | 29 | 26 | 8 | 6 |
| Villa Melia (203) | 136 | 63 | 29 | 26 | 8 | 6 |
| Entire Estate (2142) | 127 | 54 | 29 | 31 | 7 | 5 |

Villa Thoi domain split: Amenities 65 (11 groups) · Entertainment/Activities 40 (5) · Children 3 (2) · Cleaning 12 (3) · Safety/Security 17 (6) · Environment/Heating-Cooling 2 (1).

**Villas — `content/villas/*.json`, `specs` + `longDescription`**

| # | Villa | Bed/Bath/Sleeps/m² | Floors | Verified distinguishing fact (from source prose) |
|---|---|---|---|---|
| I | Thoi (200) | 2/1/5/60 | `null` (single-storey) | *Front* row, sea at eye level. Bathroom is a **hydro-massage shower cabin** — the only villa with **no Jacuzzi bath**. |
| II | Persi (201) | 2/1/5/60 | `null` (single-storey) | *Front* row, sea at eye level. **"an enormous bathroom"** — Jacuzzi bath *and* shower cabin. |
| III | Eeanthe (202) | 3/2/6/60 | 2 | *Rear*, two-storey. Sea **from the first-floor bedrooms and balcony**. Three bedrooms — the largest. |
| IV | Melia (203) | 2/2/4/60 | 2 | *Rear*, two-storey. Ground-floor twin bedroom has **direct access to the pool area**. |

The front/rear split is not an assumption. It is stated verbatim in all four `longDescription` fields: *"To the front villas "Thoi" and "Persi" which are single-storey, to the rear two-storey villas "Eeanthe" and "Melia"."* Per-villa long copy runs 660 / 665 / 691 / 700 words — **the villa pages are not the content-scarce part of this site.**

**Named materials in the source prose (unmined by all four directions, load-bearing here — see §2.2):**
Compac worktops · Kährs bedroom floors · Greek white marble · Grohe water systems · Augenti and Beca lighting · Schüco doors and windows · Cocomat beds · furniture by Poul Christiansen & Boris Berlin (Gubi) · EMU outdoor furniture by Paola Navone · Apivita and Cocomat bath amenities · a Porphyritic gas barbecue.

**Images — `content/image-index.json`:** 704 files, 387 MB, fields are `store / bytes / width / height / format / path / aspect` only. **640 landscape · 62 portrait · 2 square.** Aspect clusters: 1.78 (231), 1.46 (218), 1.50 (185), 0.68 (35), 0.56 (20). **Zero images are natively 4:5.** Median width 2248px, max 5760px. 694 of 704 sit in one bucket named `pool`. **No subject, room or orientation metadata exists for any image.**

**Captions — `content/captions.json`:** 906 slots, **225 captioned, 96 unique.** The 96 are real and usable (*"Open plan living room with white marble from Greece"*, *"Sunbathing area by the pool, external furniture from EMU"*). They are enough for a curated set; they are not a per-image caption system.

**Location — `content/location.json`:** 11 named beaches, **only 2 carry a distance** (private beach 50 m; Rethymno beach 8 km). Schinaria, Triopetra, Agios Pavlos, Preveli and Plakias are collectively *"about 40 minutes by car"*. Ammoudaki and Klisidi are connected by an underwater hole *— "you can get from one beach to another only with a dive."*

**Booking — `content/booking.json`:** WebHotelier, `GET`, `target="_blank"`.
Global bar → `thalassesvillas.reserve-online.net` (no room code). Villa/estate CTA → `etouri.reserve-online.net` with `room=WH200|WH201|WH202|WH203|WH2142`.
Params: `checkin` (**YYYY-MM-DD**, required to auto-launch) · `nights` **OR** `checkout`, never both · `adults` · `children` (**count only**) · `rooms` · `room` · `currency`.
**Per-child ages are not a WebHotelier parameter. Do not build an ages UI.**

**Disputed headline numbers (`TODO.md` T-001 … T-007)** — every one of these renders through the Figure component (§6.2): villa count 4 vs 5 · estate bathrooms 6 / 9 / 12 · estate capacity 18 vs 24 · estate pools 4 vs 5 · beach distance 50 m vs "a few meters" · pool heating €35/day. **Every headline number on the Entire Estate page is currently disputed.** That page is the Figure component's proving ground, not an edge case.

---

## 1. THE IDEA

**Thesis.** *Living Unlimited* is not a line in the footer — it is the grammar the whole site speaks: every headline on Thalasses is a gerund set large in cut-stone serif, followed by a small letterspaced tail, sharing one baseline, never closed by a full stop. The tail is never a mood or an adjective; it is always a **verifiable fact from this property or this coast** — a distance, a material, a named beach, a room, a floor — so the identity cannot be written badly and cannot be lifted onto a coastline that is not this one. Beneath the words, every photograph on the site is locked to a single waterline that never moves, so the pictures change while the sea holds still.

**What it should make someone feel in five seconds.** That they have opened a book, not a booking site. Two or three enormous words of carved serif over one still photograph of water; no video, no carousel arrows, no gold, no scroll cue, no cookie wall shouting first. A sentence that starts and does not finish. The distinct sense that somebody decided what to leave out — and that the place being described is a specific one, at sea level, fifty metres from the water, in Crete.

---

## 2. THE SIGNATURE ELEMENT — THE UNCLOSED CLAUSE

One construction. Five scales. No exceptions anywhere on the site.

### 2.1 Structure

```
[GERUND]                    [TAIL]
Marcellus 400               Inter 500, uppercase
display size                12–13px, tracked open
sentence case               no punctuation, ever
        └───── one shared baseline, gap = 1 cap-height ─────┘
```

- No slash, no dash, no rule, no colon between the two parts. **The gap is the punctuation.**
- **No clause on this site ever ends in a full stop.** Not one. This is the rule that makes "unlimited" structural instead of decorative, and it is enforced by the `<Clause>` component, which strips terminal punctuation and throws in development.

### 2.2 The grammar rule — the thing that makes it Thalasses's and nobody else's

> **The gerund is an act of living. The tail is a fact you could check.**

A tail must be drawn from one of five registers, all of which exist in the source content:

| Register | Source | Example tails |
|---|---|---|
| **Distance** | `location.json`, `specs.distanceToBeach` | `FIFTY METRES` · `EIGHT KILOMETRES EAST` · `SOUTH, FORTY MINUTES` |
| **Material** | villa `longDescription` | `IN GREEK WHITE MARBLE` · `ON COCOMAT, UNDER SCHÜCO` · `ON EMU, BY PAOLA NAVONE` |
| **Place** | `location.json` `nearby[]` | `AMMOUDAKI, THEN KLISIDI, BY DIVE` · `PIGIANOS KAMPOS` |
| **Position** | `specs.floors`, `specs.view` | `AT SEA LEVEL, GROUND FLOOR` · `FROM THE UPPER FLOOR` |
| **Count** | `facilities/*.json`, `specs` | `ALL ONE HUNDRED AND FIFTEEN` · `ALL FOUR, ONE GATE` |

**Banned outright, enforced in the CMS:** adjectives, moods, superlatives, and anything unverifiable. `Living BEAUTIFULLY`, `Waking REFRESHED`, `Breathing FREELY` are rejected at authoring time. The CMS clause field validates the tail against a **fact registry** compiled at build time from `content/` — a tail that does not resolve to a fact in the registry fails the build.

This is the load-bearing improvement over the direction as judged. Every judge found the same weakness: *"place-specificity is a copywriting deliverable, not a design property — it evaporates the first time a junior writes a tail."* Binding the tail to a validated fact registry converts it from a copywriting deliverable into a **data binding**. A junior cannot write a bad tail, because a bad tail does not compile.

It also kills gerund fatigue, which was the second-most-cited risk. Because the tail carries the weight, the gerund is allowed to be plain — `Waking`, `Eating`, `Swimming`, `Gathering`. The preciousness lived in decorated gerunds compensating for empty tails.

### 2.3 The clause set (written and locked as part of delivery)

| Where | Clause |
|---|---|
| Home hero | **Living**  UNLIMITED |
| Home, the estate | **Standing**  FIFTY METRES FROM THE WATER |
| Villa I — Thoi | **Waking**  AT SEA LEVEL, GROUND FLOOR |
| Villa II — Persi | **Bathing**  IN THE LARGEST BATHROOM |
| Villa III — Eeanthe | **Waking**  ON THE UPPER FLOOR, THREE ROOMS |
| Villa IV — Melia | **Stepping**  FROM BED INTO THE POOL |
| The Entire Estate | **Gathering**  ALL FOUR, ONE GATE |
| Weddings & Events | **Marrying**  ON SAND, BESIDE 150 SQUARE METRES |
| Experiences index | **Asking**  FOR ANY OF THE FOLLOWING |
| The Inventory | **Living**  ALL ONE HUNDRED AND FIFTEEN |
| Location | **Wandering**  SOUTH, FORTY MINUTES |
| Ammoudaki row | **Swimming**  AMMOUDAKI, THEN KLISIDI, BY DIVE |
| Massage (12 words of copy) | **Easing**  IN YOUR OWN SHADE |
| Booking ledger | ARRIVING · NIGHTS · GUESTS · RESERVE *(four tails, no gerund)* |
| Footer, every page | **Living**  UNLIMITED |

Roughly 45 clauses total. They ship written and locked; the CMS enforces a 3-word gerund cap and a 6-word tail cap.

### 2.4 The motion — deliberately demoted

The tail enters closed (`0.02em`) and tracks open to `0.28em` over **1.05s**, `cubic-bezier(0.16, 1, 0.3, 1)`, 12ms per-character stagger.

**Implementation is non-negotiable on three points:**

1. **Never animate `letter-spacing`.** Per-character `<span>`s animate `transform: translateX(index × delta)`. No layout, no CLS.
2. **Accessibility.** The wrapper carries `aria-label={`${gerund} ${tail}`}`; every character span is `aria-hidden="true"` and `user-select: none` is *not* set on the wrapper, so a copy of the clause yields the `aria-label` text via a visually-hidden sibling. Screen readers hear one sentence, not 22 letters.
3. **Overflow.** At C1/C2 the opening tail may extend past the grid's right edge. It is clipped by `.clause-field { overflow: hidden; }` on the **section**, never the document. `document.scrollWidth` must equal `clientWidth` at every breakpoint; this is a Playwright assertion in CI at 360 / 768 / 1024 / 1440 / 1920.

The animation is **the explanation, not the device.** Under `prefers-reduced-motion`, in OG images, in email and in print, the clause renders at final tracking and fades in over 0.25s — and loses nothing, because the device is the grammar.

### 2.5 The silent substrate — The Waterline *(grafted from SEA LEVEL, scoped)*

Beneath the type, a second rule runs everywhere and is never spoken about:

- **The datum is 56% of any full-bleed media block's height.** One CSS custom property, `--datum: 56%`.
- Roughly **110 sea-horizon frames** are hand-tagged with `horizonY` (0–1) in an `image-meta.json` sidecar. Their `object-position` is computed so each photograph's own horizon lands on the datum. Scroll through six consecutive full-bleed frames and the waterline does not move.
- **Zero-gap rule:** two consecutive full-bleed photographs butt together with **no** gap and no divider, always. Whitespace is generous around text and **forbidden between photographs of the sea.**
- **Build assertion:** any image used in a full-bleed `Field` without a `horizonY` fails the build. Non-sea images (interiors, food, detail, all 62 portraits) are never used full-bleed; they carry a manual focal point and live in bounded frames.

**Why this is scoped down from the source direction.** SEA LEVEL priced this as a 704-image tagging job and its own judge called that a content-ops liability. It is not. Only images used full-bleed need a horizon, that is ~110 frames, and the build refuses to ship an untagged one. Bounded ~110 values, enforced by CI.

### 2.6 Where the clause appears

Home hero (C1) · the four villa registers · The Entire Estate set-piece (C1 on `--pelagos`) · every Chapter opener · **every one of the 15 Index rows** (C4) · the six Inventory group names · every named beach on Location · the Weddings opener · the booking ledger's four field labels · 404 · confirmation emails · OG cards · the footer of every page.

### 2.7 Why it is not transferable

Three locks, in ascending strength:

1. **The tagline lock.** The construction is a syntactic reading of *Living Unlimited* — gerund plus boundlessness, never closed. A competitor adopting it adopts Thalasses's tagline.
2. **The fact-registry lock.** The tails are compiled from this property's own data. A Tulum villa cannot write `ON COCOMAT, UNDER SCHÜCO` or `AMMOUDAKI, THEN KLISIDI, BY DIVE`. The identity is *bound to the content*, not applied over it, and it strengthens as content is added rather than diluting.
3. **The waterline lock.** A property that is not on the water has nothing to lock to.

The first two are what the judges asked for. The third is what a mountain lodge or a city hotel physically cannot copy.

---

## 3. PALETTE

Six tokens. **There is no gold, ochre, brass or terracotta in this system, and no token is added later.**

| Token | Hex | Semantic role | Rationale, tied to this coast |
|---|---|---|---|
| `--limestone` | `#E8E9E3` | Page ground. ~80% of surface area. | Limestone dust, not cream. R232 **G233** B227 — green is the highest channel, so it reads as dry Cretan stone in shade. The yellow is pulled to zero deliberately. |
| `--basalt` | `#16262B` | Ink. All body copy and all clauses on light ground. Ground for the booking ledger and footer. | The dark grey-green rock at the tideline. A blue-green near-black, never neutral charcoal — the darkest thing on this site still belongs to the sea. |
| `--pelagos` | `#14535F` | **Interactive + immersive.** Links, active states, focus rings, the 1px datum rule, and the ground of the Entire Estate set-piece. | The Libyan Sea off Rethymno at depth. Doing double duty as the line you follow and the thing you click is the conceptual lock: both are the sea. |
| `--phrygana` | `#545D4E` | Secondary text on light: captions, distances, amenity items, index one-liners. | The grey-green of dry thyme and sea-squill on the slope behind the villas. Replaces the neutral grey a default system would reach for, so even the quietest text comes from the site. Darkened past the pretty value to clear AA at 15px. |
| `--preveli` | `#A4CCC9` | Secondary text, rules and marks on **dark grounds only**. | The chalky pale turquoise of the shallows at Damnoni and Preveli — the source copy's own words: *"the sun rays make the color of the water vivid blue."* **This is the break-out value.** No AI-default luxury palette contains it. |
| `--ammos` | `#E2DACB` | **Surface only.** The Inventory ground and the enquiry card. Never a text colour. | Dry sand above the tideline on the private beach. A stock change, the way a book switches to uncoated paper for its back matter — it signals "this is specification" without a border, a card or a rule. |

### 3.1 Contrast table — every pair the UI uses

Computed with the WCAG 2.x relative-luminance formula. `AAA` ≥ 7:1 · `AA` ≥ 4.5:1 body · `AA large` ≥ 3:1 for ≥24px or ≥19px bold and for non-text UI.

| Foreground on background | Ratio | Verdict | Used for |
|---|---:|---|---|
| `--basalt` on `--limestone` | **12.77:1** | AAA | All body copy, all clauses, all display type |
| `--pelagos` on `--limestone` | **7.07:1** | AAA | Links, active states, focus rings, the datum rule |
| `--phrygana` on `--limestone` | **5.63:1** | AA | Captions, distances, index one-liners, item names |
| `--basalt` on `--ammos` | **11.23:1** | AAA | Inventory item names, enquiry card body |
| `--pelagos` on `--ammos` | **6.22:1** | AA | Inventory interactive items, expand controls |
| `--phrygana` on `--ammos` | **4.95:1** | AA | Inventory group labels, inline descriptions |
| `--limestone` on `--basalt` | **12.77:1** | AAA | Booking ledger, footer |
| `--preveli` on `--basalt` | **8.96:1** | AAA | Ledger secondary text, focus underline, datum rule on dark |
| `--ammos` on `--basalt` | **11.23:1** | AAA | Footer captions |
| `--limestone` on `--pelagos` | **7.07:1** | AAA | Entire Estate copy |
| `--preveli` on `--pelagos` | **4.96:1** | AA | Entire Estate secondary text and marks |
| `--ammos` on `--pelagos` | **6.22:1** | AA | Entire Estate captions |
| `--limestone` on scrim `#576366` | **5.08:1** | AA | Type over photographs — **absolute worst case** (see §3.2) |

**Bans, derived from the arithmetic — not from taste:**

| Forbidden pair | Ratio | Rule |
|---|---:|---|
| `--preveli` on `--limestone` | 1.43:1 | `--preveli` may not appear on any light ground. Dark grounds only. |
| `--preveli` on `--ammos` | 1.25:1 | as above |
| `--phrygana` on `--basalt` | 2.27:1 | Secondary text on dark is `--preveli`, never `--phrygana`. |
| `--phrygana` on `--pelagos` | 1.26:1 | as above |
| `--pelagos` on `--basalt` | 1.81:1 | The datum rule on dark is `--preveli`, not `--pelagos`. |
| `--ammos` on `--limestone` | 1.14:1 | `--ammos` is a surface, never text. |
| `--preveli` over a photograph scrim | 3.57:1 | Type over photographs is `--limestone` only. |

Enforced by a stylelint rule keyed to token pairs, not by documentation.

### 3.2 Type over 704 uncontrolled photographs

Every `Field` (full-bleed photograph) carries an **unconditional** linear scrim: `--basalt` from `alpha 0` at 38% height to `alpha 0.72` at 100%. Display type sits only in the zone below 62% height.

At `alpha 0.72` over a **pure white** image the composite is `#576366`, and `--limestone` on it is **5.08:1 — AA body.** That is the worst case that can physically occur. Real photographs land between 8:1 and 14:1. No per-image luminance analysis is required to guarantee AA, which is why the scrim is unconditional rather than tuned.

### 3.3 Focus, and colour as a sole cue

Focus ring: `2px --pelagos` with `2px --limestone` offset on light (7.07:1), `2px --preveli` with `2px --basalt` offset on dark (8.96:1). Both far exceed the 3:1 non-text threshold.

**No state anywhere on this site is signalled by colour alone.** Every active/marked state carries at least two cues: a colour change *plus* a 1.5px underline appearing, a tracking change, or `aria-current`. The site is fully usable by someone who perceives no colour difference at all.

### 3.4 How this avoids the three banned defaults

**(a) Warm cream + terracotta serif — avoided structurally, not by restraint.** Every candidate direction in Phase 1 produced a dark-ochre accent (`#B4863C`, `#9A7230`, `#A87C3E`, `#755823`) and every one of them conceded in writing that it was terracotta with the hue rotated, policed only by a lint rule that would die in month four. **This system deletes the accent slot.** There is no warm accent token to lighten, warm or promote. The interactive colour is the sea, which passes AA at every size and therefore needs no policing. `--ammos` is the only warm value and it is structurally incapable of becoming an accent because it fails contrast against every ground (1.14:1 on limestone) — it can only ever be a surface. The failure mode is closed by construction.

**(b) Near-black + single acid accent — avoided.** `--basalt #16262B` is a blue-green rock colour, not neutral charcoal, and there is no acid, no neon, no single bright hue. The two chromatic values are both water: `--pelagos` at depth and `--preveli` in the shallows.

**(c) Broadsheet / hairline rules — avoided.** There is not one horizontal rule anywhere on the public site. Sections are separated by space (96–220px). Where a divider seems necessary, the answer is 152px of `--limestone`, or a change of stock to `--ammos`. The only permitted 1px elements are the datum rule and the 1.5px focus underline in the ledger — both of which are the signature, not furniture.

**Honest note on convergence:** the ground and the ink *are* convergent with all four Phase-1 palettes, within a few RGB points. That is defended in §9, not hidden.

---

## 4. TYPOGRAPHY

### 4.1 Display serif — **Marcellus** (400, the only weight)

Marcellus descends from Roman inscriptional capitals: letters **cut into stone**, not written with a pen. That lineage is the literal material of this place — Cretan limestone, whitewashed masonry, Greek white marble named in the client's own copy.

**Against Cormorant Garamond:** it is the default serif of the luxury-villa and wedding-stationery industry, and its hairlines dissolve at 15–20px on a phone at 60% brightness in Mediterranean sun — a perceptual-contrast failure that no ratio table catches.

**Against Fraunces:** Fraunces plus a warm neutral *is* banned default (a). Its SOFT and WONK axes give it a chatty artisan-brand voice; this brand must be silent. (The one genuinely good argument for Fraunces — its optical-size axis — is answered here by using only four display sizes with hand-set tracking per size, which is the same correction applied manually and predictably.)

**The single weight is load-bearing, not a regret.** With no bold and no italic available, hierarchy can only be built from scale, space, case and tracking. **The typeface physically cannot shout.** Enforced by lint: `font-weight` and `font-style` may not be assigned to any element using the display face, and the display face may not be set below **28px**.

**Honest note:** three of four Phase-1 directions independently chose Marcellus with the identical justification. When three independent processes reach the same face by the same argument, it is the default rather than a decision. It is still the right answer, and §9 says so plainly rather than dressing it up.

### 4.2 Body sans — **Inter** (variable, weights 400–500 only)

Chosen over Instrument Sans for one functional reason: this site is a measuring instrument — 50 m, 8 km, 40 min, 60 m², 150 m², 115 provisions, 4 nights, 2 adults, WH200. Inter's `tabular-nums` with tight vertical metrics let figures set in columns that do not shift when a value changes — **including when a value swaps to a qualitative `[CONFIRM]` fallback.**

### 4.3 The scale

**Marcellus 400 — display. Six words per screen, maximum.**

| Name | Size | Line-height | Tracking | Usage |
|---|---|---|---|---|
| **C1** | `clamp(4rem, 12vw, 14rem)` → 64–224px | 0.87 | −0.022em | Home hero, Entire Estate, Weddings opener |
| **C2** | `clamp(2.75rem, 7vw, 7.5rem)` → 44–120px | 0.92 | −0.016em | Section clauses, Chapter openers, Inventory opener |
| **C3** | `clamp(2rem, 3.4vw, 3.25rem)` → 32–52px | 1.00 | −0.010em | Villa names, Chapter titles, Inventory group names |
| **C4** | `clamp(1.75rem, 2.1vw, 2rem)` → 28–32px | 1.08 | −0.005em | Index rows, beach names |

**Inter — everything else.**

| Name | Size | Line-height | Tracking | Usage |
|---|---|---|---|---|
| Lede | `clamp(1.125rem, 1.4vw, 1.375rem)` → 18–22px | 1.45 | −0.006em | Standfirsts, expanded index rows. Measure 46ch |
| Body | `1.0625rem` (17px; 16.5px < 768) | 1.68 | 0 | All prose. Measure 62ch |
| Small | `0.9375rem` (15px) | 1.62 | 0 | Inventory items, specs |
| Caption | `0.8125rem` (13px) | 1.5 | +0.01em | Photo captions (the 96 real ones), inline descriptions |
| Datum | `0.875rem` (14px) | 1.2 | 0 | Every figure on the site. `tabular-nums lining-nums`, weight 500 |
| Tail | `0.75rem` (12px); **13px at C1/C2** | 1.0 | +0.22em open (+0.30em at C1/C2) / +0.02em closed | Clause tails and micro-labels |

**The silent register.** Nothing on this site is set between **22px and 28px**. Inter tops out at 22; Marcellus floors at 28. That gap is why the page reads as editorial rather than as a continuous CMS ramp — a middle display register is exactly where template design lives.

**The optical spine.** C1's gerund and its 13px tail differ by a factor of **17**. That ratio is the visual system.

**Numerals.** Every figure — distances, m², sleeps, nights, counts, prices, room codes — is Inter with `font-variant-numeric: tabular-nums lining-nums`. This is the only reason four near-identical spec blocks read as a considered set instead of a repeated card, and the only reason a `[CONFIRM]` swap causes zero reflow.

### 4.4 Micro-labels

Inter 500, **12px** (a deliberate floor — 11px letterspaced uppercase is at the edge of comfortable reading for a significant share of this audience), uppercase, `+0.22em`, `--phrygana` on light, `--preveli` on dark.

**Four permitted uses, no fifth:** clause tails · section eyebrows · Inventory group and subgroup labels · booking ledger field labels.

**Hard rule:** a micro-label may never be the only place a piece of task-critical information appears. Anything a guest needs in order to book, understand a price, or find a villa is duplicated at body size.

*Acknowledged:* letterspaced uppercase micro-labels are themselves a 2020s house style. The response is rationing (four uses), the 12px floor, and never using them as decorative garnish on a card — not pretending the pattern is fresh.

### 4.5 Loading

Marcellus subset to `latin` + `latin-ext`, preloaded, single woff2 (~24 KB). Inter variable, axis clipped 400–500 (~42 KB). Two files. `font-display: swap` with a `size-adjust`-corrected Georgia fallback metric-matched to Marcellus, so the C1 hero does not reflow on swap. **CLS budget: 0.**

---

## 5. LAYOUT SYSTEM

### 5.1 Grid

12 columns · max-width **1560px** · gutter **32px** · page margin `clamp(1.25rem, 4.5vw, 6rem)` → 20–96px.

Five named fields. Every section on the site is assembled from these and nothing else:

| Field | Columns | Contents |
|---|---|---|
| `field-clause` | 1–7 | Display clauses. **Always.** |
| `field-prose` | 8–12 | Body copy. **Always.** |
| `field-plate` | 7–12 | Bounded images, bleeding right |
| `field-index` | 1–12 | The Register, the Inventory |
| `field-full` | edge-to-edge | Photographs (Field), the Estate, the Waterline runs |

### 5.2 The one structural law

> **A clause and its prose never share columns, and prose begins at least two spacing steps below the clause's baseline.**

Your eye lands top-left on six words of Marcellus, then drops right and down into 17px Inter. That diagonal repeats on every page, at every scale, without exception. It is why a scroll through Thalasses feels like turning pages rather than passing modules.

### 5.3 Spacing and section rhythm

8px base. Steps: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 72 / 104 / 152 / 220`.

Section rhythm is **relational, not numeric** — the spacing between two sections is a function of what they are:

| Transition | Space |
|---|---|
| Prose → Prose | `clamp(6rem, 12vw, 13.75rem)` → 96–220px |
| Prose → Photograph | `clamp(4.5rem, 9vw, 9.5rem)` → 72–152px |
| Photograph → Prose | `clamp(3rem, 6.5vw, 6.5rem)` → 48–104px |
| **Photograph → Photograph** | **0. Always. No divider, no exception.** |

That last row is the rule with teeth. Two photographs of the sea may never be separated by limestone, or the horizon breaks. It converts "220px of whitespace" from a taste preference into an enforceable system rule.

### 5.4 Breakpoints

| Width | Grid | Margin | C1 | Behaviour |
|---|---|---|---|---|
| **360** | 1 col | 20px | 64px | Tail moves **below** the gerund, left-aligned to its stem, gap 0.75 cap-height. Ledger collapses to `DATES · GUESTS` + `RESERVE`. Inventory `find:` filter promoted above the group rail. |
| **768** | 6 col | 32px | 88px | Two-up permitted for the villa register. Index rows keep expand-in-place. |
| **1024** | 12 col | 48px | 128px | `field-clause` / `field-prose` split activates. Sticky Inventory group rail appears. |
| **1440** | 12 col | 80px | 184px | Full canon. Chapter photograph runs go edge-to-edge. |
| **1920** | 12 col | 96px, container capped 1560 | 224px | Margins grow, content does not. Photographs still full-bleed. |

Mobile is designed at 390px first, not derived. At 360 the C1 hero occupies about four lines and ~40% of the viewport, and **that is correct** — the type is the design; shrinking it to be polite would delete the direction on the majority of traffic.

### 5.5 Homepage construction

The judges' sharpest structural criticism was that six of eight homepage beats were generic. Four are rethought here; the two kept are re-argued in §9.

| # | Beat | What it is |
|---|---|---|
| 01 | **Hero** | `field-full`, one **still** photograph (never video, never a slider — `site.json` shows hero slides 2–6 have no copy anyway, T-036). C1 clause bottom-left, baseline at 62vh. Ledger already present, already open. No scroll cue. |
| 02 | **Statement** | `field-clause` C2 + `field-prose` lede. No image. 220px of air above and below. The site's first breath. |
| 03 | **The Position** *(rethought)* | Not four bands. One **horizon-locked run** of three full-bleed frames at zero gap — sea, private beach, terrace — during which the waterline does not move and a single C2 clause holds: **Standing  FIFTY METRES FROM THE WATER**. This is where the substrate is felt without being explained. |
| 04 | **The Collection** *(rethought)* | Two rows, not four cards. Front row (Thoi, Persi) at the lower line; rear row (Eeanthe, Melia) above it. See §6.1. |
| 05 | **The Entire Estate** | `field-full` on `--pelagos`. The site's single GSAP set-piece. See §6.2. |
| 06 | **Experiences** | The Register — 15 clause rows + 4 Chapter links. See §6.3. |
| 07 | **Location** *(rethought)* | The Coast Line, not map-left/list-right. See §6.5. |
| 08 | **Weddings & Events** | The 150 m² saltwater pool at `field-full`, one C2 clause, one link. |
| 09 | **Footer** | `--basalt`. **Living  UNLIMITED** at C2, quietly, at the bottom of every page. |

Between 03 and 04 the CN Traveller mark sits as an image-only link. **No fabricated pull-quote** — `TODO.md` T-031 confirms no quote, award name or date exists. It renders as the mark alone, with an `aria-label` naming the destination, until the client sources the wording.

### 5.6 Villa page construction

Hero → clause statement → **The Run** (gallery) → position on the estate → The Inventory → related experiences → ledger.

The same seven beats on every villa page, so a guest comparing Thoi and Melia compares **photographs and one sentence**, not layouts.

**The Run** replaces the snap-scroll gallery. It is a vertical, horizon-locked, zero-gap sequence of full-bleed frames at 78svh with a continuous waterline, interrupted only where a bounded interior frame is warranted. The 96 real captions from `captions.json` are attached where they exist, set at 13px `--phrygana` in the left margin; images without a real caption get **no caption at all** — an empty caption slot is never rendered.

---

## 6. THE FOUR HARD COMPONENTS

### 6.1 The Collection — four near-identical villas, differentiated without numbers

The four villas are 2/1/5/60, 2/1/5/60, 3/2/6/60, 2/2/4/60. Any layout that leads on those numbers is lying about what distinguishes them.

**They are differentiated by position and by one verified fact each.** Both come from the source prose, not from invention.

```
                 ┌──────────────────────┬──────────────────────┐
  UPPER ROW      │  III. EEANTHE        │  IV. MELIA           │   two-storey
  (rear)         │  Waking              │  Stepping            │   sea from the
                 │  ON THE UPPER FLOOR, │  FROM BED INTO       │   first floor
                 │  THREE ROOMS         │  THE POOL            │
                 └──────────────────────┴──────────────────────┘
  ── datum ──────────────────────────────────────────────────────────────────
                 ┌──────────────────────┬──────────────────────┐
  LOWER ROW      │  I. THOI             │  II. PERSI           │   single-storey
  (front)        │  Waking              │  Bathing             │   sea at eye
                 │  AT SEA LEVEL,       │  IN THE LARGEST      │   level
                 │  GROUND FLOOR        │  BATHROOM            │
                 └──────────────────────┴──────────────────────┘
  ═══ sea ═══════════════════════════════════════════════════════════════════
```

**Specification**

- Two rows of two, not four bands. The lower row sits **below** the datum line; the upper row **above** it. The datum rule (1px `--pelagos`) runs between them and is the same line that appears in the hero and on the top edge of the ledger.
- Each cell: one photograph at 4:3 (native — no crop policy bans any aspect ratio), the ordinal in tabular Inter 14px `--phrygana`, the villa name at C3, and the clause at C4 beneath it.
- **No spec table, no icons, no badges, no "from €" strip.** The bed/bath/sleeps figures appear once, in the ledger's left slot, when you are on that villa's page.
- The verified facts behind the four clauses are printed **once**, in prose, on the estate page — not repeated as chips on every card:
  > *Thoi and Persi stand on the front row, single-storey, the sea at eye level. Eeanthe and Melia stand behind them, two-storey, the sea arriving at the first-floor bedrooms and balcony. Persi has the largest bathroom; Thoi has a hydro-massage shower and no bath; Eeanthe adds a third bedroom; Melia's ground-floor bedroom opens straight onto the pool.*

**Why this is not the generic four-band layout.** The generic version alternates image-left/image-right and repeats a spec block. This version encodes the estate's actual geometry, uses the datum as a real spatial axis, and gives each villa one non-transferable sentence drawn from its own long copy. It also fails safely: if the client later confirms different positions, the rows change and nothing else does.

**Mobile (360–767):** the two rows stack as four full-bleed frames at 68svh, front pair first, with the datum rule persisting between rows 2 and 3 so the front/rear split survives the collapse. The ordinal and clause sit below the fold of each frame, over the scrim.

### 6.2 The Entire Estate — the crown piece

`/the-estate` and homepage beat 05.

**Why it reads as the crown, mechanically — four devices used nowhere else:**

1. **It is the only `--pelagos` ground on the site.** Deep sea appears as an immersive surface exactly once. Scarcity is the entire argument; if `--pelagos` were the nav colour it would be worthless.
2. **It is the only place all four villas appear in one frame.**
3. **It breaks the collection rhythm.** It is not a fifth card in a row of four — it is the register *below* them, full-bleed, holding all four.
4. **It is the site's only GSAP set-piece** (§8.3).

No gold border, no "exclusive" badge, no crown iconography, no ribbon. The status is expressed by exclusivity of treatment, which is the only luxury signal that cannot be faked.

**Clause:** **Gathering  ALL FOUR, ONE GATE**

#### 6.2.1 The Figure component — `[CONFIRM]` degradation *(grafted from In Antis)*

Every headline number on this page is currently disputed (`TODO.md` T-001 … T-004). This page is therefore the component's proving ground.

An unconfirmed figure **never** renders a placeholder glyph, an en-dash, "TBC", a tooltip or an empty box. It renders a **qualitative equivalent at the same grid width**, with tabular numerals reserving the space:

```tsx
<Figure
  value={9} unit="bedrooms"
  confirmed={false}
  fallback="Nine bedrooms across four houses"
  confirmRef="T-002"
/>
```

| Confirmed | Renders | Unconfirmed | Renders |
|---|---|---|---|
| `50 m from the water` | `50 m from the water` | — | `Steps from the water` |
| `Sleeps 20` | `Sleeps 20` | — | `Room for a large party` |
| `€35 per day` | `€35 per day` | — | `A daily charge, on request` |

The unconfirmed state is visible **only in the CMS**, as a `--pelagos` edge on the cell. A missing number costs the page nothing visually. This is strictly better than the winning direction's own answer — a tabular en-dash — which its author conceded "still looks like a bug" and is "a conversion problem, not a design one."

**Recomputed honest estate figures** (Villa Pueblo excluded from the public collection): **4 villas · 9 bedrooms · 6 bathrooms · sleeps 20 · 4 pools.** All five render through `<Figure confirmed={false}>` until T-001 … T-004 are answered. The legacy copy claiming "five villas / 12 bedrooms / 24 guests / 9 bathrooms" counts Pueblo and **is not published.**

**Booking:** the estate deep-links with `room=WH2142` to `etouri.reserve-online.net`. Per `TODO.md` T-013/T-014, whether whole-estate is genuinely bookable through that path is unverified, so the estate CTA renders as **"Reserve the estate"** when `booking.hasWidget` is true and falls back to **"Enquire"** into the concierge form when it is not — a single prop, decided by data, not by a hard-coded assumption.

### 6.3 Experiences — the two-tier system

The honest problem is not short copy. It is that **15 of 21 experiences have exactly one photograph**, and of the five with a real gallery, three have under 55 words. No carousel, no cinematic chapter and no photo essay can be built on one image.

#### 6.3.1 The gate — arithmetic, not judgement

> **A Chapter requires `images.length >= 6`. Nothing else promotes.**

Words are **not** the gate, because a Chapter here is a *photograph* essay: its spine is the image run, and the prose is one column sized to whatever copy exists. This is deliberately different from every Phase-1 proposal, all of which gated on words and then specified templates with three-image blocks for experiences that have one image.

Result — **five Chapters:** Dream Wedding (288w / 21 images, which becomes `/weddings`), Private Chef (31 / 13), Exclusive Tour (20 / 13), Organic Farm (53 / 9), Private Helipad (41 / 9).

**Second-stage promotion:** at `words >= 120`, a Chapter gains a second text field — a pull clause and a second prose column. The template **grows with the copy** rather than starting with holes in it. Today exactly one experience (Dream Wedding, 288w) triggers it.

This is a build-time assertion in `scripts/assert-content.ts`, not a CMS toggle. The build fails if a Chapter route exists for an experience with fewer than six images, and the assertion emits `content-commission.json` — the client's copy-and-photography shopping list — as a by-product.

#### 6.3.2 The Chapter template

`field-full` opening photograph (horizon-locked if it has a horizon) → C2 clause → lede at 46ch → the image run as a zero-gap horizon-locked sequence → captions from `captions.json` where real ones exist, omitted entirely where they do not → an `Ask us` ledger.

There are no other blocks. A Chapter cannot render half-empty because it has no slots to leave empty.

#### 6.3.3 The Register — the 15 compact experiences

Not cards. Not a grid. Not an accordion behind a chevron. **One typeset index, and every row is a clause.**

```
Sea
  Sailing      THE COAST, AS LONG AS YOU LIKE                    ← 78 words
  Diving       DAMNONI, WITH A CENTRE ON THE BEACH               ← 50 words
  Riding       THE WATER, BY JET SKI                             ← 71 words
Land
  Walking      THE GORGE, FROM THE GATE                          ← merged Hiking + Running
  Driving      THE ISLAND, BY JEEP OR QUAD
Taste
  Cooking      WHAT THE ISLAND GROWS                             ← 82 words
  Tasting      WHAT THE ISLAND PRESSES
Wellness
  Easing       IN YOUR OWN SHADE                                 ← 12 words
```

- Grouped under the five real categories in `categoryProposed`: **Sea · Land · Taste · Wellness · Service**.
- Every row is C4 (28–32px). **Chapters appear in the same Register**, at C3 (32–52px) and as links. **Scale is the only difference in the resting state.** A compact row is not a Chapter with pieces missing; it is a smaller line of the same object.
- Nothing is greyed out. Nothing says "read more" and then doesn't. No empty image slot, because the format never promised one.

**Compact rows never navigate.** Tapping or activating a row **expands it in place**: the row grows to show its one real sentence at lede size in `field-clause`, its single photograph in `field-plate`, and an `Ask us` tail that opens the enquiry drawer pre-filled with the experience. 0.55s height animation, `aria-expanded`, real `<button>`.

This is the most important decision in the system, and it is a content decision disguised as an interaction: **fifteen thin URLs are never created.** Nobody lands on a 12-word page from Google. Every Phase-1 alternative built a "different complete template" for the compact detail page — which means fifteen crawlable one-sentence pages, the exact "looks unfinished" failure, relocated to organic search where it does the most damage.

**Why a 12-word entry looks complete:** an index entry is *supposed* to be one line. A card is a container with a hole in it; a typeset line is finished. The naming does the rest — the source copy literally says *"Ask us for routs in Crete"*, so the section is titled **On Request** and brevity reads as discretion. At Aman you do not read a page about massage; you ask.

**A row whose copy is good is rewarded without needing photographs.** Cretan Cuisine (82 words) expands taller than Massage (12 words). The expansion is a text field, not a template with slots, so length is honest rather than padded.

**Content rules the design enforces at build time:**
- Adjacent rows may not carry identical copy. **Hiking and Running currently ship the same sentence (`TODO.md` T-044)** — they merge into one row, `Walking  THE GORGE, FROM THE GATE`, until distinct copy exists. The assertion fails the build if the duplication returns unmerged.
- Wine Tasting and Wine Production overlap heavily (T-045); they sit adjacent under Taste with distinct tails, flagged for the client to merge or differentiate.

**Mobile — the fix for the judges' most-repeated criticism.** Three of four Phase-1 directions put their best component behind a desktop hover driving an image in an empty margin, degrading on touch to a stacked list. **There is no hover in this system at all.** Expand-in-place is the interaction on every device, identical on desktop, touch and keyboard. On desktop, hovering a row does exactly one thing: draws a 1.5px `--pelagos` underline under the gerund. Nothing is revealed by hover that is not reachable by tap or key.

#### 6.3.4 Weddings & Events

`/weddings` is a top-level page, not an experience. Built from: the 150 m² saltwater pool (`villas/rituals.json`), the Dream Wedding Chapter's 288 words and 21 photographs, the Rituals gallery's 31 images, and video `7VWaiDAWPdY`.

`A Moment of Fairytale` (`nuSIWyTiwBU`) renders as a **poster frame + a 12px `PLAY` tail**. Never autoplay, never a muted background loop. It carries **no description**, because per `TODO.md` T-028 none exists — and a video card with a real title and no invented blurb is complete; a card with generated filler is not.

**Removed before publication:** the stale promise *"a new villa suitable for 6 guests to be completed by May 2023"* (T-009).

### 6.4 The Inventory — ~130 amenities as a designed moment

The real shape (Villa Thoi): **139 items · 6 domains · 28 groups · 29 with descriptions · 8 unresolved enum ids.** The distribution is violently uneven — Amenities 65, Entertainment/Activities 40, Safety 17, Cleaning 12, Children **3**, Environment **2**. Six equal tabs, six equal accordions or a 6-up grid all break on contact, because two domains have three items and two items. **Any layout that treats the domains as peers is lying about the data.**

#### 6.4.1 First, an editorial cut *(grafted from In Antis, verified exactly)*

Three groups inside Entertainment/Activities are not contents of a 60 m² villa:

| Group | Items | Examples |
|---|---:|---|
| Sports and Adventure | 15 | Mountain Climbing, Sailing, Wind Surfing, Caving |
| Attractions | 5 | Museums, Theme Parks, Water Parks, Winery Tours |
| Leisure | 4 | Bird Watching, Eco Tourism, Horseback Riding |

**24 rows** move off the villa page entirely and become **"Beyond the Gate"** on the Location page, next to the named beaches, where they are actually true. Villa Thoi's inventory drops **139 → 115**, and every remaining line is defensible. Per property: Thoi 139→115 · Persi 134→111 (its Sports group has 14, not 15) · Eeanthe 137→113 · Melia 136→112 · Estate 127→103.

This is editing, not design — and it is the highest-leverage move available, because it removes a quarter of the problem before any layout work begins.

#### 6.4.2 The six groups, as clauses

The navigation speaks the site's grammar. The tail is the count, which is the most factual tail available.

| Clause | Count | Source domain |
|---|---:|---|
| **Living** | 65 | Amenities |
| **Playing** | 16 | Entertainment (15) + Relaxation (1) |
| **Minding** | 3 | Children |
| **Keeping** | 12 | Cleaning |
| **Guarding** | 17 | Safety / Security |
| **Tempering** | 2 | Environment / Heating-Cooling |

Gerund at C4, count in Inter tabular numerals `--phrygana`, right-aligned so all six figures form a clean vertical stack. Active group carries three cues: a 1.5px `--pelagos` underline, the tail tracking open, and `aria-current="true"`.

**`Minding 3` and `Tempering 2` are shown at full dignity.** An honest, tiny number in a beautiful setting reads as candour. Hiding them behind a padded tab reads as concealment. This is the direct answer to the uneven distribution: the design does not pretend the domains are peers, it *prints* that they are not.

#### 6.4.3 The reading — CSS multi-column **flow**, not a grid *(grafted from FOLIO)*

The single most important technical decision here: `columns: 3` (1 at <768, 2 at 768–1023), with `break-inside: avoid` on every subgroup block and `break-after: avoid-column` on every subgroup heading.

**A 2-item group in a column flow is two lines. A 2-item cell in a 6-up grid is visibly broken.** The flow is why the uneven distribution stops being a layout problem at all.

Within a group: subgroup name as a 12px `+0.22em` `--phrygana` micro-label, items beneath in Inter 15px `--basalt`, line-height 1.75, **no bullets, no borders, no cards, no checkmarks.**

**Presence is expressed by the item simply being printed.** If it is in the Inventory, it is there.

**All 139 FontAwesome icon classes are discarded.** Nothing kills the Bootstrap-travel-theme look faster than deleting the icon grid, and `fa-solid fa-knife-kitchen` communicates nothing to a screen reader that the word "Kitchen" does not.

#### 6.4.4 Data-literate item rendering *(grafted from FOLIO)*

The source data ships broken rows, as its own `_note` field admits. Four rules:

| `featureType` | Count (Thoi) | Rendering |
|---|---:|---|
| 5 / 6 (boolean) | 125 | Name only, as plain text |
| 1 / 2 (numeric) | 6 | `Bedrooms · 2` with the figure in tabular Inter |
| 7 (unresolved enum) | **8** | **Omitted silently.** Never printed as an id, never as a blank row. |
| any, with `description` or `extraDescription` | **29** | Interactive — see below |

Without the `featureType 7` guard, this page would ship eight visible enum-id or empty rows per villa directly under a headline claiming completeness. Four lines of code; a launch-day bug otherwise.

**The 29 items with descriptions are the only interactive ones.** Each is a real `<button aria-expanded>` with a 1px dotted `--phrygana` underline at 40%. Activating one — by hover, focus **or** tap, all three — pushes the line down and sets the description beneath in 13px `--phrygana` over 0.35s.

**No floating tooltips.** They fail on touch and fail assistive tech, and there are 29 of them. Nothing floats; nothing is hidden behind a hover a phone cannot perform.

Because "has a description" is encoded partly by colour, it carries three redundant cues: the dotted underline, real button semantics, and a visible focus ring. A screen reader hears *"Essentials, button, collapsed."*

#### 6.4.5 The opener, the filter, and mobile — designed, not deferred

**Opener.** C2 clause **Living  ALL ONE HUNDRED AND FIFTEEN**, with 115 as the only large numeral on the page (through `<Figure>`, so it recomputes per villa: **Thoi 115 · Persi 111 · Eeanthe 113 · Melia 112 · Estate 103** — Persi's Sports and Adventure group carries 14 items, not 15, so its cut is 23). Beneath it in 15px: *"Counted, not summarised."* The old site showed 65 of 139. Printing the real count **is** the design statement.

**The filter.** One `find:` field, live-filtering all 115 items and their descriptions. Type `cot`, `kayak`, `wifi`. `aria-live="polite"` announces the result count. This is the fastest path to an answer and it costs one input.

**Mobile (360–767) — specified, because every Phase-1 direction deferred this and the traffic is here:**

1. `find:` is promoted **above** the group rail. On a phone, search beats browse.
2. The six group clauses become a **horizontally snap-scrolled row** of gerunds + counts, sticky at the top, `overflow-x: auto` with `scroll-snap-type: x mandatory`. It is the one horizontal scroller on the site and it holds six items, not fifteen.
3. Items run **single column**, 15px, line-height 1.75, with the subgroup micro-label sticky beneath the group rail — so you always know which of the six you are inside and which subgroup you are reading.
4. The 24-row editorial cut plus the filter brings the longest group (Living, 65 items across 11 subgroups) to roughly **five screens**, not eleven.

It is still a long scroll. That is honest: 115 provisions is a long list, and the design's job is to make it navigable and beautiful, not to pretend it is short.

#### 6.4.6 Across the four villas

The four inventories differ by 3–5 items. **There is no comparison table anywhere on this site.** The difference is stated once, in prose, at C3 on the estate page:

> *Eeanthe adds a third bedroom and a second bath. Melia adds a second bath. Persi has the largest bathroom. Thoi has a hydro-massage shower and no bath.*

Four identical 139-item lists would be an act of vandalism against the reader.

### 6.5 Location — The Coast Line *(rethought)*

Not map-left / list-right. The datum becomes the coastline axis and the beaches hang off it:

- Beaches with a real distance (**private beach 50 m**, **Rethymno 8 km**) are plotted at true relative position along the axis.
- The nine without a distance hang at their **qualitative** position — the south-coast group (Schinaria, Triopetra, Agios Pavlos, Preveli, Plakias) clustered at `SOUTH, FORTY MINUTES`, which is exactly what the source says. **The `[CONFIRM]` fallback becomes the layout**, rather than nine visible gaps.
- Each beach is a clause at C4: **Swimming  AMMOUDAKI, THEN KLISIDI, BY DIVE** — a genuinely local, genuinely checkable fact taken verbatim from the source copy.
- The Google Maps embed sits **below** the axis, bounded, lazy-loaded behind a click-to-load poster (no third-party frame before consent). It is a utility, not the section.
- **"Beyond the Gate"** — the 24 amenity rows cut from the villa pages — sits here as a single wrapped noun field in 15px `--phrygana`.

---

## 7. THE BOOKING LEDGER

It is not a widget with the brand's colours applied. **It is made of the signature element.**

### 7.1 Why it belongs to the editorial design

1. **Its labels are clause tails.** `ARRIVING · NIGHTS · GUESTS · RESERVE` — Inter 500, 12px, `+0.22em`, the identical treatment as the six Inventory groups and every clause tail on the site. The booking bar and the headlines are made of the same part.
2. **It performs the signature motion.** On first appearance the four tails track open, 0.55s, half amplitude. The bar arrives the way a headline arrives.
3. **Its top edge is the datum.** A 1px `--preveli` rule on `--basalt` (8.96:1) — the same line, same weight, that runs under the hero, between the Collection rows, and along the Coast Line. The bar reads as another level, not a floating panel.
4. **Fields are typeset, not chromed.** Micro-label above, value in Marcellus 28px. **No boxes, no borders, no radius, no shadow, no pill.** Focus draws a 1.5px `--preveli` underline **and** shifts the label weight 400→500 — colour is never the only cue.

### 7.2 Specification

- **56px desktop / 52px mobile**, docked bottom, `--basalt` ground, `--limestone` text, inset to the page margin so it belongs to the grid rather than floating over it.
- Always reachable: `translateY(110%)` on scroll-down, returns on scroll-up over 0.4s, and a skip link targets it from anywhere.
- On villa pages the left slot carries that villa's tail: `VILLA THOI · SLEEPS 5`.
- Clicking a field raises a `--limestone` sheet with the same type discipline. Calendar figures are Inter `tabular-nums`; month names are Marcellus at 28px.
- **Mobile:** two zones — `DATES · GUESTS` and `RESERVE`. Tap targets ≥48px. Sits above the safe-area inset.

### 7.3 Deep link — exactly as the data specifies

```
Global bar   → https://thalassesvillas.reserve-online.net/
               ?checkin=YYYY-MM-DD&nights=N&adults=A&children=C
Villa / estate → https://etouri.reserve-online.net/
               ?checkin=YYYY-MM-DD&nights=N&adults=A&children=C&room=WH200
```

Method `GET`, `target="_blank"`, `rel="noopener"`. `nights` **or** `checkout`, never both. Room codes `WH200 / WH201 / WH202 / WH203 / WH2142`.

**No per-child ages UI.** `booking.json` is explicit: child ages are not a WebHotelier parameter and cannot be forwarded. The legacy form collected them into a field that was silently dropped. We collect a **count**.

Hosts are read per-scope from `content/booking.json`, with the `preferPropertyHostForAll` flag ready to flip once `TODO.md` T-006 is answered. **Nothing about the booking engine is hard-coded in a component.**

Rituals and any non-bookable page (`booking.hasWidget === false`, T-013) render the enquiry drawer instead of the ledger — same type, same rules, different action.

---

## 8. MOTION SYSTEM

### 8.1 Easings and the durations they apply to

| Purpose | Easing | Duration |
|---|---|---|
| All entrances and expansions | `cubic-bezier(0.16, 1, 0.3, 1)` | 0.8–1.2s |
| All exits | `cubic-bezier(0.4, 0, 0.2, 1)` | 0.3–0.4s |
| Micro-interactions | `cubic-bezier(0.16, 1, 0.3, 1)` | 0.4–0.55s |
| Focus rings | none | instant |

Nothing on this site animates faster than 0.3s except focus rings.

### 8.2 The library primitives

- **`trackOpen`** — per-character `translateX`, 1.05s / 12ms stagger at C1–C2; 0.55s / 8ms at tail scale. Fires at 0.25 intersection, **once**, never on scroll-back.
- **Image reveal** — `clip-path: inset(100% 0 0 0)` → `inset(0)` over 1.0s, paired with the `<img>` easing `scale(1.06)` → `scale(1)` over 1.4s. A water level dropping. Never a plain opacity fade.
- **Display type** — per-**line** mask-up, 0.9s, 60ms line stagger. Never per word; word stagger is the agency default.
- **Body and lede** — opacity + 12px rise, 0.6s, no stagger. Paragraphs never animate word by word.

### 8.3 The one orchestrated moment

**The homepage hero, 1.15s, Framer Motion, on load — not scroll-driven.**

```
t=0.00  hero still holds at scale 1.04, settling to 1.00 over 1.6s
t=0.00  the datum rule draws from centre outward, scaleX 0→1, 1.1s
t=0.15  "Living" mask-reveals from its own baseline, rising 32px, 0.9s
t=0.45  "UNLIMITED" tracks open from Living's final letter outward, 1.05s
t=1.55  nothing moves again
```

No loader percentage, no text scramble, no counter, no curtain.

**GSAP is used for exactly one set-piece: The Entire Estate.** A 220vh pin on `--pelagos` during which the C1 clause holds fixed while three photographs cross-dissolve behind it and the tail re-tracks with a different fact each time — `ALL FOUR` / `NINE BEDROOMS` / `ONE GATE`. The clause is the constant; the estate changes around it. Pin duration is capped, scroll velocity is never altered, and the pin releases naturally. GSAP is dynamically imported on that route only; it costs zero bytes everywhere else.

**If a second set-piece is proposed, the answer is no.**

### 8.4 Refused, explicitly

Custom cursor (any device) · scroll-jacking · section snapping · horizontal page scroll · autoplaying background video · text scramble · magnetic buttons · page-transition curtain wipes · parallax on mobile · **parallax on text, ever** · any content revealed only by hover.

### 8.5 `prefers-reduced-motion: reduce` — a second designed state, not a degradation

- Lenis is **destroyed** and native scroll restored.
- The GSAP pin is **unmounted**, not frozen; the Estate renders as three stacked full-bleed sections in sequence.
- Every `trackOpen` renders at final tracking with a 0.25s opacity fade.
- Every `clip-path` reveal resolves to its end state at `t=0` with a 0.25s fade.
- Zero transforms, zero scale, zero stagger.
- The datum rule is static.

The site loses its motion and **keeps its composition entirely** — which it must, because the composition is the design.

### 8.6 Mobile and performance

- Lenis `syncTouch: false`. Native momentum scrolling, always. No pins, no parallax, no hover-dependent content anywhere.
- Reveal distances shorten to 16px, durations to 0.6s. The clip-path reveal is retained on mobile — it is GPU-cheap and it is the brand.
- **Device guards** *(grafted from In Antis)*: `clip-path` reveals fall back to a 0.25s fade when `navigator.deviceMemory < 4`, on `saveData`, or on `effectiveType` slower than `4g`. Below-fold media uses `content-visibility: auto`.
- **Images:** AVIF with WebP fallback, `srcset` capped at **2200px** CSS width. The 5760px masters and the 387 MB library are never shipped. The LCP element is the hero still — **preloaded and never clipped** (the reveal animation applies to below-fold media only, so LCP is not deferred by the signature).
- All motion is `transform` / `opacity` only. Nothing on this site can trigger layout during scroll.
- **Targets:** LCP < 2.0s on 4G mobile, CLS 0, Lighthouse ≥ 90 on all four categories, enforced in CI.

### 8.7 Alt text

`TODO.md` T-035: almost no image on the site has real alt text. The rule:

- The **96 unique real captions** become the alt text for the images they belong to.
- Any image used in a **named slot** (hero, villa hero, Chapter opener, Collection cell, Register expansion, Weddings) requires authored alt text; the build fails without it. That is roughly **60 images**, not 704.
- Gallery and Run images are `alt=""` with the run wrapped in a labelled `<figure role="group">` — decorative-in-aggregate, which is honest and is the correct ARIA pattern.

---

## 9. SELF-CRITIQUE

The required pass. Every part of this plan that I would produce for **any** villa site, named, with the revision I made — and where I made no revision, the admission.

### 9.1 The palette is still two-thirds convergent, and I am not going to pretend otherwise

Four independent Phase-1 directions produced four off-whites within three RGB points (`#ECEDE8`, `#EDEEE9`, `#ECEAE3`, `#EAEBE5`) and four blue-green near-blacks. My `--limestone #E8E9E3` and `--basalt #16262B` are in both clusters. I have written a paragraph about limestone dust and tideline rock, and if you put my ground beside the other four at 100% zoom nobody could name which is which.

**Revision made:** I stopped defending the convergence and attacked the slot that actually carried the risk. Every direction produced a dark gold accent — `#B4863C`, `#9A7230`, `#A87C3E`, `#755823` — and every one confessed it was banned default (a)'s terracotta with the hue rotated, kept safe only by a lint rule. **I deleted the accent slot.** There is no warm accent token in this system to lighten, warm, or promote in sprint four. The interactive colour is the sea, which passes AA at every size and needs no policing. `--ammos` cannot become an accent because it fails contrast against every ground.

**What I did not fix:** the ground and the ink. I judged that an editorial site carrying 704 photographs of blue water needs a mineral off-white ground and a blue-green ink, that both are correct-by-function, and that spending my one break-out on them would have produced a worse site for the sake of a better swatch row. `--preveli #A4CCC9` is the break, and it is a real one — no default luxury palette contains a chalky shallow-water turquoise banned from light grounds by arithmetic. But it is one token out of six, deployed only on dark grounds, which means **on 80% of the site's surface area my palette is the convergent default.** That is the honest accounting.

### 9.2 The signature's animation is a 2021 move and I demoted it rather than defended it

Letter-spacing opening on scroll has been on award sites since Locomotive and Studio Freight made it ubiquitous. Naming it after the concept does not make it new, and the Phase-1 document that proposed it led its pitch with the animation because animation demos better than grammar — which is a tell.

**Revision made:** the motion is §2.4, not §2.1, and §2.4 opens by calling it demoted. The device is the **grammar** — one construction, no full stops anywhere, the booking bar made of clause tails, the amenity navigation speaking the same syntax. More importantly I added the thing that was actually missing: **§2.2, the fact-registry rule.** Every judge independently found the same hole — that place-specificity was a copywriting deliverable that evaporates the moment a junior writes a tail. Binding tails to a build-time registry compiled from `content/` converts the identity from a writing task into a data binding. A bad tail does not compile. That is the one genuinely new idea in this document, and it exists because three judges said the same thing.

**Still true:** a visitor who has read none of this sees a big serif word and a small tracked word beside it. The system is more ownable than the animation, and the animation is what they will see first.

### 9.3 Things I would produce for any villa site, unchanged

Named plainly, because the Phase-1 documents were graded on honesty here and were right to be:

- **The sticky bottom booking bar.** I made its labels out of clause tails, removed every box and border, put the datum on its top edge and specified the deep link precisely. All of that is hygiene and integration. It is still a sticky bottom booking bar, and I have no second mechanism. **No revision. I could not find one that was better than the generic pattern.**
- **The section rhythm of 96–220px.** Every good editorial site does this. **Partial revision:** I made spacing *relational* — Photograph→Photograph is 0, always, no divider — which is an enforceable rule rather than a taste number, and it is grafted, not mine.
- **Hero → statement → collection → experiences → location → book.** The information architecture of every villa site on the internet. I changed four of the beats structurally (§5.5) and I would still recognise this IA on a competitor's site.
- **The 62ch prose column with images bleeding right.** Standard editorial layout since print.
- **The Chapter photo-essay page.** Full-bleed opener, prose column, image run, captions. Generic. Its only non-generic property is the gate that decides who gets one.

### 9.4 The Collection was generic and I rebuilt it — but on data one judge disputed

Four horizontal bands with image-left/text-right is a Squarespace layout with better type. **Revision made:** two rows on the real front/rear split, the datum as the axis between them, one verified sentence per villa drawn from that villa's own long copy.

One judge flagged the front/rear/storey data as invented and disqualified another direction partly for asserting it. **That judge was wrong and I checked:** `specs.floors` is `null / null / 2 / 2`, `specs.view` differs exactly between the pairs, and all four `longDescription` fields state it verbatim — *"To the front villas 'Thoi' and 'Persi' which are single-storey, to the rear two-storey villas 'Eeanthe' and 'Melia'."* I am building on it deliberately. If the client says the geometry is different, the two rows change and nothing else does — the design fails safe. But I am aware I am overruling a judge, and that is the single riskiest structural call in this document.

### 9.5 The Register expands in place — which is still an accordion

"Compact rows never navigate, so fifteen thin URLs are never created" is a real content decision with a real SEO consequence. It is also true that a row that opens to reveal one sentence and one photo **is an accordion**, and the brief explicitly warned against plain accordions in the amenities context. I applied the pattern to experiences and called it something else because the type is bigger. **No revision — I think it is right, and I am naming the double standard rather than hiding it.**

### 9.6 The Inventory is the best component here, and it works partly by deletion

Reading the 28 real subgroups out of the JSON, showing `Minding 3` and `Tempering 2` at full dignity, discarding all 139 icons, converting 29 tooltips into inline keyboard-complete expansions, guarding `featureType 7`, and using column flow rather than a grid — all of that is specific, data-derived, and would not appear on another site.

But **24 of the 139 rows are solved by moving them to a different page.** That is genuinely better editing and it is also a way of not answering the question that was asked. What remains is a well-typeset noun field with a search box, and the reason it works is restraint. Restraint is correct, and restraint is not a signature.

### 9.7 "Typography-led" is still overstated

Marcellus appears in roughly six words per screen. All body copy, all 115 inventory items, every caption, every micro-label, every numeral and the entire booking rail are Inter — the most-used UI sans on the internet. By character count this site is ~90% Inter. A genuinely typography-led direction would have done something structurally strange with the *body* text — a measure that changes, marginalia, a two-column setting. I did not, because it would be harder to build and riskier to read, and I am calling that a trade rather than a decision.

### 9.8 Marcellus may have been chosen negatively, and by committee

Three of four independent directions chose it with the same "Roman inscriptional capitals, cut into stone" argument. When three processes converge on one face by one argument, it is the default. The honest sequence is: Cormorant is the cliché, Fraunces is banned default (a), therefore Marcellus. Choosing the third option because the first two are compromised is not the same as choosing it because it is right. Marcellus's **lowercase** — which is what a 224px "Living" is mostly made of — is workmanlike rather than beautiful.

### 9.9 The `find:` filter is a confession

I put a search box on the Inventory. A truly considered 115-item reading would not need one. The filter exists because I know the list is long, and it is the most useful thing on that page on a phone. Both of those are true at once.

### 9.10 What I am still unsure about

1. **Whether the fact-registry rule survives the client.** It is the load-bearing improvement in this plan and it is also a constraint on how they write about their own property. The first request for `Living BEAUTIFULLY` will come, and my answer — "that does not compile" — is technically true and politically fragile.
2. **Whether the photography is good enough.** 704 files at up to 5760px is a quantity claim, not a quality one. 694 of them sit in a single bucket named `pool`. This design gives every photograph enormous scale and no crop-rescue chrome. If the library turns out to be competent-but-ordinary hotel photography, the type will look superb and the site will look thin. **An edit down to roughly 90 images is a prerequisite, not a nice-to-have**, and I have not seen the images.
3. **Whether removing gold is brave or naïve.** Every competitor in this category signals luxury with a gold hairline. I have bet the entire chromatic identity on two blues and a stone. I believe it is right. I also know that the first stakeholder review will ask where the gold is, and I have no fallback token to offer — deliberately, because a fallback token is how the constraint dies.
4. **Whether the Register's expand-in-place actually converts.** It is better for SEO and better for the brand. It also removes fifteen indexable pages that currently rank for "massage Rethymno"-shaped queries. I have not modelled that loss.
5. **Whether one orchestrated moment is enough.** I cut GSAP to a single set-piece on the grounds of discipline. A jury looking for craft may read a site with one pin as under-built rather than restrained, and I cannot tell from here which way that lands.

---

## 10. WHAT THIS PLAN DOES NOT SOLVE

Open risks, carried into Phase 2+. Every one has an owner.

| # | Risk | Detail | Owner |
|---|---|---|---|
| 1 | **26 blocking client decisions** | `TODO.md` §1. The estate page cannot ship a single confirmed headline number until T-001…T-004 are answered. The Figure component makes that survivable, not solved. | Client |
| 2 | **Horizon tagging is manual** | ~110 values, bounded and CI-enforced, but it is real content ops and it must be redone whenever a full-bleed image is swapped. | Client / content ops |
| 3 | **A photo edit has not happened** | 704 files, no subject metadata, 694 in one bucket. Selecting ~90 hero-grade images and writing ~60 alt texts is a prerequisite to build, not a build task. | Client + art director |
| 4 | **The Greek locale is not designed** | The legacy site is **English-only**; `url-map.md` §5.3 defines `/el/` as a post-launch addition, so this is **not** a launch gate. But **Marcellus has no Greek subset.** The Phase-2 decision is: commission Greek glyphs for Marcellus (~€3–6k, preserves the system) or substitute a Greek-capable serif in `lang="el"` only (free, breaks face consistency between locales). Slugs must be authored in Greek, not transliterated. | Phase 2 |
| 5 | **Copy debt does not disappear, it moves** | 14 experiences under 40 words, 15 with one image. The Register makes brevity look deliberate — which **reduces the client's pressure to ever fix it**. Mitigation: `content-commission.json` ships as a build artefact and the promotion gate is visible in the CMS, so "promote to Chapter" is an explicit, achievable goal rather than a permanent state of elegant silence. | Client |
| 6 | **No rates, no policies, no floor plans** | T-033, T-041, T-042. No pricing, cancellation, deposit, minimum-stay, pet, smoking or children policy exists anywhere. A luxury booking site without a cancellation policy is a legal and conversion problem the design cannot absorb. | Client + legal |
| 7 | **Terms & Conditions are unusable** | T-008: "Ink Hotel" appears five times where the operator's name should be. T-023/T-024: garbled, self-contradicting clauses describing an intermediary business model that does not match a villa owner. Lawyer review before any republication. | Legal |
| 8 | **WebHotelier host binding unverified** | T-006. Two accounts, 100% consistent per template, irreconcilable from HTML. Shipped per-scope behind a flag; must be verified against a live booking before launch, because a wrong host silently drops room preselection — invisible in testing, expensive in bookings. | Client + WebHotelier |
| 9 | **CN Traveller endorsement has no wording** | T-031. Ships as the mark alone. If the client cannot source the quote, award name or date, the badge should be removed rather than implied. | Client |
| 10 | **Thalasses Rituals' data is wrong** | T-011: Rituals currently renders **Villa Pueblo's** amenity list. Its `longDescription` is `null`. The Weddings page is built from the Dream Wedding Chapter and the 31-image Rituals gallery; its facilities block does not ship until the CMS is corrected. | Client + CMS |
| 11 | **Villa Pueblo removal is incomplete in the source** | Estate copy, meta descriptions and the nav all still count five villas. Every derived figure must be recomputed and re-flagged. | Content |
| 12 | **`content-visibility` + `clip-path` on mid-range Android is untested** | The device guards are a blunt instrument. Requires real measurement on a Moto G-class device, with a willingness to drop the reveal to a fade on mobile if it does not hold 60fps. | Engineering |
| 13 | **The fact registry has no editorial governance yet** | It validates that a tail *resolves to a fact*. It cannot validate that the fact is *interesting*. `Living  IN A HOUSE` would compile. A human still signs off every clause. | Design + client |
| 14 | **Hiking / Running merge is a design decision with a content cost** | T-044. Merging is right today. If the client writes distinct copy the row splits — and the Register's grouping must be re-balanced, which is manual. | Content |
| 15 | **Six service cards and four "Spaces" tiles have no copy** | T-034, T-049. They are omitted from this plan entirely rather than rendered empty. If the client wants them, they need writing first. | Client |
