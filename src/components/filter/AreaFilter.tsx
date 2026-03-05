"use client";

/**
 * AreaFilter - 전용면적 범위 필터 컴포넌트
 *
 * AREA_RANGE 상수 기준 듀얼 범위 슬라이더.
 * m2 단위로 저장, 평(pyeong) 단위로 표시.
 */

import React, { useCallback } from "react";
import { useFilterStore } from "@/store/filterStore";
import { AREA_RANGE } from "@/lib/constants";

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────

/** m2 -> 평 변환 후 표시 문자열 */
function formatArea(m2: number): string {
  if (m2 === 0) return "0평";
  const pyeong = m2 / 3.305785;
  return `${pyeong.toFixed(0)}평`;
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────

export default function AreaFilter() {
  const areaRange = useFilterStore((s) => s.areaRange);
  const setFilter = useFilterStore((s) => s.setFilter);

  const { min, max, step } = AREA_RANGE;
  const current: [number, number] = areaRange ?? [min, max];
  const isDefault = areaRange === null;

  const minPct = ((current[0] - min) / (max - min)) * 100;
  const maxPct = ((current[1] - min) / (max - min)) * 100;

  const handleMin = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = Math.min(Number(e.target.value), current[1] - step);
      setFilter("areaRange", [next, current[1]]);
    },
    [current, step, setFilter]
  );

  const handleMax = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = Math.max(Number(e.target.value), current[0] + step);
      setFilter("areaRange", [current[0], next]);
    },
    [current, step, setFilter]
  );

  const handleReset = useCallback(
    () => setFilter("areaRange", null),
    [setFilter]
  );

  return (
    <div
      className="flex flex-col gap-2"
      role="group"
      aria-label="전용면적 범위 필터"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700 tracking-tight">
          전용면적
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">
            {isDefault
              ? "전체"
              : `${formatArea(current[0])} ~ ${
                  current[1] === max ? "무제한" : formatArea(current[1])
                }`}
          </span>
          {!isDefault && (
            <button
              type="button"
              onClick={handleReset}
              className="text-[10px] text-blue-500 hover:text-blue-700 transition-colors underline underline-offset-2"
              aria-label="전용면적 초기화"
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
          aria-label="전용면적 최솟값"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={current[0]}
          aria-valuetext={formatArea(current[0])}
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
          aria-label="전용면적 최댓값"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={current[1]}
          aria-valuetext={
            current[1] === max ? "무제한" : formatArea(current[1])
          }
        />
      </div>

      {/* 경계 레이블 */}
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>{formatArea(min)}</span>
        <span>{formatArea(max)}+</span>
      </div>
    </div>
  );
}
