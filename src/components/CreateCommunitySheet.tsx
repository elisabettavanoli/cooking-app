import { useState } from "react";
import { BottomSheet, Button, Field, uiStyles } from "./ui";
import { useI18n } from "../lib/i18n";
import { useCommunity } from "../lib/community-store";
import s from "./CreateCommunitySheet.module.css";

export function CreateCommunitySheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { createCommunity } = useCommunity();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const close = () => {
    setName("");
    setBusy(false);
    setError(null);
    setCreatedCode(null);
    onClose();
  };

  const submit = async () => {
    const n = name.trim();
    if (!n || busy) return;
    setBusy(true);
    setError(null);
    const res = await createCommunity(n);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setCreatedCode(res.community?.code ?? null);
  };

  return (
    <BottomSheet
      open={open}
      onClose={close}
      title={t("nearby.createTitle")}
      subtitle={t("nearby.createSubtitle")}
      heightPct={0.6}
    >
      <div className={uiStyles.sheetScroll}>
        <div className={s.body}>
          {createdCode ? (
            <>
              <p className={s.intro}>{t("nearby.createdCodeIntro")}</p>
              <div className={s.code}>{createdCode}</div>
              <Button label={t("common.done")} onPress={close} style={{ width: "100%" }} />
            </>
          ) : (
            <>
              <Field
                label={t("nearby.createNameLabel")}
                value={name}
                onChangeText={setName}
                placeholder={t("nearby.createNamePlaceholder")}
              />
              {error ? <p className={s.error}>{error}</p> : null}
              <div className={s.actions}>
                <Button
                  label={t("common.cancel")}
                  variant="outline"
                  onPress={close}
                  style={{ flex: 1 }}
                />
                <Button
                  label={t("nearby.create")}
                  onPress={() => void submit()}
                  disabled={!name.trim() || busy}
                  style={{ flex: 1 }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
