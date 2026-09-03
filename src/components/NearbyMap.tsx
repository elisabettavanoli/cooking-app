import { useEffect, useRef, useState } from "react";
import type * as LeafletNS from "leaflet";
import { useI18n } from "../lib/i18n";
import { useCooking } from "../lib/store";
import { useCommunity } from "../lib/community-store";
import { getCoarsePosition } from "../lib/geo";
import type { NearbyKitchen } from "../lib/types";
import s from "./NearbyMap.module.css";

const DEFAULT_CENTER: [number, number] = [46.8, 8.2];
const DEFAULT_ZOOM = 4;
const LOCATED_ZOOM = 13;

/**
 * Leaflet + OpenStreetMap map of `share_on_map` kitchens near the user. Leaflet
 * and its CSS are loaded with a dynamic `import()` inside the effect, so they
 * land in their own chunk and never touch the local-only / test bundle — this
 * component is only mounted when `useCommunity().enabled`.
 */
export function NearbyMap() {
  const { t } = useI18n();
  const { profile } = useCooking();
  const { nearbyKitchens } = useCommunity();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletNS.Map | null>(null);
  const markersRef = useRef<LeafletNS.LayerGroup | null>(null);
  const leafletRef = useRef<typeof LeafletNS | null>(null);

  const [located, setLocated] = useState(false);
  const [kitchens, setKitchens] = useState<NearbyKitchen[]>([]);

  const locate = async () => {
    const pos =
      (await getCoarsePosition()) ??
      (profile.latitude != null && profile.longitude != null
        ? { lat: profile.latitude, lng: profile.longitude }
        : null);
    const map = mapRef.current;
    if (!map || !pos) return;
    setLocated(true);
    map.setView([pos.lat, pos.lng], LOCATED_ZOOM);
    setKitchens(await nearbyKitchens(pos.lat, pos.lng, 5));
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const mod = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      const L = (mod.default ?? mod) as typeof LeafletNS;
      if (cancelled || !containerRef.current || mapRef.current) return;

      leafletRef.current = L;
      const map = L.map(containerRef.current).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      markersRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      requestAnimationFrame(() => map.invalidateSize());
      void locate();
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const group = markersRef.current;
    if (!L || !group) return;
    group.clearLayers();
    for (const k of kitchens) {
      const icon = L.divIcon({
        className: "",
        html: `<span class="${s.pin}"></span>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      L.marker([k.latitude, k.longitude], { icon })
        .addTo(group)
        .bindPopup(`${k.ownerName} · ${t("nearby.itemsCount", { n: k.itemCount })}`);
    }
  }, [kitchens, t]);

  return (
    <div className={s.wrap}>
      <div ref={containerRef} className={s.map} />
      {!located && (
        <div className={s.overlay}>
          <p className={s.hint}>{t("nearby.mapLocateHint")}</p>
          <button type="button" className={s.btn} onClick={() => void locate()}>
            {t("nearby.mapUseLocation")}
          </button>
        </div>
      )}
      {located && kitchens.length === 0 && <p className={s.empty}>{t("nearby.mapNoKitchens")}</p>}
    </div>
  );
}
