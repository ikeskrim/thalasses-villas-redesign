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

    /*
     * The container moved twice and the contract did not. Direction D replaced
     * the Collection grid with one villa per viewport; Direction F
     * (DECISIONS.md D-001) replaced that with six cards in `#villas`, five
     * named villas and the estate. The five names are what is asserted, because
     * the five names are what this test has always been about.
     */
    const rendered = (await page.locator("#villas .ho-card h3").allTextContents())
      .map((s) => s.trim())
      .filter((n) => n !== "The Entire Estate")
      .sort();

    expect(rendered).toEqual(expected);
    expect(rendered).toHaveLength(5);
  });

  test("the Estate entry is present, with its proposition", async ({ page }) => {
    /*
     * IT USED TO ASSERT THE CLAUSE "Gathering ALL FOUR, ONE GATE".
     *
     * The clause is Direction D's signature element and Direction F carries no
     * clauses, so that assertion could only be met by a page that no longer
     * exists. What this test is protecting is not the element: it is that the
     * homepage still OFFERS THE WHOLE ESTATE, which is the single highest-value
     * booking on the site and the thing a four-villa grid quietly loses.
     *
     * So it asserts the offer, in whatever markup carries it.
     */
    await page.goto("/", { waitUntil: "load" });
    const card = page.locator(".ho-card--wide").first();
    await expect(card, "the homepage no longer offers the estate as one house").toHaveCount(1);
    const text = ((await card.textContent()) ?? "").replace(/\s+/g, " ");
    expect(text).toContain("The Entire Estate");
    expect(text, "the estate card no longer says what it is").toMatch(/four seafront villas/i);
  });

  test("the Register renders every experience in the inventory", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    const expected = fs
      .readdirSync(path.join(CONTENT, "experiences"))
      .filter((f) => f.endsWith(".json")).length;

    expect(expected).toBe(21);

    /*
     * ALL TWENTY-ONE ARE ON THE PAGE. EIGHTEEN OF THEM ARE IN THE GRID.
     *
     * Direction F groups the experiences by kind — Sea, Land, Taste, Wellness —
     * and the three the registry files under "Service" are placed where they
     * belong instead: the wedding has its own section, and the helipad and the
     * chauffeur sit in Discover Crete as arrival. That is the standing rule
     * working as intended (reorganise, never delete), and it is exactly the
     * kind of move that hides a deletion, so the deletion is what is checked.
     *
     * Counting `.ho-card` in `#experiences` would have passed at 18 and said
     * nothing. Every experience is looked up BY NAME across the whole page.
     */
    const names = fs
      .readdirSync(path.join(CONTENT, "experiences"))
      .filter((f) => f.endsWith(".json"))
      .map((f) => readJson<{ name: string }>("experiences", f).name);

    const body = ((await page.locator("body").textContent()) ?? "").replace(/\s+/g, " ");

    /*
     * THREE ARE REPRESENTED RATHER THAN LISTED, and each must be findable.
     *
     * A bare name check would demand the homepage print "Chauffeur" as a card
     * title, which is not what reorganising means. But "it is represented
     * somewhere" is exactly the claim that lets content disappear: this test
     * first ran with the chauffeur nowhere on the page at all, behind a comment
     * in `hotel-data.ts` asserting it sat in Discover Crete. It did not — the
     * line read "Arrival by car", which is how anyone arrives anywhere.
     *
     * So each of the three names the SECTION it moved to and a phrase only its
     * own offer would produce. Move it again and this fails, which is the point.
     */
    const RELOCATED: Record<string, { section: string; proof: RegExp }> = {
      Chauffeur: { section: "#crete", proof: /meet you at the airport or the port/i },
      "Private Helipad": { section: "#crete", proof: /helicopter/i },
      "Dream Wedding on the Beach": { section: "#weddings", proof: /wedding/i },
    };

    const missing: string[] = [];
    for (const n of names) {
      const moved = RELOCATED[n];
      if (!moved) {
        if (!body.includes(n)) missing.push(`${n} — not on the page at all`);
        continue;
      }
      const section = ((await page.locator(moved.section).textContent()) ?? "").replace(/\s+/g, " ");
      if (!moved.proof.test(section)) {
        missing.push(`${n} — relocated to ${moved.section}, which no longer describes it`);
      }
    }

    expect(
      missing,
      `these experiences are in the inventory and unreachable on the homepage:\n  ${missing.join("\n  ")}`
    ).toEqual([]);

    /* And the grid itself still carries the four groups it claims to. */
    await expect(page.locator("#experiences .ho-card")).toHaveCount(18);
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

    /*
     * THREE OF THE FIVE ARE ON THE HOMEPAGE; ALL FIVE ARE ON THE ESTATE PAGE.
     *
     * Direction F's estate card states bedrooms, beds and pools — "9 bedrooms,
     * 18 in beds, 4 pools, one table for 18" — and leaves bathrooms and the
     * square-metre figure to `/en/the-estate`, which carries the full ledger.
     * That is an editorial choice about a card, not a loss: the assertion below
     * checks the homepage says what it says, and the assertion after it checks
     * that nothing was dropped on the way.
     */
    const card = ((await page.locator(".ho-card--wide").first().textContent()) ?? "").replace(
      /\s+/g,
      " "
    );
    for (const v of ["9", "18", "4"]) {
      expect(card, `estate figure ${v} missing from the homepage card`).toContain(v);
    }
    /* The card is a route into the offer, not a dead end. */
    await expect(page.locator('.ho-card--wide a[href*="/en/"]').first()).toHaveCount(1);
    await page.goto("/en/the-estate", { waitUntil: "load" });
    // Direction D replaced the bespoke figures block with the shared Ledger.
    const full = (await page.locator(".d-ledger .ledger-spec-value").allTextContents()).map((s) =>
      s.trim()
    );
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
    /*
     * `.ho-footer` on the homepage, `.site-footer` everywhere else. Direction F
     * brings its own hotel footer and the licence travelled with it — which is
     * the point of the test, since an operating licence is a legal obligation
     * and the easiest thing in a redesign to leave behind.
     */
    await expect(page.locator(".ho-footer")).toContainText(licence!);
    await page.goto("/en/the-estate", { waitUntil: "load" });
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
    /* The clause is Direction D's element and the homepage is Direction F now;
       the estate page carries four of them. */
    await page.goto("/en/the-estate", { waitUntil: "load" });
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
      await page.waitForSelector(".d-spec-strip");

      // The four figures, in the approved ledger element.
      const values = (await page.locator(".d-spec-value, .d-spec-sub").allTextContents()).map(
        (s) => s.trim()
      );
      // The spec strip carries units now ("60 m2"), so match on containment
      // across the strip rather than on an exact cell string.
      const joined = values.join(" | ");
      for (const n of [specs.bedrooms, specs.bathrooms, specs.maxGuests, specs.sizeSqm]) {
        if (n == null) continue;
        expect(joined, `${v.slug}: spec strip is missing ${n}`).toContain(String(n));
      }
      // Conventions §7 — a decoration may never state a false fact.
      expect(values, `${v.slug}: a ledger figure rendered as 0`).not.toContain("0");

      // The prose details the capacity lock added and no page ever printed.
      const rows = await page.locator(".d-detail-row dd").allTextContents();
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
      // Gapless from 01, however many beats the template carries — the count is
      // a composition decision; the absence of gaps is the rule.
      expect(beats, `${v.slug} spine: ${beats.join(", ")}`).toEqual(
        beats.map((_, i) => String(i + 1).padStart(2, "0"))
      );
      expect(beats.length, `${v.slug} has no numbered spine`).toBeGreaterThanOrEqual(5);
    }
  });

  test("the Estate page numbers its own beats, not the homepage's", async ({ page }) => {
    await page.goto("/en/the-estate", { waitUntil: "load" });
    const labels = await page.locator("main .micro").allTextContents();
    const beats = labels.map((s) => s.trim().match(/^(\d\d) — /)?.[1]).filter(Boolean) as string[];
    // Gapless from 01, whatever the template's beat count is.
    expect(beats, `estate spine: ${beats.join(", ")}`).toEqual(
      beats.map((_, i) => String(i + 1).padStart(2, "0"))
    );
    expect(beats.length).toBeGreaterThanOrEqual(5);
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
      /*
       * NO SCROLL-WALK. It was here to force lazy images to load so that
       * `currentSrc` was populated — but `next/image` puts every `src` in the
       * server markup regardless of loading state, so the walk bought nothing
       * and cost everything: these routes are twenty thousand pixels tall with
       * a hundred photographs, and walking seven of them exhausted the runner's
       * memory mid-suite. Reading the markup is both cheaper and stricter, since
       * it catches a blocked hash that is present but never scrolled into view.
       */
      const srcs = await page.evaluate(() =>
        [...document.querySelectorAll("img")].map((i) =>
          decodeURIComponent(i.getAttribute("src") ?? "")
        )
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
    /*
     * The full-bleed beats were `.field`, `.kenburns` and `.pinned-media` on
     * Direction D's homepage. Direction F's one full-bleed surface is its hero,
     * and the rule is the same rule: the frame a visitor meets first is an
     * A-grade frame or it is not full-bleed.
     */
    await page.goto("/", { waitUntil: "load" });
    const fieldImgs = await page.evaluate(() =>
      [...document.querySelectorAll(".ho-slide img")].map((i) =>
        decodeURIComponent((i as HTMLImageElement).currentSrc || (i as HTMLImageElement).src)
      )
    );
    expect(fieldImgs.length, "no full-bleed frame found — this test is checking nothing").toBeGreaterThan(0);
    for (const src of fieldImgs) {
      const stem = src.split("/").pop()?.split("&")[0]?.replace(/\.\w+.*$/, "") ?? "";
      expect([...aFiles].some((a) => a && stem.includes(a)), `non-A-grade frame full-bleed: ${src}`).toBe(true);
    }
  });
});
