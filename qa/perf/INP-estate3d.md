# INP on the estate page with the 3D map active (tranche thirteen)

DECISIONS.md D-021 B asks: "Measure INP on the estate page with the map active — the owner's decision should carry its full cost."

The map's build defaults are recorded in D-027. The harness is `scripts/estate-inp.mjs`, committed in 1299cf0. Its two reports are committed verbatim beside this file:
- `INP-estate3d-phone.md`
- `INP-estate3d-desktop.md`

**The answer.**
- **On a settled page,** the 3D map is cheap. Every tap and keypress on both builds, phone and desktop, stays under 72 ms.
- **The cost is the load window.** This is the moment the three.js chunk arrives and the first 3D frame is drawn.
  - **Phone:** 185 of 200 interactions landing in that window took over 200 ms. The medians were 484–680 ms, with a worst of 928 ms, and the window had not closed 400 ms after the chunk arrived.
  - **Desktop:** the window is about +50 to +150 ms after arrival, with medians of 248–304 ms and a worst of 368 ms.
- **The 2D map** that is live today never went over 40 ms.
- **Caveats.**
  - These figures come from a software GPU, which overstates the cost of the first frame against a real phone. By how much is not measured.
  - The machine was shared with other sessions (§2), which may have raised the absolute figures (§5).

## 1. What was compared

| arm | build | the estate page shows |
|---|---|---|
| A | the public build (`npm run build`, `next start` on :3005, BUILD_ID `nroFPPsp9c10R1zLyvyWB`) | the 2D map. The provenance gate is closed, and three.js is never fetched |
| B | the local review build (`npm run build:estate3d`, `ESTATE_3D_PREVIEW=1`, :3035, BUILD_ID `VK51yTboc5x7KXWnw1SRm`) | the 3D diagram the public site will show once the plan is owner-verified |

Both builds run 1299cf0's code. The only later commit, 3f2f82d, touched documentation.

## 2. Method

**How the harness measures.** Details are in the script's header and in D-027.
- Interactions are grouped by `interactionId`. An interaction under Event Timing's 16 ms floor is counted as such and never printed as 0. Lost and invalid trials are excluded and listed.
- Every trial uses a fresh browser context, and builds alternate in ABBA order.

**Calibration.** A non-awaited CDP input is sent into a 300 ms busy loop, and must show up as queueing delay. It passed on both profiles:
- phone: 300 ms measured against 240 ms expected;
- desktop: 251 ms against 246 ms.

**Fixed scenarios.** Ten valid runs per build per profile, on a page that has settled:
- opening a place;
- the keyboard path (Tab, then Enter);
- the card's Visit link;
- the list link;
- a canvas tap.

**The load window.** Inputs are aimed at 0–400 ms after the three.js chunk's `loadingFinished`. There are 20 valid trials per offset per build, and each is classified from a Chrome trace. The chunk is `04r_x7_oxlpca.js`: 141,576 B transferred and 559,796 B decoded. It finished 1,241 ms after the scroll on the phone, and 285 ms after it on desktop.

**Profiles.**
- Phone: 390×844, 4× CPU, Slow 4G, touch.
- Desktop: 1440×900, 2× CPU.

The GPU was SwiftShader, which is software, on both.

**When.** Each profile ran as its own invocation, on 2026-09-16: phone from 12:37 to 14:09 local time, desktop from 14:09 to 15:21. Every scenario, profile and build reached the harness's minimums.

**Trials.**
- Phone: 500 trials, 470 ok and 30 n/a. The n/a trials are the 2D build's place, keyboard and visit controls, which are hidden below 768 px.
- Desktop: 500 trials, all ok.
- Neither profile had a lost, invalid or errored trial.

**Machine: shared, not idle.** This session ran nothing else during the measurement except the two servers and a few light reads of the harness's own log. It ran no build, test, scan, commit or agent. Other local sessions, working in other repositories, were active during both profiles, and committed inside them:
- **during the phone profile** (12:37–14:09):
  - `ink-hotels`, three commits, at 12:43, 12:45 and 13:24;
  - `domisignature` at 13:39, on its CSP harness;
- **during the desktop profile** (14:09–15:21):
  - `ink-hotels`, three commits at 14:13–14:14, among them a hydration change and "COOP re-measured";
  - `domisignature` at 14:35, then at 15:18 and 15:19, closing a stage with "baselines, full QA, seal and CSP measured".

