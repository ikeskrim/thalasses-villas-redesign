/**
 * WHERE THIS SITE LIVES — one answer, read from the environment.
 *
 * Three files hard-coded `https://thalasses.com`: the `metadataBase` that turns
 * every canonical and every OpenGraph image into an absolute URL, the sitemap's
 * base, and the sitemap line in `robots.txt`. Three copies of one fact, in
 * three files, and launch day would have meant finding all three under time
 * pressure — or finding two of them.
 *
 * Now it is a variable. `LAUNCH.md` step 5 becomes a value change rather than a
 * code change, and a preview deployment stops claiming to be the live domain.
 *
 * PRECEDENCE, and the reasons:
 *
 *   1. `SITE_URL`, if set. An explicit answer always wins — that is what makes
 *      it possible to build a staging copy that knows it is staging.
 *   2. On a Vercel PREVIEW deployment, the deployment's own URL. Preview builds
 *      currently emit OpenGraph images pointing at thalasses.com, so sharing a
 *      preview link renders a card fetched from the CLIENT'S LIVE SITE. That is
 *      not a bug anyone would notice from the dashboard and it is exactly the
 *      kind of thing that embarrasses a handover.
 *   3. On a Vercel PRODUCTION deployment, the project's production domain.
 *   4. `https://thalasses.com` — the launch target. Nothing changes today.
 *
 * NOT `NEXT_PUBLIC_`-prefixed. This is read at build time by the metadata, the
 * sitemap and robots, all of which are server-side. A `NEXT_PUBLIC_` variable
 * would ship it into every browser bundle for no purpose, and the project
 * already carries a rule about that prefix for the mail key (`DEPLOY.md`).
 */

const FALLBACK = "https://thalasses.com";

/**
 * An origin, and nothing else: scheme + host, no trailing slash, no path.
 *
 * A trailing slash here produces `https://thalasses.com//en/terms` in every
 * canonical on the site, and a path produces something worse. Both are easy to
 * type into a dashboard field and neither would fail a build, so they are
 * normalised rather than trusted — and anything that is not a usable absolute
 * URL is refused loudly at build time instead of silently poisoning every
 * canonical on the site.
 */
function normalise(raw: string | undefined, source: string): string | null {
  if (!raw) return null;
  const candidate = /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error(
      `${source} is not a usable URL: ${JSON.stringify(raw)}. ` +
        `Expected something like "https://thalasses.com".`
    );
  }
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error(
      `${source} must be an origin only — no path, query or fragment. Got ${JSON.stringify(raw)}.`
    );
  }
  return url.origin;
}

export function siteUrl(): string {
  const explicit = normalise(process.env.SITE_URL, "SITE_URL");
  if (explicit) return explicit;

  const env = process.env.VERCEL_ENV;
  if (env === "preview") {
    const preview = normalise(process.env.VERCEL_URL, "VERCEL_URL");
    if (preview) return preview;
  }
  const production = normalise(
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    "VERCEL_PROJECT_PRODUCTION_URL"
  );
  if (production) return production;

  return FALLBACK;
}

/** The launch target, for documentation and for the readiness guard. */
export const CANONICAL_PRODUCTION_URL = FALLBACK;

/** `https://thalasses.com/en/terms` from `/en/terms`. */
export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
