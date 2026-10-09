import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ShareRequest } from "./types";

const { api, channel, authState } = vi.hoisted(() => ({
  api: {
    fetchMyCommunities: vi.fn(),
    fetchShareRequests: vi.fn(),
    createCommunity: vi.fn(),
    joinByCode: vi.fn(),
    leaveCommunity: vi.fn(),
    searchSharedItem: vi.fn(),
    fetchNearbyKitchens: vi.fn(),
    createShareRequest: vi.fn(),
    updateShareRequest: vi.fn(),
  },
  channel: {
    on: vi.fn(),
    subscribe: vi.fn(),
  },
  authState: {
    user: { id: "user-1" } as { id: string } | null,
  },
}));

channel.on.mockReturnValue(channel);
channel.subscribe.mockReturnValue(channel);

vi.mock("./community", () => api);

vi.mock("./supabase", () => ({
  supabaseConfigured: true,
  supabase: {
    channel: () => channel,
    removeChannel: vi.fn(),
  },
}));

vi.mock("./auth", () => ({
  useAuth: () => ({ user: authState.user }),
}));

import { CommunityProvider, useCommunity } from "./community-store";

const shareRequest = {
  id: "request-1",
  communityId: "community-1",
  communityName: "My community",
  requesterId: "user-1",
  requesterName: "You",
  ownerId: "user-2",
  ownerName: "Alex",
  conceptId: "tomato",
  displayName: "Tomatoes",
  quantity: 2,
  unit: "piece" as const,
  message: "Could I borrow some?",
  status: "pending" as const,
  createdAt: "2026-10-09T10:00:00.000Z",
  updatedAt: "2026-10-09T10:00:00.000Z",
};

