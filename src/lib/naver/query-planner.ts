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

const DEFAULT_MAX_PAGES = 3;
const DEEP_CRAWL_MAX_PAGES = 15;

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
