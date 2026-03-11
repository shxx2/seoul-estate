import test from "node:test";
import assert from "node:assert/strict";

import type { Article } from "@/types/article";
import { normalizeArticleResults } from "./normalize-articles";

function createArticle(overrides: Partial<Article>): Article {
  return {
    id: "1",
    tradeType: "JEONSE",
    buildingType: "APT",
    articleName: "테스트",
    address: "",
    roadAddress: "",
    gu: "성동구",
    dong: "성수동",
    lat: 37.54,
    lng: 127.05,
    dealPrice: null,
    deposit: 65000,
    monthlyRent: null,
    priceText: "6억 5,000",
    supplyArea: 84,
    exclusiveArea: 59,
    supplyAreaPyeong: 25,
    exclusiveAreaPyeong: 18,
    floor: "10/20",
    totalFloor: 20,
    buildYear: null,
    direction: "남향",
    roomCount: 3,
    bathroomCount: 2,
    description: "",
    confirmDate: "26.03.11.",
    agentName: "중개사",
    articleUrl: "https://example.com",
    thumbnailUrl: null,
    hasDetailInfo: false,
    ...overrides,
  };
}

test("normalizes article results with dedupe and backend filters", () => {
  const bounds = {
    btm: 37.5,
    top: 37.6,
    lft: 127.0,
    rgt: 127.1,
  };

  const result = normalizeArticleResults(
    [
      createArticle({ id: "keep-1", deposit: 65000 }),
      createArticle({ id: "keep-1", articleName: "duplicate" }),
      createArticle({ id: "out-of-bounds", lat: 37.7 }),
      createArticle({ id: "wrong-gu", gu: "광진구" }),
      createArticle({ id: "too-expensive", deposit: 90000 }),
      createArticle({ id: "wrong-area", exclusiveArea: 120 }),
      createArticle({ id: "keep-2", deposit: 50000, exclusiveArea: 84 }),
    ],
    {
      bounds,
      requestedGuName: "성동구",
      depositMax: 70000,
      areaMin: 50,
      areaMax: 100,
    }
  );

  assert.equal(result.stats.rawCount, 7);
  assert.equal(result.stats.afterDedupeCount, 6);
  assert.equal(result.stats.afterBoundsCount, 5);
  assert.equal(result.stats.afterGuCount, 4);
  assert.equal(result.stats.afterPostFilterCount, 2);
  assert.deepEqual(
    result.articles.map((article) => article.id),
    ["keep-1", "keep-2"]
  );
});
