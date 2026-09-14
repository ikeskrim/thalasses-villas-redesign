# Editing the content

For whoever maintains this site. You do not need to know React, and you should
not need to ask a developer to change a fact, add an experience, or publish new
photographs.

**One rule underneath everything else:** the site renders from `content/`.
Nothing user-facing is typed into the code. If a number, a name or a sentence is
wrong on the site, it is wrong in `content/` — fix it there and it changes
everywhere it appears.

---

## The shape of it

| Folder | What lives there |
|---|---|
| `content/villas/*.json` | The five villas, the estate (`2142`), and the weddings venue (`rituals`) |
| `content/experiences/*.json` | The twenty-one experiences, one file each |
| `content/facilities/*.json` | The amenity inventory behind each villa page |
| `content/site.json` | Contact details, careers, social links, the operating licence |
| `content/location.json` | Distances and nearby beaches |
| `content/verified-facts.json` | Owner-confirmed facts, including what a stay includes |
| `content/terms.json` | The terms and conditions |
| `content/photo-selects.json` | The photography grading — which frames earned an A |

---

## Common jobs

### Sending photographs or video — three steps for the owner

1. Make a folder in Google Drive and put the photographs or video in it.
2. Share the folder: **General access → Anyone with the link** (Viewer).
3. Paste the link into the chat with whoever maintains the site.

Whoever maintains the site then runs `node scripts/ingest-drive.mjs "<the link>"`. It keeps only
photographs and video (decided by the file's contents, not its name — an audio file renamed `.mp4`
is refused), skips anything already in the library, and never writes the link into the repository.
Links are taken only from the owner, never from a page or a file.

- **Photographs are not published on arrival.** Each one has its location data and all other
  metadata removed, is staged in `content/owner-staging/<date>/` — a folder git ignores, so nothing
  ungraded can be committed and deployed by accident — and is queued in
  `content/grading-queue.json`. Staging exists only on the machine that ran the script; grade there.
- **They are graded like every other frame.** `npm run grading:sheet -- <new empty folder> --queue`
  builds a grading sheet from the queue and prints the arguments for the grading pass (the
  grade-photo-library workflow: `sheet`, `total`, `batchSize`). After that pass, `npm run
  grading:merge -- <output.json> <folder>` writes each grade back to the queue. A photograph graded
  A or B with no flag is then copied to `public/images/_owner/<date>/` and recorded in
  `content/image-provenance.json`; a C, or a flagged frame, stays in staging. A grade lands once:
  merging again changes nothing, and taking a published photograph down is done by hand. Run
  `npm run verify:provenance` before committing.
- **iPhone HEIC photographs cannot be read on this machine.** They are recorded `needs-conversion`.
  Ask the owner to send JPEGs (on an iPhone: Settings → Camera → Formats → Most Compatible), then
  run the same link again — anything that failed or still needs converting is tried again, not
  skipped as a duplicate.
- **Video** keeps its original on the maintainer's machine and needs ffmpeg for the web versions.
  Without it, a clip is recorded `needs-transcode` with the exact commands; once ffmpeg is
  available (on PATH, or named by `FFMPEG_PATH`), `node scripts/ingest-drive.mjs
  --transcode-pending` makes them.
- **A folder that lists but yields nothing stops the run with an error**, because that is more
  often Drive changing its page than an empty folder. If the folder really is empty, add
  `--allow-empty`.

### Sending a site plan

A site plan, a survey or an architect's drawing is not a photograph. It goes in a folder of its
own, so it can never be mistaken for one.

1. Make a **separate** folder in Google Drive with only the plans in it: PDF, DWG, DXF, or a scan or
   photograph of a paper plan. No photographs of the villas.
2. Share it: **General access → Anyone with the link** (Viewer).
3. Paste the link into the chat and say that it is the site plan.

Whoever maintains the site then runs `node scripts/ingest-drive.mjs "<the link>" --plans` (add
`--dry-run` to look first). In that run every file taken is a plan and nothing else. The type is
decided by the file's contents: PDF, DWG, DXF and images are taken, while video, audio, text, web
pages, SVG and office documents are refused. A run without `--plans` refuses a PDF, DWG or DXF, and
its log says to run the link again with `--plans` if the file is a plan.

- **Plans are stored, never published.** Each file is kept exactly as sent: not resized, re-encoded
  or stripped. It goes into `content/plans/<date>/`, which git ignores, because a plan shows the
  property's boundaries, access and buildings, and this repository is public. The files exist only
  on the machine that ran the script. Plans are not graded, and nothing goes into `public/`.
