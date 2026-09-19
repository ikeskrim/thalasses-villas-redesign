# Splitting was not enough: how the build yields decides whether a tap is served (tranche fourteen)

DECISIONS.md D-028 refused the 3D map's phone tap cost and said what to do about it: "defer the three.js load until idle and after first interaction, **split the first-frame work into yielding tasks**, re-measure; the gate stays closed until the tap stays under 200 ms." D-037 records the change this file measures.

**The work was split, and the tap still waited 241 ms.** Splitting only helps if the browser lets input in *between* the steps, and that turns out to depend on **how** the page yields rather than on how finely it splits. Yielding through `scheduler.yield()` held a tap for the rest of the chain; yielding through a posted message brought the same tap to **20 ms**, at no measured cost to the build.

## 1. What was measured

`scripts/estate-inp.mjs`, the instrument D-036 landed, on the phone profile (390×844 at DPR 2, 4× CPU) against the local review build, arm B. Each figure is the worst interaction of its trial; the split is **input delay / processing / presentation** in ms.

**Baseline — `yieldToMain` prefers `scheduler.yield()`** (the tree at a582c2d), three trials per cell:

| tap fired at | median INP | input delay | verdict |
|---|---|---|---|
| `window:layout:0` (the phase's first ms) | 248 ms | 241 | FAIL |
| `window:layout:25` | 232 ms | 225 | FAIL |
| `window:layout:50` | 192 ms | 180 | FAIL |
| `window:layout:75` | 172 ms | 165 | pass |
| `window:layout:100` | — | — | every trial invalid: the phase had already ended |

**Probe — the same tree with one line changed**, so `yieldToMain` always posts a message (worktree `t14-yield-probe`, the change proven present in the built chunk), three trials per cell:

| tap fired at | median INP | input delay | verdict |
|---|---|---|---|
| `window:layout:0` | **24 ms** | 20 | pass |
| `window:layout:25` | **24 ms** | 17 | pass |
| `window:layout:50` | **24 ms** | 24 | pass |

Arm A — the public build, no 3D — answered every one of these in 16 ms or under, in both runs.

**Confirmed on the tree this commit lands** (both builds rebuilt from it, three trials per cell, phone, arm B) — and it moves the tightest cell somewhere new:

| tap fired at | median INP | input delay | against the baseline |
|---|---|---|---|
| `window:layout:0` | **32 ms** | 28 | was 248 ms |
| `window:layout:41` | **24 ms** | 15 | was 232 ms at +25 |
| `window:arrival:0` | 72 ms | 67 | inside the chunk's one evaluation task, so unchanged in kind |
| `window:arrival:31` | 48 ms | 43 | — |
| **`window:swap:0`** | **160 ms** | 151 | the highest figure left |
| `window:swap:15` | 136 ms | 126 | — |

**The swap is now the cell to watch.** It passes the 200 ms bar, but by about 40 ms on three trials, where the layout now passes by 168. A tap at the swap mark waits ~151 ms, which is more than the write-only task the runtime record measured at 37–44 ms, so something after that mark is holding the thread — plausibly the first composite of a WebGL canvas that this rig draws in software. The measurement of record takes twenty trials per cell and reports the WORST, so this is the cell most likely to decide the gate. It is named here so that it is not a surprise later.

## 2. Why this says the chain, and not the task

Three things, and the third is the one that settles it:

1. **The delay falls one-for-one with how late the tap is fired**: 241 → 225 → 180 → 165 ms as the tap moves 0 → 25 → 50 → 75 ms into the phase. Waiting for a *fixed end point*, not for whatever task the tap landed in.
2. **The phase is far shorter than the wait.** The layout phase measured 74–93 ms (median 82); the tap at its start waited 241 ms — about three times the phase, so the tap outlived the phase it landed in.
3. **A tap inside a genuinely un-splittable single task behaves completely differently.** Fired at `window:arrival:0`, inside the three.js chunk's one V8 evaluation task, the delay was ~85 ms — the remainder of that one task, which is ordinary and correct. The layout phase is split into twelve or more yielded steps and behaved *worse*.

Taken together: a continuation resumed by `scheduler.yield()` keeps the caller's priority, and on this engine that outranks a pending input. The build was polite about giving up the thread and the browser handed it straight back, ahead of the tap.

**Two symptoms already in the record, now explained.** `ESTATE3D-runtime-tranche14.md` §2 recorded that the same chain starved a `setTimeout` ping for 284–332 ms, and that Chrome reported thirteen separately yielded steps as **one** 191–200 ms `longtask`. Both were written down as curiosities of the instrument. They are the same effect: the chain does not give the thread back to anything of lower priority, input included.

## 3. What the change costs

**Nothing measurable.** The layout phase is the same length either way — median **82 ms** with `scheduler.yield()` against **80 ms** through the posted message (20 and 12 trials). The build is not slowed by yielding differently; only the tap's fate changes.

`setTimeout(0)` is not an alternative: nested timers are clamped to 4 ms after five levels, which a chain of awaited yields reaches at once. A posted message is an ordinary task, is not clamped, and is outranked by input — which is the whole point here.

## 4. What this cost the repository in wrong comments

Three places asserted the opposite, confidently, and all three are corrected in the commit that lands this:

- `src/lib/schedule.ts`: "`scheduler.yield()` … its continuation goes ahead of other queued tasks of the same priority, **but after input**".
- `src/components/sections/EstateMap3D.tsx`: the build yields "`scheduler.yield()` where it exists, else a posted message", described as making a tap "wait for one step, not for the whole of it".
- `tests/estate-3d-preview.spec.ts`: "**input is dispatched ahead of the continuations, which is the whole point of yielding**".

The belief was reasonable and is what the API is for. It was never measured until now.

## 5. The tests that would have gone quiet

Four tests slowed the build by wrapping `scheduler.yield()`, and the resize test counted the split the same way. With the page no longer calling it, **every one of them would have counted zero yields and asserted nothing** — passing while measuring nothing at all. They now instrument `MessageChannel`, recording posts per channel and taking the busiest: React's scheduler uses one too, so the counts are kept apart, and `sendTrigger` raises a flag so that only the channel the build makes (lazily, at its first yield, after the trigger) is slowed.

## 6. Limits, stated

- **Lab, one machine, one engine.** Chromium 151.0.7922.34 through Playwright 1.62.1, synthetic CDP input, WebGL drawn in software (SwiftShader). Not field INP, and not Safari or Firefox — where `scheduler.yield()` is absent anyway and the posted message was always the path taken.
- **Smoke counts.** Three trials per cell, on a machine where two sibling sessions were active. The effect is a factor of ten and the direction is unambiguous, but these are not the measurement of record: that is D-033's, and it follows this change.
- **Not established:** whether the same holds on a real Android device, whether a genuine touch (rather than a CDP-synthesised one) is queued the same way, and whether Chromium's behaviour here is intended or a defect worth reporting upstream. The first two would need a device lab; the third needs a minimal reproduction away from this codebase.
