import { Stack } from "expo-router";
import { StoreProvider } from "@/data/store";

export default function RootLayout() {
  return (
    <StoreProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#F7F7F2" },
        }}
      />
    </StoreProvider>
  );
}
