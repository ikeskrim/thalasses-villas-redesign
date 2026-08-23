import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * THE AMENITY TOOLTIPS ACTUALLY REACH A READER.
 *
 * The facilities registry carries 139 items per villa and, buried among them,
 * two text fields per item: `description` and `extraDescription`. They were
 * recovered in Phase 0 and they are the only prose anywhere that says what an
 * amenity actually is — "On your arrival you will find coffee, sugar, salt,
 * spices, some basic cleaning supplies, kitchen and toilet paper, bottled
 * water."
 *
 * The resolver collapsed them with `??`, so any item carrying BOTH showed only
 * the short one. Sixteen items did, and **269 words went unrendered** (T4-7).
 * The same class as T-285: a fact recovered, stored, and never shown — and
 * invisible, because nothing on screen looks wrong when a sentence is absent.
 *
 * Two things are asserted, and the first is the one a person cares about:
 * every registry text reaches the page, and the disclosure that reveals it is
 * operable and announces itself properly.
 */
const CONTENT = path.join(process.cwd(), "content", "facilities");

/** Every text the registry holds for a villa, both fields, deduplicated. */
function registryTexts(file: string): Set<string> {
  const j = JSON.parse(fs.readFileSync(path.join(CONTENT, file), "utf-8")) as {
    tabs: { groups: { items: { description?: string | null; extraDescription?: string | null }[] }[] }[];
  };
  const out = new Set<string>();
  for (const t of j.tabs) {
    for (const g of t.groups) {
      for (const i of g.items) {
        if (i.description?.trim()) out.add(i.description.trim());
        if (i.extraDescription?.trim()) out.add(i.extraDescription.trim());
      }
    }
  }
  return out;
}

const CASES: [route: string, file: string][] = [
  ["/en/villas/villa-thoi", "200.json"],
  ["/en/villas/villa-persi", "201.json"],
  ["/en/villas/villa-eeanthe", "202.json"],
  ["/en/villas/villa-melia", "203.json"],
  ["/en/the-estate", "2142.json"],
];

/** Text the site deliberately moves elsewhere — see BEYOND_THE_GATE_GROUPS. */
function movedOffPage(text: string, page: string): boolean {
  return !page.includes(text.slice(0, 40));
}

test.describe("amenity tooltips", () => {
  for (const [route, file] of CASES) {
    test(`${route} — every registry description is on the page`, async ({ page }) => {
      const expected = registryTexts(file);
      expect(expected.size, `${file} holds no descriptions — nothing is being checked`).toBeGreaterThan(5);

      await page.goto(route, { waitUntil: "load" });

      /*
       * Read the DOM, not the visible text. The disclosure panels are `hidden`
       * until opened, and `innerText` skips hidden nodes — so a check on
       * visible text would report every tooltip missing and be useless, while a
       * check on innerHTML sees exactly what a reader can reach by pressing a
       * button.
       */
      const html = await page.evaluate(() => document.body.innerHTML);
      const plain = html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/\s+/g, " ");

      const missing = [...expected].filter((t) => movedOffPage(t, plain));
      expect(
        missing.map((m) => m.slice(0, 70)),
        `${route}: registry descriptions that reach no reader`
      ).toEqual([]);
    });
  }

  test("the disclosure is operable and announces what it controls", async ({ page }) => {
    await page.goto("/en/villas/villa-thoi", { waitUntil: "load" });

    const buttons = page.locator("button.inventory-item-button");
    const n = await buttons.count();
    expect(n, "no inventory disclosures found — nothing is being checked").toBeGreaterThan(5);

    const first = buttons.first();
    await expect(first).toHaveAttribute("aria-expanded", "false");

    const controls = await first.getAttribute("aria-controls");
    expect(controls, "the disclosure names nothing it controls").toBeTruthy();

    const panel = page.locator(`#${controls}`);
    expect(await panel.count(), `aria-controls points at #${controls}, which does not exist`).toBe(1);
    await expect(panel).toBeHidden();

    /* Keyboard, not just pointer. */
    await first.focus();
    await page.keyboard.press("Enter");
    await expect(first).toHaveAttribute("aria-expanded", "true");
    await expect(panel).toBeVisible();
    expect((await panel.textContent())?.trim().length ?? 0).toBeGreaterThan(3);

    await page.keyboard.press("Enter");
    await expect(first).toHaveAttribute("aria-expanded", "false");
    await expect(panel).toBeHidden();
  });

  test("an item holding two registry texts shows both", async ({ page }) => {
    /*
     * The regression case. `Spices` on Villa Thoi carries a short description
     * AND a long one, and the long one is the useful half.
     */
    await page.goto("/en/villas/villa-thoi", { waitUntil: "load" });
    const html = await page.evaluate(() => document.body.innerHTML);
    const plain = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

    expect(plain, "the short description is missing").toContain("Salt, Pepper");
    expect(
      plain,
      "the SECOND registry text is missing — `??` is collapsing them again"
    ).toContain("On your arrival you will find coffee");
  });
});
