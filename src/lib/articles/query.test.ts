import test from "node:test";
import assert from "node:assert/strict";

import type { Article } from "@/types/article";
import {
  buildArticleCacheKey,
  dedupeArticlesById,
  resolveMaxArticleFetchPages,
  shouldForceArticleRefresh,
  sortArticles,
} from "./query";

function createArticle(overrides: Partial<Article>): Article {
  return {
    id: "1",
    tradeType: "SALE",
    buildingType: "APT",
    articleName: "테스트 아파트",
    address: "",
    roadAddress: "",
    gu: "강남구",
    dong: "역삼동",
    lat: 37.5,
    lng: 127,
    dealPrice: 100000,
    deposit: null,
    monthlyRent: null,
    priceText: "10억",
    supplyArea: 100,
    exclusiveArea: 84,
    supplyAreaPyeong: 30,
    exclusiveAreaPyeong: 25,
    floor: "10/20",
    totalFloor: 20,
    buildYear: "2020",
    direction: "남향",
    roomCount: 3,
    bathroomCount: 2,
    description: "",
    confirmDate: "20260311",
    agentName: "중개사",
    articleUrl: "https://example.com/article/1",
    thumbnailUrl: null,
    hasDetailInfo: false,
    ...overrides,
  };
}

test("buildArticleCacheKey ignores pagination and refresh tokens for the same query", () => {
  const firstPageKey = buildArticleCacheKey({
    cortarNo: "1168000000",
    tradeTypes: "A1",
    buildingTypes: "APT",
    priceMin: 10000,
    priceMax: 20000,
    depositMin: undefined,
    depositMax: undefined,
    rentMin: undefined,
    rentMax: undefined,
    areaMin: 59,
    areaMax: 84,
  });

  const secondPageKey = buildArticleCacheKey({
    cortarNo: "1168000000",
    tradeTypes: "A1",
    buildingTypes: "APT",
    priceMin: 10000,
    priceMax: 20000,
    depositMin: undefined,
    depositMax: undefined,
    rentMin: undefined,
    rentMax: undefined,
    areaMin: 59,
    areaMax: 84,
  });

  assert.equal(firstPageKey, secondPageKey);
});

test("shouldForceArticleRefresh only refreshes the first page when a manual refresh token exists", () => {
  assert.equal(shouldForceArticleRefresh(undefined, 1), false);
  assert.equal(shouldForceArticleRefresh(0, 1), false);
  assert.equal(shouldForceArticleRefresh(12, 1), true);
  assert.equal(shouldForceArticleRefresh(12, 2), false);
});

test("sortArticles keeps Naver order for same-day items when sorting by recent", () => {
  const older = createArticle({ id: "older", confirmDate: "20260310", dealPrice: 90000 });
  const sameDayFirst = createArticle({ id: "first", confirmDate: "20260311", dealPrice: 200000 });
  const sameDaySecond = createArticle({ id: "second", confirmDate: "20260311", dealPrice: 100000 });

  const sorted = sortArticles([older, sameDayFirst, sameDaySecond], "recent");

  assert.deepEqual(
    sorted.map((article) => article.id),
    ["first", "second", "older"]
  );
});

test("resolveMaxArticleFetchPages expands the crawl depth when backend-only filters are active", () => {
  assert.equal(
    resolveMaxArticleFetchPages({
      dealPriceMin: undefined,
      dealPriceMax: undefined,
      depositMin: undefined,
      depositMax: undefined,
      monthlyRentMin: undefined,
      monthlyRentMax: undefined,
      areaMin: undefined,
      areaMax: undefined,
    }),
    3
  );

  assert.equal(
    resolveMaxArticleFetchPages({
      dealPriceMin: undefined,
      dealPriceMax: undefined,
      depositMin: 0,
      depositMax: 70000,
      monthlyRentMin: undefined,
      monthlyRentMax: undefined,
      areaMin: undefined,
      areaMax: undefined,
    }),
    15
  );
});

test("dedupeArticlesById removes repeated articles while preserving order", () => {
  const first = createArticle({ id: "first" });
  const duplicate = createArticle({ id: "first", articleName: "중복" });
  const second = createArticle({ id: "second" });

  const deduped = dedupeArticlesById([first, duplicate, second]);

  assert.deepEqual(
    deduped.map((article) => article.id),
    ["first", "second"]
  );
  assert.equal(deduped[0]?.articleName, "테스트 아파트");
});
