# Naver Adapter Hardening Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 네이버 비공식 매물 엔드포인트를 직접 신뢰하지 않고, 응답 불안정/필터 무시/페이지 누락을 우리 서버 어댑터 레이어에서 흡수해 더 정확한 검색 결과를 제공한다.

**Architecture:** `src/lib/naver/`를 단순 fetch 유틸이 아니라 “수집 플래너 + HTTP 클라이언트 + 응답 정규화/진단” 계층으로 나눈다. `/api/articles`는 더 이상 하드코딩된 `MAX_PAGES`와 암묵적 upstream 신뢰에 의존하지 않고, 쿼리 특성에 맞는 수집 전략과 후처리 통계를 사용한다.

**Tech Stack:** Next.js App Router, TypeScript, Zustand, SWR, Node test runner (`node --import tsx --test`)

---

## Chunk 1: Query Planning

### Task 1: Encode which filters are trustworthy upstream

**Files:**
- Create: `src/lib/naver/query-planner.ts`
- Create: `src/lib/naver/query-planner.test.ts`
- Modify: `src/lib/articles/query.ts`

- [ ] **Step 1: Write the failing planner tests**

```ts
test("price and area filters require deep crawling", () => {
  const plan = createArticleFetchPlan({
    tradeTypes: "B1",
    buildingTypes: "APT",
    depositMin: 0,
    depositMax: 70000,
  });

  assert.equal(plan.maxPages, 15);
  assert.equal(plan.requiresPostFilter, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/lib/naver/query-planner.test.ts`
Expected: FAIL because `createArticleFetchPlan` does not exist yet

- [ ] **Step 3: Implement the minimal planner**

```ts
export interface ArticleFetchPlan {
  maxPages: number;
  requiresPostFilter: boolean;
  stopWhenEnoughFiltered: boolean;
}

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
    maxPages: requiresPostFilter ? 15 : 3,
    requiresPostFilter,
    stopWhenEnoughFiltered: !requiresPostFilter,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/lib/naver/query-planner.test.ts`
Expected: PASS

### Task 2: Replace hardcoded page-depth logic in the route

**Files:**
- Modify: `src/app/api/articles/route.ts`
- Modify: `src/lib/articles/query.test.ts`

- [ ] **Step 1: Write a failing regression test for deep-crawl conditions**
- [ ] **Step 2: Run `node --import tsx --test src/lib/articles/query.test.ts` and confirm failure**
- [ ] **Step 3: Replace `MAX_PAGES` usage with `createArticleFetchPlan(...)`**
- [ ] **Step 4: Re-run `node --import tsx --test src/lib/articles/query.test.ts` and confirm pass**

## Chunk 2: HTTP Robustness

### Task 3: Harden the upstream HTTP client against redirects and malformed bodies

**Files:**
- Modify: `src/lib/naver/client.ts`
- Create: `src/lib/naver/client.test.ts`
- Modify: `src/lib/naver/types.ts`

- [ ] **Step 1: Write failing tests for redirect detection, retryable invalid JSON, and structured upstream errors**

```ts
test("classifies HTML redirect responses as upstream redirect errors", async () => {
  await assert.rejects(
    () => parseArticleListResponse(307, "<html>redirect</html>"),
    /UPSTREAM_REDIRECT/
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/lib/naver/client.test.ts`
Expected: FAIL because parser/error classifier does not exist

- [ ] **Step 3: Implement minimal redirect/error classification**

```ts
export class NaverUpstreamError extends Error {
  constructor(
    readonly code: "UPSTREAM_REDIRECT" | "INVALID_JSON" | "HTTP_ERROR",
    message: string
  ) {
    super(message);
  }
}
```

- [ ] **Step 4: Add bounded retry rules**
Rules:
`307/308`, invalid JSON, timeout -> retry up to 2 times
`4xx` non-redirect -> do not retry

- [ ] **Step 5: Run test to verify it passes**

Run: `node --import tsx --test src/lib/naver/client.test.ts`
Expected: PASS

### Task 4: Capture fetch diagnostics for later comparison

