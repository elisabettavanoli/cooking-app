import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clear } from "idb-keyval";
import { App } from "./App";

async function bootToKitchen(user: ReturnType<typeof userEvent.setup>) {
  const result = render(<App />);
  await waitFor(() => screen.getByText(/what can i cook\?/i));
  await user.click(screen.getByRole("button", { name: "Kitchen" }));
  screen.getByText(/my kitchen/i);
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
    await user.type(within(dialog).getByPlaceholderText(/3 red tomatoes/i), "Sardines");
    await user.click(within(dialog).getByRole("button", { name: /add to kitchen/i }));

    await waitFor(() => expect(screen.getByText("Sardines")).toBeDefined());

    // idb-keyval write is debounced through an effect; give it a tick then remount.
    await waitFor(async () => {
      const { get } = await import("idb-keyval");
      const raw = (await get<string>("pantry-store-v1")) ?? "";
      expect(raw).toContain("Sardines");
    });

    first.unmount();
    const user2 = userEvent.setup();
    await bootToKitchen(user2);
    expect(screen.getByText("Sardines")).toBeDefined();
  });

  it("toggles a Nearby privacy switch", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByText(/what can i cook\?/i));
    await user.click(screen.getByRole("button", { name: "Nearby" }));

    const toggle = screen.getByRole("switch", { name: /enable sharing/i });
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    await user.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("true");
  });
});
