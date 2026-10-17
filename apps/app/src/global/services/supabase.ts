import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

/**
 * Cliente do Supabase, ou `null` quando o projeto não está configurado.
 * Sem configuração, o app funciona no modo local, sem conta.
 */
export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          // PKCE: o login com Google devolve um código trocado pela sessão.
          // Na web o próprio cliente lê o código da URL na volta do redirecionamento.
          flowType: "pkce",
          detectSessionInUrl: Platform.OS === "web",
        },
      })
    : null;

// No celular o app pode ficar em segundo plano; renova o token só quando está ativo.
if (supabase && Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
