"use client";

/**
 * MobileRegionPicker - 네이버 부동산 스타일 구/동 지역 선택
 *
 * 좌측 고정 컬럼: 서울 25개 구 목록
 * 우측 스크롤 컬럼: 선택된 구의 동 목록 (전체 포함)
 *
 * 구 선택 즉시 동 컬럼 전환, 동 선택 시 onDone 콜백 호출
 */

import React, { useMemo, useRef, useEffect } from "react";
import { useFilterStore } from "@/store/filterStore";
import seoulDistricts from "../../../public/data/seoul-districts.json";

interface District {
  cortarNo: string;
  name: string;
  dongs: Array<{ cortarNo: string; name: string }>;
}

interface MobileRegionPickerProps {
  onDone?: () => void;
}

export default function MobileRegionPicker({ onDone }: MobileRegionPickerProps) {
  const guCode = useFilterStore((s) => s.guCode);
  const dongCode = useFilterStore((s) => s.dongCode);
  const setGuCode = useFilterStore((s) => s.setGuCode);
  const setDongCode = useFilterStore((s) => s.setDongCode);
  const submitSearch = useFilterStore((s) => s.submitSearch);

  const dongListRef = useRef<HTMLDivElement>(null);

  const districts: District[] = useMemo(
    () =>
      seoulDistricts.districts.map((d) => ({
        cortarNo: d.cortarNo,
        name: d.name,
        dongs: d.dongs.map((dong) => ({ cortarNo: dong.cortarNo, name: dong.name })),
      })),
    []
  );

  const selectedDistrict = useMemo(
    () => districts.find((d) => d.cortarNo === guCode) ?? null,
    [guCode, districts]
  );

  // 구 변경 시 동 컬럼 맨 위로 스크롤
  useEffect(() => {
    if (dongListRef.current) {
      dongListRef.current.scrollTop = 0;
    }
  }, [guCode]);

  const handleGuSelect = (cortarNo: string) => {
    setGuCode(cortarNo);
  };

  const handleDongSelect = (cortarNo: string | null) => {
    setDongCode(cortarNo);
    submitSearch();
    onDone?.();
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ height: "100%" }}>
      {/* 좌측: 구 목록 */}
      <div
        className="w-[108px] shrink-0 overflow-y-auto border-r border-gray-100 bg-gray-50"
        style={{ WebkitOverflowScrolling: "touch" }}
        role="listbox"
        aria-label="구 선택"
      >
        {districts.map((district) => {
          const isSelected = district.cortarNo === guCode;
          return (
            <button
              key={district.cortarNo}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => handleGuSelect(district.cortarNo)}
              className={[
                "w-full text-left px-3 py-3 text-[13px] font-medium transition-colors duration-100",
                "border-b border-gray-100 last:border-b-0",
                "focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-[#03C75A]",
                isSelected
                  ? "bg-white text-[#03C75A] font-semibold border-l-2 border-l-[#03C75A]"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100",
              ]
                .join(" ")
                .trim()}
            >
              {district.name}
            </button>
          );
        })}
      </div>

      {/* 우측: 동 목록 */}
      <div
        ref={dongListRef}
        className="flex-1 overflow-y-auto bg-white"
        style={{ WebkitOverflowScrolling: "touch" }}
        role="listbox"
        aria-label="동 선택"
      >
        {!selectedDistrict ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-300">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
            <span className="text-[12px]">구를 먼저 선택해주세요</span>
          </div>
        ) : (
          <div className="py-1">
            {/* 전체 옵션 */}
            <button
              type="button"
              role="option"
              aria-selected={!dongCode}
              onClick={() => handleDongSelect(null)}
              className={[
                "w-full text-left px-4 py-3 text-[13px] transition-colors duration-100",
                "border-b border-gray-50",
                "focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-[#03C75A]",
                !dongCode
                  ? "text-[#03C75A] font-semibold bg-green-50"
                  : "text-gray-700 hover:bg-gray-50",
              ]
                .join(" ")
                .trim()}
            >
              <span className="flex items-center justify-between">
                <span>전체 ({selectedDistrict.name})</span>
                {!dongCode && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#03C75A"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
            </button>

            {/* 동 목록 */}
            {selectedDistrict.dongs.map((dong) => {
              const isSelected = dong.cortarNo === dongCode;
              return (
                <button
                  key={dong.cortarNo}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleDongSelect(dong.cortarNo)}
                  className={[
                    "w-full text-left px-4 py-3 text-[13px] transition-colors duration-100",
                    "border-b border-gray-50 last:border-b-0",
                    "focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-[#03C75A]",
                    isSelected
                      ? "text-[#03C75A] font-semibold bg-green-50"
                      : "text-gray-700 hover:bg-gray-50",
                  ]
                    .join(" ")
                    .trim()}
                >
                  <span className="flex items-center justify-between">
                    <span>{dong.name}</span>
                    {isSelected && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#03C75A"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
