import { useState } from "react";
import { useGlobalSearchParams } from "expo-router";
import { Platform } from "react-native";
import { AuthScreen, type AuthMode } from "./AuthScreen";

const siteUrl = process.env.EXPO_PUBLIC_SITE_URL;

/**
 * O que a pessoa sem conta vê no app. A divulgação fica no site (`apps/site`),
 * que linka para cá com `?conta=criar` ou `?conta=entrar`.
 */
export default function PublicScreen() {
  const { conta } = useGlobalSearchParams<{ conta?: string }>();
  const [mode, setMode] = useState<AuthMode>(
    conta === "criar" ? "signUp" : "signIn",
  );
  return (
    <AuthScreen
      mode={mode}
      onModeChange={setMode}
      onBack={
        Platform.OS === "web" && siteUrl
          ? () => window.location.assign(siteUrl)
          : undefined
      }
    />
  );
}
