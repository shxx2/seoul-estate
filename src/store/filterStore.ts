import { create } from "zustand";
import type { FilterState, ArticleFilters } from "@/types/filter";
import type { TradeType, BuildingType } from "@/types/article";
import { DEFAULT_FILTER, DEFAULT_ARTICLE_FILTERS } from "@/types/filter";

// ─────────────────────────────────────────────
// 스토어 액션 타입
// ─────────────────────────────────────────────

interface FilterActions {
  /** 단일 필터 값 업데이트 */
  setFilter: <K extends keyof ArticleFilters>(key: K, value: ArticleFilters[K]) => void;

  /** 구 코드 설정 (동 코드는 초기화) */
  setGuCode: (code: string | null) => void;

  /** 동 코드 설정 */
  setDongCode: (code: string | null) => void;

  /** 거래 유형 토글 (최소 1개 유지) */
  toggleTradeType: (type: TradeType) => void;

  /** 건물 유형 토글 (최소 1개 유지) */
  toggleBuildingType: (type: BuildingType) => void;

  /** 가격 범위 설정 */
  setPriceRange: (
    field: "dealPriceRange" | "depositRange" | "monthlyRentRange",
    range: [number, number] | null
  ) => void;

  /** 면적 범위 설정 */
  setAreaRange: (range: [number, number] | null) => void;

  /** 필터 전체 초기화 */
  resetFilters: () => void;

  /** 현재 draft 필터를 실제 검색 조건으로 반영 */
  submitSearch: () => void;

  /** 현재 결과의 페이지를 변경 */
  setPage: (page: number) => void;
}

// ─────────────────────────────────────────────
// 스토어
// ─────────────────────────────────────────────

export const useFilterStore = create<FilterState & FilterActions>((set, get) => ({
  ...DEFAULT_FILTER,

  // draft 상태를 applied 검색 조건으로 복사
  // 검색 버튼/지역 선택 시에만 호출한다.
  submitSearch: () => {
    set((state) => ({
      page: 1,
      appliedFilters: {
        guCode: state.guCode,
        dongCode: state.dongCode,
        tradeTypes: [...state.tradeTypes],
        primaryTradeType: state.primaryTradeType,
        buildingTypes: [...state.buildingTypes],
        dealPriceRange: state.dealPriceRange ? [...state.dealPriceRange] as [number, number] : null,
        depositRange: state.depositRange ? [...state.depositRange] as [number, number] : null,
        monthlyRentRange: state.monthlyRentRange ? [...state.monthlyRentRange] as [number, number] : null,
        areaRange: state.areaRange ? [...state.areaRange] as [number, number] : null,
        sortBy: state.sortBy,
        page: 1,
        pageSize: state.pageSize,
      },
      refreshTrigger: state.refreshTrigger + 1,
    }));
  },

  setPage: (page) => {
    set((state) => ({
      page,
      appliedFilters: state.appliedFilters
        ? { ...state.appliedFilters, page }
        : null,
    }));
  },

  setFilter: (key, value) => {
    set((state) => ({
      ...state,
      [key]: value,
      page:
        key === "page"
          ? (value as ArticleFilters["page"])
          : key === "pageSize"
            ? state.page
            : 1,
    }));
  },

  setGuCode: (code) => {
    set({ guCode: code, dongCode: null, page: 1 });
  },

  setDongCode: (code) => {
    set({ dongCode: code, page: 1 });
  },

  toggleTradeType: (type) => {
    const current = get().tradeTypes;
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];

    // 최소 1개 유지
    if (next.length === 0) return;

    set({
      tradeTypes: next,
      primaryTradeType: next[0],
      page: 1,
    });
  },

  toggleBuildingType: (type) => {
    const current = get().buildingTypes;
    const next = current.includes(type)
      ? current.filter((b) => b !== type)
      : [...current, type];

    // 최소 1개 유지
    if (next.length === 0) return;

    set({ buildingTypes: next, page: 1 });
  },

  setPriceRange: (field, range) => {
    set({ [field]: range, page: 1 } as Partial<FilterState>);
  },

  setAreaRange: (range) => {
    set({ areaRange: range, page: 1 });
  },

  resetFilters: () => {
    set((state) => ({
      ...state,
      ...DEFAULT_ARTICLE_FILTERS,
    }));
  },
}));
