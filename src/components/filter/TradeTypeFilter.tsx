"use client";

/**
 * TradeTypeFilter - 거래 유형 토글 (매매 / 전세 / 월세)
 *
 * 복수 선택 가능. 최소 1개 유지 (filterStore의 toggleTradeType 정책).
 * 선택된 primaryTradeType에 따라 PriceRangeFilter 표시 기준이 달라집니다.
 */

import React from "react";
import { useFilterStore } from "@/store/filterStore";
import { TRADE_TYPE_LABEL } from "@/lib/constants";
import type { TradeType } from "@/types/article";

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────

const TRADE_TYPES: TradeType[] = ["SALE", "JEONSE", "MONTHLY"];

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────

export default function TradeTypeFilter() {
  const tradeTypes = useFilterStore((s) => s.tradeTypes);
  const toggleTradeType = useFilterStore((s) => s.toggleTradeType);

  return (
    <div
      role="group"
      aria-label="거래 유형 선택"
      className="flex gap-1.5"
    >
      {TRADE_TYPES.map((type) => {
        const isActive = tradeTypes.includes(type);
        return (
          <button
            key={type}
            type="button"
            onClick={() => toggleTradeType(type)}
            aria-pressed={isActive}
            className={[
              "flex-1 py-1.5 text-xs font-semibold rounded-md",
              "transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1",
              isActive
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700",
            ]
              .join(" ")
              .trim()}
          >
            {TRADE_TYPE_LABEL[type]}
          </button>
        );
      })}
    </div>
  );
}
