import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * NO UNLOGGED NON-PROPERTY PHOTOGRAPHY.
 *
 * This rebuild exists because the site it replaces used stock photographs of
 * places that were not Thalasses, and the owner found out. The grading pass
 * finally made that detectable — it knew which frames looked bought-in, the site
 * knew which frames it rendered, and nothing had ever put the two facts in the
 * same room. The answer was fourteen, live on `/` and `/en/experiences`.
 *
 * **THE OWNER HAS SINCE RULED**, and this test changed shape with the ruling.
 * Non-property representational imagery is now permitted on experience cards —
 * own frames first, otherwise properly licensed stock, one log line per frame.
 * The rule is `content/image-sources.md` (Tier B-Experiences); the log is
 * `content/experience-imagery.json`.
 *
 * So the question is no longer "is this frame stock" — stock is allowed in one
 * place now. It is **"is this frame accounted for"**:
 *
 *   1. Every non-property frame the site renders must appear in the log. An
 *      unlogged one fails. That is the ratchet: the list shrinks as licences are
 *      produced, and it cannot widen by accident.
 *   2. A frame marked `withdrawn` must not render at all. Two are out on brand
 *      grounds rather than paperwork, and a licence does not bring them back.
 *
 * Nothing is deleted by this test. Which photographs represent the property is
 * the owner's call; this only holds the site to the rule he wrote.
 */

const ROOT = process.cwd();
const LOG = path.join(ROOT, "content", "experience-imagery.json");
const GRADES = path.join(ROOT, "content", "photo-grades.json");

const ROUTES = [
  "/",
  "/en/the-estate",
  "/en/villas/villa-thoi",
  "/en/villas/villa-persi",
  "/en/villas/villa-eeanthe",
  "/en/villas/villa-melia",
  "/en/villas/villa-pueblo",
  "/en/gallery",
  "/en/experiences",
  "/en/weddings",
  "/en/location",
];

/** Flags that assert the frame is not this property. */
const HARD = new Set(["stock", "public-place", "different-property"]);

/** next/image rewrites src to `/_next/image?url=…` — unwrap to the real path. */
const REAL_SRCS = () =>
  [...document.querySelectorAll("img")].map((i) => {
    const s = i.getAttribute("src") ?? "";
    const m = /url=([^&]+)/.exec(s);
    return m?.[1] ? decodeURIComponent(m[1]) : s;
  });

async function rendered(page: import("@playwright/test").Page, route: string) {
  await page.goto(route, { waitUntil: "load" });
  const total = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y <= total; y += 800) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(30);
  }
  return new Set(await page.evaluate(REAL_SRCS));
}

test.describe("non-property photography", () => {
  test("every non-property frame the site renders is in the imagery log", async ({ page }) => {
    test.skip(!fs.existsSync(GRADES), "no grading pass in this checkout");

    const grades = JSON.parse(fs.readFileSync(GRADES, "utf-8")) as {
      frames: { path: string; flag: string | null; subject: string; flagReason: string | null }[];
    };
    const flagged = new Map(
      grades.frames.filter((f) => f.flag && HARD.has(f.flag)).map((f) => [f.path, f])
    );
    expect(flagged.size, "the grading pass flagged nothing — this test is checking nothing").toBeGreaterThan(0);

    const log = JSON.parse(fs.readFileSync(LOG, "utf-8")) as {
      inherited: { src: string; status: string }[];
    };
    const logged = new Set(log.inherited.map((f) => f.src));

    const found = new Map<string, string[]>();
    for (const route of ROUTES) {
      for (const s of await rendered(page, route)) {
        if (!flagged.has(s) || logged.has(s)) continue;
        const seen = found.get(s) ?? [];
        seen.push(route);
        found.set(s, seen);
      }
    }

    const lines = [...found].map(([src, routes]) => {
      const f = flagged.get(src)!;
      return `  [${f.flag}] ${f.subject}\n      ${src}\n      on ${routes.join(", ")}`;
    });

    expect(
      lines,
      `A non-property photograph is on the site and is not in the imagery log:\n${lines.join("\n")}\n\n` +
        `Tier B-Experiences permits licensed stock on experience cards, but only with a log ` +
        `line naming its file, source and licence. Add it to content/experience-imagery.json — ` +
        `or take the frame off the page.`
    ).toEqual([]);
  });

  test("a withdrawn frame never renders again", async ({ page }) => {
    /*
     * Two frames are out on brand grounds rather than paperwork: a quad bike in
     * birch woodland that is not Crete, and a composited wine still life. A
     * licence does not bring either back.
     *
     * Blocked in `src/lib/content.ts`, at the one function every component
     * resolves an image through — "off the site" has to mean off the site, and
     * a per-component filter is one forgotten component away from undoing it.
     */
    const log = JSON.parse(fs.readFileSync(LOG, "utf-8")) as {
      inherited: { src: string; status: string; subject: string }[];
    };
    const withdrawn = log.inherited.filter((f) => f.status === "withdrawn");
    expect(withdrawn.length, "nothing is withdrawn — this test is checking nothing").toBeGreaterThan(0);

    const seen: string[] = [];
    for (const route of ROUTES) {
      const srcs = await rendered(page, route);
      for (const w of withdrawn) if (srcs.has(w.src)) seen.push(`${w.subject} — on ${route}`);
    }
    expect(seen, "a withdrawn frame is rendering again").toEqual([]);
  });

  test("the imagery log agrees with the grading pass it records", () => {
    /*
     * A log is a place things get hidden. This asserts every inherited entry is
     * a frame the grading actually flagged, so the file cannot become a way to
     * launder a photograph by writing its name down — and that every entry
     * carries the three fields the rule demands.
     */
    const grades = JSON.parse(fs.readFileSync(GRADES, "utf-8")) as {
      frames: { path: string; flag: string | null }[];
    };
    const flagged = new Set(grades.frames.filter((f) => f.flag).map((f) => f.path));
    const log = JSON.parse(fs.readFileSync(LOG, "utf-8")) as {
      inherited: { src: string; licence: string; source: string }[];
      experiences: Record<string, { status: string; src?: string; licence?: string }>;
    };

    expect(
      log.inherited.filter((f) => !flagged.has(f.src)).map((f) => f.src),
      "the log names frames the grading pass never flagged"
    ).toEqual([]);

    for (const f of log.inherited) {
      expect(f.source, `${f.src} has no source`).toBeTruthy();
      expect(f.licence, `${f.src} has no licence field`).toBeTruthy();
    }

    for (const [slug, v] of Object.entries(log.experiences)) {
      if (v.status !== "cleared") continue;
      expect(v.src, `${slug} is cleared with no frame`).toBeTruthy();
      expect(v.licence, `${slug} is cleared with no licence`).toBeTruthy();
    }
  });
});

