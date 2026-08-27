import fs from "node:fs";
import path from "node:path";

import type { MetadataRoute } from "next";

import { COLLECTION_VILLA_IDS, getAllExperiences, getVilla } from "@/lib/content";
import { siteUrl } from "@/lib/site-url";

/**
 * The sitemap is DERIVED — including the static routes.
 *
 * The villas and the experiences were derived from the registry from the start,
 * and the eight static routes were typed. So when the Gallery shipped, it went
 * into the nav, got a page, got a share card, and **never entered the sitemap**.
 * The link crawl found it: 35 routes reachable, 34 sitemapped, one page that a
 * visitor could open and a crawler was never told about. (T-298.)
 *
 * It was a hand-maintained list living inside a file whose own comment said a
 * hand-maintained list is a second source that drifts. It drifted.
 *
 * Every route is now discovered from the filesystem, so a page added next month
 * appears here on the day it is created. Anything deliberately left out is named
 * below WITH ITS REASON — an exclusion you have to write down is an exclusion
 * someone can argue with, which is the point.
 *
 * It is emitted even though the site is `noindex` today: on launch day the
 * robots rule flips and the sitemap must already be correct, not written in a
 * hurry against a live domain.
 */
/* Read from the environment — one answer for the whole site. See site-url.ts. */
const BASE = siteUrl();

/**
 * Routes that exist and are deliberately absent from the sitemap.
 *
 * `tests/sitemap.spec.ts` asserts that every reachable route is either listed
 * here or in the sitemap, so this cannot quietly become a place to hide pages.
 */
const EXCLUDED: Record<string, string> = {
  "/styleguide": "Internal design reference. Carries robots noindex of its own.",
  "/looks":
    "The three re-skin prototypes. A decision instrument for the owner, not a " +
    "page of the site — noindex, unlinked, and handed over by URL. The three " +
    "`/looks/<id>` routes are dynamic and never walked.",
};

/** Every non-dynamic `page.tsx` under `src/app`, as a route path. */
function staticRoutes(): string[] {
  const appDir = path.join(process.cwd(), "src", "app");
  const out: string[] = [];

  const walk = (dir: string, segments: string[]) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const name = entry.name;
      /* Dynamic segments are covered by the registry-derived lists below, and
         private folders (_lib) and route groups ((group)) are not routes. */
      if (name.startsWith("[") || name.startsWith("_") || name.startsWith("(")) continue;
      const next = path.join(dir, name);
      if (fs.existsSync(path.join(next, "page.tsx"))) {
        out.push("/" + [...segments, name].join("/"));
      }
      walk(next, [...segments, name]);
    }
  };

  if (fs.existsSync(path.join(appDir, "page.tsx"))) out.push("");
  walk(appDir, []);
  return out.filter((r) => !(r in EXCLUDED));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const villas = COLLECTION_VILLA_IDS.map((k) => `/en/villas/${getVilla(k).slug}`);
  const experiences = getAllExperiences().map((e) => `/en/experiences/${e.slug}`);

  const all = [...new Set([...staticRoutes(), ...villas, ...experiences])];

  return all.map((route) => ({
    url: `${BASE}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route.startsWith("/en/villas/") ? 0.9 : 0.7,
  }));
}
