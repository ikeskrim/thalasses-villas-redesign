#!/usr/bin/env node
/**
 * Parse content/url-map.md into a redirect table.
 *
 * DERIVED, not typed. The map is the Phase 0 record of every legacy URL and it
 * is the document the owner and I both edit; a hand-copied redirect list would
 * be a second source that drifts from it silently. Same resolution as the
 * inclusions count: when two things can disagree, make one compute from the
 * other.
 *
 * Emits src/generated/redirects.json, which next.config.ts reads.
 */
import fs from "node:fs";
import path from "node:path";

const MAP = path.join(process.cwd(), "content", "url-map.md");
const OUT_DIR = path.join(process.cwd(), "src", "generated");
const OUT = path.join(OUT_DIR, "redirects.json");

const rows = fs
  .readFileSync(MAP, "utf-8")
  .split("\n")
  .filter((l) => l.trim().startsWith("|"))
  .map((l) => l.split("|").map((c) => c.trim()))
  .filter((c) => c.length > 4);

const clean = (s) => s.replace(/^`|`$/g, "").trim();
const redirects = [];
const skipped = [];

for (const cells of rows) {
  const [, legacy, , target, type] = cells;
  const from = clean(legacy);
  const to = clean(target);

  // A row is only installable if BOTH cells are literal paths. The map also
  // carries template rows (`/en/property/<id>/map`) and rows whose destination
  // cell is prose explaining a special case. Next rejects the whole config if
  // one placeholder gets through — `destination has segments not in source` —
  // so they are filtered here and REPORTED rather than silently dropped: a
  // legacy URL that quietly failed to get a redirect is a lost ranking.
  const literal = (v) => /^\/[A-Za-z0-9\-._~/#]*$/.test(v);
  if (!from.startsWith("/") || from === "Legacy URL") continue;

  // A FRAGMENT IS NEVER SENT TO THE SERVER. Rows like
  // `/en/index-1.htm#category571 -> /en/experiences` describe an anchor on the
  // old single-page homepage, and no server redirect can honour them: the
  // browser sends `/en/index-1.htm` and keeps `#category571` to itself. Left
  // installed they silently collapse onto the homepage rule and the harness
  // catches them pointing at `/`. They belong in the launch runbook as
  // client-side handling, not here.
  if (from.includes("#")) {
    skipped.push({ from, to, why: "source is a fragment; a server redirect cannot see it (handle client-side)" });
    continue;
  }
  if (!literal(from) || !literal(to)) {
    skipped.push({
      from,
      to: to.slice(0, 60),
      why: !literal(from) ? "source is a template or not a literal path" : "destination is a template or prose",
    });
    continue;
  }
  // `/` cannot redirect to `/en` here: this build serves the English site AT
  // the root, so that row of the map describes the legacy site's own duplicate,
  // not a redirect we should install. Installing it would loop.
  if (from === "/") {
    skipped.push({ from, to, why: "root is served directly in this build; installing it would loop" });
    continue;
  }
  const permanent = !type || type.includes("301");
  // Next normalises a trailing slash BEFORE the redirect table runs, so a
  // source of `/en/` never matches — the request has already become `/en`.
  // Normalise here so the rule is written against what actually arrives.
  const source = from.length > 1 ? from.replace(/\/+$/, "") : from;
  redirects.push({ source, destination: to === "/en" ? "/" : to, permanent });
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ redirects, skipped }, null, 2) + "\n");
console.log(`${redirects.length} redirects, ${skipped.length} skipped -> ${path.relative(process.cwd(), OUT)}`);
for (const s of skipped) console.log(`  skipped ${s.from} -> ${s.to}  (${s.why})`);
