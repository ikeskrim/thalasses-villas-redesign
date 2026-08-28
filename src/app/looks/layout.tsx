import type { Metadata } from "next";
import localFont from "next/font/local";

import "./looks.css";
import "./type-alive.css";

/**
 * THE LOOK PROTOTYPES ARE NOT PART OF THE SITE.
 *
 * They exist so the owner can choose a direction by looking at his own property
 * in three of them, and they must never be mistaken for the site itself — not by
 * a crawler, not by a sitemap, not by somebody who lands here from a search
 * result and thinks the redesign shipped.
 *
 *   - `robots: noindex, nofollow` on every route under /looks.
 *   - Absent from `src/app/sitemap.ts` by construction: the sitemap enumerates
 *     the registry, and there is no look in the registry.
 *   - No link from any published page. The URL is handed over deliberately.
 *
 * FONTS ARE LOADED HERE, NOT IN THE ROOT LAYOUT, for the same reason. Two extra
 * display faces on every page of the real site would be a real cost paid by
 * every visitor for a page three people will ever open.
 */

/**
 * Cormorant Garamond, upright.
 *
 * The italic has been vendored since Phase 3 for the register's pull quotes;
 * the roman was sitting unused in the same folder. It carries Editorial
 * Estate's high-contrast serif register (the Reckless / Freight Display slot in
 * the research) without a new download, a new licence question, or a byte of
 * added weight on the live site.
 */
const cormorantGaramond = localFont({
  src: [{ path: "../fonts/cormorant-garamond-latin.woff2", weight: "400", style: "normal" }],
  variable: "--font-cormorant-garamond",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});

/**
 * GFS Didot — and it is the reason no font had to be bought.
 *
 * Golden Coast is specified in the research as a Didone (Canela Deck / GT
 * Sectra register). GFS Didot is a genuine Didone, it was already vendored, and
 * unlike everything else in this project's type system **it carries Greek**.
 * That matters beyond this prototype: Marcellus has no Greek coverage (T-176),
 * which is an unsolved problem for /el. If the owner picks this look, the /el
 * display face comes free with it.
 */
const gfsDidot = localFont({
  src: [
    { path: "../fonts/gfs-didot-latin.woff2", weight: "400", style: "normal" },
    { path: "../fonts/gfs-didot-greek.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-gfs-didot",
  display: "swap",
  preload: false,
  fallback: ["Didot", "Georgia", "serif"],
});

/**
 * LITERATA — the face Direction E is built on, and the reason it had to be
 * chosen before anything was drawn.
 *
 * Direction E's signature move is a weight settle: the hero word animates from
 * wght 300 to 600. Only a VARIABLE font can do that, and the /el corpus is
 * already written and waiting, so the face also had to carry Greek. Verified
 * from the Google Fonts catalogue rather than assumed: Literata ships
 * `opsz 7-72` and `wght 200-900`, with `greek` and `greek-ext` subsets.
 *
 * That combination is rarer than it sounds. Of the luxury serifs a brief
 * reaches for first, Cormorant, Cormorant Garamond, Fraunces, Playfair Display,
 * Spectral, Marcellus and Gilda Display ALL lack Greek — checked, every one.
 * Committing to any of them would have forced a second face, or a redesign, the
 * day /el shipped.
 *
 * Latin and Greek are loaded as separate faces and stacked rather than merged
 * with `unicode-range`. Per-glyph fallback does the routing for free, both
 * files are the same typeface, and it keeps this inside `next/font/local` like
 * every other face in the project instead of hand-written @font-face in public/.
 */
const literata = localFont({
  src: [
    { path: "../fonts/literata-latin.woff2", style: "normal" },
    { path: "../fonts/literata-latin-ext.woff2", style: "normal" },
  ],
  variable: "--font-literata",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
  /*
   * Metric-matched fallback, because the swap was measurably shifting the page.
   * Before this, the litany section moved 0.037 CLS on a phone as Literata
   * replaced Georgia and the display lines re-broke. Within the 0.1 budget, but
   * the site's own type note sets a CLS budget of ZERO for the display face and
   * matching that costs one line. A serif needs a serif metric base.
   */
  adjustFontFallback: "Times New Roman",
});

const literataGreek = localFont({
  src: [{ path: "../fonts/literata-greek.woff2", style: "normal" }],
  variable: "--font-literata-greek",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function LooksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-looks-root=""
      className={`${cormorantGaramond.variable} ${gfsDidot.variable} ${literata.variable} ${literataGreek.variable}`}
    >
      {/*
        WITHOUT JAVASCRIPT, EVERY REVEAL IS PERMANENT.
        `.lk-reveal` ships at opacity 0 and is undone by an IntersectionObserver.
        With no script that never happens and the page is a photograph with
        nothing on it — which is precisely the failure the root layout already
        guards against for the real site. Same fix, same reason, scoped here.
      */}
      <noscript>
        <style>{`.lk-reveal,.te-in{opacity:1 !important;transform:none !important}`}</style>
      </noscript>
      {children}
    </div>
  );
}
