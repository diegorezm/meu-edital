import { defineConfig } from "drizzle-kit";

// Só gera os arquivos SQL. Quem aplica as migrações no D1 é o Wrangler
// (`wrangler d1 migrations apply`), que lê esta mesma pasta.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema.ts",
  out: "./migrations",
});
