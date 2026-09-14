# The first-paint regression, attributed (tranche thirteen)

DECISIONS.md D-021 asked for the first-paint regression to be attributed. D-016 had recorded it without explaining it: "Phone FCP medians are 12–68 ms later after the pass on ten of eleven templates. Three runs cannot separate that from noise, but the direction is consistent. It is recorded, not explained."

**Answer.** On a fresh navigation, the regression is the cross-origin opener policy (`Cross-Origin-Opener-Policy: same-origin`, added by the security pass, D-013).
- It makes Chromium swap the page into a new renderer process on every such navigation.
- That delays the HTML parse by about 65 ms on the phone profile, and first paint by 76–80 ms.
- Once COOP is removed, what remains is not separated from noise.
- After a same-origin navigation there is no process swap, and no regression.

COOP stays: it is a security decision (D-013), and this is a lab cost with an unmeasured field cost (§6).

## 1. The arms

All three are built in git worktrees with the 159 gitignored photographs copied in, on Next 16.3.5, and served by `next start`.

| arm | commit | port | what it is |
|---|---|---|---|
| A | 7ff32a9 | :3016 | before the performance pass: no security headers, `loading.tsx` present |
| B | 5b3d106 | :3100 | the final performance candidate: COOP `same-origin` and the other headers, no `loading.tsx` |
| Bnc | 5b3d106 with the single `Cross-Origin-Opener-Policy` entry removed from `next.config.ts` | :3110 | a measurement arm only. `HEAD /en/careers` shows no COOP header on :3110, and `same-origin` on :3100 |

B and Bnc differ in that one header and nothing else. A and B differ in the whole performance and security pass.

## 2. Method

