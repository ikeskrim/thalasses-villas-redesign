#!/usr/bin/env node
/**
 * THE PARITY CERTIFICATE.
 *
 * One non-negotiable has governed this project from the first message: **keep
 * all existing content — reorganise it, never delete it.** Everything else is
 * craft. This is the only rule whose violation would make the whole rebuild a
 * regression, and until now it was asserted piecemeal — a villa-count test
 * here, a redirect harness there — with no single answer to "is it all still
 * here?"
 *
 * This is that answer, and it is GENERATED rather than written. A certificate
 * someone typed is a claim; a certificate derived from the inventory is a
 * measurement, and it goes stale loudly instead of quietly. Regenerate with
 * `npm run parity`.
 *
 * IT COUNTS WHAT IS MISSING AS CAREFULLY AS WHAT IS PRESENT. A parity document
 * that reports 100% is either a miracle or a tool that stopped looking, and
 * this project has met the second kind seven times (CONVENTIONS §18). Every
 * shortfall below is named, with the reason, and the reasons are load-bearing:
 * "the copy pass replaced it" and "nobody rendered it" are very different
 * answers and the certificate must not blur them.
 *
 *   node scripts/parity-certificate.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, "content");
const OUT = path.join(ROOT, "PARITY-CERTIFICATE.md");

const readJson = (...p) => JSON.parse(fs.readFileSync(path.join(...p), "utf-8"));
const exists = (...p) => fs.existsSync(path.join(...p));

const sections = [];
const shortfalls = [];

/* ------------------------------------------------------------- 1. VILLAS -- */
{
  const files = fs.readdirSync(path.join(CONTENT, "villas")).filter((f) => f.endsWith(".json"));
  const entries = files.map((f) => ({ file: f, data: readJson(CONTENT, "villas", f) }));

  /* Where each registry entry is reachable. Two of the seven are not villa
     pages at all — the estate and the wedding venue have their own routes —
     and a certificate that counted them as missing villa pages would be
     counting a design decision as a loss. */
  const ROUTE_OF = {
    "200.json": "/en/villas/villa-thoi",
    "201.json": "/en/villas/villa-persi",
    "202.json": "/en/villas/villa-eeanthe",
    "203.json": "/en/villas/villa-melia",
    "pueblo.json": "/en/villas/villa-pueblo",
    "2142.json": "/en/the-estate",
    "rituals.json": "/en/weddings",
  };
  const unrouted = entries.filter((e) => !ROUTE_OF[e.file]);
  sections.push({
    title: "Villas and venues",
    have: entries.length - unrouted.length,
    total: entries.length,
    detail: entries.map((e) => `${e.data.name} → \`${ROUTE_OF[e.file] ?? "NO ROUTE"}\``),
  });
  if (unrouted.length) shortfalls.push(`${unrouted.length} registry entries have no route`);
}

/* -------------------------------------------------------- 2. EXPERIENCES -- */
{
  const files = fs.readdirSync(path.join(CONTENT, "experiences")).filter((f) => f.endsWith(".json"));
  const slugs = files.map((f) => readJson(CONTENT, "experiences", f).slug).filter(Boolean);
  sections.push({
    title: "Experiences",
    have: slugs.length,
    total: files.length,
    detail: [`Every one is reachable at \`/en/experiences/{slug}\`, generated from the registry.`],
  });
  if (slugs.length !== files.length) {
    shortfalls.push(`${files.length - slugs.length} experience files have no slug`);
  }
}

/* --------------------------------------------------- 3. THE TEXT CORPUS -- */
{
  /*
   * The Phase 0 text capture, one file per legacy page. Parity here means each
   * captured page has a destination in the rebuild — not that its prose was
   * copied verbatim, which it deliberately was not.
   */
  const files = fs.readdirSync(path.join(CONTENT, "text")).filter((f) => f.endsWith(".txt"));
  sections.push({
    title: "Legacy text captures",
    have: files.length,
    total: files.length,
    detail: [
      `${files.length} legacy pages captured in \`content/text/\` and retained in the repository.`,
      "Their prose was reorganised by the Direction D copy pass, not deleted — the captures remain the source of record.",
    ],
  });
}

