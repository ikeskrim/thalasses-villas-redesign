# Launch runbook

**This is a runbook, not a script. Nothing here runs automatically, and launch
is owner-triggered.** Read it through before starting; several steps are hard to
undo and two of them decide whether the site keeps its search rankings.

Current state is in `DEPLOY.md`. Read that first — it is the source of truth for
the pipeline, not this file and not anyone's memory.

---

## Before the day

### 1. The redirect gaps are CLOSED — verify, do not re-derive

**All fifteen were closed in the dress rehearsal (T-299), and `content/redirect-gaps.json` is empty.** The parity certificate reads **Legacy URLs 51 / 51**.

None was closed by building a route to satisfy the map. Every one was repointed at a page that already exists and already carries the content — five `/gallery` sub-pages to their villa or estate page, four `/en/amenities/*` to the estate or location page, five experience slugs to the inventory's own slug, and `/en/thalasses-rituals` to `/en/weddings`.

**That last one was a redirect LOOP, not a 404** — the path was both a source and a target, so it pointed at itself. A 404 loses a page; a loop hangs the browser.

Still run the harness before DNS moves. It is fast, and it is the difference between believing the map and knowing it:

```bash
npm run redirects && npx playwright test tests/redirects.spec.ts
```

It drives every installed redirect through the built app and asserts its status and destination, and it asserts the dead set is **exactly** the tracked set — so a gap cannot be forgotten and a new one cannot appear unnoticed.

**One owner question survives the closure.** It is not a gap, because the redirect resolves; it is a question about whether it resolves to the right page. `/en/jet-ski-safari-1.html` was titled *"Water Sports"* on the legacy site and there is no combined water-sports page in the inventory. It now lands on `/en/experiences/jet-ski-safari`, the nearest real thing. If the legacy page covered more than jet skis, change the destination.

### 2. Decide the fragment and template rows

`npm run redirects` reports these on every run and they are **uninstallable rather than dead** — three fragment sources (a server redirect cannot see a `#hash`) and five template rows that describe a pattern rather than a literal path.



Eight legacy addresses are anchors on the old single-page homepage
(`/en/index-1.htm#category571`). **A fragment never reaches the server**, so no
301 can honour them. Options, in order of preference:

1. Accept the loss — they are anchors, not pages, and rarely earn links.
2. Add client-side handling on `/` that reads the fragment and routes onward.

Decide deliberately. Doing nothing is option 1 by default.

### 3. Confirm the owner-pending items

Nothing below blocks launch technically, but each is a claim on a live page:

- The **helipad exclusivity** wording. Resolved as a default by `DECISIONS.md`
  D-010: the page says "with private helipad" and never "the only". Restoring
  the superlative needs the owner to confirm its geographic scope.
- The **hero sub-line** — approved as the working line (D-008).
- **The reviewer defaults D-003 to D-010** — their veto window closes at step 0
  below, or on 2026-09-25, whichever comes first.
- **Villa Pueblo's** bathroom detail, view and distance (T-212).
- The **eight beach distances**.
- The **terms**: they name another company, *Ink Hotel*, seven times. The site
  shows the correction visibly marked and states that legal review is pending.
  **Do not launch with that notice still on the page** without a decision.
- **HSTS preload**: staged, not applied (`DECISIONS.md` D-021, D-013). The site
  already sends `Strict-Transport-Security: max-age=63072000; includeSubDomains`
  on every response. Adding `preload` and submitting the domain binds **every**
  subdomain of `thalasses.com` to HTTPS for years. Before anyone does that, the
  owner lists every hostname in the domain's DNS zone and confirms that each one
  serves HTTPS. See **After launch → HSTS preload**.
- **Vercel OIDC token generation**: the project does not use OIDC. D-028 asked
  for the old token to be revoked. Vercel has no per-token revocation, and that
  token expired by 2026-08-18. The matching Vercel-side step is the owner's:
  Project → Settings → Security → "Secure backend access with OIDC federation",
  turn token generation off (`DECISIONS.md` D-030).

