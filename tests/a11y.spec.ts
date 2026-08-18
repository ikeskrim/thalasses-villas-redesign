import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * ACCESSIBILITY — axe-core across every route, plus the manual-equivalent
 * checks axe cannot make.
 *
 * axe finds roughly a third of real accessibility problems. It cannot tell you
 * whether focus order makes sense, whether a custom widget is operable, or
 * whether a skip link goes anywhere useful — so those are asserted separately
 * below rather than assumed from a green axe run.
 *
 * axe-core is injected from node_modules rather than fetched, because this
 * build is hermetic and has no network.
 */
const AXE = fs.readFileSync(
  path.join(process.cwd(), "node_modules", "axe-core", "axe.min.js"),
  "utf-8"
);

const ROUTES = [
  "/",
  "/en/the-estate",
  "/en/villas/villa-thoi",
  "/en/villas/villa-pueblo",
  "/en/experiences",
  "/en/experiences/private-helipad",
  "/en/weddings",
  "/en/location",
  "/en/careers",
  "/en/contact",
  "/en/terms",
];

/**
 * Deliberately NOT disabled: colour-contrast, which is the rule most projects
 * switch off first and the one this project has already been burned by three
 * times.
 */
async function runAxe(page: import("@playwright/test").Page) {
  await page.addScriptTag({ content: AXE });
  return page.evaluate(async () => {
    // @ts-expect-error injected global
    const results = await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    });
    type Violation = {
      id: string;
      impact: string;
      help: string;
      nodes: { target: string[] }[];
    };
    return (results.violations as Violation[]).map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
    }));
  });
}

test.describe("axe-core", () => {
  for (const route of ROUTES) {
    test(`no WCAG A/AA violations on ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route, { waitUntil: "load" });
      const violations = await runAxe(page);

      /*
       * Accepted findings are filtered by an EXPLICIT allowlist in
       * content/a11y-exceptions.json — never by disabling a rule. Turning off
       * colour-contrast would have hidden the litany, the act tabs and the
       * filter chips, all three of which were real and all three now fixed.
       */
      const accepted = (
        JSON.parse(
          fs.readFileSync(path.join(process.cwd(), "content", "a11y-exceptions.json"), "utf-8")
        ) as { accepted: { rule: string; selector: string }[] }
      ).accepted;
      const unaccepted = violations.filter(
        (v) =>
          !accepted.some((a) => a.rule === v.id && v.nodes.every((n) => n.includes(a.selector)))
      );
      const summary = unaccepted
        .map((v) => `${v.impact}: ${v.id} — ${v.help}\n      ${v.nodes.join("\n      ")}`)
        .join("\n  ");
      expect(unaccepted, `axe violations on ${route}:\n  ${summary}`).toEqual([]);
    });
  }
});

test.describe("what axe cannot check", () => {
  test("the skip link is first, reachable, and lands on #main", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await page.keyboard.press("Tab");
    const first = await page.evaluate(() => document.activeElement?.className ?? "");
    expect(first, "the skip link is not the first stop").toContain("skip-link");

    await page.keyboard.press("Enter");
    await page.waitForTimeout(200);
    // It must go somewhere that exists AND is a landmark.
    await expect(page.locator("#main")).toHaveCount(1);
    const tag = await page.evaluate(() => document.getElementById("main")?.tagName);
    expect(tag).toBe("MAIN");
  });

  test("the amenity accordion is fully keyboard operable", async ({ page }) => {
    await page.goto("/en/villas/villa-thoi", { waitUntil: "load" });
    const group = page.locator(".inventory-group").nth(1);
    await group.focus();
    await page.keyboard.press("Enter");
    await expect(group).toHaveAttribute("aria-current", "true");

    const item = page.locator(".inventory-item-button").first();
    if (await item.count()) {
      await item.focus();
      await expect(item).toHaveAttribute("aria-expanded", "false");
      await page.keyboard.press("Enter");
      await expect(item).toHaveAttribute("aria-expanded", "true");
      await page.keyboard.press("Enter");
      await expect(item).toHaveAttribute("aria-expanded", "false");
    }
  });

  test("the estate hotspot map is operable without a pointer", async ({ page }) => {
    await page.goto("/en/the-estate", { waitUntil: "load" });
    const marker = page.locator(".estate-map-marker").first();
    await marker.focus();
    await expect(marker).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Enter");
    await expect(marker).toHaveAttribute("aria-expanded", "true");
    // And the same information exists outside the interaction entirely.
    const listed = await page.locator(".estate-map-list-item").count();
    const markers = await page.locator(".estate-map-marker").count();
    expect(listed, "the map's information is locked behind a pointer").toBe(markers);
  });

  test("focus is visible on both grounds", async ({ page }) => {
    // A focus ring that only works on limestone is invisible on the two dark
    // interludes, which is where the estate CTA lives.
    await page.goto("/en/the-estate", { waitUntil: "load" });
    const dark = page.locator(".d-numbers a").first();
    await dark.focus();
    const style = await dark.evaluate((e) => {
      const cs = getComputedStyle(e);
      return { outline: cs.outlineStyle, width: cs.outlineWidth, shadow: cs.boxShadow };
    });
    const visible =
      (style.outline !== "none" && parseFloat(style.width) > 0) || style.shadow !== "none";
    expect(visible, "no visible focus indicator on the deep ground").toBe(true);
  });

  test("every page has exactly one h1 and a document title", async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route, { waitUntil: "load" });
      const h1 = await page.locator("h1").count();
      expect(h1, `${route} has ${h1} h1 elements`).toBe(1);
      const title = await page.title();
      expect(title.length, `${route} has no title`).toBeGreaterThan(3);
    }
  });
});