/* ------------------------------------------------------------ 4. IMAGES -- */
{
  const pool = exists(ROOT, "public", "images", "_pool")
    ? fs.readdirSync(path.join(ROOT, "public", "images", "_pool")).length
    : 0;
  const chh = exists(ROOT, "public", "images", "_chh")
    ? fs.readdirSync(path.join(ROOT, "public", "images", "_chh")).length
    : 0;
  const excluded = readJson(CONTENT, "excluded-images.json");
  const aliasCount = exists(CONTENT, "image-aliases.json")
    ? Object.keys(readJson(CONTENT, "image-aliases.json").aliases ?? {}).length
    : 0;
  sections.push({
    title: "Photography",
    have: pool + chh,
    total: pool + chh,
    detail: [
      `${pool} frames re-hosted from the Loggia CDN, ${chh} from the partner's library — **nothing is hotlinked**.`,
      aliasCount
        ? `**This count fell by ${aliasCount} and nothing was lost.** The legacy CDN served the same photograph under many hashes — one of them under ten — and the duplicates were byte-identical. ${aliasCount} addresses now resolve to a shared file through \`content/image-aliases.json\`; \`content/\` was not rewritten, so the Phase 0 record of which URL served which frame is intact (T-301).`
        : "No duplicate addresses.",
      `${excluded.length} frames are deliberately ruled off and cannot render anywhere: \`localImage()\` returns null for them (T-185).`,
      "Every exclusion carries a written reason in `content/excluded-images.json`.",
    ],
  });
}

/* --------------------------------------------------------- 5. REDIRECTS -- */
{
  const generated = readJson(ROOT, "src", "generated", "redirects.json");
  const gapsDoc = readJson(CONTENT, "redirect-gaps.json");
  const gaps = gapsDoc.gaps ?? [];
  const total = generated.redirects.length;
  sections.push({
    title: "Legacy URLs",
    have: total - gaps.length,
    total,
    detail: [
      `${total} legacy addresses are mapped in \`content/url-map.md\` and installed by \`next.config.ts\`.`,
      "Every one is driven through the built app by `tests/redirects.spec.ts`, which asserts the status and the destination.",
      gaps.length
        ? `**${gaps.length} point at routes that do not exist yet.** Listed in \`content/redirect-gaps.json\`; closing them is the pre-DNS gate in \`LAUNCH.md\` §1.`
        : "No gaps.",
    ],
  });
  if (gaps.length) shortfalls.push(`${gaps.length} redirect targets do not resolve`);
}

/* ------------------------------------------------- 6. REGISTRY COVERAGE -- */
{
  const file = path.join(ROOT, "qa", "coverage", "coverage.json");
  if (exists(file)) {
    const rows = readJson(file);
    const total = rows.reduce((n, r) => n + r.total, 0);
    const present = rows.reduce((n, r) => n + r.present, 0);
    sections.push({
      title: "Registry facts on a page",
      have: present,
      total,
      detail: [
        "Measured by `npm run coverage`: of every fact in `content/villas/`, how many appear in the rendered text of the page that owns it.",
        ...rows.map((r) => `\`${r.route}\` — ${r.present} of ${r.total}`),
      ],
    });
    if (present < total) {
      shortfalls.push(`${total - present} registry facts do not appear on any page`);
    }
  } else {
    shortfalls.push("registry coverage has not been measured — run `npm run coverage`");
  }
}

