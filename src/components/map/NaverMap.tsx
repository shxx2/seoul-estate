"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { Container as MapDiv, NaverMap as NMap, useNavermaps } from "react-naver-maps";
import { useNaverMapClientId } from "./NaverMapProvider";

interface NaverMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  children?: React.ReactNode;
  onLoad?: (map: naver.maps.Map) => void;
  onCenterChanged?: (center: { lat: number; lng: number }) => void;
  onZoomChanged?: (zoom: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }; // 서울
const DEFAULT_ZOOM = 11; // 카카오 level 8 ≈ 네이버 zoom 11

function NaverMapInner({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  children,
  onLoad,
  onCenterChanged,
  onZoomChanged,
  className,
  style,
}: NaverMapProps) {
  const navermaps = useNavermaps();
  const mapRef = useRef<naver.maps.Map | null>(null);
  const prevCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  const prevZoomRef = useRef<number | null>(null);

  const handleRef = useCallback((map: naver.maps.Map | null) => {
    if (map && map !== mapRef.current) {
      mapRef.current = map;
      onLoad?.(map);
    }
  }, [onLoad]);

  // center/zoom 변경 시 지도 이동 (부드럽게 이동)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const centerChanged =
      prevCenterRef.current?.lat !== center.lat ||
      prevCenterRef.current?.lng !== center.lng;
    const zoomChanged = prevZoomRef.current !== zoom;

    if (centerChanged || zoomChanged) {
      const newCenter = new navermaps.LatLng(center.lat, center.lng);

      // panTo로 부드럽게 이동 (줌 변경이 있으면 morph 사용)
      if (zoomChanged) {
        map.morph(newCenter, zoom, { duration: 300, easing: "easeOutCubic" });
      } else if (centerChanged) {
        map.panTo(newCenter, { duration: 300, easing: "easeOutCubic" });
      }

      prevCenterRef.current = { lat: center.lat, lng: center.lng };
      prevZoomRef.current = zoom;
    }
  }, [center, zoom, navermaps]);

  return (
    <MapDiv className={className} style={{ width: "100%", height: "100%", ...style }}>
      <NMap
        ref={handleRef}
        defaultCenter={new navermaps.LatLng(center.lat, center.lng)}
        defaultZoom={zoom}
        onCenterChanged={(coord: naver.maps.Coord) => {
          onCenterChanged?.({ lat: coord.y, lng: coord.x });
        }}
        onZoomChanged={(z: number) => onZoomChanged?.(z)}
      >
        {children}
      </NMap>
    </MapDiv>
  );
}

export default function NaverMap(props: NaverMapProps) {
  const [isClient, setIsClient] = useState(false);
  const clientId = useNaverMapClientId();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // SSR 또는 clientId 없음 시 placeholder 렌더링
  if (!isClient || !clientId) {
    return (
      <div
        className={props.className}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#666",
          ...props.style
        }}
      >
        {isClient && !clientId && "지도 API 키가 설정되지 않았습니다"}
      </div>
    );
  }

  return <NaverMapInner {...props} />;
}
