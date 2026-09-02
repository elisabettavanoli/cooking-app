import { PantryProvider } from "./lib/store";
import { MobileShell } from "./MobileShell";
import { UpdateToast } from "./components/UpdateToast";

export function App() {
  return (
    <PantryProvider>
      <MobileShell />
      <UpdateToast />
    </PantryProvider>
  );
}
