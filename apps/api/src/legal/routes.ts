import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { z } from "zod";
import { createDb } from "@meu-edital/db";
import type { AppContext } from "../env";
import { clientIp, rateLimit } from "../http/rateLimit";
import { requireUser } from "../http/session";
import { acceptancesData } from "./acceptances";
import { trackingData } from "./tracking";
import { currentVersion, LEGAL_DOCUMENT_NAMES, type LegalDocument } from "./documents";
import { jsonBody } from "../http/validate";

const TrackingSchema = z.strictObject({ erros: z.boolean(), analise: z.boolean() });

const AcceptSchema = z.strictObject({
  documents: z
    .array(z.strictObject({ document: z.enum(LEGAL_DOCUMENT_NAMES as [LegalDocument]), version: z.string().max(20) }))
    .min(1)
    .max(LEGAL_DOCUMENT_NAMES.length),
});

/**
 * Bloqueia as rotas de dados até a pessoa aceitar as versões vigentes dos
 * termos e da privacidade. Vem depois de `requireUser`. Exportar os dados e
 * excluir a conta continuam liberados (direitos do titular).
 */
export const requireConsent = createMiddleware<AppContext>(async (c, next) => {
  const pending = await acceptancesData(createDb(c.env.DB), c.get("userId")).pending();
  if (pending.length > 0)
    return c.json(
      { error: "Aceite os termos atualizados para continuar.", code: "consent_required", pending },
      409,
    );
  await next();
});

/** Versões vigentes (público) e o aceite do usuário. */
export const legalRoutes = new Hono<AppContext>()
  .get("/", (c) =>
    c.json({
      documents: LEGAL_DOCUMENT_NAMES.map((document) => ({
        document,
        ...currentVersion(document),
      })),
    }),
  )
  .use("/aceite", requireUser, rateLimit("API_LIMITER", (c) => c.get("userId")))
  .get("/aceite", async (c) => {
    const data = acceptancesData(createDb(c.env.DB), c.get("userId"));
    return c.json({ pending: await data.pending(), history: await data.history() });
  })
  .post("/aceite", jsonBody(AcceptSchema, "Aceite inválido."), async (c) => {
    const parsed = c.req.valid("json");
    const ok = await acceptancesData(createDb(c.env.DB), c.get("userId")).accept(parsed.documents, {
      ip: clientIp(c),
      userAgent: c.req.header("user-agent"),
      secret: c.env.BETTER_AUTH_SECRET,
    });
    if (!ok) return c.json({ error: "Essa versão não é a atual. Recarregue a página." }, 409);
    return c.json({ ok: true });
  })
  .use("/rastreamento", requireUser, rateLimit("API_LIMITER", (c) => c.get("userId")))
  .get("/rastreamento", async (c) =>
    c.json({ saved: await trackingData(createDb(c.env.DB), c.get("userId")).latest() }),
  )
  .post("/rastreamento", jsonBody(TrackingSchema, "Escolha inválida."), async (c) => {
    const parsed = c.req.valid("json");
    await trackingData(createDb(c.env.DB), c.get("userId")).save(parsed);
    return c.json({ ok: true });
  });
