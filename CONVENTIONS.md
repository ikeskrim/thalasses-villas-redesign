# Standing rules

Codified from review rulings. These are not style preferences — each one was written after a
specific failure, and each is enforced somewhere in the suite.

---

## 1. The screenshot gate

**Every STOP includes a screenshot review at 1440 and 390.** Not a deliverable to carry — a gate to
pass, before the report is written.

*Why.* 65 tests passed while a stock photograph of a cyclist rendered on the homepage. The tests
asserted what someone had thought to assert; the screenshot showed what was actually there.

> Machine checks verify what is asserted. Screenshots verify what nobody thought to assert.

Corollary: when a screenshot reveals a defect, add the assertion **and** keep the gate. The
assertion stops that defect recurring; the gate catches the next unimagined one.

## 2. Content policy lives in single resolvers

**Never per component.** If a rule governs what may appear, it belongs in the one function every
component already calls.

*Applied.* `localImage()` in `src/lib/content.ts` returns `null` for any image ruled off the site.
No component can render one, including components not yet written.

*Why.* The curation rulings were applied to the curation data, and the stock cyclist still rendered
— because `DragRegister` read `experience.heroImage` directly and never consulted the selects. A
per-component filter is one forgotten component away from failing.

**Standing obligation:** any future excluded image gets its hash added to `BLOCKED` in
`src/lib/content.ts` and to `BLOCKED_HASHES` in `tests/parity.spec.ts` **in the same commit that
excludes it.** The eight-hash negative tests across all seven routes stay in the suite permanently.

## 3. Prefer mechanisms that cannot drift and fail soft

Between two implementations, choose the one with fewer moving parts and a graceful failure.

*Applied.* The pinned Estate beat is CSS `position: sticky` with a scroll-linked opacity, not a
GSAP measured pin. Sticky cannot desynchronise from the scrollbar, needs no layout measurement, and
degrades to a plain tall section if the script never runs.

*Also applied.* Fonts are `next/font/local` over `next/font/google` — no build-time network
dependency. Reveals carry a `<noscript>` override so content is never hidden by a script that
failed. Villas are looked up by file key or slug, never by CMS `id`.

---

## Content truth rules (from Phase 0, unchanged)

- **Never invent.** Every user-facing string traces to `content/`. Gaps get a `[TODO]` and a T-item.
- **Tier A is absolute.** Property imagery is real Thalasses photography. Never stock, never
  generated, never a similar villa. Guests book what they see.
- **Locked facts come from the locked table.** Capacities in copy and JSON-LD come from the
  owner-confirmed capacity table, never from marketing copy.
- **Source typos are preserved verbatim** and flagged, never silently corrected.

---

## 4. Display copy is compiled against facts, not just clause tails

**Every number and every hard claim a reader sees at display scale must resolve
against `content/`.** Enforced by `tests/facts.spec.ts` across four routes.

*Why.* Three fabrications reached a rendered page and **all three were caught by
a human looking at a screenshot — none by an assertion.** The pattern was
identical each time: an invented specific entered through *drafted display copy*
— a heading or a line composed outside the clause pipeline, where the fact
registry never saw it. The last read **"Nine acres of it, marked."** The estate's
area appears nowhere in the inventory.

The clause tails were always compiled against facts. Headings, act titles,
litany lines, card copy and ledes were not. That gap is now closed.

The guard scans digits, number-words (`nine`, `fifty`, `eighteen`…) and a short
list of claim words (`only`, `acres`, `first`, `largest`, `unique`). A token
passes if it appears anywhere in the inventory, as the word **or** as its
numeral. Failure quotes the offending string.

**It is proven, not assumed.** Injecting *"Nine acres of it, and seventeen olive
trees."* fails the guard on `seventeen` and `acres`, and correctly passes `nine`
— nine bedrooms is real. A guard that has never failed is not a guard.

**When it fires you have three options, in order:** add the fact to the
inventory, reword the line, or — only if the phrase is genuinely non-factual
idiom — add it to `NON_FACTUAL` with a reason. Every entry in that list is a
hole in the guard, so keep it short and defensible.

## 5. Sticky sections are captured per-viewport, never fullPage

A fullPage screenshot paints a `position: sticky` child once and leaves the rest
of its tall container empty. The result reads as a large broken block when the
section is working correctly.

**Never send a fullPage capture of sticky content for review.** Use
`tests/acts-shots.spec.ts`, which captures one viewport frame per scroll state.
Say explicitly which image not to trust when both exist.

