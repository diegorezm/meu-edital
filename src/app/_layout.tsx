import { Stack } from "expo-router";
import { StoreProvider } from "@/data/store";

export default function RootLayout() {
  return (
    <StoreProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#101918" },
        }}
      />
    </StoreProvider>
  );
}
