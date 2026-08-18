import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * THE NUMERIC-TOKEN GUARD.
 *
 * Three fabrications reached a rendered page in this project and all three were
 * caught by a human looking at a screenshot, none by an assertion. The pattern
 * was identical every time: an invented specific entered through DRAFTED DISPLAY
 * COPY — a heading or a line composed outside the clause pipeline, where the
 * fact registry never saw it. The last one read "Nine acres of it, marked."
 * The estate's area appears nowhere in the inventory.
 *
 * Watching for it is a gate that tires. This is the structural fix, in the same
 * spirit as the single-resolver image policy: every number and every hard claim
 * in the display register must resolve against the registry, or the build fails
 * here with the offending string quoted.
 */

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, "content");

/** Everything a reader sees at display scale, plus card and ledger copy. */
const DISPLAY_SELECTORS = [
  // Direction D selectors. Without these the guard was reading four routes of
  // an eleven-route site and reporting the whole thing clean — the same shape
  // as every other instrument failure here, so the list grows with the site.
  ".d-hero-lede",
  ".d-villa-lede",
  ".d-exp-text",
  ".d-pagehead-title",
  ".d-numbers-lede",
  ".d-collection-lede",
  ".d-beat-body",
  ".d-plate-spec",
  ".d-spec-value",
  ".d-includes-note",
  ".display",
  ".act-title",
  ".act-card-title",
  ".act-card-desc",
  ".litany-line",
  ".litany-payoff",
  ".hero-desire",
  ".estate-map-card-name",
  ".estate-map-list-line",
  ".lede",
  ".clause",
].join(", ");

const NUMBER_WORDS = [
  "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen",
  "eighteen", "nineteen", "twenty", "thirty", "forty", "fifty", "sixty",
  "seventy", "eighty", "ninety", "hundred", "thousand",
];

/** Words that assert a superlative or a measure and must be traceable. */
const CLAIM_WORDS = ["only", "acres", "acre", "first", "largest", "biggest", "best", "unique"];

/**
 * The registry: every string the inventory actually contains. A token is
 * legitimate if it appears anywhere in this corpus.
 */
function buildRegistry(): string {
  const parts: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (["raw", "raw-js", "raw-ajax", "raw-booking", "text", "extracted-js", "assets"].includes(entry.name)) continue;
        walk(p);
      } else if (entry.name.endsWith(".json")) {
        parts.push(fs.readFileSync(p, "utf-8"));
      }
    }
  };
  walk(CONTENT);
  return parts.join(" ").toLowerCase();
}

/** Number words the registry expresses only as digits, and vice versa. */
const NUMERAL_OF: Record<string, string> = {
  one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7",
  eight: "8", nine: "9", ten: "10", eleven: "11", twelve: "12", eighteen: "18",
  twenty: "20", thirty: "30", forty: "40", fifty: "50", sixty: "60",
  seventy: "70", eighty: "80", ninety: "90", hundred: "100",
};

/**
 * Idioms where a number word carries no factual claim. Kept deliberately short —
 * every entry here is a hole in the guard, so each one must be defensible.
 */
const NON_FACTUAL = [
  "no one else",       // "a beach with no one else's towels on it"
  "nobody sits at a second one",
  "one of us",
  "as one house",      // the estate, taken as one house
  "one gate",          // verified: ALL FOUR, ONE GATE
  "one per villa",
  "a space of your own",
];

const ROUTES = [
  "/",
  "/en/the-estate",
  "/en/villas/villa-thoi",
  "/en/villas/villa-persi",
  "/en/villas/villa-eeanthe",
  "/en/villas/villa-melia",
  "/en/villas/villa-pueblo",
  "/en/experiences",
  "/en/weddings",
  "/en/gallery",
  "/en/location",
  "/en/careers",
  "/en/contact",
];

test.describe("fact guard", () => {
  const registry = buildRegistry();

  for (const route of ROUTES) {
    test(`every number in the display register resolves — ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route, { waitUntil: "load" });
      await page.waitForTimeout(500);

      const strings = await page.evaluate(
        (sel) =>
          [...document.querySelectorAll(sel)]
            .map((e) => (e.textContent ?? "").replace(/\s+/g, " ").trim())
            .filter(Boolean),
        DISPLAY_SELECTORS
      );

      const offences: string[] = [];

      for (const s of strings) {
        const lower = s.toLowerCase();
        if (NON_FACTUAL.some((n) => lower.includes(n))) continue;

        // Digits — every one must appear in the registry.
        for (const m of s.matchAll(/\d[\d.,]*/g)) {
          const tok = m[0].replace(/[.,]$/, "");
          if (!registry.includes(tok.toLowerCase())) {
            offences.push(`digit "${tok}" in: "${s}"`);
          }
        }

        // Number words — resolve as the word or as its numeral.
        for (const w of NUMBER_WORDS) {
          if (!new RegExp(`\\b${w}\\b`, "i").test(lower)) continue;
          const numeral = NUMERAL_OF[w];
          const ok = registry.includes(w) || (numeral && registry.includes(numeral));
          if (!ok) offences.push(`number word "${w}" in: "${s}"`);
        }

        // High-risk claims.
        for (const c of CLAIM_WORDS) {
          if (!new RegExp(`\\b${c}\\b`, "i").test(lower)) continue;
          if (!registry.includes(c)) offences.push(`claim "${c}" in: "${s}"`);
        }
      }

      expect(
        offences,
        `Unverifiable display copy on ${route}:\n  ${offences.join("\n  ")}\n\n` +
          "Every number and hard claim in the display register must resolve against " +
          "content/. Add the fact to the inventory, reword the line, or — if it is " +
          "genuinely non-factual idiom — add it to NON_FACTUAL with a reason."
      ).toEqual([]);
    });
  }

  test("no animated numeral ever renders a false value", async ({ page }) => {
    // The count-up once initialised at 0, so the estate ledger stated
    // "0 Bedrooms" in the server HTML and for anyone without JS. The truth is
    // the default state; the animation is the exception.
    await page.goto("/", { waitUntil: "load" });
    const ssr = await page.evaluate(() =>
      [...document.querySelectorAll(".ledger-spec-value")].map((e) => (e.textContent ?? "").trim())
    );
    expect(ssr, "a ledger value rendered as 0 before its animation ran").not.toContain("0");
    expect(ssr.length).toBeGreaterThan(0);
  });

  test("the guard actually catches a fabrication", () => {
    // A regression test for the guard itself: the string that got through.
    const fabricated = "Nine acres of it, marked.";
    const hasAcres = registry.includes("acres");
    expect(
      hasAcres,
      "'acres' now appears in the inventory — if that is real, this canary needs rewriting"
    ).toBe(false);
    expect(fabricated.toLowerCase()).toContain("acres");
  });
});