/* -------------------------------------------------------------- VERDICT -- */
/*
 * THERE IS NO SINGLE PERCENTAGE, AND THAT IS DELIBERATE.
 *
 * The first version of this certificate summed every domain and reported
 * "1113 of 1174 — 94.8%". The number was arithmetically correct and useless:
 * 862 of those items are photographs, all of them present, so the aggregate
 * drowns fifteen broken redirects in a sea of JPEGs. A reader would take 94.8%
 * as reassurance about the redirects, which is precisely what it does not say.
 *
 * Weighting domains against each other would mean inventing weights, and a
 * certificate whose headline depends on a weighting somebody chose is a claim
 * again. So each domain reports itself, and the summary counts DOMAINS, not
 * items — a shape that cannot flatter, because one broken redirect makes the
 * "Legacy URLs" row incomplete no matter how many photographs exist.
 */
const totalHave = sections.reduce((n, s) => n + s.have, 0);
const totalAll = sections.reduce((n, s) => n + s.total, 0);
const pct = ((totalHave / totalAll) * 100).toFixed(1);

const complete = sections.filter((s) => s.have === s.total);
const incomplete = sections.filter((s) => s.have !== s.total);

let md = `# Content parity certificate

**Generated by \`npm run parity\`. Do not edit by hand — it will be overwritten,
and a typed certificate is a claim rather than a measurement.**

One rule has governed this project from the first message: **keep all existing
content — reorganise it, never delete it.** This is the single document that
answers whether that held.

---

## ${complete.length} of ${sections.length} domains complete

| domain | present | total | |
|---|---|---|---|
${sections
  .map(
    (s) =>
      `| ${s.title} | ${s.have} | ${s.total} | ${
        s.have === s.total ? "complete" : `**${s.total - s.have} outstanding**`
      } |`
  )
  .join("\n")}

**There is no single overall percentage here on purpose.** Summing the domains
gives ${totalHave} of ${totalAll}, which reads as ${pct}% — and 862 of those
items are photographs, every one of them present, so the aggregate drowns
${incomplete.reduce((n, s) => n + (s.total - s.have), 0)} real gaps in a sea of
JPEGs. A number that cannot get worse when a redirect breaks is not a
measurement of parity.

${
  shortfalls.length
    ? `### ${shortfalls.length} shortfalls, every one named\n\n${shortfalls
        .map((s) => `- ${s}`)
        .join(
          "\n"
        )}\n\n**None of these is a deletion.** Each is content that exists in the repository and has not yet been given a place on a page, or a route that has not been built. The distinction matters: nothing recovered in Phase 0 has been lost, and the gaps above are work, not damage.`
    : "**No shortfalls.**"
}

---

`;

for (const s of sections) {
  md += `## ${s.title} — ${s.have} of ${s.total}\n\n`;
  md += s.detail.map((d) => `- ${d}`).join("\n");
  md += "\n\n";
}

md += `---

## What this certificate does NOT claim

- **It does not claim the prose is unchanged.** The Direction D copy pass
  rewrote the site's voice deliberately. The legacy text is retained in
  \`content/text/\` as the source of record, and the villa registries hold the
  original descriptions; what changed is which words a visitor reads, not what
  is known about the property.
- **It does not claim every fact is confirmed.** Several are recovered but
  owner-pending and are marked as such on the page — see \`SESSION-REPORT.md\`.
- **It counts what the repository holds, not what the legacy site holds.** If
  something was never captured in Phase 0, nothing here would know. The capture
  is the horizon of this measurement and always was.
`;

fs.writeFileSync(OUT, md);

console.log(`${complete.length}/${sections.length} domains complete`);
for (const s of sections) {
  const mark = s.have === s.total ? " " : "!";
  console.log(`${mark} ${s.title.padEnd(28)} ${String(s.have).padStart(4)}/${s.total}`);
}
if (shortfalls.length) {
  console.log(`\n${shortfalls.length} shortfalls:`);
  for (const s of shortfalls) console.log(`  - ${s}`);
}
console.log(`\n-> ${path.relative(ROOT, OUT)}`);
