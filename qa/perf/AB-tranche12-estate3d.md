# The 3D estate map (feat/estate-3d) — CWV impact against main (tranche twelve) — SUPERSEDED, KEPT AS EVIDENCE

> **Do not quote these figures.** B, the branch, was served from a git
> worktree, which holds only tracked files. The 159 gitignored photographs
> (`public/images/_chh/*` and eight in `_pool/`) were missing, and requests for
> them came back 400. A, served from the main checkout, had them, so the two
> sides did not serve the same page. Re-measured with the files in both trees,
> the branch's phone TBT median is 139 ms, not 286 ms: this run **overstated**
> the diagram's cost. Why the missing files raised it was not established. The
> branch's full QA suite failed on exactly those images in
> the same worktree, and passed once they were copied in. The figures of record
> are in `AB-tranche12-estate3d-final.md`, measured with the gitignored files
> in every tree and every build rebuilt.

The experiment's cost, measured for the owner's yes or no. **The branch is not on main.**

- **A** — main's build (`56cb859` app), `next start` on :3005.
- **B** — the `feat/estate-3d` build (`7fa6fb7`), `next start` on :3025, from a separate git worktree.
- Route `/en/the-estate`. Order alternates per run (A,B then B,A). Three runs each.
- `scripts/hotel-cwv.mjs` with the corrected gate: **TBT from a Chrome trace, after first contentful paint** (Lighthouse's window); `load-blocking` counts every long task; `observer` is the page's own longtask observer, kept for comparison.
- The session loads the page, settles, then scrolls through the whole page, so B's runs include fetching three.js (132 kB gzip) and drawing the diagram.
- Phone: 4× CPU, Slow 4G, 390×844 (WebGL available, motion allowed). Desktop: 2× CPU, 1440×900. Lab only.

## Medians of three runs

| route | view | TBT after FCP A (runs) | TBT after FCP B (runs) | Δ | load-blocking A → B | observer A → B | FCP A → B | LCP A → B | CLS A/B | worst interaction A/B |
|---|---|---|---|---|---|---|---|---|---|---|
| `/en/the-estate` | phone | 123 ms (123/89/163) | 286 ms (221/301/286) | +163 ms | 304 → 517 ms | 140 → 294 ms | 1256 → 1300 ms | 1256 → 1300 ms | 0/0 | 0/0 ms |
| `/en/the-estate` | desktop | 24 ms (19/30/24) | 67 ms (67/57/99) | +43 ms | 39 → 88 ms | 27 → 77 ms | 440 → 452 ms | 676 → 664 ms | 0/0 | 0/0 ms |

## Every run, in the order measured

```
A route=/en/the-estate run=1 desktop  LCP   660ms  CLS 0       worst-interaction    0ms  TBT    19ms  load-blocking    38ms  observer    19ms  FCP   440ms  harness    0ms  [IMG.]
A route=/en/the-estate run=1 phone    LCP  1172ms  CLS 0       worst-interaction    0ms  TBT   123ms  load-blocking   273ms  observer   140ms  FCP  1160ms  harness    0ms  [IMG.]
B route=/en/the-estate run=1 desktop  LCP   656ms  CLS 0       worst-interaction    0ms  TBT    67ms  load-blocking    88ms  observer    77ms  FCP   452ms  harness    0ms  [IMG.]
B route=/en/the-estate run=1 phone    LCP  1220ms  CLS 0       worst-interaction    0ms  TBT   221ms  load-blocking   340ms  observer   212ms  FCP  1220ms  harness    0ms  [IMG.]
B route=/en/the-estate run=2 desktop  LCP   664ms  CLS 0       worst-interaction    0ms  TBT    57ms  load-blocking    73ms  observer    59ms  FCP   456ms  harness    0ms  [IMG.]
B route=/en/the-estate run=2 phone    LCP  1300ms  CLS 0       worst-interaction    0ms  TBT   301ms  load-blocking   538ms  observer   294ms  FCP  1300ms  harness    0ms  [IMG.]
A route=/en/the-estate run=2 desktop  LCP   692ms  CLS 0       worst-interaction    0ms  TBT    30ms  load-blocking   111ms  observer    43ms  FCP   508ms  harness    0ms  [IMG.]
A route=/en/the-estate run=2 phone    LCP  1276ms  CLS 0       worst-interaction    0ms  TBT    89ms  load-blocking   304ms  observer   100ms  FCP  1276ms  harness    0ms  [IMG.]
A route=/en/the-estate run=3 desktop  LCP   676ms  CLS 0       worst-interaction    0ms  TBT    24ms  load-blocking    39ms  observer    27ms  FCP   436ms  harness    0ms  [IMG.]
A route=/en/the-estate run=3 phone    LCP  1256ms  CLS 0       worst-interaction    0ms  TBT   163ms  load-blocking   365ms  observer   172ms  FCP  1256ms  harness    0ms  [IMG.]
B route=/en/the-estate run=3 desktop  LCP   676ms  CLS 0       worst-interaction    0ms  TBT    99ms  load-blocking   121ms  observer   101ms  FCP   452ms  harness    0ms  [IMG.]
B route=/en/the-estate run=3 phone    LCP  1328ms  CLS 0       worst-interaction    0ms  TBT   286ms  load-blocking   517ms  observer   303ms  FCP  1328ms  harness    0ms  [IMG.]
```
