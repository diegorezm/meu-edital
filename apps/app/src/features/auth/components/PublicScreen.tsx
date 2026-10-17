import { useState } from "react";
import { LandingScreen } from "@features/landing";
import { useAuth } from "@global/store/auth";
import { AuthScreen, type AuthMode } from "./AuthScreen";

/** O que a pessoa sem conta vê: a landing e, a partir dela, criar conta ou entrar. */
export default function PublicScreen() {
  const { oauthError } = useAuth();
  // Se o Google devolveu erro, volta direto para a tela de entrar com o aviso.
  const [screen, setScreen] = useState<"landing" | AuthMode>(
    oauthError ? "signIn" : "landing",
  );
  if (screen === "landing")
    return (
      <LandingScreen
        onSignUp={() => setScreen("signUp")}
        onSignIn={() => setScreen("signIn")}
      />
    );
  return (
    <AuthScreen
      mode={screen}
      onModeChange={setScreen}
      onBack={() => setScreen("landing")}
    />
  );
}
