import test from "node:test";
import assert from "node:assert/strict";

import { transformNaverArticle } from "./transform";
import type { NaverArticleItem } from "./types";

function createRawArticle(overrides: Partial<NaverArticleItem> = {}): NaverArticleItem {
  return {
    atclNo: "2613551474",
    atclNm: "금호센트럴자이",
    rletTpNm: "아파트",
    tradTpNm: "전세",
    flrInfo: "11/17",
    prc: 98000,
    hanPrc: "9억 8,000",
    rentPrc: 0,
    spc1: 111,
    spc2: 84.97,
    direction: "남동향",
    atclCfmYmd: "26.03.11.",
    lat: 37.552746,
    lng: 127.022633,
    atclFetrDesc: "0공동환영해요0뻥뷰로채광우수0특올수리후첫입주",
    tagList: ["15년이내", "올수리"],
    bildNm: "103동",
    cpNm: "선방",
    rltrNm: "월드공인중개사사무소",
    repImgUrl: "",
    repImgThumb: "f130_98",
    cortarNo: "1120011000",
    ...overrides,
  };
}

test("transformNaverArticle builds a live Naver detail URL for the article", () => {
  const article = transformNaverArticle(createRawArticle());

  assert.equal(article.articleUrl, "https://m.land.naver.com/article/info/2613551474");
});
