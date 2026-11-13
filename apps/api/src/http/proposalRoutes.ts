import { Hono } from "hono";
import { z } from "zod";
import { ProposalInputSchema } from "@meu-edital/agent-context";
import { createDb } from "@meu-edital/db";
import { ProposalError, proposalsData } from "../data/proposals";
import type { AppContext } from "../env";
import { rateLimit } from "./rateLimit";
import { requireUser } from "./session";
import { requireConsent } from "../legal/routes";
import { jsonBody } from "./validate";

const StatusSchema = z.strictObject({ status: z.enum(["aplicada", "descartada"]) });

/** Caixa de propostas para o app: listar, enviar resposta colada, aplicar ou descartar. */
export const proposalRoutes = new Hono<AppContext>()
  .use(requireUser, requireConsent, rateLimit("API_LIMITER", (c) => c.get("userId")))
  .get("/", async (c) => {
    const data = proposalsData(createDb(c.env.DB), c.get("userId"));
    return c.json({ proposals: await data.pending() });
  })
  .post("/", jsonBody(ProposalInputSchema, "A resposta não está no formato esperado."), async (c) => {
    const parsed = c.req.valid("json");
    try {
      const proposal = await proposalsData(createDb(c.env.DB), c.get("userId")).create(parsed, {
        source: "colar",
        author: "Resposta colada",
      });
      return c.json({ proposal }, 201);
    } catch (error) {
      if (error instanceof ProposalError) return c.json({ error: error.message }, 422);
      throw error;
    }
  })
  .post("/:id/status", jsonBody(StatusSchema, "Status inválido."), async (c) => {
    const parsed = c.req.valid("json");
    const ok = await proposalsData(createDb(c.env.DB), c.get("userId")).setStatus(
      c.req.param("id"),
      parsed.status,
    );
    return ok ? c.json({ ok: true }) : c.json({ error: "Proposta não encontrada." }, 404);
  });
