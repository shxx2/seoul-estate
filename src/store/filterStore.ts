import { create } from "zustand";
import type { FilterState } from "@/types/filter";
import type { TradeType, BuildingType } from "@/types/article";
import { DEFAULT_FILTER } from "@/types/filter";

// ─────────────────────────────────────────────
// 스토어 액션 타입
// ─────────────────────────────────────────────

interface FilterActions {
  /** 단일 필터 값 업데이트 */
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;

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

  /** 검색 트리거 증가 (API 호출 유발) */
  triggerSearch: () => void;
}

// ─────────────────────────────────────────────
// 스토어
// ─────────────────────────────────────────────

export const useFilterStore = create<FilterState & FilterActions>((set, get) => ({
  ...DEFAULT_FILTER,

  setFilter: (key, value) => {
    set({ [key]: value } as Partial<FilterState>);
  },

  setGuCode: (code) => {
    set({ guCode: code, dongCode: null });
  },

  setDongCode: (code) => {
    set({ dongCode: code });
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
    });
  },

  toggleBuildingType: (type) => {
    const current = get().buildingTypes;
    const next = current.includes(type)
      ? current.filter((b) => b !== type)
      : [...current, type];

    // 최소 1개 유지
    if (next.length === 0) return;

    set({ buildingTypes: next });
  },

  setPriceRange: (field, range) => {
    set({ [field]: range } as Partial<FilterState>);
  },

  setAreaRange: (range) => {
    set({ areaRange: range });
  },

  resetFilters: () => {
    set(DEFAULT_FILTER);
  },

  triggerSearch: () => {
    set((state) => ({ searchTrigger: state.searchTrigger + 1 }));
  },
}));
