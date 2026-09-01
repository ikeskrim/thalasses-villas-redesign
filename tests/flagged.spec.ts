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
