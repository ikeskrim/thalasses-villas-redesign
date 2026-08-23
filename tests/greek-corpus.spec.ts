import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * THE GREEK CORPUS — asserted against the English, not against its own report.
 *
 * `content/el/RECONCILIATION.md` says the numerals are clean. It was written by
 * the process that produced the corpus, and a report from the thing being
 * checked is a claim, not a measurement (CONVENTIONS §18). So this re-derives
 * the answer from both sides, and it is the same logic `npm run verify:el`
 * runs — here so it cannot be skipped.
 *
 * The check that matters most is the numerals. Every figure on this site
 * resolves against the locked capacity table, and a translated numeral is a
 * broken one: 9 bedrooms must stay 9, 50 m must stay 50 m, 35€ must stay 35€,
 * and "72.8 km" must keep its DOT rather than becoming the Greek decimal comma.
 *
 * It has already caught a real defect that nothing else could. Descriptions
 * were keyed by featureId, and the same featureId carries DIFFERENT English in
 * different villa files — the estate says "4 Fully equipped kitchens" where a
 * villa says "Fully equipped kitchen". One Greek per featureId meant the estate
 * would have told a reader there was **one** kitchen. Fifteen such collisions,
 * all silent. The key is the English string now.
 */
const EL = path.join(process.cwd(), "content", "el");
const CONTENT = path.join(process.cwd(), "content");
const readJson = (...p: string[]) => JSON.parse(fs.readFileSync(path.join(...p), "utf-8"));

const FILES = [
  "experiences.json",
  "villas.json",
  "facilities.json",
  "villa-page-copy.json",
  "home.json",
  "pages.json",
  "terms.json",
  "chrome.json",
];

/** Figures in order, keeping the separator so "72.8" ≠ "72,8". */
const figures = (s: string) => s.match(/\d+(?:[.,]\d+)?/g) ?? [];

