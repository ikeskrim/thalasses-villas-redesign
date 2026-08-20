import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * THE SOFT-404 CLASS GUARD.
 *
 * `/en/villas/anything-invalid` returned **200** while rendering the not-found
 * page. It looked perfect and it lied to Google: a soft 404 tells a crawler the
 * page exists, which after a domain move is exactly how dead URLs stay in the
 * index and a migration leaks authority.
 *
 * Fixing the two known routes would have been fixing instances. This guards the
 * CLASS in two layers:
 *
 *   1. SOURCE — every dynamic segment under src/app is DISCOVERED from the
 *      filesystem and must declare `dynamicParams = false` (or opt out with a
 *      documented reason). A new `[slug]` route added next month fails here on
 *      the day it is written, before anyone thinks to test its 404 behaviour.
 *
 *   2. BEHAVIOUR — every discovered family is driven with a nonsense slug and
 *      must answer 404, asserted on the STATUS rather than on the page. The
 *      original bug was invisible to anyone reading the rendered output.
 *
 * Route families are read from disk rather than listed here, so the guard
 * cannot fall behind the app (derive-don't-type, T-248).
 */
const APP = path.join(process.cwd(), "src", "app");

function dynamicRouteFamilies(): { dir: string; urlBase: string }[] {
  const out: { dir: string; urlBase: string }[] = [];
  (function walk(dir: string, url: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const next = path.join(dir, entry.name);
      // Route groups (parentheses) do not appear in the URL.
      const isGroup = entry.name.startsWith("(") && entry.name.endsWith(")");
      if (/^\[.+\]$/.test(entry.name)) {
        if (fs.existsSync(path.join(next, "page.tsx"))) out.push({ dir: next, urlBase: url });
        continue;
      }
      walk(next, isGroup ? url : `${url}/${entry.name}`);
    }
  })(APP, "");
  return out;
}

const FAMILIES = dynamicRouteFamilies();

test.describe("soft-404 guard", () => {
  test("dynamic route families were actually discovered", () => {
    // If this ever reads zero, the discovery is broken and every assertion
    // below is vacuously passing — the failure mode this project keeps hitting.
    expect(FAMILIES.length, "no dynamic route families found — discovery is broken").toBeGreaterThan(0);
  });

  for (const family of FAMILIES) {
    // split/join rather than a backslash regex — the escaping does not survive
    // being written through a shell heredoc, and a half-escaped regex is an
    // unterminated string that Playwright reports as "No tests found".
    const rel = path.relative(process.cwd(), family.dir).split(path.sep).join("/");

    test(`${rel} declares dynamicParams = false`, () => {
      const src = fs.readFileSync(path.join(family.dir, "page.tsx"), "utf-8");
      const declared = /export\s+const\s+dynamicParams\s*=\s*false/.test(src);
      const optOut = /SOFT-404-OPT-OUT:/.test(src);
      expect(
        declared || optOut,
        `${rel} accepts unknown slugs. Either export \`dynamicParams = false\`, or — if the ` +
          `route genuinely must accept arbitrary slugs — write a comment containing ` +
          `"SOFT-404-OPT-OUT:" with the reason and how it returns a real 404.`
      ).toBe(true);
    });

    test(`${family.urlBase}/<unknown> returns a real 404`, async ({ page }) => {
      const res = await page.goto(`${family.urlBase}/definitely-not-a-real-slug-9z`, {
        waitUntil: "load",
      });
      expect(
        res?.status(),
        `${family.urlBase} answers 200 for an unknown slug — a crawler will treat it as real`
      ).toBe(404);
    });
  }

  test("a nonsense top-level route is also a real 404", async ({ page }) => {
    const res = await page.goto("/no-such-page-at-all-9z", { waitUntil: "load" });
    expect(res?.status()).toBe(404);
  });
});
