import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { pendingDocuments } from "../src/legal/documents";
import { acceptLegal, call, verifiedUser } from "./helpers";

describe("aceite dos termos e da privacidade", () => {
  it("bloqueia as rotas de dados até aceitar, mas libera exportação e perfil", async () => {
    const { cookie, ip } = await verifiedUser(undefined, { accept: false });

    const blocked = await call("/api/sync/pull?since=0", { cookie });
    expect(blocked.status).toBe(409);
    expect(await blocked.json()).toMatchObject({ code: "consent_required" });
    expect((await call("/api/proposals", { cookie })).status).toBe(409);

    expect((await call("/api/export", { cookie })).status).toBe(200);
    const me = (await (await call("/api/me", { cookie })).json()) as { legalPending: unknown[] };
    expect(me.legalPending).toHaveLength(2);

    expect((await acceptLegal({ cookie }, ip)).status).toBe(200);
    expect((await call("/api/sync/pull?since=0", { cookie })).status).toBe(200);
    const after = (await (await call("/api/me", { cookie })).json()) as { legalPending: unknown[] };
    expect(after.legalPending).toEqual([]);
  });

  it("recusa versão que não é a vigente", async () => {
    const { cookie } = await verifiedUser(undefined, { accept: false });
    const response = await call("/api/legal/aceite", {
      cookie,
      body: { documents: [{ document: "termos", version: "2000-01-01" }] },
    });
    expect(response.status).toBe(409);
  });

  it("guarda o IP só como hash e não duplica aceite", async () => {
    const { cookie, userId, ip } = await verifiedUser(undefined, { accept: false });
    await acceptLegal({ cookie }, ip);
    await acceptLegal({ cookie }, ip);
    const { results } = await env.DB.prepare("select ip_hash from legal_acceptances where user_id = ?")
      .bind(userId)
      .all<{ ip_hash: string }>();
    expect(results).toHaveLength(2);
    expect(results[0]!.ip_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("só mostra o histórico do próprio usuário", async () => {
    const ana = await verifiedUser();
    const bia = await verifiedUser(undefined, { accept: false });
    const own = (await (await call("/api/legal/aceite", { cookie: bia.cookie })).json()) as {
      history: unknown[];
    };
    expect(own.history).toEqual([]);
    expect((await call("/api/legal/aceite")).status).toBe(401);
    expect(ana.userId).not.toBe(bia.userId);
  });
});

describe("pendingDocuments", () => {
  it("pede só o que tem mudança material desde o último aceite", () => {
    expect(pendingDocuments({}).map((p) => p.first)).toEqual([true, true]);
    expect(pendingDocuments({ termos: "2026-11-13", privacidade: "2026-11-13" })).toEqual([]);
    expect(pendingDocuments({ termos: "2026-11-13" }).map((p) => p.document)).toEqual(["privacidade"]);
  });
});
