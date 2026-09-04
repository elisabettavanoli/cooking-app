import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clear } from "idb-keyval";
import { App } from "./App";

async function bootToKitchen(_user: ReturnType<typeof userEvent.setup>) {
  const result = render(<App />);
  await waitFor(() => screen.getByText(/my kitchen/i));
  return result;
}

beforeEach(async () => {
  await clear();
  localStorage.clear();
});

describe("App interactions", () => {
  it("opens the Add sheet, adds an item, and persists it across a remount", async () => {
    const user = userEvent.setup();
    const first = await bootToKitchen(user);

    await user.click(screen.getByRole("button", { name: /add ingredient/i }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByPlaceholderText(/tomatoes/i), "Sardines");
    await user.click(within(dialog).getByRole("button", { name: /add to kitchen/i }));

    await waitFor(() => expect(screen.getByText("Sardines")).toBeDefined());

    // idb-keyval write is debounced through an effect; give it a tick then remount.
    await waitFor(async () => {
      const { get } = await import("idb-keyval");
      const raw = (await get<string>("cooking-store-v1")) ?? "";
      expect(raw).toContain("Sardines");
    });

    first.unmount();
    const user2 = userEvent.setup();
    await bootToKitchen(user2);
    expect(screen.getByText("Sardines")).toBeDefined();
  });

  it("adding the same item twice increases its quantity instead of duplicating it", async () => {
    const user = userEvent.setup();
    await bootToKitchen(user);

    for (let i = 0; i < 2; i += 1) {
      await user.click(screen.getByRole("button", { name: /add ingredient/i }));
      const dialog = await screen.findByRole("dialog");
      await user.type(within(dialog).getByPlaceholderText(/tomatoes/i), "Sardines");
      await user.click(within(dialog).getByRole("button", { name: /add to kitchen/i }));
      await waitFor(() => expect(screen.getByText("Sardines")).toBeDefined());
    }

    expect(screen.getAllByText("Sardines")).toHaveLength(1);
    expect(screen.getByText("2 pieces")).toBeDefined();
  });

  it("toggles a kitchen-sharing switch on the Profile tab", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByText(/my kitchen/i));
    await user.click(screen.getByRole("button", { name: "Profile" }));

    const toggle = screen.getByRole("switch", { name: /share with my communities/i });
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    await user.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("true");
  });
});
