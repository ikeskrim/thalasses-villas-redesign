# The 3D estate map (`feat/estate-3d`): what it costs

The cost of the experiment, recorded for the owner's yes or no. **Branch only.
Nothing here is on main.**

The figures of record were measured on 2026-09-14:
- **Branch:** its final build, with the review fixes (the pool-line label, the
  shortened phone note and the reduced-motion 2D checks), against main's final
  candidate.
- **The gitignored photographs:** both trees held all 159 of them, and both
  builds were rebuilt.
- **QA on that branch build:** 535 passed, WebKit 14 / 14,
  `tests/estate-3d.spec.ts` 3 / 3.

## Bundle

| what | raw | gzip | brotli | measured on |
|---|---|---|---|---|
| three.js 0.186.0 (MIT), one lazy chunk (`0o0atddw7-ekq.js`) | 546,208 B (533 KiB) | 132 KiB | — | final branch build |
| same chunk, as recorded with `7fa6fb7` | 533 kB | 132 kB | 107 kB | `7fa6fb7` |
| `/en/the-estate` initial JavaScript, main | — | 228,899 B | — | `56cb859` (audit) |
| `/en/the-estate` initial JavaScript, branch | — | 229,188 B | — | `7fa6fb7` (audit) |

- **When the chunk is fetched.** All three conditions must hold:
  - the map section is within 600 px of the viewport;
  - WebGL is available;
  - reduced motion is off (`src/components/sections/estate-map-3d-gate.ts`).

  A reader who never nears the map, has no WebGL, or asks for reduced motion
  never downloads it. `tests/estate-3d.spec.ts` asserts two things: three.js is
  in no initial script, and it is never fetched under reduced motion.
- **The final build's figures.**
  - Raw size: the chunk's byte size on disk (it is the only built script that
    contains `WebGLRenderer`).
  - Gzip: as computed by `scripts/perf-attribute.mjs` over the scripts loaded
    in its trace.
  - Brotli: not recomputed.
- **The initial JavaScript figures.** They come from the tranche-twelve audit.
  The difference is +289 bytes, consistent with the branch's gate code, and
  nobody has attributed it. They were not measured again on the final builds.
- **Unit.** The raw byte counts show that "kB" in the `7fa6fb7` record means
  kibibytes.

## Core Web Vitals: interleaved A/B on `/en/the-estate`

Every run, in the order measured, is in `qa/perf/AB-tranche12-estate3d-final.md`.

