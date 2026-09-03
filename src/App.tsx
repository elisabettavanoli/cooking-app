import { AuthProvider } from "./lib/auth";
import { AuthGate } from "./components/AuthGate";
import { CookingProvider } from "./lib/store";
import { I18nProvider } from "./lib/i18n";
import { MobileShell } from "./MobileShell";
import { UpdateToast } from "./components/UpdateToast";

export function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AuthGate>
          <CookingProvider>
            <MobileShell />
            <UpdateToast />
          </CookingProvider>
        </AuthGate>
      </AuthProvider>
    </I18nProvider>
  );
}
