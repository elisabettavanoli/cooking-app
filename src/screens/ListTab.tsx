import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Check, Plus, Search, ShoppingCart, Trash2, Undo2 } from "lucide-react-native";
import { FoodIcon } from "../components/FoodIcon";
import { colors, radius } from "../lib/theme";
import { categoryLabel } from "../lib/data";
import { usePantry } from "../lib/store";
import { AddItemSheet } from "../components/AddItemSheet";
import type { Category, ShoppingItem } from "../lib/types";

function groupByCategory(items: ShoppingItem[]) {
  const map = new Map<Category, ShoppingItem[]>();
  for (const item of items) {
    const list = map.get(item.category) ?? [];
    list.push(item);
    map.set(item.category, list);
  }
  return Array.from(map.entries()).map(([category, list]) => ({ category, items: list }));
}

export function ListTab() {
  const { shoppingList, markShoppingItemPurchased, removeShoppingItem } = usePantry();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const { active, purchased } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = shoppingList.filter((i) => i.displayName.toLowerCase().includes(q));
    return {
      active: filtered.filter((i) => !i.purchased),
      purchased: filtered.filter((i) => i.purchased),
    };
  }, [shoppingList, search]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Shopping List</Text>
            <Text style={styles.subtitle}>{active.length} items to buy</Text>
          </View>
          <Pressable style={styles.addBtn} onPress={() => setAddOpen(true)}>
            <Plus size={20} color={colors.primaryForeground} />
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <Search size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search list..."
            placeholderTextColor={colors.mutedForeground}
            style={styles.searchInput}
          />
        </View>

        {active.length === 0 && purchased.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <ShoppingCart size={28} color={colors.mutedForeground} />
            </View>
            <Text style={styles.emptyTitle}>Your list is empty</Text>
            <Text style={styles.emptyText}>Add items manually or from a recipe.</Text>
          </View>
        )}

        {groupByCategory(active).map(({ category, items }) => (
          <View key={category} style={{ marginTop: 18 }}>
            <Text style={styles.sectionTitle}>{categoryLabel(category).toUpperCase()}</Text>
            <View style={{ gap: 8, marginTop: 8 }}>
              {items.map((item) => (
                <View key={item.id} style={styles.row}>
                  <FoodIcon iconKey={item.conceptId} category={item.category} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName}>{item.displayName}</Text>
                    <Text style={styles.rowSub}>
                      {item.quantity} {item.unit}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.iconBtn}
                    onPress={() => removeShoppingItem(item.id)}
                    hitSlop={6}
                  >
                    <Trash2 size={16} color={colors.destructive} />
                  </Pressable>
                  <Pressable
                    style={[styles.iconBtn, styles.iconBtnPrimary]}
                    onPress={() => markShoppingItemPurchased(item.id, true)}
                    hitSlop={6}
                  >
                    <Check size={16} color={colors.primaryForeground} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        ))}

        {purchased.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>PURCHASED</Text>
            <View style={{ gap: 8, marginTop: 8 }}>
              {purchased.map((item) => (
                <View key={item.id} style={[styles.row, { backgroundColor: colors.muted, opacity: 0.8 }]}>
                  <FoodIcon iconKey={item.conceptId} category={item.category} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowName, { textDecorationLine: "line-through" }]}>
                      {item.displayName}
                    </Text>
                    <Text style={[styles.rowSub, { color: colors.fresh, fontWeight: "600" }]}>
                      {item.quantity} {item.unit} · in your kitchen
                    </Text>
                  </View>
                  <Pressable
                    style={styles.iconBtn}
                    onPress={() => markShoppingItemPurchased(item.id, false)}
                    hitSlop={6}
                  >
                    <Undo2 size={16} color={colors.foreground} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <AddItemSheet open={addOpen} onClose={() => setAddOpen(false)} defaultMode="list" />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title: { fontSize: 24, fontWeight: "800", color: colors.foreground },
  subtitle: { fontSize: 13, color: colors.mutedForeground, marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: colors.foreground },
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1, color: colors.mutedForeground },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: radius["2xl"],
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  rowName: { fontSize: 15, fontWeight: "600", color: colors.foreground },
  rowSub: { fontSize: 13, color: colors.mutedForeground },
  iconBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  iconBtnPrimary: { backgroundColor: colors.primary },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 6 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius["2xl"],
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: colors.foreground },
  emptyText: { fontSize: 13, color: colors.mutedForeground },
});
