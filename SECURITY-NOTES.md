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
links, personal data in logs and URLs, and secrets. Every fix below is asserted
in `tests/security.spec.ts` against the served build, not read out of config.

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

### 4.2 Deferred, with reasons

| Item | Why not now | What would change it |
|---|---|---|
| **Nonce- or hash-based `script-src`** (dropping `'unsafe-inline'`) | Next inlines its flight data and React its streaming scripts. On statically prerendered pages those differ per page and per build, so they cannot be hashed in a config file. A per-request nonce makes every page dynamic: no CDN-cached HTML, and a slower first byte on the connection this site is tuned for. The exposure `'unsafe-inline'` leaves is script injection, and the site has no user-generated content and renders no untrusted HTML — the one reflected parameter is now an allowlist (4.4) | A page that renders untrusted input, or Next shipping build-time hashes for prerendered inline scripts |
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

- **Third-party embeds:** none. No iframe, video embed or map frame on any route.
  The YouTube channel is an outbound link. The spec fails if a frame ever
  appears on a host other than `www.youtube-nocookie.com` (privacy-enhanced mode).
- **Outbound links:** every `target="_blank"` link carries `rel="noopener
  noreferrer"`, in source and in the rendered DOM.
- **Personal data in logs:** the only `console` call in `src/` is the error
  boundary, which logs Next's error digest and the error, never form input. The
  owner-material pipeline never logs or stores a Drive ID (`DECISIONS.md` D-011).
- **Secrets:** `npm run scan:secrets` over everything git can see — 460 text
  files, 624 binaries skipped, **no credential-class match**. The Google Maps
  key stays redacted (§1), and the public-by-design identifiers in §2 are
  unchanged.
