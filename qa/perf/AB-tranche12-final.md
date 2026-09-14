# Performance before/after, tranche twelve: eleven templates

The tranche's performance before/after, per route template, and the figures of
record. It supersedes `AB-tranche12.md` (observer TBT, blind to pre-paint
rendering) and `AB-tranche12-trace.md` (its baseline was missing 159
gitignored photographs).

- **A**: `7ff32a9`, the commit before the performance pass, built in a separate
  git worktree and served by `next start` on :3016. It runs on the current
  lockfile's Next **16.3.5**, not the 16.3.1 it shipped with, because
  reinstalling the vulnerable version for a baseline was not acceptable. The
  application code is `7ff32a9`'s own.
- **B**: main's final candidate (the pushed tranche plus this follow-up), built
  from the main checkout and served on :3005.
- **Same inputs.** A worktree holds only tracked files. The 159 gitignored
  photographs (`public/images/_chh/*` and eight in `_pool/`) were copied into
  A's worktree before it was built, so both sides serve the same photographs.
- **The gate** is `scripts/hotel-cwv.mjs`. TBT comes from a Chrome trace, as
  main-thread tasks over 50 ms counted after first contentful paint
  (Lighthouse's window). `load-blocking` counts every long task, including
  those before first paint. `observer` is the page's own longtask observer,
  kept for comparison only. Harness evaluation tasks are excluded.
- **Order** alternates per run (A,B then B,A) so machine drift cancels. Three
  runs each side per route. Servers were checked alive before the run.
- **Phone**: 4× CPU, Slow 4G, 390×844, DPR 1. **Desktop**: 2× CPU,
  1440×900. The session loads the page, settles 2.5 s, clicks a slider dot
  where one exists, scrolls the whole page, then hovers a card where one exists.
- Lab only: no field data exists for this site. INP is not measured on routes
  without a clickable slider or hoverable card, where "0 ms" is the observer's
  starting value.

## Medians of three runs

| route | view | TBT after FCP A (runs) | TBT after FCP B (runs) | Δ | load-blocking A → B | observer A → B | FCP A → B | LCP A → B | CLS A/B | worst interaction A/B |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | phone | 72 ms (81/61/72) | 76 ms (76/64/84) | +4 ms | 201 → 193 ms | 198 → 72 ms | 1096 → 1160 ms | 1136 → 1176 ms | 0/0 | 32/32 ms |
| `/` | desktop | 0 ms (24/0/0) | 0 ms (0/0/0) | +0 ms | 17 → 16 ms | 16 → 0 ms | 392 → 420 ms | 628 → 672 ms | 0/0 | 32/40 ms |
| `/en/villas/villa-thoi` | phone | 61 ms (58/61/67) | 59 ms (66/59/58) | -2 ms | 185 → 138 ms | 184 → 93 ms | 1124 → 1108 ms | 1136 → 1108 ms | 0/0 | 0/0 ms |
| `/en/villas/villa-thoi` | desktop | 0 ms (0/2/0) | 0 ms (0/0/1) | +0 ms | 2 → 0 ms | 1 → 0 ms | 400 → 424 ms | 596 → 584 ms | 0.0001/0 | 0/0 ms |
| `/en/the-estate` | phone | 73 ms (73/67/84) | 73 ms (73/71/74) | +0 ms | 214 → 174 ms | 196 → 79 ms | 1140 → 1152 ms | 1156 → 1156 ms | 0/0 | 0/0 ms |
| `/en/the-estate` | desktop | 0 ms (4/0/0) | 0 ms (0/0/0) | +0 ms | 1 → 0 ms | 0 → 0 ms | 404 → 424 ms | 632 → 632 ms | 0/0 | 0/0 ms |
| `/en/experiences` | phone | 55 ms (57/55/55) | 60 ms (57/64/60) | +5 ms | 113 → 95 ms | 112 → 60 ms | 988 → 1040 ms | 988 → 1040 ms | 0/0 | 0/0 ms |
| `/en/experiences` | desktop | 0 ms (10/0/0) | 0 ms (0/0/0) | +0 ms | 0 → 0 ms | 0 → 0 ms | 348 → 356 ms | 348 → 356 ms | 0/0 | 0/0 ms |
| `/en/weddings` | phone | 64 ms (53/64/70) | 55 ms (55/50/58) | -9 ms | 155 → 108 ms | 154 → 55 ms | 1080 → 1124 ms | 1080 → 1124 ms | 0/0 | 0/0 ms |
| `/en/weddings` | desktop | 0 ms (4/0/0) | 0 ms (0/0/0) | +0 ms | 0 → 0 ms | 0 → 0 ms | 372 → 400 ms | 392 → 416 ms | 0/0 | 0/0 ms |
| `/en/gallery` | phone | 59 ms (59/71/54) | 62 ms (51/62/67) | +3 ms | 111 → 93 ms | 108 → 62 ms | 992 → 1036 ms | 992 → 1036 ms | 0.2014/0.2205 | 0/0 ms |
| `/en/gallery` | desktop | 0 ms (2/0/0) | 0 ms (0/0/0) | +0 ms | 0 → 0 ms | 0 → 0 ms | 344 → 340 ms | 344 → 340 ms | 0.0827/0.0827 | 0/0 ms |
| `/en/location` | phone | 54 ms (55/49/54) | 53 ms (53/56/53) | -1 ms | 69 → 78 ms | 53 → 59 ms | 964 → 1028 ms | 1792 → 1888 ms | 0/0 | 0/0 ms |
| `/en/location` | desktop | 0 ms (0/0/0) | 0 ms (0/0/0) | +0 ms | 0 → 0 ms | 0 → 0 ms | 340 → 348 ms | 468 → 524 ms | 0/0 | 0/0 ms |
| `/en/contact` | phone | 57 ms (57/71/56) | 62 ms (57/72/62) | +5 ms | 85 → 79 ms | 57 → 62 ms | 960 → 1012 ms | 960 → 1012 ms | 0/0 | 0/0 ms |
| `/en/contact` | desktop | 0 ms (0/0/2) | 0 ms (0/0/0) | +0 ms | 0 → 0 ms | 0 → 0 ms | 312 → 368 ms | 312 → 368 ms | 0/0 | 0/0 ms |
| `/en/careers` | phone | 60 ms (60/66/54) | 56 ms (56/49/68) | -4 ms | 73 → 69 ms | 63 → 55 ms | 948 → 1000 ms | 2912 → 2984 ms | 0/0 | 0/0 ms |
| `/en/careers` | desktop | 0 ms (0/0/0) | 0 ms (0/0/0) | +0 ms | 0 → 0 ms | 0 → 0 ms | 336 → 352 ms | 336 → 352 ms | 0/0 | 0/0 ms |
| `/en/terms` | phone | 58 ms (51/58/58) | 61 ms (51/61/67) | +3 ms | 187 → 159 ms | 185 → 60 ms | 1072 → 1104 ms | 1072 → 1104 ms | 0/0 | 0/0 ms |
| `/en/terms` | desktop | 0 ms (0/1/0) | 0 ms (0/0/0) | +0 ms | 8 → 0 ms | 8 → 0 ms | 380 → 400 ms | 524 → 536 ms | 0/0 | 0/0 ms |
| `/en/experiences/boat-trip` | phone | 64 ms (60/66/64) | 62 ms (62/53/64) | -2 ms | 67 → 62 ms | 63 → 62 ms | 976 → 1044 ms | 976 → 1044 ms | 0/0 | 0/0 ms |
| `/en/experiences/boat-trip` | desktop | 0 ms (0/0/0) | 0 ms (0/0/0) | +0 ms | 0 → 0 ms | 0 → 0 ms | 336 → 348 ms | 336 → 348 ms | 0/0 | 0/0 ms |

## Every run, in the order measured

```
A route=/ run=1 desktop  LCP  1036ms  CLS 0       worst-interaction   32ms  TBT    24ms  load-blocking    37ms  observer    36ms  FCP   568ms  harness    0ms  [IMG.]
A route=/ run=1 phone    LCP  1164ms  CLS 0       worst-interaction   32ms  TBT    81ms  load-blocking   201ms  observer   198ms  FCP  1088ms  harness    0ms  [IMG.]
B route=/ run=1 desktop  LCP   680ms  CLS 0       worst-interaction   40ms  TBT     0ms  load-blocking    19ms  observer     0ms  FCP   420ms  harness    0ms  [IMG.]
B route=/ run=1 phone    LCP  1160ms  CLS 0       worst-interaction   32ms  TBT    76ms  load-blocking   193ms  observer    72ms  FCP  1144ms  harness    0ms  [IMG.]
B route=/ run=2 desktop  LCP   672ms  CLS 0       worst-interaction   40ms  TBT     0ms  load-blocking    15ms  observer     0ms  FCP   416ms  harness    0ms  [IMG.]
B route=/ run=2 phone    LCP  1176ms  CLS 0       worst-interaction   32ms  TBT    64ms  load-blocking   180ms  observer    62ms  FCP  1160ms  harness    0ms  [IMG.]
A route=/ run=2 desktop  LCP   620ms  CLS 0       worst-interaction   48ms  TBT     0ms  load-blocking    17ms  observer    16ms  FCP   388ms  harness    0ms  [IMG.]
A route=/ run=2 phone    LCP  1136ms  CLS 0       worst-interaction   24ms  TBT    61ms  load-blocking   182ms  observer   178ms  FCP  1096ms  harness    0ms  [IMG.]
A route=/ run=3 desktop  LCP   628ms  CLS 0       worst-interaction   32ms  TBT     0ms  load-blocking    17ms  observer    16ms  FCP   392ms  harness    0ms  [IMG.]
A route=/ run=3 phone    LCP  1132ms  CLS 0       worst-interaction   32ms  TBT    72ms  load-blocking   213ms  observer   209ms  FCP  1108ms  harness    0ms  [IMG.]
B route=/ run=3 desktop  LCP   672ms  CLS 0       worst-interaction   40ms  TBT     0ms  load-blocking    16ms  observer     0ms  FCP   424ms  harness    0ms  [IMG.]
B route=/ run=3 phone    LCP  1176ms  CLS 0       worst-interaction   40ms  TBT    84ms  load-blocking   201ms  observer    82ms  FCP  1160ms  harness    0ms  [IMG.]
A route=/en/villas/villa-thoi run=1 desktop  LCP   612ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   332ms  harness    0ms  [IMG.]
A route=/en/villas/villa-thoi run=1 phone    LCP  1136ms  CLS 0       worst-interaction    0ms  TBT    58ms  load-blocking   181ms  observer   177ms  FCP  1124ms  harness    0ms  [IMG.]
B route=/en/villas/villa-thoi run=1 desktop  LCP   584ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   424ms  harness    0ms  [IMG.]
B route=/en/villas/villa-thoi run=1 phone    LCP  1092ms  CLS 0       worst-interaction    0ms  TBT    66ms  load-blocking   143ms  observer   100ms  FCP  1092ms  harness    0ms  [IMG.]
B route=/en/villas/villa-thoi run=2 desktop  LCP   572ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   412ms  harness    0ms  [IMG.]
B route=/en/villas/villa-thoi run=2 phone    LCP  1120ms  CLS 0       worst-interaction    0ms  TBT    59ms  load-blocking   138ms  observer    93ms  FCP  1120ms  harness    0ms  [IMG.]
A route=/en/villas/villa-thoi run=2 desktop  LCP   588ms  CLS 0       worst-interaction    0ms  TBT     2ms  load-blocking     2ms  observer     1ms  FCP   400ms  harness    0ms  [IMG.]
A route=/en/villas/villa-thoi run=2 phone    LCP  1124ms  CLS 0       worst-interaction    0ms  TBT    61ms  load-blocking   185ms  observer   184ms  FCP  1104ms  harness    0ms  [IMG.]
A route=/en/villas/villa-thoi run=3 desktop  LCP   596ms  CLS 0.0001  worst-interaction    0ms  TBT     0ms  load-blocking    31ms  observer    31ms  FCP   440ms  harness    0ms  [IMG.]
A route=/en/villas/villa-thoi run=3 phone    LCP  1156ms  CLS 0       worst-interaction    0ms  TBT    67ms  load-blocking   196ms  observer   188ms  FCP  1140ms  harness    0ms  [IMG.]
B route=/en/villas/villa-thoi run=3 desktop  LCP   588ms  CLS 0       worst-interaction    0ms  TBT     1ms  load-blocking     1ms  observer     0ms  FCP   428ms  harness    0ms  [IMG.]
B route=/en/villas/villa-thoi run=3 phone    LCP  1108ms  CLS 0       worst-interaction    0ms  TBT    58ms  load-blocking   134ms  observer    85ms  FCP  1108ms  harness    0ms  [IMG.]
A route=/en/the-estate run=1 desktop  LCP   636ms  CLS 0       worst-interaction    0ms  TBT     4ms  load-blocking     6ms  observer     4ms  FCP   324ms  harness    0ms  [IMG.]
A route=/en/the-estate run=1 phone    LCP  1156ms  CLS 0       worst-interaction    0ms  TBT    73ms  load-blocking   214ms  observer   196ms  FCP  1140ms  harness    0ms  [IMG.]
B route=/en/the-estate run=1 desktop  LCP   632ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   424ms  harness    0ms  [IMG.]
B route=/en/the-estate run=1 phone    LCP  1168ms  CLS 0       worst-interaction    0ms  TBT    73ms  load-blocking   181ms  observer    84ms  FCP  1152ms  harness    0ms  [IMG.]
B route=/en/the-estate run=2 desktop  LCP   636ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   428ms  harness    0ms  [IMG.]
B route=/en/the-estate run=2 phone    LCP  1136ms  CLS 0       worst-interaction    0ms  TBT    71ms  load-blocking   174ms  observer    79ms  FCP  1136ms  harness    0ms  [IMG.]
A route=/en/the-estate run=2 desktop  LCP   608ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   404ms  harness    0ms  [IMG.]
A route=/en/the-estate run=2 phone    LCP  1148ms  CLS 0       worst-interaction    0ms  TBT    67ms  load-blocking   208ms  observer   192ms  FCP  1132ms  harness    0ms  [IMG.]
A route=/en/the-estate run=3 desktop  LCP   632ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     1ms  observer     0ms  FCP   412ms  harness    0ms  [IMG.]
A route=/en/the-estate run=3 phone    LCP  1160ms  CLS 0       worst-interaction    0ms  TBT    84ms  load-blocking   228ms  observer   207ms  FCP  1144ms  harness    0ms  [IMG.]
B route=/en/the-estate run=3 desktop  LCP   612ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   400ms  harness    0ms  [IMG.]
B route=/en/the-estate run=3 phone    LCP  1156ms  CLS 0       worst-interaction    0ms  TBT    74ms  load-blocking   171ms  observer    70ms  FCP  1156ms  harness    0ms  [IMG.]
A route=/en/experiences run=1 desktop  LCP   348ms  CLS 0       worst-interaction    0ms  TBT    10ms  load-blocking    10ms  observer    10ms  FCP   348ms  harness    0ms  [H1.display c2 d-pagehead-title]
A route=/en/experiences run=1 phone    LCP   980ms  CLS 0       worst-interaction    0ms  TBT    57ms  load-blocking   113ms  observer   112ms  FCP   980ms  harness    0ms  [P.d-villa-lede]
B route=/en/experiences run=1 desktop  LCP   344ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   344ms  harness    0ms  [H1.display c2 d-pagehead-title]
B route=/en/experiences run=1 phone    LCP  1064ms  CLS 0       worst-interaction    0ms  TBT    57ms  load-blocking    90ms  observer    57ms  FCP  1064ms  harness    0ms  [P.d-villa-lede]
B route=/en/experiences run=2 desktop  LCP   360ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   360ms  harness    0ms  [H1.display c2 d-pagehead-title]
B route=/en/experiences run=2 phone    LCP  1016ms  CLS 0       worst-interaction    0ms  TBT    64ms  load-blocking    95ms  observer    64ms  FCP  1016ms  harness    0ms  [P.d-villa-lede]
A route=/en/experiences run=2 desktop  LCP   324ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   324ms  harness    0ms  [H1.display c2 d-pagehead-title]
A route=/en/experiences run=2 phone    LCP  1020ms  CLS 0       worst-interaction    0ms  TBT    55ms  load-blocking   123ms  observer   121ms  FCP  1020ms  harness    0ms  [P.d-villa-lede]
A route=/en/experiences run=3 desktop  LCP   352ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   352ms  harness    0ms  [H1.display c2 d-pagehead-title]
A route=/en/experiences run=3 phone    LCP   988ms  CLS 0       worst-interaction    0ms  TBT    55ms  load-blocking   111ms  observer   109ms  FCP   988ms  harness    0ms  [P.d-villa-lede]
B route=/en/experiences run=3 desktop  LCP   356ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   356ms  harness    0ms  [H1.display c2 d-pagehead-title]
B route=/en/experiences run=3 phone    LCP  1040ms  CLS 0       worst-interaction    0ms  TBT    60ms  load-blocking    98ms  observer    60ms  FCP  1040ms  harness    0ms  [P.d-villa-lede]
A route=/en/weddings run=1 desktop  LCP   444ms  CLS 0       worst-interaction    0ms  TBT     4ms  load-blocking     4ms  observer     4ms  FCP   308ms  harness    0ms  [IMG.]
A route=/en/weddings run=1 phone    LCP  1064ms  CLS 0       worst-interaction    0ms  TBT    53ms  load-blocking   137ms  observer   136ms  FCP  1064ms  harness    0ms  [IMG.]
B route=/en/weddings run=1 desktop  LCP   416ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   400ms  harness    0ms  [IMG.]
B route=/en/weddings run=1 phone    LCP  1124ms  CLS 0       worst-interaction    0ms  TBT    55ms  load-blocking   105ms  observer    55ms  FCP  1124ms  harness    0ms  [IMG.]
B route=/en/weddings run=2 desktop  LCP   416ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   404ms  harness    0ms  [IMG.]
B route=/en/weddings run=2 phone    LCP  1124ms  CLS 0       worst-interaction    0ms  TBT    50ms  load-blocking   114ms  observer    55ms  FCP  1124ms  harness    0ms  [IMG.]
A route=/en/weddings run=2 desktop  LCP   392ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   380ms  harness    0ms  [IMG.]
A route=/en/weddings run=2 phone    LCP  1104ms  CLS 0       worst-interaction    0ms  TBT    64ms  load-blocking   155ms  observer   154ms  FCP  1104ms  harness    0ms  [IMG.]
A route=/en/weddings run=3 desktop  LCP   388ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   372ms  harness    0ms  [IMG.]
A route=/en/weddings run=3 phone    LCP  1080ms  CLS 0       worst-interaction    0ms  TBT    70ms  load-blocking   155ms  observer   154ms  FCP  1080ms  harness    0ms  [IMG.]
B route=/en/weddings run=3 desktop  LCP   408ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   392ms  harness    0ms  [IMG.]
B route=/en/weddings run=3 phone    LCP  1120ms  CLS 0       worst-interaction    0ms  TBT    58ms  load-blocking   108ms  observer    57ms  FCP  1120ms  harness    0ms  [IMG.]
A route=/en/gallery run=1 desktop  LCP   332ms  CLS 0.0827  worst-interaction    0ms  TBT     2ms  load-blocking     2ms  observer     2ms  FCP   332ms  harness    0ms  [P.d-villa-lede]
A route=/en/gallery run=1 phone    LCP   992ms  CLS 0.2014  worst-interaction    0ms  TBT    59ms  load-blocking   111ms  observer   108ms  FCP   992ms  harness    0ms  [P.d-villa-lede]
B route=/en/gallery run=1 desktop  LCP   340ms  CLS 0.0827  worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   340ms  harness    0ms  [P.d-villa-lede]
B route=/en/gallery run=1 phone    LCP  1028ms  CLS 0.2205  worst-interaction    0ms  TBT    51ms  load-blocking    84ms  observer    50ms  FCP  1028ms  harness    0ms  [P.d-villa-lede]
B route=/en/gallery run=2 desktop  LCP   336ms  CLS 0.0827  worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   336ms  harness    0ms  [P.d-villa-lede]
B route=/en/gallery run=2 phone    LCP  1036ms  CLS 0.2014  worst-interaction    0ms  TBT    62ms  load-blocking    93ms  observer    62ms  FCP  1036ms  harness    0ms  [P.d-villa-lede]
A route=/en/gallery run=2 desktop  LCP   344ms  CLS 0.0827  worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   344ms  harness    0ms  [P.d-villa-lede]
A route=/en/gallery run=2 phone    LCP   988ms  CLS 0.2014  worst-interaction    0ms  TBT    71ms  load-blocking   126ms  observer   123ms  FCP   988ms  harness    0ms  [P.d-villa-lede]
A route=/en/gallery run=3 desktop  LCP   368ms  CLS 0.0827  worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   368ms  harness    0ms  [P.d-villa-lede]
A route=/en/gallery run=3 phone    LCP   992ms  CLS 0.2014  worst-interaction    0ms  TBT    54ms  load-blocking   110ms  observer   108ms  FCP   992ms  harness    0ms  [P.d-villa-lede]
B route=/en/gallery run=3 desktop  LCP   352ms  CLS 0.0827  worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   352ms  harness    0ms  [P.d-villa-lede]
B route=/en/gallery run=3 phone    LCP  1036ms  CLS 0.2205  worst-interaction    0ms  TBT    67ms  load-blocking    96ms  observer    66ms  FCP  1036ms  harness    0ms  [P.d-villa-lede]
A route=/en/location run=1 desktop  LCP   468ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   340ms  harness    0ms  [IMG.]
A route=/en/location run=1 phone    LCP  1800ms  CLS 0       worst-interaction    0ms  TBT    55ms  load-blocking    69ms  observer    54ms  FCP   964ms  harness    0ms  [IMG.]
B route=/en/location run=1 desktop  LCP   524ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   348ms  harness    0ms  [IMG.]
B route=/en/location run=1 phone    LCP  1896ms  CLS 0       worst-interaction    0ms  TBT    53ms  load-blocking    78ms  observer    59ms  FCP  1028ms  harness    0ms  [IMG.]
B route=/en/location run=2 desktop  LCP   524ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   332ms  harness    0ms  [IMG.]
B route=/en/location run=2 phone    LCP  1888ms  CLS 0       worst-interaction    0ms  TBT    56ms  load-blocking    78ms  observer    62ms  FCP  1028ms  harness    0ms  [IMG.]
A route=/en/location run=2 desktop  LCP   464ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   324ms  harness    0ms  [IMG.]
A route=/en/location run=2 phone    LCP  1792ms  CLS 0       worst-interaction    0ms  TBT    49ms  load-blocking    59ms  observer    48ms  FCP   960ms  harness    0ms  [IMG.]
A route=/en/location run=3 desktop  LCP   476ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   348ms  harness    0ms  [IMG.]
A route=/en/location run=3 phone    LCP  1788ms  CLS 0       worst-interaction    0ms  TBT    54ms  load-blocking    83ms  observer    53ms  FCP   992ms  harness    0ms  [IMG.]
B route=/en/location run=3 desktop  LCP   524ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   356ms  harness    0ms  [IMG.]
B route=/en/location run=3 phone    LCP  1876ms  CLS 0       worst-interaction    0ms  TBT    53ms  load-blocking    81ms  observer    54ms  FCP  1028ms  harness    0ms  [IMG.]
A route=/en/contact run=1 desktop  LCP   320ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   320ms  harness    0ms  [P.d-villa-lede]
A route=/en/contact run=1 phone    LCP   960ms  CLS 0       worst-interaction    0ms  TBT    57ms  load-blocking    74ms  observer    57ms  FCP   960ms  harness    0ms  [P.d-villa-lede]
B route=/en/contact run=1 desktop  LCP   328ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   328ms  harness    0ms  [P.d-villa-lede]
B route=/en/contact run=1 phone    LCP  1016ms  CLS 0       worst-interaction    0ms  TBT    57ms  load-blocking    76ms  observer    57ms  FCP  1016ms  harness    0ms  [P.d-villa-lede]
B route=/en/contact run=2 desktop  LCP   368ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   368ms  harness    0ms  [P.d-villa-lede]
B route=/en/contact run=2 phone    LCP   980ms  CLS 0       worst-interaction    0ms  TBT    72ms  load-blocking    88ms  observer    72ms  FCP   980ms  harness    0ms  [P.d-villa-lede]
A route=/en/contact run=2 desktop  LCP   296ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   296ms  harness    0ms  [P.d-villa-lede]
A route=/en/contact run=2 phone    LCP   964ms  CLS 0       worst-interaction    0ms  TBT    71ms  load-blocking    95ms  observer    78ms  FCP   964ms  harness    0ms  [P.d-villa-lede]
A route=/en/contact run=3 desktop  LCP   312ms  CLS 0       worst-interaction    0ms  TBT     2ms  load-blocking     2ms  observer     1ms  FCP   312ms  harness    0ms  [P.d-villa-lede]
A route=/en/contact run=3 phone    LCP   948ms  CLS 0       worst-interaction    0ms  TBT    56ms  load-blocking    85ms  observer    56ms  FCP   948ms  harness    0ms  [P.d-villa-lede]
B route=/en/contact run=3 desktop  LCP   372ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   372ms  harness    0ms  [P.d-villa-lede]
B route=/en/contact run=3 phone    LCP  1012ms  CLS 0       worst-interaction    0ms  TBT    62ms  load-blocking    79ms  observer    62ms  FCP  1012ms  harness    0ms  [P.d-villa-lede]
A route=/en/careers run=1 desktop  LCP   272ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   272ms  harness    0ms  [H1.display c2 d-pagehead-title]
A route=/en/careers run=1 phone    LCP  2112ms  CLS 0       worst-interaction    0ms  TBT    60ms  load-blocking    77ms  observer    63ms  FCP   956ms  harness    0ms  [P.prose-measure d-exp-text]
B route=/en/careers run=1 desktop  LCP   352ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   352ms  harness    0ms  [H1.display c2 d-pagehead-title]
B route=/en/careers run=1 phone    LCP  2984ms  CLS 0       worst-interaction    0ms  TBT    56ms  load-blocking    69ms  observer    55ms  FCP  1000ms  harness    0ms  [P.prose-measure d-exp-text]
B route=/en/careers run=2 desktop  LCP   356ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   356ms  harness    0ms  [H1.display c2 d-pagehead-title]
B route=/en/careers run=2 phone    LCP  2984ms  CLS 0       worst-interaction    0ms  TBT    49ms  load-blocking    56ms  observer    49ms  FCP  1000ms  harness    0ms  [P.prose-measure d-exp-text]
A route=/en/careers run=2 desktop  LCP   336ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   336ms  harness    0ms  [H1.display c2 d-pagehead-title]
A route=/en/careers run=2 phone    LCP  2936ms  CLS 0       worst-interaction    0ms  TBT    66ms  load-blocking    73ms  observer    65ms  FCP   948ms  harness    0ms  [P.prose-measure d-exp-text]
A route=/en/careers run=3 desktop  LCP   336ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   336ms  harness    0ms  [H1.display c2 d-pagehead-title]
A route=/en/careers run=3 phone    LCP  2912ms  CLS 0       worst-interaction    0ms  TBT    54ms  load-blocking    58ms  observer    53ms  FCP   924ms  harness    0ms  [P.prose-measure d-exp-text]
B route=/en/careers run=3 desktop  LCP   352ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   352ms  harness    0ms  [H1.display c2 d-pagehead-title]
B route=/en/careers run=3 phone    LCP  3032ms  CLS 0       worst-interaction    0ms  TBT    68ms  load-blocking    73ms  observer    68ms  FCP  1016ms  harness    0ms  [P.prose-measure d-exp-text]
A route=/en/terms run=1 desktop  LCP   504ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     8ms  observer     8ms  FCP   368ms  harness    0ms  [P.small d-terms-p]
A route=/en/terms run=1 phone    LCP  1064ms  CLS 0       worst-interaction    0ms  TBT    51ms  load-blocking   169ms  observer   168ms  FCP  1064ms  harness    0ms  [P.small]
B route=/en/terms run=1 desktop  LCP   536ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   392ms  harness    0ms  [P.small d-terms-p]
B route=/en/terms run=1 phone    LCP  1084ms  CLS 0       worst-interaction    0ms  TBT    51ms  load-blocking   138ms  observer    50ms  FCP  1084ms  harness    0ms  [P.small]
B route=/en/terms run=2 desktop  LCP   536ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     3ms  observer     2ms  FCP   400ms  harness    0ms  [P.small d-terms-p]
B route=/en/terms run=2 phone    LCP  1108ms  CLS 0       worst-interaction    0ms  TBT    61ms  load-blocking   159ms  observer    60ms  FCP  1108ms  harness    0ms  [P.small]
A route=/en/terms run=2 desktop  LCP   524ms  CLS 0       worst-interaction    0ms  TBT     1ms  load-blocking     7ms  observer     6ms  FCP   380ms  harness    0ms  [P.small d-terms-p]
A route=/en/terms run=2 phone    LCP  1076ms  CLS 0       worst-interaction    0ms  TBT    58ms  load-blocking   199ms  observer   198ms  FCP  1076ms  harness    0ms  [P.small]
A route=/en/terms run=3 desktop  LCP   536ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking    10ms  observer    10ms  FCP   412ms  harness    0ms  [P.small d-terms-p]
A route=/en/terms run=3 phone    LCP  1072ms  CLS 0       worst-interaction    0ms  TBT    58ms  load-blocking   187ms  observer   185ms  FCP  1072ms  harness    7ms  [P.small]
B route=/en/terms run=3 desktop  LCP   548ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   400ms  harness    0ms  [P.small d-terms-p]
B route=/en/terms run=3 phone    LCP  1104ms  CLS 0       worst-interaction    0ms  TBT    67ms  load-blocking   177ms  observer    67ms  FCP  1104ms  harness    0ms  [P.small]
A route=/en/experiences/boat-trip run=1 desktop  LCP   300ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   300ms  harness    0ms  [A.nav-mark]
A route=/en/experiences/boat-trip run=1 phone    LCP   976ms  CLS 0       worst-interaction    0ms  TBT    60ms  load-blocking    63ms  observer    59ms  FCP   976ms  harness    0ms  [A.nav-mark]
B route=/en/experiences/boat-trip run=1 desktop  LCP   336ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   336ms  harness    0ms  [A.nav-mark]
B route=/en/experiences/boat-trip run=1 phone    LCP  1044ms  CLS 0       worst-interaction    0ms  TBT    62ms  load-blocking    62ms  observer    62ms  FCP  1044ms  harness    0ms  [A.nav-mark]
B route=/en/experiences/boat-trip run=2 desktop  LCP   348ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   348ms  harness    0ms  [A.nav-mark]
B route=/en/experiences/boat-trip run=2 phone    LCP  1044ms  CLS 0       worst-interaction    0ms  TBT    53ms  load-blocking    54ms  observer    52ms  FCP  1044ms  harness    0ms  [A.nav-mark]
A route=/en/experiences/boat-trip run=2 desktop  LCP   344ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   344ms  harness    0ms  [A.nav-mark]
A route=/en/experiences/boat-trip run=2 phone    LCP   964ms  CLS 0       worst-interaction    0ms  TBT    66ms  load-blocking    67ms  observer    65ms  FCP   964ms  harness    0ms  [A.nav-mark]
A route=/en/experiences/boat-trip run=3 desktop  LCP   336ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   336ms  harness    0ms  [A.nav-mark]
A route=/en/experiences/boat-trip run=3 phone    LCP   996ms  CLS 0       worst-interaction    0ms  TBT    64ms  load-blocking    69ms  observer    63ms  FCP   996ms  harness    0ms  [A.nav-mark]
B route=/en/experiences/boat-trip run=3 desktop  LCP   348ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   348ms  harness    0ms  [A.nav-mark]
B route=/en/experiences/boat-trip run=3 phone    LCP  1048ms  CLS 0       worst-interaction    0ms  TBT    64ms  load-blocking    69ms  observer    64ms  FCP  1048ms  harness    0ms  [A.nav-mark]
```
