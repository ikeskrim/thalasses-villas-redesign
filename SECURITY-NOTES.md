# Security notes

This repository is **public**. It contains no runtime secret and needs none:
booking is an outbound deep link to the real engine
(`thalassesvillas.reserve-online.net`) and there is no server-side integration.

Run the scan before any push:

```bash
npm run scan:secrets
```

It walks the **entire tree** — including the scraped HTML under `content/raw/`
and any text under `public/` — and exits non-zero on any credential-class match.
It is also wired into `npm run verify`. The reasoning is `CONVENTIONS.md` §13.

---

## 1. Incident — Google Maps API key in the Phase 0 scrapes

**Status: redacted in the repository; rotation is the owner's, at the provider.**

| | |
|---|---|
| What | One Google Maps JavaScript API key, `AIzaSyD4…4HHg`, format `AIza[0-9A-Za-z_-]{35}` |
| Whose | The **old site's** key, embedded by the Loggia CMS template — not a key this project ever created or used |
| Where | `content/raw/`, **43 files, one occurrence each**. The template loads Maps on every page, so every Phase 0 scrape carried it |
| Exposure | Present in the initial public commit. Found by GitHub secret scanning and confirmed by an independent clone-audit |
| Not affected | Nothing in `src/` or the content JSONs referenced the literal value. The running site does not use a Maps key — `EstateMap` is a photograph with hotspots, not an embed |
| Repository fix | Every match replaced with `AIZA_KEY_REDACTED`, URL structure left intact so the dumps keep their provenance value. History rewritten (`--amend` + force-push) — the repo was one commit deep, so the rewrite is complete |
| Real fix | **Restrict or rotate the key at the Google Cloud console**, or notify Loggia if it belongs to their account |

**Redaction is hygiene, not the remedy.** A key that has been public should be
treated as harvested. After a force-push GitHub can still serve the old blob by
SHA for a period, and any clone or scrape taken in the window keeps it forever.
The repository work removes the ongoing advertisement; only rotation removes the
risk.

**What went wrong on our side, honestly:** the pre-commit gates were real and
they held for every pattern they carried — the scan returned zero for `sk-`,
`ghp_`/`gho_`, `AKIA`, `xox*` and PEM blocks, and that was true. Two things were
missing. The pattern list had no Google format. And `content/raw/` was not being
scanned at all, because scraped dumps were being treated as data rather than as
text that can hold a secret — which is precisely backwards, since third-party
HTML lifted off a live production server is the likeliest carrier in the whole
project. Both are now `CONVENTIONS.md` §13.

---

## 2. Judged public by design — not findings

These reach the browser by necessity and are published in the live page source
of the sites they came from. They carry no privilege beyond an origin or domain
restriction held on the provider's side. Listed here so that any future scanner
alert on one is answerable in a single line.

| Value | What it is | Why it is public |
|---|---|---|
| `6Ldn5jYUAAAAAHV8v0apDoa8Hd1O67fo92WqpWRY` | reCAPTCHA **site** key | The site key is rendered into the form markup for the widget to load. The paired **secret** key is the credential, is server-side only, and does not appear anywhere in this repository |
| `6Ldt5NsqAAAAACyPmPnIcXmcyl3jTPmHsmocTN0f` | reCAPTCHA **site** key (second property) | As above |
| `UA-60860354-2` | Google Analytics (Universal) property id | A measurement identifier, not a credential. Sent in every page's analytics call |
| `G-485QZPKQQL`, `G-M0MVYDZ5VD`, `G-Q7S47V3TMD` | GA4 measurement ids | As above |
| `GTM-KWBL9BD` | Google Tag Manager container id | As above. A container id names a public container; it grants no access to the GTM account |

All of these live in `content/raw/`, `content/raw-booking/`, `content/raw-chh/`
and `content/text/` — i.e. in the **captured** old site, not in code this
project ships. None is used by `src/`.

They do not currently match any scanner pattern. If a future pattern catches
one, add the exact value to `PUBLIC_BY_DESIGN` in `scripts/scan-secrets.mjs`
**and** a row here — never by loosening a pattern, so that a real secret which
merely resembles one still fails.

---

## 3. Standing policy

- **No credential in this tree, ever** — not in code, not in content, not in an
  ignored file. `.gitignore` blocks `.env`, `.env.*`, `*.pem`, `*.key`, `*.p12`,
  `*.pfx`, `*.crt`, `.vercel/`, `secrets.json`, `credentials.json`. That block is
  a backstop, not the policy.
