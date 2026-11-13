import { and, eq, max } from "drizzle-orm";
import { type Db, legalAcceptances } from "@meu-edital/db";
import { uid } from "@meu-edital/domain";
import { currentVersion, type LegalDocument, pendingDocuments } from "./documents";

/** SHA-256 do IP com um segredo: identifica o aceite sem guardar o IP. */
async function hashIp(ip: string, secret: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${secret}:${ip}`));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Aceites de um usuário. Sempre filtrado pelo `userId` da sessão. */
export function acceptancesData(db: Db, userId: string) {
  const latest = async () => {
    const rows = await db
      .select({ document: legalAcceptances.document, version: max(legalAcceptances.version) })
      .from(legalAcceptances)
      .where(eq(legalAcceptances.userId, userId))
      .groupBy(legalAcceptances.document);
    return Object.fromEntries(rows.map((r) => [r.document, r.version ?? undefined])) as Partial<
      Record<LegalDocument, string>
    >;
  };

  return {
    latest,
    pending: async () => pendingDocuments(await latest()),

    /** Registra o aceite das versões vigentes. Recusa versão que não é a atual. */
    async accept(
      items: { document: LegalDocument; version: string }[],
      meta: { ip: string; userAgent: string | undefined; secret: string },
    ) {
      if (items.some((item) => item.version !== currentVersion(item.document).version)) return false;
      const ipHash = await hashIp(meta.ip, meta.secret);
      const acceptedAt = Date.now();
      for (const item of items) {
        const [already] = await db
          .select({ id: legalAcceptances.id })
          .from(legalAcceptances)
          .where(
            and(
              eq(legalAcceptances.userId, userId),
              eq(legalAcceptances.document, item.document),
              eq(legalAcceptances.version, item.version),
            ),
          );
        if (already) continue;
        await db.insert(legalAcceptances).values({
          id: uid(),
          userId,
          document: item.document,
          version: item.version,
          acceptedAt,
          ipHash,
          userAgent: meta.userAgent?.slice(0, 300) ?? null,
        });
      }
      return true;
    },

    /** Histórico para a tela de Privacidade. */
    history: () =>
      db
        .select({
          document: legalAcceptances.document,
          version: legalAcceptances.version,
          acceptedAt: legalAcceptances.acceptedAt,
        })
        .from(legalAcceptances)
        .where(eq(legalAcceptances.userId, userId))
        .orderBy(legalAcceptances.acceptedAt),
  };
}
