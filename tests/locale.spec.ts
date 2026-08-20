import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import {
  DEFAULT_LOCALE,
  LOCALES,
  PUBLISHED_LOCALES,
  alternatesFor,
  withLocale,
} from "../src/lib/locale";

/**
 * THE LOCALE SCAFFOLD.
 *
 * `/el` does not exist, and this suite's job is to make sure that stays TRUE
 * rather than becoming half-true. A partially-built locale is worse than none:
 * a crawler that finds `/el/villas/villa-thoi` returning a 200 page of English
 * copy will index it, split the ranking of a property that already ranks, and
 * serve Greek visitors a page in the wrong language.
 *
 * So three things are asserted:
 *
 *   1. Every route declares a canonical, and it is its OWN address. Ten of
 *      these were written by hand before `alternatesFor()` existed, which is
 *      ten chances to paste the wrong path.
 *   2. `hreflang` names only PUBLISHED locales. Declaring an alternate for a
 *      locale that does not exist points a search engine at a 404.
 *   3. `/el` and everything under it 404s today — asserted on the STATUS, the
 *      same way the soft-404 class guard does, because this is exactly the
 *      failure that guard exists for.
 *
 * And the flag has teeth: adding a locale to `PUBLISHED_LOCALES` before its
 * pages exist turns this red instead of shipping a locale of 404s.
 */

/**
 * A REAL experience slug, read from the registry.
 *
 * The first draft of this list typed `private-chef`, which does not exist —
 * the registry says `chef-in-villa`. That one wrong slug is what revealed that
 * two other tools had been pointed at the 404 page for a whole night and had
 * reported it clean (T-281).
 */
