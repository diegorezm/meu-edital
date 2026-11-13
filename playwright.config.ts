import { defineConfig, devices } from "@playwright/test";

// Fluxo principal de ponta a ponta. Por padrão, contra o Worker local
// (wrangler dev); com E2E_URL, contra um ambiente publicado (ex.: preview).
const remote = process.env.E2E_URL;
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: remote ?? "http://localhost:8787", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    { name: "celular", use: { ...devices["Pixel 7"] } },
  ],
  webServer: remote
    ? undefined
    : {
    command: "bun run --cwd apps/web build && bun run --cwd apps/api dev",
    url: "http://localhost:8787/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
