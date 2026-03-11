# Article Sort And Page Cache Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 매물 리스트 기본 정렬을 낮은 금액 순으로 복원하고, 최초 검색 직후 페이지별 결과를 1분간 클라이언트 메모리에 캐시해 페이지 전환 지연을 줄인다.

**Architecture:** 정렬 기본값은 필터 기본 상태와 API 기본 파라미터를 함께 `price_asc`로 되돌린다. 페이지 전환 성능은 `useArticles` 바깥에 작은 메모리 캐시 helper를 두고, 1페이지 응답 이후 남은 페이지들을 백그라운드 프리패치해 같은 검색 세션에서 즉시 재사용한다.

**Tech Stack:** Next.js App Router, TypeScript, SWR, node:test

---

## Chunk 1: Sort Default

### Task 1: Restore the default sort order to lowest price first

**Files:**
- Modify: `src/types/filter.ts`
- Modify: `src/app/api/articles/route.ts`
- Modify: `src/store/filterStore.test.ts`

- [ ] **Step 1: Update the failing store test to expect `price_asc`**
- [ ] **Step 2: Run `node --import tsx --test src/store/filterStore.test.ts` and confirm failure**
- [ ] **Step 3: Change the filter default and API route fallback to `price_asc`**
- [ ] **Step 4: Re-run `node --import tsx --test src/store/filterStore.test.ts` and confirm pass**

## Chunk 2: Client Page Cache

### Task 2: Add a one-minute in-memory cache for article pages

**Files:**
- Create: `src/hooks/articles-page-cache.ts`
- Create: `src/hooks/articles-page-cache.test.ts`
- Modify: `src/hooks/useArticles.ts`

- [ ] **Step 1: Write failing tests for page cache TTL and background prefetch key generation**
- [ ] **Step 2: Run `node --import tsx --test src/hooks/articles-page-cache.test.ts` and confirm failure**
- [ ] **Step 3: Implement a 60-second page cache helper plus prefetch key builder**
- [ ] **Step 4: Update `useArticles` to read cached pages before fetch and prefetch remaining pages after page 1 resolves**
- [ ] **Step 5: Re-run `node --import tsx --test src/hooks/articles-page-cache.test.ts` and confirm pass**

## Chunk 3: Verification

### Task 3: Verify no regressions

**Files:**
- Verify: `src/store/filterStore.test.ts`
- Verify: `src/hooks/articles-page-cache.test.ts`
- Verify: `src/components/search/region-search-submit.test.ts`
- Verify: `src/hooks/region-polygon.test.ts`

- [ ] **Step 1: Run `node --import tsx --test src/store/filterStore.test.ts src/hooks/articles-page-cache.test.ts src/components/search/region-search-submit.test.ts src/hooks/region-polygon.test.ts src/lib/articles/query.test.ts src/lib/naver/client.test.ts src/lib/naver/normalize-articles.test.ts src/lib/naver/query-planner.test.ts src/lib/naver/transform.test.ts`**
- [ ] **Step 2: Run `pnpm lint`**
- [ ] **Step 3: Review the final diff for unintended behavior changes**
