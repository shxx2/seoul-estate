import pLimit from "p-limit";
import { NAVER_ARTICLE_LIST_URL, NAVER_ARTICLE_DETAIL_URL } from "./endpoints";
import { BUILDING_TYPE_TO_NAVER, TRADE_TYPE_TO_NAVER } from "@/lib/constants";
import type { NaverArticleListResponse } from "./types";
import type { BuildingType, TradeType } from "@/types/article";
import { naverCache } from "./cache";
import type { NaverFetchDiagnostics } from "./diagnostics";
import { requestUpstreamText } from "./upstream-request";

/** User-Agent 풀 (20개 이상의 다양한 브라우저) */
const USER_AGENT_POOL = [
  // Windows Desktop - Chrome (2026년 3월 최신)
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",

  // Windows Desktop - Firefox
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0",

  // Windows Desktop - Edge
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 Edg/134.0.0.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 Edg/132.0.0.0",

  // macOS Desktop - Chrome
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",

  // macOS Desktop - Safari
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Safari/605.1.15",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Safari/605.1.15",

  // macOS Desktop - Firefox
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:136.0) Gecko/20100101 Firefox/136.0",

  // Linux Desktop - Chrome
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",

  // Linux Desktop - Firefox
  "Mozilla/5.0 (X11; Linux x86_64; rv:136.0) Gecko/20100101 Firefox/136.0",

  // iOS Mobile - Safari (iOS 18.3-18.4)
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_4_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPad; CPU OS 18_4_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1",

  // iOS Mobile - Chrome
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_4_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/134.0.6934.87 Mobile/15E148 Safari/604.1",

  // Android Mobile - Chrome
  "Mozilla/5.0 (Linux; Android 15; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6847.143 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 14; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36",

  // Android Mobile - Samsung Internet
  "Mozilla/5.0 (Linux; Android 15; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36",
];

/** 랜덤 User-Agent 선택 */
function getRandomUserAgent(): string {
  return USER_AGENT_POOL[Math.floor(Math.random() * USER_AGENT_POOL.length)];
}

export interface NaverRequestRuntimeConfig {
  requestTimeoutMs: number;
  maxRetries: number;
  delayMinMs: number;
  delayMaxMs: number;
  maxConcurrentRequests: number;
}

export function resolveNaverRequestRuntimeConfig(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): NaverRequestRuntimeConfig {
  const isVercel = env.VERCEL === "1" || env.VERCEL === "true";

  if (isVercel) {
    // Hobby 플랜 10초 제한에 맞춤
    return {
      requestTimeoutMs: 3000,   // 3초 (빠르게 포기하고 재시도)
      maxRetries: 1,            // 1회만 재시도 (총 2번 시도)
      delayMinMs: 0,
      delayMaxMs: 0,
      maxConcurrentRequests: 2, // 동시 2개 (안정성 확보)
    };
  }

  return {
    requestTimeoutMs: 8000,
    maxRetries: 2,
    delayMinMs: 300,
    delayMaxMs: 800,
    maxConcurrentRequests: 1,
  };
}

/** 동적 헤더 생성 (요청마다 User-Agent 로테이션) */
function getHeaders(): Record<string, string> {
  return {
    "User-Agent": getRandomUserAgent(),
    "Referer": "https://m.land.naver.com/",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
  };
}

