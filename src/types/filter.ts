import type { TradeType, BuildingType } from "./article";

export interface FilterState {
  // 지역 필터
  guCode: string | null;           // 선택된 구 코드 (cortarNo)
  dongCode: string | null;         // 선택된 동 코드 (cortarNo)

  // 거래 유형 (복수 선택 가능)
  tradeTypes: TradeType[];         // ["SALE", "JEONSE", "MONTHLY"]

  // 주요 거래 유형 (가격 필터 기준)
  primaryTradeType: TradeType;     // 첫 번째 선택된 거래유형

  // 건물 유형 (복수 선택 가능)
  buildingTypes: BuildingType[];   // ["APT", "VILLA", "OFFICETEL"]

  // 매매가 범위 (만원)
  dealPriceRange: [number, number] | null;

  // 보증금 범위 (만원)
  depositRange: [number, number] | null;

  // 월세 범위 (만원)
  monthlyRentRange: [number, number] | null;

  // 전용면적 범위 (m2)
  areaRange: [number, number] | null;

  // 정렬 (기본값: recent)
  sortBy: "price_asc" | "price_desc" | "area_asc" | "area_desc" | "recent";

  // 페이지네이션
  page: number;

  // 페이지당 매물 수 (기본값: 20)
  pageSize: number;

  // 검색 트리거 (이 값이 변경될 때만 API 호출)
  searchTrigger: number;
}

// 기본 필터 값
export const DEFAULT_FILTER: FilterState = {
  guCode: null,
  dongCode: null,
  tradeTypes: ["SALE"],
  primaryTradeType: "SALE",
  buildingTypes: ["APT"],
  dealPriceRange: null,
  depositRange: null,
  monthlyRentRange: null,
  areaRange: null,
  sortBy: "recent",
  page: 1,
  pageSize: 20,
  searchTrigger: 0,
};
