#!/usr/bin/env node
/**
 * THE PERCENT-ENCODING TABLE — one class of URL, four routes, every spelling.
 *
 *   node scripts/encoding-table.mjs <origin> [--out <file.md>]
 *
 * `/en/%63ontact` returned 500 on Vercel while `next start` returned 404
 * (SECURITY-NOTES.md §4.1). One bad URL is an anecdote. This asks the question
 * as a class (DECISIONS.md D-021): for each of four routes — the one page
 * rendered per request (/en/contact), a prerendered page (/en/the-estate), and
 * two statically generated templates (a villa, an experience) — what does the
 * deployment answer for each way of percent-encoding the same path?
 *
 * Requests go out through node:http(s) with the path exactly as written, because
 * a URL object or fetch() may normalise an escape before it leaves the machine,
 * which would test a different URL from the one in the table.
 *
 * Per row: status, the page the platform matched (x-matched-path, when sent),
 * content type, the number of raw Content-Security-Policy header LINES (not a
 * folded value), body bytes, and the region hops in x-vercel-id.
 */
import fs from "node:fs";
import http from "node:http";
import https from "node:https";

const args = process.argv.slice(2);
const origin = (args[0] ?? "").replace(/\/+$/, "");
const outIdx = args.indexOf("--out");
const out = outIdx >= 0 ? args[outIdx + 1] : null;
if (!/^https?:\/\//.test(origin)) {
  console.error("usage: node scripts/encoding-table.mjs <origin> [--out <file.md>]");
  process.exit(2);
}

const ROUTES = ["/en/contact", "/en/the-estate", "/en/villas/villa-thoi", "/en/experiences/boat-trip"];

const hex = (ch) => "%" + ch.charCodeAt(0).toString(16).padStart(2, "0");

/** Every spelling of one route, each with a name saying what was encoded. */
function spellings(route) {
  const parts = route.split("/"); // ["", "en", ..., last]
  const last = parts[parts.length - 1];
  const prefix = parts.slice(0, -1).join("/");
  const withLast = (s) => `${prefix}/${s}`;
  /* A character whose escape contains a hex LETTER, so upper- and lower-case escapes differ. */
  const i = [...last].findIndex((c) => /[a-f]/i.test(c.charCodeAt(0).toString(16)));
  const at = i >= 0 ? i : 0;
  const esc = hex(last[at]);
  const lastEsc = (e) => last.slice(0, at) + e + last.slice(at + 1);
  const first = hex(last[0]);
  return [
    { name: "plain", path: route },
    { name: "first letter, %XX", path: withLast(first + last.slice(1)) },
    { name: "hex letter, lower-case escape", path: withLast(lastEsc(esc.toLowerCase())) },
    { name: "hex letter, upper-case escape", path: withLast(lastEsc("%" + esc.slice(1).toUpperCase())) },
    { name: "locale segment encoded", path: route.replace(/^\/en\//, `/${hex("e")}n/`) },
    { name: "%2F between segments", path: `${prefix}%2F${last}` },
    { name: "encoded trailing slash", path: `${route}%2F` },
    { name: "%2e segment", path: `${prefix}/%2e/${last}` },
    { name: "%2e%2e segment", path: `${prefix}/x/%2e%2e/${last}` },
    { name: "double-encoded (%25XX)", path: withLast(`%25${first.slice(1)}${last.slice(1)}`) },
    { name: "trailing %20", path: `${route}%20` },
    { name: "appended %C3%A9", path: `${route}%C3%A9` },
    { name: "locale upper-case", path: route.replace(/^\/en\//, "/EN/") },
    { name: "first letter encoded + .rsc", path: withLast(first + last.slice(1)) + ".rsc" },
    { name: "first letter encoded, RSC header", path: withLast(first + last.slice(1)), headers: { RSC: "1" } },
  ];
}

function get(path, headers = {}) {
  const u = new URL(origin);
  const lib = u.protocol === "https:" ? https : http;
  return new Promise((resolve) => {
    const req = lib.request(
      { host: u.hostname, port: u.port || undefined, path, method: "GET", headers: { "user-agent": "thalasses-encoding-table", ...headers } },
      (res) => {
        let bytes = 0;
        res.on("data", (c) => (bytes += c.length));
        res.on("end", () => {
          const raw = res.rawHeaders;
          let csp = 0;
          for (let k = 0; k < raw.length; k += 2) if (raw[k].toLowerCase() === "content-security-policy") csp++;
          const id = String(res.headers["x-vercel-id"] ?? "");
          resolve({
            status: res.statusCode,
            matched: String(res.headers["x-matched-path"] ?? "–"),
            type: String(res.headers["content-type"] ?? "–").split(";")[0],
            csp,
            bytes,
            hops: id ? id.split("::").slice(0, -1).join("::") : "–",
          });
        });
      }
    );
    req.on("error", (e) => resolve({ status: "ERR", matched: e.code ?? e.message, type: "–", csp: 0, bytes: 0, hops: "–" }));
    req.end();
  });
}

const lines = [
  `# Percent-encoding table — ${origin}`,
  "",
  `Run ${new Date().toISOString()} with \`node scripts/encoding-table.mjs\`. Paths are sent exactly as written.`,
  "",
  "| route | spelling | path sent | status | matched page | type | CSP lines | bytes | region hops |",
  "|---|---|---|---|---|---|---|---|---|",
];
for (const route of ROUTES) {
  for (const s of spellings(route)) {
    const r = await get(s.path, s.headers);
    lines.push(
      `| \`${route}\` | ${s.name}${s.headers ? " (RSC: 1)" : ""} | \`${s.path}\` | ${r.status} | \`${r.matched}\` | ${r.type} | ${r.csp} | ${r.bytes} | ${r.hops} |`
    );
  }
}
const md = lines.join("\n") + "\n";
if (out) fs.writeFileSync(out, md);
process.stdout.write(md);
