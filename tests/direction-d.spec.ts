import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * DIRECTION D — the four rules, asserted.
 *
 * The design language was rejected twice on the same thing: type too large to
 * read, and compositions too congested to breathe. Those are not taste
 * questions, they are measurable, so they are measured here rather than left to
 * the next reviewer's eye.
 */

const ROUTES = [
  "/",
  "/en/the-estate",
  "/en/villas/villa-thoi",
  "/en/villas/villa-persi",
  "/en/villas/villa-eeanthe",
  "/en/villas/villa-melia",
  "/en/villas/villa-pueblo",
  "/styleguide",
];
const VILLA_ROUTES = ROUTES.filter((r) => r.startsWith("/en/villas/"));
const WIDTHS = [360, 390, 768, 1024, 1440, 1920];
const CEILING = 96;

test.describe("D1 — the display ceiling", () => {
  for (const width of WIDTHS) {
    test(`no legible type exceeds ${CEILING}px @ ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const over: string[] = [];
      for (const route of ROUTES) {
        await page.goto(route, { waitUntil: "load" });
        const hits = await page.evaluate((ceil) => {
          const out: string[] = [];
          for (const el of document.querySelectorAll<HTMLElement>("*")) {
            const cs = getComputedStyle(el);
            const size = parseFloat(cs.fontSize);
            if (size <= ceil) continue;
            // The ghost numeral is TEXTURE: aria-hidden and under 10% ink. It is
            // deliberately oversized and carries no information, so the ceiling
            // — which is about legibility — does not apply to it.
            const ghost =
              el.getAttribute("aria-hidden") === "true" && parseFloat(cs.opacity) < 0.1;
            if (ghost) continue;
            if (!(el.textContent ?? "").trim()) continue;
            out.push(`${el.tagName}.${String(el.className).slice(0, 32)} = ${Math.round(size)}px`);
          }
          return out;
        }, CEILING);
        for (const h of hits) over.push(`${route} — ${h}`);
      }
      expect(over, `type above the ${CEILING}px ceiling:\n  ${over.join("\n  ")}`).toEqual([]);
    });
  }
});

test.describe("D2 — one idea per viewport, and air between beats", () => {
  test("no beat is butted against the next", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    await page.waitForSelector(".d-plate");
    // Consecutive villa plates must be separated, not stacked edge to edge —
    // the "μπουκωμένο" failure of the previous round.
    const gaps = await page.evaluate(() => {
      const plates = [...document.querySelectorAll(".d-plate")];
      const out: number[] = [];
      for (let i = 1; i < plates.length; i++) {
        const prev = plates[i - 1]!.getBoundingClientRect();
        const cur = plates[i]!.getBoundingClientRect();
        out.push(Math.round(cur.top - prev.bottom));
      }
      return out;
    });
    expect(gaps.length).toBe(4);
    for (const g of gaps) {
      expect(g, `two villa plates are butted together (${g}px)`).toBeGreaterThan(48);
    }
  });

  test("a villa plate leaves the viewport room to end", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    const h = await page.locator(".d-plate-frame").first().evaluate((e) => e.getBoundingClientRect().height);
    expect(h, "a plate fills or overfills the viewport").toBeLessThan(900);
  });
});

test.describe("D3 — a name never sits over-and-larger than its photograph", () => {
  test("every villa name is below its frame, and smaller than it", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    await page.waitForSelector(".d-plate");
    const bad = await page.evaluate(() =>
      [...document.querySelectorAll(".d-plate")].flatMap((p) => {
        const frame = p.querySelector(".d-plate-frame")?.getBoundingClientRect();
        const name = p.querySelector(".d-plate-name");
        if (!frame || !name) return [`missing frame or name`];
        const n = name.getBoundingClientRect();
        const out: string[] = [];
        // Below, not over.
        if (n.top < frame.bottom - 1) out.push(`${name.textContent} overlaps its frame`);
        // And not wider than the thing it names.
        if (n.width > frame.width) out.push(`${name.textContent} is wider than its frame`);
        return out;
      })
    );
    expect(bad, bad.join("; ")).toEqual([]);
  });
});

test.describe("D4 — the ground, and the rarity of the dark", () => {
  test("the page is light, with exactly two deep interludes", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    await page.waitForSelector(".acts-sticky", { timeout: 15000 });

    const deep = await page.evaluate(() => {
      const PELAGOS = "rgb(20, 83, 95)";
      return [...document.querySelectorAll<HTMLElement>("main section, main > div > section, main .litany")]
        .filter((e) => getComputedStyle(e).backgroundColor === PELAGOS)
        .map((e) => String(e.className).slice(0, 40));
    });
    expect(
      deep.length,
      `deep-ground sections: ${deep.join(" | ")} — the direction allows one or two`
    ).toBeLessThanOrEqual(2);

    // And the acts, which used to be a long dark run, are now on limestone.
    const actsBg = await page.locator(".acts, .acts-stack").first().evaluate(
      (e) => getComputedStyle(e).backgroundColor
    );
    expect(actsBg, "the three acts are still on the deep ground").not.toBe("rgb(20, 83, 95)");
  });

  test("no horizontal overflow at any width", async ({ page }) => {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/", { waitUntil: "load" });
      const m = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth,
      }));
      expect(m.sw, `homepage overflows at ${width} (${m.sw} vs ${m.cw})`).toBe(m.cw);
    }
  });
});

test.describe("D5 — conversion", () => {
  test("a booking or enquiry affordance recurs down the page", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    const n = await page.evaluate(
      () =>
        document.querySelectorAll(
          'main a[href*="reserve-online.net"], main a[href*="/en/contact"], main a[href^="/en/weddings"]'
        ).length
    );
    expect(n, "too few decision points down a very long page").toBeGreaterThanOrEqual(5);
  });

  test("press proof is off the hero", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    const inHero = await page.evaluate(() => {
      const hero = document.querySelector(".d-hero");
      return /Cond/i.test(hero?.textContent ?? "");
    });
    expect(inHero, "the press mark is back in the hero").toBe(false);
    await expect(page.locator(".d-proof")).toHaveCount(1);
  });
});

test.describe("D6 — every image goes through the single resolver", () => {
  test("no raw inventory URL reaches an <img> on any route", async ({ page }) => {
    // The first build of the villa plates passed `gallery.heroImage` — a Loggia
    // CDN address — straight to next/image. Five plates rendered as five empty
    // rectangles, and worse, bypassing `localImage` bypasses the ruled-off list.
    // Same shape as T-185, so it gets the same kind of guard.
    for (const route of ROUTES) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route, { waitUntil: "load" });
      // Markup, not a scroll-walk — see the note in parity.spec.ts. Every `src`
      // is in the server HTML whether or not it has been scrolled to.
      const bad = await page.evaluate(() =>
        [...document.querySelectorAll("img")]
          .map((i) => decodeURIComponent(i.getAttribute("src") || ""))
          .filter((u) => /loggia-cdn|amazonaws\.com|^https?:\/\/(?!localhost)/.test(u))
      );
      expect(bad, `${route} renders a remote inventory URL: ${bad.join(", ")}`).toEqual([]);
    }
  });

  test("every villa plate actually paints a photograph", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    await page.evaluate(async () => {
      const s = Math.round(window.innerHeight * 0.8);
      for (let y = 0; y <= document.body.scrollHeight; y += s) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 130));
      }
    });
    await page.waitForTimeout(1200);
    const loaded = await page.evaluate(
      () =>
        [...document.querySelectorAll<HTMLImageElement>(".d-plate-frame img")].filter(
          (i) => i.complete && i.naturalWidth > 0
        ).length
    );
    expect(loaded, "a villa plate is an empty rectangle").toBe(5);
  });
});

test.describe("D7 — text over photography is legible by construction", () => {
  test("the hero copy band carries enough scrim for AA", async ({ page }) => {
    // Limestone needs the ground at or below sRGB ~105 for 4.5:1, which over a
    // pure-white sky means alpha >= 0.68. Asserted against the declared stops
    // rather than a sampled pixel, because the worst case is a frame we may not
    // have shot yet — the scrim has to be right for any photograph, not for
    // the one currently in the slot.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    const bg = await page.locator(".d-hero-scrim").evaluate(
      (e) => getComputedStyle(e).backgroundImage
    );
    const alphas = [...bg.matchAll(/rgba?\([^)]*?([01](?:\.\d+)?)\s*\)/g)].map((m) =>
      parseFloat(m[1]!)
    );
    expect(alphas.length, "no scrim gradient found").toBeGreaterThan(2);
    expect(
      Math.max(...alphas),
      `strongest scrim stop is ${Math.max(...alphas)}; AA over a white sky needs >= 0.68`
    ).toBeGreaterThanOrEqual(0.68);

    // And the copy must actually sit in the strong part of the ramp.
    const pos = await page.evaluate(() => {
      const hero = document.querySelector(".d-hero")!.getBoundingClientRect();
      const copy = document.querySelector(".d-hero-copy")!.getBoundingClientRect();
      return (copy.top - hero.top) / hero.height;
    });
    expect(pos, "the hero copy starts above the strong half of the scrim").toBeGreaterThan(0.45);
  });
});

test.describe("D8 — the villa template, on D", () => {
  for (const route of VILLA_ROUTES) {
    test(`${route} — spec strip prints only confirmed facts`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route, { waitUntil: "load" });
      await page.waitForSelector(".d-spec-strip");
      const values = await page.locator(".d-spec-value").allTextContents();
      expect(values.length, "empty spec strip").toBeGreaterThan(0);
      for (const v of values) {
        // T-212: an unconfirmed fact is OMITTED, never printed as a placeholder.
        expect(v.trim(), "a placeholder reached the spec strip").not.toMatch(/^[—–\-]$/);
        expect(v.trim().length).toBeGreaterThan(0);
      }
      // Area, where present, carries both units — metric as the value (it is
      // the registry figure) and imperial as a sub-note (it is arithmetic).
      const areaCell = page.locator(".d-spec-cell--area");
      if (await areaCell.count()) {
        const txt = (await areaCell.innerText()).replace(/\s+/g, " ");
        expect(txt, "metric without imperial").toMatch(/\d+ m²/);
        expect(txt, "metric without imperial").toMatch(/[\d,]+ sq ft/);
      }
    });

    test(`${route} — the Aman split is two lists, not one`, async ({ page }) => {
      await page.goto(route, { waitUntil: "load" });
      await expect(page.locator(".inventory")).toHaveCount(1);
      await expect(page.locator(".d-includes")).toHaveCount(1);
      // THE TRUE COUNT, read from the registry rather than asserted as a
      // literal: `verified-facts.json.includedServices` states THREE services,
      // and the private beach is a fourth row of a different kind — a property
      // feature confirmed by every villa's `specs.distanceToBeach`. Three plus
      // one. Two earlier report lines said "exactly three" and "the four
      // inclusions"; both were true about different things, and this is what
      // stops that ambiguity recurring.
      const facts = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), "content", "verified-facts.json"), "utf-8")
      ) as { includedServices?: string[] };
      const services = facts.includedServices ?? [];
      expect(services.length, "the registry's service count moved").toBe(3);

      const includes = await page.locator(".d-includes-label").allTextContents();
      expect(includes.length, "three registry services plus the private beach").toBe(
        services.length + 1
      );
      for (const svc of services) {
        expect(includes.join(" | "), `registry service missing: ${svc}`).toContain(svc);
      }
      expect(includes.join(" | ")).toContain("private beach");
      // OWNER-CONFIRMED 2026-08-18: breakfast is NOT included; it carries an
      // extra charge. This list is closed at four. The assertion is permanent,
      // not provisional — it stops a future copy pass from quietly implying
      // an inclusion that would be a false commercial term.
      expect(includes.join(" ").toLowerCase()).not.toContain("breakfast");
    });

    test(`${route} — cross-sell offers the other four`, async ({ page }) => {
      await page.goto(route, { waitUntil: "load" });
      await expect(page.locator(".d-other")).toHaveCount(4);
      const self = route.split("/").pop();
      const hrefs = await page.locator(".d-other").evaluateAll((els) =>
        els.map((e) => e.getAttribute("href") ?? "")
      );
      expect(hrefs.some((h) => h.endsWith(self!)), "a villa cross-sells itself").toBe(false);
    });
  }

  test("Pueblo omits rows rather than printing dashes", async ({ page }) => {
    await page.goto("/en/villas/villa-pueblo", { waitUntil: "load" });
    const pueblo = await page.locator(".d-spec-label").allTextContents();
    await page.goto("/en/villas/villa-thoi", { waitUntil: "load" });
    const thoi = await page.locator(".d-spec-label").allTextContents();
    // Both render a strip; neither renders an empty cell. Pueblo may legitimately
    // carry fewer, and that is the point of the rule.
    expect(pueblo.length).toBeGreaterThan(0);
    expect(thoi.length).toBeGreaterThan(0);
    expect(pueblo.every((l) => l.trim().length > 0)).toBe(true);
  });
});

/**
 * D9 — CONTRAST, MEASURED.
 *
 * `.btn-primary micro` rendered phrygana on basalt at **2.27:1** on every route
 * since the elevation pass — the single most important element on the page,
 * illegible, and invisible as a bug because the button still looked like a
 * button. Cause: globals.css imports every partial at the top, so its own
 * `.micro { color: … }` cascaded after `.btn-primary`'s at equal specificity.
 * Same trap as T-217 and T-236.
 *
 * Specificity fixed that instance. This measures every instance, so the cascade
 * cannot quietly win again.
 */
function contrast(fg: number[], bg: number[]): number {
  const lum = (c: number[]) => {
    const f = (v: number) => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c[0]!) + 0.7152 * f(c[1]!) + 0.0722 * f(c[2]!);
  };
  const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a);
  return (hi! + 0.05) / (lo! + 0.05);
}

test.describe("D9 — every call to action passes AA", () => {
  for (const route of ROUTES) {
    test(`CTA contrast on ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route, { waitUntil: "load" });

      const ctas = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>(".btn-primary, .estate-cta, .d-link, .nav-book")]
          .filter((e) => e.offsetParent !== null || getComputedStyle(e).position === "fixed")
          .map((e) => {
            const cs = getComputedStyle(e);
            let bg = cs.backgroundColor;
            let n: HTMLElement | null = e;
            let unresolvable = false;
            while (n && (bg === "rgba(0, 0, 0, 0)" || bg === "transparent")) {
              const ncs = getComputedStyle(n);
              // A DOM-ancestor walk is meaningless once it passes a fixed or
              // absolutely-positioned element, or one whose ground is a gradient
              // or an image: what is visually BEHIND such an element is not its
              // parent. The fixed nav sits over a photograph, not over the page
              // ground, and reading the page ground gave limestone-on-limestone
              // — a false failure that appeared the moment the layer fix let the
              // nav take its real colour. Those cases are covered by the scrim
              // rule (D7) instead of by this one.
              if (
                ncs.position === "fixed" ||
                ncs.position === "absolute" ||
                ncs.backgroundImage !== "none"
              ) {
                unresolvable = true;
                break;
              }
              n = n.parentElement;
              if (!n) break;
              bg = getComputedStyle(n).backgroundColor;
            }
            if (unresolvable) return null;
            const px = parseFloat(cs.fontSize);
            const bold = parseInt(cs.fontWeight, 10) >= 700;
            return {
              label: (e.textContent ?? "").trim().slice(0, 30),
              fg: cs.color,
              bg,
              large: px >= 24 || (bold && px >= 18.66),
            };
          })
          .filter(Boolean) as {
          label: string;
          fg: string;
          bg: string;
          large: boolean;
        }[]
      );

      const parse = (s: string) => (s.match(/\d+/g) ?? []).slice(0, 3).map(Number);
      const fails: string[] = [];
      for (const c of ctas) {
        // A CTA over a photograph has no resolvable ground colour; those are
        // covered by the scrim rule (D7) rather than by this one.
        if (!/^rgba?\(/.test(c.bg) || c.bg === "rgba(0, 0, 0, 0)") continue;
        const r = contrast(parse(c.fg), parse(c.bg));
        const need = c.large ? 3 : 4.5;
        if (r < need) fails.push(`"${c.label}" ${r.toFixed(2)}:1 (needs ${need}) — ${c.fg} on ${c.bg}`);
      }
      expect(fails, `CTAs below AA on ${route}:\n  ${fails.join("\n  ")}`).toEqual([]);
    });
  }
});

