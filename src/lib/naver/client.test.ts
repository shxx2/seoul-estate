import test from "node:test";
import assert from "node:assert/strict";

import {
  NaverUpstreamError,
  parseNaverArticleListResponse,
  resolveNaverRequestRuntimeConfig,
  shouldRetryNaverError,
} from "./client";

test("classifies HTML redirect responses as upstream redirect errors", () => {
  assert.throws(
    () =>
      parseNaverArticleListResponse(307, "<!DOCTYPE HTML><html><head><title>네이버페이 부동산</title></head></html>"),
    (error: unknown) =>
      error instanceof NaverUpstreamError && error.code === "UPSTREAM_REDIRECT"
  );
});

test("classifies malformed JSON as invalid-json upstream errors", () => {
  assert.throws(
    () => parseNaverArticleListResponse(200, '{"body":'),
    (error: unknown) =>
      error instanceof NaverUpstreamError && error.code === "INVALID_JSON"
  );
});

test("parses valid article-list JSON bodies", () => {
  const parsed = parseNaverArticleListResponse(
    200,
    JSON.stringify({
      more: false,
      body: [
        {
          atclNo: "1",
          atclNm: "테스트",
          rletTpNm: "아파트",
          tradTpNm: "전세",
          flrInfo: "1/10",
          prc: 50000,
          hanPrc: "5억",
          rentPrc: 0,
          spc1: 84,
          spc2: 59,
          direction: "남향",
          atclCfmYmd: "26.03.11.",
          lat: 37.5,
          lng: 127.0,
          atclFetrDesc: "",
          tagList: [],
          bildNm: "101동",
          cpNm: "중개사",
          rltrNm: "중개사",
          repImgUrl: "",
          repImgThumb: "f130_98",
        },
      ],
    })
  );

  assert.equal(parsed.body.length, 1);
  assert.equal(parsed.more, false);
});

test("retries redirect and invalid-json upstream failures", () => {
  assert.equal(
    shouldRetryNaverError(new NaverUpstreamError("UPSTREAM_REDIRECT", "redirected", 307)),
    true
  );
  assert.equal(
    shouldRetryNaverError(new NaverUpstreamError("INVALID_JSON", "invalid", 200)),
    true
  );
  assert.equal(
    shouldRetryNaverError(new NaverUpstreamError("HTTP_ERROR", "bad request", 400)),
    false
  );
});

test("uses the local upstream fetch profile outside vercel", () => {
  const config = resolveNaverRequestRuntimeConfig({});

  assert.deepEqual(config, {
    requestTimeoutMs: 8000,
    maxRetries: 2,
    delayMinMs: 300,
    delayMaxMs: 800,
    maxConcurrentRequests: 1,
  });
});

test("uses a longer single-attempt upstream fetch profile on vercel", () => {
  const config = resolveNaverRequestRuntimeConfig({ VERCEL: "1" });

  assert.deepEqual(config, {
    requestTimeoutMs: 180000,
    maxRetries: 0,
    delayMinMs: 0,
    delayMaxMs: 0,
    maxConcurrentRequests: 2,
  });
});
