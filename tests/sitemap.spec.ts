import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * EVERY PAGE IS EITHER SITEMAPPED OR EXCLUDED ON PURPOSE.
 *
 * The Gallery shipped, went into the nav, got a route and a share card — and
 * never entered the sitemap, because the villas and experiences were derived
 * from the registry while the eight static routes were typed by hand. One page
 * a visitor could open and a crawler was never told about, in a file whose own
 * comment said a hand-maintained list drifts (T-298).
 *
 * The generator derives everything now. This is the guard that keeps it honest:
 * a page added next month is in the sitemap on the day it is created, or the
 * suite says why not.
 *
 * Routes are discovered from the FILESYSTEM rather than listed, so this test
 * cannot fall behind the app the way the thing it is guarding did.
 */
const APP = path.join(process.cwd(), "src", "app");

function routesOnDisk(): string[] {
  const out: string[] = [];
  const walk = (dir: string, segments: string[]) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const name = entry.name;
      if (name.startsWith("[") || name.startsWith("_") || name.startsWith("(")) continue;
      const next = path.join(dir, name);
      if (fs.existsSync(path.join(next, "page.tsx"))) out.push("/" + [...segments, name].join("/"));
      walk(next, [...segments, name]);
    }
  };
  if (fs.existsSync(path.join(APP, "page.tsx"))) out.push("/");
  walk(APP, []);
  return out;
}

/** Kept in step with `EXCLUDED` in `src/app/sitemap.ts`, and asserted below. */
const EXPECTED_EXCLUSIONS = ["/styleguide"];

test.describe("sitemap", () => {
  test("every static route on disk is sitemapped or explicitly excluded", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const xml = await res.text();
    const listed = new Set(
      [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
        (m) => m[1]!.replace("https://thalasses.com", "") || "/"
      )
    );

    const onDisk = routesOnDisk();
    expect(onDisk.length, "no routes discovered — this test is not looking at anything").toBeGreaterThan(8);
    expect(listed.size, "the sitemap is empty").toBeGreaterThan(20);

    const missing = onDisk.filter((r) => !listed.has(r) && !EXPECTED_EXCLUSIONS.includes(r));
    expect(
      missing,
      `these routes exist and are not in the sitemap:\n  ${missing.join("\n  ")}\n` +
        `Either they belong in it, or add them to EXCLUDED in src/app/sitemap.ts with a reason.`
    ).toEqual([]);
  });

  test("the exclusions are real and are declared in the generator", () => {
    /*
     * An exclusion list is only honest if it is short and if the reasons are
     * written down. This asserts the generator states one for each.
     */
    const src = fs.readFileSync(path.join(APP, "sitemap.ts"), "utf-8");
    for (const route of EXPECTED_EXCLUSIONS) {
      expect(src, `${route} is excluded here but not declared in the generator`).toContain(route);
    }
    expect(
      EXPECTED_EXCLUSIONS.length,
      "the exclusion list has grown — every entry needs a reason someone can argue with"
    ).toBeLessThanOrEqual(3);
  });

  test("nothing in the sitemap 404s", async ({ request }) => {
    /*
     * The other direction. Telling a search engine to fetch a page that does not
     * exist is the same defect as the unpublished-locale hreflang (T-280), and
     * a sitemap is the loudest possible way to do it.
     */
    const res = await request.get("/sitemap.xml");
    const xml = await res.text();
    const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (m) => m[1]!.replace("https://thalasses.com", "") || "/"
    );
    expect(paths.length).toBeGreaterThan(20);

    for (const p of paths) {
      const r = await request.get(p, { maxRedirects: 0 });
      expect(r.status(), `${p} is in the sitemap and answered ${r.status()}`).toBe(200);
    }
  });
});
