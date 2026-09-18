import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * THE PERFORMANCE PASS, GUARDED (`DECISIONS.md` D-012).
 *
 * The phone-profile blocking time fell because of three structural facts about
 * the served HTML, not because of a threshold anyone could quietly relax. Each
 * is cheap to lose — a `loading.tsx` added back at the root, a client
 * component imported into the 404 tree, a static import of a library — and none
 * would fail a build. So they are asserted directly.
 */

const ROUTES = ["/", "/en/villas/villa-thoi", "/en/the-estate", "/en/experiences", "/en/weddings"];

/*
 * Every script the HTML asks for, by its real attribute — not by guessing the
 * chunk path. `next start` serves `/_next/static/chunks/…` and Vercel serves
 * `/_next/static/immutable/chunks/…?dpl=…`; a pattern written for one finds
 * nothing on the other, and a guard that finds nothing passes. So this reads
 * `<script src>` and script preloads, and the caller asserts it found some.
 *
 * A preload is read whatever the order of its attributes. The first version
 * matched only `as` before `href`, and React writes the preloads it emits from
 * `ReactDOM.preload()` — `next/dynamic`'s, among them — as
 * `<link rel="preload" href="…" as="script" fetchPriority="low"/>`. So the
 * Framer chunk the footer preloaded on careers, the experiences and the 404
 * was never read, and a check over those routes passed on the build that
 * preloaded it (D-028, measured on the build of 0344ad3).
 */
async function scriptsOf(request: import("@playwright/test").APIRequestContext, html: string) {
  const preloads = [...html.matchAll(/<link\b[^>]*>/g)]
    .map((m) => m[0])
    .filter((tag) => /\bas="script"/.test(tag))
    .map((tag) => /\bhref="([^"]+)"/.exec(tag));
  const urls = [
    ...new Set(
      [...html.matchAll(/<script[^>]*\bsrc="([^"]+)"/g), ...preloads].map((m) => (m?.[1] ?? "").replace(/&amp;/g, "&")).filter(Boolean)
    ),
  ];
  return Promise.all(
    urls.map(async (u) => {
      const res = await request.get(u);
      return { url: u, ok: res.ok(), body: await res.text() };
    })
  );
}

/*
 * FRAMER, BY A SIGNATURE THAT SURVIVES MINIFICATION. The built chunk carries
 * none of the names a reader would search for — no "framer-motion", no
 * `MotionConfigContext` — but it does carry these three property names
 * together (the tranche-thirteen reveal record, `qa/perf/REVEAL-tranche13.md`
 * §7). Calibrated on the build of 0344ad3: of every file under
 * `.next/static`, only the Framer chunk (119,917 B) holds all three; one other
 * chunk holds `transformPerspective` alone. The older markers stay as well:
 * either form is Framer.
 *
 * A HOOK-ONLY IMPORT carries none of the three: `useReducedMotion` alone ships
 * a small Framer module. That module queries the bare media feature,
 * `matchMedia("(prefers-reduced-motion)")` (motion-dom's
 * `initPrefersReducedMotion`), a string this site never writes — its own
 * queries all end in `: reduce)` or `: no-preference)`. So the quoted bare
 * query is Framer too.
 */
