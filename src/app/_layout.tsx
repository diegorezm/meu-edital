import { Tabs } from "expo-router";
import { AppShell } from "@/components/ui";
import { StoreProvider } from "@/data/store";

export default function RootLayout() {
  return (
    <StoreProvider>
      <AppShell>
        <Tabs
          backBehavior="history"
          tabBar={() => null}
          screenOptions={{
            headerShown: false,
            animation: "fade",
            sceneStyle: { backgroundColor: "#F7F7F2" },
            transitionSpec: { animation: "timing", config: { duration: 180 } },
          }}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="plano" />
          <Tabs.Screen name="estudar" />
          <Tabs.Screen name="revisoes" />
          <Tabs.Screen name="concursos" />
          <Tabs.Screen name="ciclo" />
          <Tabs.Screen name="ia" />
        </Tabs>
      </AppShell>
    </StoreProvider>
  );
}
