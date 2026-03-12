export interface ArticleFetchPlanParams {
  tradeTypes: string;
  buildingTypes: string;
  dealPriceMin?: number;
  dealPriceMax?: number;
  depositMin?: number;
  depositMax?: number;
  monthlyRentMin?: number;
  monthlyRentMax?: number;
  areaMin?: number;
  areaMax?: number;
}

export interface ArticleFetchPlan {
  maxPages: number;
  requiresPostFilter: boolean;
  stopWhenEnoughFiltered: boolean;
}

// Edge Runtime 30초 제한에 맞춤 (Cloudflare 프록시로 안정화됨)
const DEFAULT_MAX_PAGES = 5;
const DEEP_CRAWL_MAX_PAGES = 10;

export function createArticleFetchPlan(params: ArticleFetchPlanParams): ArticleFetchPlan {
  const requiresPostFilter =
    params.dealPriceMin !== undefined ||
    params.dealPriceMax !== undefined ||
    params.depositMin !== undefined ||
    params.depositMax !== undefined ||
    params.monthlyRentMin !== undefined ||
    params.monthlyRentMax !== undefined ||
    params.areaMin !== undefined ||
    params.areaMax !== undefined;

  return {
    maxPages: requiresPostFilter ? DEEP_CRAWL_MAX_PAGES : DEFAULT_MAX_PAGES,
    requiresPostFilter,
    stopWhenEnoughFiltered: !requiresPostFilter,
  };
}

export function resolveArticleFetchBatchSize(
  plan: ArticleFetchPlan,
  maxConcurrentRequests: number
): number {
  if (!plan.requiresPostFilter) {
    return 1;
  }

  return Math.max(1, Math.floor(maxConcurrentRequests));
}

export function buildArticleFetchPageBatches(
  maxPages: number,
  batchSize: number
): number[][] {
  const safeBatchSize = Math.max(1, Math.floor(batchSize));
  const batches: number[][] = [];

  for (let page = 1; page <= maxPages; page += safeBatchSize) {
    const batch: number[] = [];

    for (let offset = 0; offset < safeBatchSize; offset += 1) {
      const nextPage = page + offset;
      if (nextPage <= maxPages) {
        batch.push(nextPage);
      }
    }

    batches.push(batch);
  }

  return batches;
}
