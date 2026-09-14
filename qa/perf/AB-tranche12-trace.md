# Performance pass — interleaved A/B with the corrected gate (tranche twelve) — SUPERSEDED, KEPT AS EVIDENCE

> **Do not quote these figures either.** A was served from a git worktree, and
> a worktree holds only tracked files. `public/images/_chh/*` and eight files in
> `public/images/_pool/` are gitignored, so A's pages asked for 159 photographs
> the server did not have (they came back 400). B, served from the main
> checkout, had them, so the two sides did not serve the same pages. Which way
> that moved any comparison was not established: on the 3D branch the same
> fault raised the figures rather than lowering them. It was found on 2026-09-14, when the
> 3D branch's worktree failed its image specs for the same reason. The stage-1
> worktree left on disk still holds 16 of main's 167 `_chh` files. The figures
> of record are in `AB-tranche12-final.md`, measured with the gitignored files
> copied into every worktree and every build rebuilt.

TBT here is **Lighthouse's definition, from a Chrome trace**: main-thread tasks over 50 ms, the part after first contentful paint. `load-blocking` counts every long task, before first paint included. `observer` is the page's own longtask observer — the figure `hotel-cwv` used to report, shown for comparison because it is blind to the parser's rendering before first paint (see `AB-tranche12.md`, superseded).

- **A** — HEAD `7ff32a9`, built in a separate git worktree, `next start` on :3015.
- **Order** alternates per run (A,B then B,A) so machine drift cancels.
- Phone: 4× CPU, Slow 4G, 390×844. Desktop: 2× CPU, 1440×900. Lab only.

## Stage 1 — B = candidate without the homepage Suspense slicing

B: root `loading.tsx` removed, lazy clause in the root 404 tree, lazy Lenis, HotelMotion frame split, security headers.

| route | view | TBT after FCP A (runs) | TBT after FCP B (runs) | Δ | load-blocking A → B | observer A → B | FCP A → B | LCP A → B | CLS A/B | worst interaction A/B |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | phone | 121 ms (121/147/92) | 92 ms (96/78/92) | -29 ms | 282 → 234 ms | 279 → 80 ms | 1116 → 1180 ms | 1152 → 1200 ms | 0/0 | 32/40 ms |
| `/` | desktop | 15 ms (10/15/15) | 11 ms (15/11/7) | -4 ms | 57 → 41 ms | 55 → 11 ms | 428 → 436 ms | 660 → 700 ms | 0/0 | 32/32 ms |
| `/en/villas/villa-thoi` | phone | 129 ms (122/165/129) | 144 ms (168/144/141) | +15 ms | 352 → 320 ms | 317 → 185 ms | 1220 → 1212 ms | 1236 → 1212 ms | 0/0 | 0/0 ms |
| `/en/villas/villa-thoi` | desktop | 11 ms (4/18/11) | 16 ms (8/16/28) | +5 ms | 32 → 36 ms | 31 → 22 ms | 444 → 448 ms | 608 → 604 ms | 0.0001/0 | 0/0 ms |
| `/en/the-estate` | phone | 121 ms (116/121/149) | 107 ms (150/107/98) | -14 ms | 328 → 276 ms | 301 → 109 ms | 1208 → 1204 ms | 1224 → 1216 ms | 0/0 | 0/0 ms |
| `/en/the-estate` | desktop | 18 ms (27/18/5) | 16 ms (17/16/11) | -2 ms | 55 → 22 ms | 54 → 15 ms | 432 → 440 ms | 632 → 668 ms | 0/0 | 0/0 ms |
| `/en/experiences` | phone | 79 ms (79/78/101) | 90 ms (90/89/104) | +11 ms | 168 → 150 ms | 167 → 94 ms | 1044 → 1080 ms | 1044 → 1080 ms | 0/0 | 0/0 ms |
| `/en/experiences` | desktop | 9 ms (5/19/9) | 10 ms (10/7/15) | +1 ms | 9 → 10 ms | 8 → 10 ms | 340 → 356 ms | 340 → 356 ms | 0/0 | 0/0 ms |

