import { expect, test } from "@playwright/test";

/**
 * THE CLAUSE WITHOUT FRAMER — `DECISIONS.md` D-028.
 *
 * The owner's ruling: "Remaining Framer on the estate page and footer: measure
 * the cost, then defer." The mechanism is the one D-026 removed from the scroll
 * reveals: Framer serialised its `initial` state into the served HTML, so every
 * clause character arrived with an inline opacity and transform, and every
 * animated hero tail arrived at opacity 0 with its characters pulled left.
 *
 * A clause that does not animate is plain server markup now: the footer's, the
 * 404's, the location page's, the estate map's. This checks the served HTML of
 * the templates whose clauses are all of that kind:
 *
 *   1. Served HTML: no clause character carries an inline opacity 0 or an inline
 *      transform.
 *
 * It first proves it is looking at something (CONVENTIONS §18).
 *
 * FALSIFICATION (CONVENTIONS §16): an inline `opacity: 0` on every clause
 * character, proven present in the build it ran on → "serves clause characters
 * at opacity 0".
 */

const NOT_FOUND = "/en/no-such-page-served-motion";

/** [route, inventory panels it serves] */
const SERVED: [string, number][] = [
  ["/en/location", 0],
  ["/en/experiences", 0],
  ["/en/careers", 0],
  [NOT_FOUND, 0],
];

/* ------------------------------------------------------------------ 1 -- */

test.describe("clause and inventory — the server HTML is the finished page", () => {
  for (const [route, panels] of SERVED) {
    test(`${route} serves clause characters and inventory panels with no hidden or moved state`, async ({ request }) => {
      const res = await request.get(route);
      expect(res.status(), `${route} did not answer as expected`).toBe(route === NOT_FOUND ? 404 : 200);
      const html = await res.text();

      const chars = html.match(/<span[^>]*\sclass="clause-char"[^>]*>/g) ?? [];
      const flows = html.match(/<div[^>]*\sclass="inventory-flow"[^>]*>/g) ?? [];
      expect(chars.length, `${route} serves no clause characters, so the checks below would look at nothing`).toBeGreaterThan(0);
      expect(flows.length, `${route} serves ${flows.length} inventory panels, expected ${panels}`).toBe(panels);

      /*
       * Inline style ATTRIBUTES of the two elements Framer used to write. The
       * `<noscript>` override in `layout.tsx` contains `[style*="opacity:0"]`
       * as a selector, so a bare substring search would find the guard.
       */
      const styleOf = (tag: string) => /\sstyle="([^"]*)"/.exec(tag)?.[1] ?? "";
      const transparent = (tags: string[]) =>
        tags.filter((t) => /(?:^|;)\s*opacity\s*:\s*0(?:\.0*)?\s*(?:;|$)/.test(styleOf(t)));
      const moved = (tags: string[]) => tags.filter((t) => /(?:^|;)\s*transform\s*:/.test(styleOf(t)));

      expect(transparent(chars), `${route} serves clause characters at opacity 0 — hidden before any script has run`).toEqual([]);
      expect(moved(chars), `${route} serves clause characters with an inline transform`).toEqual([]);
      expect(transparent(flows), `${route} serves the inventory panel at opacity 0`).toEqual([]);
      expect(moved(flows), `${route} serves the inventory panel with an inline transform`).toEqual([]);
    });
  }
});
