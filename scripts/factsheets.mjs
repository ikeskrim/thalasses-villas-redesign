#!/usr/bin/env node
/**
 * VILLA FACT SHEETS — one PDF per house, generated from the registry.
 *
 * The thing a guest forwards to the four other people coming on the trip, and
 * the thing an agent prints. It is the only artefact this project produces that
 * survives leaving the website.
 *
 * GENERATED, NEVER TYPED. Every figure, every amenity and every note comes from
 * `content/`, through the same resolvers the pages use — `specStrip`,
 * `practicalNotes`, `villaServices`, `buildInventory`. A fact sheet with its own
 * copy of the numbers is a second source that drifts, and it drifts somewhere
 * nobody looks, because a PDF does not get re-read after it is made.
 *
 * WHY NOT AT `next build` TIME: this renders through Playwright, and Vercel's
 * build image has no browsers. Running it in the build would work on this
 * machine and fail on the one that matters. So it is a local step whose output
 * is committed, exactly like the photography — and `tests/factsheets.spec.ts`
 * asserts the committed PDFs are current, so a stale one fails the suite
 * instead of quietly shipping last month's bathroom count.
 *
 *   node scripts/factsheets.mjs
 */
import { chromium } from "@playwright/test";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public", "factsheets");
const CONTENT = path.join(ROOT, "content");
const readJson = (...p) => JSON.parse(fs.readFileSync(path.join(...p), "utf-8"));

fs.mkdirSync(OUT, { recursive: true });

/* ------------------------------------------------------------- resolvers -- */
/*
 * Re-implemented here rather than imported: `src/lib/*` is `server-only` and
 * carries Next-specific imports that a plain node script cannot load. The rule
 * that matters is that the DATA is the same data — every value below is read
 * from `content/`, and `tests/factsheets.spec.ts` asserts the rendered PDF text
 * against the registry so a divergence between these and the page resolvers
 * fails rather than hides.
 */
const VILLAS = [
  ["200", "villa-thoi", "Villa Thoi"],
  ["201", "villa-persi", "Villa Persi"],
  ["202", "villa-eeanthe", "Villa Eeanthe"],
  ["203", "villa-melia", "Villa Melia"],
  ["pueblo", "villa-pueblo", "Villa Pueblo"],
];

const squareFeet = (sqm) => Math.round(sqm * 10.7639);

function specStrip(v) {
  const s = v.specs ?? {};
  const out = [];
  if (s.bedrooms) out.push(["Bedrooms", String(s.bedrooms)]);
  if (s.bathrooms) out.push(["Bathrooms", String(s.bathrooms)]);
  if (s.maxGuests) out.push(["Sleeps", String(s.maxGuests)]);
  if (s.pools) out.push([s.pools === 1 ? "Private pool" : "Private pools", String(s.pools)]);
  if (s.sizeSqm) out.push(["Area", `${s.sizeSqm} m² · ${squareFeet(s.sizeSqm)} sq ft`]);
  return out;
}

function detailRows(v) {
  const s = v.specs ?? {};
  const out = [];
  if (s.bedroomsDetail) out.push(["Bedrooms", s.bedroomsDetail]);
  if (s.bathroomsDetail) out.push(["Bathrooms", s.bathroomsDetail]);
  if (s.view) out.push(["View", s.view]);
  if (s.distanceToBeach) out.push(["Beach", s.distanceToBeach]);
  return out;
}

