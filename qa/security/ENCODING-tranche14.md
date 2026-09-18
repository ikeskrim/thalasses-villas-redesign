# The percent-encoded duplicates: 301 to the canonical spelling (tranche fourteen)

DECISIONS.md D-028: "Percent-encoded duplicate URLs: 301 to the canonical spelling." That answers the tranche-thirteen report's duplicate-URL question. D-032 records the mechanism; this file is the evidence. The tranche-thirteen record, `ENCODING-tranche13.md`, has the class's history and the 500 that started it.

**The answer.**
- **Every page now answers 301 at its percent-encoded spellings,** from one generated rule per page in `next.config.ts`.
- **No function was added in front of any URL.** Config redirects run before the proxy and before the filesystem, so a literal request still reaches the CDN's prerendered copy untouched.
- **The contact class moved from 308 to 301** (D-025's 308 is superseded). Only its `/_next/data` spelling is still the proxy's, because Next keeps config redirects off `/_next/**`.
- **What production answered before the deploy:** 15 of the 39 `check-headers` entries failed, exactly as expected. That failure is recorded below and was not weakened.
- **On production now** (§6): all 41 entries pass, every duplicate spelling in the table answers 301, the only rows left at 200 are the four canonical pages, and no row answers 5xx. The 500 the class began with is gone from its last shape, the segment-prefetch file of `/en/contact`.

## 1. What was wrong

After D-025, `/en/contact`'s encoded spellings were redirected, but the prerendered pages still served themselves at theirs. From the committed production table (`encoding-table-production-2026-09-14-after-85899ba.md`), on each of `/en/the-estate`, a villa and an experience, eight spellings answered 200:

- an escaped letter, in either hex case;
- an encoded locale;
- `%2F` between segments;
- an encoded trailing slash;
- the two flight-data forms (`.rsc`, and the `RSC: 1` header).

That is 24 duplicate URLs on the three measured routes alone, each serving the page's whole content at a non-canonical address.

## 2. The mechanism

**One rule per page, generated.** `scripts/build-encoded-redirects.mjs` runs from `npm run redirects` (which `npm run build` runs first) and writes `src/generated/encoded-redirects.json`: 35 rules, one per canonical page, each `statusCode: 301` to the literal path.

- **The inventory** is the sitemap's: every non-dynamic `page.tsx` under `src/app` (including `/styleguide`, excluding `/`), the five villa slugs and the 21 experience slugs.
- **Each source** accepts, for every character of the path, the character or its `%XX` escape in either hex case; `/` may be `%2F`; a trailing `%2F` and a trailing `.rsc` are allowed; and a `%` must appear somewhere (a lookahead). So a rule matches every spelling that decodes once to its page, and never the canonical path.
- **The destination is a fixed literal.** No capture reaches it, on either platform, so there is no open redirect.
- **The generator refuses the list** if a path is not lower-case ASCII, if any destination (or its `.rsc` or trailing-slash form) matches any rule of either list, if a page's escaped or fully escaped spelling does not match exactly its own rule, or if an escape that decodes to another character (the next byte, or the capital) matches any rule.

**Why config redirects and not the proxy.** Vercel's Routing Middleware runs before the cache, so a proxy matcher wide enough to see these spellings would put a metered function in front of every page view — what D-012 and D-016 protect the prerendered pages from. Next matches config redirects against the raw path, before the proxy and the filesystem.

**The proxy** keeps its matcher, its CSP partition and its class branch, now at 301. Under `next start` that branch is only reached by `/_next/data/<id>/en/%63ontact.json`.

## 3. Locally, on the build of record

Served by `next start` on :3005, from the build in this commit.

- **`node scripts/check-headers.mjs http://localhost:3005`:** PASS on all 39 entries, including the 15 new or changed ones.
  - A config 301 carries no CSP line under `next start`, which adds no config headers to redirects. On Vercel it does; the entries do not judge a redirect's headers.
  - The `_next/data` entry is 301 with `x-nextjs-redirect: /_next/data/check-headers/en/contact.json`, and its target is now judged as a data path to the page.
- **`node scripts/encoding-table.mjs http://localhost:3005`:** 76 rows. Every decode-once spelling, both flight forms, the query form and the segment-prefetch header form answer 301 with the exact Location and the query kept.
  - The `%2e` and `%2e%2e` rows still answer 200. That is Next's own dot-segment resolution under `next start`; on Vercel they are 404 (tranche thirteen, §2).
  - The literal `.segments/_tree.segment.rsc` path and the non-contact `_next/data` rows answer 404 locally.
- **`tests/security.spec.ts`:** 57 tests pass (30 before this change). The percent-encoded block covers six spellings per route on four routes with and without a query, the flight forms, the followed redirect under each page's own policy, letter-case variants, open-redirect attempts (a forged Host through `node:http`, `//evil.example`, `/%2F%2F`), spellings that must not redirect, the proxy's `_next/data` 301, and three static checks: the rule list equals the sitemap's pages, no destination matches any rule, and every destination answers 200.
- **Full QA:** 627 passed, 0 failed, 19 skipped, across the three shards. WebKit smoke 14 / 14.
- **The build:** `.next/routes-manifest.json` holds 35 × 301 and 52 × 308 (51 legacy rules plus Next's internal trailing-slash rule). `.next/server/functions-config-manifest.json` is unchanged, so the proxy covers no new path.

**One unexplained failure.** In the first suite run after the server started, "spellings that do not decode once to a page are not redirected" failed once. It did not reproduce: the same test passed in the two runs after it, and all 13 of its spellings answered 404 in three further rounds of direct requests (39 requests). The cause was not established. It may belong to the local defect below, which can make a neighbouring test fail in either direction; two other worktrees were also building and serving on this machine at the time.

**A local defect this work found, in `next start` on Windows.** Requesting the escaped-capital spelling of a **dynamic** route's slug overwrites the canonical page's prerendered files with the 404 render.

- **What happens.** `/en/villas/%56illa-thoi` decodes to the slug `Villa-thoi`, which `generateStaticParams` does not list, so the page 404s. Windows paths are case-insensitive, and Next then wrote that 404 render over `.next/server/app/en/villas/villa-thoi.html`, which fell from about 180 KB to 16 KB (the file's own timestamp moved to the moment of the request). Its `.rsc`, `.meta` and `.segments` files were rewritten with it.
- **What follows.** The canonical URL answers 404 until the next build, and the 404 body carries the flight data of the case-variant request. Three unrelated tests then failed in one run: the sitemap's "nothing 404s", "every destination answers 200" and the redirect map's dead-target check. The other four villa prerenders were untouched.
- **On the deployment it does not happen.** Before and after the same request, `/en/villas/villa-thoi` answered 200 on production, and the case-variant answered 404 (measured 2026-09-18).
- **What was done.** The spelling was taken out of the served not-redirected list, and that list now requests only static routes. The dynamic-route spelling is still checked against the compiled rules in the loop-guard test, which makes no request. A rebuild restored the page.
- **Not established:** whether a case-insensitive cache key or the case-insensitive filesystem is the cause, and whether any Linux deployment can be made to do the same.

## 4. Falsified

Each mutation was built and served, and each failure is at the named assertion.

| mutation | what went red |
|---|---|
| the encoded rule list emptied | 27 of the block's 37 tests. The estate spellings answered 404; six escaped-slug spellings of the villa and the experience answered 200, a local duplicate no earlier measurement had covered. The seven contact tests still passed, through the proxy's own 301 |
| the `%` lookahead dropped from a rule | the generator refused the list (exit 1). With the guard also disabled, the loop-guard test failed, `next build` accepted the self-matching rules without complaint, and the served build answered 301 from `/en/the-estate` to itself ("Max redirect count exceeded") |
| a non-ASCII path (`/el/%CE%B2…`) or an upper-case path in the inventory | the generator refused the list (exit 1) |

## 5. Production, before the deploy

`node scripts/check-headers.mjs https://thalasses-villas-redesign.vercel.app` at 2026-09-18T08:14Z, against the deployment of d4abe23: **15 of 39 entries failed.** Recorded, not weakened (D-025's rule).

| entries | production answered | expected |
|---|---|---|
| the 8 contact spellings, the `_next/data` form included | 308 to the literal page | 301 |
| `/en/%74he-estate`, its query form, and its two flight forms | 200, the page itself | 301 |
| `/en/villas/%76illa-thoi`, `/en/experiences%2Fboat-trip` | 200, the page itself | 301 |
| `/EN/%74he-estate` | 404 | 301 |

The 23 entries that passed are the canonical pages, the contact page's own policies and the spellings that must not redirect.

**`/EN/%74he-estate` measures a platform property, not the ruling.** Next compiles these sources case-insensitively (measured under `next start`, and on Vercel with a legacy rule). If the deployment answers 404 there, that is the stricter outcome: the entry is updated and this record says so, rather than the deploy being held.

## 6. Production, after the deploys

Two commits, each checked on the deployment it produced.

**After c8e8858** (`encoding-table-production-2026-09-18-after-c8e8858.md`), `check-headers` passed all 39 entries, `/EN/%74he-estate` included: Vercel matches these generated sources case-insensitively, as `next start` does. Against the tranche-thirteen table, of the 60 comparable rows:

| rows | before | after |
|---|---|---|
| 24 | 200, the page itself | 301 to the canonical path |
| 8 | 308 (D-025's contact class) | 301 |
| 28 | 404, or the canonical page's own 200 | unchanged |

The 16 new rows showed two spellings the rules did not catch, which the second commit fixes:
- **the segment-prefetch file of a page path** answered 200 on each of the three prerendered pages — the same duplicate in another shape;
- **the same shape of `/en/contact`** answered **500** — the D-025 class in a shape the proxy never sees, because the adapter strips only `.rsc` before the branch compares the path.

**After 01480d4** (`encoding-table-production-2026-09-18-after-01480d4.md`), with `.segments/….segment.rsc` added to each rule's tail:

- `check-headers`: **41 of 41 entries pass**, including the two new segment-prefetch entries.
- Exactly four rows changed from the previous table: the contact segment path 500 → 301, and the three pages' segment paths 200 → 301.
- **The only rows still answering 200 are the four canonical pages themselves.** No row answers 5xx.

## 7. Not established

- **Settled by the production tables, and no longer open:** the query survives a config redirect (the query rows answer 301 with it intact); the lookahead behaves as it does locally; the segment-prefetch forms are covered, and the `_next/data` forms of the prerendered pages answer 404.
- **Still not established on Vercel:** which layer answers the contact class first (the config rule and the proxy would both answer 301 with the same Location), and whether a config 301 there carries the site's policy headers — the entries do not judge a redirect's headers.
- **`/EN/%74he-estate`** answered 301 on the deployment, so Vercel matches these sources case-insensitively, as `next start` does. That is a platform property this record measured, not something D-028 requires.
- **`/`, the metadata routes (robots.txt, sitemap.xml, the opengraph images) and public assets.** No rule covers them, and their encoded spellings were not measured.
- **The exception behind the original 500.** Still unreachable without Vercel's runtime logs (D-025).
- **The coupling to Next's internals.** The generator's guard imports three `next/dist` modules, and `npm run build` runs the generator, so a Next upgrade that moves them fails the build rather than a QA script. That is deliberate: it fails closed and loudly.
