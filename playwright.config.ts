import { defineConfig, devices } from "@playwright/test";

/* E2E + accessibility + layout checks against the production build (`pnpm build` first).
   PW_BASE_URL reuses an already running server; otherwise `next start -p 3100` is launched. */
const baseURL = process.env.PW_BASE_URL ?? "http://localhost:3100";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL, trace: "retain-on-failure" },
  webServer: process.env.PW_BASE_URL
    ? undefined
    : { command: "pnpm start -p 3100", url: baseURL, reuseExistingServer: true, timeout: 120_000 },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /layout|a11y|navigation/ },
    { name: "firefox", use: { ...devices["Desktop Firefox"], viewport: { width: 1440, height: 900 } }, testMatch: /smoke/ },
    { name: "webkit", use: { ...devices["Desktop Safari"], viewport: { width: 1440, height: 900 } }, testMatch: /smoke/ },
  ],
});
