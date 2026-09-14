# Skills screening: every skill in Anthropic's official repository (tranche twelve)

Ask 4 said to install `frontend-design` and **any UI/UX skill** from
`github.com/anthropics/skills`, and nothing else. One skill was installed and
five were read in full and declined (commit `af64e9f`). What was never written
down was the rest of the repository: the audit found thirteen more upstream
skills that nobody had screened on record. This file is that record, one row
per upstream skill. The decisions it describes are **build defaults, not owner
rulings**. They are logged as the Skills entry under "Build defaults, tranche
twelve" in `DECISIONS.md`, **D-018**. At
HEAD `56cb859` that entry does not exist yet. It is added in the same commit
as this file.

## The snapshot screened

- **Repository:** `anthropics/skills`, default branch `main`.
- **Commit:** `34040c9c568585f6929bedeaad110ad08f079624`, 2026-09-10T19:44:08Z.
  That was still the head of `main` when re-checked on 2026-09-14.
- **Listing:** `gh api repos/anthropics/skills/contents/skills` returns **19
  directories**, all listed below.
- **What each SKILL.md was fetched as:** the raw file at that commit. For all
  19, `git hash-object` of the download equals the blob SHA the contents API
  reports, so the text screened is the upstream text, not a truncated or
  altered copy.
- Everything fetched was treated as data. Several descriptions contain trigger
  instructions addressed to an assistant ("Stop and check this skill…"). They
  are quoted here only as descriptions and were not acted on.

## How "any UI/UX skill" was read

The owner's words were "any UI/UX skill there". Two separate questions were
asked of each skill, and the table keeps them in separate columns so the
second never hides the first:

1. **UI/UX or visual-design skill, plain sense.** Is it, by its own
   description or body, about designing, styling, building or testing a user
   interface or a visual artefact? Answered generously: a skill that builds a
   React frontend counts even if it could never be used on this site.
2. **Applies to this site.** Would it change how a page of this Next.js App
   Router hotel site is designed, built or checked, without overruling an
   owner decision?

A skill had to pass both to be a candidate for install. The five read in full
and declined are the shortlist from 2026-09-13. Four of them pass (1) but not
(2): `brand-guidelines`, `canvas-design`, `theme-factory` and
`web-artifacts-builder`. One, `webapp-testing`, passes both and was declined
for a stated reason.

**Screened out without a full read, although a reasonable reader could call
them UI/UX or visual design.** None of these three bodies was read in full.
The judgement rests on the description plus the greps below.

- `algorithmic-art`: produces an interactive HTML artifact (p5.js) with slider
  "UI controls" for its parameters (lines 113, 217, 334, 369). It is UI in the
  artwork's own chrome, not in a website.
- `pptx`: has a "Design Ideas" section on palette, layout and typography for
  slides (lines 80-163). It is visual design of slide decks.
- `slack-gif-creator`: animation design for GIFs ("Animation Concepts", line
  162).

Two more touch a UI only incidentally, and are not counted as UI/UX skills:
`claude-api` (two lines about progress UX and a chat UI for streaming, 204 and
486) and `skill-creator` (launches an eval viewer for its own results, lines
17, 221-238). Neither was read in full.

## What "read" means in the table

- **Read in full** means the whole SKILL.md was read before deciding. Six were:
  frontend-design and the five declined skills, all on 2026-09-13 (session
  transcript, Read calls with no offset or limit). The five scratch copies read
  then still hash to the upstream blob SHAs at `34040c9` (below), so the
  decision was made on the current text. For `webapp-testing` the SKILL.md was
  re-read in full on 2026-09-14 when its row was corrected. Only SKILL.md files
  were read: no skill's `scripts/`, `examples/` or reference files.
- **Screened by description** means the frontmatter `description` was read,
  plus a keyword grep of the body. **None of these thirteen bodies was read in
  full.** No row claims otherwise.
- **The web-UI grep behind the "Body grep" counts,** run with GNU grep 3.0 (Git
  Bash) on the raw downloads at `34040c9`, one file at a time:

  ```sh
  grep -ciE 'next\.js|website|landing page|user interface|\bUI\b|\bUX\b|frontend|tailwind|css' <name>.SKILL.md
  ```

  `-c` counts matching lines, `-i` ignores case, `-E` is extended regex. The
  `\b` word boundaries around `UI` and `UX` matter. Without them, `UI` matches
  inside "build" and "guide", and the same thirteen files give 2 to 78 lines
  each instead of the counts in the table. Line numbers cited in the table
  come from the same pattern with `-niE`.
