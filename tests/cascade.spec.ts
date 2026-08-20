import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * NOTHING IS UNLAYERED.
 *
 * This project has now lost the same fight four times, and every round looked
 * like a different bug:
 *
 *   T-217  a register rule beat a component rule on import order
 *   T-242  every primary CTA on the site sat at 2.27:1
 *   T-247  the estate's enquiry CTA at 1.43:1
 *   T-274  the hero's own word, "UNLIMITED", in dark olive on a dark
 *          photograph — because `.d-hero-copy .clause-tail { color: limestone }`
 *          in a layered partial was being beaten by an UNLAYERED rule in
 *          globals.css, which no amount of specificity can win
 *
 * The first three were cured by putting the partials into `@layer components`.
 * That fix was real, and it created the fourth: globals.css's own rules stayed
 * outside every layer, and unlayered declarations outrank ALL layers regardless
 * of specificity — so the cure quietly inverted the problem.
 *
 * The invariant that actually holds is simpler than any of the fixes: **every
 * rule in this codebase belongs to a layer.** Once that is true the cascade is
 * decided by one line at the top of globals.css and by nothing else, and none
 * of the four failures above can be expressed.
 *
 * This is a SOURCE assertion, not a browser one, and deliberately so. A
 * rendered-page check can only catch the instances that happen to be visible on
 * a route someone remembered to test — which is exactly how three of the four
 * reached HEAD.
 */
const CSS_DIR = path.join(process.cwd(), "src", "app");
const ENTRY = "globals.css";

/** Strips comments so a `{` inside prose cannot be read as a rule. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

test.describe("cascade layers", () => {
  test("the layer order is declared exactly once, in the entry file", () => {
    const css = stripComments(fs.readFileSync(path.join(CSS_DIR, ENTRY), "utf-8"));
    const decls = css.match(/@layer\s+[^{;]+;/g) ?? [];
    expect(decls, "globals.css must declare the layer order once").toHaveLength(1);
    /* The order itself is the design decision; this only asserts it exists and
       that `components` sits above `primitives`, which is the fix for T-274. */
    const order = decls[0]!
      .replace(/@layer\s+/, "")
      .replace(";", "")
      .split(",")
      .map((s) => s.trim());
    expect(order).toContain("primitives");
    expect(order).toContain("components");
    expect(
      order.indexOf("components"),
      "a component partial must be able to override a primitive"
    ).toBeGreaterThan(order.indexOf("primitives"));
  });

  test("every imported partial names a layer", () => {
    const css = stripComments(fs.readFileSync(path.join(CSS_DIR, ENTRY), "utf-8"));
    const imports = css.match(/@import\s+[^;]+;/g) ?? [];
    expect(imports.length, "no imports found — this test is not looking at anything").toBeGreaterThan(2);
    const unlayered = imports.filter(
      (i) => !/layer\(/.test(i) && !/tailwindcss/.test(i)
    );
    expect(
      unlayered,
      `these partials load outside every layer and will outrank all of them:\n  ${unlayered.join("\n  ")}`
    ).toEqual([]);
  });

  test("no rule in the entry file sits outside a layer", () => {
    const css = stripComments(fs.readFileSync(path.join(CSS_DIR, ENTRY), "utf-8"));
    /* Everything after the last @import must be inside an @layer block. */
    const lastImport = css.lastIndexOf("@import");
    const after = css.slice(css.indexOf(";", lastImport) + 1);

    let depth = 0;
    let pending = "";
    const strays: string[] = [];
    for (const ch of after) {
      if (ch === "{") {
        if (depth === 0) {
          const head = pending.trim().split("\n").pop()?.trim() ?? "";
          if (head && !head.startsWith("@layer")) strays.push(head.slice(0, 70));
        }
        depth++;
        pending = "";
      } else if (ch === "}") {
        depth = Math.max(0, depth - 1);
        pending = "";
      } else if (depth === 0) {
        pending += ch;
      }
    }

    expect(
      strays,
      "these rules are unlayered and therefore beat every layer, whatever their " +
        `specificity:\n  ${strays.join("\n  ")}`
    ).toEqual([]);
  });

  test("every stylesheet in src/app is either the entry or imported by it", () => {
    /*
     * A partial nobody imports is dead code; a partial imported from somewhere
     * else could re-enter unlayered. Both are caught by requiring the entry file
     * to be the single door.
     */
    const files = fs.readdirSync(CSS_DIR).filter((f) => f.endsWith(".css"));
    expect(files.length, "no stylesheets found — this test is not looking at anything").toBeGreaterThan(1);
    const entry = fs.readFileSync(path.join(CSS_DIR, ENTRY), "utf-8");
    const orphans = files.filter((f) => f !== ENTRY && !entry.includes(f));
    expect(orphans, `not imported by ${ENTRY}: ${orphans.join(", ")}`).toEqual([]);
  });
});
