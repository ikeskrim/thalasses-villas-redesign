import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const CONTENT = path.join(process.cwd(), "content");
const readJson = <T,>(...p: string[]): T =>
  JSON.parse(fs.readFileSync(path.join(CONTENT, ...p), "utf-8")) as T;

const VILLAS = [
  { key: "200", slug: "villa-thoi" },
  { key: "201", slug: "villa-persi" },
  { key: "202", slug: "villa-eeanthe" },
  { key: "203", slug: "villa-melia" },
  { key: "pueblo", slug: "villa-pueblo" },
];

test.describe("villa template parity", () => {
  for (const v of VILLAS) {
    test(`${v.slug} — specs match the locked capacity table`, async ({ page }) => {
      const villa = readJson<{
        name: string;
        specs: { bedrooms: number; bathrooms: number; maxGuests: number };
      }>("villas", `${v.key}.json`);

      await page.goto(`/en/villas/${v.slug}`, { waitUntil: "load" });
      await expect(page.locator("h1")).toBeVisible();

      // JSON-LD occupancy must come from the locked table, never from copy.
      const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
      const data = JSON.parse(ld ?? "{}");
      expect(data.numberOfBedrooms).toBe(villa.specs.bedrooms);
      expect(data.numberOfBathroomsTotal).toBe(villa.specs.bathrooms);
      expect(data.occupancy?.maxValue).toBe(villa.specs.maxGuests);
    });

    test(`${v.slug} — inventory omits unresolved enum ids and empty groups`, async ({ page }) => {
      await page.goto(`/en/villas/${v.slug}`, { waitUntil: "load" });

      const groups = await page.locator(".inventory-group").count();
      expect(groups).toBeGreaterThan(0);

      // No group may advertise a count it does not print.
      const counts = await page
        .locator(".inventory-group .inventory-count")
        .allTextContents();
      for (const c of counts) {
        expect(Number(c)).toBeGreaterThan(0);
      }

      // A raw enum id would surface as a bare integer item.
      const items = await page.locator(".inventory-item").allTextContents();
      for (const i of items) {
        expect(i.trim(), `bare enum id rendered as an item: "${i}"`).not.toMatch(/^\d+$/);
      }
    });
  }

  test("Pueblo uses the plates layout, Eeanthe uses the run", async ({ page }) => {
    const pueblo = readJson<{ gallery: { allImages: string[] } }>("villas", "pueblo.json");
    const eeanthe = readJson<{ gallery: { allImages: string[]; featured: unknown[] } }>(
      "villas",
      "202.json"
    );
    expect(pueblo.gallery.allImages.length).toBeLessThan(14);
    expect(eeanthe.gallery.featured.length).toBeGreaterThanOrEqual(14);

    await page.goto("/en/villas/villa-pueblo", { waitUntil: "load" });
    await expect(page.locator(".plates")).toHaveCount(1);
    await expect(page.locator(".run")).toHaveCount(0);

    await page.goto("/en/villas/villa-eeanthe", { waitUntil: "load" });
    await expect(page.locator(".run")).toHaveCount(1);
    await expect(page.locator(".plates")).toHaveCount(0);
  });

  test("no empty gallery slots or repeated images on Pueblo", async ({ page }) => {
    await page.goto("/en/villas/villa-pueblo", { waitUntil: "load" });
    const srcs = await page
      .locator(".plates img")
      .evaluateAll((els) => els.map((e) => (e as HTMLImageElement).src));
    expect(srcs.length).toBeGreaterThan(0);
    // Every plate is a distinct photograph.
    const hashes = srcs.map((s) => (s.match(/_pool%2F([0-9a-f]{32})/) ?? [])[1]).filter(Boolean);
    expect(new Set(hashes).size).toBe(hashes.length);
    // And no figure is rendered without an image.
    const figures = await page.locator(".plate").count();
    const figureImages = await page.locator(".plate img").count();
    expect(figureImages).toBe(figures);
  });

  test("every villa CTA is a dates-only booking link with lang=en", async ({ page }) => {
    for (const v of VILLAS) {
      await page.goto(`/en/villas/${v.slug}`, { waitUntil: "load" });
      const href = await page.locator(".d-villa-cta .btn-primary").first().getAttribute("href");
      expect(href, `${v.slug} CTA`).toContain("thalassesvillas.reserve-online.net");
      expect(href, `${v.slug} must not preselect a room — the param is inert`).not.toContain("room=");
      expect(href, `${v.slug} must force English`).toContain("lang=en");
    }
  });

  test("the Estate page is concierge framed, never a missing booking", async ({ page }) => {
    await page.goto("/en/the-estate", { waitUntil: "load" });
    // The CTA is set as a micro-label, so innerText comes back uppercased.
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toContain("enquire — we design your stay");
    expect(body).not.toContain("not available");
    expect(body).not.toContain("cannot be booked");
    expect(body).not.toContain("booking unavailable");

    const figures = await page.locator(".d-ledger .ledger-spec-value").allTextContents();
    for (const v of ["9", "6", "18", "4", "240"]) expect(figures).toContain(v);
  });

  test("inventory group counts equal the printed item counts", async ({ page }) => {
    await page.goto("/en/villas/villa-thoi", { waitUntil: "load" });
    const buttons = page.locator(".inventory-group");
    const n = await buttons.count();
    for (let i = 0; i < n; i++) {
      const label = await buttons.nth(i).locator(".inventory-count").textContent();
      await buttons.nth(i).click();
      await page.waitForTimeout(250);
      const printed = await page.locator(".inventory-item").count();
      expect(printed, `group ${i} advertises ${label} but prints ${printed}`).toBe(Number(label));
    }
  });

  test("inventory groups are keyboard reachable with correct aria", async ({ page }) => {
    await page.goto("/en/villas/villa-thoi", { waitUntil: "load" });
    const active = page.locator('.inventory-group[aria-current="true"]');
    await expect(active).toHaveCount(1);

    const expandable = page.locator(".inventory-item-button").first();
    if (await expandable.count()) {
      await expect(expandable).toHaveAttribute("aria-expanded", "false");
      await expandable.focus();
      await page.keyboard.press("Enter");
      await expect(expandable).toHaveAttribute("aria-expanded", "true");
    }
  });
});

