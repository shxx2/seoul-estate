import { NAVER_ARTICLE_LIST_URL, NAVER_ARTICLE_DETAIL_URL } from "./endpoints";
import { NAVER_REQUEST_DELAY_MS, NAVER_MAX_RETRIES, BUILDING_TYPE_TO_NAVER, TRADE_TYPE_TO_NAVER } from "@/lib/constants";
import type { NaverArticleListResponse } from "./types";
import type { BuildingType, TradeType } from "@/types/article";

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Referer": "https://m.land.naver.com/",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
};

/** 지정 ms 만큼 대기 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 지수 백오프 재시도 fetch */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = NAVER_MAX_RETRIES
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, options);

    // 차단 감지: 30초 대기 후 재시도
    if (res.status === 403 || res.status === 429) {
      if (attempt < retries) {
        await delay(30_000);
        continue;
      }
      return res;
    }

    if (res.ok) return res;

    // 기타 에러: 지수 백오프 (1s, 2s, 4s)
    if (attempt < retries) {
      await delay(1000 * Math.pow(2, attempt));
    } else {
      return res;
    }
  }
  // unreachable but satisfies TS
  throw new Error("fetchWithRetry: unexpected exit");
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
  dprcMin?: number;
  dprcMax?: number;
  wprcMin?: number;
  wprcMax?: number;
}

/** 매물 목록 조회 */
export async function fetchArticleList(
  params: ArticleListParams
): Promise<NaverArticleListResponse> {
  const url = new URL(NAVER_ARTICLE_LIST_URL);
  const p = params as unknown as Record<string, string | number | undefined>;
  for (const [key, value] of Object.entries(p)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetchWithRetry(url.toString(), {
    headers: DEFAULT_HEADERS,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      `fetchArticleList failed: ${res.status} ${res.statusText}`
    );
  }

  const json = await res.json() as NaverArticleListResponse;
  await delay(NAVER_REQUEST_DELAY_MS);
  return json;
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
  const url = new URL(NAVER_ARTICLE_DETAIL_URL);
  url.searchParams.set("articleId", id);
  url.searchParams.set("realEstateType", BUILDING_TYPE_TO_NAVER[buildingType]);
  url.searchParams.set("tradeType", TRADE_TYPE_TO_NAVER[tradeType]);

  const res = await fetchWithRetry(url.toString(), {
    headers: DEFAULT_HEADERS,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      `fetchArticleDetail failed: ${res.status} ${res.statusText}`
    );
  }

  const json = await res.json() as NaverArticleDetailResponse;
  await delay(NAVER_REQUEST_DELAY_MS);
  return json;
}
