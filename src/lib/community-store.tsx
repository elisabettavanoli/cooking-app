/**
 * Community discovery context. Remote-only: it activates when Supabase is
 * configured AND a user is signed in, and is an inert empty shell otherwise
 * (local mode, tests) — it never throws and never touches the network.
 *
 * Mirrors the realtime pattern in `store.tsx`: subscribe to the user's own
 * `community_members` rows and debounce-refetch the community list on any change.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase, supabaseConfigured } from "./supabase";
import { useAuth } from "./auth";
import type { Community, CommunityItemHit, NearbyKitchen } from "./types";
import * as api from "./community";

interface CommunityValue {
  /** Discovery is live (signed in against a real backend). */
  enabled: boolean;
  /** Initial community list load finished (always true when disabled). */
  ready: boolean;
  communities: Community[];
  createCommunity: (name: string) => Promise<{ community: Community | null; error: string | null }>;
  join: (code: string) => Promise<{ error: string | null }>;
  leave: (communityId: string) => Promise<void>;
  search: (query: string) => Promise<CommunityItemHit[]>;
  nearbyKitchens: (lat: number, lng: number, radiusKm?: number) => Promise<NearbyKitchen[]>;
}

const CommunityContext = createContext<CommunityValue | null>(null);

function errMessage(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return String(e);
}

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const enabled = supabaseConfigured && !!userId;

  const [communities, setCommunities] = useState<Community[]>([]);
  const [ready, setReady] = useState(!enabled);

  const reload = useCallback(async () => {
    if (!enabled || !userId) return;
    try {
      setCommunities(await api.fetchMyCommunities(userId));
    } catch (e) {
      console.error("[community] load failed", e);
    } finally {
      setReady(true);
    }
  }, [enabled, userId]);

  useEffect(() => {
    if (!enabled) {
      setCommunities([]);
      setReady(true);
      return;
    }
    setReady(false);
    void reload();
  }, [enabled, reload]);

  // realtime: my membership rows change → debounced refetch
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const client = supabase;
    if (!enabled || !userId || !client) return;
    const bump = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void reload(), 600);
    };
    const channel = client
      .channel(`community:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "community_members",
          filter: `user_id=eq.${userId}`,
        },
        bump,
      )
      .subscribe();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      void client.removeChannel(channel);
    };
  }, [enabled, userId, reload]);

  const createCommunity = useCallback<CommunityValue["createCommunity"]>(
    async (name) => {
      if (!enabled) return { community: null, error: null };
      try {
        const community = await api.createCommunity(name);
        setCommunities((prev) =>
          prev.some((c) => c.id === community.id) ? prev : [...prev, community],
        );
        void reload();
        return { community, error: null };
      } catch (e) {
        return { community: null, error: errMessage(e) };
      }
    },
    [enabled, reload],
  );

  const join = useCallback<CommunityValue["join"]>(
    async (code) => {
      if (!enabled) return { error: null };
      try {
        await api.joinByCode(code);
        void reload();
        return { error: null };
      } catch (e) {
        return { error: errMessage(e) };
      }
    },
    [enabled, reload],
  );

  const leave = useCallback<CommunityValue["leave"]>(
    async (communityId) => {
      if (!enabled || !userId) return;
      setCommunities((prev) => prev.filter((c) => c.id !== communityId));
      try {
        await api.leaveCommunity(communityId, userId);
      } catch (e) {
        console.error("[community] leave failed", e);
        void reload();
      }
    },
    [enabled, userId, reload],
  );

  const search = useCallback<CommunityValue["search"]>(
    async (query) => {
      if (!enabled) return [];
      try {
        return await api.searchSharedItem(query);
      } catch (e) {
        console.error("[community] search failed", e);
        return [];
      }
    },
    [enabled],
  );

  const nearbyKitchens = useCallback<CommunityValue["nearbyKitchens"]>(
    async (lat, lng, radiusKm) => {
      if (!enabled) return [];
      try {
        return await api.fetchNearbyKitchens(lat, lng, radiusKm);
      } catch (e) {
        console.error("[community] nearby failed", e);
        return [];
      }
    },
    [enabled],
  );

  const value: CommunityValue = {
    enabled,
    ready,
    communities,
    createCommunity,
    join,
    leave,
    search,
    nearbyKitchens,
  };

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>;
}

export function useCommunity(): CommunityValue {
  const ctx = useContext(CommunityContext);
  if (!ctx) throw new Error("useCommunity must be used within a CommunityProvider");
  return ctx;
}