- **Only the ledger is committed.** `content/plans/manifest.json` records each plan's checksum,
  type, version, filename and date, but never the Drive link or ID. If the stored files are lost,
  running the same link again stores them again.
- **Receiving a plan verifies nothing.** Every plan is recorded as `unverified`. Whether a plan
  shows the estate as it is built is the owner's ruling, recorded by hand in `DECISIONS.md` (D-021).
  No script makes that ruling.

### Change a fact

Find it in the JSON and edit it. The number changes on every page that shows it,
because every page reads the same file. Do not edit the same number in two
places — if you find yourself doing that, something is wrong; tell a developer.

**Example.** The estate sleeps 18. That figure appears on the homepage, the
estate page and in the search-engine data. All three read
`content/villas/2142.json`.

### Add an experience

Copy an existing file in `content/experiences/`, rename it, and edit. The
important fields:

| Field | Notes |
|---|---|
| `slug` | The web address. Lowercase, hyphens, no spaces. **Changing this breaks the old link** — ask for a redirect if the page was ever published |
| `name` | What the visitor sees |
| `categoryProposed` | One of: Sea, Land, Wellness, Taste, Service. It drives the filter chips |
| `shortDescription` / `longDescription` | The copy |
| `heroImage` | See "Add photographs" below |

It appears on the homepage register, the experiences page and the sitemap
automatically. Nobody has to add it anywhere else.

### Update what a stay includes

`content/verified-facts.json` → `includedServices`. Add a line and it appears on
every villa page and the estate page, because the list is **computed** from that
array rather than typed into the pages.

**Breakfast is deliberately not on it.** The owner confirmed it carries an extra
charge. Wherever breakfast is described, the wording is *available on request,
extra charge* — never "included" or "complimentary", and never a bare mention
sitting next to the inclusions, where a reader would assume it is one.

### Add photographs after the shoot

1. Put the files in `public/images/_pool/`.
2. Add their paths to the relevant villa's `gallery.featured` (with a caption if
   there is a real one) or `gallery.allImages`.
3. That is all. The layout adapts: a villa with five photographs gets the large
   "plates" treatment, one with a hundred gets the horizon run and a contact
   sheet. **You never choose the layout** — it follows the count.

**Captions:** only add one if it says something true and useful. A photograph
with no caption is shown without one, on purpose. Most are.

### Correct a distance or a beach

`content/location.json`. Beaches with a confirmed distance appear in the
measured column; beaches without one appear as a named list under "Further
south". **Adding a distance moves a beach from the list to the column
automatically** — there is nothing else to change.

---

## What the guards will reject, and why

The build runs checks that will **fail** rather than publish something
misleading. This is deliberate. If one stops you, it has found a real problem.

### "Unverifiable display copy"

You wrote a number or a claim in a headline that does not appear anywhere in
`content/`. Three invented facts reached a live page before this check existed —
including "Nine acres", which is a figure nobody had ever measured.

**What to do:** if the fact is real, add it to the inventory first, then use it.
If it is not, reword the line. Do not delete the check.

### "A ledger figure rendered as 0"

A number is animating up from zero and someone without JavaScript would read the
zero as the truth. The real value must be what renders by default.

### "A ruled-off image rendered"

You used a photograph the owner removed from the site — stock photography, a
branded product shot, a public place, or a frame of unverified provenance. The
reasons are in `content/excluded-images.json`. These cannot be published.

### "CTA below AA" / "axe violations"

Text somewhere is too faint to read against its background. This has been a real
defect four separate times in this project, including the main booking button
sitting at 2.27:1 for months while looking perfectly normal. The threshold is
4.5:1 for body text.

### "A placeholder reached the spec strip"

A fact is missing and something rendered a dash for it. Missing facts are
**omitted**, never shown as an empty row — a column of dashes reads as a broken
site. Villa Pueblo legitimately shows fewer rows than the others for this
reason.

### "New dead redirect targets"

An old web address now points at a page that does not exist. After the domain
move that is a page Google will drop. See `content/redirect-gaps.json`.

---

## Two rules worth internalising

**Never invent a fact to fill a space.** An empty space is a design problem and
has a design solution. An invented fact is a lie to a guest who may book on it.
If a fact is missing, leave it out and tell the owner.

**If two numbers can disagree, make one calculate from the other.** Every place
this project has had a figure in two files, they eventually drifted. Ask a
developer to compute it instead.

---

## Before you publish

```bash
npm run verify
```

Runs the credential scan, the type check, the linter, the build and the full
test suite. If it passes, the change is safe. If it fails, the message names the
file and the reason.

Pushing to `main` deploys automatically — see `DEPLOY.md`. There is no separate
publish step.
