import { expect, test } from "@playwright/test";

/**
 * ALT TEXT THAT SAYS SOMETHING — the guard axe cannot be.
 *
 * axe checks that an `alt` attribute EXISTS. It passed this site on eleven
 * routes, every run, while the estate page served **48 photographs under 3
 * distinct descriptions — 46 of them the identical sentence**, and the wedding
 * venue served 31 the same way. A screen-reader user heard one sentence,
 * repeated, for the entire photographic heart of two pages.
 *
 * "Does the alt say anything" is not a question a generic accessibility engine
 * can ask, because it depends on what else is on the page. It IS a question
 * this suite can ask, because it knows what this site is.
 *
 * Four rules, and the third is the one that mattered:
 *
 *   1. Every non-decorative image has an alt.
 *   2. No alt is a filename or a hash.
 *   3. NO ALT IS REPEATED MORE THAN TWICE ON A PAGE. Twice is tolerated because
 *      the inventory genuinely contains a handful of duplicate captions —
 *      somebody wrote the same sentence for two frames, which is a content
 *      fact, not a code defect. Three is a pattern, and a pattern means a
 *      fallback is firing.
 *   4. A decorative image declares itself with `alt=""` AND has adjacent text
 *      that labels it. An empty alt is the correct HTML for "skip me"; an empty
 *      alt on an image with nothing beside it is just a missing description.
 */

const ROUTES = [
  "/",
  "/en/the-estate",
  "/en/villas/villa-thoi",
  "/en/villas/villa-persi",
  "/en/villas/villa-eeanthe",
  "/en/villas/villa-melia",
  "/en/villas/villa-pueblo",
  "/en/gallery",
  "/en/experiences",
  "/en/weddings",
  "/en/location",
];

/** Repeats allowed before it stops being a coincidence. */
const MAX_REPEAT = 2;

async function altsOn(page: import("@playwright/test").Page, route: string) {
  await page.goto(route, { waitUntil: "load" });
  /* Reveal — half the photography is below the fold and lazily mounted. */
  const total = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y <= total; y += 800) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(300);

  return page.evaluate(() => {
    const hidden = (el: Element) => {
      for (let n: Element | null = el; n; n = n.parentElement) {
        if (n.getAttribute?.("aria-hidden") === "true") return true;
      }
      return false;
    };
    /**
     * Text a sighted user reads right next to the image.
     *
     * Climbs until it finds a container that HAS text, rather than stopping at
     * the nearest matching ancestor. The register's cards wrap their image in a
     * bare `div.drag-card-figure` and put the name in the `li` above it, so
     * `closest()` alone reported "no adjacent text" for nineteen images that
     * are labelled perfectly well one level up.
     */
    const labelledNearby = (el: Element) => {
      let n: Element | null = el.parentElement;
      for (let depth = 0; n && depth < 4; n = n.parentElement, depth++) {
        const text = (n.textContent ?? "").replace(/\s+/g, " ").trim();
        if (text.length > 2) return true;
      }
      return false;
    };

    return [...document.querySelectorAll("img")]
      .filter((i) => !hidden(i))
      .map((i) => ({
        alt: (i.getAttribute("alt") ?? "").trim(),
        hasAlt: i.hasAttribute("alt"),
        labelled: labelledNearby(i),
        src: (i.getAttribute("src") ?? "").slice(0, 70),
      }));
  });
}

test.describe("alt text", () => {
  for (const route of ROUTES) {
    test(`${route} — every image is described, and no description repeats`, async ({ page }) => {
      const imgs = await altsOn(page, route);
      expect(imgs.length, `${route} rendered no images — nothing is being checked`).toBeGreaterThan(0);

      /* 1 + 4: an image either describes itself or declares itself decorative. */
      const undescribed = imgs.filter((i) => !i.hasAlt);
      expect(
        undescribed.map((i) => i.src),
        `${route}: images with no alt attribute at all`
      ).toEqual([]);

      const bareDecorative = imgs.filter((i) => !i.alt && !i.labelled);
      expect(
        bareDecorative.map((i) => i.src),
        `${route}: empty alt with no adjacent text — decorative is a claim, and ` +
          `nothing on the page backs it up`
      ).toEqual([]);

      /* 2: never a filename or a content hash. */
      const filenames = imgs.filter((i) => /\.(jpe?g|png|webp|avif)$/i.test(i.alt) || /^[0-9a-f]{16,}$/i.test(i.alt));
      expect(filenames.map((i) => i.alt), `${route}: alt text is a filename`).toEqual([]);

      /* 3: the rule that would have caught the original defect. */
      const counts = new Map<string, number>();
      for (const i of imgs) {
        if (!i.alt) continue;
        counts.set(i.alt, (counts.get(i.alt) ?? 0) + 1);
      }
      const overused = [...counts.entries()]
        .filter(([, n]) => n > MAX_REPEAT)
        .sort((a, b) => b[1] - a[1])
        .map(([alt, n]) => `${n}x "${alt.slice(0, 60)}"`);

      expect(
        overused,
        `${route}: the same description is used more than ${MAX_REPEAT} times.\n  ` +
          overused.join("\n  ") +
          `\nA repeated alt means a fallback is firing where a description should be.`
      ).toEqual([]);
    });
  }

  test("the estate and the wedding venue are the regression cases", async ({ page }) => {
    /*
     * Named explicitly because these two are the pages that were wrong, and
     * they are wrong for a reason that will come back: both carry ZERO captions
     * in the registry, so every generic fallback fires on every frame. If a
     * future change reintroduces one, it will show here first.
     */
    for (const route of ["/en/the-estate", "/en/weddings"]) {
      const imgs = await altsOn(page, route);
      const distinct = new Set(imgs.map((i) => i.alt).filter(Boolean)).size;
      const described = imgs.filter((i) => i.alt).length;
      expect(described, `${route} has no described images`).toBeGreaterThan(20);
      expect(
        distinct / described,
        `${route}: ${distinct} distinct descriptions for ${described} images`
      ).toBeGreaterThan(0.9);
    }
  });
});
