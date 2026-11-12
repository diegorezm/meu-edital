import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest(async () => ({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        bindings: {
          TEST_MIGRATIONS: await readD1Migrations("../../packages/db/migrations"),
          EMAIL_MODE: "memory",
          BETTER_AUTH_SECRET: "segredo-de-teste-com-mais-de-32-caracteres",
          // Sem Turnstile e sem Google nos testes, mesmo que o .dev.vars tenha.
          TURNSTILE_SECRET_KEY: "",
          GOOGLE_CLIENT_ID: "",
          GOOGLE_CLIENT_SECRET: "",
        },
      },
    })),
  ],
  test: {
    setupFiles: ["./tests/setup.ts"],
  },
});
