import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const dir = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// Em desenvolvimento, /api vai para o Worker local (`wrangler dev`, porta 8787).
// Publicado, o app e a API dividem a mesma origem.
export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@features": dir("./src/features"),
      "@global": dir("./src/global"),
      "@platform": dir("./src/platform"),
    },
  },
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:8787" },
  },
});
