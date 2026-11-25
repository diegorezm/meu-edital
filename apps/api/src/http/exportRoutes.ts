import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { createDb, legalAcceptances, trackingConsents, user } from "@meu-edital/db";
import { exportJson, sessionsCsv, today } from "@meu-edital/domain";
import { loadAppData } from "../data/proposals";
import type { AppContext } from "../env";
import { rateLimit } from "./rateLimit";
import { requireUser } from "./session";

/** Marca de ordem de bytes: faz o Excel abrir o CSV em UTF-8. */
const BOM = String.fromCharCode(0xfeff);

/** Exportação dos dados do estudante: tudo em JSON (com conta e aceites LGPD) ou sessões em CSV. */
export const exportRoutes = new Hono<AppContext>()
  .use(requireUser, rateLimit("API_LIMITER", (c) => c.get("userId")))
  .get("/", async (c) => {
    const format = c.req.query("formato") === "csv" ? "csv" : "json";
    const db = createDb(c.env.DB);
    const userId = c.get("userId");
    const data = await loadAppData(db, userId);
    const name = `meu-edital-${today()}`;
    if (format === "csv")
      return c.body(BOM + sessionsCsv(data), 200, {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${name}-sessoes.csv"`,
      });
    const [[profile], acceptances, consents] = await db.batch([
      db
        .select({ name: user.name, email: user.email, emailVerified: user.emailVerified, createdAt: user.createdAt })
        .from(user)
        .where(eq(user.id, userId)),
      db
        .select({ document: legalAcceptances.document, version: legalAcceptances.version, acceptedAt: legalAcceptances.acceptedAt })
        .from(legalAcceptances)
        .where(eq(legalAcceptances.userId, userId))
        .orderBy(desc(legalAcceptances.acceptedAt)),
      db
        .select({
          category: trackingConsents.category,
          granted: trackingConsents.granted,
          policyVersion: trackingConsents.policyVersion,
          decidedAt: trackingConsents.decidedAt,
        })
        .from(trackingConsents)
        .where(eq(trackingConsents.userId, userId))
        .orderBy(desc(trackingConsents.decidedAt)),
    ]);
    const payload = {
      ...exportJson(data),
      conta: profile
        ? {
            nome: profile.name,
            email: profile.email,
            emailConfirmado: profile.emailVerified,
            criadoEm: profile.createdAt.getTime(),
          }
        : null,
      aceitesLegais: acceptances.map((a) => ({
        documento: a.document,
        versao: a.version,
        aceitoEm: a.acceptedAt,
      })),
      consentimentos: consents.map((row) => ({
        categoria: row.category,
        permitido: row.granted,
        versaoPolitica: row.policyVersion,
        decididoEm: row.decidedAt,
      })),
    };
    return c.body(JSON.stringify(payload, null, 2), 200, {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${name}.json"`,
    });
  });
