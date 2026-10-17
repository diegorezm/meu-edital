import { defineConfig, envField } from "astro/config";

// Site estático de divulgação. O app (dashboard) fica em outro endereço,
// definido por PUBLIC_APP_URL no build.
export default defineConfig({
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
