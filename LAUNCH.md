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

- The **helipad exclusivity** wording — "the only seafront villas with helipad".
  Its geographic scope has never been confirmed.
- The **hero sub-line**, shipping as a working default.
- **Villa Pueblo's** bathroom detail, view and distance (T-212).
- The **eight beach distances**.
- The **terms**: they name another company, *Ink Hotel*, seven times. The site
  shows the correction visibly marked and states that legal review is pending.
  **Do not launch with that notice still on the page** without a decision.

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

Do not attempt to fix a broken launch by pushing under traffic.
