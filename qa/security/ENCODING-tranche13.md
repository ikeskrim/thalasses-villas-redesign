# The percent-encoding class (tranche thirteen)

DECISIONS.md D-021 asked for `/en/%63ontact` → HTTP 500 to be investigated **as a class**, with an encoding table across four routes. This is that record. It covers what was measured, what that establishes, what was changed (D-025), and what is still not established.

## 1. Method

`node scripts/encoding-table.mjs <origin>` sends fifteen spellings of each of four routes through `node:http(s)`, with the path exactly as written. A URL object or `fetch()` could normalise an escape before it leaves the machine, and then the table would describe a different request.

The four routes:
- **`/en/contact`:** the one page rendered per request, and the only path the proxy (`src/proxy.ts`) covers.
- **`/en/the-estate`:** prerendered.
- **A villa and an experience:** statically generated from `generateStaticParams`.

For each response it records:
- the status;
- `x-matched-path`, the page the platform routed to;
- the content type;
- the number of raw `Content-Security-Policy` header lines;
- the body size;
- the regions in `x-vercel-id`.

## 2. Production, before the change: `encoding-table-production-2026-09-14.md`

Run at 15:19Z against `https://thalasses-villas-redesign.vercel.app`, the production alias, which was serving main's app code at `5b3d106`.

| spelling | `/en/contact` | `/en/the-estate` | villa | experience |
|---|---|---|---|---|
| plain | 200 | 200 | 200 | 200 |
| an escaped letter, `%XX` | **500** | 200 (the page) | 200 | 200 |
| hex letter, lower-case escape | **500** | 200 | 200 | 200 |
| hex letter, upper-case escape | **500** | 200 | 200 | 200 |
| locale segment encoded (`/%65n/…`) | **500** | 200 | 200 | 200 |
| `%2F` between segments | **500** | 200 | 200 | 200 |
| encoded trailing slash | **500** | 200 | 200 | 200 |
| `%2e` segment | 404 | 404 | 404 | 404 |
| `%2e%2e` segment | 404 | 404 | 404 | 404 |
| double-encoded (`%25XX`) | 404 | 404 | 404 | 404 |
| trailing `%20` | 404 | 404 | 404 | 404 |
| appended `%C3%A9` | 404 | 404 | 404 | 404 |
| `/EN/` | 404 | 404 | 404 | 404 |
| escaped + `.rsc` | **500** | 200 (flight data) | 200 | 200 |
| escaped, `RSC: 1` header | **500** | 200 (flight data) | 200 | 200 |

**Every response carried exactly one CSP line.** Each 500 has these features:
- it is Next's static `/500` page (8,993 B), with `x-matched-path: /500`;
- its request id names only the edge region (`fra1`), where a call that reaches the contact page names `fra1::iad1`.

### What this establishes

1. **Vercel decodes a percent-encoded path once before it routes.** Every spelling that decodes to a real path is routed to that page.
2. **Prerendered pages are served normally** at those spellings, status 200 with the real page. That is also a duplicate-URL exposure: `/en%2Fthe-estate` serves the estate page. This change does not touch it.
3. **The 500 happens only where a decoded spelling lands on the page rendered per request.** The document, its flight data and its query-string form are all affected.
4. **Spellings that do not decode to a real path are 404 everywhere.** That covers dot-segments, double encoding, trailing whitespace, appended non-ASCII and upper-case locale.
5. **The CSP partition held on every row:** one policy per response.

## 3. Local, before the change: `next start` of the same app code (`5b3d106`)

A worktree build with every photograph copied in. On `/en/contact` and `/en/the-estate`:

- **Every escaped letter, encoded locale, `%2F`, encoded trailing slash, `.rsc` and RSC form returned 404 on both routes.** Local Next does not decode an escaped path before routing, so neither the 500 nor the prerendered 200 appears.
- **The `%2e` and `%2e%2e` dot-segments returned 200 on both routes.** They are resolved before Next routes, while Vercel answers 404.
- **The rest returned 404,** as on Vercel.

## 4. Vercel's invocation, emulated: `NEXT_PRIVATE_MINIMAL_MODE=1` with `x-matched-path`

This is how Vercel runs Next for a page. Requests carried the path as the browser sends it, plus the `x-matched-path` Vercel would add.

