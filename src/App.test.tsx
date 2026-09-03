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
});