/**
 * D10 — THE ROUTE TRANSITION MAY NEVER COST THE HAND-OFF.
 *
 * A client-side navigation does not move focus by default, which strands a
 * keyboard or screen-reader user on the previous page's last focused element —
 * they tab onward and land in the middle of a document they never heard the
 * start of. The wipe is decoration; this is the part that matters.
 */
test.describe("D10 — page transitions", () => {
  test("focus lands on the new page's #main after navigating", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });

    // Navigate the way a keyboard user would: activate a real link.
    await page.locator('.nav-register a[href="/en/the-estate"]').click();
    await page.waitForURL("**/en/the-estate");
    await page.waitForTimeout(400);

    const landed = await page.evaluate(() => ({
      id: document.activeElement?.id ?? "",
      tag: document.activeElement?.tagName ?? "",
      path: location.pathname,
    }));
    expect(landed.path).toContain("/en/the-estate");
    expect(landed.id, `focus was left on <${landed.tag}> instead of #main`).toBe("main");
  });

  test("the wipe cleans itself up and never blocks the page", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await page.locator('.nav-register a[href="/en/experiences"]').click();
    await page.waitForURL("**/en/experiences");
    // Well past the 520ms animation.
    await page.waitForTimeout(1400);
    const left = await page.locator(".d-wipe").count();
    expect(left, "a wipe sheet is still in the DOM after the animation").toBe(0);
    // And the page beneath it is interactive.
    await expect(page.locator("main h1")).toBeVisible();
  });

  test("reduced motion navigates with no sheet at all", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/", { waitUntil: "load" });
    await page.locator('.nav-register a[href="/en/location"]').click();
    await page.waitForURL("**/en/location");
    expect(await page.locator(".d-wipe").count()).toBe(0);
    // The focus hand-off is an accessibility behaviour and still happens.
    await page.waitForTimeout(300);
    const id = await page.evaluate(() => document.activeElement?.id ?? "");
    expect(id, "reduced motion dropped the focus hand-off").toBe("main");
    await ctx.close();
  });
});

