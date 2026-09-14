import fs from "node:fs";
import path from "node:path";

import { test, expect, type Page } from "@playwright/test";

import { HOTSPOTS } from "../src/app/home-data";
import type { EstatePlan } from "../src/lib/estate-plan-gate";

/**
 * THE 3D ESTATE MAP ITSELF — against the local review build only.
 *
 * Run with `npm run build:estate3d` then `npm run qa:estate3d`
 * (playwright.estate3d.config.ts, :3035). That build opens the provenance gate
 * with ESTATE_3D_PREVIEW=1, which the gate refuses on Vercel; the public build's
 * closed gate is tested by tests/estate-3d.spec.ts under `npm run qa`.
 *
 * What must hold for the diagram:
 *  - it occupies exactly the 2D frame's box, so nothing on the page moves;
 *  - it says on its face that this build is a preview of unverified positions;
 *  - every drawn element with a link is a real link, and the places the plan
 *    does not place are absent from the drawing, named in the note, and present
 *    in the numbered list, which is identical either way;
 *  - under reduced motion the 2D map is the page, and three.js is never fetched.
 */

const ROUTE = "/en/the-estate";
const plan = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content", "estate-plan.json"), "utf-8")) as EstatePlan;
const drawn = plan.elements.filter((e) => e.position !== null);
const unplaced = plan.elements.filter((e) => e.position === null);

async function scrollToMap(page: Page) {
  await page.locator("section.estate-map").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
}

test.describe("3D estate map — review build", () => {
  test("the diagram replaces the frame in the same box, and says it is unverified", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(ROUTE);
    const frame2d = page.locator(".estate-map-frame").first();
    await frame2d.scrollIntoViewIfNeeded();
    const box2d = await frame2d.boundingBox();
    const listBefore = await page.locator(".estate-map-list").innerText();

    await scrollToMap(page);
    const frame3d = page.locator(".estate-map-frame--3d");
    await expect(frame3d).toBeVisible({ timeout: 15_000 });
    await expect(frame3d.locator("canvas.estate-map-3d-canvas")).toHaveCount(1);
    await expect(page.locator(".estate-map-frame--preview")).toHaveCount(1);

    const box3d = await frame3d.boundingBox();
    expect(Math.abs((box3d?.width ?? 0) - (box2d?.width ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((box3d?.height ?? 0) - (box2d?.height ?? 0))).toBeLessThanOrEqual(1);

    await expect(frame3d.locator(".estate-map-3d-note-long")).toContainText("Preview — unverified.");
    await expect(frame3d.locator(".estate-map-3d-note-long")).toContainText("The list below carries every place.");
    await expect(frame3d.locator(".estate-map-3d-note-short")).toContainText("Preview — unverified positions.");

    for (const e of drawn.filter((x) => x.href && ["villa", "helipad", "venue"].includes(x.kind))) {
      await expect(frame3d.locator(`.estate-map-3d-spot a[href="${e.href}"]`), e.id).toHaveCount(1);
    }

    const labels = frame3d.locator(".estate-map-3d-spot");
    for (const e of unplaced) {
      await expect(labels.filter({ hasText: e.name }), `${e.id} has no position, so no label`).toHaveCount(0);
      if (["pueblo", "long-table", "vegetable-garden"].includes(e.id)) {
        await expect(frame3d.locator(".estate-map-3d-note-long")).toContainText(e.name);
      }
    }

    const listItems = page.locator(".estate-map-list-item");
    await expect(listItems).toHaveCount(HOTSPOTS.length);
    for (const [i, h] of HOTSPOTS.entries()) {
      await expect(listItems.nth(i).locator(".estate-map-list-name")).toHaveText(h.label);
    }
    expect(await page.locator(".estate-map-list").innerText()).toBe(listBefore);
    expect(errors).toEqual([]);
  });

  test.describe("under reduced motion", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });
    test("the 2D map stays, and three.js is never fetched", async ({ page }) => {
      const threeFetched: string[] = [];
      page.on("response", async (r) => {
        if (r.request().resourceType() !== "script") return;
        const body = await r.text().catch(() => "");
        if (body.includes("WebGLRenderer")) threeFetched.push(r.url());
      });
      await page.goto(ROUTE);
      await scrollToMap(page);
      await page.waitForTimeout(1500);
      await expect(page.locator(".estate-map-frame--3d")).toHaveCount(0);
      await expect(page.locator(".estate-map-frame .estate-map-marker").first()).toBeAttached();
      expect(threeFetched).toEqual([]);
    });
  });
});
