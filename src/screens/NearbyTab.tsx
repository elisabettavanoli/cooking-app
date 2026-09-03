import { useState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "../components/ui";
import { Switch } from "../components/Switch";
import { colors } from "../lib/theme";
import { useI18n, LANGUAGE_LABELS, LANGUAGE_ORDER } from "../lib/i18n";
import { useCooking } from "../lib/store";
import type { UserProfile } from "../lib/types";
import s from "./NearbyTab.module.css";

type ToggleKey = "sharingEnabled" | "requestsEnabled" | "inventoryVisible";

const rows: { key: ToggleKey; labelKey: string; hintKey: string }[] = [
  { key: "sharingEnabled", labelKey: "nearby.sharingLabel", hintKey: "nearby.sharingHint" },
  { key: "requestsEnabled", labelKey: "nearby.requestsLabel", hintKey: "nearby.requestsHint" },
  { key: "inventoryVisible", labelKey: "nearby.inventoryLabel", hintKey: "nearby.inventoryHint" },
];

export function NearbyTab() {
  const { t, lang, setLang } = useI18n();
  const { profile, updateProfile } = useCooking();
  const [code, setCode] = useState("");

  const setFlag = (key: ToggleKey, value: boolean) => {
    updateProfile({ [key]: value } as Partial<UserProfile>);
  };

  return (
    <div className={s.screen}>
      <div className={s.scroll}>
        <h1 className={s.title}>{t("nearby.title")}</h1>
        <p className={s.subtitle}>{t("nearby.subtitle")}</p>

        <div className={s.card}>
          <p className={s.sectionTitle}>{t("nearby.language").toUpperCase()}</p>
          <p className={s.rowHint}>{t("nearby.languageHint")}</p>
          <div className={s.joinRow}>
            <select
              className={s.input}
              value={lang}
              onChange={(e) => setLang(e.currentTarget.value as typeof lang)}
              aria-label={t("nearby.language")}
            >
              {LANGUAGE_ORDER.map((code) => (
                <option key={code} value={code}>
                  {LANGUAGE_LABELS[code]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={s.card}>
          <p className={s.sectionTitle}>{t("nearby.privacy").toUpperCase()}</p>
          {rows.map((row) => {
            const label = t(row.labelKey);
            return (
              <label key={row.key} className={s.switchRow}>
                <span className={s.switchRowText}>
                  <span className={s.rowLabel}>{label}</span>
                  <span className={s.rowHint}>{t(row.hintKey)}</span>
                </span>
                <Switch
                  value={Boolean(profile[row.key])}
                  onValueChange={(v) => setFlag(row.key, v)}
                  label={label}
                />
              </label>
            );
          })}
        </div>

        <div className={s.card}>
          <p className={s.sectionTitle}>{t("nearby.joinTitle").toUpperCase()}</p>
          <p className={s.rowHint}>{t("nearby.joinHint")}</p>
          <div className={s.joinRow}>
            <input
              className={s.input}
              value={code}
              onChange={(e) => setCode(e.currentTarget.value.toUpperCase())}
              placeholder="e.g. PASTA-1234"
              autoCapitalize="characters"
            />
            <Button label={t("nearby.join")} disabled={!code.trim()} />
          </div>
        </div>

        <div className={s.dashed}>
          <MapPin size={32} color={colors.mutedForeground} />
          <p className={s.rowLabel}>{t("nearby.comingSoonTitle")}</p>
          <p className={s.rowHint}>{t("nearby.comingSoonText")}</p>
        </div>
      </div>
    </div>
  );
}