- **When the enquiry form gets a mail provider**, its API key goes into **Vercel
  → Project → Settings → Environment Variables** and is read via `process.env`.
  It does not get committed, and it does not get a `.env` file here.
- **Run `npm run scan:secrets` before every push and at every phase STOP.**
- **If a secret is ever found:** rotate at the provider first, redact second,
  rewrite history third, and record it in section 1 above. In that order.

---

## 4. Audit — 2026-09-13 (tranche twelve)

Structured pass over headers, dependencies, the enquiry form, embeds, outbound
links, personal data in logs and URLs, and secrets. Every **header** and
**enquiry-form** fix below is asserted in `tests/security.spec.ts` against the
served build, not read out of config. The dependency fixes (4.3) are not a test:
they rest on `npm audit`, whose current report is captured in `qa/security/`.
The follow-up of 2026-09-14 (the nonce policy on the contact page, 4.1; the
frame-policy consistency, 4.5; the captured audit, 4.3) is marked where it
lands. Its code and spec additions were built, served and run on 2026-09-14,
and the header count was repeated on the Vercel production deployment; 4.1 says
exactly what ran where.

### 4.1 Response headers — fixed

Before: the project sent **none** of its own. Vercel adds HSTS on its own
domains; nothing else was set.

| Header | Now | Why this value |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'`; `script-src 'self' 'unsafe-inline'`; `style-src 'self' 'unsafe-inline'`; `img-src 'self' data: blob:`; `font-src 'self'`; `connect-src 'self'`; `media-src 'self'`; `worker-src 'self' blob:`; `manifest-src 'self'`; `frame-src 'none'`; `frame-ancestors 'none'`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'` | The site loads nothing third-party — fonts and images are self-hosted and booking is an outbound link — so everything except script and style is `'self'` or `'none'` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` | Two years. No `preload` — see deferrals |
| `X-Frame-Options` | `DENY` | With `frame-ancestors 'none'`, for browsers that predate it. Nothing frames this site |
| `X-Content-Type-Options` | `nosniff` | |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | The booking engine still sees the origin a guest came from; never the path |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()` | None is used. Payment happens on the booking engine's own origin |
| `Cross-Origin-Opener-Policy` | `same-origin` | Every new-tab link is already `noopener`; this makes it structural |

The policy is exercised as well as asserted: seven routes are loaded and
scrolled end to end with it on, and one `securitypolicyviolation` fails the run.
Each of those loads is a new document, so since 2026-09-14 the walk also makes
two client-side navigations, each with a check that it did not reload the page:
from a `/en/contact` document to the estate and back, and from a villa to the
contact page through its Enquire link. What each one proves is below.

**/en/contact gets a stricter variant (2026-09-14).** The contact page reads
`searchParams`, so Next renders it on every request already: it is absent from
the build's prerender manifest (68 prerendered entries, contact not among them)
and the served build sends it `Cache-Control: private, no-cache, no-store`. A
per-request nonce therefore costs it nothing it was not already paying.
`src/proxy.ts` — the Proxy file convention of Next 16 — generates a nonce per
request and sends the same policy with `script-src 'self' 'nonce-…'
'strict-dynamic'` and no script `'unsafe-inline'`. It sets the policy on the
request as well as the response, which is where Next reads the nonce from to
stamp it on its own chunk tags, inline flight data and React's streaming
scripts (the mechanism in Next's own CSP guide, shipped in
`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`).
Every other header is still sent on every route from `next.config.ts`.
style-src is unchanged, because a nonce cannot cover the `style` attributes
next/image and the motion libraries write, and would switch `'unsafe-inline'`
off for them.

**Where the nonce policy is in force, exactly.** A policy belongs to a
document, and the nonce policy applies when `/en/contact` is loaded as one: a
direct visit, a reload, the legacy-URL 301, the homepage's enquiry buttons and
the error page's contact link (both plain `<a>`). The site's `next/link` CTAs
into the contact page — Weddings, each experience, each villa's "Enquire", the
404 page's contact link — are client-side navigations. After one of those the
document is still the page the guest came from, under the static policy, and
the contact page renders inside it under that policy. The reverse holds too: a
guest who lands on `/en/contact` keeps the nonce policy on every page they then
open client-side. The walk's first navigation exercises the nonce policy after
a soft navigation. The second does not; it shows the contact page's client code
is clean under the static policy it gets on the in-site path.

**One source per response, by construction.** `next.config.ts` sends its
static CSP on every path `src/proxy.ts`'s matcher does not admit. The proxy
sends a policy on every path it does admit: the nonce one on every request
whose `nextUrl.pathname` is `/en/contact` — the document, and its RSC and
`_next/data` requests, which Next normalises to that pathname before the proxy
runs — and the static one on every other spelling it admits, all of them 404
pages. The config's exclusion and the proxy's matcher are the same regex
fragment, character for character:

- the contact path in any letter case, spelled with character classes, because
  Next matches header sources case-insensitively but compiles the proxy
  matcher into a case-sensitive RegExp;
- with any `.…` or `/…` tail, which also absorbs the `.json`, `.rsc` and
  segment-prefetch suffixes Next appends to a matcher;
- with any `_next/data/<id>/` prefix.

The first version of this carve-out (earlier on 2026-09-14) missed spellings.
`/en/contact.html`, `/en/contact.txt`, `/en/contact.<anything>` and `/EN/contact`
got no policy, and `/_next/data/<id>/en/contact.json` got both. All of those are
404s with no reflected input, but the claim that every path got exactly one
policy was false. They are now in the spec and in the header script.

One overlap is left, and it comes from Next. The proxy is also matched against
the percent-decoded path, while header sources see the raw one. So a spelling
like `/en/%63ontact.html` matches both, and both send the static policy.
`/en/%63ontact` itself used to be the example. Locally it was a 404, but **on
the Vercel production deployment it returned 500**, still with exactly one
static policy (`qa/security/production-headers-2026-09-14.txt`).

That 500 turned out to be a class: every percent-encoded spelling that decodes
to the contact page, and no other page. The proxy now answers the whole class
with a 308 to the literal `/en/contact` (D-025,
`qa/security/ENCODING-tranche13.md`). The exception behind the 500 is still not
established.

**What was checked, and what was not.**

- **Partition check.** `node scripts/check-headers.mjs --compile` needs no build
  and no network. It reads both patterns and the nonce branch out of the two
  files and compiles them with Next 16.3.5's own route compilers. It then walks
  25,533 distinct spellings. It checks that each gets its policy from exactly
  one place under `next start`'s matching, and under all four letter-case
  combinations a platform could apply to the manifest regexes. The only
  double match was the percent-decoded case above, with the static policy on
  both sides. It ran on 2026-09-14 and passed. It models Next's routing; it
  sends no request.
- **Why a local spec run is not enough.** A spec run against `next start`
  cannot show the two policies stacking. Next collects config and proxy headers
  under differently-cased keys, and Node's case-insensitive `setHeader` lets
  the proxy's value replace the config's. So the spec's one-policy assertions
  catch a missing or wrong policy, never a doubled one.
- **Raw header count.** `node scripts/check-headers.mjs <url>` counts raw
  header lines. Against the Vercel deployment it is the only check here that
  can show a doubled policy. On 2026-09-14 it passed against the served
  candidate build that contains `src/proxy.ts`, and then against the **Vercel
  production deployment of `3087312`**: exactly one policy on every response.
  The nonce policy was on `/en/contact`, with a fresh nonce on a second request,
  and on its query-string, `.rsc` and `_next/data` forms. The static policy was on
  every other route and every other spelling of the contact path, the
  segment-prefetch `/en/contact.segments/_tree.segment.rsc` included
  (`qa/security/production-headers-2026-09-14.txt`). Production and local differ
  in two status codes, not in policy: `/en/contact.rsc` is 200 on Vercel and 404
  locally, and `/en/%63ontact` is 500 on Vercel (above). An earlier run against
  the 56cb859 build, which has no proxy, only exercised the script.
- **What the spec asserts.** The spec's `the nonce policy on /en/contact` block
  asserts:
  - a policy on the response;
  - a nonce and `'strict-dynamic'` in script-src, and no `'unsafe-inline'`
    there;
  - every other directive identical to the static policy;
  - every `<script>` in the page's HTML carrying the header's nonce;
  - a different nonce on a second request;
  - the prerendered routes still on the static policy;
  - the other contact spellings on the static policy.

  All of them, the navigation steps in the walk included, passed against the
  served candidate build that contains the proxy: `tests/security.spec.ts`
  20 of 20 on 2026-09-14, with the full QA suite at 553 passed / 0 failed and
  WebKit smoke at 14 of 14 on the same build. The spec runs locally only.
- **Production.** Verified by the raw header count on the Vercel deployment of
  `3087312`, as recorded above. Nothing else here was run on production.

### 4.2 Deferred, with reasons

| Item | Why not now | What would change it |
|---|---|---|
| **Nonce- or hash-based `script-src` on the prerendered routes** (dropping `'unsafe-inline'` everywhere but /en/contact, which has it when loaded as a document — 4.1) | Next inlines its flight data and React its streaming scripts. On statically prerendered pages those are written at build time and differ per page and per build, so they cannot be hashed in a config file. A nonce needs a per-request render, and Next's CSP guide says so plainly: on these routes it means giving up the prerendered HTML and its CDN caching. That cost has **not been measured** — the deferral is a judgement, not a benchmark. The exposure `'unsafe-inline'` leaves is script injection, and the site has no user-generated content and renders no untrusted HTML — the one reflected parameter is now an allowlist (4.4) | A measured first-byte and caching cost the owner accepts, a page that renders untrusted input, or Next shipping build-time hashes for prerendered inline scripts |
| **`experimental.sri`** | Next 16.3.5 accepts it and wires it into the Turbopack build (`next/dist/build/turbopack-build/impl.js`, whose manifest loader writes a subresource-integrity manifest). It puts `integrity` on the external chunk scripts only (`next/dist/server/app-render/required-scripts.js`); the inline flight scripts get a nonce or nothing (`next/dist/server/app-render/use-flight-response.js`). Read from the source, so on a prerendered page it cannot remove `'unsafe-inline'`, and it would add a hash check to files that are already `'self'` and immutable. Not enabled, and not tried in a build | Next hashing its inline scripts at build time |
| **HSTS `preload`** | Submitting the domain to the browser preload list binds every subdomain to HTTPS for years and is slow to undo. That is the owner's decision (`DECISIONS.md` D-013) | The owner confirming every subdomain is HTTPS, on launch day |
| **A durable rate limit** | There is no endpoint to limit. The form delivers nothing until a mail provider is wired, and `src/lib/rate-limit.ts` is a per-instance stub that cannot bound a serverless deployment | The mail-provider route. It must use a shared store or Vercel's firewall rate limiting, and check `ENQUIRY_LIMITS` on the server |
| **Server-side honeypot and validation** | Same reason — no server route yet | Same |

### 4.3 Dependencies — patch and minor fixes only

`npm audit` before the fix: **1 critical, 2 high**.

| Package | Installed | Advisory | Fix |
|---|---|---|---|
| `next` (direct) | 16.3.1 | Critical: unauthenticated RCE on Windows-hosted servers (GHSA-p293-qw3h-jr36), and RCE in the image optimisation API with AVIF (GHSA-2xp9-vwfh-vxw4). The second applies to this site: `images.formats` serves AVIF | **16.3.5** (patch; `package.json`'s `^16.3.0` range already allowed it, so only the lockfile moved) |
| `sharp` (transitive) | 0.35.3 | High: libheif (GHSA-rgj7-g3m4-5g8c). Reachable through image optimisation and the owner-material pipeline, which accepts HEIC | **0.35.4** (patch, through `next`) |
| `js-yaml` (transitive) | 4.3.1 | High: merge keys not bounded, CPU use (GHSA-2883-xcg3-v3hh) | **4.3.2** (patch, through `@eslint/eslintrc`, dev only) |

Applied with `npm audit fix`, **without** `--force`, so nothing outside the
existing semver ranges could move: 6 packages changed in the lockfile. After:
**0 vulnerabilities**.

**Captured (2026-09-14).** Neither report was saved at the time, and npm's own
logs from then have rotated away, so the before figures above rest on this
record and the lockfile diff, not on a saved report. The after state was re-run
read-only (`npm audit`, `npm audit --json`; no `fix`) at 06:46 UTC on HEAD
`56cb859`: **found 0 vulnerabilities** across 450 dependencies (26 prod, 386
dev, 89 optional). The raw output is `qa/security/npm-audit-tranche12.json` and
`qa/security/npm-audit-tranche12.txt`, the latter with the date and commit in
its header line.

One warning worth recording: npm's allow-scripts check did not run
`unrs-resolver`'s postinstall (a dev dependency of the lint toolchain). It was
not added to the allowlist: lint was re-run against it instead. `npm run lint`
exits 0 on the patched tree. The one notice it prints is `jsx-ast-utils`
failing to resolve non-null (`!`) JSX props in `TheRun.tsx`, which predates this
audit and is unrelated to the skipped script.

### 4.4 The enquiry form's abuse surface

| Finding | Before | Now |
|---|---|---|
| **Content spoofing through `?enquiry=`** | Any value was printed into the form's "About" field, so a link could put any sentence on the site's contact page — *"your booking is cancelled, call this number"* | An allowlist of the subjects the site's own CTAs send (villa slugs, `estate`, the experiences, Weddings & Events). Anything else is dropped. Next still carries the raw query in its router state, as the page segment's key in the inline flight payload. That is JSON-escaped and never rendered, and the spec asserts both halves: the text never reaches what a guest sees, and a `</script>` in the query cannot break out and run |
| **Personal data into the URL** | The form had no `method`. A submit before hydration, or with scripting off, went by GET — name, email and message into the address bar, the history and the host's access log | `method="post"`. Asserted with scripting off |
| **Size limits** | None | `maxLength` on every field, plus the same limits in validation, from one source (`src/lib/enquiry-limits.ts`) that the future server route must enforce again |
| **Honeypot** | Present, client-side only | Unchanged, and now asserted. Server-side check deferred (4.2) |
| **Rate limiting** | None | Stub in `src/lib/rate-limit.ts`, tested. The durable control is deferred (4.2) |

### 4.5 Clean — checked, nothing to fix

- **Third-party embeds:** none. No iframe, video embed or map frame on any route,
  and the policy says so: `frame-src 'none'`. The YouTube channel is an outbound
  link. The spec fails if any frame appears on the four routes it loads (2026-09-14;
  it used to allow `www.youtube-nocookie.com`, which the policy would have
  blocked anyway). **A future YouTube embed needs both halves at once:** the
  privacy-enhanced host `www.youtube-nocookie.com` (the ordinary one sets cookies
  on load) **and** `frame-src` opened to exactly that host in `next.config.ts`
  and `src/proxy.ts`, with the spec's no-frame guard turned into a host check.
  Changed markup alone gets a frame the browser refuses. Clean today means "no
  embeds", not "privacy-enhanced mode enforced".
- **Outbound links:** every `target="_blank"` link carries `rel="noopener
  noreferrer"`. In source, all eight sites in `src/` (a grep). In the rendered
  DOM, on the four routes the spec loads — `/`, `/en/villas/villa-thoi`,
  `/en/contact`, `/en/weddings`. `/en/the-estate`, `/en/experiences` and
  `/en/gallery` rest on the source check only.