- **A**: main's final candidate, `next start` on :3005.
- **B**: this branch's final build, `next start` on :3025, from its worktree.
- Order alternates per run (A,B then B,A). Three runs each.
- **The gate** is `scripts/hotel-cwv.mjs`:
  - **TBT comes from a Chrome trace, after first contentful paint**
    (Lighthouse's window);
  - `load-blocking` counts every long task;
  - `observer` is the page's own longtask observer, kept for comparison.
- **The session:** load, settle 2.5 s, then scroll the whole page. B's runs
  therefore include fetching three.js and drawing the diagram.
- **Profiles:**
  - phone: 4× CPU, Slow 4G, 390×844, WebGL available, motion allowed;
  - desktop: 2× CPU, 1440×900.

  Lab only.

| route | view | TBT after FCP A (runs) | TBT after FCP B (runs) | Δ | load-blocking A → B | observer A → B | FCP A → B | LCP A → B | CLS A/B | worst interaction A/B |
|---|---|---|---|---|---|---|---|---|---|---|
| `/en/the-estate` | phone | 85 ms (85/97/78) | 139 ms (139/137/149) | +54 ms | 204 → 273 ms | 94 → 145 ms | 1160 → 1204 ms | 1164 → 1204 ms | 0/0 | 0/0 ms |
| `/en/the-estate` | desktop | 0 ms (0/0/0) | 27 ms (20/31/27) | +27 ms | 0 → 27 ms | 0 → 25 ms | 436 → 428 ms | 648 → 640 ms | 0/0 | 0/0 ms |

### Read against the phone TBT target (under 200 ms, ask 2)

- **Both builds stay under it.**
  - Main's phone runs: 85/97/78 ms.
  - The branch's: 139/137/149 ms.
  - The median rises by 54 ms, and the branch's highest run is 51 ms under the
    target.
- **All three definitions agree that the added work is real.** Load-blocking
  rises by 69 ms (204 → 273), and the page's own observer by 51 ms (94 → 145).
- **Desktop TBT goes from 0 to 27 ms.**
- **CLS is 0 on both builds.**
- **Phone FCP and LCP medians are 40–44 ms later on the branch.** The runs
  overlap (LCP A 1152–1176 ms, B 1160–1204 ms), and three runs cannot separate
  that from noise. It is recorded here, not claimed as nothing.
- **Do not compare across files.**
  - Main's phone median on this route is 73 ms in `qa/perf/AB-tranche12-final.md`
    on main and 85 ms here: that is drift between sessions, which is why each file
    interleaves its own A and B.
  - The first measurement of this branch, `AB-tranche12-estate3d.md`, gave
    123 → 286 ms. It is superseded: the branch's worktree was missing the 159
    gitignored photographs.

## Where the added time goes

These are phone-profile traces of `/en/the-estate` on each build, taken with
`scripts/perf-attribute.mjs`. The session scratch files are
`attribution-estate-main-final.md` and `attribution-estate-branch-final.md`.
That script runs the V8 CPU sampler, which inflates durations on a throttled
CPU. Its trace TBT is 200 ms on main and 308 ms on the branch, against
hotel-cwv's medians of 85 and 139. **It shows where the time goes; hotel-cwv
measures how much.**

**Four long tasks appear on both builds, within 3 ms of each other:**
- a style recalculation of about 75 ms, before first paint;
- a layout of about 150 ms;
- a layout of about 70 ms;
- a hydration task of about 105 ms at 2.1 s.

**The branch adds two, and only two.** Both start at about 6.1 s, after the
settle, while the session scrolls the map section into range. The trace puts
all of the branch's interaction-phase blocking (106 ms) in these two, against
none on main.

| task | branch | main | what the samples show |
|---|---|---|---|
| fetch, then evaluate the three.js chunk | 65 ms task at 6,142 ms (15 ms blocking) | — | 50 ms in Turbopack's module loader (`H` in `turbopack-*.js`), instantiating `0o0atddw7-ekq.js` |
| `WebGLRenderer` construction, shader compilation and the first `render()` | 141 ms task at 6,279 ms (91 ms blocking) | — | 134 ms of script inside `0o0atddw7-ekq.js`, spread across minified functions (`ez`, `N`, `eB`, `e1`, `setSize`), with one forced style recalc (3 ms) and one forced layout (1 ms) requested from the chunk. **The three stages cannot be separated here:** the chunk is minified and no source map was used |
| React re-render of the section (swap to `EstateMap3D`, label placement) | not visible as a long task | not visible | no other new task over 50 ms |
| anything else over 50 ms that is new on the branch | none | — | — |

Both new tasks land while the reader is scrolling towards the map. A tap in
that window would wait behind them. That is an inference from where they sit.
It has not been measured (see *INP*).

## INP: not measured on this route

`hotel-cwv`'s lab stand-in for INP is the longest Event Timing entry of 16 ms
or more among the interactions the script itself drives (`scripts/hotel-cwv.mjs`
on main):

- a click on the second `.ho-dots` button, if the page has one;
- a wheel scroll through the whole page;
- a hover on the first `.ho-card`, if the page has one.

**On `/en/the-estate` the harness drove no interaction that Event Timing
records.**
- The page has no `.ho-dots` and no `.ho-card`. Those belong to the Hotel
  components and `LiquidCards`, which the estate page does not render. So the
  script skips the click and the hover.
- A wheel scroll is not an event type Event Timing reports, and it is not an
  INP interaction.
- The 0 ms in every run on both builds is the value the observer starts at,
  which nothing on this route replaced. It is not a reading.

Nothing in the harness taps the diagram's labels, or sends input while the
chunk is being evaluated or the first frame is drawn. **The diagram's INP
impact is unmeasured.**

## Limits

- Three runs per side, one machine, Chromium only, lab only. There is no field
  data.
- Only the WebGL-with-motion path was measured on the branch. The
  reduced-motion and no-WebGL paths do not fetch three.js, by construction, and
  the reduced-motion path is asserted by `tests/estate-3d.spec.ts`. Neither was
  put through the CWV harness.
- Which GPU path headless Chromium used for WebGL (hardware or software) was not
  recorded.

## Still to measure, if the answer is yes

- INP on `/en/the-estate` on both builds: a run that taps the diagram's labels
  and the list's links, including while the three.js chunk is evaluated and the
  first frame is drawn.
- Narrowing the import to the classes the diagram uses. The chunk carries the
  whole library, and that is the first lever on both the 65 ms and the bundle.
  Re-measure it the same way.
