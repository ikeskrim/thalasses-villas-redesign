# Deployment

**This file is the source of truth for the pipeline. Read it; do not infer the
state of the infrastructure from memory, from a previous session's report, or
from what a local CLI says.** (`CONVENTIONS.md` §15.)

Last verified: 2026-08-18, by the owner.

---

## Current state — the pipeline is LIVE

| | |
|---|---|
| Repository | https://github.com/ikeskrim/thalasses-villas-redesign (public) |
| Production branch | `main` |
| Vercel team | `domisi` |
| Git integration | **connected** — `vercel git connect` is done |
| Auto-deploy | **on**. Every push to `main` builds and deploys automatically |
| Deployment protection | **disabled** — preview and production URLs open without a Vercel login |
| Environment variables | **none required.** Booking is an outbound deep link; there is no server-side integration yet |
| Search indexing | **`noindex` site-wide, deliberately.** See below |

### What this means for how we work

- **Pushing to `main` deploys.** There is no separate deploy step, and no
  command for the owner to run.
- **Do not tell the owner to run `vercel login`, `vercel link`,
  `vercel git connect` or `vercel --prod`.** All of that is already done. Two
  sessions have now instructed him to do it; that instruction was wrong both
  times and is what this file exists to prevent.
- Each push produces a deployment. To see a change on a phone, push and wait for
  the build.

### Why the previous sessions got it wrong — worth knowing, so it is not repeated

The claim "Vercel is not connected" came from running `npx vercel whoami` in this
workspace and reading `Logged out`.

**That check answers a different question than the one being asked.** The Vercel
CLI's auth state is *local to this machine's shell*. The GitHub↔Vercel git
integration is a *server-side link between two accounts*, and it is completely
unaffected by whether any particular terminal is logged in. A logged-out CLI on a
build agent tells you nothing at all about whether `main` auto-deploys.

This is the same failure shape as `CONVENTIONS.md` §12: an instrument was pointed
at a layer adjacent to the one the question was about, and its answer was
reported as though it settled the question. The correct instrument here is the
Vercel dashboard, or the owner — not `whoami`.

### Environment variables

#### `SITE_URL` — optional today, and the whole of launch day

Every canonical, every OpenGraph image URL, the sitemap and the sitemap line in
`robots.txt` are absolute, and all four read their origin from one place:
`src/lib/site-url.ts`. It used to be hard-coded in three files.

| | |
|---|---|
| **Name** | `SITE_URL` |
| **Where** | Vercel → Project → Settings → Environment Variables |
| **Value** | An origin only — `https://thalasses.com`. No trailing slash, no path. A path or a trailing slash **fails the build** rather than quietly producing `https://thalasses.com//en/terms` in every canonical on the site |
| **Required?** | **No.** Unset, it falls back to `https://thalasses.com`, so nothing has to be configured for today's behaviour |
| **`NEXT_PUBLIC_`?** | **No.** It is read at build time by the metadata, the sitemap and robots, all server-side. Prefixing it would ship it into every browser bundle for no purpose |

**Precedence**, and why each step exists:

1. `SITE_URL` if set — an explicit answer always wins, which is what makes a
   staging copy able to know it is staging.
2. On a Vercel **preview** deployment, the deployment's own URL. Without this a
   preview build emits OpenGraph images pointing at `thalasses.com`, so sharing
   a preview link renders a card **fetched from the client's live site**. Not
   visible from the dashboard, and exactly the sort of thing that embarrasses a
   handover.
3. On a Vercel **production** deployment, the project's production domain.
4. `https://thalasses.com`.

`tests/site-url.spec.ts` asserts the canonical, the sitemap and robots all name
the same origin whatever that origin is, that every `og:image` is absolute and
on it, and that **no source file hard-codes the domain any more**.

#### The one environment variable that will exist

When the enquiry form is connected to a mail provider, it needs exactly one:

| Name | Where | Notes |
|---|---|---|
| `RESEND_API_KEY` | Vercel → Project → Settings → Environment Variables | Server-side only. **Never** `NEXT_PUBLIC_`-prefixed — that would ship the key to every browser. Never in a file in this tree, not even an ignored one |

Until it exists the form validates and shows its success state, and says
plainly that it is not connected. A form that silently discards an enquiry is
worse than one that admits it cannot send yet.

---

## Search indexing — OFF, on purpose

The deployment currently serves `noindex` site-wide. This is not an oversight and
must not be "fixed":

**The live business site is still `thalasses.com`.** If this build were indexed
now it would compete with the client's own live site for its own brand terms, and
split the ranking of a property that is already ranking. Nothing is gained by
indexing a pre-launch build.

**Flipping indexing on is a launch-day task, tied to the domain move**, and it
happens in this order:

1. The domain is pointed at this deployment.
2. The 301 map in `content/url-map.md` is verified live against the old URLs.
3. Only then does `noindex` come off, in the same change.

Doing step 3 before steps 1 and 2 is how a migration loses its rankings.

---

## Keeping this file honest

Update it in the same commit as any change to: the repository, the branch that
deploys, the team, the protection setting, environment variables, the domain, or
the indexing flag. A stale `DEPLOY.md` is worse than none, because it is
believed.
