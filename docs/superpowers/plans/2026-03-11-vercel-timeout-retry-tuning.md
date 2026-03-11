# Vercel Timeout Retry Tuning Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep deposit-filtered article searches returning the same result set while reducing Vercel upstream timeout failures.

**Architecture:** Preserve the existing 15-page deep crawl, pagination, and filter semantics. Tune the Vercel-only upstream request profile toward shorter per-attempt timeouts with more retry opportunities, and expose enough debug output to verify the behavior against the failing production query.

**Tech Stack:** Next.js App Router, TypeScript, Node test runner, Vercel Node runtime

---

## Chunk 1: Runtime Profile Lock

### Task 1: Capture the intended Vercel retry profile in tests

**Files:**
- Modify: `src/lib/naver/client.test.ts`

- [ ] **Step 1: Write the failing test**

Add expectations for the Vercel runtime profile that match the new short-timeout, multi-retry configuration.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/lib/naver/client.test.ts`
Expected: FAIL because the current runtime config still uses the older timeout profile.

- [ ] **Step 3: Write minimal implementation**

Update `src/lib/naver/client.ts` so the Vercel runtime config uses the new timeout and retry values without affecting local development defaults.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/lib/naver/client.test.ts`
Expected: PASS

## Chunk 2: Production Diagnostics

### Task 2: Keep timeout failures observable in debug mode

**Files:**
- Modify: `src/app/api/articles/route.ts`

- [ ] **Step 1: Preserve the existing `_debug=1` error surface**

Keep the upstream timeout code and message visible in the API response so the failing production URL remains directly testable after the change.

- [ ] **Step 2: Verify targeted tests**

Run: `node --import tsx --test src/lib/naver/client.test.ts src/lib/naver/query-planner.test.ts src/lib/articles/query.test.ts`
Expected: PASS

## Chunk 3: Verification

### Task 3: Verify buildability and production behavior

**Files:**
- Modify: `src/lib/naver/client.ts`
- Modify: `src/lib/naver/client.test.ts`

- [ ] **Step 1: Run lint**

Run: `pnpm lint`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 3: Recheck the failing production URL**

Run the known failing production `api/articles` URL with `_debug=1` and compare the error timing and upstream code against the current 30s timeout behavior.

- [ ] **Step 4: Commit**

```bash
git add src/lib/naver/client.ts src/lib/naver/client.test.ts docs/superpowers/plans/2026-03-11-vercel-timeout-retry-tuning.md
git commit -m "fix: retune vercel naver retries"
```
