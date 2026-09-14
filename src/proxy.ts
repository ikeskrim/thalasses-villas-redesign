import { NextResponse, type NextRequest } from "next/server";

/**
 * A PER-REQUEST NONCE POLICY FOR THE CONTACT PAGE — `SECURITY-NOTES.md` §4.
 *
 * The site-wide policy in next.config.ts keeps `'unsafe-inline'` on script-src
 * because most routes are prerendered: their inline flight scripts are written
 * at build time, when there is no request to carry a nonce, and a nonce would
 * mean giving up that prerendered HTML. /en/contact is not one of them. It reads
 * `searchParams`, so Next already renders it on every request — it is absent
 * from the build's prerender manifest and is served `Cache-Control: private,
 * no-store`. Here a nonce costs nothing the page was not already paying.
 *
 * WHAT IT PROTECTS, EXACTLY. A policy belongs to a document, so the nonce policy
 * is in force when /en/contact is loaded AS a document: a direct visit, a
 * reload, the legacy-URL 301, or a plain `<a>` (the homepage's enquiry buttons,
 * the error page). The site's own `next/link` CTAs — Weddings, each experience,
 * each villa's "Enquire" — are client-side navigations: the document stays the
 * page the guest landed on, with the static policy, and the contact page renders
 * inside it under that policy. The reverse holds too — a guest who lands here
 * and navigates on keeps this policy on every page they open client-side.
 *
 * The mechanism is the one Next 16.3.5 documents
 * (`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`).
 * The policy is set on the REQUEST as well as the response, because the request
 * is where the renderer looks: `getScriptNonceFromHeader` reads `'nonce-…'` out
 * of its script-src and stamps it on Next's own scripts — the chunk and polyfill
 * tags, the inline flight data, React's streaming scripts. No component renders
 * a `<Script>` of its own, so the docs' `x-nonce` header would be read by nobody
 * and is not set; it is the first thing to add the day one does.
 *
 * `'strict-dynamic'` lets the nonced runtime load the chunks it needs without
 * listing them, and `'self'` stays for browsers that predate it. Every other
 * directive is next.config.ts's, word for word — tests/security.spec.ts and
 * scripts/check-headers.mjs compare the two, so they cannot drift apart
 * unnoticed. style-src keeps `'unsafe-inline'`: next/image and the motion
 * libraries write `style` ATTRIBUTES, which no nonce can cover, and a nonce in
 * style-src would switch `'unsafe-inline'` off for them.
 *
 * No `'unsafe-eval'` in development, unlike the docs' example. The static policy
 * has none either, and a dev server that refuses what production refuses is the
 * point of running one under the policy.
 */
function policy(scriptSrc: string): string {
  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    // A YouTube embed needs its host here AND in next.config.ts — see there.
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export function proxy(request: NextRequest) {
  /*
   * The matcher below admits more than the page (see there), and next.config.ts
   * sends no policy on anything it admits, so every response from here must
   * carry one. Only the page itself gets the nonce. Everything else the matcher
   * admits — a case variant, `/en/contact.html`, `/en/contact/x` — is a 404 page
   * (all of them were, on the 56cb859 build), and this branch sets no nonce on
   * the request, so Next renders that page without one; a nonce policy on it
   * would refuse every one of its scripts. It gets the static policy, like every
   * other 404. Non-document requests — the page's `.rsc`, a segment prefetch, a
   * `_next/data` URL — take whichever branch their `nextUrl.pathname` selects
   * (Next strips a trailing `.rsc` first: server/web/adapter.js,
   * normalizeRscURL); a browser enforces neither policy on those.
   */
  if (request.nextUrl.pathname !== "/en/contact") {
    const response = NextResponse.next();
    response.headers.set("Content-Security-Policy", policy("script-src 'self' 'unsafe-inline'"));
    return response;
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = policy(`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

/**
 * THE CONTACT PATH IN EVERY SPELLING NEXT COULD SEND HERE — and the same
 * fragment, character for character, is the exclusion in next.config.ts's
 * STATIC_CSP_SOURCE. The two sets are one set by construction, so a request gets
 * its CSP from exactly one of the two places:
 *
 *  - Character classes, not letters. Next matches header sources
 *    case-insensitively (path-to-regexp `sensitive: false`,
 *    server/lib/router-utils/filesystem.js) and compiles this matcher into a
 *    case-SENSITIVE RegExp (shared/lib/router/utils/middleware-route-matcher.js).
 *    With a plain `/en/contact`, `/EN/contact` was excluded from the static
 *    policy and not matched here, and went out with none.
 *  - `(?:[./].*)?` absorbs every suffix Next appends to a matcher (`.json`,
 *    `.rsc`, `.segments/….segment.rsc`) and every other one: `/en/contact.html`
 *    and `/en/contact/x` used to get no policy either.
 *  - The `_next/data/<id>/` prefix Next prepends is spelled out too, so the
 *    config excludes it as well: `/_next/data/<id>/en/contact.json` used to get
 *    both.
 *
 * One asymmetry is left, and it is Next's: this matcher is also tried against
 * the percent-DECODED path, while header sources see the raw one. So
 * `/en/%63ontact` matches both; its `nextUrl.pathname` is not `/en/contact`, so
 * the branch above sends the static policy — the same policy twice at worst.
 *
 * The docs' example skips prefetch requests. Not here: next.config.ts sends no
 * policy on these paths, so a request the proxy skipped would go out with none.
 *
 * `node scripts/check-headers.mjs --compile` runs both patterns through Next's
 * own compilers over the spellings above; `node scripts/check-headers.mjs <url>`
 * counts the raw header lines a deployment actually sends.
 */
export const config = {
  matcher:
    "/:contact((?:_[nN][eE][xX][tT]/[dD][aA][tT][aA]/[^/]+/)*[eE][nN]/[cC][oO][nN][tT][aA][cC][tT](?:[./].*)?)",
};
