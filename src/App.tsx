import { PantryProvider } from "./lib/store";
import { MobileShell } from "./MobileShell";

export function App() {
  return (
    <PantryProvider>
      <MobileShell />
    </PantryProvider>
  );
}