const EXPERIENCE: string = (() => {
  const dir = path.join(process.cwd(), "content", "experiences");
  const slugs = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => (JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")) as { slug?: string }).slug)
    .filter((x): x is string => Boolean(x))
    .sort();
  if (!slugs.length) throw new Error("no experiences in the registry");
  return slugs[0]!;
})();

const ROUTES: [route: string, canonical: string][] = [
  ["/", "/"],
  ["/en/the-estate", "/en/the-estate"],
  ["/en/villas/villa-thoi", "/en/villas/villa-thoi"],
  ["/en/villas/villa-pueblo", "/en/villas/villa-pueblo"],
  ["/en/gallery", "/en/gallery"],
  ["/en/experiences", "/en/experiences"],
  [`/en/experiences/${EXPERIENCE}`, `/en/experiences/${EXPERIENCE}`],
  ["/en/weddings", "/en/weddings"],
  ["/en/location", "/en/location"],
  ["/en/careers", "/en/careers"],
  ["/en/contact", "/en/contact"],
  ["/en/terms", "/en/terms"],
];

test.describe("locale scaffold", () => {
  test("the registry is coherent", () => {
    expect(PUBLISHED_LOCALES.length, "no locale is published — the site has no language").toBeGreaterThan(0);
    for (const l of PUBLISHED_LOCALES) {
      expect(LOCALES, `${l} is published but not a declared locale`).toContain(l);
    }
    expect(PUBLISHED_LOCALES, "the default locale must be published").toContain(DEFAULT_LOCALE);
  });

  test("withLocale swaps the segment rather than translating the slug", () => {
    /* url-map §5.3: slugs are translatable, the map is not. */
    expect(withLocale("/en/villas/villa-thoi", "el")).toBe("/el/villas/villa-thoi");
    expect(withLocale("/", "el")).toBe("/el");
    expect(withLocale("/", "en")).toBe("/");
    expect(withLocale("/en/terms", "en")).toBe("/en/terms");
  });

  test("alternates name only published locales", () => {
    const a = alternatesFor("/en/terms") as { canonical: string; languages?: Record<string, string> };
    expect(a.canonical).toBe("/en/terms");
    if (PUBLISHED_LOCALES.length < 2) {
      expect(
        a.languages,
        "hreflang was emitted while only one locale is published — every alternate would 404"
      ).toBeUndefined();
    } else {
      for (const declared of Object.keys(a.languages ?? {})) {
        if (declared === "x-default") continue;
        expect(PUBLISHED_LOCALES, `hreflang declares ${declared}, which is not published`).toContain(
          declared
        );
      }
    }
  });

  for (const [route, canonical] of ROUTES) {
    test(`${route} — canonical names its own address`, async ({ page }) => {
      await page.goto(route);
      const href = await page.locator('link[rel="canonical"]').first().getAttribute("href");
      expect(href, `${route} declares no canonical`).toBeTruthy();
      expect(new URL(href!, "http://x").pathname, `${route} canonicalises elsewhere`).toBe(canonical);
    });
  }

  for (const [route] of ROUTES) {
    test(`${route} — declares no alternate that would 404`, async ({ page }) => {
      await page.goto(route);
      const langs = await page
        .locator('link[rel="alternate"][hreflang]')
        .evaluateAll((els) =>
          els.map((e) => ({
            lang: e.getAttribute("hreflang")!,
            href: e.getAttribute("href")!,
          }))
        );
      for (const { lang, href } of langs) {
        if (lang === "x-default") continue;
        expect(
          PUBLISHED_LOCALES as readonly string[],
          `${route} declares hreflang="${lang}" -> ${href}, and ${lang} is not published`
        ).toContain(lang);
      }
      if (PUBLISHED_LOCALES.length < 2) {
        expect(langs, `${route} emits hreflang while only one locale exists`).toEqual([]);
      }
    });
  }

  test("every unpublished locale is genuinely unreachable", async ({ request }) => {
    /*
     * Asserted on the STATUS, not on what renders. A soft 404 — a not-found
     * page served with 200 — is exactly how dead URLs stay in an index after a
     * domain move, and this project has already shipped that bug once
     * (tests/soft404.spec.ts).
     */
    const unpublished = LOCALES.filter((l) => !(PUBLISHED_LOCALES as readonly string[]).includes(l));
    expect(unpublished.length, "nothing to check — this test is not looking at anything").toBeGreaterThan(0);

    for (const locale of unpublished) {
      for (const suffix of ["", "/", "/villas/villa-thoi", "/the-estate", "/anything"]) {
        /*
         * Redirects are FOLLOWED here on purpose. Next normalises `/el/` to
         * `/el` with a 308 before routing ever happens, so asserting on the
         * first hop reports a redirect and says nothing about whether the
         * locale exists. What matters is where a crawler ends up.
         */
        const res = await request.get(`/${locale}${suffix}`);
        expect(
          res.status(),
          `/${locale}${suffix} ended at ${res.url()} with ${res.status()} — ` +
            `an unpublished locale must not be reachable`
        ).toBe(404);
      }
    }
  });

  test("no legacy redirect resolves under an unpublished locale", async ({ request }) => {
    /*
     * url-map §5.3: the legacy site is English-only, so no legacy URL should
     * ever resolve under `/el/`. Next's App Router does not locale-prefix
     * redirect sources the way the Pages Router did, but asserting it is
     * cheaper than remembering it.
     */
    const generated = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "src", "generated", "redirects.json"), "utf-8")
    ) as { redirects: { source: string }[] };
    expect(generated.redirects.length, "no redirects found — this test is not looking at anything").toBeGreaterThan(10);

    const sample = generated.redirects.slice(0, 8);
    for (const { source } of sample) {
      const res = await request.get(`/el${source}`);
      expect(
        res.status(),
        `/el${source} answered ${res.status()} — a legacy path resolved under an unpublished locale`
      ).toBe(404);
    }
  });

  test("the language switcher is absent while one locale is published", async ({ page }) => {
    /*
     * Dead UI is worse than no UI. A switcher offering a language that does not
     * exist is a promise the site cannot keep, so it renders nothing until
     * `PUBLISHED_LOCALES` has a second entry.
     */
    await page.goto("/");
    if (PUBLISHED_LOCALES.length < 2) {
      expect(await page.locator("[data-language-switcher]").count()).toBe(0);
    } else {
      expect(await page.locator("[data-language-switcher]").count()).toBeGreaterThan(0);
    }
  });
});
