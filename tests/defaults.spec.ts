import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * THE REVIEWER DEFAULTS, D-003 TO D-010, ASSERTED WHERE THEY RENDER.
 *
 * Each default is a claim about what the live page says. They are asserted on
 * the rendered page, not on the data files, because a data file can be right
 * while a component somewhere prints the old text — which is how the pool price
 * was found on three routes when only one had been looked at.
 *
 * And the two rulings that REMOVE something from the page (D-009, D-010) are
 * asserted in both directions: gone from every rendered route, still present in
 * the registry. The registry is the owner's record; the ruling is about the
 * page, and a "fix" that edited the record would lose the thing he may want back.
 */
const ROOT = process.cwd();
const read = (...p: string[]) => fs.readFileSync(path.join(ROOT, ...p), "utf-8");

async function allRoutes(request: import("@playwright/test").APIRequestContext): Promise<string[]> {
  const xml = await (await request.get("/sitemap.xml")).text();
  const routes = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname);
  expect(routes.length, "the sitemap is empty — this test is looking at nothing").toBeGreaterThan(20);
  return routes;
}

/** Visible text of a route as a crawler receives it: the server HTML, tags stripped. */
async function textOf(request: import("@playwright/test").APIRequestContext, route: string): Promise<string> {
  const html = await (await request.get(route)).text();
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

test.describe("D-009 · pool heating is never priced on the page", () => {
  test("no rendered route prints a euro figure", async ({ request }) => {
    const offenders: string[] = [];
    for (const r of await allRoutes(request)) {
      const t = await textOf(request, r);
      const m = t.match(/.{0,50}(\d\s*€|€\s*\d).{0,30}/);
      if (m) offenders.push(`${r}: …${m[0]}…`);
    }
    expect(offenders, "a price reached the page").toEqual([]);
  });

  test("the page says it in the registry's own unpriced words, once per villa", async ({ request }) => {
    const t = await textOf(request, "/en/villas/villa-persi");
    const n = (t.match(/can be heated with an additional charge per day upon request/gi) ?? []).length;
    expect(n, "the unpriced line is missing from Villa Persi's practical notes").toBeGreaterThan(0);
  });

  test("the registry still holds the figure for the owner", () => {
    expect(read("content", "villas", "201.json")).toContain("35€ per day");
  });
});

test.describe("D-010 · no superlative on the helipad", () => {
  test("no rendered route claims the only seafront villas with a helipad", async ({ request }) => {
    const offenders: string[] = [];
    for (const r of await allRoutes(request)) {
      const t = await textOf(request, r);
      const m = t.match(/.{0,40}only seafront villas.{0,30}/i);
      if (m) offenders.push(`${r}: …${m[0]}…`);
    }
    expect(offenders).toEqual([]);
  });

  test("the helipad page says 'with private helipad'", async ({ request }) => {
    expect(await textOf(request, "/en/experiences/private-helipad")).toMatch(/with private helipad/i);
  });

  test("the registry still holds the original wording", () => {
    expect(read("content", "experiences", "private-helipad.json")).toContain("the only seafront villas with private helipad");
  });
});

test.describe("D-003 · chauffeur and helipad are cards, under Arrival", () => {
  test("both cards render with the property's own frames", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    const arrival = await page.evaluate(() => {
      const group = [...document.querySelectorAll("#experiences .ho-group")].find(
        (g) => g.querySelector("h3")?.textContent?.trim() === "Arrival"
      );
      if (!group) return null;
      return [...group.querySelectorAll(".ho-card")].map((c) => {
        const img = c.querySelector("img");
        const s = img?.getAttribute("src") ?? "";
        const m = /url=([^&]+)/.exec(s);
        return { name: c.querySelector("h3")?.textContent?.trim(), src: m?.[1] ? decodeURIComponent(m[1]) : s };
      });
    });
    expect(arrival, "there is no Arrival group on the homepage").not.toBeNull();
    const byName = new Map(arrival!.map((c) => [c.name, c.src]));
    expect(byName.get("Chauffeur")).toContain("Villa-Persi-44_result.webp");
    /* The property's own aerial of the pad — graded C, used because it is the only frame that shows it. */
    expect(byName.get("Private Helipad")).toContain("2ca530376f629c92eadcd526ba9f25c9");
  });
});

