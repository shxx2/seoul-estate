export interface NaverFetchDiagnostics {
  requestUrl: string;
  pagesFetched: number;
  upstreamArticleCount: number;
  upstreamStatusCodes: number[];
  retryCount: number;
}

export function mergeNaverFetchDiagnostics(
  diagnostics: NaverFetchDiagnostics[]
): NaverFetchDiagnostics {
  if (diagnostics.length === 0) {
    return {
      requestUrl: "",
      pagesFetched: 0,
      upstreamArticleCount: 0,
      upstreamStatusCodes: [],
      retryCount: 0,
    };
  }

  return {
    requestUrl: diagnostics[0]?.requestUrl ?? "",
    pagesFetched: diagnostics.reduce((sum, item) => sum + item.pagesFetched, 0),
    upstreamArticleCount: diagnostics.reduce(
      (sum, item) => sum + item.upstreamArticleCount,
      0
    ),
    upstreamStatusCodes: diagnostics.flatMap((item) => item.upstreamStatusCodes),
    retryCount: diagnostics.reduce((sum, item) => sum + item.retryCount, 0),
  };
}
