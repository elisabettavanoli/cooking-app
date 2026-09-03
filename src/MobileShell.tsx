import { useState } from "react";
import { ChefHat, Home, ListTodo, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { colors } from "./lib/theme";
import { useI18n } from "./lib/i18n";
import { useCooking } from "./lib/store";
import { KitchenTab } from "./screens/KitchenTab";
import { CookTab } from "./screens/CookTab";
import { ListTab } from "./screens/ListTab";
import { NearbyTab } from "./screens/NearbyTab";
import styles from "./MobileShell.module.css";

type TabId = "kitchen" | "cook" | "list" | "nearby";

const tabs: { id: TabId; labelKey: string; icon: LucideIcon }[] = [
  { id: "kitchen", labelKey: "nav.kitchen", icon: Home },
  { id: "list", labelKey: "nav.list", icon: ListTodo },
  { id: "cook", labelKey: "nav.cook", icon: ChefHat },
  { id: "nearby", labelKey: "nav.nearby", icon: Users },
];

export function MobileShell() {
  const [activeTab, setActiveTab] = useState<TabId>("kitchen");
  const { hydrated } = useCooking();
  const { t } = useI18n();

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        {!hydrated ? (
          <div className={styles.loading}>
            <p className={styles.loadingText}>{t("common.loadingKitchen")}</p>
          </div>
        ) : (
          <>
            {activeTab === "kitchen" && <KitchenTab onSwitchToCook={() => setActiveTab("cook")} />}
            {activeTab === "cook" && <CookTab />}
            {activeTab === "list" && <ListTab />}
            {activeTab === "nearby" && <NearbyTab />}
          </>
        )}
      </div>

      <nav className={styles.tabBar}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          const tint = active ? colors.primary : colors.mutedForeground;
          const label = t(tab.labelKey);
          return (
            <button
              key={tab.id}
              type="button"
              className={["resetButton", styles.tab].join(" ")}
              onClick={() => setActiveTab(tab.id)}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} color={tint} />
              <span className={styles.tabLabel} style={{ color: tint }}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
