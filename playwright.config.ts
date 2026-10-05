import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./web/browser-tests",
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
    launchOptions: process.env.NILLS_CHROME_PATH
      ? { executablePath: process.env.NILLS_CHROME_PATH }
      : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    command: "bun run dev -- --port 5173 --strictPort",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
  },
});
