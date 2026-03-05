import { CACHE_TTL_MS } from "@/lib/constants";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

export function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * 캐시 키 생성 - 모든 필터 파라미터 포함
 * undefined 값은 빈 문자열로 정규화하여 일관된 키 생성
 */
export function buildCacheKey(params: {
  cortarNo: string;
  tradeTypes: string;
  buildingTypes: string;
  priceMin?: number;
  priceMax?: number;
  depositMin?: number;
  depositMax?: number;
  rentMin?: number;
  rentMax?: number;
  areaMin?: number;
  areaMax?: number;
  sort: string;
  page: number;
  pageSize: number;
}): string {
  const n = (v: number | undefined) => (v !== undefined ? String(v) : "");
  return [
    "articles",
    params.cortarNo,
    params.tradeTypes,
    params.buildingTypes,
    n(params.priceMin),
    n(params.priceMax),
    n(params.depositMin),
    n(params.depositMax),
    n(params.rentMin),
    n(params.rentMax),
    n(params.areaMin),
    n(params.areaMax),
    params.sort,
    params.page,
    params.pageSize,
  ].join(":");
}

export function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of Array.from(cache.entries())) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      cache.delete(key);
    }
  }
}
