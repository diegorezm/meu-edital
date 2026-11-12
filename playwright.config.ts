import { defineConfig, devices } from "@playwright/test";

// Fluxo principal de ponta a ponta contra o Worker local (wrangler dev), que
// serve o build do app web e a API na mesma origem.
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: "http://localhost:8787", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    { name: "celular", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "bun run --cwd apps/web build && bun run --cwd apps/api dev",
    url: "http://localhost:8787/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
