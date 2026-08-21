import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * NO IMAGE ADDRESS RESOLVES TO A MISSING FILE.
 *
 * 159 byte-identical duplicate files were deleted from `public/images` and every
 * address that pointed at one now resolves through `content/image-aliases.json`
 * instead (T-301). That reclaims 104.6 MB and it introduces exactly one new way
 * to break the site: an address whose alias target is not there.
 *
 * So the guard is the obvious one, and it runs against the **rendered pages**
 * rather than against the map — a resolver that returns a tidy path to nothing
 * would satisfy any check that only reads JSON.
 */
const ROOT = process.cwd();
const ALIASES = JSON.parse(
  fs.readFileSync(path.join(ROOT, "content", "image-aliases.json"), "utf-8")
) as { aliases: Record<string, string> };

const ROUTES = [
  "/",
  "/en/the-estate",
  "/en/villas/villa-thoi",
  "/en/villas/villa-eeanthe",
  "/en/villas/villa-pueblo",
  "/en/gallery",
  "/en/experiences",
  "/en/weddings",
  "/en/location",
];

test.describe("image integrity", () => {
  test("every alias target exists on disk", () => {
    const entries = Object.entries(ALIASES.aliases);
    expect(entries.length, "no aliases — this test is not looking at anything").toBeGreaterThan(50);

    const missing: string[] = [];
    for (const [from, to] of entries) {
      const file = path.join(ROOT, "public", to.replace(/^\//, ""));
      if (!fs.existsSync(file)) missing.push(`${from} -> ${to}`);
      /* And the alias must not point at itself or at another alias. */
      expect(to, `${from} aliases to itself`).not.toBe(from);
      expect(ALIASES.aliases[to], `${from} -> ${to} is a chained alias`).toBeUndefined();
    }
    expect(missing, `alias targets missing from disk:\n  ${missing.join("\n  ")}`).toEqual([]);
  });

  test("no deleted duplicate is still on disk", () => {
    /*
     * The other direction: if a redundant file came back — restored by a bad
     * merge, or a re-run of a capture script — the repository silently regains
     * the weight and the alias map quietly stops meaning anything.
     */
    const survivors = Object.keys(ALIASES.aliases).filter((from) =>
      fs.existsSync(path.join(ROOT, "public", from.replace(/^\//, "")))
    );
    expect(
      survivors.slice(0, 10),
      `${survivors.length} aliased duplicates are back on disk — run \`npm run dedupe\``
    ).toEqual([]);
  });

  for (const route of ROUTES) {
    test(`${route} — every image it asks for is served`, async ({ page, request }) => {
      const failed: string[] = [];
      page.on("response", (r) => {
        const u = new URL(r.url());
        if (!u.pathname.startsWith("/_next/image") && !u.pathname.startsWith("/images/")) return;
        if (r.status() >= 400) failed.push(`${r.status()} ${u.pathname}${u.search.slice(0, 60)}`);
      });

      await page.goto(route, { waitUntil: "load" });
      /* Reveal everything — a lazy image below the fold is still an image the
         page asks for, and half of them live there. */
      const total = await page.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y <= total; y += 800) {
        await page.evaluate((v) => window.scrollTo(0, v), y);
        await page.waitForTimeout(40);
      }
      await page.waitForTimeout(400);

      expect(failed, `${route} requested images that did not serve:\n  ${failed.join("\n  ")}`).toEqual(
        []
      );

      /*
       * And the raw sources, checked directly. `next/image` can succeed at
       * serving a placeholder while the underlying file is gone, so the srcs
       * are also fetched as plain paths.
       */
      const srcs = await page.evaluate(() =>
        [...document.querySelectorAll("img")]
          .map((i) => i.getAttribute("src") ?? "")
          .filter((s) => s.startsWith("/images/"))
      );
      for (const s of [...new Set(srcs)].slice(0, 40)) {
        const r = await request.get(s);
        expect(r.status(), `${route} references ${s}, which does not serve`).toBe(200);
      }
    });
  }
});
