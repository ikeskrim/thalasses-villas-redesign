import "server-only";

import fs from "node:fs";
import path from "node:path";

import { estate3dInpInput } from "@/lib/estate-3d-fingerprint";
import { decideEstate3D, describeGateDecision, toRenderPlan, type EstatePlan, type RenderPlan } from "@/lib/estate-plan-gate";

/**
 * THE ESTATE PLAN, READ AT BUILD TIME — the one door the 3D map's geometry
 * comes through (DECISIONS.md D-021).
 *
 * `/en/the-estate` is prerendered, so this runs once per build and the page
 * carries its result. When the gate is closed the page receives `null`: no
 * geometry reaches the HTML or the flight data, and the client never fetches
 * three.js. The rules themselves live in `estate-plan-gate.ts`, where the tests
 * can run them without a build.
 *
 * The gate has two conditions, and the build log prints each on its own line:
 * provenance (D-021) and INP (D-028). The INP condition reads the committed
 * harness record, `qa/perf/INP-estate3d-gate.json`, and the fingerprint of the
 * tree being built (`estate-3d-fingerprint.ts`); with no record it fails with
 * "INP: no record". Printing the INP verdict while provenance already keeps the
 * gate closed is deliberate: a fingerprint that differs on Vercel's Linux build
 * would otherwise stay hidden until the day the plan is verified.
 *
 * A consequence the owner's "a data edit, not a rebuild" has to live with: a
 * change to `content/estate-plan.json` reaches the public page when it is
 * committed and deployed. It is a data edit — no code changes — but the page is
 * rebuilt. Rendering it per request instead would put it in the class of
 * per-request pages that return 500 on percent-encoded spellings on Vercel
 * (SECURITY-NOTES.md §4.1), and would give up the prerendered HTML the
 * performance guards protect. D-022 records this. A data edit that moves what
 * is drawn also changes the fingerprint, so the map opens only after the
 * harness has measured the edited plan (D-028).
 */
export function loadEstatePlan(): EstatePlan {
  const file = path.join(process.cwd(), "content", "estate-plan.json");
  return JSON.parse(fs.readFileSync(file, "utf-8")) as EstatePlan;
}

let logged = false;

/** What `/en/the-estate` passes to the estate map: the render plan, or `null` while the gate is closed. */
export function estate3dPlanForPage(): RenderPlan | null {
  const plan = loadEstatePlan();
  const decision = decideEstate3D(
    plan,
    { ESTATE_3D_PREVIEW: process.env.ESTATE_3D_PREVIEW, VERCEL: process.env.VERCEL },
    estate3dInpInput(process.cwd(), plan)
  );
  if (!logged) {
    logged = true;
    for (const line of describeGateDecision(decision)) console.log(`[estate-3d] ${line}`);
  }
  return decision.open ? toRenderPlan(plan, decision.preview) : null;
}