### Every run, in the order measured

```
A route=/ run=1 desktop  LCP   648ms  CLS 0       worst-interaction   40ms  TBT    10ms  load-blocking    56ms  observer    55ms  FCP   420ms  harness    0ms  [IMG.]
A route=/ run=1 phone    LCP  1176ms  CLS 0       worst-interaction   32ms  TBT   121ms  load-blocking   282ms  observer   279ms  FCP  1160ms  harness    0ms  [IMG.]
B route=/ run=1 desktop  LCP   720ms  CLS 0       worst-interaction   40ms  TBT    15ms  load-blocking    57ms  observer    15ms  FCP   444ms  harness    0ms  [IMG.]
B route=/ run=1 phone    LCP  1244ms  CLS 0       worst-interaction   40ms  TBT    96ms  load-blocking   275ms  observer    88ms  FCP  1228ms  harness    0ms  [IMG.]
B route=/ run=2 desktop  LCP   700ms  CLS 0       worst-interaction   32ms  TBT    11ms  load-blocking    41ms  observer    11ms  FCP   436ms  harness    0ms  [IMG.]
B route=/ run=2 phone    LCP  1180ms  CLS 0       worst-interaction   32ms  TBT    78ms  load-blocking   204ms  observer    77ms  FCP  1164ms  harness    0ms  [IMG.]
A route=/ run=2 desktop  LCP   668ms  CLS 0       worst-interaction   32ms  TBT    15ms  load-blocking    57ms  observer    55ms  FCP   432ms  harness    0ms  [IMG.]
A route=/ run=2 phone    LCP  1136ms  CLS 0       worst-interaction   40ms  TBT   147ms  load-blocking   305ms  observer   290ms  FCP  1116ms  harness    5ms  [IMG.]
A route=/ run=3 desktop  LCP   660ms  CLS 0       worst-interaction   32ms  TBT    15ms  load-blocking    59ms  observer    57ms  FCP   428ms  harness    0ms  [IMG.]
A route=/ run=3 phone    LCP  1152ms  CLS 0       worst-interaction   32ms  TBT    92ms  load-blocking   238ms  observer   236ms  FCP  1104ms  harness    4ms  [IMG.]
B route=/ run=3 desktop  LCP   692ms  CLS 0       worst-interaction   32ms  TBT     7ms  load-blocking    38ms  observer     7ms  FCP   432ms  harness    0ms  [IMG.]
B route=/ run=3 phone    LCP  1200ms  CLS 0       worst-interaction   40ms  TBT    92ms  load-blocking   234ms  observer    80ms  FCP  1180ms  harness    0ms  [IMG.]
A route=/en/villas/villa-thoi run=1 desktop  LCP   592ms  CLS 0       worst-interaction    0ms  TBT     4ms  load-blocking    15ms  observer    14ms  FCP   412ms  harness    0ms  [IMG.]
A route=/en/villas/villa-thoi run=1 phone    LCP  1236ms  CLS 0       worst-interaction    0ms  TBT   122ms  load-blocking   352ms  observer   317ms  FCP  1220ms  harness    0ms  [IMG.]
B route=/en/villas/villa-thoi run=1 desktop  LCP   604ms  CLS 0       worst-interaction    0ms  TBT     8ms  load-blocking     9ms  observer     8ms  FCP   448ms  harness    0ms  [IMG.]
B route=/en/villas/villa-thoi run=1 phone    LCP  1212ms  CLS 0       worst-interaction    0ms  TBT   168ms  load-blocking   349ms  observer   209ms  FCP  1212ms  harness    0ms  [IMG.]
B route=/en/villas/villa-thoi run=2 desktop  LCP   616ms  CLS 0       worst-interaction    0ms  TBT    16ms  load-blocking    36ms  observer    22ms  FCP   460ms  harness    0ms  [IMG.]
B route=/en/villas/villa-thoi run=2 phone    LCP  1240ms  CLS 0       worst-interaction    0ms  TBT   144ms  load-blocking   320ms  observer   185ms  FCP  1240ms  harness    0ms  [IMG.]
A route=/en/villas/villa-thoi run=2 desktop  LCP   608ms  CLS 0.0001  worst-interaction    0ms  TBT    18ms  load-blocking    79ms  observer    78ms  FCP   444ms  harness    0ms  [IMG.]
A route=/en/villas/villa-thoi run=2 phone    LCP  1256ms  CLS 0       worst-interaction    0ms  TBT   165ms  load-blocking   396ms  observer   364ms  FCP  1240ms  harness    0ms  [IMG.]
A route=/en/villas/villa-thoi run=3 desktop  LCP   664ms  CLS 0       worst-interaction    0ms  TBT    11ms  load-blocking    32ms  observer    31ms  FCP   488ms  harness    0ms  [IMG.]
A route=/en/villas/villa-thoi run=3 phone    LCP  1208ms  CLS 0       worst-interaction    0ms  TBT   129ms  load-blocking   330ms  observer   297ms  FCP  1192ms  harness    0ms  [IMG.]
B route=/en/villas/villa-thoi run=3 desktop  LCP   588ms  CLS 0       worst-interaction    0ms  TBT    28ms  load-blocking    49ms  observer    37ms  FCP   440ms  harness    0ms  [IMG.]
B route=/en/villas/villa-thoi run=3 phone    LCP  1212ms  CLS 0       worst-interaction    0ms  TBT   141ms  load-blocking   300ms  observer   160ms  FCP  1212ms  harness    0ms  [IMG.]
A route=/en/the-estate run=1 desktop  LCP   616ms  CLS 0       worst-interaction    0ms  TBT    27ms  load-blocking    62ms  observer    61ms  FCP   436ms  harness    0ms  [IMG.]
A route=/en/the-estate run=1 phone    LCP  1220ms  CLS 0       worst-interaction    0ms  TBT   116ms  load-blocking   315ms  observer   285ms  FCP  1204ms  harness    0ms  [IMG.]
B route=/en/the-estate run=1 desktop  LCP   668ms  CLS 0       worst-interaction    0ms  TBT    17ms  load-blocking    22ms  observer    16ms  FCP   444ms  harness    0ms  [IMG.]
B route=/en/the-estate run=1 phone    LCP  1228ms  CLS 0       worst-interaction    0ms  TBT   150ms  load-blocking   311ms  observer   129ms  FCP  1228ms  harness    0ms  [IMG.]
B route=/en/the-estate run=2 desktop  LCP   676ms  CLS 0       worst-interaction    0ms  TBT    16ms  load-blocking    27ms  observer    15ms  FCP   428ms  harness    0ms  [IMG.]
B route=/en/the-estate run=2 phone    LCP  1216ms  CLS 0       worst-interaction    0ms  TBT   107ms  load-blocking   276ms  observer   104ms  FCP  1200ms  harness    0ms  [IMG.]
A route=/en/the-estate run=2 desktop  LCP   632ms  CLS 0       worst-interaction    0ms  TBT    18ms  load-blocking    55ms  observer    54ms  FCP   432ms  harness    0ms  [IMG.]
A route=/en/the-estate run=2 phone    LCP  1224ms  CLS 0       worst-interaction    0ms  TBT   121ms  load-blocking   328ms  observer   301ms  FCP  1208ms  harness    0ms  [IMG.]
A route=/en/the-estate run=3 desktop  LCP   632ms  CLS 0       worst-interaction    0ms  TBT     5ms  load-blocking    14ms  observer    13ms  FCP   420ms  harness    0ms  [IMG.]
A route=/en/the-estate run=3 phone    LCP  1276ms  CLS 0       worst-interaction    0ms  TBT   149ms  load-blocking   407ms  observer   359ms  FCP  1260ms  harness    0ms  [IMG.]
B route=/en/the-estate run=3 desktop  LCP   656ms  CLS 0       worst-interaction    0ms  TBT    11ms  load-blocking    18ms  observer    10ms  FCP   440ms  harness    0ms  [IMG.]
B route=/en/the-estate run=3 phone    LCP  1204ms  CLS 0       worst-interaction    0ms  TBT    98ms  load-blocking   239ms  observer   109ms  FCP  1204ms  harness    0ms  [IMG.]
A route=/en/experiences run=1 desktop  LCP   320ms  CLS 0       worst-interaction    0ms  TBT     5ms  load-blocking     5ms  observer     4ms  FCP   320ms  harness    0ms  [H1.display c2 d-pagehead-title]
A route=/en/experiences run=1 phone    LCP  1036ms  CLS 0       worst-interaction    0ms  TBT    79ms  load-blocking   168ms  observer   167ms  FCP  1036ms  harness    0ms  [P.d-villa-lede]
B route=/en/experiences run=1 desktop  LCP   388ms  CLS 0       worst-interaction    0ms  TBT    10ms  load-blocking    10ms  observer    10ms  FCP   388ms  harness    0ms  [H1.display c2 d-pagehead-title]
B route=/en/experiences run=1 phone    LCP  1104ms  CLS 0       worst-interaction    0ms  TBT    90ms  load-blocking   182ms  observer    94ms  FCP  1104ms  harness    0ms  [P.d-villa-lede]
B route=/en/experiences run=2 desktop  LCP   348ms  CLS 0       worst-interaction    0ms  TBT     7ms  load-blocking     7ms  observer     6ms  FCP   348ms  harness    0ms  [H1.display c2 d-pagehead-title]
B route=/en/experiences run=2 phone    LCP  1080ms  CLS 0       worst-interaction    0ms  TBT    89ms  load-blocking   144ms  observer    88ms  FCP  1080ms  harness    0ms  [P.d-villa-lede]
A route=/en/experiences run=2 desktop  LCP   368ms  CLS 0       worst-interaction    0ms  TBT    19ms  load-blocking    19ms  observer    19ms  FCP   368ms  harness    0ms  [H1.display c2 d-pagehead-title]
A route=/en/experiences run=2 phone    LCP  1044ms  CLS 0       worst-interaction    0ms  TBT    78ms  load-blocking   156ms  observer   154ms  FCP  1044ms  harness    0ms  [P.d-villa-lede]
A route=/en/experiences run=3 desktop  LCP   340ms  CLS 0       worst-interaction    0ms  TBT     9ms  load-blocking     9ms  observer     8ms  FCP   340ms  harness    0ms  [H1.display c2 d-pagehead-title]
A route=/en/experiences run=3 phone    LCP  1044ms  CLS 0       worst-interaction    0ms  TBT   101ms  load-blocking   191ms  observer   189ms  FCP  1044ms  harness    0ms  [P.d-villa-lede]
B route=/en/experiences run=3 desktop  LCP   356ms  CLS 0       worst-interaction    0ms  TBT    15ms  load-blocking    15ms  observer    14ms  FCP   356ms  harness    0ms  [H1.display c2 d-pagehead-title]
B route=/en/experiences run=3 phone    LCP  1080ms  CLS 0       worst-interaction    0ms  TBT   104ms  load-blocking   150ms  observer   103ms  FCP  1080ms  harness    0ms  [P.d-villa-lede]
```

## Stage 2 — not measured, because the structure gate refused the build

The next candidate wrapped the homepage's below-fold sections in Suspense, so
that React would hydrate them in slices. React outlined them as streamed
segments instead: `/` came back with **4** `<div hidden id="S:…">` segments swapped
in by script, the pattern stage 1 removed. The pre-measurement check stopped
the run and the change was reverted (`DECISIONS.md` D-012). **Stage 1's B is
the build that ships.**
