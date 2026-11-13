import {
  OfflineError,
  type PullResponse,
  type PushResponse,
  type SyncNotice,
  type Transport,
} from "@meu-edital/sync";
import { apiFetch, apiUrl, sessionToken } from "../http";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await apiFetch(`/api/sync${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...init?.headers },
    });
  } catch (cause) {
    throw new OfflineError(cause);
  }
  // Gateway fora do ar ou limite de requisições: tenta de novo mais tarde.
  if (response.status === 429 || response.status >= 502) throw new OfflineError(response.status);
  if (!response.ok) throw new Error(`Sync falhou: ${response.status}`);
  return response.json() as Promise<T>;
}

export const httpTransport: Transport = {
  push: (body) =>
    request<PushResponse>("/push", { method: "POST", body: JSON.stringify(body) }),
  pull: (since) => request<PullResponse>(`/pull?since=${since}`),
};

/**
 * Escuta os avisos de "versão nova" do servidor e chama `onNotice`.
 * Reconecta sozinho, com espera crescente, e para com `close()`.
 */
export function listenForChanges(onNotice: (notice: SyncNotice) => void) {
  let socket: WebSocket | null = null;
  let attempts = 0;
  let closed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const connect = () => {
    if (closed) return;
    const url = new URL(apiUrl("/api/sync/ws"), window.location.href);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    // No app nativo não há cookie: o token vai na URL (só nesta rota).
    const token = sessionToken();
    if (token) url.searchParams.set("token", token);
    socket = new WebSocket(url);
    socket.onopen = () => {
      attempts = 0;
    };
    socket.onmessage = (event) => {
      try {
        const notice = JSON.parse(String(event.data)) as SyncNotice;
        if (notice.type === "version") onNotice(notice);
      } catch {
        // Mensagem que não é aviso (ex.: "pong").
      }
    };
    socket.onclose = () => {
      if (closed) return;
      attempts += 1;
      timer = setTimeout(connect, Math.min(60_000, 1000 * 2 ** attempts));
    };
  };
  connect();

  return {
    close() {
      closed = true;
      clearTimeout(timer);
      socket?.close();
    },
  };
}
