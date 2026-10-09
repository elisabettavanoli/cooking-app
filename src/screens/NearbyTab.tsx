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
import { useAuth } from "../lib/auth";
import s from "./NearbyTab.module.css";

function CommunitySearch() {
  const { t, lang } = useI18n();
  const { search, shareRequests, createShareRequest } = useCommunity();
  const { user } = useAuth();

  const [requestingKey, setRequestingKey] = useState<string | null>(null);
  const [requestFeedback, setRequestFeedback] = useState<{
    key: string;
    message: string;
    error: boolean;
  } | null>(null);
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

  const handleRequest = async (hit: CommunityItemHit) => {
    if (!user || requestingKey) return;

    const key = `${hit.ownerId}-${hit.communityId}-${hit.conceptId}`;

    setRequestingKey(key);
    setRequestFeedback(null);

    try {
      const result = await createShareRequest({
        communityId: hit.communityId,
        ownerId: hit.ownerId,
        conceptId: hit.conceptId,
      });

      if (result.error || !result.request) {
        setRequestFeedback({
          key,
          message: result.error ?? t("nearby.requestError"),
          error: true,
        });
        return;
      }

      setRequestFeedback({
        key,
        message: t("nearby.requestSent"),
        error: false,
      });
    } catch {
      setRequestFeedback({
        key,
        message: t("nearby.requestError"),
        error: true,
      });
    } finally {
      setRequestingKey(null);
    }
  };

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
          {hits.map((hit) => {
            const key = `${hit.ownerId}-${hit.communityId}-${hit.conceptId}`;

            const pendingRequest = shareRequests.some(
              (request) =>
                request.requesterId === user?.id &&
                request.ownerId === hit.ownerId &&
                request.communityId === hit.communityId &&
                request.conceptId === hit.conceptId &&
                request.status === "pending",
            );

            const isRequesting = requestingKey === key;
            const feedback = requestFeedback?.key === key ? requestFeedback : null;

            return (
              <div key={key} className={s.resultRow}>
                <FoodIcon iconKey={hit.conceptId} category={hit.category} size={44} />

                <div className={s.resultText}>
                  <div className={s.resultName}>
                    {foodName(hit.conceptId, lang, hit.displayName)}
                  </div>

                  <div className={s.resultMeta}>
                    {t("nearby.hitMeta", {
                      owner: hit.ownerName,
                      community: hit.communityName,
                    })}
                    {hit.quantity != null && (
                      <>
                        {" · "}
                        {formatAmount(hit.quantity, hit.unit, t)}
                      </>
                    )}
                  </div>

                  {feedback && (
                    <div role="status" className={feedback.error ? s.errorText : s.rowHint}>
                      {feedback.message}
                    </div>
                  )}
                </div>

                {hit.ownerId !== user?.id && (
                  <div className={s.requestAction}>
                    {pendingRequest ? (
                      <span className={s.requestStatus}>{t("nearby.requestPending")}</span>
                    ) : (
                      <Button
                        label={isRequesting ? t("nearby.requesting") : t("nearby.requestButton")}
                        onPress={() => void handleRequest(hit)}
                        disabled={isRequesting || requestingKey !== null}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function ShareRequestsPanel() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { shareRequests, requestsReady, updateShareRequest } = useCommunity();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState(false);

  const received = shareRequests.filter((request) => request.ownerId === user?.id);
  const sent = shareRequests.filter((request) => request.requesterId === user?.id);

  const handleAction = async (requestId: string, action: "accept" | "decline" | "cancel") => {
    if (busyId) return;

    setBusyId(requestId);
    setActionError(false);

    try {
      const result = await updateShareRequest(requestId, action);

      if (result.error || !result.request) {
        setActionError(true);
      }
    } catch {
      setActionError(true);
    } finally {
      setBusyId(null);
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return t("nearby.requestStatusPending");
      case "accepted":
        return t("nearby.requestStatusAccepted");
      case "declined":
        return t("nearby.requestStatusDeclined");
      case "cancelled":
        return t("nearby.requestStatusCancelled");
      default:
        return status;
    }
  };

  const renderRequest = (
    request: (typeof shareRequests)[number],
    direction: "received" | "sent",
  ) => {
    const pending = request.status === "pending";
    const busy = busyId === request.id;

    return (
      <div key={request.id} className={s.requestRow}>
        <div className={s.requestText}>
          <div className={s.resultName}>
            {foodName(request.conceptId, lang, request.displayName)}
          </div>

          <div className={s.resultMeta}>
            {direction === "received"
              ? t("nearby.requestReceivedMeta")
              : t("nearby.requestSentMeta")}
          </div>

          <span className={s.requestStatus}>{statusLabel(request.status)}</span>
        </div>

        {pending && (
          <div className={s.requestButtons}>
            {direction === "received" ? (
              <>
                <Button
                  label={busy ? "…" : t("nearby.requestAccept")}
                  onPress={() => void handleAction(request.id, "accept")}
                  disabled={busyId !== null}
                />
                <Button
                  label={t("nearby.requestDecline")}
                  variant="outline"
                  onPress={() => void handleAction(request.id, "decline")}
                  disabled={busyId !== null}
                />
              </>
            ) : (
              <Button
                label={busy ? "…" : t("nearby.requestCancel")}
                variant="outline"
                onPress={() => void handleAction(request.id, "cancel")}
                disabled={busyId !== null}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={s.card}>
      <p className={s.sectionTitle}>{t("nearby.requestsTitle").toUpperCase()}</p>

      {!requestsReady ? (
        <p className={s.rowHint}>{t("nearby.requestsLoading")}</p>
      ) : (
        <>
          <div>
            <p className={s.rowHint}>{t("nearby.requestsReceived")}</p>

            {received.length === 0 ? (
              <p className={s.emptyState}>{t("nearby.requestsNoneReceived")}</p>
            ) : (
              <div className={s.requestList}>
                {received.map((request) => renderRequest(request, "received"))}
              </div>
            )}
          </div>

          <div className={s.divider} />

          <div>
            <p className={s.rowHint}>{t("nearby.requestsSentSection")}</p>

            {sent.length === 0 ? (
              <p className={s.emptyState}>{t("nearby.requestsNoneSent")}</p>
            ) : (
              <div className={s.requestList}>
                {sent.map((request) => renderRequest(request, "sent"))}
              </div>
            )}
          </div>
        </>
      )}

      {actionError && (
        <p role="alert" className={s.errorText}>
          {t("nearby.requestActionError")}
        </p>
      )}
    </div>
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
        <ShareRequestsPanel />

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
                  <button type="button" className={s.leaveBtn} onClick={() => void leave(c.id)}>
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
