# The 3D estate map against main: /en/the-estate

The 3D estate map's cost against main, for the owner's yes or no, and the
figures of record. **The branch is not on main.** It supersedes
`AB-tranche12-estate3d.md`, where the branch's worktree was missing 159
gitignored photographs.

- **A**: main's final candidate, from the main checkout on :3005.
- **B**: `feat/estate-3d` with its review fixes (the pool-line label, the
  shortened phone note, the reduced-motion 2D checks), built in its worktree
  and served on :3025. The 159 gitignored photographs were copied in before the
  build, and its full QA suite passed on that build (535 passed, WebKit 14/14).
- Route `/en/the-estate`. Order alternates per run (A,B then B,A), three runs
  each side.
- **The gate** is `scripts/hotel-cwv.mjs`. TBT comes from a Chrome trace,
  counted after first contentful paint. Load-blocking counts every long task.
  The observer figure is kept for comparison. The phone budget is 200 ms.
- The session loads, settles, then scrolls the whole page, so B's runs include
  fetching three.js and drawing the diagram. This page has no slider dot or
  card to click or hover, and a wheel scroll is not an Event Timing entry.
  **INP is therefore not measured here**; the "0 ms" worst interaction is the
  observer's starting value.
- Phone: 4× CPU, Slow 4G, 390×844, WebGL available, motion allowed.
  Desktop: 2× CPU, 1440×900. Lab only.

## Medians of three runs

| route | view | TBT after FCP A (runs) | TBT after FCP B (runs) | Δ | load-blocking A → B | observer A → B | FCP A → B | LCP A → B | CLS A/B | worst interaction A/B |
|---|---|---|---|---|---|---|---|---|---|---|
| `/en/the-estate` | phone | 85 ms (85/97/78) | 139 ms (139/137/149) | +54 ms | 204 → 273 ms | 94 → 145 ms | 1160 → 1204 ms | 1164 → 1204 ms | 0/0 | 0/0 ms |
| `/en/the-estate` | desktop | 0 ms (0/0/0) | 27 ms (20/31/27) | +27 ms | 0 → 27 ms | 0 → 25 ms | 436 → 428 ms | 648 → 640 ms | 0/0 | 0/0 ms |

## Every run, in the order measured

```
A route=/en/the-estate run=1 desktop  LCP   664ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   436ms  harness    0ms  [IMG.]
A route=/en/the-estate run=1 phone    LCP  1152ms  CLS 0       worst-interaction    0ms  TBT    85ms  load-blocking   204ms  observer   102ms  FCP  1136ms  harness    0ms  [IMG.]
B route=/en/the-estate run=1 desktop  LCP   632ms  CLS 0       worst-interaction    0ms  TBT    20ms  load-blocking    20ms  observer    18ms  FCP   428ms  harness    0ms  [IMG.]
B route=/en/the-estate run=1 phone    LCP  1204ms  CLS 0       worst-interaction    0ms  TBT   139ms  load-blocking   279ms  observer   145ms  FCP  1204ms  harness    0ms  [IMG.]
B route=/en/the-estate run=2 desktop  LCP   668ms  CLS 0       worst-interaction    0ms  TBT    31ms  load-blocking    31ms  observer    30ms  FCP   464ms  harness    0ms  [IMG.]
B route=/en/the-estate run=2 phone    LCP  1160ms  CLS 0       worst-interaction    0ms  TBT   137ms  load-blocking   257ms  observer   135ms  FCP  1160ms  harness    0ms  [IMG.]
A route=/en/the-estate run=2 desktop  LCP   624ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   412ms  harness    0ms  [IMG.]
A route=/en/the-estate run=2 phone    LCP  1176ms  CLS 0       worst-interaction    0ms  TBT    97ms  load-blocking   220ms  observer    94ms  FCP  1160ms  harness    0ms  [IMG.]
A route=/en/the-estate run=3 desktop  LCP   648ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   440ms  harness    0ms  [IMG.]
A route=/en/the-estate run=3 phone    LCP  1164ms  CLS 0       worst-interaction    0ms  TBT    78ms  load-blocking   203ms  observer    91ms  FCP  1164ms  harness    0ms  [IMG.]
B route=/en/the-estate run=3 desktop  LCP   640ms  CLS 0       worst-interaction    0ms  TBT    27ms  load-blocking    27ms  observer    25ms  FCP   428ms  harness    0ms  [IMG.]
B route=/en/the-estate run=3 phone    LCP  1204ms  CLS 0       worst-interaction    0ms  TBT   149ms  load-blocking   273ms  observer   155ms  FCP  1204ms  harness    0ms  [IMG.]
```
