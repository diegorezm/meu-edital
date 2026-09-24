import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AppData } from "@/domain/types";
import { localRepository } from "./repository";

type Store = {
  data: AppData | null;
  error: string | null;
  update: (fn: (current: AppData) => AppData) => Promise<void>;
};
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    localRepository
      .load()
      .then(setData)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Erro ao carregar dados."),
      );
  }, []);
  const update = useCallback(
    async (fn: (current: AppData) => AppData) => {
      if (!data) return;
      const next = fn(data);
      try {
        await localRepository.save(next);
        setData(next);
        setError(null);
      } catch {
        setError("Não foi possível salvar. Tente novamente.");
      }
    },
    [data],
  );
  return (
    <Context.Provider value={{ data, error, update }}>
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const value = useContext(Context);
  if (!value) throw new Error("StoreProvider ausente");
  return value;
}
