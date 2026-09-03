import { useState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "../components/ui";
import { Switch } from "../components/Switch";
import { colors } from "../lib/theme";
import { useCooking } from "../lib/store";
import type { UserProfile } from "../lib/types";
import s from "./NearbyTab.module.css";

type ToggleKey = "sharingEnabled" | "requestsEnabled" | "inventoryVisible";

const rows: { key: ToggleKey; label: string; hint: string }[] = [
  { key: "sharingEnabled", label: "Enable sharing", hint: "Let others see items you mark shareable" },
  { key: "requestsEnabled", label: "Allow requests", hint: "Neighbors can ask to borrow your items" },
  { key: "inventoryVisible", label: "Show inventory", hint: "Community sees your available items" },
];

export function NearbyTab() {
  const { profile, updateProfile } = useCooking();
  const [code, setCode] = useState("");

  const setFlag = (key: ToggleKey, value: boolean) => {
    updateProfile({ [key]: value } as Partial<UserProfile>);
  };

  return (
    <div className={s.screen}>
      <div className={s.scroll}>
        <h1 className={s.title}>Community</h1>
        <p className={s.subtitle}>Share ingredients with people nearby</p>

        <div className={s.card}>
          <p className={s.sectionTitle}>PRIVACY</p>
          {rows.map((row) => (
            <label key={row.key} className={s.switchRow}>
              <span className={s.switchRowText}>
                <span className={s.rowLabel}>{row.label}</span>
                <span className={s.rowHint}>{row.hint}</span>
              </span>
              <Switch
                value={Boolean(profile[row.key])}
                onValueChange={(v) => setFlag(row.key, v)}
                label={row.label}
              />
            </label>
          ))}
        </div>

        <div className={s.card}>
          <p className={s.sectionTitle}>JOIN A COMMUNITY</p>
          <p className={s.rowHint}>Enter an invite code from friends, roommates, or neighbors.</p>
          <div className={s.joinRow}>
            <input
              className={s.input}
              value={code}
              onChange={(e) => setCode(e.currentTarget.value.toUpperCase())}
              placeholder="e.g. PASTA-1234"
              autoCapitalize="characters"
            />
            <Button label="Join" disabled={!code.trim()} />
          </div>
        </div>

        <div className={s.dashed}>
          <MapPin size={32} color={colors.mutedForeground} />
          <p className={s.rowLabel}>Nearby discovery is coming soon</p>
          <p className={s.rowHint}>
            Once you join a community, you can browse and request nearby ingredients without sharing
            your exact location.
          </p>
        </div>
      </div>
    </div>
  );
}
