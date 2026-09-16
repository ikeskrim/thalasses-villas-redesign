# INP on `/en/the-estate`, with the 3D map active

Runs: 10 per scenario per profile; 20 trials per load-window offset; every scenario, profile and build has at least 10 valid runs. Lab only (see Limits).

Generated 2026-09-16T09:37:19.139Z by `node scripts/estate-inp.mjs`. Builds: **A** http://localhost:3005 (public build, gate closed, 2D); **B** http://localhost:3035 (review build, 3D). Order ABBA, a fresh context per trial.

## Calibration (CDP input behind a 300 ms busy loop)

| profile | input into the loop | expected input delay | measured input delay | result |
|---|---|---|---|---|
| phone | 61 ms | 240 ms | 300 ms | PASS: CDP input records queueing delay |

## GPU path

| profile | WebGL2 | vendor | renderer | software |
|---|---|---|---|---|
| phone | true | Google Inc. (Google) | ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver) | true |

## Fixed scenarios

INP per run is the worst interaction in that run. "<16 ms" counts runs whose interactions all stayed under Event Timing's 16 ms floor. Split = input delay / processing / presentation, in ms. The verdict is on the WORST run against 200 ms.

| profile | scenario | build | ok / lost / n/a / invalid / error | median INP | worst INP | runs <16 ms | median split | worst split | verdict |
|---|---|---|---|---|---|---|---|---|---|
| phone | place-open | A | 0 / 0 / 10 / 0 / 0 | — | — | 0 | — | — | not applicable |
| phone | place-open | B | 10 / 0 / 0 / 0 / 0 | 60 ms | 72 ms | 0 | 16 / 25 / 15 | 16 / 39 / 18 | pass |
| phone | keyboard | A | 0 / 0 / 10 / 0 / 0 | — | — | 0 | — | — | not applicable |
| phone | keyboard | B | 10 / 0 / 0 / 0 / 0 | 48 ms | 56 ms | 0 | 0 / 1 / 47 | 1 / 1 / 55 | pass |
| phone | visit | A | 0 / 0 / 10 / 0 / 0 | — | — | 0 | — | — | not applicable |
| phone | visit | B | 10 / 0 / 0 / 0 / 0 | 24 ms | 24 ms | 0 | 16 / 7 / 1 | 14 / 7 / 4 | pass |
| phone | list-link | A | 10 / 0 / 0 / 0 / 0 | 32 ms | 40 ms | 0 | 25 / 7 / 0 | 26 / 9 / 5 | pass |
| phone | list-link | B | 10 / 0 / 0 / 0 / 0 | 32 ms | 48 ms | 0 | 25 / 7 / 0 | 29 / 15 / 4 | pass |
| phone | canvas | A | 10 / 0 / 0 / 0 / 0 | 16 ms | 24 ms | 0 | 14 / 0 / 2 | 13 / 0 / 11 | pass |
| phone | canvas | B | 10 / 0 / 0 / 0 / 0 | 20 ms | 24 ms | 0 | 13 / 0 / 3 | 13 / 0 / 11 | pass |

## The load window

| profile | three.js chunk | transfer | decoded | scroll → loadingFinished (pin run) |
|---|---|---|---|---|
| phone | 04r_x7_oxlpca.js | 141576 B | 559796 B | 1241 ms |

### phone

The class covers each interaction from its first entry's start to its worst entry's dispatch (see the every-trial table for which entries those were). Invalid trials (an input the page never registered) are counted in the every-trial table only.

| offset | build | class (from the trace) | n | median INP | worst INP | <16 ms |
|---|---|---|---|---|---|---|
| +0 ms | A | outside | 18 | 16 ms | 24 ms | 0 |
| +0 ms | A | under 16 ms (no entry; the input was counted) | 2 | — | — | 2 |
| +0 ms | B | chunk-evaluate+first-render | 16 | 668 ms | 792 ms | 0 |
| +0 ms | B | chunk-evaluate | 1 | 136 ms | 136 ms | 0 |
| +0 ms | B | chunk-evaluate+other-task | 1 | 160 ms | 160 ms | 0 |
| +0 ms | B | chunk-evaluate+other-task+first-render | 1 | 736 ms | 736 ms | 0 |
| +0 ms | B | chunk-evaluate+first-render+other-task | 1 | 664 ms | 664 ms | 0 |
| +25 ms | A | outside | 20 | 16 ms | 40 ms | 0 |
| +25 ms | B | chunk-evaluate+other-task+first-render | 10 | 736 ms | 928 ms | 0 |
| +25 ms | B | chunk-evaluate+other-task | 3 | 152 ms | 184 ms | 0 |
| +25 ms | B | chunk-evaluate+first-render+other-task | 1 | 608 ms | 608 ms | 0 |
| +25 ms | B | chunk-evaluate+first-render | 4 | 672 ms | 736 ms | 0 |
| +25 ms | B | chunk-evaluate | 2 | 116 ms | 120 ms | 0 |
| +50 ms | A | outside | 20 | 16 ms | 24 ms | 0 |
| +50 ms | B | chunk-evaluate+first-render | 9 | 624 ms | 680 ms | 0 |
| +50 ms | B | other-task+first-render | 1 | 752 ms | 752 ms | 0 |
| +50 ms | B | chunk-evaluate+other-task+first-render | 8 | 704 ms | 752 ms | 0 |
| +50 ms | B | chunk-evaluate | 1 | 80 ms | 80 ms | 0 |
| +50 ms | B | chunk-evaluate+other-task | 1 | 120 ms | 120 ms | 0 |
| +75 ms | A | outside | 20 | 16 ms | 24 ms | 0 |
| +75 ms | B | chunk-evaluate+other-task+first-render | 2 | 712 ms | 720 ms | 0 |
| +75 ms | B | other-task+first-render | 7 | 640 ms | 752 ms | 0 |
| +75 ms | B | first-render+other-task | 5 | 576 ms | 640 ms | 0 |
| +75 ms | B | chunk-evaluate+first-render | 1 | 648 ms | 648 ms | 0 |
| +75 ms | B | chunk-evaluate+other-task | 5 | 104 ms | 128 ms | 0 |
| +100 ms | A | outside | 20 | 16 ms | 24 ms | 0 |
| +100 ms | B | first-render+other-task | 11 | 568 ms | 728 ms | 0 |
| +100 ms | B | other-task+first-render | 8 | 700 ms | 776 ms | 0 |
| +100 ms | B | chunk-evaluate+other-task | 1 | 128 ms | 128 ms | 0 |
| +150 ms | A | outside | 18 | 16 ms | 24 ms | 0 |
| +150 ms | A | under 16 ms (no entry; the input was counted) | 2 | — | — | 2 |
| +150 ms | B | other-task+first-render | 3 | 680 ms | 848 ms | 0 |
| +150 ms | B | first-render+other-task | 17 | 504 ms | 600 ms | 0 |
| +200 ms | A | outside | 19 | 16 ms | 24 ms | 0 |
| +200 ms | A | under 16 ms (no entry; the input was counted) | 1 | — | — | 1 |
| +200 ms | B | first-render+other-task | 19 | 472 ms | 736 ms | 0 |
| +200 ms | B | other-task+first-render | 1 | 640 ms | 640 ms | 0 |
| +250 ms | A | outside | 20 | 16 ms | 24 ms | 0 |
| +250 ms | B | first-render+other-task | 20 | 552 ms | 736 ms | 0 |
| +300 ms | A | outside | 20 | 24 ms | 40 ms | 0 |
| +300 ms | B | first-render+other-task | 20 | 676 ms | 840 ms | 0 |
| +400 ms | A | outside | 20 | 24 ms | 32 ms | 0 |
| +400 ms | B | first-render+other-task | 20 | 312 ms | 648 ms | 0 |

## Every trial, in the order measured

