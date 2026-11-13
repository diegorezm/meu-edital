import { defineConfig } from "astro/config";

// Site de divulgação: HTML estático, sem lógica de app.
export default defineConfig({
  output: "static",
  build: { format: "directory" },
});
