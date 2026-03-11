import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";

import type { ArticleFilters } from "@/types/filter";
import {
  ARTICLE_PAGE_CACHE_TTL_MS,
  buildArticlePrefetchRequestKeys,
  getCachedArticlePage,
  resetArticlePageCache,
  setCachedArticlePage,
  shouldPrefetchArticleQuery,
} from "./articles-page-cache";

const baseFilters: ArticleFilters = {
  guCode: "1168000000",
  dongCode: null,
  tradeTypes: ["SALE"],
  primaryTradeType: "SALE",
  buildingTypes: ["APT"],
  dealPriceRange: null,
  depositRange: null,
  monthlyRentRange: null,
  areaRange: null,
  sortBy: "price_asc",
  page: 1,
  pageSize: 20,
};

beforeEach(() => {
  resetArticlePageCache();
});

test("buildArticlePrefetchRequestKeys creates keys for remaining pages of the first search", () => {
  const keys = buildArticlePrefetchRequestKeys(baseFilters, 7, 47, 20);

  assert.deepEqual(keys, [
    "/api/articles?guCode=1168000000&tradeTypes=SALE&buildingTypes=APT&primaryTradeType=SALE&sortBy=price_asc&page=2&pageSize=20&_refresh=7",
    "/api/articles?guCode=1168000000&tradeTypes=SALE&buildingTypes=APT&primaryTradeType=SALE&sortBy=price_asc&page=3&pageSize=20&_refresh=7",
  ]);
});

test("article page cache expires entries after one minute", () => {
  setCachedArticlePage("page-1", { total: 47 }, 1_000);

  assert.deepEqual(getCachedArticlePage("page-1", 1_000), { total: 47 });
  assert.equal(getCachedArticlePage("page-1", 1_000 + ARTICLE_PAGE_CACHE_TTL_MS + 1), null);
});

test("shouldPrefetchArticleQuery only allows one prefetch per query during the ttl window", () => {
  assert.equal(shouldPrefetchArticleQuery(baseFilters, 7, 1_000), true);
  assert.equal(shouldPrefetchArticleQuery(baseFilters, 7, 1_500), false);
  assert.equal(
    shouldPrefetchArticleQuery(baseFilters, 7, 1_000 + ARTICLE_PAGE_CACHE_TTL_MS + 1),
    true
  );
});