- **Personal data in logs:** the only `console` call in `src/` is the error
  boundary, which logs Next's error digest and the error, never form input. The
  owner-material pipeline never logs or stores a Drive ID (`DECISIONS.md` D-011).
- **Secrets:** `npm run scan:secrets` over everything git can see — 474 text
  files, 624 binaries skipped on 2026-09-14, **no credential-class match**. The
  Google Maps key stays redacted (§1), and the public-by-design identifiers in §2
  are unchanged.
- **An ignored `.env.local` sits in the working tree (found 2026-09-14, when
  `next build` reported loading it).** It holds one key, `VERCEL_OIDC_TOKEN`,
  with a value; the value was not printed or copied anywhere. The file was
  created on 2026-08-17, before this audit, by the look of it by the Vercel CLI,
  which writes this file on `vercel link` or `vercel env pull` (an inference, not
  checked). It is gitignored (`.gitignore:110`, `.env*`) and has never been
  tracked. A search of the built client chunks (`.next/static`) finds no
  `VERCEL_OIDC`: Next inlines only `NEXT_PUBLIC_` variables into the browser
  bundle. Vercel's OIDC tokens are short-lived, so this one has very likely
  expired (also an inference). `scan:secrets` cannot see it, by design, because
  it scans only what git can see. It is still a credential in the tree, which
  the standing policy (§3) rules out even in an ignored file. **Owner or
  maintainer action:** delete the file, or say it is wanted. The CLI writes it
  again on the next `vercel env pull`. This session did not touch it.
