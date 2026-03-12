"use client";

/**
 * MobileFilterSheet - 네이버 부동산 스타일 모바일 필터 시트
 *
 * 3단계 탭 필터: 지역 | 거래유형 | 건물유형
 * 지역 탭: 두 컬럼 구/동 선택 (MobileRegionPicker)
 * 거래유형/건물유형 탭: 버튼 그리드 선택
 *
 * 사용처: MobileBottomSheet의 showFilter 상태일 때 렌더링
 */

import React, { useState } from "react";
import { useFilterStore } from "@/store/filterStore";
import { TRADE_TYPE_LABEL, BUILDING_TYPE_LABEL } from "@/lib/constants";
import type { TradeType, BuildingType } from "@/types/article";
import MobileRegionPicker from "./MobileRegionPicker";
import PriceRangeFilter from "./PriceRangeFilter";
import AreaFilter from "./AreaFilter";
import seoulDistricts from "../../../public/data/seoul-districts.json";
import { useMemo } from "react";

// ─────────────────────────────────────────────
// 탭 정의
// ─────────────────────────────────────────────

type FilterTab = "region" | "trade" | "building" | "price" | "area";

const TABS: { id: FilterTab; label: string }[] = [
  { id: "region", label: "지역" },
  { id: "trade", label: "거래유형" },
  { id: "building", label: "건물유형" },
  { id: "price", label: "금액" },
  { id: "area", label: "평수" },
];

const TRADE_TYPES: TradeType[] = ["SALE", "JEONSE", "MONTHLY"];
const BUILDING_TYPES: BuildingType[] = ["APT", "VILLA", "OFFICETEL"];

// ─────────────────────────────────────────────
// 현재 선택 요약 레이블
// ─────────────────────────────────────────────

function useRegionLabel(): string {
  const guCode = useFilterStore((s) => s.guCode);
  const dongCode = useFilterStore((s) => s.dongCode);

  return useMemo(() => {
    if (!guCode) return "지역 선택";
    const district = seoulDistricts.districts.find((d) => d.cortarNo === guCode);
    if (!district) return "지역 선택";
    if (!dongCode) return district.name;
    const dong = district.dongs.find((d) => d.cortarNo === dongCode);
    return dong ? `${district.name} ${dong.name}` : district.name;
  }, [guCode, dongCode]);
}

// ─────────────────────────────────────────────
// 서브 컴포넌트: 거래유형 탭 내용
// ─────────────────────────────────────────────

