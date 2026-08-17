# Thalasses Villas — redesign

A standalone redesign of [thalasses.com](https://thalasses.com) — five private
seafront villas in Pigianos Kampos, Rethymno, Crete.

**A redesign, not a rebrand.** Every piece of the original site's content is kept
and re-presented: villas, experiences, amenities, the beach and location data,
careers, contact details, forms, imagery, SEO metadata and terms. Nothing is
invented — no villa name, price, distance, amenity or review appears anywhere
unless it resolves against the Phase 0 inventory in [`content/`](content/), and a
test fails the build if one does.

Booking leads to the real engine (`thalassesvillas.reserve-online.net`). There is
no fake checkout anywhere in this repository.

## Running it

```bash
npm ci
npm run dev
```

| Command | What it does |
|---|---|
| `npm run dev` | dev server on :3005 |
| `npm run build` | production build |
| `npm run verify` | credential scan → typecheck → lint → build → full Playwright suite |
| `npm run scan:secrets` | credential scan of the **whole tree**, scraped HTML included |
| `npm run qa` | the Playwright suite alone (149 tests) |
| `npm run qa:screens` | regenerate `qa/screens/` |

## How it is organised

| Path | |
|---|---|
| [`content/`](content/) | the Phase 0 inventory — **the single source of truth**, with the raw pages it was extracted from |
| `src/lib/content.ts` | the only resolver. Image blocking, villa lookup and the local image pool all live here, not in components |
| `src/app/` | App Router pages, plus the five CSS layers: tokens → sections → villa → elevation → patterns → atmosphere |
| `tests/` | 149 Playwright tests, including a numeric-token guard that fails the build on any unverifiable number in display copy |
| [`CONVENTIONS.md`](CONVENTIONS.md) | twelve standing rules, each written after something went wrong |
| [`TODO.md`](TODO.md) | 228 tracked items with their resolutions |
| [`DESIGN-PLAN.md`](DESIGN-PLAN.md) | the design system and its reasoning |

## Secrets

There are none, and none may be added. Booking is an outbound deep link and
there is no server-side integration. When the enquiry form gets a mail provider,
its key belongs in Vercel environment variables and is read from `process.env` —
never committed, not even to an ignored file.

`npm run scan:secrets` scans the entire tree, **including the scraped HTML under
`content/raw/`**, and fails on any credential-class match. It exists because a
live Google Maps key belonging to the old site was carried into this repository
inside 43 Phase 0 scrapes: full disclosure, and the register of values judged
public by design, in [`SECURITY-NOTES.md`](SECURITY-NOTES.md). See also
[`EXCLUDED-MANIFEST.md`](EXCLUDED-MANIFEST.md).

## Photography

All imagery is the property's own. Ten frames were ruled off the site by the
owner — stock photography, a branded product shot, two public places and frames
of unverified provenance — and are excluded from both the site and this
repository; a CI test asserts none of them can reach a rendered page. The
reasoning is in `content/excluded-images.json` and
[`EXCLUDED-MANIFEST.md`](EXCLUDED-MANIFEST.md).
