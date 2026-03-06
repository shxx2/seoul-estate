import { NAVER_ARTICLE_LIST_URL, NAVER_ARTICLE_DETAIL_URL } from "./endpoints";
import { BUILDING_TYPE_TO_NAVER, TRADE_TYPE_TO_NAVER } from "@/lib/constants";
import type { NaverArticleListResponse } from "./types";
import type { BuildingType, TradeType } from "@/types/article";

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Referer": "https://m.land.naver.com/",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
};

/** 타임아웃이 있는 fetch (Edge Runtime 호환) */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 8000 // Edge 함수 타임아웃(30초) 내에 응답받도록 8초로 설정
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
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

  const res = await fetchWithTimeout(url.toString(), {
    headers: DEFAULT_HEADERS,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      `fetchArticleList failed: ${res.status} ${res.statusText}`
    );
  }

  const json = await res.json() as NaverArticleListResponse;
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

  const res = await fetchWithTimeout(url.toString(), {
    headers: DEFAULT_HEADERS,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      `fetchArticleDetail failed: ${res.status} ${res.statusText}`
    );
  }

  const json = await res.json() as NaverArticleDetailResponse;
  return json;
}
