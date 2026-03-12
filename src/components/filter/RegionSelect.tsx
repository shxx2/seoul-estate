"use client";

/**
 * RegionSelect - 구/동 드롭다운 선택 컴포넌트
 *
 * 구를 먼저 선택하고, 선택적으로 동을 선택할 수 있습니다.
 * 동을 선택하지 않으면 구 단위로 검색됩니다.
 */

import React, { useCallback, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { useFilterStore } from "@/store/filterStore";
import seoulDistricts from "../../../public/data/seoul-districts.json";

interface District {
  cortarNo: string;
  name: string;
  dongs: Array<{
    cortarNo: string;
    name: string;
  }>;
}

export default function RegionSelect() {
  const guCode = useFilterStore((s) => s.guCode);
  const dongCode = useFilterStore((s) => s.dongCode);
  const setFilter = useFilterStore((s) => s.setFilter);
  const submitSearch = useFilterStore((s) => s.submitSearch);

  // 구 목록
  const districts: District[] = useMemo(() => {
    return seoulDistricts.districts.map((d) => ({
      cortarNo: d.cortarNo,
      name: d.name,
      dongs: d.dongs.map((dong) => ({
        cortarNo: dong.cortarNo,
        name: dong.name,
      })),
    }));
  }, []);

  // 선택된 구의 동 목록
  const selectedDistrict = useMemo(() => {
    if (!guCode) return null;
    return districts.find((d) => d.cortarNo === guCode) ?? null;
  }, [guCode, districts]);

  // 구 선택 핸들러
  const handleGuChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value || null;
      setFilter("guCode", value);
      setFilter("dongCode", null); // 구 변경 시 동 초기화
      if (value) {
        submitSearch();
      }
    },
    [setFilter, submitSearch]
  );

  // 동 선택 핸들러
  const handleDongChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value || null;
      setFilter("dongCode", value);
      submitSearch();
    },
    [setFilter, submitSearch]
  );

  return (
    <div className="flex flex-col gap-2">
      {/* 구 선택 */}
      <div className="relative">
        <select
          value={guCode ?? ""}
          onChange={handleGuChange}
          className={[
            "w-full appearance-none",
            "px-3 py-2 pr-8",
            "text-sm rounded-lg border",
            "bg-white",
            "focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400",
            guCode ? "border-blue-400 text-gray-900" : "border-gray-200 text-gray-500",
          ].join(" ")}
        >
          <option value="">구 선택</option>
          {districts.map((district) => (
            <option key={district.cortarNo} value={district.cortarNo}>
              {district.name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      </div>

      {/* 동 선택 (구가 선택된 경우에만 표시) */}
      {selectedDistrict && (
        <div className="relative">
          <select
            value={dongCode ?? ""}
            onChange={handleDongChange}
            className={[
              "w-full appearance-none",
              "px-3 py-2 pr-8",
              "text-sm rounded-lg border",
              "bg-white",
              "focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400",
              dongCode ? "border-blue-400 text-gray-900" : "border-gray-200 text-gray-500",
            ].join(" ")}
          >
            <option value="">전체 (구 단위)</option>
            {selectedDistrict.dongs.map((dong) => (
              <option key={dong.cortarNo} value={dong.cortarNo}>
                {dong.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
      )}

      {/* 선택된 지역 표시 */}
      {guCode && (
        <div className="text-xs text-gray-500">
          선택: {selectedDistrict?.name}
          {dongCode && selectedDistrict?.dongs.find((d) => d.cortarNo === dongCode)?.name
            ? ` > ${selectedDistrict.dongs.find((d) => d.cortarNo === dongCode)?.name}`
            : " (전체)"}
        </div>
      )}
    </div>
  );
}
