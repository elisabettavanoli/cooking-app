import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { remoteFns, channel } = vi.hoisted(() => ({
  remoteFns: {
    fetchAll: vi.fn(),
    purchaseShoppingItem: vi.fn(),
    patchInventory: vi.fn(),
    insertInventory: vi.fn(),
    patchShopping: vi.fn(),
  },
  channel: {
    on: vi.fn(),
    subscribe: vi.fn(),
  },
}));

channel.on.mockReturnValue(channel);
channel.subscribe.mockReturnValue(channel);

vi.mock("./remote", () => remoteFns);
vi.mock("./supabase", () => ({
  supabaseConfigured: true,
  supabase: {
    channel: () => channel,
    removeChannel: vi.fn(),
  },
}));
vi.mock("./auth", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

import { CookingProvider, useCooking } from "./store";

const shoppingItem = {
  id: "shopping-1",
  conceptId: "tomato",
  displayName: "tomatoes",
  quantity: 2,
  unit: "piece" as const,
  category: "vegetables" as const,
  purchased: false,
  source: "manual" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("remote shopping purchase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    channel.on.mockReturnValue(channel);
    channel.subscribe.mockReturnValue(channel);
    remoteFns.fetchAll.mockResolvedValue({
      inventory: [],
      shoppingList: [shoppingItem],
      profile: {
        id: "user-1",
        displayName: "You",
        shareWithCommunities: false,
        shareOnMap: false,
        requestsEnabled: false,
        latitude: null,
        longitude: null,
      },
    });
    remoteFns.purchaseShoppingItem.mockResolvedValue(undefined);
  });

  it("uses the RPC as its only purchase write, then reloads server state", async () => {
    const { result } = renderHook(() => useCooking(), {
      wrapper: ({ children }) => <CookingProvider>{children}</CookingProvider>,
    });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    await act(async () => {
      result.current.markShoppingItemPurchased("shopping-1", true);
    });

    await waitFor(() => expect(remoteFns.purchaseShoppingItem).toHaveBeenCalledWith("shopping-1"));
    await waitFor(() => expect(remoteFns.fetchAll).toHaveBeenCalledTimes(2));
    expect(remoteFns.patchInventory).not.toHaveBeenCalled();
    expect(remoteFns.insertInventory).not.toHaveBeenCalled();
    expect(remoteFns.patchShopping).not.toHaveBeenCalled();
  });
});
