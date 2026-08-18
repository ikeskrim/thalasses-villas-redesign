import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * THE REDIRECT HARNESS — the pre-DNS gate.
 *
 * A 301 map that nobody exercised is a migration that loses its rankings, and
 * the failure is silent: every legacy URL 404s, the old rankings decay, and
 * nothing in the build ever complained. So every installed redirect is driven
 * through the real app and its status and target are asserted.
 *
 * The table is read from the generated file, which is itself derived from
 * `content/url-map.md` — so this cannot drift from the map, and adding a legacy
 * URL to the map adds a test.
 */
const generated = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "src", "generated", "redirects.json"), "utf-8")
) as {
  redirects: { source: string; destination: string; permanent: boolean }[];
  skipped: { from: string; to: string; why: string }[];
};

test.describe("301 map", () => {
  test("the map produced a real table", () => {
    expect(generated.redirects.length, "no redirects were generated from url-map.md").toBeGreaterThan(
      40
    );
  });

  test("every skipped row has a stated reason", () => {
    // Silence is the danger here. A legacy URL dropped without a reason is a
    // lost ranking nobody will notice until the traffic is gone.
    for (const s of generated.skipped) {
      expect(s.why, `${s.from} was skipped with no reason`).toBeTruthy();
    }
  });

  for (const r of generated.redirects) {
    test(`${r.source} -> ${r.destination}`, async ({ request }) => {
      const res = await request.get(r.source, { maxRedirects: 0 });
      expect(res.status(), `${r.source} did not redirect`).toBe(r.permanent ? 308 : 307);
      const location = res.headers()["location"] ?? "";
      expect(location, `${r.source} pointed at ${location}`).toBe(r.destination);
    });
  }

  /**
   * The map proposed its routes during Phase 0, before the slugs and the IA
   * settled, so some destinations do not exist yet. Every one is a legacy URL
   * that WILL 404 after the domain move.
   *
   * Asserting an empty list here would mean either shipping a red suite or
   * deleting the check, and both lose the information. Instead the known gaps
   * are tracked in content/redirect-gaps.json with a reason and a closing move,
   * and this asserts the dead set is EXACTLY that set: an existing gap cannot
   * be forgotten, and a new one cannot appear unnoticed.
   */
  test("dead redirect targets are exactly the tracked gaps", async ({ request }) => {
    const tracked = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "content", "redirect-gaps.json"), "utf-8")
    ) as { gaps: { target: string; why: string; closes: string }[] };

    const targets = [...new Set(generated.redirects.map((r) => r.destination.split("#")[0]!))];
    const dead: string[] = [];
    for (const t of targets) {
      try {
        const res = await request.get(t, { maxRedirects: 3 });
        if (res.status() >= 400) dead.push(t);
      } catch {
        // A LOOP, not a 404 — and worse. `/en/thalasses-rituals` is both a
        // redirect source and a redirect target in the Phase 0 map, so it
        // points at itself. A 404 loses one page; a loop hangs the request.
        dead.push(t);
      }
    }

    const known = new Set(tracked.gaps.map((g) => g.target));
    const surprises = dead.filter((d) => !known.has(d));
    const closed = [...known].filter((k) => !dead.includes(k));

    expect(surprises, `NEW dead redirect targets: ${surprises.join(", ")}`).toEqual([]);
    expect(closed, `these gaps now resolve, delete them from redirect-gaps.json: ${closed.join(", ")}`).toEqual([]);

    for (const g of tracked.gaps) {
      expect(g.why, `${g.target} has no reason`).toBeTruthy();
      expect(g.closes, `${g.target} has no closing move`).toBeTruthy();
    }
  });
});
