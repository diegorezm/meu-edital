import {
  OfflineError,
  type PullResponse,
  type PushResponse,
  type SyncNotice,
  type Transport,
} from "@meu-edital/sync";
import { apiFetch, apiUrl, sessionToken } from "../http";
import { notifyConsentRequired } from "../legal/legal";
import { queryClient } from "../query";

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
  // Erro transitório do servidor ou limite de requisições: mantém a fila para tentar de novo.
  if (response.status === 429 || response.status >= 500) throw new OfflineError(response.status);
  // Sessão expirou enquanto o aluno estudava: mantém a fila intacta e força nova checagem.
  if (response.status === 401) {
    void queryClient.invalidateQueries({ queryKey: ["sessao"] });
    throw new OfflineError(response.status);
  }
  // Falta aceitar os termos: a interface pede o aceite e o sync tenta depois.
  if (response.status === 409) {
    notifyConsentRequired();
    throw new OfflineError(response.status);
  }
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
 * Reconecta sozinho, com espera crescente, e dispara `onReconnect` depois de
 * uma queda para buscar o que mudou enquanto desconectado.
 */
export function listenForChanges(
  onNotice: (notice: SyncNotice) => void,
  onReconnect?: () => void,
) {
  let socket: WebSocket | null = null;
  let attempts = 0;
  let hasConnectedOnce = false;
  let closed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const scheduleReconnect = () => {
    if (closed) return;
    attempts += 1;
    timer = setTimeout(() => void connect(), Math.min(60_000, 1000 * 2 ** attempts));
  };

  const connect = async () => {
    if (closed) return;
    const url = new URL(apiUrl("/api/sync/ws"), window.location.href);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    // No app nativo não há cookie: pede um ticket efêmero (30 s) em vez de expor o Bearer na URL.
    if (sessionToken()) {
      try {
        const res = await apiFetch("/api/sync/ws-ticket", { method: "POST" });
        if (res.status === 401) {
          void queryClient.invalidateQueries({ queryKey: ["sessao"] });
          return;
        }
        if (!res.ok) return scheduleReconnect();
        const { ticket } = (await res.json()) as { ticket?: string };
        if (!ticket || closed) return;
        url.searchParams.set("ticket", ticket);
      } catch {
        return scheduleReconnect();
      }
    }
    if (closed) return;
    socket = new WebSocket(url);
    socket.onopen = () => {
      const reconnecting = hasConnectedOnce && attempts > 0;
      hasConnectedOnce = true;
      attempts = 0;
      if (reconnecting) onReconnect?.();
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
      scheduleReconnect();
    };
  };
  void connect();

  return {
    /** Verdadeiro com o aviso do servidor ligado: aí não precisa perguntar de tempos em tempos. */
    connected: () => socket?.readyState === WebSocket.OPEN,
    close() {
      closed = true;
      clearTimeout(timer);
      socket?.close();
    },
  };
}
