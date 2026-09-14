/**
 * CHECK-HEADERS — does every response carry exactly one Content-Security-Policy,
 * and the right one? `SECURITY-NOTES.md` §4.1.
 *
 * WHY A SCRIPT, AND NOT ONLY tests/security.spec.ts. Two places can emit a CSP:
 * next.config.ts's headers() (the static policy) and src/proxy.ts (the nonce
 * policy on /en/contact, the static one on the other spellings its matcher
 * admits). They are meant never to overlap, but `next start` cannot show it if
 * they do: resolve-routes.js collects config headers and proxy headers under
 * differently-cased keys, and router-server.js writes them with Node's
 * case-insensitive `res.setHeader`, so the proxy's value silently replaces the
 * config's and the response carries one either way. A one-header assertion on a
 * local build therefore catches a MISSING policy and never a DOUBLED one. What a
 * hosting platform does when both apply — replace, or append a second line — is
 * not something this repository can read out of Next's source, so it is
 * measured.
 *
 *   node scripts/check-headers.mjs --compile
 *     No network, no build. Reads STATIC_CSP_SOURCE out of next.config.ts and
 *     the matcher and nonce branch out of src/proxy.ts, compiles them with Next's
 *     own code — the header matcher `next start` builds
 *     (server/lib/router-utils/filesystem.js), the routes-manifest regex
 *     (lib/build-custom-route.js) and the proxy regexp
 *     (build/analysis/get-page-static-info.js) — and checks that every one of
 *     some thirty thousand spellings of a path gets its policy from exactly one
 *     place. It also checks the manifest regexes under both letter-case
 *     sensitivities, for a platform that applies them the other way. This is a
 *     model of Next's routing, not a request: it proves the two patterns
 *     partition the paths, not that a server sends what they say.
 *
 *   node scripts/check-headers.mjs <baseUrl>
 *     GETs each entry in ENTRIES from a running server with node:http/https,
 *     follows no redirect, and counts raw header lines (`res.rawHeaders`) — what
 *     the server wrote, before any client library folds two lines into one
 *     comma-joined value. Against `next start` this can show a missing policy or
 *     the wrong one; against the Vercel deployment it is the only thing here that
 *     can show a doubled one.
 *
 * Exit status 0 only if every check passes. It writes nothing; redirect stdout to
 * keep the record under qa/security/.
 */
import { readFileSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const STATIC_SCRIPT_SRC = "script-src 'self' 'unsafe-inline'";
/* The nonce pattern Next reads the header with (server/app-render/get-script-nonce-from-header). */
const NONCE_SCRIPT_SRC = /^script-src 'self' 'nonce-([A-Za-z0-9+/_-]+={0,2})' 'strict-dynamic'$/;
const OTHER_SECURITY_HEADERS = [
  "strict-transport-security",
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "cross-origin-opener-policy",
];

/**
 * What each URL must get. `static` and `nonce` name the policy; `one` accepts
 * either — for requests that are not documents (RSC payloads, a pages-router
 * data URL), where a browser enforces neither and the only fault is none or two.
 * `redirect` judges the status and the Location when the entry names them, and
 * never the headers: a 3xx body is never rendered. Any response of 500 or more
 * fails, whatever the entry expects.
 *
 * The contact spellings are the ones src/proxy.ts's matcher admits besides the
 * page. Before the matcher took every letter case and every `.…`/`/…` tail, the
 * config excluded them and the proxy did not match them, so they got no policy;
 * `/_next/data/<id>/en/contact.json` got both.
 */
const ENTRIES = [
  { path: "/", expect: "static", status: 200 },
  { path: "/en/villas/villa-thoi", expect: "static", status: 200 },
  { path: "/en/the-estate", expect: "static", status: 200 },
  { path: "/en/experiences", expect: "static", status: 200 },
  { path: "/en/weddings", expect: "static", status: 200 },
  { path: "/en/gallery", expect: "static", status: 200 },
  { path: "/en/contact", expect: "nonce", status: 200, body: true },
  { path: "/en/contact", expect: "nonce", status: 200, body: true, note: "second fetch: the nonce must differ" },
  { path: "/en/contact?enquiry=estate", expect: "nonce", status: 200 },
  /*
   * No bare `RSC: 1` request: against `next start` on this Next version one is
   * answered 307 (measured on the 56cb859 build), so it would test a redirect.
   */
  { path: "/en/contact.rsc", expect: "one" },
  { path: "/en/contact.segments/_tree.segment.rsc", expect: "one" },
  { path: "/_next/data/check-headers/en/contact.json", expect: "one" },
  { path: "/en/contact.html", expect: "static" },
  { path: "/en/contact.txt", expect: "static" },
  { path: "/en/contact.check-headers", expect: "static" },
  { path: "/en/contact/x", expect: "static" },
  { path: "/EN/contact", expect: "static" },
  { path: "/en/Contact", expect: "static" },
  { path: "/en/contacts", expect: "static" },
  { path: "/en/no-such-page", expect: "static" },
  /*
   * THE CONTACT PATH, PERCENT-ENCODED (qa/security/ENCODING-tranche13.md). Every
   * spelling that decodes to the page returned 500 on Vercel; src/proxy.ts now
   * sends it to the literal page, flight-data forms included (the proxy answers
   * before Next's 307 for a bare `RSC: 1`). A deployment without that change
   * fails these entries: record the failure, never weaken the entry.
   */
  { path: "/en/%63ontact", expect: "redirect", status: 308, location: "/en/contact" },
  { path: "/en/c%6Fntact?enquiry=estate", expect: "redirect", status: 308, location: "/en/contact?enquiry=estate" },
  { path: "/%65n/contact", expect: "redirect", status: 308, location: "/en/contact" },
  { path: "/en%2Fcontact", expect: "redirect", status: 308, location: "/en/contact" },
  { path: "/en/contact%2F", expect: "redirect", status: 308, location: "/en/contact" },
  { path: "/en/%63ontact.rsc", expect: "redirect", status: 308, location: "/en/contact" },
  { path: "/en/%63ontact", headers: { RSC: "1" }, expect: "redirect", status: 308, location: "/en/contact" },
  /* Not the class, so not redirected. The proxy is also matched against the decoded path, header sources against the raw one: both apply, both static. */
  { path: "/en/%63ontact.html", expect: "static", allowIdenticalDuplicate: true },
  { path: "/en/%2563ontact", expect: "static", status: 404 },
  { path: "/en/%74he-estate", expect: "static" },
  { path: "/en/contact/", expect: "redirect" },
];

function directives(csp) {
  return Object.fromEntries(
    csp
      .split(";")
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => [d.split(/\s+/)[0], d]),
  );
}

