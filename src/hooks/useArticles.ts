import { useEffect } from "react";
import useSWR from "swr";
import type { Article } from "@/types/article";
import type { ArticleFilters } from "@/types/filter";
import {
  buildArticlePrefetchRequestKeys,
  buildArticlesRequestKey,
  clearExpiredArticlePageCache,
  getCachedArticlePage,
  setCachedArticlePage,
  shouldPrefetchArticleQuery,
} from "./articles-page-cache";

export interface ArticlesResponse {
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

const fetcher = async (url: string): Promise<ArticlesResponse> => {
  clearExpiredArticlePageCache();

  const cached = getCachedArticlePage<ArticlesResponse>(url);
  if (cached) {
    return cached;
  }

  const res = await fetch(url);
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const code = (errorBody as { error?: { code?: string } })?.error?.code || "UNKNOWN_ERROR";
    const message = (errorBody as { error?: { message?: string } })?.error?.message || `HTTP ${res.status}`;
    throw new ApiError(code, message);
  }
  const data = await res.json() as ArticlesResponse;
  setCachedArticlePage(url, data);
  return data;
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

  useEffect(() => {
    if (!data || !appliedFilters || appliedFilters.page !== 1) {
      return;
    }

    if (!shouldPrefetchArticleQuery(appliedFilters, refreshTrigger)) {
      return;
    }

    const keys = buildArticlePrefetchRequestKeys(
      appliedFilters,
      refreshTrigger,
      data.data.total,
      data.data.pageSize
    );

    for (const prefetchKey of keys) {
      if (getCachedArticlePage<ArticlesResponse>(prefetchKey)) {
        continue;
      }

      void fetcher(prefetchKey).catch(() => {
        // Background prefetch failure should not affect the visible page.
      });
    }
  }, [appliedFilters, data, refreshTrigger]);

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