*Why.* The pinned acts and the pinned estate beat both produced screenshots that
looked severely broken and were not.

## 6. When the brief and the registry disagree, the registry wins

Raise it, correct it, and ship the corrected version — do not ship a fact you
cannot trace because it arrived in an instruction.

*Two applications so far, both accepted:*
- *"nine bedrooms, one booking"* → **"taken as one house"**. The estate is
  enquiry-only by owner decision (T-158); "one booking" would have promised a
  flow that was deliberately removed.
- *"the organic garden, dinner from fifty metres away"* → cut to the garden and
  the gardener's help. The distance from garden to table is stated nowhere.

## 7. A decoration may never state a false fact

Animated numerals, placeholders and progressive states must render the **true
value as their default**, with the effect as the exception. Never the reverse.

*Why.* The count-up ledger initialised at `0`, so the estate block rendered
**"0 Bedrooms"** in the server HTML, for every reader without JS, and for anyone
whose IntersectionObserver never fired. It was caught by the parity suite
reading `0` where `9` was required — the same suite that exists because a
four-cell Collection once passed a clean build.

Guarded by `tests/facts.spec.ts` → *no animated numeral ever renders a false
value*.

## 8. Measure at the exact conditions you are debugging

Two consecutive mis-diagnoses of the same bug came from measuring under
different conditions than the failure: a diagnostic that called
`scrollIntoViewIfNeeded()` first reported `top: -900` for an element that sits
at `0` in the actual capture, and a "coordinate fix" derived from it was a no-op.

Reproduce the exact state — same scroll position, same viewport, same order of
operations — before concluding anything. **And when a second diagnosis also
fails, stop and say the root cause is unknown** rather than shipping a third
guess as a fix.

## 9. A red test that describes reality beats a green suite that doesn't

When a guard fails and the cause is not yet understood, **leave it red** and say
so. Do not soften the assertion, do not skip it, and do not ship a guess as a
fix to turn it green.

*Why.* T-203 was reported as 84 passing / 1 failing, with the failure described
honestly as "unresolved". That red test carried the exact signature — computed
`position`, ancestor state, live scroll offset — that produced the diagnosis one
step later. A suite made green by weakening the assertion would have carried
none of it, and the un-pinned showcase would have shipped.

The corollary: when the red test is finally fixed, be explicit about **which
side was wrong** — the page or the test. Both happened in T-203.

## 10. Wait for the element, never for a page-level heuristic

`page.goto` wait strategies are proxies for "the thing I am about to assert on
exists". Use the thing itself: `waitForSelector`.

*Why — both proxies failed, in sequence, on the same test:*

- **`networkidle`** stopped settling the moment the navigation shipped. Ten
  in-viewport `<Link>`s meant Next prefetched continuously, the network never
  went quiet for 500ms, and **67 tests timed out on pages that rendered
  perfectly** (verified: 200, nav present, zero page errors, zero pending
  resources). One cause, sixty-seven red tests, zero real defects.
- **`load`** then fired *before* React hydrated, so the server-rendered STACKED
  acts variant was still mounted and `.acts-sticky` was `null`.

Each instrument shared an assumption with its subject — the same trap as T-203b.
Waiting for the element shares none.

## 11. Never hand-write vendor prefixes

The build prefixes from its browser targets. Writing a prefixed twin yourself
can make the optimiser collapse the pair **to the prefixed form alone**, silently
dropping the standard property.

*Why.* `.nav.is-solid` shipped with `-webkit-backdrop-filter` and no
`backdrop-filter`. Safari would have rendered the glass; Chrome and Firefox
would have rendered nothing. A red test caught it — and it was a real defect,
not the headless-compositing artifact it looked like.

Corollary: **verify build output by searching for a known token, never by
assuming a path.** Looking in `.next/static/css/` found nothing and nearly
produced a wrong diagnosis; Next 16 emits CSS to `.next/static/chunks/`.

## 12. Measure the layer the defect lives in — and never against a rebuilt server

Two rules from the same session, both about the rig rather than the code.

**(a) A document-level measurement cannot see a fixed layer.** `qa.spec.ts`
asserts `documentElement.scrollWidth === clientWidth` at six widths on five
routes, and it passed every run while the Menu button sat entirely off the right
edge of every phone. A `position: fixed` element contributes nothing to the
document's scroll width. Overflow in the fixed layer needs its own assertion in
its own coordinate space — every interactive child of the bar inside the
viewport — which is now `tests/nav.spec.ts`.