function kindOf(csp) {
  const scriptSrc = directives(csp)["script-src"] ?? "";
  if (scriptSrc === STATIC_SCRIPT_SRC) return { kind: "static" };
  const m = NONCE_SCRIPT_SRC.exec(scriptSrc);
  return m ? { kind: "nonce", nonce: m[1] } : { kind: "other" };
}

function withoutScriptSrc(csp) {
  return Object.entries(directives(csp))
    .filter(([name]) => name !== "script-src")
    .map(([, text]) => text)
    .join("; ");
}

/* ---------------------------------------------------------------- --compile */

function literal(file, pattern, what) {
  const text = readFileSync(path.join(ROOT, file), "utf8");
  const m = pattern.exec(text);
  if (!m) throw new Error(`${what} not found in ${file}: this script reads it by pattern, so update the pattern with the file`);
  return JSON.parse(m[1]);
}

function* spellings() {
  const prefixes = ["", "_next/data/b1/", "_NEXT/data/b1/", "_next/DATA/x/_next/data/y/", "x/", "_next/data/"];
  const locales = ["en", "EN", "eN", "En", "e", "enn", "%65n"];
  const seps = ["/", "//"];
  const pages = ["contact", "Contact", "CONTACT", "contacts", "contac", "cont%61ct", "contact%2Ehtml", "the-estate"];
  const tails = ["", "/", ".", ".rsc", ".RSC", ".json", ".JSON", ".html", ".txt", ".segments/_tree.segment.rsc", ".segments/a/b.segment.rsc", "/x", "/x/", "-x", "s"];
  for (const pre of prefixes)
    for (const loc of locales)
      for (const sep of seps)
        for (const page of pages) for (const tail of tails) yield `/${pre}${loc}${sep}${page}${tail}`;
  /* And unstructured ones, from a fixed seed so a failure reproduces. */
  const toks = ["en", "EN", "contact", "Contact", ".", "/", "rsc", "json", "segments", "segment", "_tree", "_next", "data", "DATA", "x", "html", "%63ontact", "%2E", "-"];
  let s = 0x2545f491;
  const rnd = () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return s >>> 0;
  };
  for (let i = 0; i < 20000; i++) {
    let p = "/";
    for (let k = 1 + (rnd() % 9); k > 0; k--) p += toks[rnd() % toks.length];
    yield p;
  }
}

