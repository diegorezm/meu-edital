import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import type { AppData } from "@meu-edital/domain";
import { supabase } from "@global/services/supabase";
import { useAuth } from "./auth";
import {
  createRemoteRepository,
  localRepository,
  type SyncStatus,
} from "./repository";

type Store = {
  data: AppData | null;
  error: string | null;
  /** Modo com conta e sincronização. */
  remote: boolean;
  sync: SyncStatus & { syncing: boolean };
  update: (fn: (current: AppData) => AppData) => Promise<void>;
  syncNow: () => Promise<void>;
};
const Context = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const repository = useMemo(
    () =>
      supabase && userId
        ? createRemoteRepository(supabase, userId)
        : localRepository,
    [userId],
  );
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sync, setSync] = useState<Store["sync"]>({
    pending: 0,
    error: null,
    syncing: false,
  });
  const dataRef = useRef<AppData | null>(null);
  // Incrementa a cada alteração local para descartar retratos do servidor desatualizados.
  const revision = useRef(0);

  const syncNow = useCallback(async () => {
    if (!repository.remote) return;
    const started = revision.current;
    setSync((current) => ({ ...current, syncing: true }));
    const result = await repository.sync();
    if (result.data && revision.current === started) {
      dataRef.current = result.data;
      setData(result.data);
    }
    setSync({ ...result.status, syncing: false });
  }, [repository]);

  useEffect(() => {
    // O provider é recriado quando a conta muda, então o repositório é fixo aqui.
    let active = true;
    repository
      .load()
      .then((loaded) => {
        if (!active) return;
        dataRef.current = loaded;
        setData(loaded);
        setError(null);
        syncNow();
      })
      .catch((e) => {
        if (active)
          setError(e instanceof Error ? e.message : "Erro ao carregar dados.");
      });
    return () => {
      active = false;
    };
  }, [repository, syncNow]);

  // Ao voltar para o app (ou para a aba no navegador), busca o que mudou em outro aparelho.
  useEffect(() => {
    if (!repository.remote) return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") syncNow();
    });
    return () => subscription.remove();
  }, [repository, syncNow]);

  const update = useCallback(
    async (fn: (current: AppData) => AppData) => {
      const prev = dataRef.current;
      if (!prev) return;
      const next = fn(prev);
      if (next === prev) return;
      revision.current += 1;
      dataRef.current = next;
      setData(next);
      try {
        await repository.save(prev, next);
        setError(null);
      } catch {
        setError("Não foi possível salvar. Tente novamente.");
        return;
      }
      syncNow();
    },
    [repository, syncNow],
  );

  return (
    <Context.Provider
      value={{
        data,
        error,
        remote: repository.remote,
        sync,
        update,
        syncNow,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useStore() {
  const value = useContext(Context);
  if (!value) throw new Error("StoreProvider ausente");
  return value;
}
