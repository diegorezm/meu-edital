import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";
import { addDays, emptyData, recordSession, startExam, today } from "@meu-edital/domain";
import { diffData } from "@meu-edital/sync";
import { sendDueReviewReminders } from "../src/push/reminders";
import { call, verifiedUser } from "./helpers";

const b64url = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

/** Chaves de verdade: a do servidor (VAPID) e a de um navegador assinante. */
async function keys() {
  const vapid = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);
  const browser = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const raw = await crypto.subtle.exportKey("raw", (browser as CryptoKeyPair).publicKey);
  return {
    vapidJwk: JSON.stringify(await crypto.subtle.exportKey("jwk", (vapid as CryptoKeyPair).privateKey)),
    p256dh: b64url(raw as ArrayBuffer),
    auth: b64url(crypto.getRandomValues(new Uint8Array(16))),
  };
}

afterEach(() => vi.restoreAllMocks());

describe("Web Push", () => {
  it("guarda a assinatura só para o dono e apaga sob pedido", async () => {
    const ana = await verifiedUser();
    const bia = await verifiedUser();
    const { p256dh, auth } = await keys();
    const endpoint = "https://push.exemplo.com/ana-1";
    expect((await call("/api/push/assinatura", { cookie: ana.cookie, body: { endpoint, keys: { p256dh, auth } } })).status).toBe(200);
    // Bia não consegue apagar a assinatura da Ana.
    await call("/api/push/assinatura", { method: "DELETE", cookie: bia.cookie, body: { endpoint } });
    const left = await env.DB.prepare("select user_id from push_subscriptions where endpoint = ?").bind(endpoint).first<{ user_id: string }>();
    expect(left?.user_id).toBe(ana.userId);
    await call("/api/push/assinatura", { method: "DELETE", cookie: ana.cookie, body: { endpoint } });
    expect(await env.DB.prepare("select 1 from push_subscriptions where endpoint = ?").bind(endpoint).first()).toBeNull();
    expect((await call("/api/push/assinatura", { body: { endpoint, keys: { p256dh, auth } } })).status).toBe(401);
  });

  it("o lembrete diário avisa quem tem revisão vencida e limpa assinatura expirada", async () => {
    const student = await verifiedUser();
    const exam = startExam(emptyData(), { name: "TRT", hoursPerWeek: 10, subjects: [{ name: "Português", topics: ["Crase"] }] });
    const topic = exam.topics[0];
    const studied = recordSession(
      exam,
      { examId: exam.activeExamId!, subjectId: topic.subjectId, topicId: topic.id, type: "Teoria", minutes: 30 },
      addDays(today(), -1),
    );
    await call("/api/sync/push", { body: { mutations: diffData(emptyData(), studied) }, cookie: student.cookie });

    const { vapidJwk, p256dh, auth } = await keys();
    await call("/api/push/assinatura", { cookie: student.cookie, body: { endpoint: "https://push.exemplo.com/ok", keys: { p256dh, auth } } });
    await call("/api/push/assinatura", { cookie: student.cookie, body: { endpoint: "https://push.exemplo.com/expirou", keys: { p256dh, auth } } });

    const sent: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input instanceof Request ? input.url : input);
      sent.push(url);
      return new Response(null, { status: url.endsWith("expirou") ? 410 : 201 });
    });
    const notified = await sendDueReviewReminders({ ...env, VAPID_PRIVATE_KEY: vapidJwk });
    expect(notified).toBeGreaterThanOrEqual(1);
    expect(sent).toContain("https://push.exemplo.com/ok");
    expect(await env.DB.prepare("select 1 from push_subscriptions where endpoint = ?").bind("https://push.exemplo.com/expirou").first()).toBeNull();
  });

  it("recusa agendar fim de bloco no passado", async () => {
    const { cookie } = await verifiedUser();
    const response = await call("/api/push/fim-de-bloco", { cookie, body: { endsAt: Date.now() - 1000, subject: "Português" } });
    expect(response.status).toBe(400);
    const ok = await call("/api/push/fim-de-bloco", { cookie, body: { endsAt: Date.now() + 60_000, subject: "Português" } });
    expect(ok.status).toBe(200);
    expect((await call("/api/push/fim-de-bloco", { method: "DELETE", cookie })).status).toBe(200);
  });
});
