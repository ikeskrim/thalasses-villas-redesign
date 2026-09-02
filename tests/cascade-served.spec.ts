import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * THE SAME INVARIANT, ASSERTED ON WHAT THE BROWSER ACTUALLY RECEIVES.
 *
 * `cascade.spec.ts` asserts it in the SOURCE, and its header explains why:
 * a rendered check only sees the routes someone remembered to test. That is
 * true, and it is only half the argument — because the fifth occurrence of this
 * defect did not look like the first four.
 *
 *   T-217 / T-242 / T-247 / T-274   rules unlayered INSIDE the CSS tree
 *   the fifth                       a whole stylesheet that never entered the
 *                                   CSS tree at all: `hotel.css` was imported
 *                                   from `layout.tsx`, so every rule in
 *                                   Direction F's homepage — the production
 *                                   homepage — outranked every layer on the
 *                                   site, and each source test looked past it
 *                                   because each one starts from the entry file
 *                                   and walks down.
 *
 * A source test can only check the doors it knows about. This one starts from
 * the other end: it takes every stylesheet that reaches a rendered page, by
 * whatever route it got there — the CSS entry, a component-level import, a CSS
 * module, a library, a `<style>` React decided to inline — and fails on any
 * rule sitting outside a declared layer.
 *
 * The two tests are complements and both are needed. The source one catches a
 * partial nobody renders yet; this one catches CSS that arrives by a door the
 * source one cannot see. The sixth occurrence has to get past both.
 */

/** Routes chosen to cover BOTH directions live in the build. */
const ROUTES = [
  "/", // Direction F — the production homepage
  "/en/the-estate", // Direction D — the inner pages
  "/en/villas/villa-thoi", // a villa detail, which carries villa.css
  "/en/contact", // a form page, which carries the register partial
];

/**
 * At-rules whose contents are NOT style rules and so cannot be "unlayered".
 * `@keyframes` holds percentage stops, `@font-face` a descriptor block, and
 * neither participates in the cascade the way a style rule does.
 */
const OPAQUE_AT_RULES = /^@(keyframes|-webkit-keyframes|font-face|property|counter-style|page|viewport|font-feature-values)/;

/** At-rules that are transparent: rules inside them keep the enclosing layer. */
const NESTING_AT_RULES = /^@(media|supports|container|scope|starting-style|layer)/;

/**
 * The ONE exemption, and it is narrow on purpose.
 *
 * `next/font` generates a class per face and emits the rules itself, outside
 * our stylesheet and outside our control — there is no hook to layer them.
 * They are exempt only because of what they contain: a font-family, font
 * descriptors, and the `--font-*` custom property. The declaration check below
 * is the actual guard. If one of these ever carried a colour or a size, it
 * would outrank every layer on the site and this test would say so.
 */
const NEXT_FONT_CLASS = /^\.[A-Za-z0-9]+_[A-Za-z0-9]+-module__[A-Za-z0-9_-]+__(className|variable)$/;
const FONT_SAFE_PROPERTY = /^(font-family|font-style|font-weight|font-display|font-stretch|font-feature-settings|font-variation-settings|src|ascent-override|descent-override|line-gap-override|size-adjust|unicode-range|--font-[a-z0-9-]+)$/i;

type Stray = { selector: string; declarations: string; source: string };

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * Walk a stylesheet tracking the layer in force, and return every style rule
 * that is in no layer at all, plus every layer name actually used.
 */
function scan(cssRaw: string, source: string): { strays: Stray[]; layersUsed: Set<string> } {
  const css = stripComments(cssRaw);
  const strays: Stray[] = [];
  const layersUsed = new Set<string>();
  /* Each frame: the layer in force, and whether we are inside an opaque block. */
  const stack: { layer: string | null; opaque: boolean }[] = [];
  const top = () => (stack.length ? stack[stack.length - 1]! : { layer: null, opaque: false });

  let i = 0;
  let head = 0;

  while (i < css.length) {
    const ch = css[i];

    if (ch === "{") {
      const raw = css.slice(head, i).trim();
      const parent = top();

      if (parent.opaque) {
        /* Inside @keyframes and friends — descend but check nothing. */
        stack.push({ layer: parent.layer, opaque: true });
      } else if (OPAQUE_AT_RULES.test(raw)) {
        stack.push({ layer: parent.layer, opaque: true });
      } else if (NESTING_AT_RULES.test(raw)) {
        const m = /^@layer\s+([A-Za-z0-9_.-]+)/.exec(raw);
        if (m) layersUsed.add(m[1]!);
        stack.push({ layer: m ? m[1]! : parent.layer, opaque: false });
      } else if (raw.startsWith("@")) {
        /* An at-rule we do not model — treat it as opaque rather than guess. */
        stack.push({ layer: parent.layer, opaque: true });
      } else {
        /* A style rule. This is the thing under test. */
        if (parent.layer === null && raw.length > 0) {
          const close = findClose(css, i);
          strays.push({ selector: raw, declarations: css.slice(i + 1, close).trim(), source });
        }
        stack.push({ layer: parent.layer, opaque: false });
      }
      head = i + 1;
      i++;
      continue;
    }

    if (ch === "}") {
      stack.pop();
      head = i + 1;
      i++;
      continue;
    }

    if (ch === ";") {
      const raw = css.slice(head, i).trim();
      const m = /^@layer\s+([^;]+)$/.exec(raw);
      if (m) for (const n of m[1]!.split(",")) layersUsed.add(n.trim());
      head = i + 1;
      i++;
      continue;
    }

    i++;
  }

  return { strays, layersUsed };
}

