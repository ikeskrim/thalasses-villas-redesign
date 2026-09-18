#!/usr/bin/env node
/**
 * PERCENT-ENCODED DUPLICATES → 301 TO THE CANONICAL SPELLING (DECISIONS.md D-028).
 *
 * The problem. The platform decodes a path before it looks for the page, so on
 * production `/en/%74he-estate`, `/en%2Fthe-estate` and `/en/the-estate%2F`
 * answered 200 with the estate page: one page at many URLs
 * (qa/security/ENCODING-tranche13.md §2). The owner ruled that such a spelling
 * answers 301 to the canonical one.
 *
 * The mechanism. One `next.config` redirect per canonical page. Its source is a
 * regex that accepts every character of the page's path OR its `%XX` escape (in
 * either hex case), `/` or `%2F`/`%2f` between segments, an optional encoded
 * trailing slash and an optional `.rsc`, and that REQUIRES at least one `%`.
 * Its destination is the page's literal path. Next runs config redirects before
 * the proxy and before the filesystem (resolve-routes.js; its proxy docs; its
 * build adapter places them ahead of middleware), and matches them against the
 * RAW path, case-insensitively — read in the source for `next start`, and
 * probed on Vercel with the legacy rules. No function runs in front of any URL,
 * so the CDN hit that D-012 and D-016 protect is untouched.
 *
 * Why a request is only redirected when decoding it ONCE gives the page: a
 * double-encoded `%2574he-estate` decodes to a string that still holds a `%`,
 * which is not the page. It stays a 404.
 *
 * Why it cannot open-redirect: the destination is a fixed literal from the page
 * inventory, and nothing from the request is substituted into it (the group is
 * unnamed, and Next removes unnamed params). Every source starts at `/` followed
 * by the page's first character or its escape, never by `/` or `%2F`, so
 * `//evil.example…` and `/%2F%2F…` never match.
 *
 * Why it cannot loop: every source requires a `%`, and no destination has one.
 * Both halves are enforced below, not assumed: a path outside
 * CANONICAL_ALLOWED is refused (a Greek-letter slug's canonical spelling itself
 * carries `%`, and would match its own rule), and every destination is run
 * through Next's own compilers against every rule before the file is written.
 * tests/security.spec.ts checks the written file the same way, and checks the
 * rule list against /sitemap.xml.
 *
 * THE PAGE INVENTORY is derived the way src/app/sitemap.ts derives it, because
 * src/lib/content.ts is `server-only` and cannot be imported here:
 *  - every non-dynamic `page.tsx` under src/app, except `/` (a path with no
 *    character to escape but its slash) — and INCLUDING `/styleguide`, which the
 *    sitemap leaves out on purpose but which serves 200 all the same;
 *  - the villa slugs of COLLECTION_VILLA_IDS (read out of src/lib/content.ts,
 *    so the list is not typed twice), from content/villas/<id>.json;
 *  - the experience slugs, from content/experiences/*.json.
 *
 * Emits src/generated/encoded-redirects.json, which next.config.ts appends to
 * the legacy list. src/generated/redirects.json is scripts/build-redirects.mjs's
 * and is not touched: tests/redirects.spec.ts drives every source in it
 * literally.
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const ROOT = process.cwd();
const APP = path.join(ROOT, "src", "app");
const CONTENT = path.join(ROOT, "content");
const OUT_DIR = path.join(ROOT, "src", "generated");
const OUT = path.join(OUT_DIR, "encoded-redirects.json");
const LEGACY = path.join(OUT_DIR, "redirects.json");

/* Lower-case ASCII letters, digits, `-` and `/`: the only characters a canonical path may hold. */
const CANONICAL_ALLOWED = /^\/[a-z0-9\-/]+$/;

function fail(message) {
  console.error(`build-encoded-redirects: ${message}`);
  process.exit(1);
}

/* ------------------------------------------------------------ inventory -- */

/**
 * Every non-dynamic `page.tsx` under src/app, as sitemap.ts walks it (no
 * exclusions). Sorted by name, so the written file is the same on every
 * filesystem.
 */
function staticRoutes() {
  const out = [];
  const walk = (dir, segments) => {
    const entries = fs
      .readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const name = entry.name;
      if (name.startsWith("[") || name.startsWith("_") || name.startsWith("(")) continue;
      const next = path.join(dir, name);
      if (fs.existsSync(path.join(next, "page.tsx"))) out.push("/" + [...segments, name].join("/"));
      walk(next, [...segments, name]);
    }
  };
  walk(APP, []);
  return out;
}

function slugOf(...segments) {
  const file = path.join(CONTENT, ...segments);
  const slug = JSON.parse(fs.readFileSync(file, "utf-8")).slug;
  if (typeof slug !== "string" || !slug) fail(`${path.relative(ROOT, file)} has no slug`);
  return slug;
}

function collectionVillaIds() {
  const text = fs.readFileSync(path.join(ROOT, "src", "lib", "content.ts"), "utf-8");
  const m = /export const COLLECTION_VILLA_IDS = (\[[^\]]*\]) as const;/.exec(text);
  if (!m)
    fail(
      "COLLECTION_VILLA_IDS not found in src/lib/content.ts: this script reads it by pattern, so update the pattern with the file"
    );
  const ids = JSON.parse(m[1]);
  if (!Array.isArray(ids) || ids.length === 0) fail("COLLECTION_VILLA_IDS is empty");
  return ids;
}

function inventory() {
  const villas = collectionVillaIds().map((id) => `/en/villas/${slugOf("villas", `${id}.json`)}`);
  const experiences = fs
    .readdirSync(path.join(CONTENT, "experiences"))
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => `/en/experiences/${slugOf("experiences", f)}`);
  return [...new Set([...staticRoutes(), ...villas, ...experiences])];
}

