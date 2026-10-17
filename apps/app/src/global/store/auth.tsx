import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@global/services/supabase";

type Auth = {
  /** `false` quando o Supabase não está configurado e o app roda só no aparelho. */
  enabled: boolean;
  status: "loading" | "signedOut" | "signedIn";
  session: Session | null;
  /** `signUp` cria a conta se o e-mail for novo; `signIn` só aceita contas existentes. */
  sendCode: (email: string, mode: "signIn" | "signUp") => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
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
