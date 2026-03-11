import type { Article } from "@/types/article";
import { createArticleFetchPlan } from "@/lib/naver/query-planner";

export interface ArticleCacheKeyParams {
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
}

export interface ArticleFetchDepthParams {
  dealPriceMin?: number;
  dealPriceMax?: number;
  depositMin?: number;
  depositMax?: number;
  monthlyRentMin?: number;
  monthlyRentMax?: number;
  areaMin?: number;
  areaMax?: number;
}

export function buildArticleCacheKey(params: ArticleCacheKeyParams): string {
  const n = (value: number | undefined) => (value !== undefined ? String(value) : "");

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
  ].join(":");
}

export function resolveMaxArticleFetchPages(params: ArticleFetchDepthParams): number {
  return createArticleFetchPlan({
    tradeTypes: "A1:B1:B2",
    buildingTypes: "APT:VL:OPST",
    dealPriceMin: params.dealPriceMin,
    dealPriceMax: params.dealPriceMax,
    depositMin: params.depositMin,
    depositMax: params.depositMax,
    monthlyRentMin: params.monthlyRentMin,
    monthlyRentMax: params.monthlyRentMax,
    areaMin: params.areaMin,
    areaMax: params.areaMax,
  }).maxPages;
}

export function shouldForceArticleRefresh(refreshToken: number | undefined, page: number): boolean {
  return Boolean(refreshToken && refreshToken > 0 && page === 1);
}

function getComparablePrice(article: Article): number {
  return article.dealPrice ?? article.deposit ?? article.monthlyRent ?? 0;
}

function getComparableRecentValue(article: Article): number {
  const compactDate = article.confirmDate.replace(/\D/g, "");
  const parsed = Number(compactDate);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function sortArticles(articles: Article[], sortBy: string): Article[] {
  const indexed = articles.map((article, index) => ({ article, index }));

  indexed.sort((left, right) => {
    switch (sortBy) {
      case "price_asc":
        return getComparablePrice(left.article) - getComparablePrice(right.article);
      case "price_desc":
        return getComparablePrice(right.article) - getComparablePrice(left.article);
      case "area_asc":
        return left.article.exclusiveArea - right.article.exclusiveArea;
      case "area_desc":
        return right.article.exclusiveArea - left.article.exclusiveArea;
      case "recent":
      default: {
        const diff =
          getComparableRecentValue(right.article) - getComparableRecentValue(left.article);
        if (diff !== 0) {
          return diff;
        }

        // Preserve the original Naver ordering for items confirmed on the same day.
        return left.index - right.index;
      }
    }
  });

  return indexed.map(({ article }) => article);
}

export function paginateArticles(articles: Article[], page: number, pageSize: number) {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return {
    pageArticles: articles.slice(startIndex, endIndex),
    hasMore: endIndex < articles.length,
  };
}

export function dedupeArticlesById(articles: Article[]): Article[] {
  const seen = new Set<string>();
  const deduped: Article[] = [];

  for (const article of articles) {
    if (seen.has(article.id)) {
      continue;
    }
    seen.add(article.id);
    deduped.push(article);
  }

  return deduped;
}
