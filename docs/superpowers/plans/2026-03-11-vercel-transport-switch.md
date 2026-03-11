# Vercel Transport Switch Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the existing article-query semantics while replacing the Naver upstream HTTP transport that is timing out in Vercel production.

**Architecture:** Isolate the low-level Naver HTTP transport into a focused Node-only helper that uses `https.request` with explicit timeouts, headers, and redirect handling. Reuse that helper from the existing article-list and article-detail code so query planning, caching, pagination, and normalization stay unchanged.

**Tech Stack:** Next.js App Router, TypeScript, Node `https`, Node test runner, Vercel Node runtime

---

## Chunk 1: Transport Helper

### Task 1: Add a tested Node transport helper for upstream text responses

**Files:**
- Create: `src/lib/naver/upstream-request.ts`
- Create: `src/lib/naver/upstream-request.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests that prove the helper:
- returns status and text from a local HTTP server
- throws a timeout error when the server delays beyond the configured timeout

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/lib/naver/upstream-request.test.ts`
Expected: FAIL because the helper does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement a Node `https`/`http` transport helper with explicit timeout cleanup and body collection.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/lib/naver/upstream-request.test.ts`
Expected: PASS

## Chunk 2: Naver Client Integration

### Task 2: Switch article-list and article-detail upstream calls to the helper

**Files:**
- Modify: `src/lib/naver/client.ts`
- Modify: `src/lib/naver/client.test.ts`

- [ ] **Step 1: Keep runtime config tests green**

Preserve the current timeout/retry expectations while switching the underlying transport.

- [ ] **Step 2: Replace direct `fetchWithTimeout` usage**

Use the new helper for:
- article list text responses
- article detail JSON responses

- [ ] **Step 3: Verify targeted tests**

Run: `node --import tsx --test src/lib/naver/upstream-request.test.ts src/lib/naver/client.test.ts src/lib/naver/query-planner.test.ts src/lib/articles/query.test.ts`
Expected: PASS

## Chunk 3: Verification

### Task 3: Build and production verification

**Files:**
- Modify: `src/lib/naver/upstream-request.ts`
- Modify: `src/lib/naver/client.ts`

- [ ] **Step 1: Run lint**

Run: `pnpm lint`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 3: Push and re-test the failing production URL**

Verify whether the known deposit-filtered production query still returns `TIMEOUT`.