/* ---------------------------------------------------------------- rules -- */

const hexClass = (h) => (/[a-f]/.test(h) ? `[${h.toUpperCase()}${h}]` : h);

/** One character of a canonical path: itself or its escape, in either hex case. */
function charPattern(c) {
  if (c === "/") return "(?:/|%2[Ff])";
  const hex = c.charCodeAt(0).toString(16).padStart(2, "0");
  return `(?:${c}|%${[...hex].map(hexClass).join("")})`;
}

function ruleFor(page) {
  if (!CANONICAL_ALLOWED.test(page))
    fail(`refusing ${JSON.stringify(page)}: a canonical path must match ${CANONICAL_ALLOWED}`);
  if (page.includes("//") || page.endsWith("/"))
    fail(`refusing ${JSON.stringify(page)}: empty segment or trailing slash`);
  /* The leading `/` stays literal: it anchors the rule so no `//host` or `/%2F%2F…` spelling can match. */
  const body = [...page.slice(1)].map(charPattern).join("");
  /*
   * The tail: an encoded trailing slash, or one of the flight-data suffixes Next
   * appends to a page path — `.rsc`, and the segment-prefetch file. The
   * segment-prefetch form was measured on production (2026-09-18, after
   * c8e8858): it answered 200 on the prerendered pages, the same duplicate in
   * another shape, and 500 on /en/contact, the D-025 class in a shape the proxy
   * never sees. Both are redirected to the page; no link on the site produces
   * these URLs. The suffixes never carry a `%`, so the canonical segment path
   * cannot match this rule (the lookahead requires one).
   */
  const tail = "(?:%2[Ff])?(?:\\.rsc|\\.segments/.+\\.segment\\.rsc)?";
  return { source: `/((?=.*%)${body}${tail})`, destination: page, statusCode: 301 };
}

/* ---------------------------------------------------- the loop guard -- */

/**
 * Compiles every rule with Next's own code — the routes-manifest regex
 * (lib/build-custom-route.js, with the `(?!/_next)` guard `next build` adds)
 * under both letter-case sensitivities, and the matcher `next start` builds
 * (server/lib/router-utils/filesystem.js) — and refuses the list if any
 * destination, its `.rsc` form or its trailing-slash form matches any rule of
 * either list, or if a rule does not match its own escaped spelling.
 */
function guard(rules, legacy) {
  const require = createRequire(path.join(ROOT, "package.json"));
  const next = (p) => require(`next/dist/${p}`);
  const { buildCustomRoute } = next("lib/build-custom-route");
  const { getPathMatch } = next("shared/lib/router/utils/path-match");
  const { modifyRouteRegex } = next("lib/redirect-status");

  const compiled = [...rules, ...legacy].map((r) => {
    const regex = buildCustomRoute("redirect", r, ["/_next"]).regex;
    const runtime = getPathMatch(r.source, {
      strict: true,
      removeUnnamedParams: true,
      regexModifier: (s) => modifyRouteRegex(s, ["/_next"]),
      sensitive: undefined,
    });
    return { rule: r, matchers: [new RegExp(regex, "i"), new RegExp(regex)], runtime };
  });
  const hits = (p) =>
    compiled
      .filter((c) => c.matchers.some((m) => m.test(p)) || c.runtime(p))
      .map((c) => c.rule.source);

  const problems = [];
  for (const r of rules) {
    for (const p of [r.destination, `${r.destination}.rsc`, `${r.destination}/`, `${r.destination}.segments/_tree.segment.rsc`]) {
      const h = hits(p);
      if (h.length)
        problems.push(
          `${p} matches ${h.length} rule(s), e.g. ${h[0]}: a redirect to it would loop or chain`
        );
    }
    /*
     * The rule must catch its own page with the first character escaped, and with
     * every character escaped, and no other rule may. A rule too broad in its
     * escapes would let a fully escaped spelling match every page of the same
     * length, so both are checked.
     */
    const pct = (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`;
    const first = r.destination[1];
    const escaped = `/${pct(first)}${r.destination.slice(2)}`;
    const allEscaped = `/${[...r.destination.slice(1)].map(pct).join("")}`;
    for (const p of [escaped, allEscaped]) {
      const h = hits(p);
      if (h.length !== 1 || h[0] !== r.source)
        problems.push(`${p} matches ${h.length} rule(s); expected exactly its own`);
    }
    /* An escape that decodes to anything else — another byte, or the capital — matches no rule. */
    const wrong = [String.fromCharCode(first.charCodeAt(0) + 1)];
    if (first !== first.toUpperCase()) wrong.push(first.toUpperCase());
    for (const c of wrong) {
      const p = `/${pct(c)}${r.destination.slice(2)}`;
      const h = hits(p);
      if (h.length) problems.push(`${p} decodes to another path, but matches ${h.length} rule(s), e.g. ${h[0]}`);
    }
  }
  if (problems.length) fail(`refusing the list:\n  ${problems.join("\n  ")}`);
}

/* ----------------------------------------------------------------- main -- */

const pages = inventory();
if (pages.length < 20)
  fail(`only ${pages.length} pages found: the inventory is not looking at the site`);
const rules = pages.map(ruleFor);
const legacy = JSON.parse(fs.readFileSync(LEGACY, "utf-8")).redirects;
guard(rules, legacy);

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(
  OUT,
  JSON.stringify(
    {
      _note:
        "Generated by scripts/build-encoded-redirects.mjs (npm run redirects). One 301 per canonical page for its percent-encoded spellings (DECISIONS.md D-028). Do not edit by hand.",
      redirects: rules,
    },
    null,
    2
  ) + "\n"
);
console.log(`${rules.length} encoded-spelling redirects (301) -> ${path.relative(ROOT, OUT)}`);
