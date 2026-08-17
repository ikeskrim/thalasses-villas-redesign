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
