import type { NextConfig } from "next";

import generated from "./src/generated/redirects.json";

/**
 * RESPONSE HEADERS — `SECURITY-NOTES.md` §4 has the reasoning and the deferrals.
 *
 * The policy can be strict everywhere except scripts and styles because the
 * site loads nothing from anywhere else: fonts and images are self-hosted,
 * booking is an outbound link rather than an embed, and there is no analytics,
 * map or video frame. `frame-src 'none'` means exactly that. A YouTube embed,
 * if one is ever built, needs `https://www.youtube-nocookie.com` here AND in
 * src/proxy.ts, and the no-frame guard in tests/security.spec.ts turned into a
 * host check at the same time — markup changed alone gets a frame the browser
 * refuses to load.
 *
 * `'unsafe-inline'` on script-src is the one real concession, and it is not an
 * oversight. Next inlines its flight data and React its streaming scripts, and
 * on statically prerendered pages those are written at build time and differ
 * per page and per build, so they cannot be hashed in a config file —
 * `experimental.sri` hashes the external chunks only. The alternative is a
 * per-request nonce, which needs a per-request render: on a prerendered route
 * that means giving up the prerendered HTML. That trade is deferred, not
 * ignored, and its cost has not been measured. style-src needs
 * `'unsafe-inline'` for the inline `style` attributes next/image and the motion
 * libraries write.
 *
 * THE EXCEPTION IS /en/contact. It reads `searchParams`, so it is rendered per
 * request already and a nonce costs it nothing: src/proxy.ts sends the strict
 * variant there when the page is loaded as a document. This file's CSP stays
 * off every spelling of that path the proxy's matcher admits, and the proxy
 * sends the static policy on the ones that are not the page
 * (STATIC_CSP_SOURCE).
 *
 * No `upgrade-insecure-requests`: HSTS already forces HTTPS in production, and
 * the directive would break the site on `http://localhost` for every test run.
 * HSTS has no `preload`: submitting the owner's domain to the browser preload
 * list binds every subdomain to HTTPS for years and is the owner's call at
 * launch (DECISIONS.md D-013).
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/**
 * Every path src/proxy.ts's matcher does NOT admit. The lookahead is that
 * matcher's fragment character for character — the contact path in any letter
 * case, with any `.…` or `/…` tail and any `_next/data/<id>/` prefix — and
 * src/proxy.ts sends a policy on everything it admits, so a request gets its CSP
 * from exactly one of the two places. The reasons for each part of the fragment
 * are at the matcher.
 *
 * Why it matters: without the carve-out the contact page would get this policy
 * from here and the nonce policy from the proxy under the same header name.
 * `next start` would hide that — config headers and proxy headers are collected
 * under differently-cased keys (server/lib/router-utils/resolve-routes.js) and
 * Node's case-insensitive `setHeader` lets the proxy's overwrite this one — so a
 * one-header check on a local build cannot fail either way. What a platform that
 * appends instead would send is measured, not assumed:
 * `node scripts/check-headers.mjs <deployment url>` counts raw header lines, and
 * `--compile` checks the partition with Next's own route compilers.
 *
 * The one known overlap is Next's, not the pattern's: the proxy is also matched
 * against the percent-decoded path, so `/en/%63ontact` matches both, and the
 * proxy sends it this same static policy (src/proxy.ts).
 */
const STATIC_CSP_SOURCE =
  "/((?!(?:_[nN][eE][xX][tT]/[dD][aA][tT][aA]/[^/]+/)*[eE][nN]/[cC][oO][nN][tT][aA][cC][tT](?:[./].*)?$).*)";

const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

/**
 * Legacy URL migration lives in content/url-map.md and is wired up in Phase 5.
 * Images are served from the local pool in public/images — nothing is hotlinked
 * from the old Loggia CDN, so no remotePatterns are needed.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  /**
   * `.next` for every real build. `scripts/estate3d-preview.mjs` builds the 3D
   * estate map's local review copy into `.next-estate3d`, so it can be served on
   * its own port beside the build `npm run qa` tests without overwriting it.
   */
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // NOTE: `experimental.viewTransition` was tried here and this Next version
  // rejects it as an invalid key — there is no such option in its config
  // schema. The route wipe is therefore a controlled overlay
  // (components/motion/RouteTransition.tsx) rather than the native API. When
  // the flag exists, delete the overlay and the ::view-transition-* rules in
  // direction-d.css take over unchanged.
  /**
   * The 301 map, DERIVED from content/url-map.md by scripts/build-redirects.mjs
   * rather than typed here. The map is the Phase 0 record of every legacy URL
   * and the document the owner edits; a hand-copied list would be a second
   * source that drifts from it silently. `npm run redirects` regenerates.
   *
   * Verified end to end by tests/redirects.spec.ts, which drives every legacy
   * URL through the built app and asserts the status and the target. That
   * harness is the pre-DNS gate in LAUNCH.md — a redirect map nobody exercised
   * is a migration that loses its rankings.
   */
  async redirects() {
    return generated.redirects;
  },
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      {
        source: STATIC_CSP_SOURCE,
        headers: [{ key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY }],
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Matches the breakpoints in DESIGN-PLAN.md (360 / 768 / 1024 / 1440 / 1920).
    deviceSizes: [360, 640, 768, 1024, 1280, 1440, 1920, 2560],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Next 16 rejects any quality not declared here with a 400.
    // 82 for full-bleed photography, 80 for bounded frames, 75 for thumbnails.
    qualities: [75, 80, 82],
  },
};

export default nextConfig;