/**
 * SOURCED STOCK — the structural half of the ratchet.
 *
 * The tests above were written for the fourteen INHERITED frames, and they
 * know which frames are non-property because the grading pass flagged them.
 * A frame sourced from Pexels or Unsplash tomorrow is in no grading pass, so
 * "every non-property frame the site renders is in the log" could not see it:
 * an unlogged stock file would have rendered and passed. Which is exactly the
 * hole the owner's ruling says must not exist.
 *
 * So stock has its own store, `public/images/_stock/`, and membership of that
 * store is the fact these tests hold the site to — no grader's judgement
 * required. Everything in it is logged with a licence; everything logged is on
 * disk; it renders only where Tier B-Experiences permits; it carries no shared
 * treatment; and the inherited pending-licence frames render nowhere at all,
 * including the twenty-one detail pages the original route list never visited.
 */
const STOCK_DIR = path.join(ROOT, "public", "images", "_stock");
const STOCK_LOG = path.join(ROOT, "content", "experience-stock.json");

/** Every experience detail page, derived from the registry rather than typed. */
const DETAIL_ROUTES = fs
  .readdirSync(path.join(ROOT, "content", "experiences"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(ROOT, "content", "experiences", f), "utf-8")).slug as string)
  .map((slug) => `/en/experiences/${slug}`);

/** Tier A contexts: a stock frame has no business anywhere on these. */
const TIER_A_ROUTES = ROUTES.filter((r) => r !== "/" && r !== "/en/experiences");

type StockEntry = {
  file: string;
  sourceUrl: string;
  licence: string;
  photographer: string;
  retrieved: string;
  alt: string;
};

function stockLog(): Record<string, StockEntry> {
  if (!fs.existsSync(STOCK_LOG)) return {};
  return (JSON.parse(fs.readFileSync(STOCK_LOG, "utf-8")) as { frames: Record<string, StockEntry> }).frames;
}

