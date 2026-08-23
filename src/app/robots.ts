import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site-url";

/**
 * NOINDEX SITE-WIDE, DELIBERATELY — see DEPLOY.md.
 *
 * The client's own site is still live at thalasses.com and still ranking.
 * Indexing this build now would split the ranking of a property for its own
 * brand terms, and nothing is gained by indexing a pre-launch deployment.
 *
 * Flipping this is a LAUNCH-DAY task, in this order: point the domain, verify
 * the 301 map against the live legacy URLs, and only then allow indexing — in
 * the same change. Doing this step first is how a migration loses its rankings.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
