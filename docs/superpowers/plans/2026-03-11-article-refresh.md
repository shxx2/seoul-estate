# Article Refresh Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 명시적 검색 시 네이버 매물 목록을 캐시 없이 다시 조회하고, 기본 최신순 정렬이 네이버 원래 목록 순서를 최대한 보존하도록 만든다.

**Architecture:** 매물 목록 라우트의 정렬/페이지네이션/캐시 우회 판단을 순수 함수로 분리해 테스트 가능하게 만든다. 클라이언트는 `manual refresh` 토큰을 별도로 보내고, 서버는 첫 페이지의 명시적 검색에만 서버/네이버 캐시를 우회한다.

**Tech Stack:** Next.js App Router, TypeScript, SWR, Node test runner (`node --import tsx --test`)

---

## Chunk 1: Route Helpers

### Task 1: Add failing regression tests

**Files:**
- Create: `src/lib/articles/query.test.ts`
- Create: `src/lib/articles/query.ts`

- [ ] **Step 1: Write failing tests for cache-bypass and recent sort**
- [ ] **Step 2: Run `node --import tsx --test src/lib/articles/query.test.ts` and confirm failure**
- [ ] **Step 3: Implement helper functions with minimal logic**
- [ ] **Step 4: Re-run the same test command and confirm pass**

### Task 2: Rewire article route to use helpers

**Files:**
- Modify: `src/app/api/articles/route.ts`
- Modify: `src/lib/naver/client.ts`

- [ ] **Step 1: Parse manual refresh query param in the route**
- [ ] **Step 2: Skip server cache only for explicit first-page refreshes**
- [ ] **Step 3: Reuse one server cache entry across pages**
- [ ] **Step 4: Pass `forceRefresh` into Naver article fetches**

## Chunk 2: Client Search Flow

### Task 3: Split fetch trigger from refresh intent

**Files:**
- Modify: `src/types/filter.ts`
- Modify: `src/store/filterStore.ts`
- Modify: `src/hooks/useArticles.ts`
- Modify: `src/components/search/RegionSearch.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add refresh trigger state to the filter store**
- [ ] **Step 2: Send `_refresh` only for manual searches**
- [ ] **Step 3: Stop bumping the search trigger during pagination**
- [ ] **Step 4: Keep existing retry flow intact**

## Chunk 3: Verification

### Task 4: Verify behavior

**Files:**
- Verify: `src/lib/articles/query.test.ts`
- Verify: `src/app/api/articles/route.ts`
- Verify: `src/hooks/useArticles.ts`

- [ ] **Step 1: Run `node --import tsx --test src/lib/articles/query.test.ts`**
- [ ] **Step 2: Run `pnpm lint`**
- [ ] **Step 3: Review diffs for unintended changes before reporting results**
