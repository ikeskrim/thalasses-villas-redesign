import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * THE OPENGRAPH CARDS — measured, not asserted.
 *
 * `src/lib/og.tsx` claims the veil is heavy enough that the worst photograph
 * still clears AA under the type. That is a claim about pixels, and the only
 * honest way to check a claim about pixels is to look at the pixels — so this
 * decodes every rendered card and computes the real contrast in the band the
 * copy sits in. (CONVENTIONS §16 — a fix you cannot falsify is not a fix.)
 *
 * It also checks the thing that is easiest to get wrong and hardest to notice:
 * that each page's `og:image` points at its OWN card rather than silently
 * inheriting the site-wide one. A per-route card nobody's metadata references
 * is a build artefact, not a feature.
 */

const CONTENT = path.join(process.cwd(), "content");

/** Direction D, and the same constant `src/lib/og.tsx` sets the display in. */
const LIMESTONE = { r: 0xe8, g: 0xe9, b: 0xe3 };

/** The card's own geometry, from `og.tsx`: 1200x630 with 68px of padding. */
const CARD_W = 1200;
const CARD_H = 630;
const PADDING = 68;

const VILLA_SLUGS = ["villa-thoi", "villa-persi", "villa-eeanthe", "villa-melia", "villa-pueblo"];

/**
 * Experience slugs are DERIVED from the registry, so a twenty-second experience
 * is covered by this test without an edit here. (CONVENTIONS §14.)
 */
function experienceSlugs(): string[] {
  const dir = path.join(CONTENT, "experiences");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")) as { slug?: string })
    .map((e) => e.slug)
    .filter((s): s is string => Boolean(s));
}

/** WCAG 2.x relative luminance from 8-bit sRGB. */
function luminance(r: number, g: number, b: number): number {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a: number, b: number): number {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

const TEXT_LUM = luminance(LIMESTONE.r, LIMESTONE.g, LIMESTONE.b);

/**
 * TWO MEASUREMENTS, because one of them can lie.
 *
 * **The gutter** is the honest one. Text is laid out inside 68px of padding, so
 * the outer 60px on each side is glyph-free by construction — not by any
 * assumption about what the answer should be. Whatever luminance is found there
 * is the veiled photograph and nothing else. It is a structural guarantee, and
 * it is the number to trust.
 *
 * **The band** covers the whole copy area, which is where the type actually
 * sits, so it is the measurement that matters — but reading it requires
 * separating glyph pixels from ground, and any classifier that does that is
 * assuming part of its own answer. It is kept, with two guards that make it
 * fail rather than pass when the assumption breaks:
 *
 *   - the classifier sits at 0.12, above every luminance the veil can produce
 *     (0.80 alpha over pure white is 0.069) and below even a 20%-covered glyph
 *     edge. An earlier version used 0.35 and missed the 21px eyebrow entirely:
 *     a thin light stroke never reaches its full colour, so no pixel cleared
 *     the bar, nothing was masked, and the test read the eyebrow's own
 *     antialiasing as ground and failed at 2.26:1. The instrument was wrong,
 *     not the card.
 *   - if the veil ever broke, most of the band would classify as "glyph" and
 *     be masked away, and the max would come back reassuringly dark. So the
 *     masked fraction is capped. Real cards mask 8–20%; a card with no veil
 *     would mask nearly all of it and fail here instead of passing silently.
 *
 * The glyph mask is dilated by 5px so antialiased edges are not read as ground.
 */
async function measure(png: Buffer) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels } = info;

  /* The bottom 45%: the region og.tsx claims never sits on less than 0.80 veil. */
  const y0 = Math.floor(H * 0.55);
  const bandH = H - y0;

  const lum = new Float32Array(W * bandH);
  const glyph = new Uint8Array(W * bandH);
  for (let y = y0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * channels;
      const l = luminance(data[i]!, data[i + 1]!, data[i + 2]!);
      const k = (y - y0) * W + x;
      lum[k] = l;
      if (l >= 0.12) glyph[k] = 1;
    }
  }

  const R = 5;
  const masked = new Uint8Array(bandH * W);
  for (let y = 0; y < bandH; y++) {
    for (let x = 0; x < W; x++) {
      if (!glyph[y * W + x]) continue;
      for (let dy = -R; dy <= R; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= bandH) continue;
        for (let dx = -R; dx <= R; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= W) continue;
          masked[yy * W + xx] = 1;
        }
      }
    }
  }

  let bandMax = 0;
  let gutterMax = 0;
  let maskedPx = 0;
  let glyphPx = 0;
  for (let y = 0; y < bandH; y++) {
    for (let x = 0; x < W; x++) {
      const k = y * W + x;
      if (glyph[k]) glyphPx++;
      /* Structurally glyph-free: inside the padding, no type can be drawn. */
      if (x < PADDING - 8 || x >= W - (PADDING - 8)) {
        if (lum[k]! > gutterMax) gutterMax = lum[k]!;
      }
      if (masked[k]) {
        maskedPx++;
        continue;
      }
      if (lum[k]! > bandMax) bandMax = lum[k]!;
    }
  }

  return {
    glyphFraction: glyphPx / lum.length,
    maskedFraction: maskedPx / lum.length,
    bandContrast: contrast(TEXT_LUM, bandMax),
    gutterContrast: contrast(TEXT_LUM, gutterMax),
    bandMax,
    gutterMax,
  };
}

