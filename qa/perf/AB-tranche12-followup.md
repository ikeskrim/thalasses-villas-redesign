# Performance, the follow-up batch on its own: four routes

What the follow-up batch changed on its own: the audit-driven fixes made after
the tranche was first pushed. Those are the contextual cursor imported only
where it runs, the nonce proxy on `/en/contact`, the TBT budget in the gate and
the ingest pipeline's fixes. Of those, only the cursor and the proxy reach a
page.

- **A**: `56cb859`, the pushed tranche before this follow-up, built in a
  separate git worktree and served by `next start` on :3015, with the 159
  gitignored photographs copied in before the build.
- **B**: main's final candidate, from the main checkout on :3005.
- Four sampled routes, the gate and session exactly as in
  `AB-tranche12-final.md`: trace TBT after first contentful paint,
  load-blocking and observer beside it, three interleaved runs each side, phone
  4× CPU / Slow 4G / 390×844, desktop 2× CPU / 1440×900.
- Lab only.

## Medians of three runs

| route | view | TBT after FCP A (runs) | TBT after FCP B (runs) | Δ | load-blocking A → B | observer A → B | FCP A → B | LCP A → B | CLS A/B | worst interaction A/B |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | phone | 67 ms (63/67/70) | 75 ms (78/75/66) | +8 ms | 174 → 190 ms | 66 → 71 ms | 1144 → 1164 ms | 1160 → 1180 ms | 0/0 | 32/32 ms |
| `/` | desktop | 0 ms (11/0/0) | 0 ms (0/0/0) | +0 ms | 16 → 16 ms | 0 → 0 ms | 420 → 420 ms | 724 → 684 ms | 0/0 | 32/32 ms |
| `/en/villas/villa-thoi` | phone | 64 ms (59/66/64) | 66 ms (69/66/55) | +2 ms | 142 → 151 ms | 93 → 100 ms | 1108 → 1100 ms | 1108 → 1100 ms | 0/0 | 0/0 ms |
| `/en/villas/villa-thoi` | desktop | 0 ms (2/0/0) | 0 ms (0/0/0) | +0 ms | 0 → 0 ms | 0 → 0 ms | 420 → 428 ms | 628 → 628 ms | 0/0 | 0/0 ms |
| `/en/the-estate` | phone | 77 ms (77/84/73) | 72 ms (72/79/72) | -5 ms | 180 → 183 ms | 78 → 87 ms | 1140 → 1152 ms | 1156 → 1152 ms | 0/0 | 0/0 ms |
| `/en/the-estate` | desktop | 0 ms (0/0/0) | 0 ms (0/1/0) | +0 ms | 0 → 1 ms | 0 → 0 ms | 412 → 428 ms | 640 → 632 ms | 0/0 | 0/0 ms |
| `/en/experiences` | phone | 64 ms (64/69/54) | 62 ms (58/72/62) | -2 ms | 90 → 103 ms | 64 → 61 ms | 1032 → 1044 ms | 1032 → 1044 ms | 0/0 | 0/0 ms |
| `/en/experiences` | desktop | 0 ms (3/0/0) | 0 ms (0/0/5) | +0 ms | 0 → 0 ms | 0 → 0 ms | 348 → 356 ms | 348 → 356 ms | 0/0 | 0/0 ms |

## Every run, in the order measured

