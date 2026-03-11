# Explicit Search Only Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 필터를 바꾸는 동안에는 매물 API를 호출하지 않고, 지역 선택 또는 검색 버튼 클릭 때만 실제 검색을 수행한다.

**Architecture:** 필터 스토어의 현재 편집값(draft)과 실제 조회에 사용 중인 값(applied)을 분리한다. `useArticles`는 applied 상태만 보고, 검색 버튼과 지역 선택은 draft를 applied로 커밋하면서 fresh fetch를 발생시킨다.

**Tech Stack:** Next.js App Router, Zustand, SWR, TypeScript, Node test runner (`node --import tsx --test`)

---

## Chunk 1: Store Separation

### Task 1: Lock down draft/applied behavior with tests

**Files:**
- Modify: `src/store/filterStore.test.ts`
- Modify: `src/types/filter.ts`
- Modify: `src/store/filterStore.ts`

- [ ] **Step 1: Write failing tests for explicit search submission behavior**
- [ ] **Step 2: Run `node --import tsx --test src/store/filterStore.test.ts` and confirm failure**
- [ ] **Step 3: Add applied filter snapshot state and submission actions**
- [ ] **Step 4: Re-run the store tests and confirm pass**

## Chunk 2: Hook and UI Wiring

### Task 2: Only build article requests from applied filters

**Files:**
- Modify: `src/hooks/useArticles.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/components/search/RegionSearch.tsx`

- [ ] **Step 1: Update `useArticles` to accept applied filters only**
- [ ] **Step 2: Make pagination update applied page state without a fresh search**
- [ ] **Step 3: Make region selection auto-submit and avoid duplicate enter-key searches**

## Chunk 3: Verification

### Task 3: Verify no regressions

**Files:**
- Verify: `src/store/filterStore.test.ts`
- Verify: `src/lib/articles/query.test.ts`

- [ ] **Step 1: Run `node --import tsx --test src/store/filterStore.test.ts src/lib/articles/query.test.ts`**
- [ ] **Step 2: Run `pnpm exec tsc --noEmit`**
- [ ] **Step 3: Run `pnpm lint`**
