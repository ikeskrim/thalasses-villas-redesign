# The deferred 3D runtime: what it does, what it costs, what is falsified (tranche fourteen)

DECISIONS.md D-028 refused the phone tap cost of the first 3D implementation (0.48–0.68 s median) and said what to do about it: "defer the three.js load until idle and after first interaction, split the first-frame work into yielding tasks, re-measure; the gate stays closed until the tap stays under 200 ms." D-035 records the build defaults; this file is the evidence for the runtime, landed in 25f4e51.

**Every timing figure in this file is a SMOKE figure and none is a record.** The measurement of record needs the harness that writes `qa/perf/INP-estate3d-gate.json`, which does not exist yet, and a machine doing nothing else. Until it exists the gate reports "INP: no record" and the public map stays closed on that condition as well as on provenance.

## 1. The phases, and where the budget goes

From the page's own `estate3d:*` marks on the review build, three runs per profile, on a shared machine. Deltas in ms.

| | desktop 1440×900, no throttle | phone 390×844 DPR 2, 4× CPU |
|---|---|---|
| trigger → idle | 1026.8 / 1010.9 / 1025.3 | 1013.3 / 1016.8 / 1018.7 |
| idle → probe | 0.1 / 0 / 0.1 | 0.2 / 0.2 / 0 |
| probe → import-start | 6.6 / 6.8 / 5.3 | 13.5 / 13.7 / 12.5 |
| **import-start → import-end** | 31.6 / 30.6 / 35.5 | **104.4 / 83.2 / 94.5** |
| import-end → renderer | 6.3 / 5.9 / 6.2 | 35.1 / 53.8 / 66.2 |
| renderer → scene | 12.2 / 9.6 / 10.4 | 37.0 / 33.5 / 42.1 |
| scene → compile | 7.3 / 7.5 / 6.8 | 47.7 / 42.2 / 47.1 |
| compile → compiled | 6.8 / 7.1 / 6.9 | 70.9 / 51.3 / 53.8 |
| compiled → layout | 19.6 / 4.3 / 3.4 | 13.3 / 14.1 / 11.8 |
| layout → swap (the split label search) | 20.8 / 21.8 / 24.2 | 135.1 / 114.7 / 105.5 |
| **swap → shown (the write task)** | 9.0 / 9.5 / 10.3 | **43.5 / 42.1 / 37.5** |
| **renderer → swap** | **66.7 / 50.3 / 51.7** | **304.0 / 255.8 / 260.3** |
| **trigger → shown** | **1147.1 / 1114.0 / 1134.4** | **1514.0 / 1465.6 / 1489.7** |

- `trigger → idle` of 1013–1027 ms against `QUIET_MS` 1000 is the quiet period, observable in the marks.
- The write-only final task fell from 44–52 ms to **37–44 ms** when the last search step was moved out of it.
- **`KHR_parallel_shader_compile` is not available on this rig** (`{"khrParallelShaderCompile": false, "programs": 8}` in every run), so each program's link is waited for at its first use — which is why the pipeline gives each first use a task of its own. `requestIdleCallback` and `scheduler.yield` are both present, and the idle wait never fired on its timeout.

**THE LEADING RISK FOR THE GATE IS THE CHUNK'S OWN EVALUATION.** `import-start → import-end` is **83–104 ms of the 200 ms bar** in the three phone-profile runs above (562,640 B in one V8 task; against a localhost server essentially all of it is evaluation, not download). **An earlier build of the same stage measured 105–168 ms for the same phase**, in a run that is not part of this record — so the spread is wider than three runs show, and the figure to plan against is the higher one. **No `yieldToMain` can enter that task.** The record's `window:request` and `window:arrival` cells place measured taps exactly inside and after it, so that is where the gate is most likely to fail.

Warming the chunk at one idle moment and importing at a second — the reviewer's suggestion — was considered and **refused**: application code cannot name the file a dynamic `import()` will fetch (the chunk's URL is the bundler's private knowledge, and reaching into `__webpack_require__` is not honest), and on localhost the download is a few milliseconds of the figure above. The evaluation is the cost and the module graph schedules it, not the caller. If headroom is needed the levers are a smaller three.js (a subset build) or a different bar, and the bar is the owner's.

## 2. What a "long task" measures here, and what it does not

Measured on this build, and it matters for the harness:

- A chain of `scheduler.yield()` continuations **outranks ordinary tasks**: a `setTimeout` ping was starved for 284–332 ms across the build, and a `PerformanceObserver` callback did not run until the chain ended — it fired 180–240 ms *after* the swap mark it was watching for.
- Chrome reports that whole chain as **one `longtask` entry**: a 191–200 ms "long task" containing **13 separately yielded steps**, proven by counting the `scheduler.yield()` calls inside it.
- So neither `longtask` nor a timer ping can tell a split layout from a single one, and neither is what INP measures — input is dispatched ahead of the continuations, which is the point of yielding. **The harness must measure Event Timing.** The resize test counts the split itself instead, which is exact.
- Rendering is nearly starved too: two animation frames between `renderer` and `swap` at full speed, which is why the frame-sampler test slows the yields.

## 3. The page, unchanged

