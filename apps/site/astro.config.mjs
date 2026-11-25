import { defineConfig } from "astro/config";

// Site de divulgação: HTML estático, sem lógica de app.
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || "https://meu-edital-site.diegommrez12.workers.dev",
  output: "static",
  build: { format: "directory" },
});
