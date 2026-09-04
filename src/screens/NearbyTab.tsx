import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { FoodIcon } from "../components/FoodIcon";
import { Button } from "../components/ui";
import { CreateCommunitySheet } from "../components/CreateCommunitySheet";
import { NearbyMap } from "../components/NearbyMap";
import { PageInfo } from "../components/PageInfo";
import { colors } from "../lib/theme";
import { useI18n } from "../lib/i18n";
import { foodName } from "../lib/foodNames";
import { formatAmount } from "../lib/units";
import { useCommunity } from "../lib/community-store";
import type { CommunityItemHit } from "../lib/types";
import s from "./NearbyTab.module.css";

function CommunitySearch() {
  const { t, lang } = useI18n();
  const { search } = useCommunity();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<CommunityItemHit[]>([]);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    const query = q.trim();
    if (!query) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++reqId.current;
    const handle = setTimeout(async () => {
      const results = await search(query);
      if (reqId.current === id) {
        setHits(results);
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [q, search]);

  return (
    <>
      <div className={s.searchBox}>
        <Search size={16} color={colors.mutedForeground} />
        <input
          className={s.searchInput}
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          placeholder={t("nearby.searchPlaceholder")}
          aria-label={t("nearby.searchLabel")}
          inputMode="search"
        />
      </div>

      {!q.trim() ? (
        <p className={s.hintBlock}>{t("nearby.searchEmpty")}</p>
      ) : loading ? (
        <p className={s.hintBlock}>{t("nearby.searching")}</p>
      ) : hits.length === 0 ? (
        <p className={s.hintBlock}>{t("nearby.searchNoResults")}</p>
      ) : (
        <div className={s.results}>
          {hits.map((hit) => (
            <div key={`${hit.ownerId}-${hit.communityId}-${hit.conceptId}`} className={s.resultRow}>
              <FoodIcon iconKey={hit.conceptId} category={hit.category} size={40} />
              <div className={s.resultText}>
                <div className={s.resultName}>
                  {foodName(hit.conceptId, lang, hit.displayName)}
                </div>
                <div className={s.resultMeta}>
                  {t("nearby.hitMeta", { owner: hit.ownerName, community: hit.communityName })}
                  {" · "}
                  {formatAmount(hit.quantity, hit.unit, t)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function NearbyTab() {
  const { t } = useI18n();
  const { enabled, communities, join, leave } = useCommunity();
  const [code, setCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const submitJoin = async () => {
    const c = code.trim();
    if (!c || joining) return;
    setJoining(true);
    setJoinError(null);
    const res = await join(c);
    setJoining(false);
    if (res.error) {
      setJoinError(t("nearby.joinError"));
      return;
    }
    setCode("");
  };

  const copyCode = async (id: string, value: string) => {
    try {
      await navigator.clipboard?.writeText(value);
      setCopiedId(id);
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500);
    } catch {
      // clipboard unavailable — no-op
    }
  };

  if (!enabled) {
    return (
      <div className={s.screen}>
        <div className={s.scroll}>
          <div className={s.headerRow}>
            <h1 className={s.title}>{t("nearby.title")}</h1>
            <PageInfo title={t("nearby.title")} text={t("nearby.infoText")} />
          </div>
          <p className={s.subtitle}>{t("nearby.subtitle")}</p>
          <div className={s.card}>
            <p className={s.rowHint}>{t("nearby.signInPrompt")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={s.screen}>
      <div className={s.scroll}>
        <div className={s.headerRow}>
          <h1 className={s.title}>{t("nearby.title")}</h1>
          <PageInfo title={t("nearby.title")} text={t("nearby.infoText")} />
        </div>
        <p className={s.subtitle}>{t("nearby.subtitle")}</p>

        <CommunitySearch />

        <div className={s.card}>
          <p className={s.sectionTitle}>{t("nearby.yourCommunities").toUpperCase()}</p>
          {communities.length === 0 ? (
            <p className={s.emptyState}>{t("nearby.noCommunities")}</p>
          ) : (
            communities.map((c, i) => (
              <div key={c.id}>
                {i > 0 && <div className={s.divider} />}
                <div className={s.communityRow}>
                  <div className={s.communityText}>
                    <div className={s.communityName}>{c.name}</div>
                    <div className={s.communitySub}>
                      <button
                        type="button"
                        className={s.codeChip}
                        onClick={() => void copyCode(c.id, c.code)}
                      >
                        {copiedId === c.id ? t("nearby.codeCopied") : c.code}
                      </button>
                      <span>{t("nearby.memberCount", { n: c.memberCount ?? 1 })}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={s.leaveBtn}
                    onClick={() => void leave(c.id)}
                  >
                    {t("nearby.leave")}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={s.card}>
          <p className={s.sectionTitle}>{t("nearby.addCommunity").toUpperCase()}</p>
          <p className={s.rowHint}>{t("nearby.joinHint")}</p>
          <div className={s.joinRow}>
            <input
              className={s.input}
              value={code}
              onChange={(e) => {
                setCode(e.currentTarget.value.toUpperCase());
                setJoinError(null);
              }}
              placeholder="PASTA-1234"
              autoCapitalize="characters"
              aria-label={t("nearby.joinTitle")}
            />
            <Button
              label={t("nearby.join")}
              onPress={() => void submitJoin()}
              disabled={!code.trim() || joining}
            />
          </div>
          {joinError && <p className={s.errorText}>{joinError}</p>}
          <Button
            label={t("nearby.create")}
            variant="outline"
            onPress={() => setCreateOpen(true)}
            style={{ width: "100%" }}
          />
        </div>

        <div className={s.card}>
          <p className={s.sectionTitle}>{t("nearby.mapTitle").toUpperCase()}</p>
          <NearbyMap />
        </div>
      </div>

      <CreateCommunitySheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
