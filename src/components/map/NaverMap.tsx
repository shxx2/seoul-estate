"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { Container as MapDiv, NaverMap as NMap, useNavermaps } from "react-naver-maps";
import { useNaverMapReady } from "./NaverMapProvider";

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

  const handleRef = useCallback((map: naver.maps.Map | null) => {
    if (map && map !== mapRef.current) {
      mapRef.current = map;
      onLoad?.(map);
    }
  }, [onLoad]);

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
  const isMapReady = useNaverMapReady();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // SSR 또는 맵 미준비 시 placeholder 렌더링
  if (!isClient || !isMapReady) {
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
        {isClient && !isMapReady && "지도를 불러오는 중..."}
      </div>
    );
  }

  return <NaverMapInner {...props} />;
}
