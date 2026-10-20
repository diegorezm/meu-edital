import { defineConfig, envField } from "astro/config";

// Site estático de divulgação, publicado no GitHub Pages em
// https://diegorezm.github.io/meu-edital/. O app (dashboard) fica em outro
// endereço, definido por PUBLIC_APP_URL no build.
export default defineConfig({
  site: "https://diegorezm.github.io",
  base: "/meu-edital",
  env: {
    schema: {
      PUBLIC_APP_URL: envField.string({
        context: "client",
        access: "public",
        default: "http://localhost:8081",
      }),
    },
  },
});
