import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

/**
 * THE FACT SHEETS ARE CURRENT, AND THEY AGREE WITH THE REGISTRY.
 *
 * A PDF is the worst place for a stale fact. Nobody re-reads one after it is
 * made, it leaves the site the moment a guest forwards it, and it carries an
 * air of authority that a web page does not — so a fact sheet still claiming
 * last month's bathroom count is a claim about a real property, in writing,
 * circulating with no way to correct it.
 *
 * The sheets are generated locally (`npm run factsheets`) rather than at build
 * time, because they render through Playwright and Vercel's build image has no
 * browsers — running it in the build would work here and fail where it counts.
 * That makes them committed artefacts, which makes staleness possible, which is
 * why this exists.
 *
 * The text is extracted from the PDF itself rather than from the generator's
 * inputs. A generator asserting against its own inputs proves only that it is
 * self-consistent; reading the file back proves the number a guest will see.
 */
const ROOT = process.cwd();
const SHEETS = path.join(ROOT, "public", "factsheets");
const CONTENT = path.join(ROOT, "content");

const VILLAS: [key: string, slug: string, name: string][] = [
  ["200", "villa-thoi", "Villa Thoi"],
  ["201", "villa-persi", "Villa Persi"],
  ["202", "villa-eeanthe", "Villa Eeanthe"],
  ["203", "villa-melia", "Villa Melia"],
  ["pueblo", "villa-pueblo", "Villa Pueblo"],
];

/**
 * Text out of a PDF, without a parser dependency.
 *
 * Two things had to be learned the hard way here, and both were the file not
 * being what the code assumed:
 *
 *   1. Chromium writes its content streams **Flate-compressed**, so a regex
 *      over the raw bytes recovers nothing and reports every sheet as empty.
 *      They have to be inflated first.
 *   2. It then writes the text as **hex-encoded glyph ids into a subset font** —
 *      `<0033> Tj`, not `(P) Tj`. `0033` is a position in an embedded font, not
 *      a character, so inflating alone still yields nothing readable.
 *
 * The bridge is the `/ToUnicode` CMap that the PDF embeds for exactly this
 * reason: it maps glyph ids back to characters. Parsing it is thirty lines and
 * it is what makes this test read *what a guest actually sees on the page*
 * rather than what the generator believes it wrote — which was the whole point
 * of reading the file back instead of asserting against the inputs.
 */
function toUnicodeMap(streams: string[]): Map<string, string> {
  const map = new Map<string, string>();
  const hexToStr = (h: string) =>
    (h.match(/.{4}/g) ?? []).map((c) => String.fromCharCode(parseInt(c, 16))).join("");

  for (const s of streams) {
    if (!s.includes("beginbfchar") && !s.includes("beginbfrange")) continue;

    for (const block of s.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
      for (const pair of block[1]!.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
        map.set(pair[1]!.toUpperCase(), hexToStr(pair[2]!));
      }
    }
    for (const block of s.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
      for (const row of block[1]!.matchAll(
        /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g
      )) {
        const lo = parseInt(row[1]!, 16);
        const hi = parseInt(row[2]!, 16);
        const base = parseInt(row[3]!, 16);
        for (let c = lo; c <= hi && c - lo < 512; c++) {
          map.set(c.toString(16).toUpperCase().padStart(4, "0"), String.fromCharCode(base + (c - lo)));
        }
      }
    }
  }
  return map;
}

function pdfText(file: string): string {
  const buf = fs.readFileSync(file);
  const out: string[] = [];
  const inflated: string[] = [];

  /* Walk every `stream … endstream` and inflate what inflates. */
  const marker = Buffer.from("stream");
  const endMarker = Buffer.from("endstream");
  let i = 0;
  for (;;) {
    const start = buf.indexOf(marker, i);
    if (start === -1) break;
    const end = buf.indexOf(endMarker, start);
    if (end === -1) break;
    let from = start + marker.length;
    /* Skip the EOL after `stream`, which may be CRLF or LF. */
    while (from < end && (buf[from] === 0x0d || buf[from] === 0x0a)) from++;
    const chunk = buf.subarray(from, end);
    i = end + endMarker.length;

    let text: string | null = null;
    try {
      text = zlib.inflateSync(chunk).toString("latin1");
    } catch {
      try {
        text = zlib.inflateRawSync(chunk).toString("latin1");
      } catch {
        text = null; /* an image or a font, not a content stream */
      }
    }
    if (!text) continue;
    inflated.push(text);
  }

  const cmap = toUnicodeMap(inflated);

  for (const text of inflated) {
    /* `<0033> Tj` — hex glyph ids into the subset font. */
    for (const m of text.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)) {
      const hex = m[1]!.toUpperCase();
      for (const code of hex.match(/.{4}/g) ?? []) out.push(cmap.get(code) ?? "");
    }
    /* `[ <0033> -12 <002C> ] TJ` — a kerned run. */
    for (const m of text.matchAll(/\[((?:[^[\]])*)\]\s*TJ/g)) {
      for (const sub of m[1]!.matchAll(/<([0-9A-Fa-f]+)>/g)) {
        const hex = sub[1]!.toUpperCase();
        for (const code of hex.match(/.{4}/g) ?? []) out.push(cmap.get(code) ?? "");
      }
    }
    /* And plain literals, for any run Chromium did not subset. */
    for (const m of text.matchAll(/\(((?:\\.|[^()\\])*)\)\s*Tj/g)) {
      out.push(m[1]!.replace(/\\([()\\])/g, "$1"));
    }
  }
  return out.join("").replace(/\s+/g, " ");
}

