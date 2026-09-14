import fs from "node:fs";
import path from "node:path";

import { test, expect, type Page } from "@playwright/test";

import { HOTSPOTS } from "../src/app/home-data";
import { decideEstate3D, type EstatePlan } from "../src/lib/estate-plan-gate";

/**
 * THE 3D ESTATE MAP ON THE PUBLIC BUILD — the provenance gate (DECISIONS.md D-021).
 *
 * The owner approved the 3D map on one condition: it renders publicly ONLY when
 * `content/estate-plan.json` is owner-verified, and until then the 2D hotspot
 * map stays live and a test asserts the 3D canvas never mounts. This is that
 * test. It runs against the same build `npm run qa` tests, decided exactly as a
 * production build decides it (no preview flag, not on Vercel).
 *
 * A check that passes for the wrong reason proves nothing, so before asserting
 * that the canvas never mounts it asserts the conditions under which it WOULD
 * mount if the gate were open: WebGL2 present, motion allowed, the section
 * scrolled into range.
 *
 * The diagram itself is tested against the local review build:
 * tests/estate-3d-preview.spec.ts, `npm run qa:estate3d`.
 */

const ROUTE = "/en/the-estate";
const plan = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content", "estate-plan.json"), "utf-8")) as EstatePlan;
const publicDecision = decideEstate3D(plan, {});

async function recordThree(page: Page) {
  const fetched: string[] = [];
  page.on("response", async (r) => {
    if (r.request().resourceType() !== "script") return;
    const body = await r.text().catch(() => "");
    if (body.includes("WebGLRenderer")) fetched.push(r.url());
  });
  return fetched;
}

async function scrollThroughMap(page: Page) {
  const section = page.locator("section.estate-map");
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(1000);
}

test.describe("3D estate map — the public build", () => {
  test("three.js is not in the page's initial scripts", async ({ request }) => {
    const html = await (await request.get(ROUTE)).text();
    const srcs = [...new Set([...html.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)].map((m) => (m[1] ?? "").replace(/&amp;/g, "&")))];
    expect(srcs.length).toBeGreaterThan(0);
    for (const s of srcs) {
      const body = await (await request.get(s)).text();
      expect(body.includes("WebGLRenderer"), `three.js in initial script ${s}`).toBe(false);
    }
  });

  test("the gate follows the plan's provenance, and while it is closed the 3D canvas never mounts", async ({ page, request }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const threeFetched = await recordThree(page);
    await page.goto(ROUTE);

    /* The conditions under which the diagram WOULD mount, so a pass means the gate held. */
    const webgl2 = await page.evaluate(() => !!document.createElement("canvas").getContext("webgl2"));
    expect(webgl2, "WebGL2 must be present, or 'never mounts' would pass for the wrong reason").toBe(true);
    const reduced = await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    expect(reduced, "motion must be allowed, or 'never mounts' would pass for the wrong reason").toBe(false);

    await scrollThroughMap(page);

    if (publicDecision.open) {
      /* The owner has verified the plan: the public page shows the diagram. */
      await expect(page.locator(".estate-map-frame--3d")).toBeVisible({ timeout: 15_000 });
      await expect(page.locator(".estate-map-frame--3d canvas.estate-map-3d-canvas")).toHaveCount(1);
      await expect(page.locator(".estate-map-frame--preview")).toHaveCount(0);
    } else {
      expect(publicDecision.reason).not.toBe("");
      await expect(page.locator(".estate-map-frame--3d")).toHaveCount(0);
      await expect(page.locator("section.estate-map canvas")).toHaveCount(0);
      await expect(page.locator(".estate-map-frame .estate-map-marker")).toHaveCount(HOTSPOTS.length);
      expect(threeFetched, "three.js was fetched while the gate is closed").toEqual([]);

      /* No plan reaches the page at all: neither the HTML nor the flight data. */
      const html = await (await request.get(ROUTE)).text();
      expect(html).not.toContain("estate-render-plan/1");
      const rsc = await request.get(ROUTE, { headers: { RSC: "1" } });
      expect(rsc.status()).toBe(200);
      expect(await rsc.text()).not.toContain("estate-render-plan/1");
    }

    await expect(page.locator(".estate-map-list-item")).toHaveCount(HOTSPOTS.length);
    expect(errors).toEqual([]);
  });

  test("/en/the-estate stays a static prerender", async ({ request }) => {
    /*
     * D-022: "a data edit, not a rebuild" was kept by prerendering this route,
     * and rendering it per request was rejected (it would join the class of
     * pages Vercel answers with 500 on percent-encoded spellings, and give up
     * the prerendered HTML D-012 and D-016 protect). Until now only the build
     * log's "○ /en/the-estate" said so, and a gate that read a header or a
     * cookie would have made the route dynamic with every test still passing.
     * This reads the build this suite is served from.
     */
    const dist = path.join(process.cwd(), ".next");
    const manifest = JSON.parse(fs.readFileSync(path.join(dist, "prerender-manifest.json"), "utf-8")) as { routes: Record<string, unknown> };
    expect(Object.keys(manifest.routes), `${ROUTE} is not in the build's prerender manifest`).toContain(ROUTE);
    expect(fs.existsSync(path.join(dist, "server", "app", "en", "the-estate.html")), "no prerendered HTML for the route").toBe(true);
    const res = await request.get(ROUTE);
    expect(res.status()).toBe(200);
    /* `next start` repeats the header ("1, 1"); every copy must say 1. */
    const prerender = (res.headers()["x-nextjs-prerender"] ?? "").split(",").map((v) => v.trim());
    expect(prerender.length > 0 && prerender.every((v) => v === "1"), `the server did not answer from the prerender (x-nextjs-prerender: ${prerender.join(", ")})`).toBe(true);
  });

  test.describe("under reduced motion", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });
    test("the 2D map stays, and three.js is never fetched", async ({ page }) => {
      const threeFetched = await recordThree(page);
      await page.goto(ROUTE);
      await scrollThroughMap(page);
      await expect(page.locator(".estate-map-frame--3d")).toHaveCount(0);
      await expect(page.locator(".estate-map-frame .estate-map-marker").first()).toBeAttached();
      expect(threeFetched).toEqual([]);
    });
  });
});