| # | profile | scenario | build | status | INP | worst interaction | split | dispatched / recorded / <16 | interactionCount Δ | notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | phone | place-open | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width (the 2D markers are hidden below 768 px) |
| 2 | phone | place-open | B | ok | 48 ms | click on `span.tabular.estate-map-3d-index` | 15 / 22 / 12 | 1 / 1 / 0 | 1 | 3d; card opened |
| 3 | phone | place-open | B | ok | 56 ms | click on `span.tabular.estate-map-3d-index` | 15 / 26 / 16 | 1 / 1 / 0 | 1 | 3d; card opened |
| 4 | phone | place-open | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width (the 2D markers are hidden below 768 px) |
| 5 | phone | place-open | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width (the 2D markers are hidden below 768 px) |
| 6 | phone | place-open | B | ok | 56 ms | click on `span.tabular.estate-map-3d-index` | 17 / 27 / 13 | 1 / 1 / 0 | 1 | 3d; card opened |
| 7 | phone | place-open | B | ok | 72 ms | click on `span.tabular.estate-map-3d-index` | 16 / 39 / 18 | 1 / 1 / 0 | 1 | 3d; card opened |
| 8 | phone | place-open | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width (the 2D markers are hidden below 768 px) |
| 9 | phone | place-open | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width (the 2D markers are hidden below 768 px) |
| 10 | phone | place-open | B | ok | 64 ms | click on `span.tabular.estate-map-3d-index` | 16 / 34 / 15 | 1 / 1 / 0 | 1 | 3d; card opened |
| 11 | phone | place-open | B | ok | 64 ms | click on `span.tabular.estate-map-3d-index` | 17 / 29 / 18 | 1 / 1 / 0 | 1 | 3d; card opened |
| 12 | phone | place-open | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width (the 2D markers are hidden below 768 px) |
| 13 | phone | place-open | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width (the 2D markers are hidden below 768 px) |
| 14 | phone | place-open | B | ok | 56 ms | pointerup+click on `span.tabular.estate-map-3d-index` | 19 / 22 / 16 | 1 / 1 / 0 | 1 | 3d; card opened |
| 15 | phone | place-open | B | ok | 64 ms | pointerdown+pointerup+click on `span.tabular.estate-map-3d-index` | 18 / 29 / 17 | 1 / 1 / 0 | 1 | 3d; card opened |
| 16 | phone | place-open | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width (the 2D markers are hidden below 768 px) |
| 17 | phone | place-open | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width (the 2D markers are hidden below 768 px) |
| 18 | phone | place-open | B | ok | 56 ms | click on `span.tabular.estate-map-3d-index` | 16 / 25 / 15 | 1 / 1 / 0 | 1 | 3d; card opened |
| 19 | phone | place-open | B | ok | 64 ms | pointerdown+pointerup+click on `span.tabular.estate-map-3d-index` | 20 / 28 / 16 | 1 / 1 / 0 | 1 | 3d; card opened |
| 20 | phone | place-open | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width (the 2D markers are hidden below 768 px) |
| 21 | phone | keyboard | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width |
| 22 | phone | keyboard | B | ok | 48 ms | keydown+keypress+click+keyup on `button.estate-map-3d-button.is-open` | 0 / 0 / 47 | 3 / 3 / 0 | 3 | 3d; Tab reached the first place; Enter opened |
| 23 | phone | keyboard | B | ok | 48 ms | keydown+keypress+click+keyup on `button.estate-map-3d-button.is-open` | 0 / 1 / 47 | 3 / 2 / 1 | 3 | 3d; Tab reached the first place; Enter opened |
| 24 | phone | keyboard | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width |
| 25 | phone | keyboard | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width |
| 26 | phone | keyboard | B | ok | 48 ms | keydown+keypress+click+keyup on `button.estate-map-3d-button.is-open` | 1 / 1 / 47 | 3 / 3 / 0 | 3 | 3d; Tab reached the first place; Enter opened |
| 27 | phone | keyboard | B | ok | 48 ms | keydown+keypress+click+keyup on `button.estate-map-3d-button.is-open` | 1 / 1 / 47 | 3 / 3 / 0 | 3 | 3d; Tab reached the first place; Enter opened |
| 28 | phone | keyboard | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width |
| 29 | phone | keyboard | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width |
| 30 | phone | keyboard | B | ok | 56 ms | keydown+keypress+click+keyup on `button.estate-map-3d-button.is-open` | 1 / 1 / 55 | 3 / 3 / 0 | 3 | 3d; Tab reached the first place; Enter opened |
| 31 | phone | keyboard | B | ok | 56 ms | keydown+keypress+click+keyup on `button.estate-map-3d-button.is-open` | 1 / 1 / 55 | 3 / 3 / 0 | 3 | 3d; Tab reached the first place; Enter opened |
| 32 | phone | keyboard | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width |
| 33 | phone | keyboard | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width |
| 34 | phone | keyboard | B | ok | 48 ms | keydown+keypress+click+keyup on `button.estate-map-3d-button.is-open` | 1 / 1 / 47 | 3 / 2 / 1 | 3 | 3d; Tab reached the first place; Enter opened |
| 35 | phone | keyboard | B | ok | 40 ms | keydown+keypress+click+keyup on `button.estate-map-3d-button.is-open` | 0 / 1 / 39 | 3 / 2 / 1 | 3 | 3d; Tab reached the first place; Enter opened |
| 36 | phone | keyboard | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width |
| 37 | phone | keyboard | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width |
| 38 | phone | keyboard | B | ok | 40 ms | keydown+keypress+click+keyup on `button.estate-map-3d-button.is-open` | 1 / 1 / 39 | 3 / 3 / 0 | 3 | 3d; Tab reached the first place; Enter opened |
| 39 | phone | keyboard | B | ok | 40 ms | keydown+keypress+click+keyup on `button.estate-map-3d-button.is-open` | 1 / 0 / 39 | 3 / 3 / 0 | 3 | 3d; Tab reached the first place; Enter opened |
| 40 | phone | keyboard | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width |
| 41 | phone | visit | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width |
| 42 | phone | visit | B | ok | 24 ms | click on `a.micro.estate-map-card-link` | 14 / 7 / 4 | 1 / 1 / 0 | 1 | 3d; Visit → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 43 | phone | visit | B | ok | 24 ms | click on `a.micro.estate-map-card-link` | 15 / 7 / 3 | 1 / 1 / 0 | 1 | 3d; Visit → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 44 | phone | visit | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width |
| 45 | phone | visit | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width |
| 46 | phone | visit | B | ok | 24 ms | pointerdown+pointerup+click on `a.micro.estate-map-card-link` | 17 / 6 / 1 | 1 / 1 / 0 | 1 | 3d; Visit → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 47 | phone | visit | B | ok | 24 ms | pointerdown+pointerup+click on `a.micro.estate-map-card-link` | 15 / 6 / 3 | 1 / 1 / 0 | 1 | 3d; Visit → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 48 | phone | visit | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width |
| 49 | phone | visit | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width |
| 50 | phone | visit | B | ok | 24 ms | click on `a.micro.estate-map-card-link` | 16 / 7 / 1 | 1 / 1 / 0 | 1 | 3d; Visit → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 51 | phone | visit | B | ok | 24 ms | click on `a.micro.estate-map-card-link` | 12 / 8 / 4 | 1 / 1 / 0 | 1 | 3d; Visit → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 52 | phone | visit | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width |
| 53 | phone | visit | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width |
| 54 | phone | visit | B | ok | 24 ms | pointerdown+pointerup+click on `a.micro.estate-map-card-link` | 16 / 8 / 0 | 1 / 1 / 0 | 1 | 3d; Visit → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 55 | phone | visit | B | ok | 24 ms | click on `a.micro.estate-map-card-link` | 15 / 10 / 0 | 1 / 1 / 0 | 1 | 3d; Visit → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 56 | phone | visit | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width |
| 57 | phone | visit | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width |
| 58 | phone | visit | B | ok | 24 ms | click on `a.micro.estate-map-card-link` | 12 / 7 / 4 | 1 / 1 / 0 | 1 | 3d; Visit → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 59 | phone | visit | B | ok | 24 ms | click on `a.micro.estate-map-card-link` | 15 / 11 / 0 | 1 / 1 / 0 | 1 | 3d; Visit → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 60 | phone | visit | A | n/a | — | — | — | — / — / — | — | 2d; no visible place control at this width |
| 61 | phone | list-link | A | ok | 32 ms | pointerdown+pointerup+click on `a` | 27 / 7 / 0 | 1 / 1 / 0 | 1 | 2d; list → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 62 | phone | list-link | B | ok | 32 ms | click on `a` | 20 / 7 / 5 | 1 / 1 / 0 | 1 | 3d; list → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 63 | phone | list-link | B | ok | 48 ms | click on `a` | 29 / 15 / 4 | 1 / 1 / 0 | 1 | 3d; list → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 64 | phone | list-link | A | ok | 32 ms | pointerdown+pointerup+click on `a` | 26 / 7 / 0 | 1 / 1 / 0 | 1 | 2d; list → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 65 | phone | list-link | A | ok | 32 ms | click on `a` | 22 / 9 / 2 | 1 / 1 / 0 | 1 | 2d; list → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 66 | phone | list-link | B | ok | 32 ms | pointerdown+pointerup+click on `a` | 25 / 7 / 1 | 1 / 1 / 0 | 1 | 3d; list → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 67 | phone | list-link | B | ok | 32 ms | pointerdown+pointerup+click on `a` | 23 / 7 / 2 | 1 / 1 / 0 | 1 | 3d; list → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 68 | phone | list-link | A | ok | 32 ms | pointerdown+pointerup+click on `a` | 25 / 8 / 0 | 1 / 1 / 0 | 1 | 2d; list → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 69 | phone | list-link | A | ok | 40 ms | pointerdown+pointerup+click on `a` | 26 / 9 / 5 | 1 / 1 / 0 | 1 | 2d; list → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 70 | phone | list-link | B | ok | 32 ms | pointerdown+pointerup+click on `a` | 24 / 6 / 3 | 1 / 1 / 0 | 1 | 3d; list → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 71 | phone | list-link | B | ok | 40 ms | pointerdown+pointerup+click on `a` | 29 / 9 / 2 | 1 / 1 / 0 | 1 | 3d; list → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 72 | phone | list-link | A | ok | 32 ms | pointerdown+pointerup+click on `a` | 25 / 7 / 0 | 1 / 1 / 0 | 1 | 2d; list → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 73 | phone | list-link | A | ok | 32 ms | pointerdown+pointerup+click on `a` | 25 / 7 / 0 | 1 / 1 / 0 | 1 | 2d; list → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 74 | phone | list-link | B | ok | 32 ms | pointerdown+pointerup+click on `a` | 25 / 7 / 0 | 1 / 1 / 0 | 1 | 3d; list → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 75 | phone | list-link | B | ok | 32 ms | pointerdown+pointerup+click on `a` | 23 / 7 / 2 | 1 / 1 / 0 | 1 | 3d; list → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 76 | phone | list-link | A | ok | 32 ms | pointerdown+pointerup+click on `a` | 25 / 8 / 0 | 1 / 1 / 0 | 1 | 2d; list → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 77 | phone | list-link | A | ok | 32 ms | pointerdown+pointerup+click on `a` | 27 / 6 / 0 | 1 / 1 / 0 | 1 | 2d; list → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 78 | phone | list-link | B | ok | 40 ms | pointerup+click on `a` | 26 / 10 / 4 | 1 / 1 / 0 | 1 | 3d; list → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 79 | phone | list-link | B | ok | 32 ms | pointerup+click on `a` | 24 / 7 / 2 | 1 / 1 / 0 | 1 | 3d; list → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 80 | phone | list-link | A | ok | 32 ms | click on `a` | 22 / 8 / 3 | 1 / 1 / 0 | 1 | 2d; list → /en/villas/villa-thoi; → /en/villas/villa-thoi |
| 81 | phone | canvas | A | ok | 24 ms | click on `img` | 13 / 0 / 11 | 1 / 1 / 0 | 1 | 2d |
| 82 | phone | canvas | B | ok | 24 ms | click on `canvas.estate-map-3d-canvas` | 13 / 0 / 11 | 1 / 1 / 0 | 1 | 3d |
| 83 | phone | canvas | B | ok | 16 ms | click on `canvas.estate-map-3d-canvas` | 12 / 0 / 3 | 1 / 1 / 0 | 1 | 3d |
| 84 | phone | canvas | A | ok | 16 ms | click on `img` | 14 / 0 / 2 | 1 / 1 / 0 | 1 | 2d |
| 85 | phone | canvas | A | ok | 16 ms | click on `img` | 11 / 0 / 5 | 1 / 1 / 0 | 1 | 2d |
| 86 | phone | canvas | B | ok | 24 ms | click on `canvas.estate-map-3d-canvas` | 14 / 0 / 10 | 1 / 1 / 0 | 1 | 3d |
| 87 | phone | canvas | B | ok | 24 ms | click on `canvas.estate-map-3d-canvas` | 14 / 0 / 10 | 1 / 1 / 0 | 1 | 3d |
| 88 | phone | canvas | A | ok | 24 ms | click on `img` | 13 / 0 / 11 | 1 / 1 / 0 | 1 | 2d |
| 89 | phone | canvas | A | ok | 16 ms | click on `img` | 13 / 0 / 3 | 1 / 1 / 0 | 1 | 2d |
| 90 | phone | canvas | B | ok | 16 ms | click on `canvas.estate-map-3d-canvas` | 11 / 0 / 5 | 1 / 1 / 0 | 1 | 3d |
| 91 | phone | canvas | B | ok | 24 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 15 / 0 / 9 | 1 / 1 / 0 | 1 | 3d |
| 92 | phone | canvas | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 17 / 0 / 7 | 1 / 1 / 0 | 1 | 2d |
| 93 | phone | canvas | A | ok | 24 ms | click on `img` | 13 / 0 / 11 | 1 / 1 / 0 | 1 | 2d |
| 94 | phone | canvas | B | ok | 24 ms | pointerup+click on `canvas.estate-map-3d-canvas` | 15 / 0 / 9 | 1 / 1 / 0 | 1 | 3d |
| 95 | phone | canvas | B | ok | 16 ms | click on `canvas.estate-map-3d-canvas` | 11 / 0 / 5 | 1 / 1 / 0 | 1 | 3d |
| 96 | phone | canvas | A | ok | 16 ms | click on `img` | 11 / 0 / 5 | 1 / 1 / 0 | 1 | 2d |
| 97 | phone | canvas | A | ok | 16 ms | click on `img` | 14 / 0 / 2 | 1 / 1 / 0 | 1 | 2d |
| 98 | phone | canvas | B | ok | 16 ms | click on `canvas.estate-map-3d-canvas` | 13 / 0 / 3 | 1 / 1 / 0 | 1 | 3d |
| 99 | phone | canvas | B | ok | 16 ms | click on `canvas.estate-map-3d-canvas` | 13 / 0 / 3 | 1 / 1 / 0 | 1 | 3d |
| 100 | phone | canvas | A | ok | 16 ms | click on `img` | 12 / 0 / 4 | 1 / 1 / 0 | 1 | 2d |
| 101 | phone | load-window +0 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 20 / 0 / 4 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 102 | phone | load-window +0 ms | B | ok | 720 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 578 / 1 / 141 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 103 | phone | load-window +0 ms | B | ok | 640 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 507 / 0 / 132 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 104 | phone | load-window +0 ms | A | ok | 16 ms | click on `img` | 11 / 0 / 5 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 105 | phone | load-window +0 ms | A | ok | 16 ms | click on `img` | 12 / 0 / 4 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 106 | phone | load-window +0 ms | B | ok | 136 ms | pointerdown+pointerup+click on `div.estate-map-frame.estate-map-frame--3d` | 135 / 0 / 1 | 1 / 1 / 0 | 1 | chunk-evaluate; class over pointerdown start → click dispatch; three.js loadingFinished |
| 107 | phone | load-window +0 ms | B | ok | 736 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 588 / 1 / 147 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 108 | phone | load-window +0 ms | A | ok | 16 ms | click on `img` | 14 / 0 / 1 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 109 | phone | load-window +0 ms | A | ok | 16 ms | click on `img` | 14 / 0 / 1 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 110 | phone | load-window +0 ms | B | ok | 680 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 542 / 0 / 138 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 111 | phone | load-window +0 ms | B | ok | 736 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 581 / 1 / 154 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 112 | phone | load-window +0 ms | A | ok | 16 ms | click on `img` | 14 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 113 | phone | load-window +0 ms | A | ok | 16 ms | click on `img` | 18 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 114 | phone | load-window +0 ms | B | ok | 160 ms | pointerdown+pointerup+click on `div.estate-map-frame.estate-map-frame--3d` | 144 / 1 / 15 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 115 | phone | load-window +0 ms | B | ok | 624 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 493 / 0 / 131 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 116 | phone | load-window +0 ms | A | ok | 16 ms | click on `img` | 14 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 117 | phone | load-window +0 ms | A | ok | 16 ms | click on `img` | 15 / 1 / 1 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 118 | phone | load-window +0 ms | B | ok | 672 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 537 / 1 / 134 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 119 | phone | load-window +0 ms | B | ok | 712 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 565 / 1 / 146 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 120 | phone | load-window +0 ms | A | ok | 16 ms | click on `img` | 15 / 0 / 1 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 121 | phone | load-window +0 ms | A | ok | 16 ms | click on `img` | 12 / 0 / 3 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 122 | phone | load-window +0 ms | B | ok | 616 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 487 / 0 / 129 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 123 | phone | load-window +0 ms | B | ok | 704 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 556 / 1 / 148 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 124 | phone | load-window +0 ms | A | ok | 16 ms | click on `img` | 13 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 125 | phone | load-window +0 ms | A | ok | 16 ms | click on `img` | 14 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 126 | phone | load-window +0 ms | B | ok | 736 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 587 / 0 / 149 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 127 | phone | load-window +0 ms | B | ok | 792 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 628 / 1 / 163 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 128 | phone | load-window +0 ms | A | ok | 16 ms | click on `img` | 17 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 129 | phone | load-window +0 ms | A | ok | 16 ms | click on `img` | 14 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 130 | phone | load-window +0 ms | B | ok | 616 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 483 / 1 / 132 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 131 | phone | load-window +0 ms | B | ok | 584 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 455 / 0 / 129 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 132 | phone | load-window +0 ms | A | ok | <16 ms | — | — | 1 / 0 / 1 | 1 | under 16 ms (no entry; the input was counted); scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 133 | phone | load-window +0 ms | A | ok | <16 ms | — | — | 1 / 0 / 1 | 1 | under 16 ms (no entry; the input was counted); scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 134 | phone | load-window +0 ms | B | ok | 592 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 455 / 1 / 137 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 135 | phone | load-window +0 ms | B | ok | 632 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 502 / 0 / 130 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 136 | phone | load-window +0 ms | A | ok | 16 ms | click on `img` | 12 / 0 / 4 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 137 | phone | load-window +0 ms | A | ok | 16 ms | pointerdown+pointerup+click on `img` | 8 / 1 / 7 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → pointerdown dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 138 | phone | load-window +0 ms | B | ok | 664 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 528 / 0 / 135 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 139 | phone | load-window +0 ms | B | ok | 664 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 651 / 0 / 13 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 140 | phone | load-window +0 ms | A | ok | 16 ms | click on `img` | 15 / 0 / 1 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 141 | phone | load-window +25 ms | A | ok | 16 ms | click on `img` | 15 / 0 / 1 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 142 | phone | load-window +25 ms | B | ok | 704 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 548 / 1 / 155 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 143 | phone | load-window +25 ms | B | ok | 752 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 601 / 0 / 151 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 144 | phone | load-window +25 ms | A | ok | 32 ms | pointerdown+pointerup+click on `img` | 28 / 1 / 4 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 145 | phone | load-window +25 ms | A | ok | 16 ms | pointerup+click on `img` | 10 / 1 / 5 | 1 / 1 / 0 | 1 | outside; class over pointerup start → pointerup dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 146 | phone | load-window +25 ms | B | ok | 752 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 606 / 1 / 146 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 147 | phone | load-window +25 ms | B | ok | 184 ms | pointerdown+pointerup+click on `div.estate-map-frame.estate-map-frame--3d` | 185 / 1 / 0 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 148 | phone | load-window +25 ms | A | ok | 24 ms | pointerup+click on `img` | 21 / 1 / 2 | 1 / 1 / 0 | 1 | outside; class over pointerup start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 149 | phone | load-window +25 ms | A | ok | 40 ms | pointerdown+pointerup+click on `img` | 38 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 150 | phone | load-window +25 ms | B | ok | 608 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 600 / 1 / 7 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 151 | phone | load-window +25 ms | B | ok | 928 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 746 / 1 / 181 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 152 | phone | load-window +25 ms | A | ok | 16 ms | click on `img` | 15 / 0 / 1 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 153 | phone | load-window +25 ms | A | ok | 24 ms | pointerup+click on `img` | 23 / 1 / 1 | 1 / 1 / 0 | 1 | outside; class over pointerup start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 154 | phone | load-window +25 ms | B | ok | 776 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 770 / 1 / 6 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task+first-render; class over pointerdown start → click dispatch; three.js loadingFinished |
| 155 | phone | load-window +25 ms | B | ok | 672 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 518 / 1 / 153 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 156 | phone | load-window +25 ms | A | ok | 16 ms | click on `img` | 14 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 157 | phone | load-window +25 ms | A | ok | 16 ms | click on `img` | 17 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 158 | phone | load-window +25 ms | B | ok | 712 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 565 / 1 / 146 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 159 | phone | load-window +25 ms | B | ok | 112 ms | pointerdown+pointerup+click on `div.estate-map-frame.estate-map-frame--3d` | 108 / 0 / 3 | 1 / 1 / 0 | 1 | chunk-evaluate; class over pointerdown start → click dispatch; three.js loadingFinished |
| 160 | phone | load-window +25 ms | A | ok | 16 ms | click on `img` | 14 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 161 | phone | load-window +25 ms | A | ok | 16 ms | click on `img` | 15 / 0 / 1 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 162 | phone | load-window +25 ms | B | ok | 688 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 551 / 1 / 136 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 163 | phone | load-window +25 ms | B | ok | 120 ms | pointerdown+pointerup+click on `div.estate-map-frame.estate-map-frame--3d` | 117 / 0 / 3 | 1 / 1 / 0 | 1 | chunk-evaluate; class over pointerdown start → click dispatch; three.js loadingFinished |
| 164 | phone | load-window +25 ms | A | ok | 16 ms | click on `img` | 17 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 165 | phone | load-window +25 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 21 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 166 | phone | load-window +25 ms | B | ok | 648 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 497 / 1 / 150 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 167 | phone | load-window +25 ms | B | ok | 720 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 574 / 0 / 145 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 168 | phone | load-window +25 ms | A | ok | 16 ms | click on `img` | 11 / 0 / 5 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 169 | phone | load-window +25 ms | A | ok | 16 ms | click on `img` | 13 / 0 / 3 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 170 | phone | load-window +25 ms | B | ok | 672 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 507 / 0 / 165 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 171 | phone | load-window +25 ms | B | ok | 672 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 536 / 0 / 136 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 172 | phone | load-window +25 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 22 / 0 / 1 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 173 | phone | load-window +25 ms | A | ok | 16 ms | click on `img` | 17 / 1 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 174 | phone | load-window +25 ms | B | ok | 736 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 579 / 1 / 156 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 175 | phone | load-window +25 ms | B | ok | 120 ms | pointerdown+pointerup+click on `div.estate-map-frame.estate-map-frame--3d` | 118 / 0 / 1 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 176 | phone | load-window +25 ms | A | ok | 24 ms | pointerup+click on `img` | 20 / 0 / 3 | 1 / 1 / 0 | 1 | outside; class over pointerup start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 177 | phone | load-window +25 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 22 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 178 | phone | load-window +25 ms | B | ok | 152 ms | pointerdown+pointerup+click on `div.estate-map-frame.estate-map-frame--3d` | 148 / 0 / 3 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 179 | phone | load-window +25 ms | B | ok | 784 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 622 / 2 / 161 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 180 | phone | load-window +25 ms | A | ok | 16 ms | click on `img` | 13 / 0 / 3 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 181 | phone | load-window +50 ms | A | ok | 16 ms | click on `img` | 16 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 182 | phone | load-window +50 ms | B | ok | 648 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 493 / 0 / 155 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 183 | phone | load-window +50 ms | B | ok | 752 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 750 / 1 / 2 | 1 / 1 / 0 | 1 | other-task+first-render; class over pointerdown start → click dispatch; three.js loadingFinished |
| 184 | phone | load-window +50 ms | A | ok | 16 ms | click on `img` | 17 / 1 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 185 | phone | load-window +50 ms | A | ok | 16 ms | click on `img` | 16 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 186 | phone | load-window +50 ms | B | ok | 608 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 483 / 0 / 124 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 187 | phone | load-window +50 ms | B | ok | 720 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 550 / 1 / 169 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 188 | phone | load-window +50 ms | A | ok | 16 ms | click on `img` | 12 / 0 / 4 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 189 | phone | load-window +50 ms | A | ok | 16 ms | click on `img` | 18 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 190 | phone | load-window +50 ms | B | ok | 624 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 487 / 1 / 136 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 191 | phone | load-window +50 ms | B | ok | 80 ms | pointerdown+pointerup+click on `null` | 77 / 1 / 3 | 1 / 1 / 0 | 1 | chunk-evaluate; class over pointerdown start → click dispatch; three.js loadingFinished |
| 192 | phone | load-window +50 ms | A | ok | 16 ms | click on `img` | 14 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 193 | phone | load-window +50 ms | A | ok | 16 ms | click on `img` | 14 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 194 | phone | load-window +50 ms | B | ok | 704 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 554 / 0 / 150 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 195 | phone | load-window +50 ms | B | ok | 680 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 535 / 1 / 145 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 196 | phone | load-window +50 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 22 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 197 | phone | load-window +50 ms | A | ok | 16 ms | click on `img` | 16 / 1 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 198 | phone | load-window +50 ms | B | ok | 752 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 592 / 1 / 159 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 199 | phone | load-window +50 ms | B | ok | 640 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 488 / 1 / 151 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 200 | phone | load-window +50 ms | A | ok | 16 ms | pointerdown+pointerup+click on `img` | 10 / 0 / 6 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → pointerdown dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 201 | phone | load-window +50 ms | A | ok | 16 ms | click on `img` | 12 / 2 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 202 | phone | load-window +50 ms | B | ok | 584 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 433 / 0 / 150 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 203 | phone | load-window +50 ms | B | ok | 608 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 470 / 1 / 137 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 204 | phone | load-window +50 ms | A | ok | 16 ms | click on `img` | 13 / 0 / 3 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 205 | phone | load-window +50 ms | A | ok | 24 ms | click on `img` | 21 / 0 / 3 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 206 | phone | load-window +50 ms | B | ok | 616 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 452 / 1 / 163 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 207 | phone | load-window +50 ms | B | ok | 752 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 603 / 1 / 148 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 208 | phone | load-window +50 ms | A | ok | 16 ms | click on `img` | 15 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 209 | phone | load-window +50 ms | A | ok | 16 ms | pointerdown+pointerup+click on `img` | 10 / 0 / 6 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → pointerdown dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 210 | phone | load-window +50 ms | B | ok | 592 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 448 / 0 / 144 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 211 | phone | load-window +50 ms | B | ok | 680 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 522 / 0 / 158 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 212 | phone | load-window +50 ms | A | ok | 16 ms | click on `img` | 15 / 1 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 213 | phone | load-window +50 ms | A | ok | 16 ms | click on `img` | 13 / 0 / 3 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 214 | phone | load-window +50 ms | B | ok | 632 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 493 / 1 / 138 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 215 | phone | load-window +50 ms | B | ok | 120 ms | pointerdown+pointerup+click on `div.estate-map-frame.estate-map-frame--3d` | 117 / 0 / 2 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 216 | phone | load-window +50 ms | A | ok | 24 ms | click on `img` | 19 / 0 / 5 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 217 | phone | load-window +50 ms | A | ok | 16 ms | click on `img` | 13 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 218 | phone | load-window +50 ms | B | ok | 704 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 547 / 1 / 157 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 219 | phone | load-window +50 ms | B | ok | 664 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 515 / 0 / 149 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 220 | phone | load-window +50 ms | A | ok | 16 ms | click on `img` | 18 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 221 | phone | load-window +75 ms | A | ok | 16 ms | click on `img` | 16 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 222 | phone | load-window +75 ms | B | ok | 704 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 555 / 1 / 148 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 223 | phone | load-window +75 ms | B | ok | 712 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 712 / 0 / 0 | 1 / 1 / 0 | 1 | other-task+first-render; class over pointerdown start → click dispatch; three.js loadingFinished |
| 224 | phone | load-window +75 ms | A | ok | 16 ms | pointerup+click on `img` | 12 / 0 / 4 | 1 / 1 / 0 | 1 | outside; class over pointerup start → pointerup dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 225 | phone | load-window +75 ms | A | ok | 16 ms | pointerdown+pointerup+click on `img` | 7 / 1 / 9 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → pointerdown dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 226 | phone | load-window +75 ms | B | ok | 576 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 576 / 0 / 0 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 227 | phone | load-window +75 ms | B | ok | 624 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 622 / 0 / 2 | 1 / 1 / 0 | 1 | other-task+first-render; class over pointerdown start → click dispatch; three.js loadingFinished |
| 228 | phone | load-window +75 ms | A | ok | 16 ms | click on `img` | 12 / 0 / 4 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 229 | phone | load-window +75 ms | A | ok | 16 ms | click on `img` | 16 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 230 | phone | load-window +75 ms | B | ok | 616 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 614 / 0 / 2 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 231 | phone | load-window +75 ms | B | ok | 640 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 636 / 0 / 4 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 232 | phone | load-window +75 ms | A | ok | 16 ms | click on `img` | 16 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 233 | phone | load-window +75 ms | A | ok | 16 ms | click on `img` | 13 / 0 / 3 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 234 | phone | load-window +75 ms | B | ok | 640 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 637 / 0 / 3 | 1 / 1 / 0 | 1 | other-task+first-render; class over pointerdown start → click dispatch; three.js loadingFinished |
| 235 | phone | load-window +75 ms | B | ok | 648 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 510 / 1 / 137 | 1 / 1 / 0 | 1 | chunk-evaluate+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 236 | phone | load-window +75 ms | A | ok | 16 ms | pointerdown+pointerup+click on `img` | 8 / 1 / 8 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → pointerdown dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 237 | phone | load-window +75 ms | A | ok | 16 ms | click on `img` | 17 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 238 | phone | load-window +75 ms | B | ok | 576 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 577 / 0 / 0 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 239 | phone | load-window +75 ms | B | ok | 544 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 541 / 0 / 3 | 1 / 1 / 0 | 1 | other-task+first-render; class over pointerdown start → click dispatch; three.js loadingFinished |
| 240 | phone | load-window +75 ms | A | ok | 16 ms | click on `img` | 14 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 241 | phone | load-window +75 ms | A | ok | 16 ms | click on `img` | 16 / 1 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 242 | phone | load-window +75 ms | B | ok | 104 ms | pointerdown+pointerup+click on `div.estate-map-frame.estate-map-frame--3d` | 98 / 1 / 5 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 243 | phone | load-window +75 ms | B | ok | 96 ms | pointerdown+pointerup+click on `div.estate-map-frame.estate-map-frame--3d` | 96 / 0 / 0 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 244 | phone | load-window +75 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 24 / 1 / 0 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 245 | phone | load-window +75 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 22 / 1 / 1 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 246 | phone | load-window +75 ms | B | ok | 720 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 541 / 0 / 179 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 247 | phone | load-window +75 ms | B | ok | 752 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 746 / 1 / 5 | 1 / 1 / 0 | 1 | other-task+first-render; class over pointerdown start → click dispatch; three.js loadingFinished |
| 248 | phone | load-window +75 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 19 / 0 / 5 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 249 | phone | load-window +75 ms | A | ok | 16 ms | click on `img` | 15 / 0 / 1 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 250 | phone | load-window +75 ms | B | ok | 104 ms | pointerdown+pointerup+click on `div.estate-map-frame.estate-map-frame--3d` | 101 / 1 / 2 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 251 | phone | load-window +75 ms | B | ok | 560 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 555 / 0 / 5 | 1 / 1 / 0 | 1 | other-task+first-render; class over pointerdown start → pointerup dispatch; three.js loadingFinished |
| 252 | phone | load-window +75 ms | A | ok | 16 ms | click on `img` | 17 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 253 | phone | load-window +75 ms | A | ok | 16 ms | click on `img` | 14 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 254 | phone | load-window +75 ms | B | ok | 640 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 640 / 1 / 0 | 1 / 1 / 0 | 1 | other-task+first-render; class over pointerdown start → click dispatch; three.js loadingFinished |
| 255 | phone | load-window +75 ms | B | ok | 88 ms | pointerdown+pointerup+click on `div.estate-map-frame.estate-map-frame--3d` | 82 / 0 / 5 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 256 | phone | load-window +75 ms | A | ok | 16 ms | click on `img` | 13 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 257 | phone | load-window +75 ms | A | ok | 16 ms | click on `img` | 15 / 0 / 1 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 258 | phone | load-window +75 ms | B | ok | 128 ms | pointerdown+pointerup+click on `div.estate-map-frame.estate-map-frame--3d` | 128 / 1 / 0 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 259 | phone | load-window +75 ms | B | ok | 520 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 519 / 0 / 1 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 260 | phone | load-window +75 ms | A | ok | 16 ms | click on `img` | 13 / 0 / 3 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 261 | phone | load-window +100 ms | A | ok | 16 ms | click on `img` | 14 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 262 | phone | load-window +100 ms | B | ok | 488 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 484 / 1 / 4 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 263 | phone | load-window +100 ms | B | ok | 696 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 690 / 0 / 5 | 1 / 1 / 0 | 1 | other-task+first-render; class over pointerdown start → click dispatch; three.js loadingFinished |
| 264 | phone | load-window +100 ms | A | ok | 16 ms | click on `img` | 15 / 0 / 1 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 265 | phone | load-window +100 ms | A | ok | 16 ms | click on `img` | 13 / 0 / 3 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 266 | phone | load-window +100 ms | B | ok | 520 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 519 / 0 / 1 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 267 | phone | load-window +100 ms | B | ok | 776 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 775 / 0 / 1 | 1 / 1 / 0 | 1 | other-task+first-render; class over pointerdown start → click dispatch; three.js loadingFinished |
| 268 | phone | load-window +100 ms | A | ok | 16 ms | click on `img` | 14 / 0 / 1 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 269 | phone | load-window +100 ms | A | ok | 24 ms | pointerup+click on `img` | 22 / 1 / 2 | 1 / 1 / 0 | 1 | outside; class over pointerup start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 270 | phone | load-window +100 ms | B | ok | 776 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 770 / 0 / 6 | 1 / 1 / 0 | 1 | other-task+first-render; class over pointerdown start → click dispatch; three.js loadingFinished |
| 271 | phone | load-window +100 ms | B | ok | 584 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 577 / 0 / 7 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 272 | phone | load-window +100 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 19 / 0 / 5 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 273 | phone | load-window +100 ms | A | ok | 16 ms | click on `img` | 15 / 0 / 1 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 274 | phone | load-window +100 ms | B | ok | 664 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 661 / 0 / 3 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 275 | phone | load-window +100 ms | B | ok | 568 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 563 / 1 / 5 | 1 / 1 / 0 | 1 | other-task+first-render; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 276 | phone | load-window +100 ms | A | ok | 16 ms | click on `img` | 17 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 277 | phone | load-window +100 ms | A | ok | 16 ms | click on `img` | 18 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 278 | phone | load-window +100 ms | B | ok | 704 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 701 / 0 / 3 | 1 / 1 / 0 | 1 | other-task+first-render; class over pointerdown start → click dispatch; three.js loadingFinished |
| 279 | phone | load-window +100 ms | B | ok | 568 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 560 / 0 / 8 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 280 | phone | load-window +100 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 20 / 1 / 4 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 281 | phone | load-window +100 ms | A | ok | 16 ms | click on `img` | 15 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 282 | phone | load-window +100 ms | B | ok | 552 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 550 / 0 / 2 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 283 | phone | load-window +100 ms | B | ok | 568 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 565 / 0 / 3 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 284 | phone | load-window +100 ms | A | ok | 16 ms | click on `img` | 15 / 0 / 1 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 285 | phone | load-window +100 ms | A | ok | 16 ms | click on `img` | 14 / 1 / 1 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 286 | phone | load-window +100 ms | B | ok | 640 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 640 / 1 / 0 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 287 | phone | load-window +100 ms | B | ok | 728 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 728 / 0 / 0 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 288 | phone | load-window +100 ms | A | ok | 16 ms | click on `img` | 16 / 1 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 289 | phone | load-window +100 ms | A | ok | 16 ms | pointerdown+pointerup+click on `img` | 9 / 1 / 6 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → pointerdown dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 290 | phone | load-window +100 ms | B | ok | 496 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 490 / 0 / 6 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 291 | phone | load-window +100 ms | B | ok | 528 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 526 / 0 / 2 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 292 | phone | load-window +100 ms | A | ok | 16 ms | click on `img` | 14 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 293 | phone | load-window +100 ms | A | ok | 16 ms | click on `img` | 14 / 0 / 1 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 294 | phone | load-window +100 ms | B | ok | 624 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 625 / 1 / 0 | 1 / 1 / 0 | 1 | other-task+first-render; class over pointerdown start → click dispatch; three.js loadingFinished |
| 295 | phone | load-window +100 ms | B | ok | 128 ms | pointerdown+pointerup+click on `div.estate-map-frame.estate-map-frame--3d` | 122 / 1 / 5 | 1 / 1 / 0 | 1 | chunk-evaluate+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 296 | phone | load-window +100 ms | A | ok | 16 ms | click on `img` | 13 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 297 | phone | load-window +100 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 21 / 0 / 3 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 298 | phone | load-window +100 ms | B | ok | 688 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 687 / 0 / 1 | 1 / 1 / 0 | 1 | other-task+first-render; class over pointerdown start → click dispatch; three.js loadingFinished |
| 299 | phone | load-window +100 ms | B | ok | 752 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 754 / 0 / 0 | 1 / 1 / 0 | 1 | other-task+first-render; class over pointerdown start → click dispatch; three.js loadingFinished |
| 300 | phone | load-window +100 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 20 / 0 / 4 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 301 | phone | load-window +150 ms | A | ok | 16 ms | pointerup+click on `img` | 12 / 0 / 3 | 1 / 1 / 0 | 1 | outside; class over pointerup start → pointerup dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 302 | phone | load-window +150 ms | B | ok | 848 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 844 / 0 / 4 | 1 / 1 / 0 | 1 | other-task+first-render; class over pointerdown start → click dispatch; three.js loadingFinished |
| 303 | phone | load-window +150 ms | B | ok | 560 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 560 / 0 / 0 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 304 | phone | load-window +150 ms | A | ok | 16 ms | click on `img` | 13 / 0 / 3 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 305 | phone | load-window +150 ms | A | ok | 16 ms | click on `img` | 14 / 0 / 1 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 306 | phone | load-window +150 ms | B | ok | 584 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 581 / 1 / 3 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 307 | phone | load-window +150 ms | B | ok | 600 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 593 / 1 / 6 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 308 | phone | load-window +150 ms | A | ok | 16 ms | click on `img` | 12 / 0 / 4 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 309 | phone | load-window +150 ms | A | ok | 16 ms | pointerup+click on `img` | 11 / 1 / 5 | 1 / 1 / 0 | 1 | outside; class over pointerup start → pointerup dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 310 | phone | load-window +150 ms | B | ok | 528 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 525 / 0 / 3 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 311 | phone | load-window +150 ms | B | ok | 536 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 532 / 0 / 4 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 312 | phone | load-window +150 ms | A | ok | 16 ms | click on `img` | 13 / 0 / 3 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 313 | phone | load-window +150 ms | A | ok | <16 ms | — | — | 1 / 0 / 1 | 1 | under 16 ms (no entry; the input was counted); scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 314 | phone | load-window +150 ms | B | ok | 456 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 454 / 0 / 1 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 315 | phone | load-window +150 ms | B | ok | 680 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 678 / 0 / 2 | 1 / 1 / 0 | 1 | other-task+first-render; class over pointerdown start → click dispatch; three.js loadingFinished |
| 316 | phone | load-window +150 ms | A | ok | 16 ms | click on `img` | 17 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 317 | phone | load-window +150 ms | A | ok | 16 ms | click on `img` | 16 / 1 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 318 | phone | load-window +150 ms | B | ok | 528 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 528 / 0 / 0 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 319 | phone | load-window +150 ms | B | ok | 640 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 641 / 1 / 0 | 1 / 1 / 0 | 1 | other-task+first-render; class over pointerdown start → click dispatch; three.js loadingFinished |
| 320 | phone | load-window +150 ms | A | ok | 16 ms | click on `img` | 13 / 0 / 3 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 321 | phone | load-window +150 ms | A | ok | 16 ms | click on `img` | 15 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 322 | phone | load-window +150 ms | B | ok | 472 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 471 / 0 / 1 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 323 | phone | load-window +150 ms | B | ok | 584 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 580 / 0 / 4 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 324 | phone | load-window +150 ms | A | ok | 16 ms | click on `img` | 15 / 0 / 1 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 325 | phone | load-window +150 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 19 / 0 / 5 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 326 | phone | load-window +150 ms | B | ok | 504 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 501 / 0 / 2 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 327 | phone | load-window +150 ms | B | ok | 504 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 499 / 1 / 5 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 328 | phone | load-window +150 ms | A | ok | 16 ms | click on `img` | 15 / 1 / 1 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 329 | phone | load-window +150 ms | A | ok | 16 ms | pointerdown+pointerup+click on `img` | 10 / 0 / 6 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → pointerdown dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 330 | phone | load-window +150 ms | B | ok | 440 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 436 / 0 / 3 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 331 | phone | load-window +150 ms | B | ok | 432 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 429 / 0 / 3 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 332 | phone | load-window +150 ms | A | ok | <16 ms | — | — | 1 / 0 / 1 | 1 | under 16 ms (no entry; the input was counted); scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 333 | phone | load-window +150 ms | A | ok | 16 ms | click on `img` | 11 / 0 / 5 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 334 | phone | load-window +150 ms | B | ok | 496 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 496 / 0 / 0 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 335 | phone | load-window +150 ms | B | ok | 432 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 430 / 0 / 2 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 336 | phone | load-window +150 ms | A | ok | 16 ms | click on `img` | 15 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 337 | phone | load-window +150 ms | A | ok | 16 ms | click on `img` | 13 / 0 / 3 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 338 | phone | load-window +150 ms | B | ok | 480 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 478 / 0 / 2 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 339 | phone | load-window +150 ms | B | ok | 456 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 453 / 0 / 3 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 340 | phone | load-window +150 ms | A | ok | 16 ms | click on `img` | 17 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 341 | phone | load-window +200 ms | A | ok | 16 ms | click on `img` | 14 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 342 | phone | load-window +200 ms | B | ok | 416 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 411 / 2 / 3 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 343 | phone | load-window +200 ms | B | ok | 448 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 447 / 0 / 0 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 344 | phone | load-window +200 ms | A | ok | 16 ms | click on `img` | 14 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 345 | phone | load-window +200 ms | A | ok | 16 ms | click on `img` | 11 / 0 / 5 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 346 | phone | load-window +200 ms | B | ok | 472 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 471 / 0 / 1 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 347 | phone | load-window +200 ms | B | ok | 496 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 498 / 0 / 0 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 348 | phone | load-window +200 ms | A | ok | 16 ms | click on `img` | 14 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 349 | phone | load-window +200 ms | A | ok | 16 ms | click on `img` | 13 / 0 / 3 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 350 | phone | load-window +200 ms | B | ok | 416 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 413 / 0 / 3 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 351 | phone | load-window +200 ms | B | ok | 432 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 426 / 0 / 6 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 352 | phone | load-window +200 ms | A | ok | 16 ms | click on `img` | 14 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 353 | phone | load-window +200 ms | A | ok | 16 ms | pointerdown+pointerup+click on `img` | 10 / 0 / 6 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → pointerdown dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 354 | phone | load-window +200 ms | B | ok | 424 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 418 / 1 / 5 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 355 | phone | load-window +200 ms | B | ok | 384 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 384 / 0 / 0 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 356 | phone | load-window +200 ms | A | ok | 16 ms | click on `img` | 11 / 0 / 4 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 357 | phone | load-window +200 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 21 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 358 | phone | load-window +200 ms | B | ok | 456 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 451 / 0 / 5 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 359 | phone | load-window +200 ms | B | ok | 640 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 633 / 1 / 6 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 360 | phone | load-window +200 ms | A | ok | 16 ms | pointerdown+pointerup+click on `img` | 9 / 1 / 7 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → pointerdown dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 361 | phone | load-window +200 ms | A | ok | 16 ms | pointerdown+pointerup+click on `img` | 9 / 0 / 7 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → pointerdown dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 362 | phone | load-window +200 ms | B | ok | 736 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 732 / 0 / 4 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 363 | phone | load-window +200 ms | B | ok | 576 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 574 / 1 / 2 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 364 | phone | load-window +200 ms | A | ok | 16 ms | click on `img` | 14 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 365 | phone | load-window +200 ms | A | ok | 16 ms | click on `img` | 14 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 366 | phone | load-window +200 ms | B | ok | 408 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 404 / 0 / 4 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 367 | phone | load-window +200 ms | B | ok | 400 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 394 / 0 / 6 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 368 | phone | load-window +200 ms | A | ok | 16 ms | click on `img` | 14 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 369 | phone | load-window +200 ms | A | ok | <16 ms | — | — | 1 / 0 / 1 | 1 | under 16 ms (no entry; the input was counted); scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 370 | phone | load-window +200 ms | B | ok | 552 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 547 / 0 / 5 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 371 | phone | load-window +200 ms | B | ok | 592 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 590 / 0 / 2 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 372 | phone | load-window +200 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 21 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 373 | phone | load-window +200 ms | A | ok | 16 ms | click on `img` | 13 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 374 | phone | load-window +200 ms | B | ok | 512 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 511 / 0 / 1 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 375 | phone | load-window +200 ms | B | ok | 640 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 639 / 1 / 1 | 1 / 1 / 0 | 1 | other-task+first-render; class over pointerdown start → click dispatch; three.js loadingFinished |
| 376 | phone | load-window +200 ms | A | ok | 16 ms | pointerdown+pointerup+click on `img` | 9 / 1 / 6 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → pointerdown dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 377 | phone | load-window +200 ms | A | ok | 16 ms | click on `img` | 15 / 1 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 378 | phone | load-window +200 ms | B | ok | 496 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 492 / 0 / 4 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 379 | phone | load-window +200 ms | B | ok | 536 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 529 / 0 / 7 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 380 | phone | load-window +200 ms | A | ok | 16 ms | click on `img` | 13 / 0 / 3 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 381 | phone | load-window +250 ms | A | ok | 16 ms | click on `img` | 11 / 0 / 5 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 382 | phone | load-window +250 ms | B | ok | 352 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 348 / 0 / 4 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 383 | phone | load-window +250 ms | B | ok | 336 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 332 / 0 / 4 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 384 | phone | load-window +250 ms | A | ok | 16 ms | click on `img` | 13 / 1 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 385 | phone | load-window +250 ms | A | ok | 16 ms | click on `img` | 15 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 386 | phone | load-window +250 ms | B | ok | 456 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 452 / 0 / 4 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 387 | phone | load-window +250 ms | B | ok | 568 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 567 / 0 / 1 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 388 | phone | load-window +250 ms | A | ok | 16 ms | pointerdown+pointerup+click on `img` | 8 / 1 / 7 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → pointerdown dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 389 | phone | load-window +250 ms | A | ok | 24 ms | pointerup+click on `img` | 24 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over pointerup start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 390 | phone | load-window +250 ms | B | ok | 680 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 677 / 1 / 2 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 391 | phone | load-window +250 ms | B | ok | 736 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 732 / 1 / 3 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 392 | phone | load-window +250 ms | A | ok | 16 ms | click on `img` | 12 / 0 / 4 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 393 | phone | load-window +250 ms | A | ok | 16 ms | click on `img` | 13 / 0 / 3 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 394 | phone | load-window +250 ms | B | ok | 432 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 426 / 0 / 6 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 395 | phone | load-window +250 ms | B | ok | 536 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 536 / 0 / 0 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 396 | phone | load-window +250 ms | A | ok | 16 ms | click on `img` | 15 / 1 / 1 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 397 | phone | load-window +250 ms | A | ok | 16 ms | click on `img` | 14 / 0 / 1 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 398 | phone | load-window +250 ms | B | ok | 448 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 445 / 0 / 3 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 399 | phone | load-window +250 ms | B | ok | 352 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 349 / 0 / 3 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 400 | phone | load-window +250 ms | A | ok | 16 ms | click on `img` | 13 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 401 | phone | load-window +250 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 19 / 0 / 4 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 402 | phone | load-window +250 ms | B | ok | 432 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 428 / 0 / 4 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 403 | phone | load-window +250 ms | B | ok | 568 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 565 / 0 / 3 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 404 | phone | load-window +250 ms | A | ok | 24 ms | pointerup+click on `img` | 21 / 1 / 3 | 1 / 1 / 0 | 1 | outside; class over pointerup start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 405 | phone | load-window +250 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 19 / 0 / 5 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 406 | phone | load-window +250 ms | B | ok | 584 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 579 / 0 / 5 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 407 | phone | load-window +250 ms | B | ok | 480 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 479 / 2 / 0 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 408 | phone | load-window +250 ms | A | ok | 24 ms | pointerup+click on `img` | 23 / 1 / 0 | 1 / 1 / 0 | 1 | outside; class over pointerup start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 409 | phone | load-window +250 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 21 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 410 | phone | load-window +250 ms | B | ok | 576 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 574 / 0 / 2 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 411 | phone | load-window +250 ms | B | ok | 600 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 600 / 1 / 0 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 412 | phone | load-window +250 ms | A | ok | 24 ms | pointerup+click on `img` | 23 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over pointerup start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 413 | phone | load-window +250 ms | A | ok | 16 ms | pointerup+click on `img` | 11 / 1 / 4 | 1 / 1 / 0 | 1 | outside; class over pointerup start → pointerup dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 414 | phone | load-window +250 ms | B | ok | 576 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 575 / 1 / 1 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 415 | phone | load-window +250 ms | B | ok | 488 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 484 / 0 / 4 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 416 | phone | load-window +250 ms | A | ok | 16 ms | click on `img` | 13 / 0 / 3 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 417 | phone | load-window +250 ms | A | ok | 16 ms | click on `img` | 12 / 0 / 4 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 418 | phone | load-window +250 ms | B | ok | 640 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 636 / 0 / 4 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 419 | phone | load-window +250 ms | B | ok | 728 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 721 / 0 / 7 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → pointerup dispatch; three.js loadingFinished |
| 420 | phone | load-window +250 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 19 / 0 / 5 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 421 | phone | load-window +300 ms | A | ok | 16 ms | click on `img` | 17 / 1 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 422 | phone | load-window +300 ms | B | ok | 328 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 326 / 0 / 1 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 423 | phone | load-window +300 ms | B | ok | 416 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 414 / 0 / 2 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 424 | phone | load-window +300 ms | A | ok | 16 ms | click on `img` | 16 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 425 | phone | load-window +300 ms | A | ok | 16 ms | pointerdown+pointerup+click on `img` | 10 / 1 / 6 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → pointerdown dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 426 | phone | load-window +300 ms | B | ok | 736 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 736 / 1 / 0 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 427 | phone | load-window +300 ms | B | ok | 792 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 786 / 1 / 6 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 428 | phone | load-window +300 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 26 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 429 | phone | load-window +300 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 21 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 430 | phone | load-window +300 ms | B | ok | 840 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 834 / 1 / 5 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 431 | phone | load-window +300 ms | B | ok | 824 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 823 / 0 / 1 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 432 | phone | load-window +300 ms | A | ok | 16 ms | click on `img` | 16 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 433 | phone | load-window +300 ms | A | ok | 16 ms | click on `img` | 16 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 434 | phone | load-window +300 ms | B | ok | 512 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 507 / 0 / 5 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 435 | phone | load-window +300 ms | B | ok | 496 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 495 / 0 / 1 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 436 | phone | load-window +300 ms | A | ok | 24 ms | click on `img` | 19 / 1 / 5 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 437 | phone | load-window +300 ms | A | ok | 16 ms | click on `img` | 15 / 0 / 1 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 438 | phone | load-window +300 ms | B | ok | 416 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 417 / 0 / 0 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 439 | phone | load-window +300 ms | B | ok | 352 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 351 / 0 / 1 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 440 | phone | load-window +300 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 24 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 441 | phone | load-window +300 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 21 / 0 / 3 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 442 | phone | load-window +300 ms | B | ok | 752 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 746 / 0 / 6 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 443 | phone | load-window +300 ms | B | ok | 824 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 820 / 1 / 3 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 444 | phone | load-window +300 ms | A | ok | 24 ms | pointerup+click on `img` | 23 / 0 / 1 | 1 / 1 / 0 | 1 | outside; class over pointerup start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 445 | phone | load-window +300 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 19 / 0 / 5 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 446 | phone | load-window +300 ms | B | ok | 832 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 825 / 1 / 6 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 447 | phone | load-window +300 ms | B | ok | 744 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 733 / 1 / 10 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 448 | phone | load-window +300 ms | A | ok | 32 ms | pointerdown+pointerup+click on `img` | 28 / 1 / 4 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 449 | phone | load-window +300 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 20 / 0 / 4 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 450 | phone | load-window +300 ms | B | ok | 752 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 754 / 0 / 0 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 451 | phone | load-window +300 ms | B | ok | 768 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 762 / 3 / 3 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 452 | phone | load-window +300 ms | A | ok | 40 ms | pointerdown+pointerup+click on `img` | 31 / 4 / 5 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 453 | phone | load-window +300 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 21 / 0 / 3 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 454 | phone | load-window +300 ms | B | ok | 432 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 432 / 0 / 0 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 455 | phone | load-window +300 ms | B | ok | 384 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 385 / 0 / 0 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 456 | phone | load-window +300 ms | A | ok | 16 ms | pointerdown+pointerup+click on `img` | 10 / 0 / 6 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → pointerdown dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 457 | phone | load-window +300 ms | A | ok | 16 ms | click on `img` | 17 / 1 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 458 | phone | load-window +300 ms | B | ok | 432 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 433 / 0 / 0 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 459 | phone | load-window +300 ms | B | ok | 616 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 616 / 0 / 0 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 460 | phone | load-window +300 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 19 / 1 / 5 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 461 | phone | load-window +400 ms | A | ok | 16 ms | click on `img` | 18 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 462 | phone | load-window +400 ms | B | ok | 312 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 307 / 0 / 5 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 463 | phone | load-window +400 ms | B | ok | 312 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 308 / 0 / 4 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 464 | phone | load-window +400 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 22 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 465 | phone | load-window +400 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 19 / 1 / 5 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 466 | phone | load-window +400 ms | B | ok | 376 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 370 / 0 / 6 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 467 | phone | load-window +400 ms | B | ok | 368 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 363 / 0 / 5 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 468 | phone | load-window +400 ms | A | ok | 16 ms | click on `img` | 15 / 0 / 1 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 469 | phone | load-window +400 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 19 / 0 / 5 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 470 | phone | load-window +400 ms | B | ok | 344 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 335 / 1 / 8 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 471 | phone | load-window +400 ms | B | ok | 392 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 389 / 1 / 3 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 472 | phone | load-window +400 ms | A | ok | 16 ms | click on `img` | 16 / 0 / 0 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 473 | phone | load-window +400 ms | A | ok | 24 ms | click on `img` | 19 / 0 / 5 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 474 | phone | load-window +400 ms | B | ok | 328 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 321 / 1 / 7 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 475 | phone | load-window +400 ms | B | ok | 240 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 238 / 0 / 2 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 476 | phone | load-window +400 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 22 / 2 / 1 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 477 | phone | load-window +400 ms | A | ok | 32 ms | pointerdown+pointerup+click on `img` | 29 / 1 / 2 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 478 | phone | load-window +400 ms | B | ok | 648 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 645 / 1 / 2 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → pointerup dispatch; three.js loadingFinished |
| 479 | phone | load-window +400 ms | B | ok | 312 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 310 / 0 / 2 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 480 | phone | load-window +400 ms | A | ok | 16 ms | pointerdown+pointerup+click on `img` | 10 / 1 / 6 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → pointerdown dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 481 | phone | load-window +400 ms | A | ok | 16 ms | click on `img` | 14 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 482 | phone | load-window +400 ms | B | ok | 296 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 292 / 1 / 4 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 483 | phone | load-window +400 ms | B | ok | 424 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 419 / 1 / 4 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 484 | phone | load-window +400 ms | A | ok | 24 ms | pointerup+click on `img` | 22 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over pointerup start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 485 | phone | load-window +400 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 21 / 1 / 2 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 486 | phone | load-window +400 ms | B | ok | 360 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 355 / 0 / 5 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 487 | phone | load-window +400 ms | B | ok | 304 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 299 / 0 / 5 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 488 | phone | load-window +400 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 22 / 1 / 2 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 489 | phone | load-window +400 ms | A | ok | 16 ms | pointerup+click on `img` | 11 / 0 / 4 | 1 / 1 / 0 | 1 | outside; class over pointerup start → pointerup dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 490 | phone | load-window +400 ms | B | ok | 304 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 301 / 0 / 3 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 491 | phone | load-window +400 ms | B | ok | 312 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 306 / 0 / 6 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → pointerdown dispatch; three.js loadingFinished |
| 492 | phone | load-window +400 ms | A | ok | 16 ms | click on `img` | 10 / 0 / 6 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 493 | phone | load-window +400 ms | A | ok | 16 ms | click on `img` | 15 / 0 / 1 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 494 | phone | load-window +400 ms | B | ok | 312 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 309 / 0 / 3 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 495 | phone | load-window +400 ms | B | ok | 256 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 255 / 0 / 1 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 496 | phone | load-window +400 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 22 / 0 / 2 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 497 | phone | load-window +400 ms | A | ok | 16 ms | click on `img` | 15 / 1 / 1 | 1 / 1 / 0 | 1 | outside; class over click start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |
| 498 | phone | load-window +400 ms | B | ok | 232 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 231 / 0 / 1 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 499 | phone | load-window +400 ms | B | ok | 256 ms | pointerdown+pointerup+click on `canvas.estate-map-3d-canvas` | 256 / 0 / 0 | 1 / 1 / 0 | 1 | first-render+other-task; class over pointerdown start → click dispatch; three.js loadingFinished |
| 500 | phone | load-window +400 ms | A | ok | 24 ms | pointerdown+pointerup+click on `img` | 19 / 0 / 5 | 1 / 1 / 0 | 1 | outside; class over pointerdown start → click dispatch; scroll + 1241 ms (B's measured scroll-to-chunk delay) |

## Limits

- Lab only: Chromium through Playwright, synthetic CDP input, throttled CPU and network. Not field INP, and not Safari or Firefox.
- Event Timing's floor is 16 ms and its durations are rounded to 8 ms; an interaction under the floor leaves no entry and is printed as "<16 ms".
- The GPU path above decides the first frame's cost; software WebGL overstates it against a phone's GPU.
- Traces use hotel-cwv's categories without the CPU sampler, and are taken for the load-window trials only.
- The machine was not isolated. Figures of record need an otherwise idle machine.
