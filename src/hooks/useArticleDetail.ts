import useSWR from "swr";
import type { Article } from "@/types/article";

interface ArticleDetailResponse {
  success: boolean;
  data: Article;
}

interface UseArticleDetailOptions {
  /** 캐시 미스 시 보여줄 초기 데이터 */
  fallbackData?: Article;
}

const fetcher = (url: string): Promise<ArticleDetailResponse> =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<ArticleDetailResponse>;
  });

/**
 * 매물 상세 조회 훅
 * @param articleId - 조회할 매물 ID (null이면 fetch 안 함)
 * @param options - fallbackData 옵션 지원
 */
export function useArticleDetail(
  articleId: string | null,
  options: UseArticleDetailOptions = {}
) {
  const { fallbackData } = options;

  const key = articleId ? `/api/articles/${articleId}` : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    ArticleDetailResponse,
    Error
  >(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000,
    fallbackData: fallbackData
      ? { success: true, data: fallbackData }
      : undefined,
  });

  return {
    article: data?.data ?? null,
    isLoading,
    isValidating,
    error,
    mutate,
  };
}