/**
 * D11 — the states a visitor reaches when something is wrong.
 *
 * A luxury site usually drops its voice exactly here and shows a wireframe.
 * These assert that the 404 keeps the register, offers a way onward, and is
 * genuinely a 404 to a crawler — a soft 404 that returns 200 tells Google the
 * page exists, which is how a migration keeps dead URLs in the index.
 */
test.describe("D11 — error and edge states", () => {
  test("a garbage route renders the branded 404 with a real 404 status", async ({ page }) => {
    const res = await page.goto("/en/villas/this-villa-does-not-exist", { waitUntil: "load" });
    expect(res?.status(), "soft 404 — a crawler will treat this page as real").toBe(404);
    await expect(page.locator("h1")).toBeVisible();
    const body = await page.locator("main").innerText();
    expect(body).toContain("not here");
    // Two ways onward, not a dead end.
    await expect(page.locator('main a[href="/"]')).toHaveCount(1);
    await expect(page.locator('main a[href="/en/contact"]')).toHaveCount(1);
  });

  test("the 404 is noindex", async ({ page }) => {
    await page.goto("/nonsense-route-xyz", { waitUntil: "load" });
    const robots = await page.locator('meta[name="robots"]').first().getAttribute("content");
    expect(robots ?? "").toContain("noindex");
  });

  test("the 404 keeps the brand register rather than dropping to a wireframe", async ({ page }) => {
    await page.goto("/nonsense-route-xyz", { waitUntil: "load" });
    // The signature clause, the photography, and the limestone ground. The
    // count is "at least one", not "exactly one" — the footer carries a clause
    // too, and asserting an exact number here measures the footer rather than
    // the 404.
    expect(await page.locator("main .clause").count()).toBeGreaterThanOrEqual(1);
    expect(await page.locator("main .field img").count()).toBeGreaterThanOrEqual(1);
    const bg = await page.locator(".d").first().evaluate((e) => getComputedStyle(e).backgroundColor);
    expect(bg).toBe("rgb(232, 233, 227)");
  });
});
