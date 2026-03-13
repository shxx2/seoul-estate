import { useEffect } from "react";
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
 * initialLoadAll: true면 처음에 모든 페이지를 자동으로 로드 (지도 마커용)
 */
export function useInfiniteArticles(
  appliedFilters: ArticleFilters | null,
  refreshTrigger: number,
  options: { initialLoadAll?: boolean } = { initialLoadAll: true }
) {
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

  // 자동으로 모든 페이지 로드 (지도에 전체 마커 표시용)
  // useRef로 로딩 상태 추적하여 race condition 방지
  useEffect(() => {
    if (!options.initialLoadAll) return;
    if (isLoading || isValidating) return;
    if (!data || data.length === 0) return;

    // 마지막 페이지의 hasMore 확인
    const lastPage = data[data.length - 1];
    const moreAvailable = lastPage?.data.hasMore ?? false;

    if (moreAvailable && data.length === size) {
      // 모든 요청된 페이지가 로드되었고, 더 있으면 다음 페이지 요청
      setSize(size + 1);
    }
  }, [options.initialLoadAll, isLoading, isValidating, data, size, setSize]);

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
