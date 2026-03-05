"use client";

/**
 * KakaoMap - 카카오맵 래퍼 컴포넌트
 *
 * react-kakao-maps-sdk의 Map 컴포넌트를 래핑합니다.
 * 서울 중심 좌표(37.5665, 126.9780)와 줌 레벨 8로 초기화됩니다.
 *
 * 사용법:
 *   <KakaoMap>
 *     <DistrictMarker ... />
 *     <ArticleMarker ... />
 *   </KakaoMap>
 */

import React from "react";
import { Map } from "react-kakao-maps-sdk";

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────

/** 서울 시청 중심 좌표 */
const SEOUL_CENTER = { lat: 37.5665, lng: 126.978 } as const;

/** 서울 전체가 보이는 초기 줌 레벨 */
const INITIAL_LEVEL = 8;

// ─────────────────────────────────────────────
// Props 타입
// ─────────────────────────────────────────────

export interface KakaoMapProps {
  /** 지도 중심 좌표 (기본값: 서울 시청) */
  center?: { lat: number; lng: number };
  /** 줌 레벨 (기본값: 8) */
  level?: number;
  /** 최소 줌 레벨 */
  minLevel?: number;
  /** 최대 줌 레벨 */
  maxLevel?: number;
  /** 지도 위에 렌더링할 자식 컴포넌트 (마커, 오버레이 등) */
  children?: React.ReactNode;
  /** 지도 인스턴스가 생성된 후 콜백 */
  onLoad?: (map: kakao.maps.Map) => void;
  /** 지도 중심이 변경될 때 콜백 */
  onCenterChanged?: (map: kakao.maps.Map) => void;
  /** 줌 레벨이 변경될 때 콜백 */
  onZoomChanged?: (map: kakao.maps.Map) => void;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 인라인 스타일 */
  style?: React.CSSProperties;
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────

export default function KakaoMap({
  center = SEOUL_CENTER,
  level = INITIAL_LEVEL,
  minLevel,
  maxLevel,
  children,
  onLoad,
  onCenterChanged,
  onZoomChanged,
  className,
  style,
}: KakaoMapProps) {
  return (
    <Map
      center={center}
      level={level}
      minLevel={minLevel}
      maxLevel={maxLevel}
      onCreate={onLoad}
      onCenterChanged={onCenterChanged}
      onZoomChanged={onZoomChanged}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        ...style,
      }}
    >
      {children}
    </Map>
  );
}
