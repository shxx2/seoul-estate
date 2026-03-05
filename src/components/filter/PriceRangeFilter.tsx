"use client";

/**
 * PriceRangeFilter - 가격 범위 필터 컴포넌트
 *
 * primaryTradeType에 따라 동적으로 레이블과 슬라이더 범위가 변경됩니다.
 *   - SALE    → 매매가 (DEAL_PRICE_RANGE)
 *   - JEONSE  → 보증금 (DEPOSIT_RANGE)
 *   - MONTHLY → 보증금 + 월세 (DEPOSIT_RANGE + MONTHLY_RENT_RANGE)
 */

import React, { useCallback } from "react";
import { useFilterStore } from "@/store/filterStore";
import {
  DEAL_PRICE_RANGE,
  DEPOSIT_RANGE,
  MONTHLY_RENT_RANGE,
} from "@/lib/constants";
import type { TradeType } from "@/types/article";
import type { FilterState } from "@/types/filter";

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────

/** 만원 단위 숫자를 간결한 한국식 표기로 변환 */
function formatPrice(value: number): string {
  if (value === 0) return "0";
  if (value >= 10000) {
    const eok = Math.floor(value / 10000);
    const remainder = value % 10000;
    if (remainder === 0) return `${eok}억`;
    return `${eok}억 ${Math.round(remainder / 1000)}천`;
  }
  if (value >= 1000) {
    return `${Math.round(value / 1000)}천만`;
  }
  return `${value}만`;
}

/** 만원 단위 월세 표기 */
function formatMonthly(value: number): string {
  if (value === 0) return "0";
  return `${value}만`;
}

// ─────────────────────────────────────────────
// 서브 컴포넌트: 단일 범위 슬라이더
// ─────────────────────────────────────────────

interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: [number, number] | null;
  onChange: (range: [number, number] | null) => void;
  formatFn?: (v: number) => string;
}

function RangeSlider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  formatFn = formatPrice,
}: RangeSliderProps) {
  const current: [number, number] = value ?? [min, max];
  const isDefault = value === null;

  const minPct = ((current[0] - min) / (max - min)) * 100;
  const maxPct = ((current[1] - min) / (max - min)) * 100;

  const handleMin = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = Math.min(Number(e.target.value), current[1] - step);
      onChange([next, current[1]]);
    },
    [current, step, onChange]
  );

  const handleMax = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = Math.max(Number(e.target.value), current[0] + step);
      onChange([current[0], next]);
    },
    [current, step, onChange]
  );

  const handleReset = useCallback(() => onChange(null), [onChange]);

  return (
    <div className="flex flex-col gap-2">
      {/* 레이블 + 현재 범위 표시 */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700 tracking-tight">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">
            {isDefault
              ? "전체"
              : `${formatFn(current[0])} ~ ${
                  current[1] === max ? "무제한" : formatFn(current[1])
                }`}
          </span>
          {!isDefault && (
            <button
              type="button"
              onClick={handleReset}
              className="text-[10px] text-blue-500 hover:text-blue-700 transition-colors underline underline-offset-2"
              aria-label={`${label} 초기화`}
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 듀얼 범위 슬라이더 */}
      <div className="relative h-5 flex items-center">
        {/* 트랙 배경 */}
        <div className="absolute inset-x-0 h-1 bg-gray-200 rounded-full" />
        {/* 활성 구간 */}
        <div
          className="absolute h-1 bg-blue-500 rounded-full"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />
        {/* Min 슬라이더 */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={current[0]}
          onChange={handleMin}
          className="absolute inset-x-0 w-full h-1 appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-blue-500
            [&::-webkit-slider-thumb]:shadow-sm
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-blue-500
            [&::-moz-range-thumb]:cursor-pointer"
          aria-label={`${label} 최솟값`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={current[0]}
          aria-valuetext={formatFn(current[0])}
        />
        {/* Max 슬라이더 */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={current[1]}
          onChange={handleMax}
          className="absolute inset-x-0 w-full h-1 appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-blue-500
            [&::-webkit-slider-thumb]:shadow-sm
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-blue-500
            [&::-moz-range-thumb]:cursor-pointer"
          aria-label={`${label} 최댓값`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={current[1]}
          aria-valuetext={
            current[1] === max ? "무제한" : formatFn(current[1])
          }
        />
      </div>

      {/* 경계 레이블 */}
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>{formatFn(min)}</span>
        <span>{formatFn(max)}+</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 거래 유형별 설정
// ─────────────────────────────────────────────

type PriceField = "dealPriceRange" | "depositRange" | "monthlyRentRange";

interface SectionConfig {
  label: string;
  field: PriceField;
  range: { min: number; max: number; step: number };
  formatFn?: (v: number) => string;
}

interface TradeConfig {
  sections: SectionConfig[];
}

const TRADE_CONFIG: Record<TradeType, TradeConfig> = {
  SALE: {
    sections: [
      {
        label: "매매가",
        field: "dealPriceRange",
        range: DEAL_PRICE_RANGE,
      },
    ],
  },
  JEONSE: {
    sections: [
      {
        label: "보증금",
        field: "depositRange",
        range: DEPOSIT_RANGE,
      },
    ],
  },
  MONTHLY: {
    sections: [
      {
        label: "보증금",
        field: "depositRange",
        range: DEPOSIT_RANGE,
      },
      {
        label: "월세",
        field: "monthlyRentRange",
        range: MONTHLY_RENT_RANGE,
        formatFn: formatMonthly,
      },
    ],
  },
};

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────

export default function PriceRangeFilter() {
  const primaryTradeType = useFilterStore((s) => s.primaryTradeType);
  const dealPriceRange = useFilterStore((s) => s.dealPriceRange);
  const depositRange = useFilterStore((s) => s.depositRange);
  const monthlyRentRange = useFilterStore((s) => s.monthlyRentRange);
  const setFilter = useFilterStore((s) => s.setFilter);

  const rangeValues: Pick<FilterState, PriceField> = {
    dealPriceRange,
    depositRange,
    monthlyRentRange,
  };

  const config = TRADE_CONFIG[primaryTradeType];

  return (
    <div
      className="flex flex-col gap-4"
      role="group"
      aria-label="가격 범위 필터"
    >
      {config.sections.map((section) => (
        <RangeSlider
          key={section.field}
          label={section.label}
          min={section.range.min}
          max={section.range.max}
          step={section.range.step}
          value={rangeValues[section.field]}
          onChange={(range) => setFilter(section.field, range)}
          formatFn={section.formatFn}
        />
      ))}
    </div>
  );
}
