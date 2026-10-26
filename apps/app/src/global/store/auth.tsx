import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  signInWithGoogle as openGoogleSignIn,
  clearOAuthError,
  readOAuthError,
} from "@global/services/oauth";
import { supabase } from "@global/services/supabase";

type Auth = {
  /** `false` quando o Supabase não está configurado e o app roda só no aparelho. */
  enabled: boolean;
  status: "loading" | "signedOut" | "signedIn";
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  /** Cria a conta e já entra. Depende de "Confirm email" desligado no Supabase. */
  signUp: (email: string, password: string) => Promise<void>;
  /** Abre o login com Google. Cria a conta no primeiro acesso. */
  signInWithGoogle: () => Promise<void>;
  /** Erro devolvido pelo Google na volta do redirecionamento (web). */
  oauthError: string | null;
  signOut: () => Promise<void>;
};

/** Traduz as mensagens do Supabase Auth que a pessoa pode ver no login. */
function authError(message: string) {
  if (/invalid login credentials/i.test(message))
    return new Error("E-mail ou senha incorretos.");
  if (/already registered|already exists/i.test(message))
    return new Error("Já existe uma conta com esse e-mail. Entre com ela.");
  if (/password should be at least/i.test(message))
    return new Error("A senha precisa ter pelo menos 6 caracteres.");
  if (/email not confirmed/i.test(message))
    return new Error("Confirme o e-mail pelo link que enviamos antes de entrar.");
  if (/signups? not allowed/i.test(message))
    return new Error("Os cadastros estão fechados por enquanto.");
  return new Error(message);
}

const Context = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [oauthError] = useState(readOAuthError);
  useEffect(() => {
    if (oauthError) setTimeout(clearOAuthError, 0);
  }, [oauthError]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setLoading(false));
    const { data } = supabase.auth.onAuthStateChange((_event, next) =>
      setSession(next),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  const value: Auth = {
    enabled: Boolean(supabase),
    status: loading ? "loading" : session ? "signedIn" : "signedOut",
    session,
    async signIn(email, password) {
      const { error } = await supabase!.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw authError(error.message);
    },
    async signUp(email, password) {
      const { data, error } = await supabase!.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) throw authError(error.message);
      // Com a confirmação ligada o Supabase não devolve sessão nem erro.
      if (!data.session)
        throw new Error(
          "Conta criada. Confirme pelo link no e-mail e depois entre.",
        );
    },
    async signInWithGoogle() {
      await openGoogleSignIn(supabase!);
    },
    oauthError,
    async signOut() {
      await supabase?.auth.signOut();
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("AuthProvider ausente");
  return value;
}
