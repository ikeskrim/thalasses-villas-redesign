import type { Metadata } from "next";
import localFont from "next/font/local";

import { CustomCursor } from "@/components/motion/CustomCursor";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { NAV_ENTRIES, SiteNav } from "@/components/ui/SiteNav";

import "./globals.css";

/**
 * Two files, self-hosted (DESIGN-PLAN §4.5).
 *
 * Deliberately next/font/local rather than next/font/google: the Google loader
 * fetches from fonts.gstatic.com at build time, which makes the build depend on
 * outbound network access. Vendoring the woff2 files makes the build hermetic
 * and reproducible, and still gives us size-adjust fallback metrics, so the C1
 * hero does not reflow on swap. CLS budget: 0.
 *
 * Subsets: `latin` only. It covers U+00C0–00FF, so the accented characters the
 * inventory actually contains ("Schüco", "Kährs") render correctly. The
 * `latin-ext` files are vendored alongside but unused; the `greek` subset is not
 * yet fetched and is a prerequisite for the /el locale (see TODO T-103).
 */
const marcellus = localFont({
  src: [{ path: "./fonts/marcellus-latin.woff2", weight: "400", style: "normal" }],
  variable: "--font-marcellus",
  display: "swap",
  preload: true,
  fallback: ["Georgia", "Times New Roman", "serif"],
  adjustFontFallback: "Times New Roman",
});

const inter = localFont({
  src: [{ path: "./fonts/inter-latin.woff2", weight: "400 500", style: "normal" }],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
  adjustFontFallback: "Arial",
});

/**
 * Two further voices, and no more. Four is a system; five is soup.
 *   Marcellus     — display
 *   Marcellus SC  — the letterspaced micro register, true small caps from the
 *                   same hand rather than Inter pretending
 *   Cormorant It. — the emotional register, pull-quotes and asides only
 *   Inter         — everything else
 * Both verified by inspecting the served woff2, per the T-189 method: Marcellus
 * SC carries latin/latin-ext (no Greek — same gap as Marcellus, T-176), and the
 * Cormorant file genuinely declares font-style: italic.
 */
const marcellusSC = localFont({
  src: [{ path: "./fonts/marcellus-sc-latin.woff2", weight: "400", style: "normal" }],
  variable: "--font-marcellus-sc",
  display: "swap",
  preload: true,
  fallback: ["Georgia", "serif"],
});

const cormorantItalic = localFont({
  src: [{ path: "./fonts/cormorant-italic-latin.woff2", weight: "400", style: "italic" }],
  variable: "--font-cormorant-italic",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://thalasses.com"),
  title: {
    default: "Thalasses Villas",
    template: "%s — Thalasses Villas",
  },
  description:
    "An intimate seafront collection of private villas in Pigianos Kampos, Rethymno, Crete.",
};

/**
 * The booking affordance in the nav is always reachable, so it is built once
 * here rather than per page. Dates-only and lang=en per T-156/T-159 — room
 * preselect is inert on this host.
 */
const BOOK_HREF = "https://thalassesvillas.reserve-online.net/?lang=en";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${marcellus.variable} ${marcellusSC.variable} ${cormorantItalic.variable} ${inter.variable}`}>
      <head>
        {/*
          Framer Motion serialises its `initial` state into the server HTML, so
          every scroll-revealed section ships as opacity:0 / clip-path inset.
          Without JS that content is permanently invisible — to a reader with
          scripting off, to a crawler that does not execute JS, and in print.
          This forces the final state whenever JS is unavailable.
        */}
        <noscript
          dangerouslySetInnerHTML={{
            __html:
              "<style>" +
              '[style*="opacity:0"],[style*="opacity: 0"]{opacity:1 !important}' +
              '[style*="clip-path"]{clip-path:none !important}' +
              '[style*="transform"]{transform:none !important}' +
              "</style>",
          }}
        />
      </head>
      <body>
        {/*
          THE GRAIN. One fixed SVG turbulence layer over the whole document at
          3%. It unifies photography shot across years and cameras, and it is
          the single cheapest thing that makes a page read as film rather than
          as a website. Imperceptible as an element; perceptible as a feeling.
          Pointer-events none, aria-hidden, and it never repaints on scroll.
        */}
        <div className="grain" aria-hidden="true" />
        {/*
          Hoisted from the homepage. Both were mounted per page, which meant the
          contextual cursor and Lenis existed on `/` and vanished the moment you
          opened a villa — including on the nav's own `data-cursor="Book"`, which
          sat there labelling nothing. A site-wide affordance belongs in the site
          shell; mounting it per page is how it becomes a homepage effect.
          Both are self-disabling on touch and under reduced motion.
        */}
        <SmoothScroll />
        <CustomCursor />
        <SiteNav entries={NAV_ENTRIES} bookHref={BOOK_HREF} />
        {children}
      </body>
    </html>
  );
}
