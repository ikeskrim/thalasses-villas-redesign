# Routes — static, SSG, dynamic, and partial prerendering (tranche twelve)

The rendering status of every route, read from the build rather than assumed, and what Next 16.3.5's partial prerendering would do here. Nothing was enabled.

**Sources, read-only.** From the served build (`BUILD_ID` `zvZmrT7ejPvvMsQp89xck`, written 14 September 00:23, the HEAD `56cb859` tree):

- `.next/app-path-routes-manifest.json`
- `.next/prerender-manifest.json` (version 4)
- `.next/routes-manifest.json`
- the files under `.next/server/app/`

Also the response headers of five GETs at :3005, and `node_modules/next` 16.3.5's own docs (`dist/docs/`) and types (`dist/server/config-shared.d.ts`).

**The build predates two uncommitted working-tree changes from the security workstream:** `src/proxy.ts` (matcher `/en/contact`) and the CSP carve-out in `next.config.ts`. The coordinator's rebuild is the record for those.

Legend: **○ static** is prerendered at build with no params. **● SSG** is prerendered once per `generateStaticParams` entry. **ƒ dynamic** is rendered on every request.

## Status per route

| route | status | evidence |
|---|---|---|
| `/` | ○ | `prerender-manifest.routes["/"]`, `initialRevalidateSeconds: false`. Served `x-nextjs-prerender: 1`, `x-nextjs-cache: HIT`, `Cache-Control: s-maxage=31536000` |
| `/en/the-estate` | ○ | manifest entry; `server/app/en/the-estate.html`; served HIT, `s-maxage=31536000` |
| `/en/experiences` | ○ | manifest entry; `.html`; served HIT |
| `/en/weddings`, `/en/gallery`, `/en/location`, `/en/careers`, `/en/terms` | ○ | manifest entries; `.html` files present |
| `/styleguide` | ○ | manifest entry |
| `/en/villas/[slug]` | ● 5 pages | villa-eeanthe, villa-melia, villa-persi, villa-pueblo, villa-thoi. `dynamicRoutes["/en/villas/[slug]"].fallback: false`, from `dynamicParams = false` and `generateStaticParams` (`src/app/en/villas/[slug]/page.tsx:55`, `:57`). villa-thoi served HIT |
| `/en/experiences/[slug]` | ● 21 pages | bike-tours, biological-garden, boat-trip, breakfast-on-the-beach, chauffeur, chef-in-villa, dream-weadding-on-the-beach, exclusive-tour, hiking, jeep-safari, jet-ski-safari, learn-the-secrets-of-cretan-cuisine, massage, personal-trainer, private-helipad, quad-safari, running, scuba-diving, therapist, wine-production, wine-tasting. `fallback: false` (`src/app/en/experiences/[slug]/page.tsx:21`, `:23`) |
| **`/en/contact`** | **ƒ** | Listed in `routes-manifest.staticRoutes` (it has no path params) but **absent from `prerender-manifest.routes`**. `server/app/en/contact/` holds `page.js` and no `.html` or `.rsc`. Served `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` with no `x-nextjs-cache`. Cause: the page awaits `searchParams` (`src/app/en/contact/page.tsx:52-56`) to prefill the subject from `?enquiry=` / `?villa=` |
| `/_not-found`, `/_global-error` | ○ | manifest entries |
| `/opengraph-image`, `/en/the-estate/opengraph-image`, `/en/weddings/opengraph-image` | ○ | manifest entries, `dataRoute: null`; each exports `runtime = "nodejs"` |
| `/en/villas/[slug]/opengraph-image`, `/en/experiences/[slug]/opengraph-image` | ● 5 / 21 | manifest entries; `fallback: null` |
| `/robots.txt`, `/sitemap.xml` | ○ | manifest entries |

Every `initialRevalidateSeconds` is `false`, so nothing revalidates on a timer. `routes-manifest.json` has no `ppr` key, and `rsc.dynamicRSCPrerender` is `false`.

**In one line:** every page is prerendered at build except `/en/contact`. That covers nine static pages, 26 SSG pages from two templates, and the 404 and global-error documents.

## Partial prerendering in Next 16.3.5

### What the option is, in this version

- **There is no separate PPR switch.**
  - `experimental.ppr` is deprecated: "merged into `cacheComponents`. The Partial Prerendering feature is still available via `cacheComponents`" (`config-shared.d.ts:888-889`).
  - `experimental.cacheComponents` is deprecated in favour of the top-level key (`:995-997`).
  - The top-level `cacheComponents?: boolean` is at `:1538`, default `false` (`:1678`).
  - The option's page says it "implements Partial Prerendering (PPR) as the default behavior in the App Router", and that `experimental.ppr` and the `experimental_ppr` segment config "have been removed" (`dist/docs/01-app/03-api-reference/05-config/01-next-config-js/cacheComponents.md`).
