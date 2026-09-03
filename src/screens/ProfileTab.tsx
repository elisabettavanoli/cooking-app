import { useState } from "react";
import { Button, Field } from "../components/ui";
import { Switch } from "../components/Switch";
import { useAuth } from "../lib/auth";
import { getCoarsePosition } from "../lib/geo";
import { useI18n, LANGUAGE_LABELS, LANGUAGE_ORDER } from "../lib/i18n";
import { useCooking } from "../lib/store";
import s from "./ProfileTab.module.css";

export function ProfileTab() {
  const { t, lang, setLang } = useI18n();
  const { configured, user, signOut } = useAuth();
  const { profile, updateProfile } = useCooking();
  const [draftName, setDraftName] = useState(profile.displayName);
  const [locationDenied, setLocationDenied] = useState(false);

  const commitName = () => {
    const name = draftName.trim();
    if (name && name !== profile.displayName) updateProfile({ displayName: name });
    else setDraftName(profile.displayName);
  };

  const toggleMap = async (on: boolean) => {
    setLocationDenied(false);
    if (!on) {
      updateProfile({ shareOnMap: false, latitude: null, longitude: null });
      return;
    }
    updateProfile({ shareOnMap: true });
    const pos = await getCoarsePosition();
    if (pos) {
      updateProfile({ latitude: pos.lat, longitude: pos.lng });
    } else if (configured) {
      // Remote mode: without coords the map can't place you — back it out.
      updateProfile({ shareOnMap: false });
      setLocationDenied(true);
      setTimeout(() => setLocationDenied(false), 5000);
    }
  };

  return (
    <div className={s.screen}>
      <div className={s.scroll}>
        <h1 className={s.title}>{t("profile.title")}</h1>

        <div className={s.card}>
          <p className={s.sectionTitle}>{t("profile.account").toUpperCase()}</p>
          <Field
            label={t("profile.displayName")}
            value={draftName}
            onChangeText={setDraftName}
            onBlur={commitName}
            placeholder={t("profile.displayName")}
          />
          <p className={s.hint}>{t("profile.displayNameHint")}</p>
          {configured && user?.email ? <p className={s.email}>{user.email}</p> : null}
        </div>

        <div className={s.card}>
          <p className={s.sectionTitle}>{t("profile.language").toUpperCase()}</p>
          <p className={s.hint}>{t("profile.languageHint")}</p>
          <select
            className={s.select}
            value={lang}
            onChange={(e) => setLang(e.currentTarget.value as typeof lang)}
            aria-label={t("profile.language")}
          >
            {LANGUAGE_ORDER.map((code) => (
              <option key={code} value={code}>
                {LANGUAGE_LABELS[code]}
              </option>
            ))}
          </select>
        </div>

        <div className={s.card}>
          <p className={s.sectionTitle}>{t("profile.sharingSection").toUpperCase()}</p>

          <label className={s.switchRow}>
            <span className={s.switchRowText}>
              <span className={s.rowLabel}>{t("profile.shareCommunitiesLabel")}</span>
              <span className={s.rowHint}>{t("profile.shareCommunitiesHint")}</span>
            </span>
            <Switch
              value={profile.shareWithCommunities}
              onValueChange={(v) => updateProfile({ shareWithCommunities: v })}
              label={t("profile.shareCommunitiesLabel")}
            />
          </label>

          <label className={s.switchRow}>
            <span className={s.switchRowText}>
              <span className={s.rowLabel}>{t("profile.shareMapLabel")}</span>
              <span className={s.rowHint}>{t("profile.shareMapHint")}</span>
            </span>
            <Switch
              value={profile.shareOnMap}
              onValueChange={(v) => void toggleMap(v)}
              label={t("profile.shareMapLabel")}
            />
          </label>
          {locationDenied && <p className={s.denied}>{t("profile.locationDenied")}</p>}

          <label className={s.switchRow}>
            <span className={s.switchRowText}>
              <span className={s.rowLabel}>{t("profile.requestsLabel")}</span>
              <span className={s.rowHint}>{t("profile.requestsHint")}</span>
            </span>
            <Switch
              value={profile.requestsEnabled}
              onValueChange={(v) => updateProfile({ requestsEnabled: v })}
              label={t("profile.requestsLabel")}
            />
          </label>
        </div>

        {configured && user ? (
          <div className={s.logoutRow}>
            <Button
              label={t("profile.logout")}
              variant="destructive"
              onPress={() => void signOut()}
              style={{ width: "100%" }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
