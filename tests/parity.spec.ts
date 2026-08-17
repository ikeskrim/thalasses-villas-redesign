import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * CONTENT-PARITY TESTS (systemic directive from T-169).
 *
 * A four-cell Collection passed typecheck, lint AND build. Static analysis
 * cannot see that a `.map()` over content silently produced one row fewer than
 * the inventory contains, so the acceptance checklist is asserted here against
 * the rendered DOM instead of being trusted.
 *
 * Every expectation is read from /content — not hard-coded — so the tests move
 * with the inventory rather than drifting from it.
 */

const CONTENT = path.join(process.cwd(), "content");
const readJson = <T,>(...p: string[]): T =>
  JSON.parse(fs.readFileSync(path.join(CONTENT, ...p), "utf-8")) as T;

const COLLECTION_FILES = ["200", "201", "202", "203", "pueblo"];

test.describe("homepage content parity", () => {
  test("Collection renders exactly the five named villas", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });

    const expected = COLLECTION_FILES.map(
      (f) => readJson<{ name: string }>("villas", `${f}.json`).name
    ).sort();

    const rendered = (
      await page.locator(".collection-cell .collection-name").allTextContents()
    )
      .map((s) => s.trim())
      .sort();

    expect(rendered).toEqual(expected);
    expect(rendered).toHaveLength(5);
  });

  test("the Estate entry is present with its clause", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    const labels = await page.locator(".clause").evaluateAll((els) =>
      els.map((e) => e.getAttribute("aria-label"))
    );
    expect(labels).toContain("Gathering ALL FOUR, ONE GATE");
  });

  test("the Register renders every experience in the inventory", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    const expected = fs
      .readdirSync(path.join(CONTENT, "experiences"))
      .filter((f) => f.endsWith(".json")).length;

    expect(expected).toBe(21);
    // The Register became a horizontal drag gallery in the elevation pass;
    // the count contract is unchanged.
    await expect(page.locator(".drag-card")).toHaveCount(expected);
  });

  test("Estate figures match the locked capacity table", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    const estate = readJson<{
      specs: { bedrooms: number; bathrooms: number; maxGuests: number; pools: number; sizeSqm: number };
    }>("villas", "2142.json");

    // Locked by the owner; the four-villa sums reconcile with these exactly.
    expect(estate.specs.bedrooms).toBe(9);
    expect(estate.specs.bathrooms).toBe(6);
    expect(estate.specs.maxGuests).toBe(18);
    expect(estate.specs.pools).toBe(4);
    expect(estate.specs.sizeSqm).toBe(240);

    // The estate proposition moved to the Estate Map in the Seasats rebuild.
    // The ledger, the clause and the enquiry CTA all travelled with it.
    const values = (await page.locator(".estate-map-ledger dd").allTextContents()).map((s) => s.trim());
    for (const v of ["9", "6", "18", "4", "240"]) {
      expect(values, `estate figure ${v} missing from the homepage`).toContain(v);
    }
    await expect(page.locator(".estate-map-cta a")).toHaveCount(1);
    await page.goto("/en/the-estate", { waitUntil: "load" });
    const full = (await page.locator(".estate-figure-value").allTextContents()).map((s) => s.trim());
    for (const v of ["9", "6", "18", "4", "240"]) {
      expect(full, `estate figure ${v} missing from /en/the-estate`).toContain(v);
    }
  });

  test("four-villa specs sum to the estate figures", () => {
    const sum = (k: "bedrooms" | "bathrooms" | "maxGuests") =>
      ["200", "201", "202", "203"]
        .map((f) => readJson<{ specs: Record<string, number> }>("villas", `${f}.json`).specs[k] ?? 0)
        .reduce((a, b) => a + b, 0);

    expect(sum("bedrooms")).toBe(9);
    expect(sum("bathrooms")).toBe(6);
    expect(sum("maxGuests")).toBe(18);
  });

  test("the operating licence is in the footer", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    const site = readJson<{ legal?: { operatingLicence?: string } }>("site.json");
    const licence = site.legal?.operatingLicence;
    expect(licence).toBe("1041K91003163701");
    await expect(page.locator(".site-footer")).toContainText(licence!);
  });

  test("no [CONFIRM] or draft badge in the rendered page", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    const body = await page.locator("body").innerText();
    expect(body).not.toContain("[CONFIRM]");
    expect(body).not.toContain("CONFIRM]");
    // Drafts may render in dev only; a production build must be clean.
    if (process.env.NODE_ENV !== "development") {
      expect(body).not.toContain("DRAFT — pending approval");
    }
  });

  test("villa ids are never used as lookup keys", () => {
    // villas/pueblo.json has id "10655" and rituals "7798" — a different id
    // space from the URL ids. Looking villas up by `id` silently returns
    // undefined, which is exactly how the fifth collection cell disappeared.
    const pueblo = readJson<{ id: string; slug: string }>("villas", "pueblo.json");
    expect(pueblo.id).not.toBe("pueblo");
    expect(pueblo.slug).toBe("villa-pueblo");

    const src = fs.readFileSync(path.join(process.cwd(), "src", "app", "page.tsx"), "utf-8");
    expect(
      /new Map\([^)]*\.map\(\s*\(?v\)?\s*=>\s*\[\s*v\.id/.test(src),
      "page.tsx keys a lookup map by villa.id — use the file key or slug instead"
    ).toBe(false);
  });

  test("every clause obeys the grammar", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    const labels = (
      await page.locator(".clause").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")))
    ).filter(Boolean) as string[];

    expect(labels.length).toBeGreaterThan(0);
    for (const label of labels) {
      expect(label, `"${label}" is closed by terminal punctuation`).not.toMatch(/[.!?;:]$/);
      const words = label.split(/\s+/).filter(Boolean);
      const gerund = words[0] ?? "";
      expect(gerund.toLowerCase(), `"${gerund}" is not a gerund`).toMatch(/ing$/);

      // The word caps are enforced at runtime by assertClause(), but that guard
      // returns early in production — so an over-long tail threw in dev while
      // `next build` shipped it happily. Asserting the caps here closes that gap
      // against the production build. (Found the hard way: an 8-word helipad
      // tail 500'd the dev server after a clean production build.)
      const tail = words.slice(1);
      expect(tail.length, `tail of "${label}" is ${tail.length} words; the cap is 6`)
        .toBeLessThanOrEqual(6);
    }
  });
});