On the public build the gate is closed, and the prerendered `/en/the-estate` is byte-for-byte what it was before this work, with BUILD_ID, chunk names and media hashes normalised: 185,904 bytes of HTML both, 870 tags in the same sequence; the flight data identical at 58,835 bytes; no `estate-map-stage`, no `data-state=`, no `estate-render-plan/1`, and the same nine 2D markers.

On the landed tree, measured from the served page: **11 initial scripts, 613,951 B, and none of them carries `WebGLRenderer`**; exactly one chunk in the whole build does (562,640 B). Against the commit before it the route's initial JavaScript is **+3,097 B** — the loader and the scheduler, not the renderer.

## 4. Falsified

Fourteen mutations, each written into the sources, each with its own review build, each **proven present** in that build (its sentinel found in a built static chunk, the file named in the summary) and **proven served** (the page carried the new BUILD_ID), the named tests run, then every edited file rewritten and its SHA-256 checked against the original. `restored: true` for all fourteen. The positive control for the landed tree is this tranche's own 34-passed run of `tests/estate-3d-preview.spec.ts`.

| mutation | verdict | red at |
|---|---|---|
| load on range again (no interaction required) | **RED** | "three.js was fetched with no interaction" |
| `pointerdown` as the trigger instead of `pointerup` | **RED** | "three.js was fetched after swipes alone" |
| swap before the first frame | **RED** | "the diagram was shown before it was drawn and placed" |
| no swap delay | **RED** (2) | "the swap went ahead over an open card"; "the swap took the focused marker away" |
| no quiet period | **RED** (2) | "the loader went idle less than a quiet period after the last activity"; "…after the map came into range" |
| the label search back in ONE task (the old resize path) | **RED** | "the build's label search ran in too few tasks to have been split" |
| the staged diagram keeps neither `inert` nor `aria-hidden` | **RED** | "the staged diagram is not inert" |
| the cleanup no longer disposes geometries and materials | **RED** | "no geometry was disposed: its attribute buffers are still the driver's" |
| the cleanup no longer releases the GL context | **RED** (2) | "the GL context of the abandoned build was not released"; "the finished diagram's GL context was not released" |
| the swap no longer holds on an open 2D card | **RED** | "the swap went ahead over an open card with focus elsewhere" |
| the build ignores an unmount (four stops removed) | **RED** | "the GL context of the abandoned build was not released" |
| every stop removed, forced context loss included | **RED** | as above |
| unmount ignored, size wait and reveal guard LEFT IN | **GREEN** | — |
| every stop removed EXCEPT the forced context loss | **GREEN** | — |

**The two green ones are understood, not excused.** Each leaves one stop that halts a runaway build on its own: a detached frame has no size, so the wait for a frame with a size never resolves; and a force-lost context kills the build wherever it is. The mutation that removes **both** is red. So the unmount defence is redundant on purpose and the suite pins it as a set rather than member by member. **This corrects the stage's own prediction** that the last mutation would isolate the assertion "the build went on after the page was left": it did not, and no test currently isolates that behaviour from the context release.

## 5. Provenance of this evidence, stated because it is not all from one tree

- §1, §2 and §4 are the runtime stage's own measurements, taken in its worktree.
- §3's "page unchanged" comparison is the stage's, against a capture of the tree before the work; its normalised-HTML claim was not re-taken here.
- §3's initial-script figures and the `WebGLRenderer` count are **this session's, on the landed tree**.
- The stage's notes quote a tree fingerprint of `52d8495d…`; **the tree it left, and which is landed, fingerprints `ba1f8c93…`** (confirmed by running `src/lib/estate-3d-fingerprint.ts` against both trees and against the build). Its test evidence was taken about twenty minutes before its final content, so every check in 25f4e51's commit message was re-run here on the landed tree. **What changed between the two trees is not established**: its own edit scripts after that point touched test files only, and no mutation sentinel survives in any fingerprinted source.
- The stage reports that "a peer session killed both my servers once, mid-run". It was this session, cleaning up worktrees on the belief that both workflows had finished; one had.

## 6. Open issues

1. **The harness and the record** (D-033) do not exist yet. Until they do the INP condition fails with "no record", which is the correct outcome.
2. **The `estate3d:*` marks are a contract with the harness** and are pinned only by the ordering test and the resize test. The harness should read the names from one place.
3. **The swap's direct DOM write** depends on React diffing attributes against its own last props. Safe today; re-check if the stage's `data-state` ever becomes something React recomputes.
4. **A resize that lands mid-layout is answered one chain of tasks later**, and for that chain the drawing is CSS-stretched over the difference. Bounded and self-correcting, but nobody has looked at it on a real phone.
5. **Nothing isolates "the build ran on after the unmount"** from the context release (§4).
6. **A screen-reader reader in browse mode** may have the 2D markers replaced under them: the swap hold reads DOM focus, an open card and a pointer, and a virtual cursor moves none of those. Desktop only — the 2D markers are `display: none` below 768 px — and the numbered list carries every place regardless.
7. **A phone reader who only scrolls never sees the diagram.** That is the ruling's consequence, not a defect, and it is in front of the owner in D-035.