test.describe("Greek corpus", () => {
  test("every file exists, parses, and declares itself a draft", () => {
    for (const f of FILES) {
      const p = path.join(EL, f);
      expect(fs.existsSync(p), `${f} is missing`).toBe(true);
      const j = readJson(EL, f) as { copyStatus?: string; notes?: unknown[] };
      expect(j.copyStatus, `${f} does not declare copyStatus: "draft"`).toBe("draft");
      expect(
        Array.isArray(j.notes) && j.notes.length > 0,
        `${f} raised no notes — a large translation with nothing for the owner to rule on ` +
          `means the translator did not look`
      ).toBe(true);
    }
  });

  test("the terms are labelled a legal draft", () => {
    /*
     * The English terms name another company seven times and are already under
     * legal review. The Greek is a working text for a lawyer, not a
     * publishable translation, and it has to say so where anyone would look.
     */
    const j = readJson(EL, "terms.json") as { legalStatus?: string };
    expect(j.legalStatus ?? "").toContain("legal draft");
    expect(j.legalStatus ?? "").toContain("owner review");
  });

  test("no figure differs from its English source", () => {
    const problems: string[] = [];

    const compare = (where: string, en: string, el: string) => {
      const a = figures(en).join("|");
      const b = figures(el).join("|");
      if (a !== b) problems.push(`${where}\n      EN [${a}] vs EL [${b}]\n      ${el.slice(0, 70)}`);
    };

    /* experiences */
    const elExp = readJson(EL, "experiences.json").experiences as Record<
      string,
      Record<string, string>
    >;
    let checked = 0;
    for (const f of fs.readdirSync(path.join(CONTENT, "experiences")).filter((x) => x.endsWith(".json"))) {
      const e = readJson(CONTENT, "experiences", f) as Record<string, string>;
      const g = elExp[e.slug!];
      if (!g) continue;
      for (const k of ["name", "shortDescription", "longDescription"]) {
        if (e[k] && g[k]) {
          compare(`experiences ${e.slug}.${k}`, e[k]!, g[k]!);
          checked++;
        }
      }
    }

    /* villas */
    const elVillas = readJson(EL, "villas.json").villas as Record<string, Record<string, unknown>>;
    for (const key of ["200", "201", "202", "203", "pueblo", "2142", "rituals"]) {
      const s = readJson(CONTENT, "villas", `${key}.json`) as Record<string, unknown>;
      const g = elVillas[key];
      if (!g) continue;
      for (const k of ["tagline", "shortDescription", "longDescription"]) {
        const en = s[k] as string | null;
        const el = g[k] as string | undefined;
        if (en && el) {
          compare(`villas ${key}.${k}`, en, el);
          checked++;
        }
      }
      for (const k of ["policies", "amenityFacts"]) {
        const a = (s[k] as string[] | undefined) ?? [];
        const b = (g[k] as string[] | undefined) ?? [];
        for (let i = 0; i < Math.min(a.length, b.length); i++) {
          compare(`villas ${key}.${k}[${i}]`, a[i]!, b[i]!);
          checked++;
        }
      }
    }

    /* facilities — keyed by the English text */
    const elDescs = readJson(EL, "facilities.json").descriptions as Record<string, string>;
    const seen = new Set<string>();
    for (const f of fs.readdirSync(path.join(CONTENT, "facilities")).filter((x) => x.endsWith(".json"))) {
      const j = readJson(CONTENT, "facilities", f) as {
        tabs: { groups: { items: { description?: string; extraDescription?: string }[] }[] }[];
      };
      for (const t of j.tabs) {
        for (const gr of t.groups) {
          for (const i of gr.items) {
            for (const en of [i.description, i.extraDescription]) {
              if (!en || seen.has(en)) continue;
              seen.add(en);
              expect(elDescs[en], `no Greek for: ${en.slice(0, 60)}`).toBeTruthy();
              if (elDescs[en]) {
                compare(`facilities "${en.slice(0, 40)}"`, en, elDescs[en]!);
                checked++;
              }
            }
          }
        }
      }
    }

    /*
     * A floor, not a target. It exists to catch the check comparing NOTHING —
     * a pairing bug, a renamed key, an empty corpus — and it is set well below
     * the real count (148 at the time of writing) so it does not have to be
     * edited every time a sentence is added. A threshold that tracks the exact
     * number is a threshold someone eventually bumps without reading.
     */
    expect(checked, "nothing was compared — this test is not looking at anything").toBeGreaterThan(100);
    expect(problems, `figures differ from the English source:\n  ${problems.join("\n  ")}`).toEqual([]);
  });

  test("proper nouns survive translation", () => {
    const PROPER = [
      "Villa Thoi",
      "Villa Persi",
      "Villa Eeanthe",
      "Villa Melia",
      "Villa Pueblo",
      "Thalasses Rituals",
      "Thalasses Villas",
    ];
    const elVillas = readJson(EL, "villas.json").villas as Record<string, Record<string, string>>;
    const problems: string[] = [];
    for (const key of ["200", "201", "202", "203", "pueblo", "2142", "rituals"]) {
      const s = readJson(CONTENT, "villas", `${key}.json`) as Record<string, string>;
      const g = elVillas[key];
      if (!g) continue;
      for (const k of ["shortDescription", "longDescription", "tagline"]) {
        if (!s[k] || !g[k]) continue;
        for (const n of PROPER) {
          if (s[k]!.includes(n) && !g[k]!.includes(n)) problems.push(`villas ${key}.${k}: "${n}"`);
        }
      }
    }
    expect(problems, `proper nouns lost in translation:\n  ${problems.join("\n  ")}`).toEqual([]);
  });

  test("Greek capitals carry no accents, and the voice rules hold", () => {
    const BANNED = ["υπέροχ", "μαγευτικ", "παραδεισένι", "ονειρικ", "εκπληκτικ", "απαράμιλλ", "πολυτελέστατ"];
    const ACCENTED_CAPS = /[ΆΈΉΊΌΎΏ]/;
    const problems: string[] = [];

    const walk = (node: unknown, where: string) => {
      if (typeof node === "string") {
        for (const run of node.match(/[Ά-ώ\s]{4,}/g) ?? []) {
          const letters = run.replace(/\s/g, "");
          const allCaps = letters && letters === letters.toUpperCase() && /[Α-Ω]/.test(letters);
          if (allCaps && ACCENTED_CAPS.test(letters)) {
            problems.push(`${where}: accented capital in "${run.trim().slice(0, 30)}"`);
          }
        }
        const lower = node.toLowerCase();
        for (const b of BANNED) {
          if (lower.includes(b)) problems.push(`${where}: banned word "${b}"`);
        }
        return;
      }
      if (Array.isArray(node)) {
        node.forEach((v, i) => walk(v, `${where}[${i}]`));
        return;
      }
      if (node && typeof node === "object") {
        for (const [k, v] of Object.entries(node)) {
          if (k === "notes") continue; /* translator prose, not shipped copy */
          walk(v, `${where}.${k}`);
        }
      }
    };

    for (const f of FILES) walk(readJson(EL, f), f);
    expect(problems.slice(0, 15), `Greek style violations:\n  ${problems.join("\n  ")}`).toEqual([]);
  });

  test("every experience, villa and feature is covered", () => {
    const elExp = readJson(EL, "experiences.json").experiences as Record<string, unknown>;
    const slugs = fs
      .readdirSync(path.join(CONTENT, "experiences"))
      .filter((f) => f.endsWith(".json"))
      .map((f) => (readJson(CONTENT, "experiences", f) as { slug?: string }).slug)
      .filter(Boolean) as string[];
    expect(slugs.length).toBeGreaterThanOrEqual(21);
    expect(
      slugs.filter((s) => !elExp[s]),
      "experiences with no Greek"
    ).toEqual([]);

    const elVillas = readJson(EL, "villas.json").villas as Record<string, unknown>;
    expect(
      ["200", "201", "202", "203", "pueblo", "2142", "rituals"].filter((k) => !elVillas[k]),
      "villas with no Greek"
    ).toEqual([]);

    const elFeatures = readJson(EL, "facilities.json").features as Record<string, string>;
    const ids = new Set<string>();
    for (const f of fs.readdirSync(path.join(CONTENT, "facilities")).filter((x) => x.endsWith(".json"))) {
      const j = readJson(CONTENT, "facilities", f) as {
        tabs: { groups: { items: { featureId: number }[] }[] }[];
      };
      for (const t of j.tabs) for (const g of t.groups) for (const i of g.items) ids.add(String(i.featureId));
    }
    expect(ids.size).toBeGreaterThan(150);
    expect([...ids].filter((i) => !elFeatures[i]), "feature ids with no Greek").toEqual([]);
  });

  test("the corpus is not published, and the guard is what stops it", async () => {
    /*
     * The corpus exists; `/el` does not. `PUBLISHED_LOCALES` is the gate, and
     * `tests/locale.spec.ts` asserts an unpublished locale genuinely 404s. This
     * asserts the two agree — a corpus on disk must not be mistaken for a
     * shipped locale.
     */
    const { PUBLISHED_LOCALES } = await import("../src/lib/locale");
    expect(
      PUBLISHED_LOCALES as readonly string[],
      "el is marked published while the routes do not exist"
    ).not.toContain("el");
  });
});
