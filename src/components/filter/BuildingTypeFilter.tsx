"use client";

/**
 * BuildingTypeFilter - 건물 유형 토글 (아파트 / 빌라 / 오피스텔)
 *
 * 복수 선택 가능. 최소 1개 유지 (filterStore의 toggleBuildingType 정책).
 */

import React from "react";
import { useFilterStore } from "@/store/filterStore";
import { BUILDING_TYPE_LABEL } from "@/lib/constants";
import type { BuildingType } from "@/types/article";

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────

const BUILDING_TYPES: BuildingType[] = ["APT", "VILLA", "OFFICETEL"];

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────

export default function BuildingTypeFilter() {
  const buildingTypes = useFilterStore((s) => s.buildingTypes);
  const toggleBuildingType = useFilterStore((s) => s.toggleBuildingType);

  return (
    <div
      role="group"
      aria-label="건물 유형 선택"
      className="flex gap-1.5"
    >
      {BUILDING_TYPES.map((type) => {
        const isActive = buildingTypes.includes(type);
        return (
          <button
            key={type}
            type="button"
            onClick={() => toggleBuildingType(type)}
            aria-pressed={isActive}
            className={[
              "flex-1 py-1.5 text-xs font-semibold rounded-md",
              "transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1",
              isActive
                ? "bg-slate-700 text-white shadow-sm"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700",
            ]
              .join(" ")
              .trim()}
          >
            {BUILDING_TYPE_LABEL[type]}
          </button>
        );
      })}
    </div>
  );
}
