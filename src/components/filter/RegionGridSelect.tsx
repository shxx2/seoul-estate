"use client";

/**
 * RegionGridSelect - 네이버 부동산 모바일 스타일 지역 선택
 *
 * 2열 레이아웃:
 * - 왼쪽: 서울 25개 구 목록 (고정)
 * - 오른쪽: 선택된 구의 동 목록 (스크롤)
 */

import React, { useCallback, useMemo } from "react";
import { ChevronRight, Check } from "lucide-react";
import { useFilterStore } from "@/store/filterStore";
import seoulDistricts from "../../../public/data/seoul-districts.json";

interface District {
  cortarNo: string;
  name: string;
  dongCount: number;
  dongs: Array<{
    cortarNo: string;
    name: string;
  }>;
}

export interface RegionGridSelectProps {
  onSelect?: () => void;
}

export default function RegionGridSelect({ onSelect }: RegionGridSelectProps) {
  const guCode = useFilterStore((s) => s.guCode);
  const dongCode = useFilterStore((s) => s.dongCode);
  const setFilter = useFilterStore((s) => s.setFilter);
  const submitSearch = useFilterStore((s) => s.submitSearch);

  // 구 목록
  const districts: District[] = useMemo(() => {
    return seoulDistricts.districts.map((d) => ({
      cortarNo: d.cortarNo,
      name: d.name,
      dongCount: d.dongCount,
      dongs: d.dongs.map((dong) => ({
        cortarNo: dong.cortarNo,
        name: dong.name,
      })),
    }));
  }, []);

  // 선택된 구
  const selectedDistrict = useMemo(() => {
    if (!guCode) return districts[0]; // 기본: 첫번째 구
    return districts.find((d) => d.cortarNo === guCode) ?? districts[0];
  }, [guCode, districts]);

  // 구 선택
  const handleGuSelect = useCallback(
    (district: District) => {
      setFilter("guCode", district.cortarNo);
      setFilter("dongCode", null);
    },
    [setFilter]
  );

  // 동 선택 (전체 포함)
  const handleDongSelect = useCallback(
    (dongCortarNo: string | null) => {
      setFilter("dongCode", dongCortarNo);
      submitSearch();
      onSelect?.();
    },
    [setFilter, submitSearch, onSelect]
  );

  return (
    <div className="flex h-[320px] border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* 왼쪽: 구 목록 */}
      <div className="w-[120px] border-r border-gray-200 overflow-y-auto bg-gray-50">
        {districts.map((district) => {
          const isSelected = district.cortarNo === (guCode ?? districts[0].cortarNo);
          return (
            <button
              key={district.cortarNo}
              type="button"
              onClick={() => handleGuSelect(district)}
              className={[
                "w-full px-3 py-2.5 text-left text-sm",
                "flex items-center justify-between",
                "transition-colors duration-100",
                isSelected
                  ? "bg-white text-blue-600 font-medium border-r-2 border-blue-600"
                  : "text-gray-700 hover:bg-gray-100",
              ].join(" ")}
            >
              <span className="truncate">{district.name}</span>
              {isSelected && <ChevronRight size={14} className="text-blue-600 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* 오른쪽: 동 목록 */}
      <div className="flex-1 overflow-y-auto">
        {/* 전체 (구 단위) 옵션 */}
        <button
          type="button"
          onClick={() => handleDongSelect(null)}
          className={[
            "w-full px-4 py-3 text-left text-sm",
            "flex items-center justify-between",
            "border-b border-gray-100",
            "transition-colors duration-100",
            !dongCode
              ? "bg-blue-50 text-blue-600 font-medium"
              : "text-gray-700 hover:bg-gray-50",
          ].join(" ")}
        >
          <span>{selectedDistrict.name} 전체</span>
          {!dongCode && <Check size={16} className="text-blue-600" />}
        </button>

        {/* 동 목록 */}
        {selectedDistrict.dongs.map((dong) => {
          const isSelected = dong.cortarNo === dongCode;
          return (
            <button
              key={dong.cortarNo}
              type="button"
              onClick={() => handleDongSelect(dong.cortarNo)}
              className={[
                "w-full px-4 py-3 text-left text-sm",
                "flex items-center justify-between",
                "border-b border-gray-100",
                "transition-colors duration-100",
                isSelected
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-700 hover:bg-gray-50",
              ].join(" ")}
            >
              <span>{dong.name}</span>
              {isSelected && <Check size={16} className="text-blue-600" />}
            </button>
          );
        })}

        {/* 동 데이터가 부족한 경우 안내 */}
        {selectedDistrict.dongs.length < selectedDistrict.dongCount && (
          <div className="px-4 py-3 text-xs text-gray-400 text-center">
            * 일부 동만 표시됩니다
          </div>
        )}
      </div>
    </div>
  );
}
