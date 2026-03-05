import useSWR from "swr";
import type { Article } from "@/types/article";
import type { FilterState } from "@/types/filter";

interface ArticlesResponse {
  success: boolean;
  data: {
    articles: Article[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

interface UseArticlesOptions {
  /** 이 값이 변경될 때만 fetch 트리거 */
  searchTrigger: number;
}

function buildQueryString(filters: FilterState): string {
  const params = new URLSearchParams();

  if (filters.guCode) params.set("guCode", filters.guCode);
  if (filters.dongCode) params.set("dongCode", filters.dongCode);

  filters.tradeTypes.forEach((t) => params.append("tradeTypes", t));
  filters.buildingTypes.forEach((b) => params.append("buildingTypes", b));

  params.set("primaryTradeType", filters.primaryTradeType);
  params.set("sortBy", filters.sortBy);
  params.set("page", String(filters.page));
  params.set("pageSize", String(filters.pageSize));

  if (filters.dealPriceRange) {
    params.set("dealPriceMin", String(filters.dealPriceRange[0]));
    params.set("dealPriceMax", String(filters.dealPriceRange[1]));
  }
  if (filters.depositRange) {
    params.set("depositMin", String(filters.depositRange[0]));
    params.set("depositMax", String(filters.depositRange[1]));
  }
  if (filters.monthlyRentRange) {
    params.set("monthlyRentMin", String(filters.monthlyRentRange[0]));
    params.set("monthlyRentMax", String(filters.monthlyRentRange[1]));
  }
  if (filters.areaRange) {
    params.set("areaMin", String(filters.areaRange[0]));
    params.set("areaMax", String(filters.areaRange[1]));
  }

  return params.toString();
}

const fetcher = (url: string): Promise<ArticlesResponse> =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<ArticlesResponse>;
  });

/**
 * 필터 상태 기반 매물 목록 조회 훅
 * searchTrigger가 변경될 때만 새로운 fetch 수행
 */
export function useArticles(filters: FilterState, options: UseArticlesOptions) {
  const { searchTrigger } = options;

  // searchTrigger를 키에 포함시켜 변경 시에만 fetch
  const key =
    searchTrigger > 0
      ? `/api/articles?${buildQueryString(filters)}&_t=${searchTrigger}`
      : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    ArticlesResponse,
    Error
  >(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000,
  });

  return {
    articles: data?.data.articles ?? [],
    total: data?.data.total ?? 0,
    page: data?.data.page ?? 1,
    pageSize: data?.data.pageSize ?? 20,
    hasMore: data?.data.hasMore ?? false,
    isLoading,
    isValidating,
    error,
    mutate,
  };
}