function compile() {
  const configText = readFileSync(path.join(ROOT, "next.config.ts"), "utf8");
  if (/caseSensitiveRoutes/.test(configText)) {
    throw new Error("next.config.ts sets caseSensitiveRoutes: this model assumes header sources match case-insensitively");
  }
  const staticSource = literal("next.config.ts", /const STATIC_CSP_SOURCE =\s*("(?:[^"\\]|\\.)*");/, "STATIC_CSP_SOURCE");
  const matcher = literal("src/proxy.ts", /matcher:\s*("(?:[^"\\]|\\.)*")/, "config.matcher");
  const noncePath = literal("src/proxy.ts", /nextUrl\.pathname !== ("(?:[^"\\]|\\.)*")/, "the nonce branch");

  const require = createRequire(import.meta.url);
  const next = (p) => require(path.join(ROOT, "node_modules/next/dist", p));
  const { getPathMatch } = next("shared/lib/router/utils/path-match");
  const { modifyRouteRegex } = next("lib/redirect-status");
  const { buildCustomRoute } = next("lib/build-custom-route");
  const { getMiddlewareMatchers } = next("build/analysis/get-page-static-info");

  /* Exactly as filesystem.js builds a header route for `next start` (caseSensitiveRoutes unset). */
  let runtimeRegex = "";
  const headerMatch = getPathMatch(staticSource, {
    strict: true,
    removeUnnamedParams: true,
    regexModifier: (r) => (runtimeRegex = modifyRouteRegex(r)),
    sensitive: undefined,
  });
  const manifestRegex = buildCustomRoute("header", { source: staticSource, headers: [{ key: "Content-Security-Policy", value: "-" }] }).regex;
  const proxyRegexp = getMiddlewareMatchers([matcher], { basePath: "", i18n: null })[0].regexp;
  const proxy = new RegExp(proxyRegexp);

  console.log(`STATIC_CSP_SOURCE      ${staticSource}`);
  console.log(`proxy matcher          ${matcher}`);
  console.log(`header regex (runtime) ${runtimeRegex}`);
  console.log(`header regex (manifest) ${manifestRegex}`);
  console.log(`proxy regexp           ${proxyRegexp}`);
  console.log(`nonce branch pathname  ${noncePath}\n`);

  /* What `next start` sends for a raw pathname, per the compiled patterns and src/proxy.ts's branch. */
  function sentByNext(p) {
    let decoded = p;
    try {
      decoded = decodeURIComponent(p);
    } catch {
      /* undecodable: Next matches the raw path only */
    }
    const byConfig = !!headerMatch(p);
    const proxiedRaw = proxy.test(p);
    const proxied = proxiedRaw || proxy.test(decoded);
    /*
     * What the proxy sees as nextUrl.pathname. A trailing `.rsc` is stripped
     * (server/web/adapter.js, normalizeRscURL), and a data URL is parsed before
     * the proxy runs (NextURL with parseData, get-next-pathname-info.js): the
     * `/_next/data/<id>` prefix and the `.json` suffix come off, so
     * `/_next/data/<id>/en/contact.json` reaches the nonce branch.
     */
    let nextPathname = p;
    const data = /^\/_next\/data\/[^/]+(\/.*)\.json$/.exec(nextPathname);
    if (data) nextPathname = data[1];
    nextPathname = nextPathname.replace(/\.rsc$/, "");
    const proxyKind = nextPathname === noncePath ? "nonce" : "static";
    const sent = [...(byConfig ? ["static"] : []), ...(proxied ? [proxyKind] : [])];
    const decodedOnlyDuplicate = sent.length === 2 && !proxiedRaw && sent.every((k) => k === "static");
    return { sent, ok: sent.length === 1 || decodedOnlyDuplicate, decodedOnlyDuplicate };
  }

  let failures = 0;
  const fail = (msg) => {
    failures++;
    if (failures <= 25) console.log(`FAIL ${msg}`);
  };

  for (const e of ENTRIES) {
    if (e.expect === "redirect") continue;
    const pathname = e.path.split("?")[0];
    const { sent, ok } = sentByNext(pathname);
    const want =
      e.expect === "one"
        ? ok && sent.length === 1
        : e.allowIdenticalDuplicate
          ? ok && sent.every((k) => k === e.expect)
          : sent.length === 1 && sent[0] === e.expect;
    console.log(`${want ? "ok  " : "FAIL"} ${pathname.padEnd(44)} ${sent.join(" + ") || "(none)"}  [expect ${e.expect}]`);
    if (!want) failures++;
  }

  const seen = new Set();
  let proxied = 0;
  let duplicates = 0;
  const models = [
    ["manifest regex /i, proxy regexp case-sensitive", "i", ""],
    ["manifest regex case-sensitive, proxy regexp case-sensitive", "", ""],
    ["manifest regex /i, proxy regexp /i", "i", "i"],
    ["manifest regex case-sensitive, proxy regexp /i", "", "i"],
  ].map(([name, cf, pf]) => ({ name, config: new RegExp(manifestRegex, cf), proxy: new RegExp(proxyRegexp, pf), bad: 0 }));
  for (const p of spellings()) {
    if (seen.has(p)) continue;
    seen.add(p);
    const r = sentByNext(p);
    if (r.sent.includes("nonce") || r.sent.length === 2 || (r.sent.length === 1 && !headerMatch(p))) proxied++;
    if (r.decodedOnlyDuplicate) duplicates++;
    if (!r.ok) fail(`${p} gets ${r.sent.length === 0 ? "no policy" : r.sent.join(" + ")} under next start`);
    /* A platform matching raw paths only, with either letter-case sensitivity on either pattern. */
    for (const m of models) {
      if (m.config.test(p) === m.proxy.test(p)) {
        m.bad++;
        fail(`${p} gets ${m.config.test(p) ? "both" : "neither"} under "${m.name}"`);
      }
    }
  }
  console.log(`\n${seen.size} distinct spellings; ${proxied} reach the proxy under next start; ${duplicates} match both only because the proxy also tries the percent-decoded path (the same static policy twice at most)`);
  for (const m of models) console.log(`  raw-path model "${m.name}": ${m.bad} overlap(s) or gap(s)`);
  console.log(failures === 0 ? "\nPASS: every spelling gets its policy from exactly one place" : `\nFAIL: ${failures} problem(s)`);
  return failures === 0;
}