An earlier version of this record said nothing else ran. That was true of this session only (corrected in tranche thirteen's report commit). What it changes is in §5.

**The first attempt** (2026-09-15) stopped about ten minutes in, when the session ended. It left only a partial progress log in the session scratch: calibration and 63 trials. It wrote no report, and none of its figures are used.

## 3. Results

### 3.1 Fixed scenarios (a settled page)

Median and worst INP over 10 runs. The split is input delay / processing / presentation, in ms, for the median run.

| scenario | phone A (2D) | phone B (3D) | desktop A (2D) | desktop B (3D) |
|---|---|---|---|---|
| open a place | n/a | 60 / 72 ms (16 / 25 / 15) | 36 / 40 ms (4 / 0 / 28) | 56 / 72 ms (5 / 0 / 51) |
| keyboard (Tab, Enter) | n/a | 48 / 56 ms (0 / 1 / 47) | 32 / 32 ms (0 / 2 / 29) | 48 / 48 ms (0 / 0 / 48) |
| the card's Visit link | n/a | 24 / 24 ms | 16 / 24 ms (5 runs < 16) | 24 / 24 ms |
| the list link | 32 / 40 ms | 32 / 48 ms | 24 / 32 ms | 32 / 48 ms |
| a canvas tap | 16 / 24 ms | 20 / 24 ms | every run < 16 ms | every run < 16 ms |

Every scenario passes the 200 ms budget on its worst run.

### 3.2 The load window (per offset after the chunk finished loading; 20 trials each)

| offset | phone A: median / worst | phone B: median / worst | phone B > 200 ms | desktop A: median / worst | desktop B: median / worst | desktop B > 200 ms |
|---|---|---|---|---|---|---|
| +0 ms | 16 / 24 | 664 / 792 | 18 | 24 / 40 | 48 / 64 | 0 |
| +25 ms | 16 / 40 | 680 / 928 | 15 | 24 / 32 | 32 / 56 | 0 |
| +50 ms | 16 / 24 | 644 / 752 | 18 | 20 / 24 | 280 / 352 | 19 |
| +75 ms | 16 / 24 | 596 / 752 | 15 | 24 / 32 | 304 / 360 | 20 |
| +100 ms | 16 / 24 | 604 / 776 | 19 | 24 / 32 | 248 / 368 | 20 |
| +150 ms | 16 / 24 | 516 / 848 | 20 | 24 / 32 | 248 / 352 | 18 |
| +200 ms | 16 / 24 | 484 / 736 | 20 | 24 / 32 | 128 / 240 | 1 |
| +250 ms | 16 / 24 | 552 / 736 | 20 | 24 / 32 | 108 / 200 | 0 |
| +300 ms | 24 / 40 | 676 / 840 | 20 | 24 / 32 | 88 / 160 | 0 |
| +400 ms | 24 / 32 | 312 / 648 | 20 | 16 / 24 | 32 / 72 | 0 |
| **all** | 0 of 200 over 200 ms | | **185 of 200** | 0 of 200 | | **78 of 200** |

All figures are in ms. A median of 16 includes a few trials under 16 ms: phone A has 2 at +0, 2 at +150 and 1 at +200. The trace classes behind each trial are in the two verbatim reports.

## 4. What this establishes

1. **On a settled page, the 3D map costs little.**
   - Opening a place takes 56 ms at the median on desktop, against 36 ms on the 2D map. A keypress takes 48 against 32. Nearly all of the difference is presentation, which is the one re-render the map does per open.
   - On the phone, the 3D build's worst interaction was 72 ms. Nothing came near 200 ms.
2. **The load window is the owner's decision's real cost, and on the phone it is large.**
   - An interaction that lands after the three.js chunk arrives waits behind chunk evaluation, the first 3D frame and other tasks, according to the trace classes. On the phone that wait is 484–680 ms at the median, and up to 928 ms.
   - Because INP reports close to a visit's worst interaction, one such tap sets a visit's INP. **A phone visitor who taps in that window will very likely get an INP well over the 200 ms "good" threshold:** 185 of 200 such taps did, in the lab. (Qualified in the tranche-thirteen report commit; it had read "gets".)
   - The same visitor on the 2D map gets 16–40 ms.
3. **On the phone, the window lasts at least 400 ms after the chunk arrives.** At +400 ms all 20 trials were still over 200 ms, with a median of 312 ms. How long it lasts beyond that is not measured, because the harness's offsets stop at 400 ms.
4. **On desktop, the window is short.** Interactions stay fast at +0 and +25 ms, while the chunk evaluates, and are slow from +50 to +150 ms, while the first frame renders. Only one trial at +200 ms went over 200 ms, and none after that.
5. **The window opens only when the map is about to be seen.** The chunk is fetched when the map comes within 600 px of the viewport, so a visitor who never scrolls to the map never pays this cost. Neither does one who has reduced motion on, no WebGL2, or Data Saver on (D-027).

## 5. Limits

- **Lab only.** Chromium through Playwright, with synthetic CDP input and throttled CPU and network. This is not field INP, and not Safari or Firefox.
- **Software WebGL.** SwiftShader overstates the first frame's cost compared with a phone's GPU. That is the biggest single reservation about the phone figures, and the size of the overstatement is not measured.
- **The phone window's end is not measured.** The offsets stop at 400 ms, as the harness specifies.
- **The machine was shared** (§2).
  - Both arms ran under the same conditions on average, since builds alternate ABBA.
  - Outside load may have raised individual figures on either arm.
  - In the load-window trials the 2D arm stayed at medians of 16–24 ms. Its settled-page medians were at most 36 ms, the lowest under 16 ms, and its worst was 40 ms throughout. That bounds what outside load alone added to a light interaction. It does not bound what it added to the 3D arm's much heavier main-thread work in the load window.
  - So the absolute 3D load-window figures may be higher than an idle machine of the same speed would give. By how much is not measured.
- **The reports' own "Limits" section ends with a line the harness never checked:** "The machine was not isolated. Figures of record need an otherwise idle machine." The harness printed it on every run, whatever the conditions.
  - The line happened to be true of this run (§2).
  - An earlier version of this record made two claims about it, and both were wrong:
    - that the line contradicted the reports' header, when the header certifies only the minimum counts;
    - that this run was on an otherwise idle machine, when the machine was shared.
  - The line is kept verbatim in the committed reports.
  - In 2ff36f8 the harness was changed. It prints "not isolated" only on SMOKE runs. On a record run it says it cannot check idleness, and that the record citing the figures states the conditions, as §2 does here.
- **Phone A has no place, keyboard or Visit control,** because the 2D markers are hidden below 768 px. Those phone rows are B only.
- **One machine, and the minimum counts.** The medians and worsts come from 10 runs, or 20 trials, per cell.