function TradeTypePanel() {
  const tradeTypes = useFilterStore((s) => s.tradeTypes);
  const toggleTradeType = useFilterStore((s) => s.toggleTradeType);
  const submitSearch = useFilterStore((s) => s.submitSearch);

  const handleToggle = (type: TradeType) => {
    toggleTradeType(type);
    submitSearch();
  };

  return (
    <div className="p-4">
      <p className="text-[11px] text-gray-400 mb-3 tracking-wide uppercase font-medium">
        복수 선택 가능
      </p>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="거래 유형 선택">
        {TRADE_TYPES.map((type) => {
          const isActive = tradeTypes.includes(type);
          return (
            <button
              key={type}
              type="button"
              aria-pressed={isActive}
              onClick={() => handleToggle(type)}
              className={[
                "py-3 rounded-xl text-[13px] font-semibold transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#03C75A] focus-visible:ring-offset-1",
                "active:scale-95",
                isActive
                  ? "bg-[#03C75A] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              ]
                .join(" ")
                .trim()}
            >
              {TRADE_TYPE_LABEL[type]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 서브 컴포넌트: 건물유형 탭 내용
// ─────────────────────────────────────────────

function BuildingTypePanel() {
  const buildingTypes = useFilterStore((s) => s.buildingTypes);
  const toggleBuildingType = useFilterStore((s) => s.toggleBuildingType);
  const submitSearch = useFilterStore((s) => s.submitSearch);

  const handleToggle = (type: BuildingType) => {
    toggleBuildingType(type);
    submitSearch();
  };

  return (
    <div className="p-4">
      <p className="text-[11px] text-gray-400 mb-3 tracking-wide uppercase font-medium">
        복수 선택 가능
      </p>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="건물 유형 선택">
        {BUILDING_TYPES.map((type) => {
          const isActive = buildingTypes.includes(type);
          return (
            <button
              key={type}
              type="button"
              aria-pressed={isActive}
              onClick={() => handleToggle(type)}
              className={[
                "py-3 rounded-xl text-[13px] font-semibold transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#03C75A] focus-visible:ring-offset-1",
                "active:scale-95",
                isActive
                  ? "bg-gray-800 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              ]
                .join(" ")
                .trim()}
            >
              {BUILDING_TYPE_LABEL[type]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────

interface MobileFilterSheetProps {
  onClose?: () => void;
}

export default function MobileFilterSheet({ onClose }: MobileFilterSheetProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("region");

  const guCode = useFilterStore((s) => s.guCode);
  const tradeTypes = useFilterStore((s) => s.tradeTypes);
  const buildingTypes = useFilterStore((s) => s.buildingTypes);
  const resetFilters = useFilterStore((s) => s.resetFilters);
  const submitSearch = useFilterStore((s) => s.submitSearch);

  const regionLabel = useRegionLabel();

  const handleReset = () => {
    resetFilters();
    submitSearch();
  };

  // 탭별 뱃지 (선택 항목 수)
  const tradeBadge = tradeTypes.length < 3 ? tradeTypes.length : null;
  const buildingBadge = buildingTypes.length < 3 ? buildingTypes.length : null;

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <span className="text-[14px] font-bold text-gray-900 tracking-tight">필터</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            초기화
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="필터 닫기"
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div
        className="flex border-b border-gray-100 shrink-0"
        role="tablist"
        aria-label="필터 탭"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          // 탭별 부제 (현재 선택 요약)
          let subtitle: string | null = null;
          let badge: number | null = null;
          if (tab.id === "region") subtitle = guCode ? regionLabel : null;
          if (tab.id === "trade") badge = tradeBadge;
          if (tab.id === "building") badge = buildingBadge;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`filter-panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={[
                "flex-1 flex flex-col items-center pt-2.5 pb-2 px-1 transition-colors duration-150 relative",
                "focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-[#03C75A]",
                isActive ? "text-[#03C75A]" : "text-gray-500",
              ]
                .join(" ")
                .trim()}
            >
              <span className="flex items-center gap-1">
                <span className={["text-[13px] font-semibold", isActive ? "text-[#03C75A]" : "text-gray-700"].join(" ")}>
                  {tab.label}
                </span>
                {badge !== null && (
                  <span
                    className={[
                      "inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold",
                      isActive ? "bg-[#03C75A] text-white" : "bg-gray-200 text-gray-600",
                    ].join(" ")}
                  >
                    {badge}
                  </span>
                )}
              </span>
              {subtitle && (
                <span className="text-[10px] text-[#03C75A] mt-0.5 leading-tight truncate max-w-full px-1">
                  {subtitle}
                </span>
              )}
              {/* 활성 탭 하단 인디케이터 */}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#03C75A] rounded-t-full"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "region" && (
          <div
            id="filter-panel-region"
            role="tabpanel"
            aria-label="지역 선택"
            className="h-full"
          >
            <MobileRegionPicker onDone={onClose} />
          </div>
        )}

        {activeTab === "trade" && (
          <div
            id="filter-panel-trade"
            role="tabpanel"
            aria-label="거래유형 선택"
            className="h-full overflow-y-auto"
          >
            <TradeTypePanel />
          </div>
        )}

        {activeTab === "building" && (
          <div
            id="filter-panel-building"
            role="tabpanel"
            aria-label="건물유형 선택"
            className="h-full overflow-y-auto"
          >
            <BuildingTypePanel />
          </div>
        )}

        {activeTab === "price" && (
          <div
            id="filter-panel-price"
            role="tabpanel"
            aria-label="금액 범위 선택"
            className="h-full overflow-y-auto p-4"
          >
            <p className="text-[11px] text-gray-400 mb-4 tracking-wide uppercase font-medium">
              거래유형에 따라 표시가 달라집니다
            </p>
            <PriceRangeFilter />
          </div>
        )}

        {activeTab === "area" && (
          <div
            id="filter-panel-area"
            role="tabpanel"
            aria-label="평수 범위 선택"
            className="h-full overflow-y-auto p-4"
          >
            <p className="text-[11px] text-gray-400 mb-4 tracking-wide uppercase font-medium">
              전용면적 기준
            </p>
            <AreaFilter />
          </div>
        )}
      </div>
    </div>
  );
}