/**
 * THE ATMOSPHERE, INHERITED (T-211).
 *
 * The villa template ran limestone → limestone → ammos → limestone: the only
 * composition on the site with no ground change, and therefore the only one the
 * atmosphere layer could not reach — sea-light and the ghost numeral exist only
 * on a deep ground. Beat 02 is now pelagos. These assert the inheritance
 * actually landed rather than trusting the class names.
 */
test.describe("villa template — inherited language", () => {
  test("the villa page spends exactly one dark interlude", async ({ page }) => {
    // Direction D rebuilt the template on the light ground, so the deep passage
    // moved from beat 02 to the "your stay includes" beat — the generosity list,
    // set apart from the dense inventory above it. One interlude, which is what
    // D allows, and the page is otherwise limestone throughout.
    await page.goto("/en/villas/villa-eeanthe", { waitUntil: "load" });
    const el = page.locator(".d-includes");
    await expect(el).toHaveCount(1);

    const bg = await el.evaluate((e) => getComputedStyle(e).backgroundColor);
    expect(bg, "the interlude is not on pelagos").toBe("rgb(20, 83, 95)");

    const deep = await page.evaluate(
      () =>
        [...document.querySelectorAll<HTMLElement>("main section")].filter(
          (e) => getComputedStyle(e).backgroundColor === "rgb(20, 83, 95)"
        ).length
    );
    expect(deep, "more than one dark interlude on a villa page").toBe(1);
  });

  // RETIRED: the ghost numeral is a homepage device in Direction D and villa
  // pages carry none. Horizontal overflow on the villa routes is covered at six
  // widths by D4 in direction-d.spec.ts, which is stronger than this was.
  test.skip("the ghost numeral never widens the page", async ({ page }) => {
    for (const w of [390, 1440]) {
      await page.setViewportSize({ width: w, height: 900 });
      for (const route of ["/en/villas/villa-pueblo", "/en/the-estate"]) {
        await page.goto(route, { waitUntil: "load" });
        await page.waitForSelector(".ghost");
        const { sw, cw } = await page.evaluate(() => ({
          sw: document.documentElement.scrollWidth,
          cw: document.documentElement.clientWidth,
        }));
        expect(sw, `${route} at ${w} overflows horizontally`).toBeLessThanOrEqual(cw);
      }
    }
  });

  /**
   * THE T-203 REFLEX.
   *
   * The ghost numeral needs `overflow: hidden` on its section, and `overflow`
   * on any ancestor silently kills `position: sticky` on a descendant — the
   * same shape of failure as the atmosphere rule that un-pinned the acts. The
   * inventory rail is the only sticky element on a villa page, so it is checked
   * here BECAUSE clipping entered the template, not in spite of it.
   */
  test("clipping the ghost numeral did not un-stick the inventory rail", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/villas/villa-thoi", { waitUntil: "load" });
    const rail = page.locator(".inventory-rail ul");
    await expect(rail).toHaveCount(1);

    const pos = await rail.evaluate((e) => getComputedStyle(e).position);
    expect(pos, "the inventory rail is no longer sticky").toBe("sticky");

    const clipper = await rail.evaluate((e) => {
      for (let n = e.parentElement; n && n !== document.documentElement; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (["hidden", "clip", "auto", "scroll"].includes(s.overflowY)) {
          return n.className || n.tagName;
        }
      }
      return null;
    });
    expect(clipper, `an ancestor clips the sticky rail: ${clipper}`).toBeNull();
  });

  test("no run caption is set on bare photograph", async ({ page }) => {
    // Found in a side-by-side capture, not by an assertion: a limestone caption
    // over a sunlit timber deck, with nothing behind it.
    await page.goto("/en/villas/villa-eeanthe", { waitUntil: "load" });
    await page.waitForSelector(".run-frame");
    const unscrimmed = await page.evaluate(() =>
      [...document.querySelectorAll(".run-caption")].filter(
        (c) => !c.parentElement?.querySelector(".run-scrim")
      ).length
    );
    expect(unscrimmed, "a run caption is rendered with no ground behind it").toBe(0);
    // And the scrim only exists where a caption does.
    const orphanScrims = await page.evaluate(() =>
      [...document.querySelectorAll(".run-scrim")].filter(
        (s) => !s.parentElement?.querySelector(".run-caption")
      ).length
    );
    expect(orphanScrims, "a scrim darkens a frame that carries no caption").toBe(0);
  });

  test("the site-wide cursor survives navigation off the homepage", async ({ page }) => {
    // It was mounted per page, so the nav's own data-cursor="Book" labelled
    // nothing everywhere except `/`.
    await page.goto("/en/villas/villa-melia", { waitUntil: "load" });
    await page.mouse.move(600, 400);
    await expect(page.locator(".cursor")).toHaveCount(1);
  });

  test("the fourth voice is spent once per page, and only there", async ({ page }) => {
    for (const slug of ["villa-thoi", "villa-pueblo"]) {
      await page.goto(`/en/villas/${slug}`, { waitUntil: "load" });
      // In D the accent register IS the villa lede: `body-l` in the type table
      // is Cormorant Italic, and it was rendering in Inter until measured.
      const lede = page.locator(".d-villa-lede");
      await expect(lede, `${slug}`).toHaveCount(1);
      const style = await lede.evaluate((e) => ({
        s: getComputedStyle(e).fontStyle,
        f: getComputedStyle(e).fontFamily.toLowerCase(),
      }));
      expect(style.s).toBe("italic");
      expect(style.f).toContain("cormorant");
    }
  });
});