- **What it does.**
  - Data access is dynamic by default, and caching is opted into with `use cache`, `cacheLife` and `cacheTag`.
  - At build, each route gets a static HTML shell and RSC payload. Anything reading runtime data (`cookies()`, `headers()`, `searchParams`) or uncached data must sit inside `<Suspense>`, and streams at request time (`dist/docs/01-app/01-getting-started/08-caching.md`, "Prerendering").
  - It requires the Node.js runtime.
- **It also changes client navigation.** A route you navigate away from is kept under React `<Activity mode="hidden">` instead of being unmounted. Its state survives, and its effects are cleaned up when hidden and recreated when shown (`cacheComponents.md`, "Navigation with Activity").

### What enabling it would require here

From `dist/docs/01-app/02-guides/migrating-to-cache-components.md`. None of this was tried.

1. **`/en/contact`.** Awaiting `searchParams` at the top of the page (`contact/page.tsx:56`) outside `<Suspense>` surfaces the *blocking-prerender-runtime* insight (guide `:685`). The read would move into a component inside a Suspense boundary. The page would then stream a Suspense segment, which is the pattern D-012 removed from every other route and `tests/perf-structure.spec.ts` guards on five routes (not contact).
2. **`dynamicParams = false`** on the villa and experience templates is "not supported"; unknown params render on request and the page must call `notFound()` (guide `:606-612`). Both pages already do (`villas/[slug]/page.tsx:141`, `experiences/[slug]/page.tsx:60`). `generateStaticParams` must return at least one param (`:568-572`), and both do.
3. **Client hooks in the shared layout.** "A nav or breadcrumb in a shared layout … suspends while Next.js generates the static shell for any route below it that has dynamic params" unless it sits in `<Suspense>`, "or the build fails" (guide `:674`). `SiteNav` (through `LanguageSwitcher`), `SmoothScroll` and `RouteTransition` all call `usePathname` in the root layout. Only a build would show whether they need boundaries once `dynamicParams` is gone.
4. **Synchronous time during prerender is a build error** that `instant = false` does not clear (guide `:103`).
   - `src/app/sitemap.ts:69` (`new Date()`) runs at prerender.
   - `src/lib/booking.ts:65` runs only when a check-in date is passed (`:84`), which the prerendered calls-to-action don't.
   - `src/components/ui/BookingLedger.tsx:46` is in a client component, which the guide names as an accepted place.
5. **Activity navigation keeps hidden pages in the DOM.**
   - `RouteTransition` focuses `document.getElementById("main")` after every navigation (`RouteTransition.tsx:52`). With the previous page hidden but present, two `#main` elements would exist.
   - `SmoothScroll`'s re-measure, `HotelMotion`'s ScrollTrigger setup and the cursor's once-per-document mount (`ISLANDS-tranche12.md`) would run under hide/show effect cycles instead of unmount/mount.
   - Each needs re-testing (`tests/direction-d.spec.ts` focus hand-off, the phase specs).
6. **Runtime.** The five opengraph image routes export `runtime = "nodejs"`, the runtime the flag requires. No route uses edge.
7. **The root layout** reads no runtime data (no `cookies`, `headers`, `searchParams`, no `await`), so it would prerender as it does now.

### Would it help? No, and it would collide with work in progress

- **Nothing to split outside `/en/contact`.** Every other page already ships build-time HTML and RSC with `s-maxage=31536000`, which is exactly what PPR's static shell would give it.
- **The measured problem is client-side.** Phone TBT is hydration and script evaluation after first paint (`attribution-*-phone.md`). PPR changes how the server produces HTML, not what the browser hydrates, so no TBT change is expected on any sampled route. The gate runs against localhost, where a first-byte gain would not show either.
- **The one route it would change is the one where it breaks the proposed nonce.** The uncommitted `src/proxy.ts` sends a per-request nonce CSP on `/en/contact` because that page already renders per request. Next's CSP guide says nonces require dynamic rendering (`dist/docs/01-app/02-guides/content-security-policy.md:38`). A static shell for `/en/contact` would be written at build, with no request and no nonce to stamp.
- **The flag changes navigation semantics across the site** (point 5), for no measured gain.

**Decision: deferred, not enabled.** Revisit if a page gains per-request data (live availability, say), or if the contact nonce policy is dropped.

The other way to make `/en/contact` static without the flag is to read the prefill on the client; `EnquiryForm` is already a client component. It is not recommended here, because it removes the per-request render the security workstream's nonce policy depends on. That is a choice between the two, for the coordinator.
