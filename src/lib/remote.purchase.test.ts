import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("./supabase", () => ({
  supabase: { rpc },
}));

import { purchaseShoppingItem } from "./remote";

describe("purchaseShoppingItem", () => {
  beforeEach(() => rpc.mockReset().mockResolvedValue({ error: null }));

  it("calls the purchase RPC with only the shopping item ID", async () => {
    await purchaseShoppingItem("shopping-123");

    expect(rpc).toHaveBeenCalledExactlyOnceWith("co_purchase_shopping_item", {
      p_shopping_item_id: "shopping-123",
    });
  });

  it("throws Supabase errors", async () => {
    const error = new Error("RPC failed");
    rpc.mockResolvedValue({ error });

    await expect(purchaseShoppingItem("shopping-123")).rejects.toBe(error);
  });
});
