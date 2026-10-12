# Handoff

**Written at `f16b505`, 2026-10-12.** For whoever picks this up next — a person or another session.

This file is a map, not a record. It says where things are, what is owed, and which traps cost this project real time. The authority for *what was decided* is `DECISIONS.md`; for *what is true right now* it is `SESSION-REPORT.md` at HEAD; for *how* a thing was measured it is the file in `qa/` named beside it. Where this file and those disagree, they win and this file is stale.

**Read first, in this order:** `CONVENTIONS.md` (how to work here) → `DECISIONS.md` D-028 onwards (the current tranche) → `SESSION-REPORT.md`'s "TRANCHE FOURTEEN" section (the position) → this file (what to do next).

---

## 1. Where the project is

Direction F, "The Cretan Hotel", is production. The site builds, deploys on every push to `main`, and `main` equals `origin/main` at `f16b505`. The last deployment checked on production was `f4cb430`.

**Tranche fourteen carried out the owner's rulings in D-028.** Twenty-one commits, each pushed on its own. What landed:

| area | state | where it is written |
|---|---|---|
| Villa Pueblo's copy | only sourced facts, Greek draft included | D-029 |
| The old Vercel token | expired by inference; the owner's dashboard step recorded | D-030 |
| The WebM ladder | 1920/1280/960 within 2,621,440 B, `mp4-only` fallback | D-031, `qa/media/FFMPEG-tranche14.md` |
| Percent-encoded duplicate URLs | one generated 301 per page; **production: 41/41 header entries pass** | D-032, `qa/security/ENCODING-tranche14.md` |
| The 3D gate's second condition | reads a committed INP record, recomputes the verdict from its rows | D-033 |
| Framer, deferred | **no public route carries it**; ~121 kB of initial JS off each animated template | D-034, `qa/perf/FRAMER-tranche14.md` |
| The 3D runtime | loads after a first interaction, at idle, in yielding tasks | D-035, `qa/perf/ESTATE3D-runtime-tranche14.md` |
| The INP harness | writes the gate's record; reviewed adversarially, 19 findings answered | D-036 |
| **The yield fix** | a tap that waited **241 ms** now waits **20 ms** | D-037, `qa/perf/YIELD-tranche14.md` |
| A swap-only failure | ruled: re-measure on real devices before judging the gate | D-038 (the owner) |

**The 3D estate map is not public, and that is correct.** Its gate is closed on *both* conditions: the plan is not owner-verified (provenance), and no INP record exists. `node scripts/check-estate-gate.mjs <origin>` prints both and confirms the deployment serves what the gate decides.

---

## 2. What is pending

**Blocked on the owner** — nothing can be done about these here:

1. **The Google Drive link** (photographs, the helipad, the MP4, the phone video) and **the site plan**, in its own labelled Drive folder. The tranche is on HOLD for both.
2. **The stagger ruling.** The hero tail's characters open 12 ms apart; the design plan never fixed which end leads. `qa/motion/README.md` shows three candidates side by side. The built default runs from the **last** character because the alternative makes the tail overprint itself. One line of CSS either way.
3. **The Vercel token step** in the dashboard (D-030), and **the launch hostname list** before HSTS preload.
4. **Five WebM questions** this tranche's defaults raise (D-031): the 960 floor, WebM-vs-MP4 source order, whether "2.5 MB" means 2,621,440 B, a portrait clip in a landscape hero, HDR tone mapping.

**Owed by the next session** — in this order:

1. **The INP measurement of record.** The instrument exists and is reviewed; the measurement has never completed. §4 has the procedure.
2. **Then D-038's device check, only if the swap cell alone fails.** §4 has the two obstacles it hits.
3. **The Framer lab A/B** (TBT, FCP, LCP, three arms, interleaved). `qa/perf/FRAMER-tranche14.md` §4 states exactly what it will report; the driver and the three-arm build script are written. The bytes are already measured, so this changes nothing that has shipped — it closes the record.
4. **Update `SESSION-REPORT.md`** as each lands. It is written at HEAD and is the truthful position, not a diary.

---

## 3. Design decisions worth knowing before you touch anything

**The 3D map is gated, deliberately and twice.** It renders publicly only when the owner has verified the plan *and* a committed record shows every measured phone tap strictly under 200 ms. The gate recomputes the verdict from the record's rows and ignores any stored pass flag; the fingerprint it keys on covers the mount-path sources, the installed versions of three/react/react-dom/next, and a digest of the plan's **drawn geometry** — so a plan edit that changes what is drawn needs the measurement taken again. **The fingerprint hashes file bytes, so a comment-only edit to a mount-path file invalidates the record.** Land documentation changes to those files *before* measuring.

**Splitting work into yielding tasks does not protect input unless you yield correctly.** This is the tranche's most expensive finding. The 3D build was split into twelve or thirteen steps and a tap still waited 241 ms, because a continuation resumed by `scheduler.yield()` keeps the caller's priority and outranks pending input. `yieldToMain` now always posts a `MessageChannel` message; the same tap measures 20 ms and the build is no slower. **Do not "optimise" that back to `scheduler.yield()`** — `src/lib/schedule.ts` carries the measurement, and three comments in this repository asserted the opposite before anyone measured it.

