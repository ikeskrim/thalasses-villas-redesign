import { test, expect, type Page } from "@playwright/test";

/**
 * THE 3D ESTATE MAP — an experiment on `feat/estate-3d`, never main until the
 * owner says yes.
 *
 * What must hold for it to be allowed near a preview at all:
 *  - three.js is in no route's initial JavaScript; it arrives only when the map
 *    section nears the viewport, WebGL is present and reduced motion is off;
 *  - under reduced motion the 2D map is the page, and three.js is never fetched;
 *  - when it does render, it occupies exactly the 2D frame's box (nothing on the
 *    page moves), its villa labels are real links to the villa pages, it says on
 *    its face that it is a diagram, and the owner's open question stays marked;
 *  - the numbered list beneath the map is identical either way.
 */

const ROUTE = "/en/the-estate";

async function scrollToMap(page: Page) {
  await page.locator("section.estate-map").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
}

test.describe("3D estate map", () => {
  test("three.js is not in the page's initial scripts", async ({ request }) => {
    const html = await (await request.get(ROUTE)).text();
    const srcs = [...new Set([...html.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)].map((m) => (m[1] ?? "").replace(/&amp;/g, "&")))];
    expect(srcs.length).toBeGreaterThan(0);
    for (const s of srcs) {
      const body = await (await request.get(s)).text();
      expect(body.includes("WebGLRenderer"), `three.js in initial script ${s}`).toBe(false);
    }
  });

  test("with WebGL and motion allowed, the diagram replaces the frame in the same box", async ({ page }) => {
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

    const box3d = await frame3d.boundingBox();
    expect(Math.abs((box3d?.width ?? 0) - (box2d?.width ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((box3d?.height ?? 0) - (box2d?.height ?? 0))).toBeLessThanOrEqual(1);

    for (const slug of ["villa-thoi", "villa-persi", "villa-eeanthe", "villa-melia"]) {
      await expect(frame3d.locator(`a[href="/en/villas/${slug}"]`)).toHaveCount(1);
    }
    await expect(frame3d.locator('a[href="/en/experiences/private-helipad"]')).toHaveCount(1);
    await expect(frame3d).toContainText("A diagram, not a survey");
    await expect(frame3d).toContainText("[TODO: owner to confirm which house in each row is which]");

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
