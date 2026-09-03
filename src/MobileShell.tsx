import { useState } from "react";
import { ChefHat, Home, ListTodo, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { colors } from "./lib/theme";
import { useCooking } from "./lib/store";
import { KitchenTab } from "./screens/KitchenTab";
import { CookTab } from "./screens/CookTab";
import { ListTab } from "./screens/ListTab";
import { NearbyTab } from "./screens/NearbyTab";
import styles from "./MobileShell.module.css";

type TabId = "kitchen" | "cook" | "list" | "nearby";

const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "kitchen", label: "Kitchen", icon: Home },
  { id: "list", label: "List", icon: ListTodo },
  { id: "cook", label: "Cook", icon: ChefHat },
  { id: "nearby", label: "Nearby", icon: Users },
];

export function MobileShell() {
  const [activeTab, setActiveTab] = useState<TabId>("cook");
  const { hydrated } = useCooking();

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        {!hydrated ? (
          <div className={styles.loading}>
            <p className={styles.loadingText}>Loading your kitchen...</p>
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
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
