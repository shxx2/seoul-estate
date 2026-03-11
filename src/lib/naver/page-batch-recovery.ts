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

  for (let index = 0; index < options.pages.length; index += 1) {
    const page = options.pages[index];
    const entry = settled[index];

    if (entry.status === "fulfilled") {
      results.push({
        page,
        value: entry.value,
      });
      continue;
    }

    const recovered = await options.fetchPage(page);
    results.push({
      page,
      value: recovered,
    });
    recoveredPages.push(page);
  }

  return {
    results,
    recoveredPages,
  };
}