---

## Launch day, in order

The order matters. Doing step 5 before steps 1–4 is how a migration loses its
rankings.

### 0. Set `SITE_URL` — do this first, it is one field

Vercel → Project → Settings → Environment Variables:

```
SITE_URL = https://thalasses.com
```

An origin only. No trailing slash, no path — both **fail the build** rather than
silently producing `https://thalasses.com//en/terms` in every canonical.

This is the whole of the domain change. Every canonical, every OpenGraph image
URL, the sitemap and the sitemap line in `robots.txt` read from it. Before
`SITE_URL` existed the domain was hard-coded in three separate files and this
step was "find all three under time pressure, or find two".

Leaving it unset is safe — it falls back to `https://thalasses.com` — so set it
anyway, because an explicit value is the thing that lets a future staging copy
know it is not production.

### 1. Point the domain

Vercel → Project → Settings → Domains → add `thalasses.com` and `www`. Follow
the DNS records Vercel gives you; they are authoritative and change over time.

Wait for the certificate to issue before continuing. Minutes, usually.

### 2. Verify the site on the real domain

Walk it as a visitor: homepage, one villa, the estate, a booking link.
Confirm a booking deep link opens the real engine at
`thalassesvillas.reserve-online.net` with `lang=en`.

**Do this in a normal browser, by hand. A script cannot.** Rehearsed on
2026-09-11: the CDN in front of `reserve-online.net` answers **403** to every
automated request — `curl`, a headless browser, and a fetcher on a different
network — for this property and for others on the same platform, while
WebHotelier's own site answers normally. So a scripted check of the booking
link will fail on launch day and that failure means nothing; a human click that
opens the engine in English means everything. Do not "fix" the scripted check
by disguising it as a browser. `node scripts/launch-rehearsal.mjs` already
verifies everything about the link that can be verified without opening it:
the host, `lang=en`, and that nothing but dates and party size is passed.

### 3. Verify the 301s **against the live domain**

Not against localhost. Spot-check by hand:

```bash
curl -sI https://thalasses.com/en/property/200.html | head -3
```