test.describe("gallery slot architecture (T-192)", () => {
  test("the plan moves with the data, not the markup", () => {
    // Villa Pueblo is below the plates threshold today and will cross it after
    // the shoot; Eeanthe is far above it. One resolver serves both, so neither
    // needs a component edited when its photography changes.
    const pueblo = JSON.parse(
      fs.readFileSync(path.join(CONTENT, "villas", "pueblo.json"), "utf-8")
    ) as { gallery: { allImages: string[]; featured: unknown[] } };
    const eeanthe = JSON.parse(
      fs.readFileSync(path.join(CONTENT, "villas", "202.json"), "utf-8")
    ) as { gallery: { allImages: string[]; featured: unknown[] } };

    expect(pueblo.gallery.allImages.length).toBeLessThan(14);
    expect(eeanthe.gallery.featured.length).toBeGreaterThanOrEqual(14);
  });

  test("Pueblo still shows every photograph it has", async ({ page }) => {
    const pueblo = JSON.parse(
      fs.readFileSync(path.join(CONTENT, "villas", "pueblo.json"), "utf-8")
    ) as { gallery: { allImages: string[] } };
    await page.goto("/en/villas/villa-pueblo", { waitUntil: "load" });
    const shown = await page.locator(".plates img").count();
    // No image is dropped, and none is repeated to pad the layout.
    expect(shown).toBe(pueblo.gallery.allImages.length);
  });

  test("Eeanthe drops nothing — the run plus the sheet is the whole set", async ({ page }) => {
    const eeanthe = JSON.parse(
      fs.readFileSync(path.join(CONTENT, "villas", "202.json"), "utf-8")
    ) as { gallery: { featured: { image: string }[] } };
    await page.goto("/en/villas/villa-eeanthe", { waitUntil: "load" });
    await page.evaluate(async () => {
      const step = Math.round(window.innerHeight * 0.9);
      for (let y = 0; y <= document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 100));
      }
    });
    const run = await page.locator(".run-frame img").count();
    const sheet = await page.locator(".contact-sheet-item img").count();
    expect(run).toBe(12);
    expect(run + sheet).toBe(eeanthe.gallery.featured.length);
  });
});
