import useSWR from "swr";
import type { Article } from "@/types/article";
import type { ArticleFilters } from "@/types/filter";

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

function buildQueryString(filters: ArticleFilters): string {
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

export function buildArticlesRequestKey(
  appliedFilters: ArticleFilters | null,
  refreshTrigger: number
): string | null {
  if (!appliedFilters) {
    return null;
  }

  return `/api/articles?${buildQueryString(appliedFilters)}&_refresh=${refreshTrigger}`;
}

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "ApiError";
  }
}

const fetcher = async (url: string): Promise<ArticlesResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const code = (errorBody as { error?: { code?: string } })?.error?.code || "UNKNOWN_ERROR";
    const message = (errorBody as { error?: { message?: string } })?.error?.message || `HTTP ${res.status}`;
    throw new ApiError(code, message);
  }
  return res.json() as Promise<ArticlesResponse>;
};

/**
 * 필터 상태 기반 매물 목록 조회 훅
 * appliedFilters가 존재할 때만 실제 검색 요청을 수행한다.
 */
export function useArticles(appliedFilters: ArticleFilters | null, refreshTrigger: number) {
  const key = buildArticlesRequestKey(appliedFilters, refreshTrigger);

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    ArticlesResponse,
    Error
  >(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 2000, // 2초 - 연속 클릭 방지 수준으로 축소
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
