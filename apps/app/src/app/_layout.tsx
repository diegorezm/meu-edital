import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import PublicScreen from "@features/auth";
import { OnboardingGate } from "@features/onboarding";
import { AppShell } from "@global/components/AppShell";
import { palette } from "@global/components/ui";
import { AuthProvider, useAuth } from "@global/store/auth";
import { StoreProvider } from "@global/store/store";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { enabled, status, session } = useAuth();
  if (!enabled) return <StoreProvider>{children}</StoreProvider>;
  if (status === "loading")
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: palette.muted }}>Abrindo seus estudos...</Text>
      </View>
    );
  if (status === "signedOut") return <PublicScreen />;
  return <StoreProvider key={session?.user.id}>{children}</StoreProvider>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate>
        <OnboardingGate>
          <AppShell>
            <Tabs
              backBehavior="history"
              tabBar={() => null}
              screenOptions={{
                headerShown: false,
                animation: "fade",
                sceneStyle: { backgroundColor: palette.bg },
                transitionSpec: {
                  animation: "timing",
                  config: { duration: 180 },
                },
              }}
            >
              <Tabs.Screen name="index" />
              <Tabs.Screen name="semana" />
              <Tabs.Screen name="estudar" />
              <Tabs.Screen name="ciclo" />
              <Tabs.Screen name="revisoes" />
              <Tabs.Screen name="concursos" />
              <Tabs.Screen name="ia" />
            </Tabs>
          </AppShell>
        </OnboardingGate>
      </AuthGate>
    </AuthProvider>
  );
}
