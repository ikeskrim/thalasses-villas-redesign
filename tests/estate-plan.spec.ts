import fs from "node:fs";
import path from "node:path";

import { test, expect } from "@playwright/test";

import { HOTSPOTS } from "../src/app/home-data";
import {
  PROVENANCE_INFERRED,
  PROVENANCE_NONE,
  PROVENANCE_VERIFIED,
  REQUIRED_ELEMENT_IDS,
  decideEstate3D,
  toRenderPlan,
  validatePlan,
  type EstatePlan,
} from "../src/lib/estate-plan-gate";

/**
 * content/estate-plan.json — THE DATA, AND THE GATE THAT READS IT.
 *
 * D-021: the plan is populated from the aerial and drone frames, "label nothing
 * as fact", and the 3D map is public only when provenance is owner-verified.
 * These tests hold the file to that, and run every branch of the gate against
 * fixtures derived from the real file — no build needed for the logic.
 */

const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p), "utf-8");
const plan = JSON.parse(read("content", "estate-plan.json")) as EstatePlan;
const clone = (): EstatePlan => JSON.parse(JSON.stringify(plan)) as EstatePlan;

/** The plan as it would be on the day the owner verifies every placed element. */
function verifiedFixture(): EstatePlan {
  const p = clone();
  for (const e of p.elements) {
    if (e.position !== null) {
      e.provenance = PROVENANCE_VERIFIED;
      e.decision = "D-999";
    }
  }
  return p;
}

test.describe("content/estate-plan.json", () => {
  test("is valid and names every element D-021 lists", () => {
    expect(validatePlan(plan)).toEqual([]);
    const ids = plan.elements.map((e) => e.id);
    for (const id of REQUIRED_ELEMENT_IDS) expect(ids).toContain(id);
  });

  test("labels nothing as fact: every owner-verified element names a DECISIONS.md entry that exists", () => {
    const decisions = read("DECISIONS.md");
    for (const e of plan.elements) {
      expect([PROVENANCE_VERIFIED, PROVENANCE_INFERRED, PROVENANCE_NONE]).toContain(e.provenance);
      if (e.provenance === PROVENANCE_VERIFIED) {
        expect(decisions, `${e.id} cites ${e.decision}, which DECISIONS.md does not contain`).toMatch(
          new RegExp(`#{2,3} ${e.decision} `)
        );
      }
    }
  });

  test("no compass words: no aerial on record carries a bearing", () => {
    const text = JSON.stringify({ frame: plan.frame, elements: plan.elements.map((e) => ({ basis: e.basis, notes: e.notes })) });
    expect(text).not.toMatch(/\b(north|south|east|west)(ern|ward|wards)?\b/i);
  });

  test("an element with no established position is drawn nowhere and carries no geometry", () => {
    for (const e of plan.elements) {
      if (e.provenance === PROVENANCE_NONE) {
        expect(e.position, e.id).toBeNull();
        expect(e.orientation, e.id).toBeNull();
        expect(e.footprint, e.id).toBeNull();
      }
    }
  });

  test("every link goes to a page this site serves", async ({ request }) => {
    for (const e of plan.elements.filter((x) => x.href)) {
      const r = await request.get(e.href!, { maxRedirects: 0 });
      expect(r.status(), `${e.id} → ${e.href}`).toBe(200);
    }
    /* The villas link where the 2D map already links them. */
    for (const h of HOTSPOTS.filter((x) => x.href && ["thoi", "persi", "melia", "eeanthe"].includes(x.id))) {
      expect(plan.elements.find((e) => e.id === h.id)?.href).toBe(h.href);
    }
  });
});

test.describe("the provenance gate", () => {
  test("the committed plan, decided as a production build decides it", () => {
    const d = decideEstate3D(plan, {});
    const unverifiedDrawn = plan.elements.filter((e) => e.position !== null && e.provenance !== PROVENANCE_VERIFIED);
    expect(d.open).toBe(unverifiedDrawn.length === 0);
    expect(d.preview).toBe(false);
  });

  test("opens only when every drawn element is owner-verified", () => {
    expect(decideEstate3D(verifiedFixture(), {}).open).toBe(true);

    for (const kind of ["villa", "lane", "compound", "apron", "shore"] as const) {
      const p = verifiedFixture();
      const target = p.elements.find((e) => e.kind === kind && e.position !== null);
      if (!target) continue;
      target.provenance = PROVENANCE_INFERRED;
      delete target.decision;
      const d = decideEstate3D(p, {});
      expect(d.open, `one unverified ${kind} must close the gate`).toBe(false);
      expect(d.reason).toContain(target.id);
    }
  });

  test("an element with no position does not block it, and the note names it", () => {
    const p = verifiedFixture();
    const unplaced = p.elements.filter((e) => e.position === null);
    expect(decideEstate3D(p, {}).open).toBe(true);
    const render = toRenderPlan(p, false);
    expect(render.schema).toBe("estate-render-plan/1");
    for (const e of unplaced) {
      expect(render.elements.map((r) => r.id)).not.toContain(e.id);
      if ((REQUIRED_ELEMENT_IDS as readonly string[]).includes(e.id)) expect(render.notDrawn).toContain(e.name);
    }
  });

  test("stays closed without the four villas", () => {
    const p = verifiedFixture();
    const villa = p.elements.find((e) => e.id === "thoi")!;
    villa.position = null;
    villa.orientation = null;
    villa.footprint = null;
    villa.provenance = PROVENANCE_NONE;
    villa.basis.position = PROVENANCE_NONE;
    delete villa.decision;
    expect(decideEstate3D(p, {}).open).toBe(false);
  });

  test("refuses owner-verified without the entry that relayed it", () => {
    const p = verifiedFixture();
    delete p.elements.find((e) => e.position !== null)!.decision;
    expect(() => decideEstate3D(p, {})).toThrow(/needs the DECISIONS\.md entry/);
  });

  test("the review preview opens it locally, and throws on any Vercel build", () => {
    const local = decideEstate3D(plan, { ESTATE_3D_PREVIEW: "1" });
    expect(local.open).toBe(true);
    expect(local.preview).toBe(true);
    expect(toRenderPlan(plan, local.preview).preview).toBe(true);

    expect(() => decideEstate3D(plan, { ESTATE_3D_PREVIEW: "1", VERCEL: "1" })).toThrow(/local review builds only/);
    /* Anything but exactly "1" is not the flag. */
    expect(decideEstate3D(plan, { ESTATE_3D_PREVIEW: "true" }).preview).toBe(false);
  });
});
