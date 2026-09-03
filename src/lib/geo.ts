/**
 * One-shot geolocation, coarsened for privacy. Never rejects — resolves `null`
 * when geolocation is unavailable (jsdom / tests), unsupported, denied, or times
 * out, so callers can branch on a single `null` case.
 */
export interface Coords {
  lat: number;
  lng: number;
}

/** ~2 decimal places ≈ 1.1 km — enough for "kitchens near me", not an address. */
function coarsen(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function getCoarsePosition(): Promise<Coords | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: coarsen(pos.coords.latitude),
          lng: coarsen(pos.coords.longitude),
        }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600_000 },
    );
  });
}
