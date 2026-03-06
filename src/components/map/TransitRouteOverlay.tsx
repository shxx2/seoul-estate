"use client";

import { Polyline, Marker, useNavermaps } from "react-naver-maps";
import { useTransitRoute } from "@/hooks/useTransitRoute";

interface TransitRouteOverlayProps {
  lat: number;
  lng: number;
}

// SVG 인라인 아이콘
const TRAIN_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="16" height="16" rx="2"/><path d="M12 19v3m-4-3h8M8 12h.01M16 12h.01M7 7h10"/></svg>`;
const BUS_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6v6m8-6v6M4 9h16M5 18v1a1 1 0 001 1h1a1 1 0 001-1v-1m8 0v1a1 1 0 001 1h1a1 1 0 001-1v-1"/><rect x="3" y="4" width="18" height="14" rx="2"/></svg>`;
const MART_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`;
const DAYCARE_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12h.01M15 12h.01M10 16c.5.3 1.5.5 2 .5s1.5-.2 2-.5"/><circle cx="12" cy="12" r="10"/></svg>`;

export default function TransitRouteOverlay({ lat, lng }: TransitRouteOverlayProps) {
  const navermaps = useNavermaps();
  const { subway, busStop, mart, daycare, isLoading } = useTransitRoute(lat, lng);

  if (isLoading || (!subway && !busStop && !mart && !daycare)) return null;

  const formatWalkTime = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    return `도보 ${minutes}분`;
  };

  return (
    <>
      {/* 지하철 경로 */}
      {subway && (
        <>
          <Polyline
            path={subway.route.path.map((p) => new navermaps.LatLng(p.lat, p.lng))}
            strokeColor="#3B82F6"
            strokeWeight={4}
            strokeOpacity={0.8}
            strokeStyle="shortdash"
          />
          <Marker
            position={new navermaps.LatLng(subway.station.lat, subway.station.lng)}
            icon={{
              content: `<div class="flex items-center gap-1 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg">${TRAIN_SVG}<span>${subway.station.name}</span><span class="text-blue-200">${formatWalkTime(subway.route.duration)}</span></div>`,
              anchor: new navermaps.Point(60, 30),
            }}
          />
        </>
      )}

      {/* 버스 경로 */}
      {busStop && (
        <>
          <Polyline
            path={busStop.route.path.map((p) => new navermaps.LatLng(p.lat, p.lng))}
            strokeColor="#22C55E"
            strokeWeight={4}
            strokeOpacity={0.8}
            strokeStyle="shortdash"
          />
          <Marker
            position={new navermaps.LatLng(busStop.station.lat, busStop.station.lng)}
            icon={{
              content: `<div class="flex items-center gap-1 bg-green-600 text-white text-xs px-2 py-1 rounded shadow-lg">${BUS_SVG}<span>${busStop.station.name}</span><span class="text-green-200">${formatWalkTime(busStop.route.duration)}</span></div>`,
              anchor: new navermaps.Point(60, 30),
            }}
          />
        </>
      )}

      {/* 마트 경로 */}
      {mart && (
        <>
          <Polyline
            path={mart.route.path.map((p) => new navermaps.LatLng(p.lat, p.lng))}
            strokeColor="#F59E0B"
            strokeWeight={4}
            strokeOpacity={0.8}
            strokeStyle="shortdash"
          />
          <Marker
            position={new navermaps.LatLng(mart.station.lat, mart.station.lng)}
            icon={{
              content: `<div class="flex items-center gap-1 bg-amber-500 text-white text-xs px-2 py-1 rounded shadow-lg">${MART_SVG}<span>${mart.station.name}</span><span class="text-amber-200">${formatWalkTime(mart.route.duration)}</span></div>`,
              anchor: new navermaps.Point(60, 30),
            }}
          />
        </>
      )}

      {/* 어린이집 경로 */}
      {daycare && (
        <>
          <Polyline
            path={daycare.route.path.map((p) => new navermaps.LatLng(p.lat, p.lng))}
            strokeColor="#EC4899"
            strokeWeight={4}
            strokeOpacity={0.8}
            strokeStyle="shortdash"
          />
          <Marker
            position={new navermaps.LatLng(daycare.station.lat, daycare.station.lng)}
            icon={{
              content: `<div class="flex items-center gap-1 bg-pink-500 text-white text-xs px-2 py-1 rounded shadow-lg">${DAYCARE_SVG}<span>${daycare.station.name}</span><span class="text-pink-200">${formatWalkTime(daycare.route.duration)}</span></div>`,
              anchor: new navermaps.Point(60, 30),
            }}
          />
        </>
      )}
    </>
  );
}
