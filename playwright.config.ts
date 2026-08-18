import { defineConfig, devices } from "@playwright/test";

/**
 * QA harness.
 *
 * RUN IT SHARDED — `npm run qa` — not as a single `playwright test`.
 * Every route here is a page over twenty thousand pixels tall carrying up to a
 * hundred and forty photographs, and roughly a hundred and twenty of them in
 * one worker exhausts the machine. The suite then dies with an aborted worker
 * and no failure message, which is indistinguishable from flakiness and is
 * nothing of the kind. Three shards, run in sequence, each in its own process.
 *
 * Two jobs, both of which a clean `next build` demonstrably fails to catch:
 *  - qa:overflow — asserts document.scrollWidth === clientWidth at every
 *    breakpoint. The Clause tail is allowed to overrun its section, and the
 *    only thing standing between that and a horizontal page scroll is a single
 *    `overflow: hidden` on .clause-field.
 *  - parity — asserts the rendered page against the content inventory. A
 *    four-cell Collection passed typecheck, lint AND build (T-169); only a
 *    render assertion catches that class of bug.
 */
const PORT = 3005;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "test-results/results.json" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "off",
    screenshot: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