| path sent | x-matched-path | status |
|---|---|---|
| `/en/contact` | /en/contact | 200 |
| `/en/%63ontact` | /en/contact | 404 |
| `/en/c%6Fntact` | /en/contact | 404 |
| `/en%2Fcontact` | /en/contact | 404 |
| `/en/%63ontact?enquiry=estate` | /en/contact | 404 |
| `/en/%63ontact` + `rsc: 1` | /en/contact | 404 |
| `/en/the-estate` | /en/the-estate | 200 |
| `/en/%74he-estate` | /en/the-estate | 404 |

**No exception was logged.** The emulation does not reproduce Vercel at all: even the prerendered estate page, which Vercel serves at `/en/%74he-estate`, is 404 here. Vercel's router therefore does something this emulation lacks.

## 5. What was changed (D-025)

**`src/proxy.ts`.** A path that decodes exactly to `/en/contact`, or to `/en/contact/`, gets a 308 to the literal page with its own query and the static policy. That includes the `.rsc` and `RSC: 1` flight forms. Every other spelling passes through as before.

### Attempt 1 failed, and taught where the proxy stands

The first version returned a relative Location from `new NextResponse(null, { status: 308, headers: { Location } })`. Under `next start`, every spelling it caught became a **500**: text/plain, 21 B, no CSP line. The server logged `TypeError: Invalid URL … input: '/en/contact'` for each one.

Next's proxy adapter explains it (`node_modules/next/dist/server/web/adapter.js`):
- line 384 parses a Location with `new NextURL()`, which refuses a relative URL;
- lines 394–396 rewrite a same-host absolute Location back to a relative path;
- lines 403–405 turn it into `x-nextjs-redirect` for a `_next/data` request.

The shipped version builds the target absolute on the request's origin and hands it to `NextResponse.redirect(…, 308)`.

The failure did establish one thing: **under `next start` the proxy runs for these spellings, and `request.nextUrl.pathname` carries the raw, still-encoded path.** That is not established for Vercel.

### Local, after the change: build `ubDcMVXVqvmYEjOt8E9o0`, `next start`

