# Performance pass — interleaved A/B (tranche twelve) — SUPERSEDED, KEPT AS EVIDENCE

> **Do not quote these TBT figures.** They were taken with the page's own
> `longtask` observer, which is what `hotel-cwv` summed at the time. A
> first-paint trace then showed that the observer stopped reporting the
> whole-page layout once the root Suspense boundary was gone: that work moved
> out of a script-triggered task, which the observer counted, into the parser's
> rendering before first paint, which it does not. The fall from 295 to 104 ms
> on `/` is mostly that blind spot. `hotel-cwv` now takes TBT from a trace
> (after first contentful paint, Lighthouse's window) and prints load-blocking
> and the observer beside it; the corrected run is `AB-tranche12-trace.md`.
> This file stays because it is the record of how the wrong number arose.

Generated from `scratchpad/perf-ab.ps1` runs of `scripts/hotel-cwv.mjs` (observer version).

- **A** — HEAD `7ff32a9`, built in a separate git worktree, `next start` on :3015.
- **B** — the candidate (root `loading.tsx` removed, lazy clause in the root 404 tree, lazy Lenis, HotelMotion frame split, security headers), `next start` on :3005.
- Order alternates per run (A,B then B,A) so machine drift cancels rather than landing on one side.
- Phone profile: 4× CPU, Slow 4G, 390×844. Desktop: 2× CPU, 1440×900. Lab only; no field data exists for this site.

## Medians of three runs

| route | view | TBT A (median, runs) | TBT B (median, runs) | ΔTBT | LCP A | LCP B | CLS A/B | worst interaction A/B |
|---|---|---|---|---|---|---|---|---|
| `/` | phone | 295 ms (295/281/355) | 104 ms (104/87/147) | -191 ms | 1196 ms | 1236 ms | 0/0 | 32/32 ms |
| `/` | desktop | 51 ms (73/42/51) | 17 ms (17/10/19) | -34 ms | 712 ms | 784 ms | 0/0 | 32/32 ms |
| `/en/villas/villa-thoi` | phone | 318 ms (270/353/318) | 184 ms (118/184/193) | -134 ms | 1220 ms | 1220 ms | 0/0 | 0/0 ms |
| `/en/villas/villa-thoi` | desktop | 34 ms (32/34/40) | 20 ms (13/20/32) | -14 ms | 704 ms | 684 ms | 0/0 | 0/0 ms |
| `/en/the-estate` | phone | 316 ms (311/316/327) | 162 ms (127/162/179) | -154 ms | 1220 ms | 1236 ms | 0/0 | 0/0 ms |
| `/en/the-estate` | desktop | 42 ms (42/53/42) | 15 ms (7/15/20) | -27 ms | 716 ms | 752 ms | 0/0 | 0/0 ms |
| `/en/experiences` | phone | 218 ms (218/227/204) | 129 ms (129/130/95) | -89 ms | 1060 ms | 1080 ms | 0/0 | 0/0 ms |
| `/en/experiences` | desktop | 14 ms (14/30/12) | 16 ms (24/16/16) | +2 ms | 400 ms | 460 ms | 0/0 | 0/0 ms |

## Every run, in the order measured

```
A route=/ run=1 desktop  LCP   964ms  CLS 0       worst-interaction   32ms  TBT    73ms  [IMG.]
A route=/ run=1 phone    LCP  1184ms  CLS 0       worst-interaction   40ms  TBT   295ms  [IMG.]
B route=/ run=1 desktop  LCP  1788ms  CLS 0       worst-interaction   32ms  TBT    17ms  [IMG.]
B route=/ run=1 phone    LCP  1208ms  CLS 0       worst-interaction   32ms  TBT   104ms  [IMG.]
B route=/ run=2 desktop  LCP   784ms  CLS 0       worst-interaction   32ms  TBT    10ms  [IMG.]
B route=/ run=2 phone    LCP  1236ms  CLS 0       worst-interaction   32ms  TBT    87ms  [IMG.]
A route=/ run=2 desktop  LCP   712ms  CLS 0       worst-interaction   32ms  TBT    42ms  [IMG.]
A route=/ run=2 phone    LCP  1204ms  CLS 0       worst-interaction   24ms  TBT   281ms  [IMG.]
A route=/ run=3 desktop  LCP   696ms  CLS 0       worst-interaction   40ms  TBT    51ms  [IMG.]
A route=/ run=3 phone    LCP  1196ms  CLS 0       worst-interaction   32ms  TBT   355ms  [IMG.]
B route=/ run=3 desktop  LCP   716ms  CLS 0       worst-interaction   32ms  TBT    19ms  [IMG.]
B route=/ run=3 phone    LCP  1248ms  CLS 0       worst-interaction   32ms  TBT   147ms  [IMG.]
A route=/en/villas/villa-thoi run=1 desktop  LCP   736ms  CLS 0       worst-interaction    0ms  TBT    32ms  [IMG.]
A route=/en/villas/villa-thoi run=1 phone    LCP  1196ms  CLS 0       worst-interaction    0ms  TBT   270ms  [IMG.]
B route=/en/villas/villa-thoi run=1 desktop  LCP   736ms  CLS 0       worst-interaction    0ms  TBT    13ms  [IMG.]
B route=/en/villas/villa-thoi run=1 phone    LCP  1136ms  CLS 0       worst-interaction    0ms  TBT   118ms  [IMG.]
B route=/en/villas/villa-thoi run=2 desktop  LCP   608ms  CLS 0       worst-interaction    0ms  TBT    20ms  [IMG.]
B route=/en/villas/villa-thoi run=2 phone    LCP  1220ms  CLS 0       worst-interaction    0ms  TBT   184ms  [IMG.]
A route=/en/villas/villa-thoi run=2 desktop  LCP   616ms  CLS 0       worst-interaction    0ms  TBT    34ms  [IMG.]
A route=/en/villas/villa-thoi run=2 phone    LCP  1244ms  CLS 0       worst-interaction    0ms  TBT   353ms  [IMG.]
A route=/en/villas/villa-thoi run=3 desktop  LCP   704ms  CLS 0       worst-interaction    0ms  TBT    40ms  [IMG.]
A route=/en/villas/villa-thoi run=3 phone    LCP  1220ms  CLS 0       worst-interaction    0ms  TBT   318ms  [IMG.]
B route=/en/villas/villa-thoi run=3 desktop  LCP   684ms  CLS 0       worst-interaction    0ms  TBT    32ms  [IMG.]
B route=/en/villas/villa-thoi run=3 phone    LCP  1252ms  CLS 0       worst-interaction    0ms  TBT   193ms  [IMG.]
A route=/en/the-estate run=1 desktop  LCP   716ms  CLS 0       worst-interaction    0ms  TBT    42ms  [IMG.]
A route=/en/the-estate run=1 phone    LCP  1212ms  CLS 0       worst-interaction    0ms  TBT   311ms  [IMG.]
B route=/en/the-estate run=1 desktop  LCP   752ms  CLS 0       worst-interaction    0ms  TBT     7ms  [IMG.]
B route=/en/the-estate run=1 phone    LCP  1208ms  CLS 0       worst-interaction    0ms  TBT   127ms  [IMG.]
B route=/en/the-estate run=2 desktop  LCP   684ms  CLS 0       worst-interaction    0ms  TBT    15ms  [IMG.]
B route=/en/the-estate run=2 phone    LCP  1236ms  CLS 0       worst-interaction    0ms  TBT   162ms  [IMG.]
A route=/en/the-estate run=2 desktop  LCP   716ms  CLS 0       worst-interaction    0ms  TBT    53ms  [IMG.]
A route=/en/the-estate run=2 phone    LCP  1220ms  CLS 0       worst-interaction    0ms  TBT   316ms  [IMG.]
A route=/en/the-estate run=3 desktop  LCP   708ms  CLS 0       worst-interaction    0ms  TBT    42ms  [IMG.]
A route=/en/the-estate run=3 phone    LCP  1244ms  CLS 0       worst-interaction    0ms  TBT   327ms  [IMG.]
B route=/en/the-estate run=3 desktop  LCP   760ms  CLS 0       worst-interaction    0ms  TBT    20ms  [IMG.]
B route=/en/the-estate run=3 phone    LCP  1308ms  CLS 0       worst-interaction    0ms  TBT   179ms  [IMG.]
A route=/en/experiences run=1 desktop  LCP   344ms  CLS 0       worst-interaction    0ms  TBT    14ms  [H1.display c2 d-pagehead-title]
A route=/en/experiences run=1 phone    LCP  1064ms  CLS 0       worst-interaction    0ms  TBT   218ms  [P.d-villa-lede]
B route=/en/experiences run=1 desktop  LCP   448ms  CLS 0       worst-interaction    0ms  TBT    24ms  [H1.display c2 d-pagehead-title]
B route=/en/experiences run=1 phone    LCP  1108ms  CLS 0       worst-interaction    0ms  TBT   129ms  [P.d-villa-lede]
B route=/en/experiences run=2 desktop  LCP   460ms  CLS 0       worst-interaction    0ms  TBT    16ms  [H1.display c2 d-pagehead-title]
B route=/en/experiences run=2 phone    LCP  1080ms  CLS 0       worst-interaction    0ms  TBT   130ms  [P.d-villa-lede]
A route=/en/experiences run=2 desktop  LCP   400ms  CLS 0       worst-interaction    0ms  TBT    30ms  [H1.display c2 d-pagehead-title]
A route=/en/experiences run=2 phone    LCP  1060ms  CLS 0       worst-interaction    0ms  TBT   227ms  [P.d-villa-lede]
A route=/en/experiences run=3 desktop  LCP   420ms  CLS 0       worst-interaction    0ms  TBT    12ms  [H1.display c2 d-pagehead-title]
A route=/en/experiences run=3 phone    LCP  1052ms  CLS 0       worst-interaction    0ms  TBT   204ms  [P.d-villa-lede]
B route=/en/experiences run=3 desktop  LCP   468ms  CLS 0       worst-interaction    0ms  TBT    16ms  [H1.display c2 d-pagehead-title]
B route=/en/experiences run=3 phone    LCP  1080ms  CLS 0       worst-interaction    0ms  TBT    95ms  [P.d-villa-lede]
```
