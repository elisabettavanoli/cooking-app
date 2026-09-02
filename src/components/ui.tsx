import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { X } from "lucide-react-native";
import { colors, radius } from "../lib/theme";

type ButtonVariant = "primary" | "outline" | "ghost" | "destructive" | "secondary";

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  icon,
  style,
  small,
}: {
  label?: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  small?: boolean;
}) {
  const v = buttonStyles[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btnBase,
        small && styles.btnSmall,
        v.container,
        (disabled || pressed) && { opacity: disabled ? 0.4 : 0.85 },
        style,
      ]}
    >
      {icon}
      {label ? <Text style={[styles.btnText, v.text]}>{label}</Text> : null}
    </Pressable>
  );
}

const buttonStyles: Record<ButtonVariant, { container: ViewStyle; text: { color: string } }> = {
  primary: { container: { backgroundColor: colors.primary }, text: { color: colors.primaryForeground } },
  secondary: { container: { backgroundColor: colors.secondary }, text: { color: colors.secondaryForeground } },
  outline: {
    container: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    text: { color: colors.foreground },
  },
  ghost: { container: { backgroundColor: "transparent" }, text: { color: colors.foreground } },
  destructive: { container: { backgroundColor: colors.destructive }, text: { color: colors.destructiveForeground } },
};

export function Field({
  label,
  style,
  ...props
}: TextInputProps & { label?: string; style?: ViewStyle }) {
  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.segmentedItem, active && styles.segmentedItemActive]}
          >
            <Text style={[styles.segmentedText, active && styles.segmentedTextActive]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Simple wheel-free select: a horizontally scrolling row of chips. */
export function ChipSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  heightPct = 0.9,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  heightPct?: number;
}) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { maxHeight: `${Math.round(heightPct * 100)}%` }]}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetTitle}>{title}</Text>
            {subtitle ? <Text style={styles.sheetSubtitle}>{subtitle}</Text> : null}
          </View>
          <Pressable onPress={onClose} hitSlop={10} style={styles.sheetClose}>
            <X size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>
        {children}
      </View>
    </Modal>
  );
}

export const styles = StyleSheet.create({
  btnBase: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnSmall: { minHeight: 34, paddingHorizontal: 10, borderRadius: radius.sm },
  btnText: { fontSize: 15, fontWeight: "600" },
  label: { fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.foreground,
    backgroundColor: colors.card,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: 4,
  },
  segmentedItem: { flex: 1, paddingVertical: 8, borderRadius: radius.sm, alignItems: "center" },
  segmentedItemActive: { backgroundColor: colors.card },
  segmentedText: { fontSize: 14, fontWeight: "600", color: colors.mutedForeground },
  segmentedTextActive: { color: colors.foreground },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.mutedForeground },
  chipTextActive: { color: colors.primaryForeground },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: radius["3xl"],
    borderTopRightRadius: radius["3xl"],
    paddingHorizontal: 16,
    paddingBottom: 28,
    paddingTop: 8,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 10,
  },
  sheetHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16, gap: 12 },
  sheetTitle: { fontSize: 19, fontWeight: "700", color: colors.foreground },
  sheetSubtitle: { fontSize: 13, color: colors.mutedForeground, marginTop: 2 },
  sheetClose: { padding: 4 },
});
