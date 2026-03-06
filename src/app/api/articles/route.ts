import { NextRequest } from 'next/server';
import { z } from 'zod';
import { cortarNoToBounds } from '@/lib/region-lookup';
import { getCached, setCache, buildCacheKey } from '@/lib/cache/server-cache';
import { fetchArticleList } from '@/lib/naver/client';
import { transformNaverArticle } from '@/lib/naver/transform';
import { apiSuccess, apiError } from '@/lib/api-response';
import { TRADE_TYPE_TO_NAVER, BUILDING_TYPE_TO_NAVER } from '@/lib/constants';
import type { Article, TradeType, BuildingType } from '@/types/article';

// 프론트엔드 필터 형식을 받는 스키마
const querySchema = z.object({
  // 지역: guCode 또는 dongCode (cortarNo로 사용)
  guCode: z.string().optional(),
  dongCode: z.string().optional(),
  cortarNo: z.string().optional(), // 직접 cortarNo도 허용

  // 거래 유형 (배열 또는 단일)
  tradeTypes: z.union([z.string(), z.array(z.string())]).optional(),
  primaryTradeType: z.string().optional(),

  // 건물 유형 (배열 또는 단일)
  buildingTypes: z.union([z.string(), z.array(z.string())]).optional(),

  // 가격 범위
  dealPriceMin: z.coerce.number().optional(),
  dealPriceMax: z.coerce.number().optional(),
  depositMin: z.coerce.number().optional(),
  depositMax: z.coerce.number().optional(),
  monthlyRentMin: z.coerce.number().optional(),
  monthlyRentMax: z.coerce.number().optional(),

  // 면적 범위
  areaMin: z.coerce.number().optional(),
  areaMax: z.coerce.number().optional(),

  // 정렬 및 페이징
  sortBy: z.string().default('recent'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(20),
});

// 프론트 TradeType을 네이버 코드로 변환
function convertTradeTypes(types: string | string[] | undefined): string {
  if (!types) return 'A1:B1:B2'; // 기본값: 매매, 전세, 월세

  const arr = Array.isArray(types) ? types : [types];
  const codes = arr
    .map((t) => TRADE_TYPE_TO_NAVER[t as TradeType])
    .filter(Boolean);

  return codes.length > 0 ? codes.join(':') : 'A1:B1:B2';
}

// 프론트 BuildingType을 네이버 코드로 변환
function convertBuildingTypes(types: string | string[] | undefined): string {
  if (!types) return 'APT:VL:OPST'; // 기본값: 아파트, 빌라, 오피스텔

  const arr = Array.isArray(types) ? types : [types];
  const codes = arr
    .map((b) => BUILDING_TYPE_TO_NAVER[b as BuildingType])
    .filter(Boolean);

  return codes.length > 0 ? codes.join(':') : 'APT:VL:OPST';
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  // URLSearchParams에서 배열 파라미터 처리
  const raw: Record<string, string | string[]> = {};
  searchParams.forEach((value, key) => {
    if (key === 'tradeTypes' || key === 'buildingTypes') {
      const existing = raw[key];
      if (Array.isArray(existing)) {
        existing.push(value);
      } else if (existing) {
        raw[key] = [existing, value];
      } else {
        raw[key] = value;
      }
    } else {
      raw[key] = value;
    }
  });

  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) {
    return apiError('INVALID_PARAMS', parsed.error.issues[0]?.message ?? 'Invalid query parameters', 400);
  }

  const params = parsed.data;

  // cortarNo 결정: dongCode > guCode > cortarNo
  const cortarNo = params.dongCode || params.guCode || params.cortarNo;

  if (!cortarNo) {
    // cortarNo가 없으면 서울 전체 (강남구 기본값 사용)
    // 실제 서비스에서는 에러 반환하거나 서울 전체 조회 구현
    return apiSuccess({
      articles: [],
      total: 0,
      page: params.page,
      pageSize: params.pageSize,
      hasMore: false,
    });
  }

  const bounds = cortarNoToBounds(cortarNo);
  if (!bounds) {
    return apiError('INVALID_PARAMS', `지역 코드 '${cortarNo}'를 찾을 수 없습니다`, 400);
  }

  // 네이버 API 코드로 변환
  const tradeTypeCodes = convertTradeTypes(params.tradeTypes);
  const buildingTypeCodes = convertBuildingTypes(params.buildingTypes);

  const cacheKey = buildCacheKey({
    cortarNo,
    tradeTypes: tradeTypeCodes,
    buildingTypes: buildingTypeCodes,
    priceMin: params.dealPriceMin,
    priceMax: params.dealPriceMax,
    depositMin: params.depositMin,
    depositMax: params.depositMax,
    rentMin: params.monthlyRentMin,
    rentMax: params.monthlyRentMax,
    areaMin: params.areaMin,
    areaMax: params.areaMax,
    sort: params.sortBy,
    page: params.page,
    pageSize: params.pageSize,
  });

  const cached = getCached<{ articles: Article[]; total: number }>(cacheKey);
  if (cached) {
    return apiSuccess({
      ...cached,
      page: params.page,
      pageSize: params.pageSize,
      hasMore: cached.articles.length >= params.pageSize,
    });
  }

  try {
    const naverResponse = await fetchArticleList({
      rletTpCd: buildingTypeCodes,
      tradTpCd: tradeTypeCodes,
      z: bounds.z,
      lat: bounds.lat,
      lon: bounds.lon,
      btm: bounds.btm,
      lft: bounds.lft,
      top: bounds.top,
      rgt: bounds.rgt,
      page: params.page,
      spcMin: params.areaMin,
      spcMax: params.areaMax,
      dprcMin: params.depositMin,
      dprcMax: params.depositMax,
      wprcMin: params.monthlyRentMin,
      wprcMax: params.monthlyRentMax,
    });

    const articles = (naverResponse.body ?? []).map(transformNaverArticle);
    const total = articles.length;

    const result = { articles, total };
    setCache(cacheKey, result);

    return apiSuccess({
      articles,
      total,
      page: params.page,
      pageSize: params.pageSize,
      hasMore: articles.length >= params.pageSize,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Naver API error:', message);
    return apiError('NAVER_API_ERROR', message, 502);
  }
}