**(b) `reuseExistingServer: true` will happily hand the suite a stale build.**
Starting `next start` by hand to take a measurement, then rebuilding `.next`
underneath it, produced three failures that did not exist and one reading
("Check availability" where the DOM said "BOOK") that sent the diagnosis in the
wrong direction. Kill any hand-started server before running the suite, or let
Playwright own the server entirely.

**Corollary — do not write a test harness into a page the app owns.** The
side-by-side capture first replaced `document.body` with its two iframes; React
hydrates a moment later and reclaims the body, so the panes vanished under the
harness. Serve the harness from a route the app does not serve
(`page.route` + `route.fulfill`) — same origin, no React, nothing to reclaim.

*The through-line, and it is the same one as T-203b, §9 and §10:* an instrument
that shares an assumption with its subject can confirm the aim, never the target.

## 13. Scraped third-party content is untrusted input, and it gets scanned

**A live Google Maps API key reached a public repository inside 43 scraped HTML
files.** GitHub's secret scanning caught it. My own pre-commit gates did not.

Two failures, on two different axes, and both matter:

**(a) The pattern list had no Google format.** It covered `sk-`, `ghp_`/`gho_`,
`AKIA`, `xox*-` and PEM headers, and it held for every one of those — the scan
returned zero on all of them, correctly. But a pattern list is only ever as good
as its last addition, and `AIza…` was not on it.

**(b) The far worse one: `content/raw/` was never scanned at all.** The pre-commit
check ran over source and content JSON. The Phase 0 dumps were treated as
*data* — evidence of what the old site said — rather than as *text that can hold
a secret*. They are third-party HTML pulled off someone else's live production
server, which makes them the single most likely place in this whole project for
a credential to be sitting. The Loggia template embeds the key on every page, so
every one of the 43 scrapes carried it.

Note the shape of (b): it is the same failure as T-213 and §9 wearing different
clothes. The instrument was pointed at the layer I was authoring and not at the
layer the defect lived in.

### The rule

**Everything textual is input.** No directory is exempt for being "just
content", no file is exempt for being "just markup", and scraped third-party
content is scanned *first*, not last, because it is the likeliest carrier.

`scripts/scan-secrets.mjs` walks the entire tree — including `content/raw/` and
any text under `public/` — sniffs for NUL bytes rather than trusting file
extensions, and fails the build on any match. It is wired into `npm run verify`
and into `npm run scan:secrets`, and it must be run and green **before every
push and at every phase STOP**.

Patterns, permanently:

| | |
|---|---|
| `AIza[0-9A-Za-z_-]{35}` | Google API keys — the format that leaked |
| `ya29\.[0-9A-Za-z_-]{20,}` | Google OAuth tokens |
| `sk-…`, `ghp_`/`gho_`/`ghu_`/`ghs_`/`ghr_…`, `AKIA…`, `xox[baprs]-…` | the existing set |
| `-----BEGIN … PRIVATE KEY-----` | PEM blocks |
| `(api[_-]?key\|apikey\|secret\|token\|password)\s*[:=]\s*['"][A-Za-z0-9_\-]{16,}` | the catch-all, for formats nobody has thought of yet |

Findings print **masked**. A scanner that echoes the secret it found has copied
it into the terminal scrollback, the CI log and the session transcript.

### Two corollaries

**Public-by-design values are allowlisted by exact value, never by loosening a
pattern.** reCAPTCHA *site* keys and GA/GTM measurement ids must reach the
browser to work at all and are published in the live page source by definition.
They are listed in `SECURITY-NOTES.md` with the reason, so a future scanner
alert on one is answerable in a single line. A real secret that merely resembles
one still fails.

**Redaction is hygiene; rotation is the fix.** A key that has been public is
harvested — assume it. Cleaning the repository does not un-leak it, and after a
history rewrite GitHub can still serve the old blob by SHA for some time. The
repository work is worth doing and it is not the remedy: the remedy is
restricting or rotating the credential at the provider.

**And the standing rule this reinforces:** no runtime secret belongs in this
tree, ever, not even in an ignored file. When the enquiry form gets a mail
provider, its key lives in **Vercel environment variables** and is read from
`process.env`. `.gitignore` blocks `.env*`, but that block is a backstop, not
the policy.

### §13 addendum — incident response, in this order

Ratified after the Maps-key incident, where the ordering was arrived at by
accident and turned out to matter:

