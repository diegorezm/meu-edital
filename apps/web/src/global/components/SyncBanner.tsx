import { Button, Notice } from "@meu-edital/ui";
import { useStoreActions, useSyncState } from "../store/useStore";

/**
 * Aviso discreto no topo do conteúdo só quando há algo que merece atenção:
 * alterações esperando rede, erro de sync ou mutações recusadas pelo servidor.
 */
export function SyncBanner() {
  const state = useSyncState();
  const { syncNow, dismissRejected } = useStoreActions();

  if (state.rejected.length > 0) {
    const first = state.rejected[0];
    return (
      <div className="mb-4">
        <Notice tone="error">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              {state.rejected.length === 1
                ? `Uma alteração não foi aceita: ${first.reason}`
                : `${state.rejected.length} alterações não foram aceitas pelo servidor.`}
            </span>
            <Button variant="quiet" onClick={dismissRejected}>
              Entendi
            </Button>
          </div>
        </Notice>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mb-4">
        <Notice tone="error">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Não deu para sincronizar agora. Seus dados continuam salvos neste aparelho.</span>
            <Button variant="quiet" onClick={() => void syncNow()}>
              Tentar agora
            </Button>
          </div>
        </Notice>
      </div>
    );
  }

  if (state.status === "offline" && state.pending > 0) {
    return (
      <div className="mb-4">
        <Notice>
          Sem conexão: {state.pending} alteraç{state.pending === 1 ? "ão" : "ões"} na fila para enviar quando a rede voltar.
        </Notice>
      </div>
    );
  }

  return null;
}
