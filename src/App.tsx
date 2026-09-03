import { AuthProvider } from "./lib/auth";
import { AuthGate } from "./components/AuthGate";
import { CookingProvider } from "./lib/store";
import { CommunityProvider } from "./lib/community-store";
import { I18nProvider } from "./lib/i18n";
import { MobileShell } from "./MobileShell";
import { UpdateToast } from "./components/UpdateToast";

export function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AuthGate>
          <CookingProvider>
            <CommunityProvider>
              <MobileShell />
              <UpdateToast />
            </CommunityProvider>
          </CookingProvider>
        </AuthGate>
      </AuthProvider>
    </I18nProvider>
  );
}
