import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc, from } = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
}));

vi.mock("./supabase", () => ({
  supabase: { rpc, from },
}));

import {
  searchSharedItem,
  fetchShareRequests,
  createShareRequest,
  updateShareRequest,
} from "./community";

describe("searchSharedItem", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("returns an empty array when the query is empty", async () => {
    expect(await searchSharedItem("   ")).toEqual([]);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("trims the query and maps the results to camelCase", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          owner_id: "owner-1",
          owner_name: "Alice",
          community_id: "community-1",
          community_name: "Students",
          concept_id: "tomato",
          display_name: "Tomatoes",
          category: "vegetable",
          quantity: "2",
          unit: "pcs",
          requests_enabled: true,
        },
      ],
      error: null,
    });

    const result = await searchSharedItem("  tomato  ");

    expect(rpc).toHaveBeenCalledExactlyOnceWith("co_search_shared_item", {
      p_query: "tomato",
    });

    expect(result).toEqual([
      {
        ownerId: "owner-1",
        ownerName: "Alice",
        communityId: "community-1",
        communityName: "Students",
        conceptId: "tomato",
        displayName: "Tomatoes",
        category: "vegetable",
        quantity: 2,
        unit: "pcs",
        requestsEnabled: true,
      },
    ]);
  });

  it("returns an empty array when no shared ingredients match", async () => {
    rpc.mockResolvedValue({ data: null, error: null });

    await expect(searchSharedItem("tomato")).resolves.toEqual([]);
  });

  it("throws when Supabase returns an error", async () => {
    const error = new Error("Search failed");
    rpc.mockResolvedValue({ data: null, error });

    await expect(searchSharedItem("tomato")).rejects.toBe(error);
  });
});

describe("fetchShareRequests", () => {
  beforeEach(() => {
    from.mockReset();
  });

  function mockShareRequestsQuery(result: { data: unknown; error: Error | null }) {
    const order = vi.fn().mockResolvedValue(result);
    const or = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ or });

    from.mockReturnValue({ select });

    return { select, or, order };
  }

  it("fetches requests involving the user, newest first", async () => {
    const query = mockShareRequestsQuery({
      data: [
        {
          id: "request-1",
          requester_id: "user-1",
          owner_id: "owner-1",
          community_id: "community-1",
          concept_id: "tomato",
          display_name: "Tomatoes",
          status: "pending",
          message: null,
          created_at: "2026-10-09T10:00:00Z",
        },
      ],
      error: null,
    });

    const result = await fetchShareRequests("user-1");

    expect(from).toHaveBeenCalledExactlyOnceWith("share_requests");

    expect(query.select).toHaveBeenCalledWith(
      "id, community_id, requester_id, owner_id, concept_id, display_name, status, message, created_at",
    );

    expect(query.or).toHaveBeenCalledWith("requester_id.eq.user-1,owner_id.eq.user-1");

    expect(query.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });

    expect(result).toEqual([
      {
        id: "request-1",
        requesterId: "user-1",
        ownerId: "owner-1",
        communityId: "community-1",
        conceptId: "tomato",
        displayName: "Tomatoes",
        status: "pending",
        message: undefined,
        createdAt: "2026-10-09T10:00:00Z",
      },
    ]);
  });

  it("returns an empty array when there are no requests", async () => {
    mockShareRequestsQuery({ data: null, error: null });

    await expect(fetchShareRequests("user-1")).resolves.toEqual([]);
  });

  it("throws when Supabase returns an error", async () => {
    const error = new Error("Could not load requests");
    mockShareRequestsQuery({ data: null, error });

    await expect(fetchShareRequests("user-1")).rejects.toBe(error);
  });
});

describe("createShareRequest", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("calls the creation RPC with the expected parameters", async () => {
    rpc.mockResolvedValue({
      data: {
        id: "request-1",
        requester_id: "user-1",
        owner_id: "owner-1",
        community_id: "community-1",
        concept_id: "tomato",
        display_name: "Tomatoes",
        status: "pending",
        message: "  Could I borrow some?  ",
        created_at: "2026-10-09T10:00:00Z",
      },
      error: null,
    });

    const result = await createShareRequest({
      communityId: "community-1",
      ownerId: "owner-1",
      conceptId: "tomato",
      message: "  Could I borrow some?  ",
    });

    expect(rpc).toHaveBeenCalledExactlyOnceWith("co_create_share_request", {
      p_community_id: "community-1",
      p_owner_id: "owner-1",
      p_concept_id: "tomato",
      p_message: "Could I borrow some?",
    });

    expect(result).toEqual({
      id: "request-1",
      requesterId: "user-1",
      ownerId: "owner-1",
      communityId: "community-1",
      conceptId: "tomato",
      displayName: "Tomatoes",
      status: "pending",
      message: "  Could I borrow some?  ",
      createdAt: "2026-10-09T10:00:00Z",
    });
  });

  it("sends null when the message is empty or only whitespace", async () => {
    rpc.mockResolvedValue({
      data: {
        id: "request-2",
        requester_id: "user-1",
        owner_id: "owner-1",
        community_id: "community-1",
        concept_id: "tomato",
        display_name: "Tomatoes",
        status: "pending",
        message: null,
        created_at: "2026-10-09T10:00:00Z",
      },
      error: null,
    });

    await createShareRequest({
      communityId: "community-1",
      ownerId: "owner-1",
      conceptId: "tomato",
      message: "   ",
    });

    expect(rpc).toHaveBeenCalledWith("co_create_share_request", {
      p_community_id: "community-1",
      p_owner_id: "owner-1",
      p_concept_id: "tomato",
      p_message: null,
    });
  });

  it("throws when Supabase returns an error", async () => {
    const error = new Error("Request creation failed");
    rpc.mockResolvedValue({ data: null, error });

    await expect(
      createShareRequest({
        communityId: "community-1",
        ownerId: "owner-1",
        conceptId: "tomato",
      }),
    ).rejects.toBe(error);
  });
});

describe("updateShareRequest", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it.each(["accept", "decline", "cancel"] as const)(
    "sends the %s action to the update RPC",
    async (action) => {
      const expectedStatus =
        action === "accept" ? "accepted" : action === "decline" ? "declined" : "cancelled";

      rpc.mockResolvedValue({
        data: {
          id: "request-1",
          requester_id: "user-1",
          owner_id: "owner-1",
          community_id: "community-1",
          concept_id: "tomato",
          display_name: "Tomatoes",
          status: expectedStatus,
          message: null,
          created_at: "2026-10-09T10:00:00Z",
        },
        error: null,
      });

      const result = await updateShareRequest("request-1", action);

      expect(rpc).toHaveBeenCalledExactlyOnceWith("co_update_share_request", {
        p_request_id: "request-1",
        p_action: action,
      });

      expect(result.status).toBe(expectedStatus);
    },
  );

  it("throws when Supabase returns an error", async () => {
    const error = new Error("Request update failed");
    rpc.mockResolvedValue({ data: null, error });

    await expect(updateShareRequest("request-1", "accept")).rejects.toBe(error);
  });
});
