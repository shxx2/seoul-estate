"use client";

/**
 * FilterPanel - 필터 컨테이너
 *
 * 지역 검색, 거래 유형, 건물 유형, 가격 범위, 면적 범위,
 * 초기화 버튼을 수직으로 쌓은 사이드패널 레이아웃입니다.
 */

import React, { useState, useEffect } from "react";
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import RegionSearch from "@/components/search/RegionSearch";
import TradeTypeFilter from "./TradeTypeFilter";
import BuildingTypeFilter from "./BuildingTypeFilter";
import PriceRangeFilter from "./PriceRangeFilter";
import AreaFilter from "./AreaFilter";
import FilterResetButton from "./FilterResetButton";

// ─────────────────────────────────────────────
// 서브 컴포넌트: 구분선이 있는 섹션
// ─────────────────────────────────────────────

interface SectionProps {
  label: string;
  children: React.ReactNode;
}

function Section({ label, children }: SectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </span>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// Props 타입
// ─────────────────────────────────────────────

export interface FilterPanelProps {
  /** 추가 CSS 클래스 */
  className?: string;
  /** 외부에서 접힘 상태를 제어할 때 사용 */
  collapsed?: boolean;
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────

export default function FilterPanel({ className = "", collapsed }: FilterPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 외부 collapsed prop이 바뀌면 내부 상태 동기화
  useEffect(() => {
    if (collapsed !== undefined) {
      setIsCollapsed(collapsed);
    }
  }, [collapsed]);

  return (
    <aside
      aria-label="매물 필터"
      className={[
        // w-full: 사이드바 컨테이너 너비에 맞게 채움 (기존 w-64 shrink-0 제거)
        "flex flex-col w-full",
        "bg-white border border-gray-100 rounded-xl shadow-sm",
        "px-4 py-4",
        className,
      ]
        .join(" ")
        .trim()}
    >
      {/* 헤더: 접기 토글과 초기화 버튼을 분리해 클릭 이벤트 충돌 방지 */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1 rounded"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-expanded={!isCollapsed}
          aria-controls="filter-panel-body"
        >
          <SlidersHorizontal
            size={14}
            aria-hidden="true"
            className="text-gray-500"
          />
          <span className="text-sm font-semibold text-gray-800 tracking-tight">
            필터
          </span>
          {isCollapsed ? (
            <ChevronDown size={14} className="text-gray-400 ml-0.5" aria-hidden="true" />
          ) : (
            <ChevronUp size={14} className="text-gray-400 ml-0.5" aria-hidden="true" />
          )}
        </button>

        {/* 초기화 버튼은 헤더 토글 밖에 위치해 이벤트 전파 없음 */}
        <FilterResetButton />
      </div>

      {!isCollapsed && (
        <div id="filter-panel-body" className="flex flex-col gap-3 mt-4">
          {/* 구분선 */}
          <div className="h-px bg-gray-100" />

          {/* 지역 검색 — placeholder 줄임: 좁은 사이드바에서 잘리지 않도록 */}
          <Section label="지역">
            <RegionSearch placeholder="구, 동 검색" />
          </Section>

          {/* 구분선 */}
          <div className="h-px bg-gray-100" />

          {/* 거래 유형 */}
          <Section label="거래 유형">
            <TradeTypeFilter />
          </Section>

          {/* 구분선 */}
          <div className="h-px bg-gray-100" />

          {/* 건물 유형 */}
          <Section label="건물 유형">
            <BuildingTypeFilter />
          </Section>

          {/* 구분선 */}
          <div className="h-px bg-gray-100" />

          {/* 가격 범위 */}
          <Section label="가격">
            <PriceRangeFilter />
          </Section>

          {/* 구분선 */}
          <div className="h-px bg-gray-100" />

          {/* 면적 범위 */}
          <Section label="면적">
            <AreaFilter />
          </Section>
        </div>
      )}
    </aside>
  );
}
