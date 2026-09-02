import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChefHat, Home, ListTodo, Users } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { colors } from "./lib/theme";
import { usePantry } from "./lib/store";
import { KitchenTab } from "./screens/KitchenTab";
import { CookTab } from "./screens/CookTab";
import { ListTab } from "./screens/ListTab";
import { NearbyTab } from "./screens/NearbyTab";

type TabId = "kitchen" | "cook" | "list" | "nearby";

const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "kitchen", label: "Kitchen", icon: Home },
  { id: "cook", label: "Cook", icon: ChefHat },
  { id: "list", label: "List", icon: ListTodo },
  { id: "nearby", label: "Nearby", icon: Users },
];

export function MobileShell() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabId>("cook");
  const { hydrated } = usePantry();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {!hydrated ? (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>Loading your kitchen...</Text>
          </View>
        ) : (
          <>
            {activeTab === "kitchen" && <KitchenTab onSwitchToCook={() => setActiveTab("cook")} />}
            {activeTab === "cook" && <CookTab />}
            {activeTab === "list" && <ListTab />}
            {activeTab === "nearby" && <NearbyTab />}
          </>
        )}
      </View>

      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <Pressable key={tab.id} style={styles.tab} onPress={() => setActiveTab(tab.id)}>
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 2}
                color={active ? colors.primary : colors.mutedForeground}
              />
              <Text style={[styles.tabLabel, { color: active ? colors.primary : colors.mutedForeground }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 14, color: colors.mutedForeground },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: 4 },
  tabLabel: { fontSize: 11, fontWeight: "600" },
});