/* ------------------------------------------------------------------ network */

function get(base, entry) {
  return new Promise((resolve, reject) => {
    const lib = base.protocol === "https:" ? https : http;
    const req = lib.request(
      {
        protocol: base.protocol,
        hostname: base.hostname,
        port: base.port || undefined,
        path: `${base.pathname.replace(/\/$/, "")}${entry.path}`,
        method: "GET",
        headers: { accept: "text/html,*/*;q=0.8", "user-agent": "thalasses-check-headers", ...(entry.headers ?? {}) },
        timeout: 30_000,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => {
          if (entry.body) chunks.push(c);
        });
        res.on("end", () => resolve({ status: res.statusCode ?? 0, raw: res.rawHeaders, body: Buffer.concat(chunks).toString("utf8") }));
        res.on("error", reject);
      },
    );
    req.on("timeout", () => req.destroy(new Error("timed out after 30s")));
    req.on("error", reject);
    req.end();
  });
}

async function network(baseArg) {
  const base = new URL(baseArg);
  console.log(`check-headers ${base.origin}${base.pathname === "/" ? "" : base.pathname} at ${new Date().toISOString()}\n`);
  let failures = 0;
  let reference = null;
  const contactNonces = [];

  for (const e of ENTRIES) {
    const label = `${e.path}${e.headers ? ` (${Object.entries(e.headers).map(([k, v]) => `${k}: ${v}`).join(", ")})` : ""}`;
    let res;
    try {
      res = await get(base, e);
    } catch (err) {
      failures++;
      console.log(`FAIL ${label}: ${err.message}`);
      continue;
    }
    const lines = {};
    for (let i = 0; i < res.raw.length; i += 2) (lines[res.raw[i].toLowerCase()] ??= []).push(res.raw[i + 1]);
    const csp = lines["content-security-policy"] ?? [];
    const kinds = csp.map(kindOf);
    const problems = [];

    /* A server error fails every entry, whatever it expects: /en/%63ontact was a 500 on Vercel while a policy-only check passed it. */
    if (res.status >= 500) {
      failures++;
      console.log(`FAIL ${res.status} ${label.padEnd(48)} CSP lines: ${csp.length}\n     a ${res.status} fails every entry`);
      continue;
    }

    /*
     * A 3xx's headers are reported, not judged: a redirect's body is never
     * rendered, and platforms vary in what they add to one. Its status and its
     * Location are judged when the entry names them — the Location resolved
     * against the checked origin, so a relative one and a same-origin absolute
     * one both pass and any other origin fails. An entry that expects a rendered
     * response still fails on a redirect.
     */
    if (e.expect === "redirect" || (res.status >= 300 && res.status <= 399)) {
      const sent = lines.location?.[0];
      if (e.expect === "redirect" && (res.status < 300 || res.status > 399)) problems.push(`expected a redirect, got ${res.status}`);
      if (e.expect !== "redirect") problems.push(`expected a ${e.expect} policy on a rendered response, got a ${res.status} redirect`);
      if (e.expect === "redirect" && e.status && res.status !== e.status) problems.push(`status ${res.status}, expected ${e.status}`);
      if (e.expect === "redirect" && e.location !== undefined) {
        let resolved = null;
        try {
          resolved = sent === undefined ? null : new URL(sent, base);
        } catch {
          /* reported below */
        }
        if (!resolved) problems.push(`Location ${sent ?? "(none)"}, expected ${e.location}`);
        else if (resolved.origin !== base.origin || `${resolved.pathname}${resolved.search}` !== e.location) problems.push(`Location ${sent}, expected ${e.location} on ${base.origin}`);
      }
      console.log(`${problems.length ? "FAIL" : e.status || e.location ? "PASS" : "info"} ${res.status} ${label.padEnd(48)} → ${sent ?? "-"}  CSP lines: ${csp.length} (a redirect is not rendered; headers not judged)${problems.length ? `\n     ${problems.join("\n     ")}` : ""}`);
      failures += problems.length ? 1 : 0;
      continue;
    }
    if (res.status === 401 || res.status === 403) problems.push(`${res.status}: deployment protection? The check needs the public response`);
    if (e.status && res.status !== e.status) problems.push(`status ${res.status}, expected ${e.status}`);

    if (e.allowIdenticalDuplicate) {
      if (csp.length === 0) problems.push("no Content-Security-Policy line");
      if (new Set(csp).size > 1) problems.push(`${csp.length} different policies`);
    } else if (csp.length !== 1) {
      problems.push(`${csp.length} Content-Security-Policy lines, expected exactly 1`);
    }
    for (const k of kinds) {
      if (k.kind === "other") problems.push("a policy whose script-src is neither the static nor the nonce form");
      else if (e.expect !== "one" && k.kind !== e.expect) problems.push(`a ${k.kind} policy, expected ${e.expect}`);
    }

    if (e.path === "/" && csp.length === 1 && kinds[0].kind === "static") reference = withoutScriptSrc(csp[0]);
    if (!reference) problems.push("no reference policy: the first entry, /, must return exactly one static policy");
    else for (const c of csp) if (withoutScriptSrc(c) !== reference) problems.push("directives other than script-src differ from /'s policy");

    for (const h of OTHER_SECURITY_HEADERS) if (!lines[h]) problems.push(`no ${h}`);

    if (e.expect === "nonce" && kinds.length === 1 && kinds[0].nonce) {
      if (!e.headers && e.path === "/en/contact") contactNonces.push(kinds[0].nonce);
      if (e.body) {
        const tags = res.body.match(/<script\b[^>]*>/g) ?? [];
        const unstamped = tags.filter((t) => /\bnonce="([^"]*)"/.exec(t)?.[1] !== kinds[0].nonce);
        if (tags.length === 0) problems.push("no <script> tags in the body: the check would prove nothing");
        if (unstamped.length) problems.push(`${unstamped.length} of ${tags.length} <script> tags lack the header's nonce`);
      }
    }

    const extra = Object.entries(lines)
      .filter(([name, v]) => OTHER_SECURITY_HEADERS.includes(name) && v.length > 1)
      .map(([name, v]) => `${name}×${v.length}`);
    console.log(
      `${problems.length ? "FAIL" : "PASS"} ${res.status} ${label.padEnd(48)} CSP lines: ${csp.length} ${kinds.map((k) => k.kind).join("+") || "-"}${extra.length ? `  (repeated: ${extra.join(", ")})` : ""}${e.note ? `  — ${e.note}` : ""}${problems.length ? `\n     ${problems.join("\n     ")}` : ""}`,
    );
    if (problems.length) failures++;
  }

  if (contactNonces.length >= 2 && new Set(contactNonces).size !== contactNonces.length) {
    failures++;
    console.log("FAIL the same nonce was sent on two requests to /en/contact");
  }
  console.log(failures === 0 ? "\nPASS: every response carries exactly the policy it should" : `\nFAIL: ${failures} response(s) with problems`);
  return failures === 0;
}

const arg = process.argv[2];
if (!arg) {
  console.error("usage: node scripts/check-headers.mjs --compile | <baseUrl>");
  process.exit(2);
}
const passed = arg === "--compile" ? compile() : await network(arg);
process.exit(passed ? 0 : 1);
