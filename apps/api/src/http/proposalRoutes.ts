import { Hono } from "hono";
import { z } from "zod";
import { ProposalInputSchema } from "@meu-edital/agent-context";
import { createDb } from "@meu-edital/db";
import { ProposalError, proposalsData } from "../data/proposals";
import type { AppContext } from "../env";
import { rateLimit } from "./rateLimit";
import { requireUser } from "./session";

const StatusSchema = z.strictObject({ status: z.enum(["aplicada", "descartada"]) });

/** Caixa de propostas para o app: listar, enviar resposta colada, aplicar ou descartar. */
export const proposalRoutes = new Hono<AppContext>()
  .use(requireUser, rateLimit("API_LIMITER", (c) => c.get("userId")))
  .get("/", async (c) => {
    const data = proposalsData(createDb(c.env.DB), c.get("userId"));
    return c.json({ proposals: await data.pending() });
  })
  .post("/", async (c) => {
    const parsed = ProposalInputSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "A resposta não está no formato esperado." }, 400);
    try {
      const proposal = await proposalsData(createDb(c.env.DB), c.get("userId")).create(parsed.data, {
        source: "colar",
        author: "Resposta colada",
      });
      return c.json({ proposal }, 201);
    } catch (error) {
      if (error instanceof ProposalError) return c.json({ error: error.message }, 422);
      throw error;
    }
  })
  .post("/:id/status", async (c) => {
    const parsed = StatusSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "Status inválido." }, 400);
    const ok = await proposalsData(createDb(c.env.DB), c.get("userId")).setStatus(
      c.req.param("id"),
      parsed.data.status,
    );
    return ok ? c.json({ ok: true }) : c.json({ error: "Proposta não encontrada." }, 404);
  });