describe("community store share requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.user = { id: "user-1" };

    channel.on.mockReturnValue(channel);
    channel.subscribe.mockReturnValue(channel);

    api.fetchMyCommunities.mockResolvedValue([]);
    api.fetchShareRequests.mockResolvedValue([]);
    api.createShareRequest.mockResolvedValue(shareRequest);
    api.updateShareRequest.mockResolvedValue(shareRequest);
  });

  it("loads share requests when the provider is enabled", async () => {
    api.fetchShareRequests.mockResolvedValue([shareRequest]);

    const { result } = renderHook(() => useCommunity(), {
      wrapper: ({ children }) => <CommunityProvider>{children}</CommunityProvider>,
    });

    await waitFor(() => {
      expect(result.current.requestsReady).toBe(true);
    });

    expect(api.fetchShareRequests).toHaveBeenCalledWith("user-1");
    expect(result.current.shareRequests).toEqual([shareRequest]);
  });

  it("adds a successfully created share request to the state", async () => {
    const { result } = renderHook(() => useCommunity(), {
      wrapper: ({ children }) => <CommunityProvider>{children}</CommunityProvider>,
    });

    await waitFor(() => {
      expect(result.current.requestsReady).toBe(true);
    });

    let response: { request: ShareRequest | null; error: string | null } | undefined;

    await act(async () => {
      response = await result.current.createShareRequest({
        communityId: "community-1",
        ownerId: "user-2",
        conceptId: "tomato",
        message: "Could I borrow some?",
      });
    });

    expect(api.createShareRequest).toHaveBeenCalledWith({
      communityId: "community-1",
      ownerId: "user-2",
      conceptId: "tomato",
      message: "Could I borrow some?",
    });

    expect(response).toEqual({
      request: shareRequest,
      error: null,
    });

    expect(result.current.shareRequests).toEqual([shareRequest]);
  });

  it("does not duplicate a request with the same ID", async () => {
    api.fetchShareRequests.mockResolvedValue([shareRequest]);

    const { result } = renderHook(() => useCommunity(), {
      wrapper: ({ children }) => <CommunityProvider>{children}</CommunityProvider>,
    });

    await waitFor(() => {
      expect(result.current.requestsReady).toBe(true);
    });

    await act(async () => {
      await result.current.createShareRequest({
        communityId: "community-1",
        ownerId: "user-2",
        conceptId: "tomato",
      });
    });

    expect(result.current.shareRequests).toHaveLength(1);
    expect(result.current.shareRequests[0]).toEqual(shareRequest);
  });

  it("does not change the state when creating a request fails", async () => {
    const initialRequest = {
      ...shareRequest,
      id: "existing-request",
    };

    api.fetchShareRequests.mockResolvedValue([initialRequest]);
    api.createShareRequest.mockRejectedValue(new Error("Unable to create request"));

    const { result } = renderHook(() => useCommunity(), {
      wrapper: ({ children }) => <CommunityProvider>{children}</CommunityProvider>,
    });

    await waitFor(() => {
      expect(result.current.requestsReady).toBe(true);
    });

    let response: { request: ShareRequest | null; error: string | null } | undefined;

    await act(async () => {
      response = await result.current.createShareRequest({
        communityId: "community-1",
        ownerId: "user-2",
        conceptId: "tomato",
      });
    });

    expect(response).toEqual({
      request: null,
      error: "Unable to create request",
    });

    expect(result.current.shareRequests).toEqual([initialRequest]);
  });

  it.each([
    ["accept", "accepted"],
    ["decline", "declined"],
    ["cancel", "cancelled"],
  ] as const)("updates a request when the action is %s", async (action, status) => {
    const updatedRequest: ShareRequest = {
      ...shareRequest,
      status,
    };

    api.fetchShareRequests.mockResolvedValue([shareRequest]);
    api.updateShareRequest.mockResolvedValue(updatedRequest);

    const { result } = renderHook(() => useCommunity(), {
      wrapper: ({ children }) => <CommunityProvider>{children}</CommunityProvider>,
    });

    await waitFor(() => {
      expect(result.current.requestsReady).toBe(true);
    });

    let response: { request: ShareRequest | null; error: string | null } | undefined;

    await act(async () => {
      response = await result.current.updateShareRequest(shareRequest.id, action);
    });

    expect(api.updateShareRequest).toHaveBeenCalledWith(shareRequest.id, action);

    expect(response).toEqual({
      request: updatedRequest,
      error: null,
    });

    expect(result.current.shareRequests).toEqual([updatedRequest]);
  });

  it("updates only the request returned by the API", async () => {
    const otherRequest: ShareRequest = {
      ...shareRequest,
      id: "request-2",
      conceptId: "apple",
      displayName: "Apples",
    };

    const updatedRequest: ShareRequest = {
      ...shareRequest,
      status: "accepted",
    };

    api.fetchShareRequests.mockResolvedValue([shareRequest, otherRequest]);
    api.updateShareRequest.mockResolvedValue(updatedRequest);

    const { result } = renderHook(() => useCommunity(), {
      wrapper: ({ children }) => <CommunityProvider>{children}</CommunityProvider>,
    });

    await waitFor(() => {
      expect(result.current.requestsReady).toBe(true);
    });

    await act(async () => {
      await result.current.updateShareRequest(shareRequest.id, "accept");
    });

    expect(result.current.shareRequests).toEqual([updatedRequest, otherRequest]);
  });

  it("does not change the state when updating a request fails", async () => {
    const initialRequest: ShareRequest = {
      ...shareRequest,
      status: "pending",
    };

    api.fetchShareRequests.mockResolvedValue([initialRequest]);
    api.updateShareRequest.mockRejectedValue(new Error("Unable to update request"));

    const { result } = renderHook(() => useCommunity(), {
      wrapper: ({ children }) => <CommunityProvider>{children}</CommunityProvider>,
    });

    await waitFor(() => {
      expect(result.current.requestsReady).toBe(true);
    });

    let response: { request: ShareRequest | null; error: string | null } | undefined;

    await act(async () => {
      response = await result.current.updateShareRequest(initialRequest.id, "accept");
    });

    expect(response).toEqual({
      request: null,
      error: "Unable to update request",
    });

    expect(result.current.shareRequests).toEqual([initialRequest]);
  });

  it("disables community features when no user is authenticated", async () => {
    authState.user = null;

    const { result } = renderHook(() => useCommunity(), {
      wrapper: ({ children }) => <CommunityProvider>{children}</CommunityProvider>,
    });

    await waitFor(() => {
      expect(result.current.requestsReady).toBe(true);
      expect(result.current.ready).toBe(true);
    });

    expect(result.current.enabled).toBe(false);
    expect(result.current.shareRequests).toEqual([]);
    expect(result.current.communities).toEqual([]);

    let createResponse: { request: ShareRequest | null; error: string | null } | undefined;

    let updateResponse: { request: ShareRequest | null; error: string | null } | undefined;

    await act(async () => {
      createResponse = await result.current.createShareRequest({
        communityId: "community-1",
        ownerId: "user-2",
        conceptId: "tomato",
      });

      updateResponse = await result.current.updateShareRequest("request-1", "accept");
    });

    expect(createResponse).toEqual({
      request: null,
      error: "Community features are unavailable",
    });

    expect(updateResponse).toEqual({
      request: null,
      error: "Community features are unavailable",
    });

    expect(api.fetchShareRequests).not.toHaveBeenCalled();
    expect(api.createShareRequest).not.toHaveBeenCalled();
    expect(api.updateShareRequest).not.toHaveBeenCalled();
  });

  it("marks share requests as ready when the initial load fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    api.fetchShareRequests.mockRejectedValue(new Error("Unable to load share requests"));

    try {
      const { result } = renderHook(() => useCommunity(), {
        wrapper: ({ children }) => <CommunityProvider>{children}</CommunityProvider>,
      });

      await waitFor(() => {
        expect(result.current.requestsReady).toBe(true);
      });

      expect(result.current.shareRequests).toEqual([]);

      expect(consoleError).toHaveBeenCalledWith(
        "[community] share requests load failed",
        expect.any(Error),
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it("reloads share requests when a realtime event occurs", async () => {
    const { result, unmount } = renderHook(() => useCommunity(), {
      wrapper: ({ children }) => <CommunityProvider>{children}</CommunityProvider>,
    });

    await waitFor(() => {
      expect(result.current.requestsReady).toBe(true);
    });

    expect(api.fetchShareRequests).toHaveBeenCalledTimes(1);

    const requestRegistrations = channel.on.mock.calls.filter(
      ([event, config]) => event === "postgres_changes" && config.table === "share_requests",
    );

    expect(requestRegistrations).toHaveLength(2);

    const registration = requestRegistrations.find(
      ([, config]) => config.filter === "requester_id=eq.user-1",
    );

    expect(registration).toBeDefined();

    const callback = registration?.[2];

    expect(callback).toBeTypeOf("function");

    await act(async () => {
      (callback as () => void)();
    });

    await waitFor(
      () => {
        expect(api.fetchShareRequests).toHaveBeenCalledTimes(2);
      },
      { timeout: 3000 },
    );

    unmount();
  });
});
