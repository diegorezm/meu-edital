import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { emptyData, startExam } from "@meu-edital/domain";
import { diffData } from "@meu-edital/sync";
import worker from "../src/index";
import { call, verifiedUser } from "./helpers";

const ORIGIN = env.APP_URL;
const REDIRECT = "http://localhost:9999/callback";

async function fetchWorker(path: string, init: RequestInit = {}) {
  const ctx = createExecutionContext();
  // Uma requisição de verdade sempre traz Host; a montada à mão, não.
  const headers = new Headers(init.headers);
  headers.set("host", new URL(ORIGIN).host);
  const request = new Request(`${ORIGIN}${path}`, { redirect: "manual", ...init, headers });
  const response = await worker.fetch(request, env, ctx);
  await waitOnExecutionContext(ctx);
  return response;
}

const b64url = (bytes: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const cookieHeader = (...responses: Response[]) =>
  responses
    .flatMap((r) => r.headers.getSetCookie())
    .map((c) => c.split(";")[0])
    .join("; ");

async function studentWithExam() {
  const student = await verifiedUser();
  const data = startExam(emptyData(), {
    name: "TRT",
    hoursPerWeek: 10,
    subjects: [{ name: "Português", topics: ["Crase"] }, { name: "Informática" }],
  });
  await call("/api/sync/push", { body: { mutations: diffData(emptyData(), data) }, cookie: student.cookie });
  return student;
}

/** Faz o fluxo OAuth inteiro como um cliente MCP faria e devolve o token. */
async function connect(cookie: string) {
  const registered = await fetchWorker("/oauth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ redirect_uris: [REDIRECT], client_name: "Claude", token_endpoint_auth_method: "none" }),
  });
  expect(registered.status).toBe(201);
  const { client_id } = (await registered.json()) as { client_id: string };

  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)).buffer);
  const challenge = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  const query = new URLSearchParams({
    response_type: "code",
    client_id,
    redirect_uri: REDIRECT,
    scope: "estudo:ler estudo:propor",
    state: "estado-123",
    code_challenge: challenge,
    code_challenge_method: "S256",
    resource: `${ORIGIN}/mcp`,
  });

  const anonymous = await fetchWorker(`/authorize?${query}`);
  expect(anonymous.status).toBe(302);
  expect(anonymous.headers.get("location")).toMatch(/^\/entrar\?volta=/);

  const authorize = await fetchWorker(`/authorize?${query}`, { headers: { cookie } });
  expect(authorize.status).toBe(302);
  const consentUrl = new URL(authorize.headers.get("location")!, ORIGIN);
  expect(consentUrl.pathname).toBe("/oraculo/conectar");
  expect(consentUrl.searchParams.get("cliente")).toBe("Claude");
  expect(consentUrl.searchParams.get("escopos")).toBe("estudo:ler estudo:propor");

  const consent = await fetchWorker("/oauth/consent", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: `${cookie}; ${cookieHeader(authorize)}`, origin: ORIGIN },
    body: JSON.stringify({ handle: consentUrl.searchParams.get("handle"), decision: "permitir" }),
  });
  expect(consent.status).toBe(200);
  const { redirectTo } = (await consent.json()) as { redirectTo: string };
  const back = new URL(redirectTo);
  expect(back.searchParams.get("state")).toBe("estado-123");

  const token = await fetchWorker("/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: back.searchParams.get("code")!,
      redirect_uri: REDIRECT,
      client_id,
      code_verifier: verifier,
      resource: `${ORIGIN}/mcp`,
    }),
  });
  expect(token.status).toBe(200);
  return ((await token.json()) as { access_token: string }).access_token;
}

type ToolCallResult = {
  tools: { name: string }[];
  content: { type: string; text: string }[];
  isError?: boolean;
};

let rpcId = 0;
async function mcp(token: string, method: string, params: unknown = {}) {
  const response = await fetchWorker("/mcp", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: (rpcId += 1), method, params }),
  });
  const raw = await response.text();
  // Pode vir como JSON ou como um evento SSE com o JSON em `data:`.
  const json = raw.trim().startsWith("{") ? raw : raw.split("\n").find((l) => l.startsWith("data:"))?.slice(5) ?? "{}";
  return { status: response.status, body: JSON.parse(json) as { result: ToolCallResult; error?: unknown } };
}

