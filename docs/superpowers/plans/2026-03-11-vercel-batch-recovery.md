# Vercel Batch Recovery Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve exact article results while preventing one timed-out page in a concurrent batch from failing the entire production query immediately.

**Architecture:** Keep concurrent batch fetching for throughput, but recover from per-page batch failures by retrying only the failed pages serially before giving up. This preserves the current 15-page deep crawl semantics and limits the change to the page-batch orchestration layer.

**Tech Stack:** Next.js App Router, TypeScript, Node test runner, Vercel Node runtime

---

## Chunk 1: Batch Recovery Helper

### Task 1: Add a tested helper that retries failed pages serially

**Files:**
- Create: `src/lib/naver/page-batch-recovery.ts`
- Create: `src/lib/naver/page-batch-recovery.test.ts`

- [ ] **Step 1: Write the failing test**

Cover:
- all pages succeed in the initial batch
- one page fails in the batch but succeeds on serial retry
- a page that still fails after serial retry bubbles the error

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/lib/naver/page-batch-recovery.test.ts`
Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Write minimal implementation**

Implement ordered batch execution using `Promise.allSettled`, followed by serial recovery of failed pages.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/lib/naver/page-batch-recovery.test.ts`
Expected: PASS

## Chunk 2: Route Integration

### Task 2: Use batch recovery in `/api/articles`

**Files:**
- Modify: `src/app/api/articles/route.ts`

- [ ] **Step 1: Replace direct `Promise.all` page batches**

Use the helper so failed pages are retried serially before the route aborts.

- [ ] **Step 2: Keep diagnostics explicit**

Log recovered page numbers so production verification can confirm whether batch contention was the cause.

- [ ] **Step 3: Verify targeted tests**

Run: `node --import tsx --test src/lib/naver/page-batch-recovery.test.ts src/lib/naver/client.test.ts src/lib/naver/query-planner.test.ts src/lib/articles/query.test.ts`
Expected: PASS

## Chunk 3: Verification

### Task 3: Build and production verification

**Files:**
- Modify: `src/app/api/articles/route.ts`

- [ ] **Step 1: Run lint**

Run: `pnpm lint`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 3: Push and re-test the failing production URL**

Confirm whether the known deposit-filtered production query stops returning `TIMEOUT`.
