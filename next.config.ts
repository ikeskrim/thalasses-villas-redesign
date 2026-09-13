import type { NextConfig } from "next";

import generated from "./src/generated/redirects.json";

/**
 * RESPONSE HEADERS — `SECURITY-NOTES.md` §4 has the reasoning and the deferrals.
 *
 * The policy can be strict everywhere except scripts and styles because the
 * site loads nothing from anywhere else: fonts and images are self-hosted,
 * booking is an outbound link rather than an embed, and there is no analytics,
 * map or video frame.
 *
 * `'unsafe-inline'` on script-src is the one real concession, and it is not an
 * oversight. Next inlines its flight data and React its streaming scripts, and
 * on statically prerendered pages those differ per page and per build, so they
 * cannot be hashed in a config file. The alternative is a per-request nonce,
 * which makes every page dynamic — no CDN-cached HTML, and a slower first byte
 * for a guest on a Cretan mobile connection. That trade is deferred, not
 * ignored. style-src needs it for the inline `style` attributes next/image and
 * the motion libraries write.
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

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
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
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
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