/** Index of the `}` closing the block that opens at `open`. */
function findClose(css: string, open: number): number {
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return css.length;
}

/** A next/font class carrying nothing but font descriptors is exempt. */
function isExemptFontRule(s: Stray): boolean {
  if (!s.selector.split(",").every((sel) => NEXT_FONT_CLASS.test(sel.trim()))) return false;
  const props = s.declarations
    .split(";")
    .map((d) => d.split(":")[0]?.trim())
    .filter((d): d is string => !!d);
  return props.length > 0 && props.every((prop) => FONT_SAFE_PROPERTY.test(prop));
}

/** The layer order declared in the entry file — the single source of order. */
function declaredLayers(): string[] {
  const entry = stripComments(
    fs.readFileSync(path.join(process.cwd(), "src", "app", "globals.css"), "utf-8")
  );
  const m = /@layer\s+([^{;]+);/.exec(entry);
  expect(m, "globals.css declares no layer order — the cascade has no defined order at all").toBeTruthy();
  return m![1]!.split(",").map((s) => s.trim());
}

test.describe("cascade layers, as served", () => {
  for (const route of ROUTES) {
    test(`every rule reaching ${route} sits in a declared layer`, async ({ page, request }) => {
      await page.goto(route, { waitUntil: "load" });

      /*
       * Every stylesheet the page actually pulls in, by whatever route.
       *
       * A `<style>` inside `<noscript>` is deliberately excluded and it is the
       * only exclusion: it applies exactly when scripting is off, exists to
       * un-hide motion's initial states, and is `!important` on purpose. It is
       * asserted to BE inside noscript below rather than trusted to be.
       */
      const sources = await page.evaluate(() => {
        const links = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map(
          (l) => l.getAttribute("href") ?? ""
        );
        const inline = [...document.querySelectorAll<HTMLStyleElement>("style")].map((s) => ({
          css: s.textContent ?? "",
          inNoscript: !!s.closest("noscript"),
        }));
        return { links, inline };
      });

      expect(
        sources.links.length + sources.inline.length,
        "no stylesheets found on the page — this test is not looking at anything"
      ).toBeGreaterThan(0);

      const sheets: { css: string; name: string }[] = [];
      for (const href of sources.links) {
        const res = await request.get(href);
        expect(res.status(), `${href} did not load`).toBe(200);
        sheets.push({ css: await res.text(), name: href });
      }
      for (const [n, s] of sources.inline.entries()) {
        if (s.inNoscript) continue;
        sheets.push({ css: s.css, name: `inline <style> #${n + 1}` });
      }

      expect(
        sheets.length,
        "every stylesheet on this page was skipped — the exclusion is too broad"
      ).toBeGreaterThan(0);

      const declared = declaredLayers();
      const allStrays: Stray[] = [];
      const allLayers = new Set<string>();

      for (const sheet of sheets) {
        const { strays, layersUsed } = scan(sheet.css, sheet.name);
        allStrays.push(...strays);
        for (const l of layersUsed) allLayers.add(l);
      }

      /* Sanity: a sheet with no layers at all means the scan found nothing. */
      expect(
        allLayers.size,
        "no @layer appears in anything the page loaded — either the scan is broken " +
          "or the layered build did not ship"
      ).toBeGreaterThan(0);

      /* A layer nobody declared has no defined position in the order. */
      const undeclared = [...allLayers].filter((l) => !declared.includes(l.split(".")[0]!));
      expect(
        undeclared,
        `these layers are used but are absent from the order declared in globals.css, ` +
          `so their position in the cascade is whatever order the browser met them in:\n  ` +
          `${undeclared.join("\n  ")}\ndeclared: ${declared.join(", ")}`
      ).toEqual([]);

      /* The invariant. */
      const offenders = allStrays.filter((s) => !isExemptFontRule(s));
      expect(
        offenders.map((s) => `${s.selector}   [${s.source}]`),
        `these rules reach ${route} outside every cascade layer, and unlayered ` +
          `declarations beat EVERY layer whatever their specificity. That is the ` +
          `defect this project has now shipped five times.\n\n` +
          offenders
            .slice(0, 12)
            .map((s) => `  ${s.selector}\n     in ${s.source}\n     { ${s.declarations.slice(0, 140)} }`)
            .join("\n") +
          `\n\nPut the stylesheet behind globals.css with @import ... layer(components), ` +
          `or wrap the rule in the layer it belongs to.`
      ).toEqual([]);
    });
  }

  test("the served layer order is the intended one, not whatever the bundler emitted", async ({
    page,
    request,
  }) => {
    /*
     * MEMBERSHIP IS NOT ENOUGH; ORDER DECIDES THE WINNER.
     *
     * A rule can be correctly inside `components` and still lose to a rule in a
     * layer that ended up above it. And the declared order in globals.css is
     * NOT what ships: Lightning CSS prunes the statement to `@layer tokens;`,
     * so the browser takes the order from each layer's FIRST APPEARANCE in the
     * bundle. That is an emergent property of import order — exactly the kind
     * of thing that changes under a dependency bump with nothing in the diff to
     * suggest the cascade moved.
     *
     * Found by this file: Tailwind's `theme` layer was appearing last and so
     * outranked `components` and `utilities` across the whole site. Nothing
     * collided, so nothing looked wrong. This pins it.
     */
    await page.goto("/", { waitUntil: "load" });
    const href = await page.evaluate(
      () => document.querySelector<HTMLLinkElement>('link[rel="stylesheet"]')?.getAttribute("href") ?? ""
    );
    const css = stripComments(await (await request.get(href)).text());

    const firstAppearance = (name: string): number => {
      const block = css.indexOf(`@layer ${name}{`);
      const stmt = css.search(new RegExp(`@layer[^;{]*\\b${name}\\b[^;{]*;`));
      const hits = [block, stmt].filter((n) => n >= 0);
      return hits.length ? Math.min(...hits) : -1;
    };

    /* Our own layers, in the order this project depends on. */
    const ours = ["base", "register", "primitives", "components", "utilities"];
    const positions = ours.map((n) => ({ n, at: firstAppearance(n) }));
    for (const p of positions) {
      expect(p.at, `layer "${p.n}" does not appear in the served sheet at all`).toBeGreaterThanOrEqual(0);
    }
    const sorted = [...positions].sort((a, b) => a.at - b.at).map((p) => p.n);
    expect(
      sorted,
      `the served cascade order is ${sorted.join(" < ")}, which is not the order this ` +
        `codebase is written against. A partial can no longer count on overriding a primitive.`
    ).toEqual(ours);

    /*
     * Tailwind's token layer must stay BELOW ours. Above `components` it wins
     * every `--color-*`, `--font-*` and `--text-*` collision, silently.
     */
    const theme = firstAppearance("theme");
    const components = firstAppearance("components");
    expect(theme, "Tailwind's theme layer is missing from the served sheet").toBeGreaterThanOrEqual(0);
    expect(
      theme < components,
      `Tailwind's @layer theme appears at ${theme}, AFTER components at ${components}, ` +
        `so it now outranks every component rule on the site. Declare it in the @layer ` +
        `statement at the top of globals.css.`
    ).toBe(true);
  });

  test("the exemption cannot be widened without saying so", () => {
    /*
     * The next/font exemption is the one hole in the invariant above, so it is
     * pinned here. If someone widens NEXT_FONT_CLASS or FONT_SAFE_PROPERTY to
     * quiet a failure, this fails and makes them argue for it.
     *
     * A colour or a size on an exempt selector would outrank every layer on the
     * site — which is precisely the defect, arriving through the exemption
     * written to prevent it.
     */
    for (const prop of ["color", "background", "font-size", "margin", "display", "z-index"]) {
      expect(
        FONT_SAFE_PROPERTY.test(prop),
        `"${prop}" is treated as a font descriptor by the exemption — it is not, ` +
          `and an unlayered rule setting it would beat every layer on the site`
      ).toBe(false);
    }
    for (const sel of [".ho-book", ".nav", "body", ":root", ".skip-link"]) {
      expect(
        NEXT_FONT_CLASS.test(sel),
        `"${sel}" matches the next/font exemption — the pattern is too loose`
      ).toBe(false);
    }
    expect(NEXT_FONT_CLASS.test(".literata_13ce4cb4-module__-25LuW__variable")).toBe(true);
  });
});