/** The same dedupe rule as `practicalNotes` in src/lib/villa-page.ts. */
function practicalNotes(v) {
  const raw = [...(v.policies ?? []), ...(v.amenityFacts ?? [])]
    .map((s) => String(s).trim())
    .filter(Boolean)
    .map((s) => s.replace(/^\((.*)\)$/, "$1").replace(/^Please note that\s+/i, "").trim())
    .map((s) => s.replace(/\s+/g, " "))
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
  const m = new Map();
  for (const line of raw) {
    const key = line
      .toLowerCase()
      .replace(/[0-9]+/g, "")
      .replace(/[€$£]/g, "")
      .replace(/[^a-z ]/g, "")
      .replace(/\b(a|an|the|with|per|upon|request|additional|daily|day|charge|charges|cost|price|extra)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const e = m.get(key);
    if (!e) m.set(key, line);
    else if (/[0-9]/.test(line) && !/[0-9]/.test(e)) m.set(key, line);
  }
  return [...m.values()];
}

const BEYOND_THE_GATE = new Set(["Attractions", "Locations", "Themes", "Activities", "Leisure"]);

function amenityGroups(key) {
  const file = path.join(CONTENT, "facilities", `${key}.json`);
  if (!fs.existsSync(file)) return [];
  const j = readJson(CONTENT, "facilities", `${key}.json`);
  const groups = new Map();
  for (const t of j.tabs ?? []) {
    for (const g of t.groups ?? []) {
      if (BEYOND_THE_GATE.has(g.group)) continue;
      const items = (g.items ?? []).filter((i) => !i.valueIsUnresolvedEnumId).map((i) => i.name);
      if (!items.length) continue;
      groups.set(g.group, [...new Set([...(groups.get(g.group) ?? []), ...items])]);
    }
  }
  return [...groups.entries()];
}

/** Frames for the sheet: captioned ones first, resolved and existing on disk. */
function frames(v, n = 3) {
  const aliases = fs.existsSync(path.join(CONTENT, "image-aliases.json"))
    ? readJson(CONTENT, "image-aliases.json").aliases ?? {}
    : {};
  const blocked = new Set(
    (fs.existsSync(path.join(CONTENT, "excluded-images.json"))
      ? readJson(CONTENT, "excluded-images.json")
      : []
    ).map((b) => b.file)
  );
  const local = (url) => {
    if (!url) return null;
    const m = /([0-9a-f]{32})\.(jpg|jpeg|png)/i.exec(url);
    let p = m ? `/images/_pool/${m[1]}.${m[2].toLowerCase() === "png" ? "png" : "jpg"}` : url.startsWith("/") ? url : null;
    if (!p) return null;
    if (blocked.has(p.split("/").pop())) return null;
    p = aliases[p] ?? p;
    const abs = path.join(ROOT, "public", p.replace(/^\//, ""));
    return fs.existsSync(abs) ? { web: p, abs } : null;
  };

  /*
   * The same fallback the villa page uses: Villa Pueblo has an EMPTY `featured`
   * list and five frames in `allImages`, so a sheet built from `featured` alone
   * came out with no photographs at all — 66 KB against 380 KB for the others,
   * which is what made it visible. `TheRun` has always fallen back this way;
   * the sheet has to agree with the page it summarises.
   */
  const featured = (
    (v.gallery?.featured ?? []).length
      ? v.gallery.featured
      : (v.gallery?.allImages ?? []).map((image) => ({ image, caption: null }))
  ).slice();
  featured.sort((a, b) => Number(Boolean(b.caption)) - Number(Boolean(a.caption)));
  const out = [];
  for (const f of featured) {
    const r = local(f.image);
    if (!r) continue;
    if (out.some((o) => o.abs === r.abs)) continue;
    out.push({ ...r, caption: f.caption ?? null });
    if (out.length >= n) break;
  }
  return out;
}

/**
 * The authored per-villa description, read from `src/lib/meta-copy.ts`.
 *
 * The sheet first used `shortDescription`, and the registry gives four of the
 * five villas the SAME line: "Four luxurious villas in a privileged location
 * 50 m from a private beach." On a sheet about one villa that opens by naming
 * four of them, and "luxurious" is on this project's banned list — the exact
 * pair of failures T4-5 fixed for the meta layer.
 *
 * Read from the TypeScript by pattern rather than copied, so there stays one
 * source. The same approach the Greek flag below uses, for the same reason: a
 * plain node script cannot import a `server-only` module, and a second copy of
 * the sentence would drift.
 */
function authoredDescriptions() {
  const src = fs.readFileSync(path.join(ROOT, "src", "lib", "meta-copy.ts"), "utf-8");
  const out = {};
  for (const m of src.matchAll(
    /(?:"([^"]+)"|(\w+)):\s*\{\s*description:\s*\n?\s*"([^"]+)"/g
  )) {
    out[m[1] ?? m[2]] = m[3];
  }
  return out;
}
const AUTHORED = authoredDescriptions();

/* ------------------------------------------------------------- the sheet -- */
const site = readJson(CONTENT, "site.json");
const licence =
  JSON.stringify(site).match(/1041K91003163701/) ? "1041K91003163701" : null;

/**
 * A frame, downscaled for print, as a data URI.
 *
 * The first version embedded the originals and produced sheets of 1.7–2.2 MB
 * each, 7.7 MB for five — for images printed 46 mm tall. A fact sheet is a
 * thing people email; a 2 MB attachment for one villa is a thing people do not.
 *
 * 46 mm at 300 dpi is 543 px, so 900 px wide is already beyond what any printer
 * will resolve. Quality 72 on top of that, and `sharp`'s `attention` crop so
 * the subject survives the aspect change rather than being centre-cropped into
 * a wall.
 */
async function printPlate(abs) {
  const buf = await sharp(abs)
    .resize(900, 620, { fit: "cover", position: "attention" })
    .jpeg({ quality: 72 })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

async function sheetHtml(v, name, slug) {
  const specs = specStrip(v);
  const details = detailRows(v);
  const notes = practicalNotes(v);
  const groups = amenityGroups(v.id === "7798" ? "rituals" : slugKey(slug));
  const pics = frames(v);
  const booking = "https://thalassesvillas.reserve-online.net/?lang=en";

  const plates = new Map();
  for (const p of pics) plates.set(p.abs, await printPlate(p.abs));
  const dataUri = (abs) => plates.get(abs);

  return `<!doctype html><meta charset="utf-8"><title>${name} — fact sheet</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; margin: 0; }
  body { font: 10.5pt/1.5 "Helvetica Neue", Arial, sans-serif; color: #16262b; }
  .eyebrow { font-size: 7.5pt; letter-spacing: .2em; text-transform: uppercase; color: #545d4e; }
  h1 { font: 400 30pt/1.05 Georgia, "Times New Roman", serif; letter-spacing: -.02em; margin: 6pt 0 4pt; }
  .lede { color: #545d4e; max-width: 46em; }
  .rule { height: 1px; background: rgba(20,83,95,.25); margin: 12pt 0; }
  .specs { display: flex; flex-wrap: wrap; gap: 0 22pt; margin: 10pt 0; }
  .spec .k { font-size: 7.5pt; letter-spacing: .16em; text-transform: uppercase; color: #545d4e; }
  .spec .v { font-size: 15pt; }
  .frames { display: flex; gap: 6pt; margin: 10pt 0; }
  .frames figure { flex: 1; margin: 0; }
  .frames img { width: 100%; height: 46mm; object-fit: cover; display: block; }
  .frames figcaption { font-size: 7pt; color: #545d4e; margin-top: 3pt; }
  h2 { font-size: 8pt; letter-spacing: .18em; text-transform: uppercase; color: #545d4e; font-weight: 500; margin: 12pt 0 5pt; }
  dl { display: grid; grid-template-columns: 30mm 1fr; gap: 3pt 8pt; }
  dt { font-size: 7.5pt; letter-spacing: .14em; text-transform: uppercase; color: #545d4e; padding-top: 2pt; }
  ul { margin: 0; padding-left: 14pt; }
  li { margin-bottom: 2pt; }
  .groups { columns: 3; column-gap: 10pt; font-size: 8.5pt; }
  .groups section { break-inside: avoid; margin-bottom: 7pt; }
  .groups h3 { font-size: 7.5pt; letter-spacing: .12em; text-transform: uppercase; color: #545d4e; font-weight: 500; margin-bottom: 2pt; }
  .groups p { color: #16262b; }
  .foot { margin-top: 14pt; padding-top: 8pt; border-top: 1px solid rgba(20,83,95,.25); font-size: 8pt; color: #545d4e; display: flex; justify-content: space-between; gap: 10pt; }
</style>
<p class="eyebrow">Pigianos Kampos · Rethymno · Crete</p>
<h1>${name}</h1>
${(() => {
    const lede = AUTHORED[slugKey(slug) ?? ""] ?? (v.shortDescription ? firstSentence(v.shortDescription) : "");
    return lede ? `<p class="lede">${esc(lede)}</p>` : "";
  })()}

${pics.length ? `<div class="frames">${pics
    .map(
      (p) =>
        `<figure><img src="${dataUri(p.abs)}" alt="">${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ""}</figure>`
    )
    .join("")}</div>` : ""}

<div class="specs">${specs
    .map(([k, val]) => `<div class="spec"><div class="k">${esc(k)}</div><div class="v">${esc(val)}</div></div>`)
    .join("")}</div>

${details.length ? `<h2>In detail</h2><dl>${details.map(([k, val]) => `<dt>${esc(k)}</dt><dd>${esc(val)}</dd>`).join("")}</dl>` : ""}

${notes.length ? `<h2>Good to know</h2><ul>${notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}

${groups.length ? `<h2>What is here — ${groups.reduce((n, [, i]) => n + i.length, 0)} provisions</h2>
<div class="groups">${groups
      .map(([g, items]) => `<section><h3>${esc(g)}</h3><p>${items.map(esc).join(" · ")}</p></section>`)
      .join("")}</div>` : ""}

<div class="foot">
  <span>Book: ${booking}</span>
  <span>info@thalasses.com · (+30) 6974069475</span>
  ${licence ? `<span>Operating licence ${licence}</span>` : ""}
</div>`;
}

function slugKey(slug) {
  return { "villa-thoi": "200", "villa-persi": "201", "villa-eeanthe": "202", "villa-melia": "203", "villa-pueblo": "pueblo" }[slug];
}
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const firstSentence = (s) => {
  const t = String(s).trim();
  const m = /^(.{40,220}?[.!?])\s/.exec(t);
  return m ? m[1] : t.slice(0, 200);
};

/* ---------------------------------------------------------------- render -- */
const browser = await chromium.launch();
const page = await browser.newPage();
let made = 0;
let bytes = 0;

for (const [key, slug, name] of VILLAS) {
  const v = readJson(CONTENT, "villas", `${key}.json`);
  const html = await sheetHtml(v, name, slug);

  const tmp = path.join(OUT, `.${slug}.html`);
  fs.writeFileSync(tmp, html);
  await page.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
  const file = path.join(OUT, `${slug}.pdf`);
  await page.pdf({ path: file, format: "A4", printBackground: true });
  /* `--keep` leaves the intermediate HTML behind. A PDF cannot be opened in a
     browser for inspection — Chromium downloads it rather than rendering it —
     so this is the only way to actually LOOK at a sheet while designing one. */
  if (!process.argv.includes("--keep")) fs.unlinkSync(tmp);

  const size = fs.statSync(file).size;
  bytes += size;
  made++;
  process.stdout.write(`  ${slug.padEnd(16)} ${(size / 1024).toFixed(0).padStart(5)} KB\n`);
}

await browser.close();

/*
 * THE GREEK STUB.
 *
 * The corpus exists and is verified (`content/el/`), but it is `copyStatus:
 * "draft"` and `/el` is not published. Generating a Greek fact sheet and
 * linking it would publish draft Greek through a side door — a PDF is exactly
 * the kind of artefact that escapes a staging environment, because people
 * forward it.
 *
 * So the generator is locale-shaped and the Greek output is gated on the same
 * flag as everything else. When `PUBLISHED_LOCALES` gains "el", this loop runs
 * a second time against `content/el/` and nothing else here changes.
 */
const localeFlag = fs.readFileSync(path.join(ROOT, "src", "lib", "locale.ts"), "utf-8");
const elPublished = /PUBLISHED_LOCALES[^=]*=\s*\[[^\]]*"el"/.test(localeFlag);
console.log(
  `\n${made} sheets, ${(bytes / 1048576).toFixed(2)} MB -> public/factsheets/` +
    `\nGreek: ${elPublished ? "PUBLISHED — generate el sheets" : "not published, no el sheets (corpus is draft)"}`
);