/**
 * VILLA-PAGE CONTENT PARITY (extended for Phase 3, T-211).
 *
 * The template shipped with five owner-confirmed facts per villa reaching the
 * page only through JSON-LD — legible to a crawler, invisible to a guest. The
 * cause was upstream of the component: `VillaSpecs` in src/types never mirrored
 * the fields the capacity lock added, so `bedroomsDetail` and `bathroomsDetail`
 * did not exist as far as TypeScript was concerned and nothing complained.
 *
 * Read from /content, never hard-coded, so these move with the inventory.
 */
test.describe("villa content parity", () => {
  const VILLAS = [
    { key: "200", slug: "villa-thoi" },
    { key: "201", slug: "villa-persi" },
    { key: "202", slug: "villa-eeanthe" },
    { key: "203", slug: "villa-melia" },
    { key: "pueblo", slug: "villa-pueblo" },
  ];

  interface Specs {
    bedrooms: number | null;
    bathrooms: number | null;
    maxGuests: number | null;
    sizeSqm: number | null;
    bedroomsDetail?: string | null;
    bathroomsDetail?: string | null;
    view?: string | null;
    distanceToBeach?: string | null;
  }

  for (const v of VILLAS) {
    test(`${v.slug} prints every spec it holds`, async ({ page }) => {
      const { specs } = readJson<{ specs: Specs }>("villas", `${v.key}.json`);
      await page.goto(`/en/villas/${v.slug}`, { waitUntil: "load" });
      await page.waitForSelector(".villa-statement");

      // The four figures, in the approved ledger element.
      const values = (await page.locator(".villa-ledger .ledger-spec-value").allTextContents()).map(
        (s) => s.trim()
      );
      for (const n of [specs.bedrooms, specs.bathrooms, specs.maxGuests, specs.sizeSqm]) {
        if (n == null) continue;
        expect(values, `${v.slug}: ledger is missing ${n}`).toContain(String(n));
      }
      // Conventions §7 — a decoration may never state a false fact.
      expect(values, `${v.slug}: a ledger figure rendered as 0`).not.toContain("0");

      // The prose details the capacity lock added and no page ever printed.
      const rows = await page.locator(".villa-detail-row dd").allTextContents();
      const printed = rows.map((s) => s.trim());
      for (const d of [
        specs.bedroomsDetail,
        specs.bathroomsDetail,
        specs.view,
        specs.distanceToBeach,
      ]) {
        if (!d) continue;
        expect(printed, `${v.slug}: "${d}" is in the inventory but not on the page`).toContain(d);
      }
    });
  }

  test("every villa page carries the numbered spine, in order", async ({ page }) => {
    for (const v of VILLAS) {
      await page.goto(`/en/villas/${v.slug}`, { waitUntil: "load" });
      const labels = await page.locator("main .micro").allTextContents();
      const beats = labels
        .map((s) => s.trim().match(/^(\d\d) — /)?.[1])
        .filter(Boolean) as string[];
      expect(beats, `${v.slug} spine`).toEqual(["01", "02", "03", "04", "05"]);
    }
  });

  test("the Estate page numbers its own beats, not the homepage's", async ({ page }) => {
    await page.goto("/en/the-estate", { waitUntil: "load" });
    const labels = await page.locator("main .micro").allTextContents();
    const beats = labels.map((s) => s.trim().match(/^(\d\d) — /)?.[1]).filter(Boolean) as string[];
    expect(beats).toEqual(["01", "02", "03", "04", "05"]);
    // The map component hard-coded the homepage's beat number for a while.
    expect(labels.map((s) => s.trim())).not.toContain("06 — The Estate");
  });
});

