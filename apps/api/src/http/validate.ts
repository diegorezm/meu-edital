import { zValidator } from "@hono/zod-validator";
import type { ZodType } from "zod";

/** Valida o corpo JSON; se não bater, responde 400 com a mensagem amigável. */
export const jsonBody = <T extends ZodType>(schema: T, error: string) =>
  zValidator("json", schema, (result, c) => {
    if (!result.success) return c.json({ error }, 400);
  });
