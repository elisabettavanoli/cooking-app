import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
import { initialInventorySeed } from "./lib/data";

describe("App smoke", () => {
  it("hydrates and renders the Cook tab with the seeded pantry", async () => {
    render(<App />);
    expect(screen.getByText(/loading your kitchen/i)).toBeDefined();

    await waitFor(() =>
      expect(screen.getByText(/what can i cook\?/i)).toBeDefined(),
    );
    expect(
      screen.getByText(new RegExp(`${initialInventorySeed.length} items in your kitchen`)),
    ).toBeDefined();
  });

  it("navigates to the Kitchen tab and shows the inventory grid", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByText(/what can i cook\?/i));

    await user.click(screen.getByRole("button", { name: "Kitchen" }));
    expect(screen.getByText(/my kitchen/i)).toBeDefined();
    expect(
      screen.getByText(new RegExp(`${initialInventorySeed.length} items tracked`)),
    ).toBeDefined();
  });
});