`fcp-probe.mjs` (session scratch) ran on 2026-09-14/15, from 23:55 to 00:17 local time, on a quiet machine. Nothing else was building, testing or measuring. The matrix:
- **Routes:** `/en/careers`, `/en/location`, `/en/villas/villa-thoi` and `/`.
- **Pre-navigation:** off (a fresh context goes straight to the page), and on (it first loads the same origin's `robots.txt`).
- **Arms:** A, B, Bnc, with the order reversed on every run.
- **Runs:** 10 per cell, each in a fresh browser context.
- **Profiles:** phone first (390×844, 4× CPU, Slow 4G, 22 minutes for both profiles in total), then desktop (1440×900, 2× CPU).

There were 480 runs, and every one recorded a first paint.

Per run, the probe records:
- **FCP,** from the page's own paint entry;
- **response timing,** Navigation Timing `responseStart`;
- **from a Chrome trace:**
  - the first `ParseHTML` for the document;
  - when the stylesheet finished loading;
  - whether the renderer that painted differs from the one the trace started with, which is direct evidence of a process swap;
  - the long tasks over 16 ms before FCP.

**Attribution rule:** an effect is attributed only where the two arms' FCP ranges (min–max over 10 runs) do not overlap. An overlapping comparison is reported as not separated, whatever its median.

## 3. Results

### 3.1 Per cell (FCP from the paint entry, ms; trace figures valid only where §6 says)

| profile | route | prenav | arm | FCP median (range) | responseStart | first ParseHTML | CSS finished | renderer switched |
|---|---|---|---|---|---|---|---|---|
| phone | careers | off | A | 984 (956–1008) | 4 | 207 | 789 | 0/10 |
| phone | careers | off | B | 1064 (1040–1084) | 4 | 274 | 865 | **10/10** |
| phone | careers | off | Bnc | 1004 (992–1016) | 4 | 208 | 807 | 0/10 |
| phone | location | off | A | 1000 (972–1020) | 4 | 204 | 789 | 0/10 |
| phone | location | off | B | 1076 (1044–1092) | 4 | 270 | 866 | **10/10** |
| phone | location | off | Bnc | 1018 (980–1032) | 3 | 208 | 806 | 0/10 |
| phone | villa-thoi | off | A | 1196 (1188–1244) | 5 | 210 | 835 | 0/10 |
| phone | villa-thoi | off | B | 1230 (1192–1288) | 6 | 272 | 927 | **10/10** |
| phone | villa-thoi | off | Bnc | 1142 (1100–1304) | 6 | 211 | 859 | 0/10 |
| phone | `/` | off | A | 1174 (1148–1204) | 5 | 210 | 820 | 0/10 |
| phone | `/` | off | B | 1252 (1216–1312) | 5 | 274 | 903 | **10/10** |
| phone | `/` | off | Bnc | 1190 (1140–1264) | 5 | 214 | 838 | 0/10 |
| phone | careers | on | A | 982 (956–1036) | 3 | – | – | – |
| phone | careers | on | B | 998 (984–1016) | 3 | 202 | 798 | 0/10 |
| phone | careers | on | Bnc | 1000 (980–1012) | 3 | – | – | – |
| phone | location | on | A | 1000 (972–1020) | 3 | – | – | – |
| phone | location | on | B | 1018 (984–1028) | 3 | 204 | 808 | 0/10 |
| phone | location | on | Bnc | 1020 (996–1036) | 3 | – | – | – |
| phone | villa-thoi | on | A | 1198 (1152–1408) | 4 | – | – | – |
| phone | villa-thoi | on | B | 1156 (1092–1200) | 5 | 206 | 851 | 0/10 |
| phone | villa-thoi | on | Bnc | 1144 (1092–1192) | 5 | – | – | – |
| phone | `/` | on | A | 1178 (1128–1208) | 4 | – | – | – |
| phone | `/` | on | B | 1160 (1140–1208) | 4 | 202 | 831 | 0/10 |
| phone | `/` | on | Bnc | 1176 (1128–1368) | 4 | – | – | – |
| desktop | careers | off | A | 330 (320–348) | 3 | 83 | 208 | 0/10 |
| desktop | careers | off | B | 340 (332–388) | 4 | 135 | 251 | **10/10** |
| desktop | careers | off | Bnc | 316 (280–332) | 4 | 77 | 196 | 0/10 |
| desktop | location | off | A | 334 (320–348) | 4 | 80 | 206 | 0/10 |
| desktop | location | off | B | 360 (340–376) | 4 | 143 | 259 | **10/10** |
| desktop | location | off | Bnc | 324 (284–336) | 4 | 80 | 205 | 0/10 |
| desktop | villa-thoi | off | A | 406 (388–428) | 5 | 85 | 213 | 0/10 |
| desktop | villa-thoi | off | B | 446 (396–480) | 6 | 142 | 276 | **10/10** |
| desktop | villa-thoi | off | Bnc | 392 (336–412) | 6 | 84 | 220 | 0/10 |
| desktop | `/` | off | A | 408 (384–420) | 5 | 80 | 209 | 0/10 |
| desktop | `/` | off | B | 434 (408–472) | 5 | 141 | 269 | **10/10** |
| desktop | `/` | off | Bnc | 394 (352–404) | 5 | 81 | 205 | 0/10 |
| desktop | careers | on | A | 324 (288–348) | 3 | – | – | – |
| desktop | careers | on | B | 306 (280–320) | 3 | 78 | 203 | 0/10 |
| desktop | careers | on | Bnc | 314 (292–340) | 3 | – | – | – |
| desktop | location | on | A | 332 (328–348) | 3 | – | – | – |
| desktop | location | on | B | 320 (276–344) | 3 | 78 | 199 | 0/10 |
| desktop | location | on | Bnc | 324 (292–352) | 3 | – | – | – |
| desktop | villa-thoi | on | A | 404 (392–420) | 4 | – | – | – |
| desktop | villa-thoi | on | B | 384 (368–404) | 4 | 81 | 212 | 0/10 |
| desktop | villa-thoi | on | Bnc | 382 (376–404) | 4 | – | – | – |
| desktop | `/` | on | A | 408 (396–428) | 4 | – | – | – |
| desktop | `/` | on | B | 402 (376–412) | 4 | 81 | 211 | 0/10 |
| desktop | `/` | on | Bnc | 404 (388–424) | 4 | – | – | – |

A "–" marks trace figures withheld because the trace did not match the page (§6). The FCP in those rows is the paint entry, and is valid.

### 3.2 The comparisons (median Δ FCP; **separated** = the ranges do not overlap)

| profile | route | prenav | B − A (the regression) | B − Bnc (COOP alone) | Bnc − A (without COOP) |
|---|---|---|---|---|---|
| phone | careers | off | **+80, separated** | **+60, separated** | +20, overlap |
| phone | location | off | **+76, separated** | **+58, separated** | +18, overlap |
| phone | villa-thoi | off | +34, overlap | +88, overlap | −54, overlap |
| phone | `/` | off | **+78, separated** | +62, overlap | +16, overlap |
| phone | careers | on | +16, overlap | −2, overlap | +18, overlap |
| phone | location | on | +18, overlap | −2, overlap | +20, overlap |
| phone | villa-thoi | on | −42, overlap | +12, overlap | −54, overlap |
| phone | `/` | on | −18, overlap | −16, overlap | −2, overlap |
| desktop | careers | off | +10, overlap | +24, overlap | −14, overlap |
| desktop | location | off | +26, overlap | **+36, separated** | −10, overlap |
| desktop | villa-thoi | off | +40, overlap | +54, overlap | −14, overlap |
| desktop | `/` | off | +26, overlap | **+40, separated** | −14, overlap |
| desktop | careers | on | −18, overlap | −8, overlap | −10, overlap |
| desktop | location | on | −12, overlap | −4, overlap | −8, overlap |
| desktop | villa-thoi | on | −20, overlap | +2, overlap | −22, overlap |
| desktop | `/` | on | −6, overlap | −2, overlap | −4, overlap |

## 4. What this establishes

1. **The regression is real on the phone, on a fresh navigation.** B is later than A by 76–80 ms on careers, location and `/`, and the runs separate. That matches D-016's recorded direction; its "12–68 ms" came from three runs per template.
2. **It goes with COOP.**
   - On careers and location, B is later than Bnc by 58–60 ms, and those runs separate too. B and Bnc differ in that one header alone.
   - On `/`, B − Bnc is +62 ms, but the ranges overlap: Bnc's slowest run (1,264 ms) is slower than B's fastest (1,216 ms).
   - What remains without COOP (Bnc − A, +16 to +20 ms on those routes) never separates.
3. **The mechanism is a renderer process swap.**
   - With pre-navigation off, B's page was painted by a different renderer from the one the trace began with in **80 of 80 runs**, across both profiles and all four routes. A and Bnc did not swap in any of their 160 runs.
   - On the phone, B's first `ParseHTML` starts about 60–70 ms later than A's and Bnc's (270–274 against 204–214 ms), and its stylesheet finishes 58–92 ms later. `responseStart` is the same in all three. So the time goes between the response and the parse, where the swap happens, not on the network or the server.
4. **After a same-origin navigation there is no swap and no regression.** With pre-navigation on, B did not swap in any of its 80 runs, and no comparison separates on either profile. A visitor already on the site does not pay this cost.
5. **Desktop shows the same mechanism, smaller.** B still swaps on every fresh navigation, and parse is 50–65 ms later. FCP separates only for B − Bnc on location (+36) and `/` (+40), because 2× CPU makes the swap cheaper and the other differences between A and B (security headers against `loading.tsx`) blur the B − A comparison.
6. **villa-thoi on the phone does not separate in any comparison.** Its Bnc runs span 1,100–1,304 ms. The swap is still there (10/10 for B, with parse +61 ms), but ten runs cannot resolve its effect on that route's FCP.

## 5. D-012 and D-016, against these runs

- **D-016's "Phone FCP medians are 12–68 ms later … recorded, not explained" is now explained** for the fresh-navigation case: the COOP renderer swap, 76–80 ms on the phone where the runs separate.
- **D-012's "one task of 250–340 ms, on every route" is neither confirmed nor contradicted.** That claim was about the removed `loading.tsx` Suspense boundary, not first paint.
  - With pre-navigation off (where the trace is valid, §6), the long tasks before first paint are the same in A, which has `loading.tsx`, and Bnc, which does not.
  - On the phone, both have 3 tasks over 16 ms: careers A 176 ms against Bnc 167 ms, location 182 against 188, villa-thoi 295 against 289. `/` differs by one task: A has 2 at 277 ms, Bnc 3 at 294 ms.
  - So the task D-012 removed, if it is measured the way D-012 measured it, falls after first paint, outside this probe's window. D-012 is left as written.

## 6. Limits

- **Lab, not field.** A real visitor who arrives from another site already crosses a browsing-context-group boundary, so COOP may cost nothing extra in the field. That is not measured, and it is why COOP stays.
- **One machine, 10 runs per cell,** software GPU. Ranges are min–max, not confidence intervals.
- **The trace did not match the page on most pre-navigation-on runs for A and Bnc.** The trace's first contentful paint belonged to the `robots.txt` page, so the decomposition window collapses.

  | profile | arm | pre-navigation on: trace FCP more than 50 ms off the paint entry |
  |---|---|---|
  | phone | A | 32 of 40 |
  | phone | Bnc | 36 of 40 |
  | phone | B | 0 of 40 |
  | desktop | A | 35 of 40 |
  | desktop | Bnc | 38 of 40 |
  | desktop | B | 0 of 40 |

  With pre-navigation off, 0 of 240 rows mismatched. Every row with zero pre-FCP tasks is a mismatched row. So the A and Bnc trace figures with pre-navigation on (parse, CSS, tasks, the swap count) are withheld in §3.1.

  The FCP of every row is the page's own paint entry, and is valid. B's "no swap after pre-navigation" rests on its 80 matching rows.
- **A and B differ in more than COOP:** the security headers, `loading.tsx`, and the rest of the performance pass. So A against B is not a one-variable comparison. The one-variable comparison is B against Bnc.
