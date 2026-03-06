"use client";

/**
 * RegionSearch - 구/동 검색 자동완성 컴포넌트
 *
 * 사용자가 검색어를 입력하면 searchRegions()로 최대 10개의 결과를 보여줍니다.
 * 항목 선택 시 filterStore의 setFilter를 통해 guCode / dongCode를 업데이트합니다.
 * 구 코드(districts 목록에 존재)는 guCode, 그 외는 dongCode를 사용합니다.
 *
 * [참고] region-lookup.ts의 searchRegions()는 구를 먼저, 동을 나중에 반환합니다.
 */

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useId,
} from "react";
import { Search, X, MapPin } from "lucide-react";
import { searchRegions } from "@/lib/region-lookup";
import { useFilterStore } from "@/store/filterStore";
import type { Region } from "@/types/region";
import seoulDistricts from "../../../public/data/seoul-districts.json";

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────

/** cortarNo가 구 단위인지 판별 (districts 목록 직접 조회) */
function isDistrictCode(cortarNo: string): boolean {
  return seoulDistricts.districts.some((d) => d.cortarNo === cortarNo);
}

// ─────────────────────────────────────────────
// Props 타입
// ─────────────────────────────────────────────

export interface RegionSearchProps {
  /** 플레이스홀더 텍스트 */
  placeholder?: string;
  /** 추가 CSS 클래스 */
  className?: string;
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────

export default function RegionSearch({
  placeholder = "구, 동 검색 (예: 강남구, 역삼동)",
  className = "",
}: RegionSearchProps) {
  const setFilter = useFilterStore((s) => s.setFilter);
  const triggerSearch = useFilterStore((s) => s.triggerSearch);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Region[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const listboxId = useId();

  // ─── 검색어 변경 핸들러 ───────────────────

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      setSelectedLabel(null);
      setActiveIndex(-1);

      if (value.trim().length === 0) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      const found = searchRegions(value.trim(), 10);
      setResults(found);
      setIsOpen(found.length > 0);
    },
    []
  );

  // ─── 항목 선택 ────────────────────────────

  const handleSelect = useCallback(
    (region: Region) => {
      setSelectedLabel(region.name);
      setQuery(region.name);
      setResults([]);
      setIsOpen(false);
      setActiveIndex(-1);

      if (isDistrictCode(region.cortarNo)) {
        setFilter("guCode", region.cortarNo);
        setFilter("dongCode", null);
      } else {
        setFilter("dongCode", region.cortarNo);
      }

      inputRef.current?.blur();
    },
    [setFilter]
  );

  // ─── 검색 실행 ────────────────────────────

  const handleSearch = useCallback(() => {
    triggerSearch();
  }, [triggerSearch]);

  // ─── 입력 초기화 ──────────────────────────

  const handleClear = useCallback(() => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setSelectedLabel(null);
    setFilter("guCode", null);
    setFilter("dongCode", null);
    inputRef.current?.focus();
  }, [setFilter]);

  // ─── 키보드 네비게이션 ────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (activeIndex >= 0 && results[activeIndex]) {
            handleSelect(results[activeIndex]);
          }
          handleSearch();
          break;
        case "Escape":
          setIsOpen(false);
          setActiveIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, activeIndex, results, handleSelect, handleSearch]
  );

  // ─── 외부 클릭 시 드롭다운 닫기 ──────────

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // ─── 활성 항목 자동 스크롤 ───────────────

  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[activeIndex] as HTMLElement;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 입력창 + 검색 버튼 */}
      <div className="flex items-center gap-2">
        <div className="relative flex items-center flex-1">
          <Search
            size={14}
            aria-hidden="true"
            className="absolute left-3 text-gray-400 pointer-events-none"
          />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={isOpen ? listboxId : undefined}
            aria-activedescendant={
              activeIndex >= 0 ? `region-option-${activeIndex}` : undefined
            }
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            placeholder={placeholder}
            className={[
              "w-full pl-8 pr-8 py-2",
              "text-sm text-gray-900 placeholder-gray-400",
              "border rounded-lg bg-white",
              "transition-all duration-150",
              selectedLabel
                ? "border-blue-400 ring-1 ring-blue-100"
                : "border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100",
              "focus:outline-none",
            ]
              .join(" ")
              .trim()}
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2.5 text-gray-400 hover:text-gray-600 transition-colors focus-visible:outline-none"
              aria-label="검색어 지우기"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleSearch}
          className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shrink-0"
        >
          검색
        </button>
      </div>

      {/* 자동완성 드롭다운 */}
      {isOpen && results.length > 0 && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="검색 결과"
          className={[
            "absolute z-50 top-full left-0 right-0 mt-1",
            "bg-white border border-gray-200 rounded-lg shadow-lg",
            "max-h-60 overflow-y-auto",
            "divide-y divide-gray-50",
          ].join(" ")}
        >
          {results.map((region, index) => {
            const isDistrict = isDistrictCode(region.cortarNo);
            const isActive = index === activeIndex;

            return (
              <li
                key={region.cortarNo}
                id={`region-option-${index}`}
                role="option"
                aria-selected={isActive}
                onMouseDown={(e) => {
                  // mousedown으로 처리하여 onBlur보다 먼저 실행되도록 함
                  e.preventDefault();
                  handleSelect(region);
                }}
                className={[
                  "flex items-center gap-2 px-3 py-2 cursor-pointer",
                  "text-sm transition-colors duration-75",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50",
                ].join(" ")}
              >
                <MapPin
                  size={12}
                  aria-hidden="true"
                  className={isActive ? "text-blue-500" : "text-gray-400"}
                />
                <span className="flex-1 truncate">{region.name}</span>
                <span
                  className={[
                    "text-[10px] px-1.5 py-0.5 rounded font-medium",
                    isDistrict
                      ? "bg-orange-50 text-orange-500"
                      : "bg-gray-100 text-gray-500",
                  ].join(" ")}
                >
                  {isDistrict ? "구" : "동"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
