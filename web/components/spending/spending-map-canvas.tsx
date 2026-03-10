"use client";

import { useEffect, useMemo } from "react";
import {
  CircleMarker,
  MapContainer,
  Pane,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import type { SpendHotspot } from "@/lib/api/types/reports";

const DEFAULT_CENTER: [number, number] = [39.8283, -98.5795];
const DEFAULT_ZOOM = 4;

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function FitHotspots({ hotspots }: { hotspots: SpendHotspot[] }) {
  const map = useMap();

  const bounds = useMemo<LatLngBoundsExpression | null>(() => {
    if (hotspots.length === 0) return null;
    return hotspots.map((spot) => [spot.lat, spot.lon] as [number, number]);
  }, [hotspots]);

  useEffect(() => {
    if (!bounds) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }

    map.fitBounds(bounds, {
      padding: [48, 48],
      maxZoom: 13,
    });
  }, [bounds, map]);

  return null;
}

export function SpendingMapCanvas({ hotspots }: { hotspots: SpendHotspot[] }) {
  const maxSpend = useMemo(
    () => Math.max(...(hotspots.map((hotspot) => hotspot.total_spend) ?? [1])),
    [hotspots]
  );

  return (
    <div className="h-full min-h-[340px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        className="h-full min-h-[340px] w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <Pane name="hotspots" style={{ zIndex: 450 }} />
        <FitHotspots hotspots={hotspots} />
        {hotspots.map((spot) => {
          const radius = 6 + (spot.total_spend / maxSpend) * 20;
          return (
            <CircleMarker
              key={spot.key}
              center={[spot.lat, spot.lon]}
              radius={radius}
              pathOptions={{
                pane: "hotspots",
                color: "#dc2626",
                weight: 1.5,
                fillColor: "#ef4444",
                fillOpacity: 0.3,
              }}
            >
              <Popup>
                <div className="min-w-48 space-y-1 text-sm">
                  <p className="font-semibold text-slate-900">{spot.label}</p>
                  <p className="text-slate-600">{formatCurrency(spot.total_spend)}</p>
                  <p className="text-slate-600">
                    {spot.transactions_count} transaction{spot.transactions_count === 1 ? "" : "s"}
                  </p>
                  <p className="text-slate-500">
                    {spot.merchants.slice(0, 3).join(", ") || "Unknown merchant"}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
