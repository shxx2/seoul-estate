import type { TradeType, BuildingType } from "./article";

export interface ArticleFilters {
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

  // 정렬 (기본값: 가격 낮은 순)
  sortBy: "price_asc" | "price_desc" | "area_asc" | "area_desc" | "recent";

  // 페이지네이션
  page: number;

  // 페이지당 매물 수 (기본값: 20)
  pageSize: number;
}

export interface FilterState extends ArticleFilters {
  // 실제 조회에 사용 중인 필터 스냅샷
  appliedFilters: ArticleFilters | null;
  // 명시적 새로고침 트리거 (검색 버튼 클릭 시 증가)
  refreshTrigger: number;
}

// 기본 필터 값
export const DEFAULT_ARTICLE_FILTERS: ArticleFilters = {
  guCode: null,
  dongCode: null,
  tradeTypes: ["SALE"],
  primaryTradeType: "SALE",
  buildingTypes: ["APT"],
  dealPriceRange: null,
  depositRange: null,
  monthlyRentRange: null,
  areaRange: null,
  sortBy: "price_asc",
  page: 1,
  pageSize: 20,
};

export const DEFAULT_FILTER: FilterState = {
  ...DEFAULT_ARTICLE_FILTERS,
  appliedFilters: null,
  refreshTrigger: 0,
};
