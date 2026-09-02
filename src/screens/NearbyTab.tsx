import React, { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { MapPin } from "lucide-react-native";
import { Button } from "../components/ui";
import { colors, radius } from "../lib/theme";
import { usePantry } from "../lib/store";

export function NearbyTab() {
  const { profile, updateProfile } = usePantry();
  const [code, setCode] = useState("");

  const rows: { key: keyof typeof profile; label: string; hint: string }[] = [
    { key: "sharingEnabled", label: "Enable sharing", hint: "Let others see items you mark shareable" },
    { key: "requestsEnabled", label: "Allow requests", hint: "Neighbors can ask to borrow your items" },
    { key: "inventoryVisible", label: "Show inventory", hint: "Community sees your available items" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Community</Text>
      <Text style={styles.subtitle}>Share ingredients with people nearby</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>PRIVACY</Text>
        {rows.map((row) => (
          <View key={row.key} style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowHint}>{row.hint}</Text>
            </View>
            <Switch
              value={Boolean(profile[row.key])}
              onValueChange={(v) => updateProfile({ [row.key]: v })}
            />
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>JOIN A COMMUNITY</Text>
        <Text style={styles.rowHint}>Enter an invite code from friends, roommates, or neighbors.</Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="e.g. PASTA-1234"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="characters"
            style={styles.input}
          />
          <Button label="Join" disabled={!code.trim()} />
        </View>
      </View>

      <View style={styles.dashed}>
        <MapPin size={32} color={colors.mutedForeground} />
        <Text style={styles.rowLabel}>Nearby discovery is coming soon</Text>
        <Text style={[styles.rowHint, { textAlign: "center" }]}>
          Once you join a community, you can browse and request nearby ingredients without sharing
          your exact location.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "800", color: colors.foreground },
  subtitle: { fontSize: 13, color: colors.mutedForeground, marginTop: 2, marginBottom: 16 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius["2xl"],
    backgroundColor: colors.card,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1, color: colors.mutedForeground },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowLabel: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  rowHint: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.foreground,
  },
  dashed: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: radius["2xl"],
    padding: 24,
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.muted,
  },
});
