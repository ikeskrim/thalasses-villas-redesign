/**
 * THE LOCALE REGISTRY — one source for what languages exist and which of them
 * are actually published.
 *
 * `content/url-map.md` §5.3 settled the route shape on day one: every route
 * already lives under a locale segment (`/en/...`), so `/el/...` drops in with
 * no structural change. What was missing was the machinery that decides what a
 * page SAYS about its languages — the canonical, the alternates, the switcher —
 * and that was being written by hand, once per route, ten times.
 *
 * **The legacy site is English-only.** There is no Greek copy anywhere in the
 * Phase 0 inventory, so `/el` cannot ship yet without inventing content about a
 * real property, which this project does not do. What ships instead is the
 * plumbing, arranged so that publishing Greek is a one-line change here and
 * every page in the site starts declaring it correctly on the same deploy.
 *
 * Two things are DERIVED from this file rather than typed per route:
 *
 *   the canonical      — a page names its own address
 *   the hreflang set   — only PUBLISHED locales are ever declared
 *
 * That second one is the whole reason this exists. Declaring an alternate for a
 * locale that does not exist tells a search engine to go and fetch a page that
 * will 404, which is strictly worse than declaring nothing at all. A hand-
 * written alternates block gets that wrong the day someone adds `/el` to one
 * route and forgets the other nine; a derived one cannot.
 */

export const LOCALES = ["en", "el"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/**
 * The locales that have real content at HEAD.
 *
 * **This is the flag.** Adding `"el"` here is what publishes Greek, and doing
 * so is deliberately not enough on its own — `tests/locale.spec.ts` asserts
 * that every published locale actually serves its routes, so flipping this
 * before the pages exist turns the suite red rather than shipping a locale of
 * 404s to a crawler.
 *
 * Prerequisites for `el`, all recorded rather than remembered:
 *   - Greek copy for every route (there is none in the inventory — T-103)
 *   - the display face decided; recommended and reasoned in
 *     `qa/greek-face/VERDICT.md`, and the owner reads Greek natively
 *   - villa proper nouns confirmed, not transliterated (url-map §5.3)
 */
export const PUBLISHED_LOCALES: readonly Locale[] = ["en"];

export function isPublished(locale: string): locale is Locale {
  return (PUBLISHED_LOCALES as readonly string[]).includes(locale);
}

/**
 * Swap the locale segment of a site path.
 *
 * Paths here are always locale-first (`/en/villas/villa-thoi`) except the
 * homepage, which is bare `/` and belongs to the default locale. Slugs are
 * NOT translated: url-map §5.3 keeps the English slug tables as the registry
 * and adds a parallel Greek table later, so this is a segment swap and
 * deliberately not a lookup that would silently return an English slug under a
 * Greek prefix.
 */
export function withLocale(path: string, locale: Locale): string {
  if (path === "/" || path === "") return locale === DEFAULT_LOCALE ? "/" : `/${locale}`;
  const parts = path.replace(/^\/+/, "").split("/");
  if ((LOCALES as readonly string[]).includes(parts[0]!)) parts[0] = locale;
  else parts.unshift(locale);
  return `/${parts.join("/")}`;
}

/**
 * The `alternates` block for a page, ready to spread into Next's `Metadata`.
 *
 * While one locale is published this emits a canonical and nothing else, which
 * is correct: `hreflang` on a single-language site is noise at best. The moment
 * a second locale is published every route begins emitting the full set,
 * including `x-default`, with no edit to any page.
 */
export function alternatesFor(path: string) {
  const canonical = path === "" ? "/" : path;
  if (PUBLISHED_LOCALES.length < 2) return { canonical };

  const languages: Record<string, string> = {};
  for (const locale of PUBLISHED_LOCALES) languages[locale] = withLocale(canonical, locale);
  languages["x-default"] = withLocale(canonical, DEFAULT_LOCALE);
  return { canonical, languages };
}
