import { test, expect, type Page } from "@playwright/test";

import { HOTSPOTS } from "../src/app/home-data";

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
 *  - the pool line is labelled, as a label and not a link. The two hotspots with
 *    no established position (the long table, the vegetable garden) are not
 *    placed, and the note says the list below carries every place;
 *  - the numbered list beneath the map is identical either way, and on the 3D
 *    path it has one item per 2D hotspot, by name.
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

    /*
     * The pool line is a label and never a link, the same as its 2D hotspot,
     * which has no href. It is anchored at the drawn pools.
     */
    const poolLine = frame3d.locator(".estate-map-3d-spot--pools");
    await expect(poolLine).toHaveCount(1);
    await expect(poolLine).toBeVisible();
    await expect(poolLine).toHaveText("The pool line");
    await expect(poolLine.locator("a")).toHaveCount(0);

    /*
     * The diagram does not place every hotspot, so its note must say where
     * every place is. Both lengths of the note say it, because CSS shows the
     * short one on a phone. What is checked against that claim, on this 3D
     * path: the two places with no established position are absent from the
     * drawing and present in the list, and the numbered list has one item per
     * 2D hotspot (HOTSPOTS, nine today, Villa Pueblo among them), in order and
     * by name.
     */
    await expect(frame3d.locator(".estate-map-3d-note-long")).toContainText("The list below carries every place.");
    /* The phone length says it in fewer words, to keep the band over the frame near its old height (an estimate: EstateMap3D.tsx). */
    await expect(frame3d.locator(".estate-map-3d-note-short")).toContainText("Villa Pueblo not drawn; all listed.");
    for (const unplaced of ["The long table", "The vegetable garden"]) {
      await expect(frame3d.getByText(unplaced, { exact: true })).toHaveCount(0);
      await expect(page.locator(".estate-map-list")).toContainText(unplaced);
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
