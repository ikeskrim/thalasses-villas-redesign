import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * STRUCTURED DATA — parsed and checked against the registry.
 *
 * JSON-LD is the one part of the site nobody looks at, which is exactly why it
 * drifts: a capacity can be corrected in `content/` and on the page while the
 * markup a search engine reads keeps the old number for months. Nothing on the
 * screen would look wrong.
 *
 * So the emitted markup is parsed and every occupancy figure is asserted against
 * `content/villas/*.json` — the same locked table the pages read.
 */
const CONTENT = path.join(process.cwd(), "content");
const readJson = <T,>(...p: string[]): T =>
  JSON.parse(fs.readFileSync(path.join(CONTENT, ...p), "utf-8")) as T;

const VILLAS = [
  ["200", "villa-thoi"],
  ["201", "villa-persi"],
  ["202", "villa-eeanthe"],
  ["203", "villa-melia"],
  ["pueblo", "villa-pueblo"],
] as const;

async function ld(page: import("@playwright/test").Page) {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.map((b) => {
    try {
      return JSON.parse(b) as Record<string, unknown>;
    } catch (e) {
      throw new Error(`JSON-LD did not parse: ${String(e)}\n${b.slice(0, 200)}`);
    }
  });
}

test.describe("structured data", () => {
  for (const [key, slug] of VILLAS) {
    test(`${slug} — VacationRental matches the locked capacity table`, async ({ page }) => {
      const villa = readJson<{
        name: string;
        specs: { bedrooms: number; bathrooms: number; maxGuests: number; sizeSqm: number };
      }>("villas", `${key}.json`);

      await page.goto(`/en/villas/${slug}`, { waitUntil: "load" });
      const blocks = await ld(page);
      const rental = blocks.find((b) => b["@type"] === "VacationRental");
      expect(rental, `${slug} emits no VacationRental block`).toBeTruthy();

      expect(rental!.name).toBe(villa.name);
      expect(rental!.numberOfBedrooms).toBe(villa.specs.bedrooms);
      expect(rental!.numberOfBathroomsTotal).toBe(villa.specs.bathrooms);
      expect((rental!.occupancy as { maxValue: number }).maxValue).toBe(villa.specs.maxGuests);
      expect((rental!.floorSize as { value: number }).value).toBe(villa.specs.sizeSqm);

      // Required by Google for a lodging entity, and easy to lose in a rewrite.
      const address = rental!.address as Record<string, string>;
      expect(address["@type"]).toBe("PostalAddress");
      expect(address.addressCountry).toBe("GR");
      expect(address.addressLocality).toBe("Rethymno");
    });
  }

  test("the estate block matches the owner-locked figures", async ({ page }) => {
    const estate = readJson<{ specs: { bedrooms: number } }>("villas", "2142.json");
    await page.goto("/en/the-estate", { waitUntil: "load" });
    const blocks = await ld(page);
    const lodging = blocks.find((b) => b["@type"] === "LodgingBusiness");
    expect(lodging, "the estate emits no LodgingBusiness block").toBeTruthy();
    expect(lodging!.numberOfRooms).toBe(estate.specs.bedrooms);
    expect(lodging!.numberOfRooms).toBe(9);
  });

  test("every JSON-LD block on every route parses and declares a type", async ({ page }) => {
    const routes = [
      "/",
      "/en/the-estate",
      "/en/villas/villa-thoi",
      "/en/experiences",
      "/en/weddings",
      "/en/gallery",
      "/en/contact",
    ];
    for (const route of routes) {
      await page.goto(route, { waitUntil: "load" });
      const blocks = await ld(page);
      for (const b of blocks) {
        expect(b["@context"], `${route}: a block has no @context`).toBe("https://schema.org");
        expect(b["@type"], `${route}: a block has no @type`).toBeTruthy();
      }
    }
  });

  test("no JSON-LD figure is a placeholder or a zero", async ({ page }) => {
    // A decoration may never state a false fact (Conventions §7) — and markup a
    // human never reads is the easiest place for a zero to survive.
    for (const [, slug] of VILLAS) {
      await page.goto(`/en/villas/${slug}`, { waitUntil: "load" });
      const raw = (await page.locator('script[type="application/ld+json"]').allTextContents()).join(" ");
      expect(raw, `${slug} JSON-LD contains a zero figure`).not.toMatch(/"number[A-Za-z]*":\s*0\b/);
      expect(raw, `${slug} JSON-LD contains null`).not.toContain(": null");
    }
  });

  test("the site-wide OpenGraph card renders", async ({ request }) => {
    const res = await request.get("/opengraph-image");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
    const body = await res.body();
    // A blank or failed card would still be a PNG; assert it has real weight.
    expect(body.length, "the OG card is suspiciously small").toBeGreaterThan(5000);
  });
});