test.describe("D-005 · the Discover Crete quote is sourced, not composed", () => {
  const m = JSON.parse(read("content", "mantinada.json")) as {
    lines: [string, string] | null;
    attribution: string;
    cite: string;
    source: Record<string, string | number>;
  };

  test("the record carries a full, checkable source", () => {
    expect(m.lines, "no couplet on file — the slot should be labelled, not this test run").not.toBeNull();
    for (const k of ["editor", "title", "place", "publisher", "year", "section", "page", "number", "scan"]) {
      expect(m.source[k], `source.${k} is missing`).toBeTruthy();
    }
    expect(m.attribution).toBe("Παραδοσιακή κρητική μαντινάδα");
  });

  test("the couplet renders in Greek inside Discover Crete, attributed", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    const q = await page.evaluate(() => {
      const f = document.querySelector("#crete figure.ho-mantinada");
      return f
        ? {
            lang: f.getAttribute("lang"),
            quote: f.querySelector("blockquote")?.textContent?.replace(/\s+/g, " ").trim(),
            caption: f.querySelector("figcaption")?.textContent?.replace(/\s+/g, " ").trim(),
          }
        : null;
    });
    expect(q, "no mantinada in #crete").not.toBeNull();
    expect(q!.lang).toBe("el");
    /* The two lines are separated by a <br>, which textContent renders as
       nothing — so compare with whitespace removed on both sides. */
    const squash = (s: string) => s.replace(/\s+/g, "");
    expect(squash(q!.quote ?? "")).toBe(squash(m.lines![0] + m.lines![1]));
    expect(q!.caption).toContain(m.attribution);
    expect(q!.caption).toContain(m.cite);
    /* The standalone quote section is gone, and so is its placeholder. */
    expect(await page.locator("section.ho-quote").count()).toBe(0);
    expect(await page.locator("body").innerText()).not.toContain("[owner to supply — a mantinada");
  });
});

test.describe("D-006 · sister properties, names and links only", () => {
  test("three links, the brands' own sites, no logos, no unconfirmed group name", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    const col = await page.evaluate(() => {
      const h = [...document.querySelectorAll(".ho-footer h4")].find((x) => x.textContent?.trim() === "Sister properties");
      const box = h?.parentElement;
      if (!box) return null;
      return {
        links: [...box.querySelectorAll("a")].map((a) => ({
          name: a.textContent?.trim(),
          href: a.getAttribute("href"),
          rel: a.getAttribute("rel") ?? "",
        })),
        imgs: box.querySelectorAll("img").length,
        footerText: document.querySelector(".ho-footer")?.textContent ?? "",
      };
    });
    expect(col, "no Sister properties column in the footer").not.toBeNull();
    expect(col!.links.map((l) => [l.name, l.href])).toEqual([
      ["Ink Hotels", "https://inkhotels.gr/"],
      ["Domisignature", "https://www.domisignature.com/"],
      ["Crete Holiday Home", "https://creteholidayhome.com/"],
    ]);
    for (const l of col!.links) expect(l.rel).toContain("noopener");
    expect(col!.imgs, "a logo is being shown without files from the owner").toBe(0);
    expect(col!.footerText).not.toContain("Domisi\n");
    expect(col!.footerText).not.toContain("[owner to confirm the group name");
  });
});

test.describe("D-007 · the press wall is one credential line", () => {
  test("one line, in the site's own type, no empty tiles", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    const line = await page.locator(".ho-credential").textContent();
    expect(line?.replace(/\s+/g, " ").trim()).toBe("As featured in — Condé Nast Traveler, 2024");
    expect(await page.locator(".ho-press-slot").count()).toBe(0);
    expect(await page.locator("body").innerText()).not.toContain("What has been written");
    const link = page.locator(".ho-credential a");
    await expect(link).toHaveAttribute("href", "https://www.cntraveler.com/story/where-to-stay-in-crete");
  });
});

test.describe("D-008 · the hero sub-line carries no pending marker", () => {
  test("no draft marker anywhere on the homepage", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    expect(await page.locator(".ho-draft").count()).toBe(0);
    expect(await page.locator("body").innerText()).not.toMatch(/voice not signed off|T-256/);
  });
});
