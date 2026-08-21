import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * THE CERTIFICATE MUST NOT GO STALE.
 *
 * `PARITY-CERTIFICATE.md` is generated, and a generated document that nobody
 * regenerates is worse than a hand-written one: it carries the authority of a
 * measurement and the accuracy of a memory. Add an experience, delete a
 * photograph, close a redirect gap, and the committed certificate keeps
 * asserting yesterday's numbers with a straight face.
 *
 * So the counts are recomputed here from the same inputs and checked against
 * the committed text. Only the domains that need no server are checked — the
 * registry-coverage row requires a rendered page and belongs to
 * `npm run coverage` — which is stated rather than quietly skipped, because a
 * guard that covers four of six rows while looking like it covers six is the
 * failure mode this project keeps meeting (CONVENTIONS §18).
 */
const ROOT = process.cwd();
const CONTENT = path.join(ROOT, "content");
const CERT = path.join(ROOT, "PARITY-CERTIFICATE.md");

function countDir(dir: string, ext: string) {
  return fs.readdirSync(dir).filter((f) => f.endsWith(ext)).length;
}

test.describe("parity certificate", () => {
  test("it exists and names its generator", () => {
    expect(fs.existsSync(CERT), "PARITY-CERTIFICATE.md is missing — run `npm run parity`").toBe(true);
    const md = fs.readFileSync(CERT, "utf-8");
    expect(md).toContain("npm run parity");
    expect(md.length, "the certificate is suspiciously short").toBeGreaterThan(1200);
  });

  test("the server-free counts match the repository", () => {
    const md = fs.readFileSync(CERT, "utf-8");

    const villas = countDir(path.join(CONTENT, "villas"), ".json");
    const experiences = countDir(path.join(CONTENT, "experiences"), ".json");
    const texts = countDir(path.join(CONTENT, "text"), ".txt");
    const pool = fs.readdirSync(path.join(ROOT, "public", "images", "_pool")).length;
    const chh = fs.readdirSync(path.join(ROOT, "public", "images", "_chh")).length;
    const redirects = (
      JSON.parse(
        fs.readFileSync(path.join(ROOT, "src", "generated", "redirects.json"), "utf-8")
      ) as { redirects: unknown[] }
    ).redirects.length;
    const gaps = (
      JSON.parse(fs.readFileSync(path.join(CONTENT, "redirect-gaps.json"), "utf-8")) as {
        gaps?: unknown[];
      }
    ).gaps?.length ?? 0;

    /* Sanity: if any of these read zero the assertions below are vacuous. */
    for (const [name, n] of [
      ["villas", villas],
      ["experiences", experiences],
      ["texts", texts],
      ["photographs", pool + chh],
      ["redirects", redirects],
    ] as const) {
      expect(n, `${name} counted 0 — this test is not looking at anything`).toBeGreaterThan(0);
    }

    const rows: [label: string, row: string][] = [
      ["Villas and venues", `| Villas and venues | ${villas} | ${villas} |`],
      ["Experiences", `| Experiences | ${experiences} | ${experiences} |`],
      ["Legacy text captures", `| Legacy text captures | ${texts} | ${texts} |`],
      ["Photography", `| Photography | ${pool + chh} | ${pool + chh} |`],
      ["Legacy URLs", `| Legacy URLs | ${redirects - gaps} | ${redirects} |`],
    ];

    for (const [label, row] of rows) {
      expect(
        md,
        `the certificate's "${label}" row is stale — expected "${row}". Run \`npm run parity\`.`
      ).toContain(row);
    }
  });

  test("it refuses to report a single flattering percentage", () => {
    /*
     * The first draft summed every domain and led with "94.8%". 862 of those
     * items are photographs, so the aggregate could not get worse when a
     * redirect broke. The caveat is load-bearing and this asserts it survives
     * a future edit.
     */
    const md = fs.readFileSync(CERT, "utf-8");
    expect(md).toContain("There is no single overall percentage here on purpose");
    expect(md).toContain("domains complete");
  });

  test("every shortfall is named rather than counted", () => {
    const md = fs.readFileSync(CERT, "utf-8");
    const header = /### (\d+) shortfalls, every one named/.exec(md);
    if (!header) {
      expect(md, "no shortfall section and no statement that there are none").toContain(
        "**No shortfalls.**"
      );
      return;
    }
    const declared = Number(header[1]);
    const listed = (md.slice(header.index).match(/^- /gm) ?? []).length;
    expect(
      listed,
      `the certificate declares ${declared} shortfalls and lists ${listed}`
    ).toBeGreaterThanOrEqual(declared);
  });
});
