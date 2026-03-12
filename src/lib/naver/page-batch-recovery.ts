export interface PageBatchRecoveryOptions<T> {
  pages: number[];
  fetchPage: (page: number) => Promise<T>;
}

export interface PageBatchRecoveryResult<T> {
  results: Array<{ page: number; value: T }>;
  recoveredPages: number[];
}

export async function fetchPageBatchWithRecovery<T>(
  options: PageBatchRecoveryOptions<T>
): Promise<PageBatchRecoveryResult<T>> {
  const settled = await Promise.allSettled(
    options.pages.map((page) => options.fetchPage(page))
  );

  const results: Array<{ page: number; value: T }> = [];
  const recoveredPages: number[] = [];
  const failedPages: number[] = [];

  for (let index = 0; index < options.pages.length; index += 1) {
    const page = options.pages[index];
    const entry = settled[index];

    if (entry.status === "fulfilled") {
      results.push({
        page,
        value: entry.value,
      });
    } else {
      // Vercel Hobby 10초 제한: recovery 재시도 제거, 실패 페이지는 스킵
      failedPages.push(page);
      console.warn(`[PageBatch] Page ${page} failed, skipping (no recovery for Hobby plan)`);
    }
  }

  if (failedPages.length > 0) {
    console.warn(`[PageBatch] Skipped ${failedPages.length} pages: ${failedPages.join(", ")}`);
  }

  return {
    results,
    recoveredPages,
  };
}
