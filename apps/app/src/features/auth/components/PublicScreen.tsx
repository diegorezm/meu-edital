import { useState } from "react";
import { LandingScreen } from "@features/landing";
import { AuthScreen, type AuthMode } from "./AuthScreen";

/** O que a pessoa sem conta vê: a landing e, a partir dela, criar conta ou entrar. */
export default function PublicScreen() {
  const [screen, setScreen] = useState<"landing" | AuthMode>("landing");
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