**No public route ships Framer Motion.** The clause is server markup; the hero tail tracks open in CSS, transform only; the inventory switch is a Web Animation started by a click; the ledger has its own `IntersectionObserver` with the truth as its default state. A source-level test forbids `Clause.tsx` from importing a client module — an interim build that did put Framer into the *initial* scripts of every page with a footer, worse than the preload it was removing.

**Redirects go in the config, never in a function.** Vercel's Routing Middleware runs before the cache, so a proxy matcher wide enough to catch percent-encoded spellings would put a metered function in front of every page view. `scripts/build-encoded-redirects.mjs` generates one 301 per page into `src/generated/encoded-redirects.json`, which `next.config.ts` appends.

**Content rules that are not negotiable.** Never invent a fact; missing content gets a visible `[TODO: needs content]`. Tier A imagery is real photography of Thalasses only. Booking must reach the real engine (`thalasses-villas.reserve-online.net`), never a fake checkout. No secret ever enters this repository — `npm run scan:secrets` before every push.

---

## 4. The next step, concretely

### 4.1 The INP measurement of record

Both builds must be fresh: the harness refuses a stale one, and the record names the tree it measured.

```bash
npm run build && npm run start               # arm A, the public build, :3005
npm run build:estate3d && npm run start:estate3d   # arm B, the review build, :3035
node scripts/estate-inp.mjs --a http://localhost:3005 --b http://localhost:3035 \
  --profiles phone,desktop --runs 10 --trials 20 \
  --out qa/perf/INP-estate3d.md --json qa/perf/INP-estate3d.json \
  --gate-json qa/perf/INP-estate3d-gate.json
```

About 1,560 trials, several hours, **on a machine doing nothing else** — log what else ran, because this machine is never idle by default (§5). Exit 0 means written and accepted; 1 means written but short or over the bar; 2 means refused before writing, and the reason is printed.

**Expect the `window:swap` cell to be the tightest.** On the landed tree it measured 160 ms against the 200 ms bar where the layout measured 32. The record reports the **worst** of twenty trials per cell, so that cell most likely decides the gate.

### 4.2 If it fails, read D-038 before concluding anything

The owner ruled that a **swap-only** failure is suspect, because this machine draws WebGL in software (SwiftShader) and the swap sits on the first composite. In that case the gate is ruled on real-device numbers with the lab figure kept as the caveat. Two obstacles, both recorded in D-038:

- **The deployed preview cannot show the diagram.** `scripts/estate3d-preview.mjs` refuses when `VERCEL` is set and the gate refuses `ESTATE_3D_PREVIEW` on Vercel (D-021, D-022); D-028 said no public preview of an unverified map. Serve the **local review build over Wi-Fi** instead — `next start` prints its LAN address. Nothing deployed, no guard touched.
- **Event Timing is probably absent on iOS** (it is a Chromium API and every iOS browser is WebKit). Check on the device. If absent, record a stand-in as a *different* instrument, or record no iPhone figure — never a number that looks like the others and is not.

**If any other cell fails too, the lab result stands and the gate stays closed.** The ruling is deliberately narrow.

---

## 5. Traps that have already cost this project time

- **A port is not proof of ownership.** Check the holder's command line, or fetch its build manifest by id, before stopping anything. Never kill node by image name: peer sessions on this machine have taken this project's servers down that way. For a long run, start `next start` detached in its own console and process group (on Windows, via WMI `Win32_Process.Create`) and keep its PID in a file, so a neighbour's Ctrl+C or image-name kill cannot reach it. No such script is tracked here — it is machine setup, not project code.
- **A workflow's completion notice says nothing about the others.** A `started` with no `result` in any `subagents/workflows/*/journal.jsonl` means a live agent. This session deleted three worktrees and killed two servers belonging to one, destroying its verification work and poisoning a timing run.
- **A git worktree lacks the 159 gitignored photographs.** Copy `public/images/_chh` and `_pool` in and prove it with `git ls-files -o -i public/images` before any build you intend to measure.
- **`reuseExistingServer: true` will hand the suite a stale build.** Stop the old server before re-running, or the result is about a build you replaced.
- **PowerShell 5.1 reads a BOM-less UTF-8 `.ps1` as ANSI**, so a Greek path in a script literal arrives mangled and every `Set-Location` fails quietly. Write `.ps1` files ASCII-only and pass paths as parameters. Always `git commit -F <file>`.
- **`waitUntil: "load"` on a photo-heavy page waits behind Next's image optimiser queue** and times out under load. Two tests failed this way and were fixed to `domcontentloaded`, which is all they needed.
- **Vercel has one build slot.** A stuck deployment queues everything behind it for hours.

---

## 6. The standard of evidence here

This project's records are worth something because claims are falsified rather than asserted. A mutation is written into the source, built, **proven present in the built bytes and proven served**, the named test run, then the file restored and byte-checked. Fourteen such mutations pin the 3D runtime; eight pin the Framer mechanism; ten pin the harness. Two of the fourteen stay green and the record says why rather than hiding them.

Timing figures say which machine they came from and what else was running. A figure over a budget is written down, never withheld. When a session's own claim turns out to be wrong — and several in this tranche were — the correction goes in the record next to the claim, not quietly into the past.

Keep that up, or the records stop being worth reading.