async function fetchCard(request: import("@playwright/test").APIRequestContext, url: string) {
  const res = await request.get(url);
  expect(res.status(), `${url} did not serve`).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/png");
  const body = await res.body();
  const meta = await sharp(body).metadata();
  expect(meta.width, `${url} is not card-sized`).toBe(CARD_W);
  expect(meta.height, `${url} is not card-sized`).toBe(CARD_H);
  return body;
}

const ROUTES: [label: string, page: string, card: string][] = [
  ["site-wide", "/", "/opengraph-image"],
  ["the estate", "/en/the-estate", "/en/the-estate/opengraph-image"],
  ["weddings", "/en/weddings", "/en/weddings/opengraph-image"],
  ...VILLA_SLUGS.map(
    (s) => [s, `/en/villas/${s}`, `/en/villas/${s}/opengraph-image`] as [string, string, string]
  ),
  ...experienceSlugs().map(
    (s) =>
      [`experience: ${s}`, `/en/experiences/${s}`, `/en/experiences/${s}/opengraph-image`] as [
        string,
        string,
        string,
      ]
  ),
];

test.describe("opengraph cards", () => {
  test("the route table is not empty", () => {
    /*
     * The guard against the failure mode this project keeps meeting: an
     * instrument that reports success because it never reached its subject. If
     * the registry read returns nothing, ROUTES collapses to three entries and
     * twenty-one experience cards go unchecked while the suite stays green.
     */
    expect(experienceSlugs().length).toBeGreaterThanOrEqual(21);
    expect(ROUTES.length).toBeGreaterThanOrEqual(29);
  });

  for (const [label, , card] of ROUTES) {
    test(`${label} — the card's type clears AA over its own photograph`, async ({ request }) => {
      const png = await fetchCard(request, card);
      const m = await measure(png);

      /* The type rendered. A card of pure ground would otherwise pass silently. */
      expect(m.glyphFraction, `${card}: no type found in the copy band`).toBeGreaterThan(0.01);
      /* And the veil is intact — see the note on `measure`. */
      expect(m.maskedFraction, `${card}: most of the band classified as type`).toBeLessThan(0.45);

      expect(
        m.gutterContrast,
        `${card}: brightest veiled pixel in the glyph-free gutter is ` +
          `${m.gutterMax.toFixed(4)} — limestone reads ${m.gutterContrast.toFixed(2)}:1 there`
      ).toBeGreaterThanOrEqual(4.5);

      expect(
        m.bandContrast,
        `${card}: brightest ground pixel under the copy is ${m.bandMax.toFixed(4)} — ` +
          `limestone reads ${m.bandContrast.toFixed(2)}:1 there`
      ).toBeGreaterThanOrEqual(4.5);
    });
  }

  for (const [label, route, card] of ROUTES) {
    test(`${label} — og:image points at its own card`, async ({ page }) => {
      await page.goto(route);
      const src = await page.locator('meta[property="og:image"]').first().getAttribute("content");
      expect(src, `${route} declares no og:image`).toBeTruthy();
      /*
       * Next appends a content hash as a query string, so this compares paths.
       * The point of the assertion is that a villa does not quietly inherit the
       * site-wide card — which is what every one of these routes did until now.
       */
      expect(new URL(src!, "http://x").pathname, `${route} inherited the wrong card`).toBe(card);
    });
  }
});