| path sent | status | Location | CSP |
|---|---|---|---|
| `/en/%63ontact` | 308 | `/en/contact` | 1, static |
| `/en/%63ontact?enquiry=estate` | 308 | `/en/contact?enquiry=estate` | 1, static |
| `/en/c%6Fntact`, `/en/c%6fntact` | 308 | `/en/contact` | 1, static |
| `/%65n/contact` | 308 | `/en/contact` | 1, static |
| `/en%2Fcontact` | 308 | `/en/contact` | 1, static |
| `/en/contact%2F`, `/en/contact%2f?villa=villa-thoi` | 308 | `/en/contact`, `/en/contact?villa=villa-thoi` | 1, static |
| `/en/%63ontact.rsc` | 308 | `/en/contact` | 1, static |
| `/en/%63ontact` with `RSC: 1`, with or without `?_rsc=` | 308 | `/en/contact` | 1, static |
| `/en/%63ontact` with a forged `Host: evil.example` | 308 | `/en/contact` | 1, static |
| `/en/%63ontact?next=https://evil.example` | 308 | `/en/contact?next=https%3A%2F%2Fevil.example` | 1, static |
| `/_next/data/x/en/%63ontact.json` | 308 | none (Next's `x-nextjs-redirect`) | 1, static |
| `/en/%2563ontact`, `/EN/%63ontact`, `/en/%63ontacts`, `/en/%63ontact%2Fx`, `/%2F%2Fevil.example/en/contact`, `/en/%74he-estate` | 404 | | 1, static |

Two rows are Next's own behaviour, before and after the change:
- `/en/%2e/contact` returns 200 with the nonce policy, because the dot-segment is resolved before routing.
- `//evil.example/en/%63ontact` returns 308 to `/evil.example/en/%63ontact`, a relative same-origin path.

The server log's `Error: Internal: NoFallbackError` lines are also Next's. Counted one request at a time, each 404 under the dynamic `/en/villas/[slug]` route adds one, including a plain unknown slug. Every redirected spelling adds none.

### The checks

- **`tests/security.spec.ts`** gains a "percent-encoded" block of ten tests. It asserts:
  - each of six spellings, with and without a query, returns 308 with an exact Location and one policy;
  - both flight forms return 308;
  - the followed redirect lands on `/en/contact?enquiry=estate` under its nonce policy;
  - neither a query nor a forged Host header, sent through `node:http`, steers the Location;
  - five spellings that do not decode to the page stay 404.
- **`scripts/check-headers.mjs`:**
  - any response of 500 or more now fails every entry, whatever it expects;
  - a `redirect` entry judges the status and the Location it names, resolved against the checked origin, so relative and same-origin absolute both pass;
  - the class is added as seven 308 entries;
  - `/en/%63ontact.html` keeps the decoded-only double match that `/en/%63ontact` used to cover;
  - `/en/%2563ontact` and `/en/%74he-estate` are added as non-class entries.

### Verified

- `npm run typecheck` is clean, and ESLint shows zero warnings on the four code files (`src/proxy.ts`, `tests/security.spec.ts`, `scripts/check-headers.mjs`, `scripts/encoding-table.mjs`).
- `node scripts/check-headers.mjs --compile`: PASS, 25,533 spellings, 0 overlaps or gaps under all four raw-path models.
- `tests/security.spec.ts` against the build: 30 of 30.
- `node scripts/check-headers.mjs http://localhost:3005`: PASS on all 31 entries.
- Full QA on the build (`npm run qa`, three shards): 579 passed, 0 failed. Shard by shard: 218 passed; 179 passed; 182 passed.
- **19 skipped:** direction-d 7, patterns 11, villa 1. These are the same 19 skips `SESSION-REPORT.md` has recorded on earlier full runs; none of them is in `security.spec.ts`.
- WebKit smoke (`npm run qa:webkit`): 14 of 14.

### Falsified

- **The new spec block, against a build without the change** (the `base7ff` arm, `next start`): 9 of 10 failed, each on "Expected: 308, Received: 404" or, for the followed redirect, "Expected: 200". The one that passed is the non-class test, which holds on either build.
- **check-headers against the same build:** every class entry failed on "Location (none)". That run is confounded: `base7ff` predates the nonce proxy, so its other contact entries fail too. Only the class lines count.
- **check-headers against production before this change deploys** (17:28Z): exactly the 7 class entries failed, each as "a 500 fails every entry", each still carrying one CSP line. The other 23 entries passed, and `/en/contact/` was reported.

### Production, after the change deployed (85899ba)

Vercel reported the build `success` on the ninth check, 30 s apart. Everything below ran against the production alias between 17:42 and 17:44Z.

- **check-headers: PASS on all 31 entries.** The seven class entries are 308 to their exact Location, each with one static CSP line. The other 23 pass, and `/en/contact/` is reported. Before the deploy, the same run failed exactly those seven, on 500.
- **The encoding table** (`encoding-table-production-2026-09-14-after-85899ba.md`), compared row by row with §2's table on status. Exactly eight rows changed, all on `/en/contact`, all from 500 to 308: the escaped letter, both hex cases, the encoded locale, `%2F`, the encoded trailing slash, `.rsc` and the RSC header. The other 52 rows, across all four routes, answer as they did.
- **The redirect probe:**
  - every class spelling, with and without a query, and both flight forms (with and without `_rsc`): 308 to the relative `/en/contact` plus the query, with one static policy;
  - `?next=https://evil.example`: 308 to `/en/contact?next=https%3A%2F%2Fevil.example`;
  - `/_next/data/x/en/%63ontact.json`: 308 to `/_next/data/x/en/contact.json`, same origin. Under `next start` the adapter answers this with `x-nextjs-redirect` and no Location;
  - the non-class spellings: 404 with the static policy, `%2e` included, since Vercel does not resolve dot-segments;
  - a forged Host header cannot be sent to Vercel at all: the TLS handshake is refused before any HTTP. That guarantee is established under `next start` only.

**Established:** Vercel runs the proxy before the step that failed, for every spelling of the class. That was listed as not established until this deploy.

## 6. What is not established

- **The exception behind the 500, and whether it is thrown in the page's function or later.** The proxy now answers first, so the failure is no longer reachable. Finding it would need one of two things:
  - Vercel's runtime logs for the failing request ids. This session has no access to them.
  - A preview deployment with the proxy's matcher neutralised. That would be a public publish serving `/en/contact` without its nonce policy, so it was not done without permission.
- **The duplicate-URL exposure on prerendered pages** (§2, point 2). This change does not address it.