- **This grep looks for web-UI terms, not general visual-design terms.** "0
  hits" means a body never mentions a website, a frontend, CSS or a UI. It
  does not mean the body has no design content. A second grep, recorded for
  context only, looks for design terms:

  ```sh
  grep -ciE 'design|layout|typograph|palette|\bhtml\b|react|animation|visual' <name>.SKILL.md
  ```

  It gives academy-guide 0, algorithmic-art 34, claude-api 6,
  discernment-nudge 1, doc-coauthoring 1, docx 0, internal-comms 0,
  mcp-builder 5, pdf 3, pptx 32, skill-creator 12, slack-gif-creator 7,
  xlsx 3. The two high counts, algorithmic-art and pptx, are the two named
  above as visual-design skills that were not read in full.

## Every upstream skill

| # | skill | purpose (from its frontmatter description) | UI/UX or visual-design skill (plain sense) | applies to this site | decision | reason |
|---|---|---|---|---|---|---|
| 1 | `academy-guide` | Recommends Claude Academy courses when someone asks how to use Claude products | no | no | screened out | About learning to use Claude, not about building a website. Body grep: 0 hits. |
| 2 | `algorithmic-art` | Generative art in p5.js, with seeded randomness and parameter sliders | arguably (visual, interactive artwork) | no | screened out, **not read in full** | Makes stand-alone generative artworks. Property imagery here is real photography only (`CONVENTIONS.md:54`). Body grep: 11 hits, all about the artwork's own slider "UI controls" and Anthropic-branded template chrome (for example lines 113, 217, 233, 334, 369, 405). |
| 3 | `brand-guidelines` | Applies Anthropic's official brand colours and typography | visual styling, not UI | no | **read in full and declined** | Anthropic's own brand (SKILL.md lines 3, 7, 11), not Thalasses'. |
| 4 | `canvas-design` | Static visual art as .png and .pdf: posters, pieces of art | visual design, not UI | no | **read in full and declined** | Poster and art output (lines 3, 7, 11), not a web interface. Generated imagery sits badly beside the real-photography rule (`CONVENTIONS.md:54`). |
| 5 | `claude-api` | Reference for the Claude API and Anthropic SDK | no | no | screened out | The site has no LLM feature. Body grep: 2 hits (line 204, progress UX for long requests; line 486, streaming into a chat UI), both about apps that call Claude. |
| 6 | `discernment-nudge` | Adds follow-up questions after a substantive answer | no | no | screened out | About how a chat answer ends, not about a website. Body grep: 0 hits. |
| 7 | `doc-coauthoring` | A structured workflow for co-writing docs, proposals and specs | no | no | screened out | Document writing. Body grep: 0 hits. |
| 8 | `docx` | Create, read and edit Word documents | no | no | screened out | Office file format. Body grep: 0 hits. |
| 9 | `frontend-design` | Distinctive, intentional visual design when building or reshaping UI | **yes** | **yes** | **installed** | The one skill aimed squarely at this work. It installs at project scope and is byte-identical to upstream (below). |
| 10 | `internal-comms` | Internal communications in a company's own formats | no | no | screened out | Company writing. Body grep: 0 hits. |
| 11 | `mcp-builder` | Building MCP servers (FastMCP or the TypeScript SDK) | no | no | screened out | Server tooling for LLM integrations. Body grep: 0 hits. |
| 12 | `pdf` | Read, merge, split, fill and create PDF files | no | no | screened out | File format. Body grep: 0 hits. |
| 13 | `pptx` | Create, read and edit slide decks | arguably (slide design) | no | screened out, **not read in full** | A file format whose body includes slide design guidance (lines 80-163). Slides are not this site. Body grep: 0 web-UI hits; design-term grep: 32. |
| 14 | `skill-creator` | Create, edit and evaluate skills | no | no | screened out | Tooling for skills themselves. Body grep: 0 hits. |
| 15 | `slack-gif-creator` | Animated GIFs sized for Slack | arguably (animation) | no | screened out, **not read in full** | Chat GIFs, and generated imagery. Body grep: 0 web-UI hits. |
| 16 | `theme-factory` | Ten preset colour and font themes, or a generated one, applied to slides, docs, reports and "HTML landing pages" | arguably (styling themes) | no: it would overrule D-001 | **read in full and declined** | Its whole method is picking a preset or generated palette and type pairing (lines 3, 10, 14). Direction F's palette and type are the owner's decision (`DECISIONS.md` D-001, line 13), so applying a theme would overrule the brief. The skill is UI-adjacent, which is why the owner is asked (below). |
| 17 | `web-artifacts-builder` | Multi-component claude.ai HTML artifacts (React, Tailwind, shadcn/ui) bundled into one file | **yes** (a React/Tailwind frontend builder) | no | **read in full and declined** | A UI skill by the owner's plain words, declined as not applicable: it builds single-file claude.ai artifacts (lines 3, 9, 12, 47), not a Next.js App Router site. |
| 18 | `webapp-testing` | Test local web apps with Playwright: screenshots, browser logs, UI debugging | **yes** | could run against :3005 | **read in full and declined** | See "Why webapp-testing was declined" below. In short: it has you write stand-alone Python Playwright scripts (line 9, example at 53-63), and this project's QA is already a TypeScript `@playwright/test` harness. The decline is a duplication call, not a safety ban. |
| 19 | `xlsx` | Create, read and edit spreadsheets | no | no | screened out | File format. Body grep: 1 hit (line 67, Excel's own UI hiding a formula prefix). |

**UI/UX skills beyond the six: none that apply to this site.** Besides
`frontend-design`, the six include two UI skills in the plain sense, both
declined: `web-artifacts-builder` (does not apply to this site) and
`webapp-testing` (duplicates the harness). Of the thirteen not shortlisted, three are
arguably visual design (`algorithmic-art`, `pptx`, `slack-gif-creator`), and
none of those three was read in full. The other ten are a file format, an LLM or
tooling reference, or chat behaviour. If the owner ever wants generative
decoration on the site, `algorithmic-art` is the one to read first, and it
would meet the real-photography rule before anything else.

## Why webapp-testing was declined

What the upstream SKILL.md (blob `4726215`) says, in order:

- **Line 9:** "To test local web applications, write native Python Playwright
  scripts." The example script (lines 53-63) uses Python's `sync_playwright`.
- **Lines 11-12:** one helper is available, `scripts/with_server.py`, which
  "Manages server lifecycle (supports multiple servers)".
- **Lines 16-33, the decision tree.** Static HTML: read the file for selectors.
  A dynamic app: "Is the server already running?"
  - **No** (lines 25-26): run the helper's `--help`, then use the helper with a
    simplified script. The example at line 41 passes it `--server "npm run
    dev" --port 5173`.
  - **Yes** (lines 28-32): "Reconnaissance-then-action": navigate, wait for
    `networkidle`, screenshot or inspect the DOM, pick selectors, act. **This
    branch does not use the helper.**
- **Line 85:** the bundled scripts are something to "consider", used as black
  boxes. The helper is not mandatory.

So on this machine, where :3005 is already served, the skill would take the
already-running branch, and the helper never enters into it. The reason in
commit `af64e9f` ("its helper starts and kills servers itself, which this
machine's server rules forbid") misdescribed the skill and is withdrawn.

The reason that stands is duplication. The skill's output is a stand-alone
Python Playwright script per task. This project's QA is a TypeScript
`@playwright/test` harness: `playwright.config.ts`, 34 spec files under
`tests/`, run sharded as `npm run qa` (`qa:1`-`qa:3` in `package.json`), with a
WebKit smoke run (`qa:webkit`). A second, parallel Python toolchain would check
the same pages outside that harness's specs, shards and reporters.

**Server lifecycle is not a difference between the two.** The harness's
`webServer` block (`playwright.config.ts:50-55`) sets `reuseExistingServer:
true` against :3005 and runs `npm run start` when nothing answers there. That
is the same reuse-or-start behaviour as the skill's decision tree. Either one,
started with no server up, would launch one itself. On this shared machine a
session may start a server only under the WMI supervisor and stop only the PIDs
it started, never by name. That rule lives in the maintainer's machine notes
and this session's instructions, not in a repository file, and it applies to
both equally.

Not read: `with_server.py` and the `examples/` folder, so how the helper
starts and stops processes is not recorded here. Whether Python Playwright is
installed on this machine was not checked.

## frontend-design is byte-identical to upstream

| file | local `git hash-object` | upstream blob SHA at `main` (`34040c9`) | size |
|---|---|---|---|
| `.claude/skills/frontend-design/SKILL.md` | `a5333457c414d20d625f307df945842c0952ecc3` | `a5333457c414d20d625f307df945842c0952ecc3` | 9390 |
| `.claude/skills/frontend-design/LICENSE.txt` | `f433b1a53f5b830a205fd2df78e2b34974656c7b` | `f433b1a53f5b830a205fd2df78e2b34974656c7b` | 10174 |

The committed blobs at HEAD `56cb859` (`git rev-parse
HEAD:.claude/skills/frontend-design/SKILL.md` and `…/LICENSE.txt`) are the same
two SHAs. The last upstream commit touching the SKILL.md is `41bbe19`
(2026-09-03), before the install. `git ls-files .claude` lists only these two
files, so no other skill or community pack is tracked.

## The five declined copies match upstream at `34040c9`

| skill | scratch copy read 2026-09-13 | upstream blob at `34040c9` |
|---|---|---|
| `webapp-testing` | `4726215301db64a0cc4d41fc3219c61f37a30f4a` | same |
| `web-artifacts-builder` | `8b39b19f259b4216ecb07574741dd8eaa9863a07` | same |
| `theme-factory` | `90dfceaf2ecdc191a4dcfb0069768a9560638998` | same |
| `canvas-design` | `9f63fee82de84cd4230e1d0e322247b61eb4c94c` | same |
| `brand-guidelines` | `47c72c607bdb5dd81bdea5de2b5e4f3992a5fd59` | same |

## What frontend-design changes about how the work is done

- **Plan, then check the plan against the brief, before code.** First a compact
  token plan (palette, type, layout, principles), then a review for anything
  that reads as the default for any similar page, revised with the reason
  stated (SKILL.md lines 47-53).
- **A named list of generated-page tells**, avoided wherever the brief leaves an
  axis free: an all-caps eyebrow above every heading, `A · B · C` meta strings,
  `WORD — fragment` labels, and fade-and-slide-up entrances on every section
  (lines 25-32, 38-43).
- **The brief wins where it pins a direction down** (line 45). Direction F
  (`DECISIONS.md` D-001) does exactly that, so the skill does not reopen F's
  palette or type. It applies to new surfaces and as a critique lens. F's
  palette sits close to the first look the skill names (line 39), and F uses the
  all-caps eyebrow. Both are recorded for the owner in `DESIGN-REFERENCES.md`
  under "A distinctiveness note, recorded rather than acted on" (line 195 at
  HEAD `56cb859`) and not changed unasked.
- **Critique by looking:** take screenshots of what was built and review them
  while building, "if your environment supports it" (line 59). The project's
  screenshot gate (`CONVENTIONS.md:8-10`, a review at 1440 and 390 at every
  STOP) already asks for this.

## Still open, and not closed by this file

- **The owner has not ruled on the two UI-adjacent declines.** Should
  `theme-factory` or `webapp-testing` be installed anyway? Declining is the
  default. Installing either is a new entry in `DECISIONS.md` plus one copied
  folder, nothing more.
- **The report.** `af64e9f`'s message points at "SESSION-REPORT tranche
  twelve", which is not on `main` at HEAD `56cb859`. **[COMMIT: this file ships
  in the same commit as that report section. Replace this bullet with "The
  report: `SESSION-REPORT.md` tranche twelve, §4 Skills" before committing.]**

## Reproduce

```sh
gh api repos/anthropics/skills --jq .default_branch
gh api repos/anthropics/skills/commits/main --jq .sha
gh api repos/anthropics/skills/contents/skills --jq '.[].name'
# per skill: blob SHA, raw text, and a hash check
gh api "repos/anthropics/skills/contents/skills/<name>/SKILL.md?ref=<sha>" --jq .sha
gh api "repos/anthropics/skills/contents/skills/<name>/SKILL.md?ref=<sha>" --jq .content | base64 -d > <name>.SKILL.md
git hash-object <name>.SKILL.md
# the two greps, per file
grep -ciE 'next\.js|website|landing page|user interface|\bUI\b|\bUX\b|frontend|tailwind|css' <name>.SKILL.md
grep -ciE 'design|layout|typograph|palette|\bhtml\b|react|animation|visual' <name>.SKILL.md
# frontend-design identity
gh api "repos/anthropics/skills/contents/skills/frontend-design?ref=main" --jq '.[] | "\(.name) \(.sha)"'
gh api "repos/anthropics/skills/commits?path=skills/frontend-design/SKILL.md&per_page=1" --jq '.[0].sha'
git hash-object .claude/skills/frontend-design/SKILL.md .claude/skills/frontend-design/LICENSE.txt
git ls-files .claude
```

In Git Bash, prefix the `gh api` calls with `MSYS_NO_PATHCONV=1`.