**1. Build the instrument. 2. Baseline it against the live incident. 3. Fix.
4. Re-measure with the same instrument.**

Writing `scripts/scan-secrets.mjs` *before* redacting anything meant the scanner
had to reproduce the finding first — 43 matches in 43 files, exit 1 — which
proved the gate worked before it was ever asked to certify a fix. A scanner
written after the fix can only ever report success, and you would have no way to
know whether that is because the tree is clean or because the pattern is wrong.
The same gate now guards every push, so the fix and the future are verified by
one instrument rather than two.

**`--force-with-lease`, never a bare `--force`.** The lease fails loudly if the
remote moved since you last fetched. Two conversations write to this repository;
a bare force would discard the other one's work silently and call it success.

**A provider alert closes on the provider's confirmation, never on repository
hygiene.** GitHub alert #1 stayed `open` through a complete redaction, history
rewrite and verified force-push, because none of that revokes a key. Redacting
and then resolving the alert would have recorded "handled" for something still
live. The alert tracks the credential; the repository work tracks the
repository.

## 14. Numbers are allocated by the file at HEAD, never by a prompt

Two conversations write to this repository, and they collided in
`CONVENTIONS.md` at the same section number: both wrote a "§12". A document
whose rules are cited by number cannot have two of any number.

**Before claiming a convention number or a T-number: pull, then read the highest
one in the committed file.** Not from the brief, not from a review that names a
number, not from this session's memory of what it wrote last. The repository at
HEAD is the single source of truth that both threads read, and it is the only
one that has seen both.

```bash
git fetch origin && git rev-parse HEAD origin/main   # same? then read HEAD
git show HEAD:CONVENTIONS.md | grep -oE "^## [0-9]+"
git show HEAD:TODO.md        | grep -oE "^- \*\*T-[0-9]+"
```

If a prompt names a number that is already taken, take the next free one and say
so in the report. The instruction was right about the rule and wrong only about
its address.

**The same check answers "is this done?"** A task's status is what the committed
`TODO.md` says at HEAD, verified against the artefacts it claims — not what
either conversation remembers. Where the two disagree, HEAD wins and the
disagreement is worth reporting, because it means one thread is working from a
stale picture.

## 15. Infrastructure state is read from DEPLOY.md at HEAD, never assumed

Two consecutive sessions told the owner "Vercel is not connected — run
`vercel login`, `link`, `git connect`, `--prod`." It was connected the whole
time. Auto-deploy on `main` was live, protection was off, the team was `domisi`,
and every push had been building.

The claim came from `npx vercel whoami` returning `Logged out`. **That is the
local CLI's auth state on one machine.** The GitHub↔Vercel integration is a
server-side link between two accounts; a logged-out terminal says nothing about
it. The instrument was adjacent to the question and its answer was reported as
if it settled it — §12 again, in a new costume.

**The rule.** Before stating anything about the pipeline — is it deployed, where
does it deploy, what environment variables exist, is it indexed — read
`DEPLOY.md` at HEAD. If `DEPLOY.md` does not answer it, say that it is unknown
and what would answer it. Never infer it from a CLI's local state, from a
previous session's report, or from this session's memory.

**And keep it current.** `DEPLOY.md` is updated in the same commit as any change
to the repository, deploy branch, team, protection, env vars, domain or indexing
flag. A stale infrastructure note is worse than none, because it gets believed.

Corollary, standing: **never instruct the owner to run a setup command for
infrastructure that is already set up.** Pushing to `main` is the deploy.

## 16. Layer the cascade; and a fix you cannot falsify is not a fix

Two rules, because one incident taught both.

### The incident

Three separate call-to-action contrast failures — **T-217** (the villa angle at
lede scale), **T-242** (every primary CTA on the site at **2.27:1**), **T-247**
(the estate enquiry CTA at **1.43:1**) — had a single cause:

`globals.css` imported every component partial at the **top** of the file and
then defined the typographic register **below** them. So `.micro { color: … }`
and `.btn-primary { color: … }` were both `(0,1,0)`, and the register won every
tie by source order. The most important element on every page rendered
secondary-text green on near-black for months, and it never looked broken —
a button that is the wrong colour is still recognisably a button.

I fixed it three times. Each fix was an instance. The mechanism survived all
three, and would have produced a fourth.

### The cure

`@layer tokens, base, register, components, utilities;` declared once, with each
partial imported into its layer. **Later layers beat earlier ones regardless of
specificity or source order**, so a component rule now outranks a register rule
whatever the import list says, and nobody has to remember the order again.

