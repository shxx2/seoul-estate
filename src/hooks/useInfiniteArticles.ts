import useSWRInfinite from "swr/infinite";
import type { Article } from "@/types/article";
import type { ArticleFilters } from "@/types/filter";

export interface ArticlesPageResponse {
  success: boolean;
  data: {
    articles: Article[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "ApiError";
  }
}

const fetcher = async (url: string): Promise<ArticlesPageResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const code = (errorBody as { error?: { code?: string } })?.error?.code || "UNKNOWN_ERROR";
    const message = (errorBody as { error?: { message?: string } })?.error?.message || `HTTP ${res.status}`;
    throw new ApiError(code, message);
  }
  return res.json();
};

function buildUrl(filters: ArticleFilters, page: number, refreshTrigger: number): string {
  const params = new URLSearchParams();

  if (filters.guCode) params.set("guCode", filters.guCode);
  if (filters.dongCode) params.set("dongCode", filters.dongCode);

  filters.tradeTypes.forEach((t) => params.append("tradeTypes", t));
  filters.buildingTypes.forEach((b) => params.append("buildingTypes", b));

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

  params.set("sortBy", filters.sortBy);
  params.set("page", String(page));
  params.set("pageSize", String(filters.pageSize));
  params.set("_refresh", String(refreshTrigger));

  return `/api/articles?${params.toString()}`;
}

/**
 * 무한 스크롤용 매물 목록 조회 훅
 */
export function useInfiniteArticles(appliedFilters: ArticleFilters | null, refreshTrigger: number) {
  const getKey = (pageIndex: number, previousPageData: ArticlesPageResponse | null) => {
    // 필터가 없으면 요청 안함
    if (!appliedFilters) return null;

    // 이전 페이지가 있고 더 이상 데이터가 없으면 중단
    if (previousPageData && !previousPageData.data.hasMore) return null;

    return buildUrl(appliedFilters, pageIndex + 1, refreshTrigger);
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite<
    ArticlesPageResponse,
    Error
  >(getKey, fetcher, {
    revalidateOnFocus: false,
    revalidateFirstPage: false,
    parallel: false, // 순차적으로 요청 (rate limit 방지)
  });

  // 모든 페이지의 매물을 하나의 배열로 합침
  const articles = data ? data.flatMap((page) => page.data.articles) : [];
  const total = data?.[0]?.data.total ?? 0;
  const hasMore = data ? data[data.length - 1]?.data.hasMore ?? false : false;
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      setSize(size + 1);
    }
  };

  return {
    articles,
    total,
    hasMore,
    isLoading,
    isLoadingMore: isLoadingMore && !isLoading,
    isValidating,
    error,
    loadMore,
    mutate,
  };
}