test.describe("villa fact sheets", () => {
  test("one sheet per villa, and none of them is heavy", () => {
    expect(fs.existsSync(SHEETS), "public/factsheets/ is missing — run `npm run factsheets`").toBe(true);

    let total = 0;
    for (const [, slug] of VILLAS) {
      const file = path.join(SHEETS, `${slug}.pdf`);
      expect(fs.existsSync(file), `${slug}.pdf is missing — run \`npm run factsheets\``).toBe(true);
      const size = fs.statSync(file).size;
      total += size;
      /*
       * A fact sheet is a thing people email. The first version embedded the
       * photographs at full resolution and produced 2 MB per villa for images
       * printed 46 mm tall.
       */
      expect(
        size,
        `${slug}.pdf is ${(size / 1024).toFixed(0)} KB — too heavy to email`
      ).toBeLessThan(600 * 1024);
      expect(size, `${slug}.pdf is suspiciously small`).toBeGreaterThan(20 * 1024);
    }
    expect(total / 1048576, "the sheets together are heavier than 3 MB").toBeLessThan(3);
  });

  for (const [key, slug, name] of VILLAS) {
    test(`${slug} — the sheet agrees with the registry`, () => {
      const text = pdfText(path.join(SHEETS, `${slug}.pdf`));
      expect(text.length, `no text recovered from ${slug}.pdf`).toBeGreaterThan(200);

      const v = JSON.parse(fs.readFileSync(path.join(CONTENT, "villas", `${key}.json`), "utf-8")) as {
        specs: Record<string, number | string | null>;
      };

      expect(text, `${slug}.pdf does not name the villa`).toContain(name);

      /* Every locked figure the sheet prints must be the registry's figure. */
      for (const field of ["bedrooms", "bathrooms", "maxGuests", "pools", "sizeSqm"] as const) {
        const value = v.specs[field];
        if (value == null) continue;
        expect(
          text,
          `${slug}.pdf: registry ${field} is ${value} and the sheet does not say so`
        ).toContain(String(value));
      }

      /* The booking path and the licence must survive onto paper. */
      expect(text, `${slug}.pdf carries no booking link`).toContain("reserve-online.net");
      expect(text, `${slug}.pdf omits the operating licence`).toContain("1041K91003163701");
    });
  }

  test("every sheet is reachable from its villa page", async ({ page, request }) => {
    for (const [, slug] of VILLAS) {
      await page.goto(`/en/villas/${slug}`, { waitUntil: "load" });
      const link = page.locator(`a[href="/factsheets/${slug}.pdf"]`);
      expect(await link.count(), `/en/villas/${slug} does not link its fact sheet`).toBeGreaterThan(0);
      await expect(link.first()).toHaveAttribute("download", "");

      const res = await request.get(`/factsheets/${slug}.pdf`);
      expect(res.status(), `/factsheets/${slug}.pdf does not serve`).toBe(200);
      expect(res.headers()["content-type"]).toContain("pdf");
    }
  });

  test("no Greek sheet exists while the Greek corpus is a draft", async () => {
    /*
     * A PDF escapes a staging environment more easily than a page does, because
     * people forward it. The Greek corpus is `copyStatus: "draft"` and `/el` is
     * unpublished, so a Greek fact sheet would publish draft copy through a
     * side door.
     */
    const { PUBLISHED_LOCALES } = await import("../src/lib/locale");
    const elPublished = (PUBLISHED_LOCALES as readonly string[]).includes("el");
    const greek = fs.existsSync(SHEETS)
      ? fs.readdirSync(SHEETS).filter((f) => f.includes(".el.") || f.startsWith("el-"))
      : [];
    if (!elPublished) {
      expect(greek, "Greek fact sheets exist while the corpus is still a draft").toEqual([]);
    }
  });
});
