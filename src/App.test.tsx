import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clear } from "idb-keyval";
import { App } from "./App";

beforeEach(async () => {
  await clear();
  localStorage.clear();
});

describe("App smoke", () => {
  it("hydrates and opens on the Kitchen tab with an empty kitchen", async () => {
    render(<App />);
    expect(screen.getByText(/loading your kitchen/i)).toBeDefined();

    await waitFor(() => expect(screen.getByText(/my kitchen/i)).toBeDefined());
    expect(screen.getByText(/0 items tracked/i)).toBeDefined();
    expect(screen.getByText(/your kitchen is empty/i)).toBeDefined();
  });

  it("navigates to the Cook tab", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByText(/my kitchen/i));

    await user.click(screen.getByRole("button", { name: "Cook" }));
    expect(screen.getByText(/what can i cook\?/i)).toBeDefined();
    expect(screen.getByText(/0 items in your kitchen/i)).toBeDefined();
  });

  it("shows the Profile tab with a language picker and no logout in local mode", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByText(/my kitchen/i));

    await user.click(screen.getByRole("button", { name: "Profile" }));
    expect(screen.getByRole("heading", { name: /profile/i })).toBeDefined();
    expect(screen.getByRole("combobox", { name: /language/i })).toBeDefined();
    expect(screen.queryByRole("button", { name: /log out/i })).toBeNull();
  });

  it("Nearby tab shows the sign-in prompt in local mode (no communities, no map)", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByText(/my kitchen/i));

    await user.click(screen.getByRole("button", { name: "Nearby" }));
    expect(screen.getByText(/sign in to discover communities/i)).toBeDefined();
    expect(screen.queryByText(/your communities/i)).toBeNull();
    expect(document.querySelector(".leaflet-container")).toBeNull();
  });
});