test.describe("sourced stock under Tier B-Experiences", () => {
  test("every stock file on disk is logged, and every logged frame is on disk", () => {
    const onDisk = fs.existsSync(STOCK_DIR) ? fs.readdirSync(STOCK_DIR).filter((f) => /\.(jpe?g|webp|png)$/i.test(f)) : [];
    const log = stockLog();
    const logged = new Set(Object.values(log).map((e) => e.file.split("/").pop()));

    const orphans = onDisk.filter((f) => !logged.has(f));
    expect(
      orphans,
      `stock files with no log line — a photograph nobody can name the licence of:\n  ${orphans.join("\n  ")}`
    ).toEqual([]);

    const phantoms = Object.entries(log).filter(([, e]) => !fs.existsSync(path.join(ROOT, "public", e.file)));
    expect(
      phantoms.map(([slug, e]) => `${slug} → ${e.file}`),
      "log lines naming files that do not exist"
    ).toEqual([]);

    for (const [slug, e] of Object.entries(log)) {
      for (const k of ["sourceUrl", "licence", "photographer", "retrieved", "alt"] as const) {
        expect(e[k], `${slug}: stock log entry has no ${k}`).toBeTruthy();
      }
      expect(
        /^https:\/\/(www\.)?(pexels\.com|unsplash\.com)\//.test(e.sourceUrl),
        `${slug}: source ${e.sourceUrl} is not one of the two permitted free-licence sources`
      ).toBe(true);
      expect(
        /free to use|pexels license|unsplash license/i.test(e.licence),
        `${slug}: licence "${e.licence}" is not a recorded free licence`
      ).toBe(true);
    }
  });

  test("a stock frame never renders in a Tier A context", async ({ page }) => {
    /*
     * Condition 6: never a villa page, never the estate, never the beach, never
     * a hero. On the homepage the only permitted host is an experience card.
     */
    const offenders: string[] = [];
    for (const route of TIER_A_ROUTES) {
      const srcs = await rendered(page, route);
      for (const s of srcs) if (s.startsWith("/images/_stock/")) offenders.push(`${s} on ${route}`);
    }
    await page.goto("/", { waitUntil: "load" });
    const outsideCards = await page.evaluate(() =>
      [...document.querySelectorAll("img")]
        .filter((i) => {
          const s = i.getAttribute("src") ?? "";
          const m = /url=([^&]+)/.exec(s);
          const real = m?.[1] ? decodeURIComponent(m[1]) : s;
          return real.startsWith("/images/_stock/") && !i.closest("#experiences .ho-card");
        })
        .map((i) => i.getAttribute("src") ?? "")
    );
    for (const s of outsideCards) offenders.push(`${s} on / outside an experience card`);
    expect(offenders, "Tier B-Experiences stock rendering in a Tier A context").toEqual([]);
  });

  test("a stock frame on a detail page is that experience's own, or a sibling card's", async ({ page }) => {
    const log = stockLog();
    const fileToSlug = new Map(Object.entries(log).map(([slug, e]) => [e.file, slug]));
    const problems: string[] = [];
    for (const route of DETAIL_ROUTES) {
      const slug = route.split("/").pop()!;
      await page.goto(route, { waitUntil: "load" });
      const found = await page.evaluate(() =>
        [...document.querySelectorAll("img")].map((i) => {
          const s = i.getAttribute("src") ?? "";
          const m = /url=([^&]+)/.exec(s);
          return {
            src: m?.[1] ? decodeURIComponent(m[1]) : s,
            inHero: !!i.closest(".d-exp-hero, .field"),
          };
        })
      );
      for (const f of found) {
        if (!f.src.startsWith("/images/_stock/")) continue;
        const owner = fileToSlug.get(f.src);
        if (!owner) problems.push(`${f.src} on ${route} is not in the stock log`);
        else if (f.inHero && owner !== slug) problems.push(`${route} hero shows ${owner}'s frame`);
      }
    }
    expect(problems).toEqual([]);
  });

  test("stock carries no shared treatment that blurs it into the property's own frames", async ({ page }) => {
    /*
     * Condition 7. A duotone, a grade, a blend mode applied to the card grid
     * would make bought-in frames read as Thalasses. Measured on the element
     * and every ancestor up to the card.
     */
    await page.goto("/", { waitUntil: "load" });
    const treated = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLImageElement>("#experiences .ho-card img")]
        .filter((i) => (i.getAttribute("src") ?? "").includes("_stock"))
        .map((i) => {
          let n: Element | null = i;
          const bad: string[] = [];
          while (n && !n.matches("#experiences")) {
            const cs = getComputedStyle(n);
            if (cs.filter !== "none") bad.push(`filter:${cs.filter}`);
            if (cs.mixBlendMode !== "normal") bad.push(`mix-blend-mode:${cs.mixBlendMode}`);
            if (cs.opacity !== "1" && n === i) bad.push(`opacity:${cs.opacity}`);
            n = n.parentElement;
          }
          return { src: i.getAttribute("src"), bad };
        })
        .filter((r) => r.bad.length)
    );
    expect(treated).toEqual([]);
  });

  test("a pending-licence frame renders nowhere — including every detail page", async ({ page }) => {
    /*
     * The ruling: the inherited frames do not come back until a licence is
     * produced. The original route list stopped at /en/experiences, and the
     * twenty-one detail pages underneath it were rendering twelve of them as
     * heroes. Logged is not licensed.
     */
    const log = JSON.parse(fs.readFileSync(LOG, "utf-8")) as {
      inherited: { src: string; status: string; subject: string }[];
    };
    const pending = log.inherited.filter((f) => f.status === "pending-licence");
    expect(pending.length, "nothing is pending — this test is checking nothing").toBeGreaterThan(0);
    const seen: string[] = [];
    for (const route of [...ROUTES, ...DETAIL_ROUTES]) {
      const srcs = await rendered(page, route);
      for (const p of pending) if (srcs.has(p.src)) seen.push(`${p.subject} — on ${route}`);
    }
    expect(seen, "an unlicensed inherited frame is rendering").toEqual([]);
  });
});
