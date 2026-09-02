import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Check, Plus, Search, UtensilsCrossed, X } from "lucide-react-native";
import { FoodIcon } from "../components/FoodIcon";
import { Button } from "../components/ui";
import { colors, radius } from "../lib/theme";
import { categoryLabel } from "../lib/data";
import { useActiveInventory, usePantry } from "../lib/store";
import { AddItemSheet } from "../components/AddItemSheet";
import { EditItemSheet } from "../components/EditItemSheet";
import { ItemActionsSheet } from "../components/ItemActionsSheet";
import type { InventoryItem } from "../lib/types";

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

function tileBadge(item: InventoryItem): { text: string; color: string; bg: string } | null {
  if (item.expiry) {
    const d = daysUntil(item.expiry);
    if (d < 0) return { text: "old", color: colors.destructive, bg: "#F6E1DC" };
    if (d <= 3) return { text: d === 0 ? "today" : `${d}d`, color: colors.warn, bg: colors.warnSoft };
  }
  if (item.unit === "piece" && item.quantity <= 1) {
    return { text: "last", color: colors.low, bg: colors.lowSoft };
  }
  return null;
}

export function KitchenTab({ onSwitchToCook }: { onSwitchToCook: () => void }) {
  const [search, setSearch] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [actionsItemId, setActionsItemId] = useState<string | null>(null);

  const { inventory, selectedConcepts, toggleSelectedConcept, clearSelectedConcepts } = usePantry();
  const activeInventory = useActiveInventory();

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = activeInventory.filter((i) => i.displayName.toLowerCase().includes(q));
    const map = new Map<string, InventoryItem[]>();
    for (const item of filtered) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  }, [activeInventory, search]);

  const expiringCount = activeInventory.filter((i) => i.expiry && daysUntil(i.expiry) <= 3).length;

  const editItem = inventory.find((i) => i.id === editItemId) ?? null;
  const actionsItem = inventory.find((i) => i.id === actionsItemId) ?? null;

  const handleTap = (item: InventoryItem) => {
    if (selectionMode) toggleSelectedConcept(item.conceptId);
    else setActionsItemId(item.id);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>My Kitchen</Text>
            <Text style={styles.subtitle}>
              {activeInventory.length} items tracked
              {expiringCount > 0 ? (
                <Text style={{ color: colors.warn }}> · {expiringCount} to use soon</Text>
              ) : null}
            </Text>
          </View>
          <Pressable style={styles.addBtn} onPress={() => setAddOpen(true)}>
            <Plus size={22} color={colors.primaryForeground} strokeWidth={2.5} />
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={16} color={colors.mutedForeground} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search inventory..."
              placeholderTextColor={colors.mutedForeground}
              style={styles.searchInput}
            />
          </View>
          <Pressable
            style={[styles.selectBtn, selectionMode && { backgroundColor: colors.primary }]}
            onPress={() => {
              setSelectionMode((v) => !v);
              clearSelectedConcepts();
            }}
          >
            {selectionMode ? (
              <X size={18} color={colors.primaryForeground} />
            ) : (
              <UtensilsCrossed size={18} color={colors.foreground} />
            )}
          </Pressable>
        </View>
        <Text style={styles.hint}>
          {selectionMode ? "Tap items to cook with" : "Long-press an item for actions"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {grouped.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <UtensilsCrossed size={28} color={colors.mutedForeground} />
            </View>
            <Text style={styles.emptyTitle}>
              {search ? "Nothing matches that" : "Your kitchen is empty"}
            </Text>
            <Text style={styles.emptyText}>
              {search ? "Try another name." : "Tap + to add your first ingredient."}
            </Text>
          </View>
        )}

        {grouped.map(({ category, items }) => (
          <View key={category} style={{ marginBottom: 22 }}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>{categoryLabel(category as never)}</Text>
              <Text style={styles.sectionCount}>{items.length}</Text>
            </View>
            <View style={styles.grid}>
              {items.map((item) => {
                const selected = selectedConcepts.includes(item.conceptId);
                const badge = tileBadge(item);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => handleTap(item)}
                    onLongPress={() => setActionsItemId(item.id)}
                    style={[styles.tile, selected && styles.tileSelected]}
                  >
                    {badge && (
                      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
                      </View>
                    )}
                    {selected && (
                      <View style={styles.tileCheck}>
                        <Check size={10} color={colors.primaryForeground} strokeWidth={3} />
                      </View>
                    )}
                    <FoodIcon iconKey={item.conceptId} category={item.category} size={30} variant="bare" />
                    <View style={{ alignItems: "center" }}>
                      <Text numberOfLines={1} style={styles.tileName}>
                        {item.displayName}
                      </Text>
                      <Text style={styles.tileQty}>
                        {item.quantity} {item.unit}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {selectionMode && selectedConcepts.length > 0 && (
        <View style={styles.cookCta}>
          <Button
            label={`Cook with ${selectedConcepts.length} ingredient${selectedConcepts.length > 1 ? "s" : ""}`}
            onPress={() => {
              setSelectionMode(false);
              onSwitchToCook();
            }}
          />
        </View>
      )}

      <AddItemSheet open={addOpen} onClose={() => setAddOpen(false)} defaultMode="inventory" />
      {actionsItem && (
        <ItemActionsSheet
          item={actionsItem}
          open={!!actionsItemId}
          onClose={() => setActionsItemId(null)}
          onEdit={() => setEditItemId(actionsItem.id)}
        />
      )}
      {editItem && (
        <EditItemSheet item={editItem} open={!!editItemId} onClose={() => setEditItemId(null)} />
      )}
    </View>
  );
}

const TILE_GAP = 8;

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  headerTop: { flexDirection: "row", alignItems: "flex-end", gap: 12, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: "800", color: colors.foreground },
  subtitle: { fontSize: 13, fontWeight: "600", color: colors.fresh, marginTop: 4 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: colors.foreground },
  selectBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, color: colors.mutedForeground, textTransform: "uppercase" },
  scroll: { padding: 16, paddingBottom: 40 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingHorizontal: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground },
  sectionCount: { fontSize: 11, fontWeight: "700", letterSpacing: 1, color: colors.mutedForeground },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: TILE_GAP },
  tile: {
    width: "23%",
    aspectRatio: 1,
    backgroundColor: colors.tile,
    borderRadius: radius["2xl"],
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tileSelected: { borderColor: colors.primary, borderWidth: 2 },
  badge: { position: "absolute", top: 4, right: 4, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  badgeText: { fontSize: 9, fontWeight: "700", textTransform: "uppercase" },
  tileCheck: {
    position: "absolute",
    top: 4,
    left: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  tileName: { fontSize: 10, fontWeight: "700", color: colors.foreground },
  tileQty: { fontSize: 9, color: colors.mutedForeground },
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
  cookCta: { position: "absolute", left: 16, right: 16, bottom: 16 },
});
