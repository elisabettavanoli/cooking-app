import { CookingProvider } from "./lib/store";
import { MobileShell } from "./MobileShell";
import { UpdateToast } from "./components/UpdateToast";

export function App() {
  return (
    <CookingProvider>
      <MobileShell />
      <UpdateToast />
    </CookingProvider>
  );
}
