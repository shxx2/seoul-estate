"use client";

/**
 * FilterPanel - 필터 컨테이너
 *
 * 지역 검색, 거래 유형, 건물 유형, 가격 범위, 면적 범위,
 * 초기화 버튼을 수직으로 쌓은 사이드패널 레이아웃입니다.
 */

import React from "react";
import { SlidersHorizontal } from "lucide-react";
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
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────

export default function FilterPanel({ className = "" }: FilterPanelProps) {
  return (
    <aside
      aria-label="매물 필터"
      className={[
        "flex flex-col gap-5 w-64 shrink-0",
        "bg-white border border-gray-100 rounded-xl shadow-sm",
        "px-4 py-5",
        className,
      ]
        .join(" ")
        .trim()}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal
            size={14}
            aria-hidden="true"
            className="text-gray-500"
          />
          <span className="text-sm font-semibold text-gray-800 tracking-tight">
            필터
          </span>
        </div>
        <FilterResetButton />
      </div>

      {/* 구분선 */}
      <div className="h-px bg-gray-100" />

      {/* 지역 검색 */}
      <Section label="지역">
        <RegionSearch />
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
    </aside>
  );
}
