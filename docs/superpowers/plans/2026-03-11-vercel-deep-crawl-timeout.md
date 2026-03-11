# Vercel Deep Crawl Timeout Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep deposit-filtered article searches returning the same result set while reducing Vercel wall-clock time enough to avoid production timeouts.

**Architecture:** Preserve the existing filter semantics and pagination, but replace sequential deep-crawl page fetching with bounded concurrency under the Vercel runtime profile. Keep local development conservative, and isolate the production optimization to runtime config plus the `/api/articles` fetch loop.

**Tech Stack:** Next.js App Router, Zustand, TypeScript, Node test runner, Vercel Node runtime

---

## Chunk 1: Runtime Concurrency Design

### Task 1: Lock the Vercel runtime profile in tests

**Files:**
- Modify: `src/lib/naver/client.test.ts`

- [ ] **Step 1: Write the failing test**

Add expectations that the runtime config includes `maxConcurrentRequests`, with `1` locally and `2` on Vercel.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/lib/naver/client.test.ts`
Expected: FAIL because `resolveNaverRequestRuntimeConfig()` does not yet expose `maxConcurrentRequests`.

- [ ] **Step 3: Write minimal implementation**

Extend the runtime config type and implementation in `src/lib/naver/client.ts` to include the new concurrency field.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/lib/naver/client.test.ts`
Expected: PASS

## Chunk 2: Deep Crawl Execution

### Task 2: Fetch deep-crawl pages with bounded concurrency

**Files:**
- Modify: `src/app/api/articles/route.ts`
- Modify: `src/lib/naver/client.ts`
- Test: `src/lib/naver/client.test.ts`
- Test: `src/lib/naver/query-planner.test.ts`
- Test: `src/lib/articles/query.test.ts`

- [ ] **Step 1: Implement bounded concurrent page fetching**

Update `/api/articles` so that deep-crawl queries can dispatch multiple page fetches concurrently, while still:
- respecting the runtime concurrency cap
- preserving all fetched results
- preserving sorting, total count, and pagination
- keeping shallow queries simple

- [ ] **Step 2: Keep client-side throttling explicit**

Expose the runtime concurrency choice from `src/lib/naver/client.ts` so the route can use the same Vercel vs local profile.

- [ ] **Step 3: Verify targeted tests**

Run: `node --import tsx --test src/lib/naver/client.test.ts src/lib/naver/query-planner.test.ts src/lib/articles/query.test.ts`
Expected: PASS

## Chunk 3: Verification

### Task 3: Verify buildability and production behavior

**Files:**
- Modify: `src/app/api/articles/route.ts`
- Modify: `src/lib/naver/client.ts`

- [ ] **Step 1: Run lint**

Run: `pnpm lint`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 3: Recheck the production URL**

Run the known failing production `api/articles` URL and compare wall-clock time against the previous ~62s timeout behavior.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/articles/route.ts src/lib/naver/client.ts src/lib/naver/client.test.ts docs/superpowers/plans/2026-03-11-vercel-deep-crawl-timeout.md
git commit -m "fix: parallelize deep article fetches on vercel"
```
