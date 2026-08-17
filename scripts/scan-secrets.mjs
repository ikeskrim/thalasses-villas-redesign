#!/usr/bin/env node
/**
 * THE CREDENTIAL SCAN.
 *
 * Written after a live Google Maps API key reached a public repository inside
 * 43 scraped HTML files. Two things went wrong at once and this script fixes
 * both (CONVENTIONS.md §13):
 *
 *   1. The pattern list had no Google format. It covered sk-, ghp_/gho_, AKIA,
 *      xox*-, and PEM headers, and it held for every one of those — but a
 *      pattern list is only ever as good as its last addition.
 *
 *   2. More importantly: the scraped dumps under content/raw were never
 *      scanned at all. They were treated as DATA — evidence of what the old
 *      site said — rather than as text that can hold a secret. They are
 *      third-party HTML pulled off a live production server, which makes them
 *      the single most likely place in this project for someone else's
 *      credential to be sitting.
 *
 * So: everything textual is input. No directory is exempt for being "just
 * content", and no file type is exempt for being "just markup".
 *
 * Usage:
 *   node scripts/scan-secrets.mjs            scan the working tree
 *   node scripts/scan-secrets.mjs --staged   scan what is staged for commit
 *
 * Exit 0 clean, exit 1 on any finding. Matches are printed MASKED — a scanner
 * that prints the secret it found has copied it into your terminal scrollback,
 * your CI log, and this session's transcript.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const STAGED = process.argv.includes("--staged");

/* Nothing here is source, and all of it is regenerable or vendored. */
const SKIP_DIRS = new Set([
  "node_modules", ".git", ".next", "out", "dist", "build",
  "test-results", "playwright-report", "blob-report", ".vercel",
]);

/* Binary by extension. Anything else is sniffed for NUL bytes below. */
const BINARY = /\.(jpe?g|png|gif|webp|avif|ico|svgz|woff2?|ttf|eot|otf|mp4|mov|webm|mp3|wav|pdf|zip|gz|tgz|7z|rar|exe|dll|so|dylib|class|jar|wasm)$/i;

const PATTERNS = [
  // ---- Google. The format this project actually leaked. ------------------
  { id: "google-api-key",    re: /AIza[0-9A-Za-z_-]{35}/g },
  { id: "google-oauth",      re: /ya29\.[0-9A-Za-z_-]{20,}/g },
  // ---- The set that was already in place, and held. ----------------------
  { id: "openai-key",        re: /\bsk-[A-Za-z0-9_-]{16,}/g },
  { id: "github-token",      re: /\bgh[pousr]_[A-Za-z0-9]{20,}/g },
  { id: "aws-access-key-id", re: /\bAKIA[0-9A-Z]{16}\b/g },
  { id: "slack-token",       re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/g },
  { id: "private-key-block", re: /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/g },
  // ---- The catch-all, for formats nobody has thought of yet. -------------
  {
    id: "generic-assignment",
    re: /(api[_-]?key|apikey|secret|token|password)\s*[:=]\s*['"][A-Za-z0-9_\-]{16,}['"]/gi,
  },
];

/**
 * PUBLIC BY DESIGN — see SECURITY-NOTES.md.
 *
 * These are values a browser must receive to work at all: they are published
 * in the page source of the live site by definition, and they carry no
 * privilege beyond an origin restriction set on the provider's side. They are
 * allowlisted BY EXACT VALUE, never by a loosened pattern, so a real secret
 * that merely resembles one still fails the scan.
 */
const PUBLIC_BY_DESIGN = new Set([
  // reCAPTCHA site keys and GA/GTM measurement IDs are added here as they are
  // judged, each with a line in SECURITY-NOTES.md giving the reason.
]);

/** Redaction markers this project writes. Never a finding. */
const REDACTIONS = [/^AIZA_KEY_REDACTED$/, /_REDACTED$/];

const mask = (s) =>
  s.length <= 12 ? s.slice(0, 3) + "…" : `${s.slice(0, 6)}…${s.slice(-4)} (len ${s.length})`;

function files() {
  if (STAGED) {
    return execSync("git diff --cached --name-only --diff-filter=ACMR", {
      maxBuffer: 1 << 28,
    })
      .toString()
      .split("\n")
      .filter(Boolean)
      .filter((f) => fs.existsSync(f));
  }
  const out = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue;
        walk(path.join(dir, e.name));
      } else {
        out.push(path.relative(ROOT, path.join(dir, e.name)).split(path.sep).join("/"));
      }
    }
  })(ROOT);
  return out;
}

let scanned = 0;
let skippedBinary = 0;
const findings = [];

for (const f of files()) {
  if (BINARY.test(f)) { skippedBinary++; continue; }
  let buf;
  try { buf = fs.readFileSync(f); } catch { continue; }
  // Sniff: a NUL in the first 8 KB means binary, whatever the extension says.
  if (buf.subarray(0, 8192).includes(0)) { skippedBinary++; continue; }

  const text = buf.toString("utf-8");
  scanned++;

  for (const { id, re } of PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const hit = m[0];
      if (PUBLIC_BY_DESIGN.has(hit)) continue;
      if (REDACTIONS.some((r) => r.test(hit))) continue;
      const line = text.slice(0, m.index).split("\n").length;
      findings.push({ file: f, line, id, masked: mask(hit) });
    }
  }
}

console.log(
  `credential scan — ${scanned} text files scanned, ${skippedBinary} binaries skipped` +
    (STAGED ? " (staged only)" : " (whole tree)")
);

if (!findings.length) {
  console.log("CLEAN — no credential-class match.");
  process.exit(0);
}

const byId = {};
for (const f of findings) (byId[f.id] ??= []).push(f);
console.error(`\nFOUND ${findings.length} match(es) in ${new Set(findings.map((f) => f.file)).size} file(s):\n`);
for (const [id, list] of Object.entries(byId)) {
  console.error(`  ${id} — ${list.length} match(es), value ${list[0].masked}`);
  for (const f of list.slice(0, 12)) console.error(`      ${f.file}:${f.line}`);
  if (list.length > 12) console.error(`      … and ${list.length - 12} more`);
}
console.error(
  "\nIf a match is public by design (a reCAPTCHA site key, a GA/GTM id), add the\n" +
    "exact value to PUBLIC_BY_DESIGN in this file AND a line to SECURITY-NOTES.md\n" +
    "saying why. Never loosen a pattern to make a finding go away."
);
process.exit(1);