/** 랜덤 딜레이 (봇 탐지 회피) */
async function randomDelay(minMs = 300, maxMs = 800): Promise<void> {
  if (maxMs <= 0) {
    return;
  }
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

const requestLimiters = new Map<number, ReturnType<typeof pLimit>>();

function getRequestLimiter(maxConcurrentRequests: number) {
  const safeConcurrency = Math.max(1, Math.floor(maxConcurrentRequests));
  const existing = requestLimiters.get(safeConcurrency);

  if (existing) {
    return existing;
  }

  const limiter = pLimit(safeConcurrency);
  requestLimiters.set(safeConcurrency, limiter);
  return limiter;
}

async function withConcurrencyLimit<T>(fn: () => Promise<T>): Promise<T> {
  const { maxConcurrentRequests } = resolveNaverRequestRuntimeConfig();
  return getRequestLimiter(maxConcurrentRequests)(fn);
}

export interface ArticleListParams {
  rletTpCd: string;  // 부동산유형 코드 (콜론 구분, e.g. "APT:VL:OPST")
  tradTpCd: string;  // 거래유형 코드 (콜론 구분, e.g. "A1:B1")
  z: number;         // 줌 레벨
  lat: number;       // 중심 위도
  lon: number;       // 중심 경도
  btm: number;       // 하단 위도
  lft: number;       // 좌측 경도
  top: number;       // 상단 위도
  rgt: number;       // 우측 경도
  page?: number;
  spcMin?: number;
  spcMax?: number;
  prcMin?: number;   // 매매가 최소 (만원)
  prcMax?: number;   // 매매가 최대 (만원)
  dprcMin?: number;  // 보증금 최소 (만원)
  dprcMax?: number;  // 보증금 최대 (만원)
  wprcMin?: number;  // 월세 최소 (만원)
  wprcMax?: number;  // 월세 최대 (만원)
}

interface FetchArticleListOptions {
  forceRefresh?: boolean;
  maxRetries?: number;
}

export type NaverUpstreamErrorCode =
  | "UPSTREAM_REDIRECT"
  | "INVALID_JSON"
  | "HTTP_ERROR"
  | "TIMEOUT"
  | "NETWORK_ERROR";

export class NaverUpstreamError extends Error {
  code: NaverUpstreamErrorCode;
  status?: number;
  bodyPreview?: string;

  constructor(
    code: NaverUpstreamErrorCode,
    message: string,
    status?: number,
    bodyPreview?: string
  ) {
    super(message);
    this.name = "NaverUpstreamError";
    this.code = code;
    this.status = status;
    this.bodyPreview = bodyPreview;
  }
}

export interface FetchArticleListResult {
  response: NaverArticleListResponse;
  diagnostics: NaverFetchDiagnostics;
}

function buildArticleListRequestUrl(params: ArticleListParams): string {
  const url = new URL(NAVER_ARTICLE_LIST_URL);
  const p = params as unknown as Record<string, string | number | undefined>;
  for (const [key, value] of Object.entries(p)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export function parseNaverArticleListResponse(
  status: number,
  bodyText: string
): NaverArticleListResponse {
  const preview = bodyText.slice(0, 300);
  const trimmed = bodyText.trimStart().toLowerCase();

  if (
    status === 307 ||
    status === 308 ||
    trimmed.startsWith("<!doctype html") ||
    trimmed.startsWith("<html")
  ) {
    throw new NaverUpstreamError(
      "UPSTREAM_REDIRECT",
      `fetchArticleList redirected with status ${status}`,
      status,
      preview
    );
  }

  if (status >= 400) {
    throw new NaverUpstreamError(
      "HTTP_ERROR",
      `fetchArticleList failed: ${status}`,
      status,
      preview
    );
  }

  try {
    const parsed = JSON.parse(bodyText) as NaverArticleListResponse;
    if (!Array.isArray(parsed.body)) {
      throw new Error("missing body array");
    }
    return parsed;
  } catch (error) {
    throw new NaverUpstreamError(
      "INVALID_JSON",
      error instanceof Error ? error.message : "invalid json",
      status,
      preview
    );
  }
}

export function shouldRetryNaverError(error: unknown): boolean {
  if (!(error instanceof NaverUpstreamError)) {
    return false;
  }

  if (
    error.code === "UPSTREAM_REDIRECT" ||
    error.code === "INVALID_JSON" ||
    error.code === "TIMEOUT" ||
    error.code === "NETWORK_ERROR"
  ) {
    return true;
  }

  return error.code === "HTTP_ERROR" && (error.status ?? 0) >= 500;
}

/** 매물 목록 조회 */
export async function fetchArticleList(
  params: ArticleListParams,
  options: FetchArticleListOptions = {}
): Promise<FetchArticleListResult> {
  return withConcurrencyLimit(async () => {
    const runtimeConfig = resolveNaverRequestRuntimeConfig();
    const cacheKey = naverCache.generateKey(params);
    const requestUrl = buildArticleListRequestUrl(params);

    if (!options.forceRefresh) {
      const cached = naverCache.get<NaverArticleListResponse>(cacheKey);
      if (cached) {
        console.log('[NaverAPI] Cache hit, returning cached data');
        return {
          response: cached,
          diagnostics: {
            requestUrl,
            pagesFetched: 1,
            upstreamArticleCount: cached.body?.length ?? 0,
            upstreamStatusCodes: [],
            retryCount: 0,
          },
        };
      }
    } else {
      console.log('[NaverAPI] Force refresh requested, bypassing cache');
    }

    console.log('[NaverAPI] Cache miss, fetching:', requestUrl);

    const maxRetries = options.maxRetries ?? runtimeConfig.maxRetries;
    const upstreamStatusCodes: number[] = [];
    let retryCount = 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await randomDelay(runtimeConfig.delayMinMs, runtimeConfig.delayMaxMs);

        const response = await requestUpstreamText(requestUrl, {
          headers: getHeaders(),
          timeoutMs: runtimeConfig.requestTimeoutMs,
        });

        upstreamStatusCodes.push(response.status);
        console.log('[NaverAPI] fetchArticleList response status:', response.status, response.statusText);

        const json = parseNaverArticleListResponse(response.status, response.text);

        const bodyCount = json.body?.length ?? 0;
        console.log('[NaverAPI] fetchArticleList parsed article count:', bodyCount);

        naverCache.set(cacheKey, json);
        console.log(`[NaverAPI] Response cached (${bodyCount} items) for 5 minutes`);

        return {
          response: json,
          diagnostics: {
            requestUrl,
            pagesFetched: 1,
            upstreamArticleCount: bodyCount,
            upstreamStatusCodes,
            retryCount,
          },
        };
      } catch (error) {
        const naverError =
          error instanceof NaverUpstreamError
            ? error
            : new NaverUpstreamError(
                error instanceof Error && error.message.includes("timeout")
                  ? "TIMEOUT"
                  : "NETWORK_ERROR",
                error instanceof Error ? error.message : "unknown network error"
              );

        if (attempt === maxRetries || !shouldRetryNaverError(naverError)) {
          console.error(
            '[NaverAPI] fetchArticleList failed:',
            naverError.code,
            naverError.status ?? '',
            naverError.bodyPreview ?? naverError.message
          );
          throw naverError;
        }

        retryCount += 1;
        console.warn(
          `[NaverAPI] Retrying articleList (${retryCount}/${maxRetries}) due to ${naverError.code}`
        );
      }
    }

    throw new NaverUpstreamError("NETWORK_ERROR", "unreachable retry state");
  });
}

export interface NaverArticleDetailResponse {
  articleDetail: {
    articleNo: string;
    articleName: string;
    address: string;
    roadAddress?: string;
    latitude?: number;
    longitude?: number;
    totalFloor?: number;
    buildYear?: string;
    roomCount?: number;
    bathroomCount?: number;
    description?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/** 매물 상세 조회 */
export async function fetchArticleDetail(
  id: string,
  buildingType: BuildingType,
  tradeType: TradeType
): Promise<NaverArticleDetailResponse> {
  return withConcurrencyLimit(async () => {
    const runtimeConfig = resolveNaverRequestRuntimeConfig();
    const url = new URL(NAVER_ARTICLE_DETAIL_URL);
    url.searchParams.set("articleId", id);
    url.searchParams.set("realEstateType", BUILDING_TYPE_TO_NAVER[buildingType]);
    url.searchParams.set("tradeType", TRADE_TYPE_TO_NAVER[tradeType]);

    await randomDelay(runtimeConfig.delayMinMs, runtimeConfig.delayMaxMs);

    const response = await requestUpstreamText(url.toString(), {
      headers: getHeaders(),
      timeoutMs: runtimeConfig.requestTimeoutMs,
    });

    if (response.status >= 400) {
      throw new Error(
        `fetchArticleDetail failed: ${response.status} ${response.statusText}`
      );
    }

    const json = JSON.parse(response.text) as NaverArticleDetailResponse;
    return json;
  });
}