const FRAMER_LITERALS = ["transformPerspective", "originX", "pathLength"];
const FRAMER_REDUCED_MOTION_QUERY = /["'`]\(prefers-reduced-motion\)["'`]/;
const isFramer = (body: string) =>
  /framerAppearId|MotionConfigContext|You have Reduced Motion enabled/.test(body) ||
  FRAMER_REDUCED_MOTION_QUERY.test(body) ||
  FRAMER_LITERALS.every((literal) => body.includes(literal));

/** Framer's three literals spread over a route's scripts: a bundler that split the chunk would hide it from `isFramer`. */
const framerAcross = (bodies: string[]) => FRAMER_LITERALS.every((literal) => bodies.some((b) => b.includes(literal)));

/*
 * EVERY PUBLIC TEMPLATE LOADS NO FRAMER — not as a script, and not as a script
 * preload (D-028). The preload is how it survived D-026: `SiteFooter`'s clause
 * sat behind `next/dynamic`, whose server render calls `ReactDOM.preload()` for
 * the chunk, so careers, terms, contact, the gallery, the experiences and the
 * 404 all fetched 120 kB of Framer at low priority for a clause that never
 * animated. The clause is plain server markup now, the hero tail is CSS, the
 * inventory switch is a Web Animation and the ledger has its own observer.
 * `/` has its own test below, with Lenis.
 *
 * Falsified on 2026-09-18, each mutation proven present in the build it ran on:
 * `motion` imported into `Inventory` → red at "loads framer-motion" on the
 * estate, the five villas and weddings, green on the other nine routes and on
 * `/`. Then the hook-only import the earlier runs found a limit with: with
 * `useReducedMotion` alone in `Inventory`, that build held the three literals
 * nowhere (transformPerspective 1, originX 0, pathLength 0) and the bare
 * quoted `(prefers-reduced-motion)` query in three chunks — red on the same
 * seven templates through that literal alone, careers still green at 599,878 B
 * of initial scripts. On 2026-09-17, the footer's old `next/dynamic` import of
 * a Framer component restored → red on every route with the footer and on the
 * 404, through the preload alone, with `/` and the styleguide green.
 */
const NO_FRAMER = [
  "/en/careers",
  "/en/terms",
  "/en/contact",
  "/en/gallery",
  "/en/experiences",
  "/en/experiences/boat-trip",
  "/en/location",
  "/en/the-estate",
  "/en/villas/villa-thoi",
  "/en/villas/villa-persi",
  "/en/villas/villa-eeanthe",
  "/en/villas/villa-melia",
  "/en/villas/villa-pueblo",
  "/en/weddings",
  "/styleguide",
  "/en/no-such-page-perf-structure",
];

test.describe("performance structure", () => {
  for (const route of NO_FRAMER) {
    test(`${route} loads no framer-motion, as a script or as a script preload`, async ({ request }) => {
      const res = await request.get(route);
      expect(res.status(), `${route} did not answer as expected`).toBe(route.includes("no-such-page") ? 404 : 200);
      const scripts = await scriptsOf(request, await res.text());
      expect(scripts.length, "no scripts found in the HTML — the pattern is wrong, not the page clean").toBeGreaterThan(0);
      expect(scripts.filter((s) => !s.ok).map((s) => s.url), "scripts that did not load").toEqual([]);
      expect(
        scripts.filter((s) => isFramer(s.body)).map((s) => s.url),
        `${route} loads framer-motion`
      ).toEqual([]);
      expect(
        framerAcross(scripts.map((s) => s.body)),
        `${route} loads framer-motion split across chunks: its scripts together hold ${FRAMER_LITERALS.join(", ")}`
      ).toBe(false);
    });
  }

  /*
   * THE CLAUSE STAYS A SERVER MODULE THAT IMPORTS NOTHING THAT RUNS IN A
   * BROWSER (D-028). The footer imports `Clause`, and the root 404 renders the
   * footer, so anything `Clause.tsx` imports can reach every page's scripts —
   * rendered or not: an interim build that imported a Framer component from
   * here put Framer into the initial scripts of careers, terms, contact, the
   * gallery, the experiences, location and the 404. The Framer checks above
   * would see that one; a client import of anything else would ship silently.
   * So the source is read: no "use client", no dynamic import, and no import
   * but `@/lib/clause` and React TYPES — and `@/lib/clause` itself imports
   * nothing.
   */
  test("the Clause imports nothing that could ship a script to every page with a footer", () => {
    const code = (rel: string) =>
      fs
        .readFileSync(path.join(process.cwd(), ...rel.split("/")), "utf-8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
    const clause = code("src/components/ui/Clause.tsx");
    expect(clause, "Clause.tsx could not be read, or is empty").toContain("export function Clause");
    expect(clause, "Clause.tsx is a client module").not.toMatch(/^\s*["']use client["']/m);
    expect(clause, "Clause.tsx loads a module at run time").not.toMatch(/\bimport\s*\(|\brequire\s*\(/);
    expect(clause, "Clause.tsx has a side-effect import").not.toMatch(/^\s*import\s+["']/m);

    const imports = [...clause.matchAll(/^\s*import\s+(type\s+)?[^;]*?\sfrom\s+["']([^"']+)["']/gm)].map((m) => ({
      typeOnly: Boolean(m[1]),
      from: m[2] ?? "",
    }));
    expect(imports.length, "no import was read from Clause.tsx — the pattern is wrong, not the file clean").toBeGreaterThan(0);
    expect(
      imports.filter((i) => !(i.from === "@/lib/clause" || (i.from === "react" && i.typeOnly))).map((i) => i.from),
      "Clause.tsx imports a module other than @/lib/clause and React types"
    ).toEqual([]);

    const lib = code("src/lib/clause.ts");
    expect(lib, "src/lib/clause.ts could not be read, or is empty").toContain("export function assertClause");
    expect(lib, "src/lib/clause.ts is a client module").not.toMatch(/["']use client["']/);
    expect(lib, "src/lib/clause.ts imports a module, which then reaches every page with a footer").not.toMatch(
      /^\s*import\s|\bimport\s*\(|\brequire\s*\(/m
    );
  });

  for (const route of ROUTES) {
    test(`${route} streams its page in place, not inside a hidden Suspense segment`, async ({ request }) => {
      const html = await (await request.get(route)).text();
      /* A root loading boundary serves the fallback first and the whole page
         in `<div hidden id="S:0">`, moved into place by script in one long
         task — measured at 250–340 ms on the phone profile. */
      expect(html).not.toMatch(/<div hidden id="S:\d+"/);
      expect(html).not.toContain("d-loading");
    });
  }

  test("the Direction F homepage loads neither framer-motion nor Lenis up front", async ({ request }) => {
    const html = await (await request.get("/")).text();
    const scripts = await scriptsOf(request, html);
    /* A check over zero scripts proves nothing, so it cannot pass. */
    expect(scripts.length, "no scripts found in the HTML — the pattern is wrong, not the page clean").toBeGreaterThan(0);
    expect(scripts.filter((s) => !s.ok).map((s) => s.url), "scripts that did not load").toEqual([]);
    const framer = scripts.filter((s) => isFramer(s.body));
    const lenis = scripts.filter((s) => /\blenis\b/i.test(s.body));
    expect(framer.map((s) => s.url), "framer-motion reached / through the root 404 tree").toEqual([]);
    expect(framerAcross(scripts.map((s) => s.body)), "framer-motion reached /, split across chunks").toBe(false);
    expect(lenis.map((s) => s.url), "Lenis is statically imported again").toEqual([]);
  });

  test("Lenis still arrives where it runs: a fine pointer, motion allowed", async ({ page }) => {
    await page.goto("/en/villas/villa-thoi");
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains("lenis")), { timeout: 10_000 }).toBe(true);
  });

  test.describe("under reduced motion", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });
    test("Lenis is never fetched", async ({ page }) => {
      const fetched: string[] = [];
      page.on("response", async (r) => {
        if (r.request().resourceType() !== "script") return;
        const body = await r.text().catch(() => "");
        if (/\blenis\b/i.test(body)) fetched.push(r.url());
      });
      await page.goto("/en/villas/villa-thoi", { waitUntil: "load" });
      await page.waitForTimeout(1500);
      expect(fetched).toEqual([]);
    });
  });
});