The typographic register moved out of `globals.css` into `register.css` so it
has a layer of its own rather than trailing the imports.

**All three specificity patches were then deleted.** If one is ever needed
again, the layer order has been broken and that is the bug.

### The second rule

**A fix I cannot falsify is not a fix.**

The layer change was not believed until the three patches were removed and the
contrast guard was re-run against eight routes with nothing else holding the
colours in place. It passed. That is the difference between "the tests are green
after my change" and "my change is what makes them green" — and only the second
one is evidence.

It applies past CSS: before claiming a cause is fixed, remove the thing that
used to compensate for it and watch the fix hold alone.

### A guard's blind spot, found by the same move

Making the layer fix let `.nav-book` finally take its component colour, which
immediately failed the contrast guard at 1.00:1 — limestone on limestone. The
guard was resolving background by walking DOM ancestors, which is meaningless
for a `position: fixed` bar sitting over a photograph: what is visually behind
it is not its parent. The guard now treats fixed, absolute and gradient grounds
as *unresolvable* rather than as failures, and leaves them to the scrim rule.

A real fix exposing a flaw in the instrument that was supposed to catch it is
the healthy version of this project's recurring lesson.

## 17. The voice, and what compiles against the registry

Six rules, and one mechanism that enforces the sixth.

1. **Understatement over hyperbole.** No "stunning", "luxurious", "paradise".
   Luxury is implied by specifics — a table for eighteen, a beach with no one
   else's towels on it — and undermined by adjectives claiming it.
2. **Concrete nouns, sensory verbs.** Swim, gate, light, salt, sand.
3. **Short declaratives, plus one long lyrical sentence per beat.** The rhythm
   is the effect; uniform sentence length reads as a brochure.
4. **Second person, present tense.** "Your terrace", not "the guest's terrace".
5. **The signature clause is never closed** by terminal punctuation; act titles
   always are. Two registers, and mixing them dissolves both.
6. **Every factual claim is verified or visibly flagged.** Never silently
   asserted.

### The mechanism behind rule 6

`tests/facts.spec.ts` scans every string in the display register across **all
twelve routes** and fails the build on any digit, number-word or claim-word
("only", "first", "largest", "unique") that does not resolve against
`content/`. Three fabrications reached a rendered page before it existed, and
all three were caught by a human reading a screenshot.

**The selector list is part of the guard, not decoration.** When Direction D
introduced new copy classes the guard was still reading four routes of an
eleven-route site and reporting the whole thing clean — an instrument that
passes because it never reached its subject, which is this project's most
frequent failure by a distance. Adding a page means adding its route; adding a
copy class means adding its selector. Verified by counting the strings the guard
actually reads per route, not by trusting a green result.

### Draft copy

Anything not yet approved is marked **where it is read** — the `Draft`
component — not only in a TODO file the owner will never open. The badge is
deliberately plain: one that looks designed reads as a feature rather than as an
admission.

## 18. An audit is not finished when it says zero

A detector that reports nothing has two possible explanations, and they are not
equally likely: the subject is clean, or the instrument never reached it. This
project has now met the second five separate times — a Stop hook resolving a
percent-encoded path, `test.skip()` reporting "30 skipped" as green,
`vercel whoami` answering a different question than the one asked, a contrast
guard walking DOM ancestors of a `position: fixed` element, and a taste audit
printing twenty-six connection failures above the words "0 findings".

So two rules, both learned expensively.

**Every instrument asserts it found its subject.** A discovery step that returns
an empty set fails loudly rather than letting every downstream assertion pass
vacuously. Route tables assert their own length; a script that could not reach a
page exits non-zero and says which pages were never looked at, because a finding
count is not a clean bill of health for pages nobody opened.

**A detector is never tuned until it agrees with the page.** The first run of
the taste audit reported 174 findings and almost all of them were the
instrument's fault: it read a `columns: 3` flow as an 858px collision, descended
into an `aria-hidden` honeypot, counted a nav register as six ideas per
viewport, and measured box gaps on a design that carries its air as padding
INSIDE each beat. Every one of those was corrected by fixing what the detector
measured — not by raising a threshold until the number went down.

The distinction matters because both moves make the report say zero, and only
one of them is true. When a finding is real but deliberate, it is written up in
`qa/taste/ACCEPTED.md` with the reason, and the detector goes on reporting it.
A page whose exceptions are recorded is maintained; a page whose exceptions were
tuned out of the tool is unexamined and looks identical.
