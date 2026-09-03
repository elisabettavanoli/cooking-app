import { afterEach, describe, expect, it, vi } from "vitest";
import { getCoarsePosition } from "./geo";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getCoarsePosition", () => {
  it("resolves null when geolocation is unavailable (jsdom default)", async () => {
    expect(navigator.geolocation).toBeUndefined();
    await expect(getCoarsePosition()).resolves.toBeNull();
  });

  it("resolves null (never rejects) when the user denies permission", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (_ok: PositionCallback, err: PositionErrorCallback) =>
          err({ code: 1, message: "denied" } as GeolocationPositionError),
      },
    });
    await expect(getCoarsePosition()).resolves.toBeNull();
  });

  it("coarsens coordinates to 2 decimal places", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (ok: PositionCallback) =>
          ok({ coords: { latitude: 45.464211, longitude: 9.191383 } } as GeolocationPosition),
      },
    });
    await expect(getCoarsePosition()).resolves.toEqual({ lat: 45.46, lng: 9.19 });
  });
});
