import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PantryProvider } from "./src/lib/store";
import { MobileShell } from "./src/MobileShell";

export default function App() {
  return (
    <SafeAreaProvider>
      <PantryProvider>
        <StatusBar style="dark" />
        <MobileShell />
      </PantryProvider>
    </SafeAreaProvider>
  );
}
