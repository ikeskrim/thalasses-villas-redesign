import { defineConfig, devices } from "@playwright/test";

/**
 * THE 3D ESTATE MAP'S OWN HARNESS — `npm run qa:estate3d`.
 *
 * The public build keeps the 3D map closed until `content/estate-plan.json` is
 * owner-verified (DECISIONS.md D-021), and `npm run qa` tests that build, the
 * closed gate included. The diagram itself is tested here, against the local
 * review build `scripts/estate3d-preview.mjs` makes: a separate distDir, a
 * separate port, and a visible "unverified" band.
 *
 * Build it first — `npm run build:estate3d` — the same way `npm run qa` expects
 * `npm run build` to have run.
 */
const PORT = 3035;

export default defineConfig({
  testDir: "./tests",
  testMatch: /estate-3d-preview\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "off",
    screenshot: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node scripts/estate3d-preview.mjs start",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
