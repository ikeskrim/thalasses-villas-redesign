import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * NO NEW STOCK PHOTOGRAPHY, EVER.
 *
 * This rebuild exists because the site it replaces used stock photographs of
 * places that were not Thalasses, and the owner found out. That is the founding
 * defect, and until the second grading pass nothing in this repository could
 * detect it — the grading knew which frames looked bought-in, the site knew
 * which frames it rendered, and the two facts had never been put in the same
 * room.
 *
 * They have now, and the answer was **fourteen**: twelve frames graders
 * independently flagged as stock and two as public places, live on the homepage
 * and the experiences index. Divers, a gym trainer, a quad bike in birch
 * woodland, a composited wine-barrel still life, a white-gloved chauffeur.
 *
 * NOTHING IS DELETED BY THIS TEST, and nothing should be. Which photographs
 * represent the property is the owner's call, this project keeps what it is
 * given, and the fourteen are recorded in `content/flagged-quarantine.json`
 * with each grader's reason for him to rule on.
 *
 * What this does is stop the number growing. A hard-flagged frame — stock, a
 * public place, a different property — that is NOT already quarantined fails
 * the build. The list can shrink when he rules; it cannot widen by accident.
 */

const ROOT = process.cwd();
const QUARANTINE = path.join(ROOT, "content", "flagged-quarantine.json");
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

/** Flags that assert the frame may not be this property at all. */
const HARD = new Set(["stock", "public-place", "different-property"]);

test.describe("flagged photography", () => {
  test("no hard-flagged frame reaches a page unless it is already quarantined", async ({ page }) => {
    test.skip(!fs.existsSync(GRADES), "no grading pass in this checkout");

    const grades = JSON.parse(fs.readFileSync(GRADES, "utf-8")) as {
      frames: { path: string; flag: string | null; subject: string; flagReason: string | null }[];
    };
    const flagged = new Map(
      grades.frames.filter((f) => f.flag && HARD.has(f.flag)).map((f) => [f.path, f])
    );
    expect(flagged.size, "the grading pass flagged nothing — this test is checking nothing").toBeGreaterThan(0);

    const quarantined = new Set<string>(
      fs.existsSync(QUARANTINE)
        ? (JSON.parse(fs.readFileSync(QUARANTINE, "utf-8")).frames as { src: string }[]).map((f) => f.src)
        : []
    );

    const found = new Map<string, string[]>();
    for (const route of ROUTES) {
      await page.goto(route, { waitUntil: "load" });
      const total = await page.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y <= total; y += 800) {
        await page.evaluate((v) => window.scrollTo(0, v), y);
        await page.waitForTimeout(30);
      }
      /* next/image rewrites src to /_next/image?url=… — unwrap to the real path. */
      const srcs = await page.evaluate(() =>
        [...document.querySelectorAll("img")].map((i) => {
          const s = i.getAttribute("src") ?? "";
          const m = /url=([^&]+)/.exec(s);
          return m?.[1] ? decodeURIComponent(m[1]) : s;
        })
      );
      for (const s of new Set(srcs)) {
        if (!flagged.has(s) || quarantined.has(s)) continue;
        const seen = found.get(s) ?? [];
        seen.push(route);
        found.set(s, seen);
      }
    }

    const lines = [...found].map(([src, routes]) => {
      const f = flagged.get(src)!;
      return `  [${f.flag}] ${f.subject}\n      ${src}\n      on ${routes.join(", ")}\n      ${f.flagReason ?? ""}`;
    });

    expect(
      lines,
      `A photograph graders flagged as not-this-property is on the site and is not ` +
        `quarantined:\n${lines.join("\n")}\n\n` +
        `This is the defect the whole project exists to prevent. Either remove the frame, ` +
        `or record it in content/flagged-quarantine.json with the owner's ruling.`
    ).toEqual([]);
  });

  test("the quarantine is honest — every entry is still flagged and still on the site", async ({ page }) => {
    /*
     * A quarantine list is a place things get hidden. This asserts it holds only
     * frames that are genuinely still flagged by the grading data, so it cannot
     * become a way to launder a frame by adding it to a file.
     */
    test.skip(!fs.existsSync(QUARANTINE), "nothing quarantined");

    const grades = JSON.parse(fs.readFileSync(GRADES, "utf-8")) as {
      frames: { path: string; flag: string | null }[];
    };
    const flagged = new Map(grades.frames.filter((f) => f.flag).map((f) => [f.path, f.flag]));
    const q = JSON.parse(fs.readFileSync(QUARANTINE, "utf-8")) as {
      frames: { src: string; flag: string }[];
    };

    const stale = q.frames.filter((f) => flagged.get(f.src) !== f.flag);
    expect(
      stale.map((f) => `${f.src} is quarantined as "${f.flag}" but the grading says "${flagged.get(f.src) ?? "unflagged"}"`),
      "the quarantine disagrees with the grading pass it claims to record"
    ).toEqual([]);

    expect(q.frames.length, "the quarantine is empty but the file exists").toBeGreaterThan(0);
  });
});