```
A route=/ run=1 desktop  LCP   924ms  CLS 0       worst-interaction   32ms  TBT    11ms  load-blocking    29ms  observer    10ms  FCP   372ms  harness    0ms  [IMG.]
A route=/ run=1 phone    LCP  1160ms  CLS 0       worst-interaction   32ms  TBT    63ms  load-blocking   166ms  observer    61ms  FCP  1144ms  harness    0ms  [IMG.]
B route=/ run=1 desktop  LCP   688ms  CLS 0       worst-interaction   32ms  TBT     0ms  load-blocking    16ms  observer     0ms  FCP   420ms  harness    0ms  [IMG.]
B route=/ run=1 phone    LCP  1160ms  CLS 0       worst-interaction   40ms  TBT    78ms  load-blocking   190ms  observer    71ms  FCP  1140ms  harness    0ms  [IMG.]
B route=/ run=2 desktop  LCP   676ms  CLS 0       worst-interaction   32ms  TBT     0ms  load-blocking    17ms  observer     0ms  FCP   424ms  harness    0ms  [IMG.]
B route=/ run=2 phone    LCP  1184ms  CLS 0       worst-interaction   32ms  TBT    75ms  load-blocking   200ms  observer    74ms  FCP  1168ms  harness    0ms  [IMG.]
A route=/ run=2 desktop  LCP   684ms  CLS 0       worst-interaction   32ms  TBT     0ms  load-blocking    16ms  observer     0ms  FCP   420ms  harness    0ms  [IMG.]
A route=/ run=2 phone    LCP  1160ms  CLS 0       worst-interaction   32ms  TBT    67ms  load-blocking   174ms  observer    66ms  FCP  1144ms  harness    0ms  [IMG.]
A route=/ run=3 desktop  LCP   724ms  CLS 0       worst-interaction   40ms  TBT     0ms  load-blocking    14ms  observer     0ms  FCP   452ms  harness    0ms  [IMG.]
A route=/ run=3 phone    LCP  1156ms  CLS 0       worst-interaction   32ms  TBT    70ms  load-blocking   179ms  observer    69ms  FCP  1136ms  harness    0ms  [IMG.]
B route=/ run=3 desktop  LCP   684ms  CLS 0       worst-interaction   32ms  TBT     0ms  load-blocking    13ms  observer     0ms  FCP   412ms  harness    0ms  [IMG.]
B route=/ run=3 phone    LCP  1180ms  CLS 0       worst-interaction   32ms  TBT    66ms  load-blocking   186ms  observer    64ms  FCP  1164ms  harness    0ms  [IMG.]
A route=/en/villas/villa-thoi run=1 desktop  LCP   628ms  CLS 0       worst-interaction    0ms  TBT     2ms  load-blocking    10ms  observer     9ms  FCP   360ms  harness    0ms  [IMG.]
A route=/en/villas/villa-thoi run=1 phone    LCP  1124ms  CLS 0       worst-interaction    0ms  TBT    59ms  load-blocking   142ms  observer    93ms  FCP  1124ms  harness    0ms  [IMG.]
B route=/en/villas/villa-thoi run=1 desktop  LCP   640ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   436ms  harness    0ms  [IMG.]
B route=/en/villas/villa-thoi run=1 phone    LCP  1128ms  CLS 0       worst-interaction    0ms  TBT    69ms  load-blocking   160ms  observer   109ms  FCP  1128ms  harness    0ms  [IMG.]
B route=/en/villas/villa-thoi run=2 desktop  LCP   628ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   428ms  harness    0ms  [IMG.]
B route=/en/villas/villa-thoi run=2 phone    LCP  1096ms  CLS 0       worst-interaction    0ms  TBT    66ms  load-blocking   151ms  observer   100ms  FCP  1096ms  harness    0ms  [IMG.]
A route=/en/villas/villa-thoi run=2 desktop  LCP   644ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   432ms  harness    0ms  [IMG.]
A route=/en/villas/villa-thoi run=2 phone    LCP  1088ms  CLS 0       worst-interaction    0ms  TBT    66ms  load-blocking   138ms  observer    91ms  FCP  1088ms  harness    0ms  [IMG.]
A route=/en/villas/villa-thoi run=3 desktop  LCP   584ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   420ms  harness    0ms  [IMG.]
A route=/en/villas/villa-thoi run=3 phone    LCP  1108ms  CLS 0       worst-interaction    0ms  TBT    64ms  load-blocking   149ms  observer   107ms  FCP  1108ms  harness    0ms  [IMG.]
B route=/en/villas/villa-thoi run=3 desktop  LCP   572ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   428ms  harness    0ms  [IMG.]
B route=/en/villas/villa-thoi run=3 phone    LCP  1100ms  CLS 0       worst-interaction    0ms  TBT    55ms  load-blocking   143ms  observer    93ms  FCP  1100ms  harness    0ms  [IMG.]
A route=/en/the-estate run=1 desktop  LCP   660ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   364ms  harness    0ms  [IMG.]
A route=/en/the-estate run=1 phone    LCP  1156ms  CLS 0       worst-interaction    0ms  TBT    77ms  load-blocking   175ms  observer    76ms  FCP  1140ms  harness    0ms  [IMG.]
B route=/en/the-estate run=1 desktop  LCP   636ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   428ms  harness    0ms  [IMG.]
B route=/en/the-estate run=1 phone    LCP  1172ms  CLS 0       worst-interaction    0ms  TBT    72ms  load-blocking   179ms  observer    76ms  FCP  1156ms  harness    0ms  [IMG.]
B route=/en/the-estate run=2 desktop  LCP   624ms  CLS 0       worst-interaction    0ms  TBT     1ms  load-blocking     1ms  observer     1ms  FCP   416ms  harness    0ms  [IMG.]
B route=/en/the-estate run=2 phone    LCP  1144ms  CLS 0       worst-interaction    0ms  TBT    79ms  load-blocking   183ms  observer    92ms  FCP  1144ms  harness    0ms  [IMG.]
A route=/en/the-estate run=2 desktop  LCP   640ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   440ms  harness    0ms  [IMG.]
A route=/en/the-estate run=2 phone    LCP  1156ms  CLS 0       worst-interaction    0ms  TBT    84ms  load-blocking   194ms  observer    92ms  FCP  1156ms  harness    0ms  [IMG.]
A route=/en/the-estate run=3 desktop  LCP   624ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   412ms  harness    0ms  [IMG.]
A route=/en/the-estate run=3 phone    LCP  1156ms  CLS 0       worst-interaction    0ms  TBT    73ms  load-blocking   180ms  observer    78ms  FCP  1140ms  harness    0ms  [IMG.]
B route=/en/the-estate run=3 desktop  LCP   632ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     1ms  observer     0ms  FCP   428ms  harness    0ms  [IMG.]
B route=/en/the-estate run=3 phone    LCP  1152ms  CLS 0       worst-interaction    0ms  TBT    72ms  load-blocking   200ms  observer    87ms  FCP  1152ms  harness    0ms  [IMG.]
A route=/en/experiences run=1 desktop  LCP   348ms  CLS 0       worst-interaction    0ms  TBT     3ms  load-blocking     3ms  observer     2ms  FCP   348ms  harness    0ms  [H1.display c2 d-pagehead-title]
A route=/en/experiences run=1 phone    LCP  1016ms  CLS 0       worst-interaction    0ms  TBT    64ms  load-blocking    90ms  observer    64ms  FCP  1016ms  harness    0ms  [P.d-villa-lede]
B route=/en/experiences run=1 desktop  LCP   372ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   372ms  harness    0ms  [H1.display c2 d-pagehead-title]
B route=/en/experiences run=1 phone    LCP  1048ms  CLS 0       worst-interaction    0ms  TBT    58ms  load-blocking    92ms  observer    57ms  FCP  1048ms  harness    0ms  [P.d-villa-lede]
B route=/en/experiences run=2 desktop  LCP   352ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   352ms  harness    0ms  [H1.display c2 d-pagehead-title]
B route=/en/experiences run=2 phone    LCP  1028ms  CLS 0       worst-interaction    0ms  TBT    72ms  load-blocking   103ms  observer    72ms  FCP  1028ms  harness    0ms  [P.d-villa-lede]
A route=/en/experiences run=2 desktop  LCP   360ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   360ms  harness    0ms  [H1.display c2 d-pagehead-title]
A route=/en/experiences run=2 phone    LCP  1036ms  CLS 0       worst-interaction    0ms  TBT    69ms  load-blocking    99ms  observer    69ms  FCP  1036ms  harness    0ms  [P.d-villa-lede]
A route=/en/experiences run=3 desktop  LCP   332ms  CLS 0       worst-interaction    0ms  TBT     0ms  load-blocking     0ms  observer     0ms  FCP   332ms  harness    0ms  [H1.display c2 d-pagehead-title]
A route=/en/experiences run=3 phone    LCP  1032ms  CLS 0       worst-interaction    0ms  TBT    54ms  load-blocking    84ms  observer    53ms  FCP  1032ms  harness    0ms  [P.d-villa-lede]
B route=/en/experiences run=3 desktop  LCP   356ms  CLS 0       worst-interaction    0ms  TBT     5ms  load-blocking     5ms  observer     5ms  FCP   356ms  harness    0ms  [H1.display c2 d-pagehead-title]
B route=/en/experiences run=3 phone    LCP  1044ms  CLS 0       worst-interaction    0ms  TBT    62ms  load-blocking   107ms  observer    61ms  FCP  1044ms  harness    0ms  [P.d-villa-lede]
```