test.describe("curation rulings", () => {
  const BLOCKED_HASHES = [
    "bc870bf24a014973d25acd877b7cf856",
    "635d506527ac868f8d19826ccd2cd581",
    "d75844e8e4b2b9664d2eb3e2103373e5",
    "d46d74613184883ec42184d66d1eef0a",
    "fafea700c4a888003811c8139e89ec87",
    "4088b922635567e2a388c664796a8760",
    "9e80231c072456bb5f5b0de3f1943b64",
    "89b9b7d0649de8eaf9e70763e3b9c2f5",
  ];

  const ROUTES = [
    "/",
    "/en/the-estate",
    "/en/villas/villa-thoi",
    "/en/villas/villa-persi",
    "/en/villas/villa-eeanthe",
    "/en/villas/villa-melia",
    "/en/villas/villa-pueblo",
  ];

  for (const route of ROUTES) {
    test(`no ruled-off image renders on ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: "load" });
      await page.evaluate(async () => {
        const step = Math.round(window.innerHeight * 0.9);
        for (let y = 0; y <= document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
      });
      const srcs = await page.evaluate(() =>
        [...document.querySelectorAll("img")].map((i) => decodeURIComponent(i.currentSrc || i.src))
      );
      const html = await page.content();
      for (const h of BLOCKED_HASHES) {
        expect(srcs.join(" "), `${h} rendered on ${route}`).not.toContain(h);
        expect(html, `${h} referenced in the markup of ${route}`).not.toContain(h);
      }
      expect(html).not.toContain("Rituals-p-4");
      expect(html).not.toContain("AMZ_7491");
    });
  }

  test("only curated A-grade frames appear on the homepage full-bleed beats", async ({ page }) => {
    const selects = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "content", "photo-selects.json"), "utf-8")
    ) as { selects: { n: number; grade: string; file: string }[] };
    const aFiles = new Set(
      selects.selects.filter((s) => s.grade === "A").map((s) => s.file?.replace(/\.\w+$/, ""))
    );
    await page.goto("/", { waitUntil: "load" });
    const fieldImgs = await page.evaluate(() =>
      [...document.querySelectorAll(".field img, .kenburns img, .pinned-media img")].map((i) =>
        decodeURIComponent((i as HTMLImageElement).currentSrc || (i as HTMLImageElement).src)
      )
    );
    expect(fieldImgs.length).toBeGreaterThan(0);
    for (const src of fieldImgs) {
      const stem = src.split("/").pop()?.split("&")[0]?.replace(/\.\w+.*$/, "") ?? "";
      expect([...aFiles].some((a) => a && stem.includes(a)), `non-A-grade frame full-bleed: ${src}`).toBe(true);
    }
  });
});
