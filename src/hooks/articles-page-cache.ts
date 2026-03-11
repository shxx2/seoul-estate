import type { ArticleFilters } from "@/types/filter";

export const ARTICLE_PAGE_CACHE_TTL_MS = 60 * 1000;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const articlePageCache = new Map<string, CacheEntry<unknown>>();
const prefetchedQueryCache = new Map<string, number>();

function buildQueryString(filters: ArticleFilters): string {
  const params = new URLSearchParams();

  if (filters.guCode) params.set("guCode", filters.guCode);
  if (filters.dongCode) params.set("dongCode", filters.dongCode);

  filters.tradeTypes.forEach((type) => params.append("tradeTypes", type));
  filters.buildingTypes.forEach((type) => params.append("buildingTypes", type));

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

export function buildArticlePrefetchRequestKeys(
  filters: ArticleFilters,
  refreshTrigger: number,
  total: number,
  pageSize: number
): string[] {
  const totalPages = Math.ceil(total / pageSize);
  const keys: string[] = [];

  for (let page = filters.page + 1; page <= totalPages; page += 1) {
    const key = buildArticlesRequestKey({ ...filters, page }, refreshTrigger);
    if (key) {
      keys.push(key);
    }
  }

  return keys;
}

export function getCachedArticlePage<T>(
  key: string,
  now = Date.now()
): T | null {
  const entry = articlePageCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= now) {
    articlePageCache.delete(key);
    return null;
  }

  return entry.data;
}

export function setCachedArticlePage<T>(
  key: string,
  data: T,
  now = Date.now()
): void {
  articlePageCache.set(key, {
    data,
    expiresAt: now + ARTICLE_PAGE_CACHE_TTL_MS,
  });
}

function buildArticlePrefetchGroupKey(
  filters: ArticleFilters,
  refreshTrigger: number
): string {
  return buildArticlesRequestKey({ ...filters, page: 1 }, refreshTrigger) ?? "";
}

export function shouldPrefetchArticleQuery(
  filters: ArticleFilters,
  refreshTrigger: number,
  now = Date.now()
): boolean {
  const groupKey = buildArticlePrefetchGroupKey(filters, refreshTrigger);
  const existing = prefetchedQueryCache.get(groupKey);

  if (existing && existing > now) {
    return false;
  }

  prefetchedQueryCache.set(groupKey, now + ARTICLE_PAGE_CACHE_TTL_MS);
  return true;
}

export function clearExpiredArticlePageCache(now = Date.now()): void {
  articlePageCache.forEach((entry, key) => {
    if (entry.expiresAt <= now) {
      articlePageCache.delete(key);
    }
  });

  prefetchedQueryCache.forEach((expiresAt, key) => {
    if (expiresAt <= now) {
      prefetchedQueryCache.delete(key);
    }
  });
}

export function resetArticlePageCache(): void {
  articlePageCache.clear();
  prefetchedQueryCache.clear();
}