describe("Oráculo por MCP", () => {
  it("conecta por OAuth, lê o contexto e propõe sem alterar os dados", async () => {
    const student = await studentWithExam();
    const token = await connect(student.cookie);

    const tools = await mcp(token, "tools/list");
    expect(tools.status).toBe(200);
    expect(tools.body.result.tools.map((t: { name: string }) => t.name).sort()).toEqual([
      "contexto_de_estudo",
      "propor_alteracoes",
    ]);

    const context = await mcp(token, "tools/call", { name: "contexto_de_estudo", arguments: {} });
    const parsed = JSON.parse(context.body.result.content[0].text);
    expect(parsed.exam.name).toBe("TRT");
    expect(JSON.stringify(parsed)).not.toContain(student.userId);

    const proposal = await mcp(token, "tools/call", {
      name: "propor_alteracoes",
      arguments: { motivo: "Português pesa mais.", alteracoes: [{ op: "setSubjectWeight", subject: "Português", weight: 3 }] },
    });
    expect(proposal.body.result.isError).toBeFalsy();
    expect(proposal.body.result.content[0].text).toMatch(/caixa do Oráculo/);

    const inbox = await call("/api/proposals", { cookie: student.cookie });
    const { proposals } = (await inbox.json()) as { proposals: { author: string; source: string; reason: string }[] };
    expect(proposals).toHaveLength(1);
    expect(proposals[0]).toMatchObject({ author: "Claude", source: "mcp", reason: "Português pesa mais." });

    // A proposta não mexeu em nada: o peso continua o de antes.
    const pulled = await call("/api/sync/pull?since=0", { cookie: student.cookie });
    const rows = ((await pulled.json()) as { changes: { table: string; row: { weight?: number } }[] }).changes;
    expect(rows.filter((r) => r.table === "subjects").every((r) => r.row.weight === undefined)).toBe(true);
  });

  it("recusa proposta que cita matéria inexistente, com o motivo para a IA", async () => {
    const student = await studentWithExam();
    const token = await connect(student.cookie);
    const result = await mcp(token, "tools/call", {
      name: "propor_alteracoes",
      arguments: { motivo: "x", alteracoes: [{ op: "setSubjectWeight", subject: "Biologia", weight: 2 }] },
    });
    expect(result.body.result.isError).toBe(true);
    expect(result.body.result.content[0].text).toMatch(/Não encontramos a matéria/);
  });

  it("sem token não entra, e revogar a conexão derruba o token", async () => {
    expect((await fetchWorker("/mcp", { method: "POST" })).status).toBe(401);
    const student = await studentWithExam();
    const token = await connect(student.cookie);
    const list = await call("/api/oraculo/conexoes", { cookie: student.cookie });
    const { connections } = (await list.json()) as { connections: { id: string; name: string }[] };
    expect(connections).toHaveLength(1);
    expect(connections[0].name).toBe("Claude");
    await call(`/api/oraculo/conexoes/${connections[0].id}`, { method: "DELETE", cookie: student.cookie });
    expect((await mcp(token, "tools/list")).status).toBe(401);
  });

  it("um estudante não vê nem revoga conexões de outro", async () => {
    const ana = await studentWithExam();
    const bia = await studentWithExam();
    await connect(ana.cookie);
    const biaList = await call("/api/oraculo/conexoes", { cookie: bia.cookie });
    expect(((await biaList.json()) as { connections: unknown[] }).connections).toEqual([]);
  });
});

describe("caixa de propostas", () => {
  it("recebe resposta colada, marca como aplicada e isola usuários", async () => {
    const ana = await studentWithExam();
    const bia = await studentWithExam();
    const created = await call("/api/proposals", {
      cookie: ana.cookie,
      body: {
        reason: "Revisão da semana",
        payload: { kind: "changes", changes: [{ op: "setHoursPerWeek", hours: 15 }] },
      },
    });
    expect(created.status).toBe(201);
    const { proposal } = (await created.json()) as { proposal: { id: string; source: string } };
    expect(proposal.source).toBe("colar");

    const foreign = await call(`/api/proposals/${proposal.id}/status`, { cookie: bia.cookie, body: { status: "aplicada" } });
    expect(foreign.status).toBe(404);
    expect(((await (await call("/api/proposals", { cookie: bia.cookie })).json()) as { proposals: unknown[] }).proposals).toEqual([]);

    const applied = await call(`/api/proposals/${proposal.id}/status`, { cookie: ana.cookie, body: { status: "aplicada" } });
    expect(applied.status).toBe(200);
    expect(((await (await call("/api/proposals", { cookie: ana.cookie })).json()) as { proposals: unknown[] }).proposals).toEqual([]);
  });

  it("recusa formato inválido e proposta grande demais", async () => {
    const student = await studentWithExam();
    const bad = await call("/api/proposals", { cookie: student.cookie, body: { reason: "x", payload: { kind: "apagar" } } });
    expect(bad.status).toBe(400);
    const huge = await call("/api/proposals", {
      cookie: student.cookie,
      body: {
        reason: "x",
        payload: {
          kind: "syllabus",
          syllabus: {
            exam: "TRT",
            role: "Técnico",
            subjects: Array.from({ length: 80 }, (_, i) => ({
              name: `Matéria ${i}`,
              topics: Array.from({ length: 10 }, (_, j) => ({ name: `Assunto ${j} `.repeat(20) })),
            })),
          },
        },
      },
    });
    expect(huge.status).toBe(422);
  });
});
