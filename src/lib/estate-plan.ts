import "server-only";

import fs from "node:fs";
import path from "node:path";

import { decideEstate3D, toRenderPlan, type EstatePlan, type RenderPlan } from "@/lib/estate-plan-gate";

/**
 * THE ESTATE PLAN, READ AT BUILD TIME — the one door the 3D map's geometry
 * comes through (DECISIONS.md D-021).
 *
 * `/en/the-estate` is prerendered, so this runs once per build and the page
 * carries its result. When the provenance gate is closed the page receives
 * `null`: no geometry reaches the HTML or the flight data, and the client never
 * fetches three.js. The rules themselves live in `estate-plan-gate.ts`, where
 * the tests can run them without a build.
 *
 * A consequence the owner's "a data edit, not a rebuild" has to live with: a
 * change to `content/estate-plan.json` reaches the public page when it is
 * committed and deployed. It is a data edit — no code changes — but the page is
 * rebuilt. Rendering it per request instead would put it in the class of
 * per-request pages that return 500 on percent-encoded spellings on Vercel
 * (SECURITY-NOTES.md §4.1), and would give up the prerendered HTML the
 * performance guards protect. D-022 records this.
 */
export function loadEstatePlan(): EstatePlan {
  const file = path.join(process.cwd(), "content", "estate-plan.json");
  return JSON.parse(fs.readFileSync(file, "utf-8")) as EstatePlan;
}

/** What `/en/the-estate` passes to the estate map: the render plan, or `null` while the gate is closed. */
export function estate3dPlanForPage(): RenderPlan | null {
  const plan = loadEstatePlan();
  const decision = decideEstate3D(plan, {
    ESTATE_3D_PREVIEW: process.env.ESTATE_3D_PREVIEW,
    VERCEL: process.env.VERCEL,
  });
  return decision.open ? toRenderPlan(plan, decision.preview) : null;
}
