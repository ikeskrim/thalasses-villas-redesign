import type { MetadataRoute } from "next";

import { COLLECTION_VILLA_IDS, getAllExperiences, getVilla } from "@/lib/content";

/**
 * The sitemap is DERIVED from the content inventory, so a villa or an
 * experience added to `content/` appears here without anyone remembering to
 * add it. A hand-maintained list is a second source that drifts.
 *
 * It is emitted even though the site is `noindex` today: on launch day the
 * robots rule flips and the sitemap must already be correct, not written in a
 * hurry against a live domain.
 */
const BASE = "https://thalasses.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    "",
    "/en/the-estate",
    "/en/experiences",
    "/en/weddings",
    "/en/location",
    "/en/careers",
    "/en/contact",
    "/en/terms",
  ];

  const villas = COLLECTION_VILLA_IDS.map((k) => `/en/villas/${getVilla(k).slug}`);
  const experiences = getAllExperiences().map((e) => `/en/experiences/${e.slug}`);

  return [...staticRoutes, ...villas, ...experiences].map((route) => ({
    url: `${BASE}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route.startsWith("/en/villas/") ? 0.9 : 0.7,
  }));
}