Expect `308` (Next's permanent redirect) and a `location` of
`/en/villas/villa-thoi`.

Do this for at least: a villa, the estate, an experience, and the terms.

### 4. Check the legally required display

The operating licence — **1041K91003163701** — must be visible in the footer.
There is a test for it, but look with your eyes on the live domain.

### 5. Only now, allow indexing

**This has been rehearsed. It works, and this is exactly what it produces.**

In `src/app/robots.ts`, replace the blanket rule:

```
    rules: { userAgent: "*", disallow: "/" },
```

with:

```
    rules: { userAgent: "*", allow: "/", disallow: ["/styleguide"] },
```

Rebuild and `curl https://thalasses.com/robots.txt`. It must read exactly:

```
User-Agent: *
Allow: /
Disallow: /styleguide

Sitemap: https://thalasses.com/sitemap.xml
```

The sitemap already carries **35 URLs, every one of them reachable and none of them a 404** — asserted by `tests/sitemap.spec.ts`, which also asserts that every route on disk is either sitemapped or excluded with a written reason. `/styleguide` is the only exclusion.

Push. Update `DEPLOY.md` in the same commit.

**Why last:** until the domain is yours and the redirects work, indexing this
build competes with the client's own live site for its own brand terms and
splits the ranking of a property that is already ranking.

### 6. Search Console

- Add the property; verify by DNS.
- Submit `https://thalasses.com/sitemap.xml`.
- Use the **Change of Address** tool only if the domain itself changes. It is
  not needed for a same-domain rebuild.
- Watch Coverage for two weeks. A rise in 404s means a redirect gap you accepted
  was more valuable than it looked.

---

## After launch

### The Loggia sunset

The old site is a static export served from the legacy CMS. Do not switch it off
the same day.

1. Keep it running, unindexed, for at least two weeks.
2. Watch Search Console for 404s pointing back at it.
3. Only then ask Loggia to decommission.

**Before it goes:** confirm nothing still links to `loggia-cdn` — every
photograph on this site is served locally from `public/images` and nothing is
hotlinked, but confirm rather than assume.

### HSTS preload

**Hard to undo, and the owner's call. It is staged here; no session applies
it** (`DECISIONS.md` D-021, D-013).

Preloading puts `thalasses.com` on a list that ships inside every major browser.
From then on every subdomain is HTTPS-only in those browsers, including
subdomains created later. Removal is a request that reaches visitors only through
browser releases, over months, and some browsers may never drop it.

It comes after the Loggia sunset on purpose: the legacy host's DNS and HTTPS have
to be settled first. The steps below restate hstspreload.org's published
requirements. Re-read that page when you do this, because they are its
requirements, not this file's.

1. **Inventory.** List every record in the `thalasses.com` DNS zone: `www`,
   mail, webmail, the legacy CMS host, anything else. Each hostname that
   answers must have a valid certificate and serve HTTPS. Anything that cannot
   is a blocker, not a detail.
2. **Pre-checks on the live domain**, from an ordinary machine. The first must
   redirect to `https://thalasses.com/` on the **same host**, before any hop to
   `www`:

   ```bash
   curl -sI http://thalasses.com/
   ```

   The second must redirect to HTTPS:

   ```bash
   curl -sI http://www.thalasses.com/
   ```

   The third must carry `strict-transport-security`. If that response is itself
   a redirect to `www`, the redirect must carry the header too:

   ```bash
   curl -sI https://thalasses.com/
   ```

3. **The change, in one commit:**
   - `next.config.ts` → `max-age=63072000; includeSubDomains; preload`. Two
     years is already over the one-year minimum.
   - The header assertion in `tests/security.spec.ts`. It requires the value to
     end at `includeSubDomains` today, so it changes in the same commit or every
     header test fails.
   - The comments in `next.config.ts` and `SECURITY-NOTES.md` §4 that say preload
     is absent.
   - A new `DECISIONS.md` entry that supersedes D-013's "no preload".
   - `DEPLOY.md`.
4. **After the push**, repeat step 2, then check the headers on the real domain:

   ```bash
   node scripts/check-headers.mjs https://thalasses.com
   ```

5. **Submit** at hstspreload.org. The owner does this, and the date goes into
   `DEPLOY.md`.
6. **To take it back:** remove `preload` from the header, then file the removal
   request at hstspreload.org. Expect months.

### The Google Maps key

`SECURITY-NOTES.md` §1. The legacy site's Maps key was found in the Phase 0
scrapes and is redacted here, but **a key that has been public should be treated
as harvested**. Restrict or rotate it in the Google Cloud console, or tell Loggia
if it belongs to their account. GitHub alert #1 stays open until that is
confirmed.

### The enquiry form

Currently validates and says plainly that it is not connected. To finish it:

1. Add `RESEND_API_KEY` in Vercel → Settings → Environment Variables.
   **Server-side only — never `NEXT_PUBLIC_`-prefixed**, which would ship the
   key to every browser.
2. Ask a developer to wire the send.
3. Test with a real address before announcing it.

### Analytics

**An owner decision, not a default.** No analytics is installed. If you add it,
it is a consent question in the EU, and the cookie banner you will then need is
a design problem worth thinking about before it is a legal one.

---

## Rollback

If something is wrong after the domain move: **point DNS back**. Vercel
deployments are immutable and every push is a separate one, so the previous
build is still there and can be promoted from the Vercel dashboard in seconds.

Pointing DNS back does **not** undo HSTS. A browser that has seen the header
keeps the domain HTTPS-only for the header's two years. Once the domain is on the
preload list, that holds in every browser that ships the list.

Do not attempt to fix a broken launch by pushing under traffic.
