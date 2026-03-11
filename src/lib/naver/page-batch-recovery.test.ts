import test from "node:test";
import assert from "node:assert/strict";

import { fetchPageBatchWithRecovery } from "./page-batch-recovery";

test("returns ordered batch results when every page succeeds", async () => {
  const result = await fetchPageBatchWithRecovery({
    pages: [1, 2, 3],
    fetchPage: async (page) => `page-${page}`,
  });

  assert.deepEqual(result.results, [
    { page: 1, value: "page-1" },
    { page: 2, value: "page-2" },
    { page: 3, value: "page-3" },
  ]);
  assert.deepEqual(result.recoveredPages, []);
});

test("retries only failed pages serially and preserves result order", async () => {
  const attempts = new Map<number, number>();

  const result = await fetchPageBatchWithRecovery({
    pages: [1, 2, 3],
    fetchPage: async (page) => {
      const nextAttempt = (attempts.get(page) ?? 0) + 1;
      attempts.set(page, nextAttempt);

      if (page === 2 && nextAttempt === 1) {
        throw new Error("timeout");
      }

      return `page-${page}-attempt-${nextAttempt}`;
    },
  });

  assert.deepEqual(result.results, [
    { page: 1, value: "page-1-attempt-1" },
    { page: 2, value: "page-2-attempt-2" },
    { page: 3, value: "page-3-attempt-1" },
  ]);
  assert.deepEqual(result.recoveredPages, [2]);
});

test("rethrows the page error when serial recovery still fails", async () => {
  await assert.rejects(
    () =>
      fetchPageBatchWithRecovery({
        pages: [1, 2],
        fetchPage: async (page) => {
          if (page === 2) {
            throw new Error("still failing");
          }
          return `page-${page}`;
        },
      }),
    /still failing/
  );
});
