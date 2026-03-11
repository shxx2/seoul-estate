import type { Article } from "@/types/article";
import { dedupeArticlesById } from "@/lib/articles/query";

interface BoundsLike {
  btm: number;
  top: number;
  lft: number;
  rgt: number;
}

export interface NormalizeArticleOptions {
  bounds: BoundsLike;
  requestedGuName?: string;
  dealPriceMin?: number;
  dealPriceMax?: number;
  depositMin?: number;
  depositMax?: number;
  monthlyRentMin?: number;
  monthlyRentMax?: number;
  areaMin?: number;
  areaMax?: number;
}

export interface NormalizeArticleStats {
  rawCount: number;
  afterDedupeCount: number;
  afterBoundsCount: number;
  afterGuCount: number;
  afterPostFilterCount: number;
}

export interface NormalizeArticleResult {
  articles: Article[];
  stats: NormalizeArticleStats;
}

function isWithinRange(
  value: number | null,
  min: number | undefined,
  max: number | undefined
): boolean {
  if (min === undefined && max === undefined) {
    return true;
  }
  if (value === null) {
    return false;
  }
  if (min !== undefined && value < min) {
    return false;
  }
  if (max !== undefined && value > max) {
    return false;
  }
  return true;
}

function matchesPostFilters(article: Article, options: NormalizeArticleOptions): boolean {
  if (
    options.areaMin !== undefined &&
    article.exclusiveArea < options.areaMin
  ) {
    return false;
  }

  if (
    options.areaMax !== undefined &&
    article.exclusiveArea > options.areaMax
  ) {
    return false;
  }

  if (
    article.tradeType === "SALE" &&
    !isWithinRange(article.dealPrice, options.dealPriceMin, options.dealPriceMax)
  ) {
    return false;
  }

  if (
    (article.tradeType === "JEONSE" || article.tradeType === "MONTHLY") &&
    !isWithinRange(article.deposit, options.depositMin, options.depositMax)
  ) {
    return false;
  }

  if (
    article.tradeType === "MONTHLY" &&
    !isWithinRange(
      article.monthlyRent,
      options.monthlyRentMin,
      options.monthlyRentMax
    )
  ) {
    return false;
  }

  return true;
}

export function normalizeArticleResults(
  rawArticles: Article[],
  options: NormalizeArticleOptions
): NormalizeArticleResult {
  const deduped = dedupeArticlesById(rawArticles);

  const inBounds = deduped.filter((article) => {
    return (
      article.lat >= options.bounds.btm &&
      article.lat <= options.bounds.top &&
      article.lng >= options.bounds.lft &&
      article.lng <= options.bounds.rgt
    );
  });

  const inRequestedGu = options.requestedGuName
    ? inBounds.filter((article) => article.gu === options.requestedGuName)
    : inBounds;

  const postFiltered = inRequestedGu.filter((article) =>
    matchesPostFilters(article, options)
  );

  return {
    articles: postFiltered,
    stats: {
      rawCount: rawArticles.length,
      afterDedupeCount: deduped.length,
      afterBoundsCount: inBounds.length,
      afterGuCount: inRequestedGu.length,
      afterPostFilterCount: postFiltered.length,
    },
  };
}
