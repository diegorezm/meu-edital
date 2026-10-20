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
  /** `signUp` cria a conta se o e-mail for novo; `signIn` só aceita contas existentes. */
  sendCode: (email: string, mode: "signIn" | "signUp") => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  /** Abre o login com Google. Cria a conta no primeiro acesso. */
  signInWithGoogle: () => Promise<void>;
  /** Erro devolvido pelo Google na volta do redirecionamento (web). */
  oauthError: string | null;
  signOut: () => Promise<void>;
};

export class AccountNotFoundError extends Error {
  constructor() {
    super("Não encontramos uma conta com esse e-mail.");
  }
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
    async sendCode(email, mode) {
      const { error } = await supabase!.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: mode === "signUp" },
      });
      if (!error) return;
      // Sem permissão para criar conta, o Supabase recusa e-mails desconhecidos.
      if (
        mode === "signIn" &&
        /signups? not allowed|not found/i.test(error.message)
      )
        throw new AccountNotFoundError();
      if (/signups? not allowed/i.test(error.message))
        throw new Error("Os cadastros estão fechados por enquanto.");
      throw new Error(error.message);
    },
    async verifyCode(email, code) {
      const { error } = await supabase!.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "email",
      });
      if (error) throw new Error(error.message);
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
