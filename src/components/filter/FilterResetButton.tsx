"use client";

/**
 * FilterResetButton - 필터 초기화 버튼
 *
 * 클릭 시 Zustand filterStore의 resetFilters()를 호출하여
 * 모든 필터를 DEFAULT_FILTER로 되돌립니다.
 */

import React from "react";
import { RotateCcw } from "lucide-react";
import { useFilterStore } from "@/store/filterStore";

// ─────────────────────────────────────────────
// Props 타입
// ─────────────────────────────────────────────

export interface FilterResetButtonProps {
  /** 추가 CSS 클래스 */
  className?: string;
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────

export default function FilterResetButton({
  className = "",
}: FilterResetButtonProps) {
  const resetFilters = useFilterStore((s) => s.resetFilters);

  return (
    <button
      type="button"
      onClick={resetFilters}
      className={[
        "flex items-center gap-1.5 px-3 py-1.5",
        "text-xs font-medium text-gray-500",
        "border border-gray-200 rounded-md bg-white",
        "hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300",
        "active:scale-95",
        "transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1",
        className,
      ]
        .join(" ")
        .trim()}
      aria-label="모든 필터 초기화"
    >
      <RotateCcw
        size={12}
        aria-hidden="true"
        className="text-gray-400"
      />
      초기화
    </button>
  );
}
