import type { NextConfig } from "next";

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
