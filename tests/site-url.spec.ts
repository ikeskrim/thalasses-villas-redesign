import { expect, test } from "@playwright/test";

/**
 * ONE ORIGIN, EVERYWHERE.
 *
 * The domain used to be hard-coded in three files — the `metadataBase` behind
 * every canonical and every OpenGraph URL, the sitemap's base, and the sitemap
 * line in `robots.txt`. Three copies of one fact, and launch day would have
 * meant finding all three under time pressure, or finding two.
 *
 * This asserts they now agree, whatever the value is. It reads the origin from
 * the page rather than from a constant, so it passes on localhost, on a preview
 * deployment and on the live domain — and fails the moment one of the three
 * drifts from the other two, which is the only failure that matters.
 */
test.describe("site URL", () => {
  test("canonical, sitemap and robots all name the same origin", async ({ page, request }) => {
    await page.goto("/en/terms");
    const canonical = await page.locator('link[rel="canonical"]').first().getAttribute("href");
    expect(canonical, "no canonical to read an origin from").toBeTruthy();
    const origin = new URL(canonical!).origin;

    const robots = await (await request.get("/robots.txt")).text();
    const sitemapLine = /Sitemap:\s*(\S+)/i.exec(robots);
    expect(sitemapLine, "robots.txt declares no sitemap").toBeTruthy();
    expect(
      new URL(sitemapLine![1]!).origin,
      `robots.txt points at a different origin than the canonical (${origin})`
    ).toBe(origin);

    const xml = await (await request.get("/sitemap.xml")).text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
    expect(locs.length, "the sitemap is empty").toBeGreaterThan(20);
    const wrong = locs.filter((l) => new URL(l).origin !== origin);
    expect(
      wrong.slice(0, 5),
      `sitemap entries on a different origin than the canonical (${origin})`
    ).toEqual([]);
  });

  test("every OpenGraph image URL is absolute and on that origin", async ({ page }) => {
    /*
     * The reason this matters more than it looks: a share card is fetched by
     * whoever renders the preview — Slack, iMessage, a search engine. A relative
     * og:image is simply not fetched, and an og:image on the WRONG origin makes
     * a preview deployment serve a card from the client's live site.
     */
    for (const route of ["/", "/en/villas/villa-thoi", "/en/the-estate", "/en/weddings"]) {
      await page.goto(route);
      const src = await page.locator('meta[property="og:image"]').first().getAttribute("content");
      expect(src, `${route} declares no og:image`).toBeTruthy();
      expect(src!.startsWith("http"), `${route} og:image is not absolute: ${src}`).toBe(true);

      const canonical = await page.locator('link[rel="canonical"]').first().getAttribute("href");
      if (canonical) {
        expect(
          new URL(src!).origin,
          `${route} og:image is on a different origin than its canonical`
        ).toBe(new URL(canonical).origin);
      }
    }
  });

  test("the default, with nothing configured, is the launch domain", async ({ request }) => {
    /*
     * The site must not need configuration to be correct today. If SITE_URL is
     * set in this environment the assertion is skipped rather than failed —
     * a staging build being staging is the feature, not a defect.
     */
    test.skip(Boolean(process.env.SITE_URL), "SITE_URL is set in this environment");
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain("https://thalasses.com");
  });

  test("no source file hard-codes the origin any more", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const dir = path.join(process.cwd(), "src");

    const offenders: string[] = [];
    const walk = (d: string) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) {
          if (e.name === "generated") continue; /* the derived redirect table */
          walk(p);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(e.name)) continue;
        if (p.endsWith(`site-url.ts`)) continue; /* where the fallback lives */
        const src = fs.readFileSync(p, "utf-8");
        for (const line of src.split("\n")) {
          /* A comment may mention the domain; a string literal may not. */
          if (line.trimStart().startsWith("*") || line.trimStart().startsWith("//")) continue;
          if (/["'`]https:\/\/thalasses\.com/.test(line)) {
            offenders.push(`${path.relative(process.cwd(), p)}: ${line.trim().slice(0, 80)}`);
          }
        }
      }
    };
    walk(dir);

    expect(
      offenders,
      `these files hard-code the origin instead of reading it from src/lib/site-url.ts:\n  ` +
        offenders.join("\n  ")
    ).toEqual([]);
  });
});