**Files:**
- Create: `src/lib/naver/diagnostics.ts`
- Modify: `src/lib/naver/client.ts`
- Modify: `src/lib/naver/types.ts`

- [ ] **Step 1: Add a typed diagnostics payload**

```ts
export interface NaverFetchDiagnostics {
  requestUrl: string;
  pagesFetched: number;
  upstreamArticleCount: number;
  upstreamStatusCodes: number[];
  retryCount: number;
}
```

- [ ] **Step 2: Return diagnostics alongside raw article bodies from the adapter**
- [ ] **Step 3: Keep route logs structured and single-line**
- [ ] **Step 4: Verify with `pnpm exec tsc --noEmit`**

## Chunk 3: Response Normalization

### Task 5: Centralize downstream filtering and dedupe in one normalizer

**Files:**
- Create: `src/lib/naver/normalize-articles.ts`
- Create: `src/lib/naver/normalize-articles.test.ts`
- Modify: `src/app/api/articles/route.ts`
- Modify: `src/lib/naver/transform.ts`

- [ ] **Step 1: Write failing tests for dedupe, bounds filter, gu filter, and price filter**

```ts
test("filters out out-of-bounds and over-budget articles after transform", () => {
  const result = normalizeArticleResults(rawArticles, {
    bounds,
    requestedGuName: "성동구",
    depositMax: 70000,
  });

  assert.equal(result.articles.length, 35);
  assert.equal(result.stats.afterPriceFilter, 35);
});
```

- [ ] **Step 2: Run `node --import tsx --test src/lib/naver/normalize-articles.test.ts` and confirm failure**
- [ ] **Step 3: Implement the normalizer and move route filtering into it**
- [ ] **Step 4: Re-run the same test command and confirm pass**

### Task 6: Attach stats to the route response in debug mode

**Files:**
- Modify: `src/app/api/articles/route.ts`
- Modify: `src/types/article.ts`

- [ ] **Step 1: Add optional `_debug=1` route support**
- [ ] **Step 2: Include `pagesFetched`, `rawCount`, `dedupedCount`, `afterBoundsCount`, `afterGuCount`, `afterPriceCount`**
- [ ] **Step 3: Keep normal responses unchanged when `_debug` is absent**
- [ ] **Step 4: Verify with `pnpm exec tsc --noEmit`**

## Chunk 4: Tooling and Verification

### Task 7: Add a reproducible comparison script

**Files:**
- Create: `scripts/debug-naver-articles.ts`
- Modify: `package.json`

- [ ] **Step 1: Write a CLI script that accepts `guCode`, `tradeType`, `buildingType`, and price ranges**
- [ ] **Step 2: Have it print page-by-page counts and post-filter counts**
- [ ] **Step 3: Add script entry**

```json
{
  "scripts": {
    "debug:naver-articles": "tsx scripts/debug-naver-articles.ts"
  }
}
```

- [ ] **Step 4: Verify with**

Run: `pnpm debug:naver-articles --guCode=1120000000 --tradeType=JEONSE --buildingType=APT --depositMax=70000`
Expected: prints upstream page counts and filtered totals

### Task 8: Full verification sweep

**Files:**
- Verify: `src/lib/naver/query-planner.test.ts`
- Verify: `src/lib/naver/client.test.ts`
- Verify: `src/lib/naver/normalize-articles.test.ts`
- Verify: `src/lib/articles/query.test.ts`
- Verify: `src/store/filterStore.test.ts`

- [ ] **Step 1: Run targeted tests**

Run: `node --import tsx --test src/lib/naver/query-planner.test.ts src/lib/naver/client.test.ts src/lib/naver/normalize-articles.test.ts src/lib/articles/query.test.ts src/store/filterStore.test.ts`
Expected: PASS

- [ ] **Step 2: Run static verification**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: `✔ No ESLint warnings or errors`

- [ ] **Step 4: Manual regression check**

Run:
`pnpm debug:naver-articles --guCode=1120000000 --tradeType=JEONSE --buildingType=APT --depositMax=70000`
Expected:
- upstream pages beyond page 3 still contain matching listings
- filtered total is materially larger than 5
- route output total aligns with filtered total within duplicate variance
