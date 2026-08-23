import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * THE META LAYER — unique, and short enough to survive a search result.
 *
 * Four villa pages shipped the **same 597-character description**: the legacy
 * `meta.description`, one paragraph the registry gives identically to Thoi,
 * Persi, Eeanthe and Melia.
 *
 * Two failures, and the second is the worse one. It is roughly four times what
 * a search engine renders, so the useful half is cut off mid-sentence. And it
 * is identical across four pages, so the single place a searcher can tell four
 * houses apart says nothing at all.
 *
 * Neither is visible on the page. That is the whole reason this file exists:
 * the meta layer is the part of a site nobody looks at, which is exactly why it
 * drifts — the same argument as the JSON-LD guard (T-271).
 */
const LIMIT = 160;

function routes(): string[] {
  const dir = path.join(process.cwd(), "content", "experiences");
  const experiences = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => (JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")) as { slug?: string }).slug)
    .filter((s): s is string => Boolean(s))
    .map((s) => `/en/experiences/${s}`);

  return [
    "/",
    "/en/the-estate",
    "/en/gallery",
    "/en/experiences",
    "/en/weddings",
    "/en/location",
    "/en/careers",
    "/en/contact",
    "/en/terms",
    ...["villa-thoi", "villa-persi", "villa-eeanthe", "villa-melia", "villa-pueblo"].map(
      (s) => `/en/villas/${s}`
    ),
    ...experiences,
  ];
}

test.describe("meta layer", () => {
  test("every page has a unique title and a unique description within the limit", async ({
    page,
  }) => {
    const list = routes();
    expect(list.length, "no routes discovered — this test is not looking at anything").toBeGreaterThan(30);

    const seenTitle = new Map<string, string[]>();
    const seenDesc = new Map<string, string[]>();
    const tooLong: string[] = [];
    const missing: string[] = [];

    for (const route of list) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const title = await page.title();
      const desc = await page
        .locator('meta[name="description"]')
        .first()
        .getAttribute("content");

      seenTitle.set(title, [...(seenTitle.get(title) ?? []), route]);
      if (!desc?.trim()) {
        missing.push(route);
        continue;
      }
      seenDesc.set(desc, [...(seenDesc.get(desc) ?? []), route]);
      if (desc.length > LIMIT) tooLong.push(`${route} — ${desc.length} chars`);
    }

    expect(missing, "pages with no meta description").toEqual([]);

    const dupTitles = [...seenTitle.entries()].filter(([, r]) => r.length > 1);
    expect(
      dupTitles.map(([t, r]) => `"${t.slice(0, 50)}" on ${r.join(", ")}`),
      "pages sharing a title"
    ).toEqual([]);

    const dupDescs = [...seenDesc.entries()].filter(([, r]) => r.length > 1);
    expect(
      dupDescs.map(([d, r]) => `"${d.slice(0, 50)}…" on ${r.join(", ")}`),
      "pages sharing a description — the one place a searcher sees a difference"
    ).toEqual([]);

    expect(
      tooLong,
      `descriptions over ${LIMIT} characters — a search engine truncates these mid-sentence`
    ).toEqual([]);
  });

  test("every authored description resolves against the registry", () => {
    /*
     * The same rule as every other authored line on this site: a fact in a
     * description must be a fact in `content/`. Each entry names the fields it
     * draws on, and this asserts the naming is real rather than decorative —
     * a `source` nobody can follow is a comment, not a citation.
     */
    const mod = fs.readFileSync(path.join(process.cwd(), "src", "lib", "meta-copy.ts"), "utf-8");
    const entries = [...mod.matchAll(/source:\s*\n?\s*"([^"]+)"/g)].map((m) => m[1]!);
    expect(entries.length, "no sources declared").toBeGreaterThanOrEqual(7);
    for (const s of entries) {
      expect(s.length, `a source line is too short to be a citation: "${s}"`).toBeGreaterThan(20);
      expect(
        /specs|shortDescription|designation|villas\//.test(s),
        `a source line names no registry field: "${s}"`
      ).toBe(true);
    }
  });

  test("every route still has its own OpenGraph card", async ({ page }) => {
    /*
     * Built in overnight/16 and asserted here too, because a meta change is
     * exactly the kind of edit that quietly drops an og:image.
     */
    for (const route of ["/", "/en/the-estate", "/en/villas/villa-thoi", "/en/experiences/hiking"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const og = await page.locator('meta[property="og:image"]').first().getAttribute("content");
      expect(og, `${route} has no og:image`).toBeTruthy();
      expect(new URL(og!).pathname, `${route} inherited the wrong card`).toContain("opengraph-image");
    }
  });
});
