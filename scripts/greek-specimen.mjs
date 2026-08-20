#!/usr/bin/env node
/**
 * T-189 — THE GREEK DISPLAY-FACE SPECIMEN.
 *
 * Marcellus carries `latin` and `latin-ext` and no Greek at all, so every Greek
 * heading on a future /el would silently fall back to Georgia — visibly lighter,
 * a different texture, and not the brand. This renders the four candidates at
 * the REAL Direction D sizes with the REAL strings the site would set, so the
 * decision is made on evidence rather than on specimen pages.
 *
 * `pathToFileURL` rather than string-building a file:// URL: this workspace path
 * contains spaces and Greek characters, and hand-escaping it has already broken
 * two scripts in this project.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const FACES = [
  ["GFS Didot", "gfs-didot"],
  ["EB Garamond", "eb-garamond"],
  ["Noto Serif Display", "noto-serif-display"],
  ["Literata", "literata"],
];

/* The strings /el would actually set, at the sizes it would actually set. */
const C1 = "Ζώντας";
const TAIL = "ΧΩΡΙΣ ΟΡΙΑ";
const C2 = "Κολυμπώντας";
const C3 = "Το πρωινό μπάνιο, πριν ξυπνήσει κανείς.";
const MICRO = "ΠΗΓΙΑΝΟΣ ΚΑΜΠΟΣ · ΡΕΘΥΜΝΟ · ΚΡΗΤΗ";

const faceCss = FACES.map(([name, slug]) => {
  const g = pathToFileURL(path.resolve(`qa/greek-face/fonts/${slug}-greek.woff2`)).href;
  const ge = pathToFileURL(path.resolve(`qa/greek-face/fonts/${slug}-greek-ext.woff2`)).href;
  return [
    `@font-face{font-family:"${name}";src:url("${g}") format("woff2");unicode-range:U+0370-03FF;font-display:block}`,
    `@font-face{font-family:"${name}";src:url("${ge}") format("woff2");unicode-range:U+1F00-1FFF;font-display:block}`,
  ].join("\n");
}).join("\n");

const rows = FACES.map(
  ([name]) => `
  <section class="face">
    <p class="label">${name}</p>
    <p class="c1" style="font-family:'${name}'">${C1}<span class="tail">${TAIL}</span></p>
    <p class="c2" style="font-family:'${name}'">${C2}</p>
    <p class="c3" style="font-family:'${name}'">${C3}</p>
    <p class="micro" style="font-family:'${name}'">${MICRO}</p>
  </section>`
).join("");

const html = `<!doctype html><meta charset="utf-8"><title>Greek display faces</title><style>
${faceCss}
:root{--limestone:#e8e9e3;--basalt:#16262b;--phrygana:#545d4e;--pelagos:#14535f}
*{margin:0;box-sizing:border-box}
body{background:var(--limestone);color:var(--basalt);padding:64px;font-family:system-ui}
.face{padding-block:56px;border-top:1px solid rgba(20,83,95,.22)}
.face:first-child{border-top:0}
.label{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--pelagos);margin-bottom:28px}
.c1{font-size:96px;line-height:1.05;letter-spacing:-.025em}
.tail{font-size:13px;letter-spacing:.14em;margin-left:1.2ch;color:var(--phrygana);font-family:inherit}
.c2{font-size:64px;line-height:1.1;letter-spacing:-.02em;margin-top:24px}
.c3{font-size:44px;line-height:1.15;letter-spacing:-.015em;margin-top:24px;max-width:22ch}
.micro{font-size:14px;letter-spacing:.14em;margin-top:28px;color:var(--phrygana)}
</style>${rows}`;

fs.mkdirSync("qa/greek-face", { recursive: true });
fs.writeFileSync("qa/greek-face/specimen.html", html);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
await page.goto(pathToFileURL(path.resolve("qa/greek-face/specimen.html")).href);
await page.waitForTimeout(2500);

/*
 * PROVE THE FACES LOADED. A specimen where every candidate silently fell back
 * to Georgia would look like a comparison and be a photograph of one font —
 * which is exactly the mistake T-189 exists to correct.
 */
const resolved = await page.evaluate(async () => {
  await document.fonts.ready;
  return ["GFS Didot", "EB Garamond", "Noto Serif Display", "Literata"].map((n) => ({
    face: n,
    loaded: document.fonts.check(`96px "${n}"`, "Ζώντας"),
  }));
});
console.log("faces resolved:", JSON.stringify(resolved));
if (resolved.some((r) => !r.loaded)) {
  console.error("A candidate did not load — the specimen would be misleading.");
  process.exitCode = 1;
}

/* Measured widths: the same string in each face, for the ledger. */
const widths = await page.evaluate(() =>
  [...document.querySelectorAll(".c1")].map((e) => Math.round(e.getBoundingClientRect().width))
);
console.log("C1 widths at 96px:", JSON.stringify(widths));

await page.screenshot({ path: "qa/greek-face/all-four-1440.png", fullPage: true });
for (let i = 0; i < FACES.length; i++) {
  await page.locator(".face").nth(i).screenshot({
    path: `qa/greek-face/${FACES[i][1]}-1440.png`,
  });
}
await browser.close();
console.log("specimens -> qa/greek-face/");
