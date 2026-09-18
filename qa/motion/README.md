# The hero tail's motion: one ruling, and the before/after (D-028, D-034)

Ten frame strips, compressed from the full captures. Each strip is one hero, one
build, read top to bottom: the label on a red line is the time from first
contentful paint, and the tile under it is the last frame at or before that
time. The full sequences (275 MB, every hero, both viewports, motion and reduced
motion, before the change and after each step) are not in the repository; they
can go into the Drive folder if the owner wants them.

## 1. The ruling: which stagger the tail should use

`globals.css` opens the tail by translating each character, 12 ms apart
(DESIGN-PLAN §2.4 fixes the 12 ms and not the direction). Three candidates, the
same build, the same hero:

| file | what it does |
|---|---|
| `stagger-estate-reverse-from-the-last-character.jpg`, `stagger-villa-thoi-reverse-from-the-last-character.jpg` | **what is built** — the last character leads, so no two neighbours are ever closer than the closed tail already shows (−4.80 px) |
| `stagger-estate-forward-framer-order.jpg`, `stagger-villa-thoi-forward-framer-order.jpg` | the order the Framer build used. Look at 160–350 ms: the tail reads `ONEGATE`, the characters piled onto each other (−9.56 / −12.83 / −11.83 px between neighbours). Framer hid this behind `opacity: 0`; in CSS there is no fade, so nothing hides it |
| `stagger-estate-none.jpg`, `stagger-villa-thoi-none.jpg` | no stagger at all: every character moves together |

The reverse order is a **build default**, not a ruling — it is the owner's to
overturn, and the change is one line of CSS.

## 2. What changed for the reader

The throttled pair, on the same phone profile the performance gate uses (390×844
at DPR 1, 4× CPU, 1.6 Mbps):

| file | what it shows |
|---|---|
| `throttled-estate-before-framer.jpg`, `throttled-villa-thoi-before-framer.jpg` | the Framer build. The tail is served at `opacity: 0` and appears only when the page hydrates — 2.54–2.76 s on this profile |
| `throttled-estate-after-css.jpg`, `throttled-villa-thoi-after-css.jpg` | the CSS build. The tail is legible from before first paint and comes to rest at about 1.0–1.1 s, before hydration |

`qa/perf/FRAMER-tranche14.md` has the byte measurements and the method.
