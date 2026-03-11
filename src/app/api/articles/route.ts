import { NextRequest } from 'next/server';
import { z } from 'zod';
import { cortarNoToBounds } from '@/lib/region-lookup';
import { getCached, setCache } from '@/lib/cache/server-cache';
import { fetchArticleList } from '@/lib/naver/client';
import { transformNaverArticle } from '@/lib/naver/transform';
import type { NaverArticleItem } from '@/lib/naver/types';
import { apiSuccess, apiError } from '@/lib/api-response';
import { TRADE_TYPE_TO_NAVER, BUILDING_TYPE_TO_NAVER } from '@/lib/constants';
import { mergeNaverFetchDiagnostics } from '@/lib/naver/diagnostics';
import { createArticleFetchPlan } from '@/lib/naver/query-planner';
import { normalizeArticleResults } from '@/lib/naver/normalize-articles';
import {
  buildArticleCacheKey,
  paginateArticles,
  shouldForceArticleRefresh,
  sortArticles,
} from '@/lib/articles/query';
import type { Article, TradeType, BuildingType } from '@/types/article';

// Node.js Runtime 사용 - Vercel Seoul 리전(icn1)에서 실행
export const maxDuration = 30;

// guCode를 구 이름으로 매핑 (서울 25개 구 전체)
const guCodeToName: Record<string, string> = {
  '1111000000': '종로구',
  '1114000000': '중구',
  '1117000000': '용산구',
  '1120000000': '성동구',
  '1121500000': '광진구',
  '1123000000': '동대문구',
  '1126000000': '중랑구',
  '1129000000': '성북구',
  '1130500000': '강북구',
  '1132000000': '도봉구',
  '1135000000': '노원구',
  '1138000000': '은평구',
  '1141000000': '서대문구',
  '1144000000': '마포구',
  '1147000000': '양천구',
  '1150000000': '강서구',
  '1153000000': '구로구',
  '1154500000': '금천구',
  '1156000000': '영등포구',
  '1159000000': '동작구',
  '1162000000': '관악구',
  '1165000000': '서초구',
  '1168000000': '강남구',
  '1171000000': '송파구',
  '1174000000': '강동구',
};

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
  sortBy: z.string().default('price_asc'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(20),
  _refresh: z.coerce.number().optional(),
  _debug: z.string().optional(),
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
  const debugRequested = params._debug === '1';

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

  const cacheKey = buildArticleCacheKey({
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
  });
  const forceRefresh = debugRequested || shouldForceArticleRefresh(params._refresh, params.page);

  const cached = forceRefresh
    ? null
    : getCached<{ articles: Article[]; total: number }>(cacheKey);

  if (cached) {
    const sortedArticles = sortArticles(cached.articles, params.sortBy);
    const { pageArticles, hasMore } = paginateArticles(
      sortedArticles,
      params.page,
      params.pageSize
    );

    return apiSuccess({
      articles: pageArticles,
      total: cached.total,
      page: params.page,
      pageSize: params.pageSize,
      hasMore,
      ...(debugRequested
        ? {
            debug: {
              cacheHit: true,
            },
          }
        : {}),
    });
  }

  try {
    const fetchPlan = createArticleFetchPlan({
      tradeTypes: tradeTypeCodes,
      buildingTypes: buildingTypeCodes,
      dealPriceMin: params.dealPriceMin,
      dealPriceMax: params.dealPriceMax,
      depositMin: params.depositMin,
      depositMax: params.depositMax,
      monthlyRentMin: params.monthlyRentMin,
      monthlyRentMax: params.monthlyRentMax,
      areaMin: params.areaMin,
      areaMax: params.areaMax,
    });
    const allNaverArticles: NaverArticleItem[] = [];
    const diagnostics = [];

    for (let page = 1; page <= fetchPlan.maxPages; page++) {
      const result = await fetchArticleList({
        rletTpCd: buildingTypeCodes,
        tradTpCd: tradeTypeCodes,
        z: bounds.z,
        lat: bounds.lat,
        lon: bounds.lon,
        btm: bounds.btm,
        lft: bounds.lft,
        top: bounds.top,
        rgt: bounds.rgt,
        page,
        spcMin: params.areaMin,
        spcMax: params.areaMax,
        prcMin: params.dealPriceMin,
        prcMax: params.dealPriceMax,
        dprcMin: params.depositMin,
        dprcMax: params.depositMax,
        wprcMin: params.monthlyRentMin,
        wprcMax: params.monthlyRentMax,
      }, {
        forceRefresh,
      });

      diagnostics.push(result.diagnostics);
      allNaverArticles.push(...(result.response.body ?? []));

      // 더 이상 데이터가 없으면 중단
      if (!result.response.isMoreData && !result.response.more) {
        break;
      }
    }

    const requestedGuCode = params.guCode || cortarNo;
    const requestedGuName = guCodeToName[requestedGuCode];
    const normalized = normalizeArticleResults(
      allNaverArticles.map(transformNaverArticle),
      {
        bounds,
        requestedGuName,
        dealPriceMin: params.dealPriceMin,
        dealPriceMax: params.dealPriceMax,
        depositMin: params.depositMin,
        depositMax: params.depositMax,
        monthlyRentMin: params.monthlyRentMin,
        monthlyRentMax: params.monthlyRentMax,
        areaMin: params.areaMin,
        areaMax: params.areaMax,
      }
    );
    const fetchDiagnostics = mergeNaverFetchDiagnostics(diagnostics);

    console.log('[Articles] fetch summary:', JSON.stringify({
      cortarNo,
      requestPage: params.page,
      pageSize: params.pageSize,
      pagesFetched: fetchDiagnostics.pagesFetched,
      upstreamArticleCount: fetchDiagnostics.upstreamArticleCount,
      rawCount: normalized.stats.rawCount,
      afterDedupeCount: normalized.stats.afterDedupeCount,
      afterBoundsCount: normalized.stats.afterBoundsCount,
      afterGuCount: normalized.stats.afterGuCount,
      afterPostFilterCount: normalized.stats.afterPostFilterCount,
      retryCount: fetchDiagnostics.retryCount,
      upstreamStatusCodes: fetchDiagnostics.upstreamStatusCodes,
      requiresPostFilter: fetchPlan.requiresPostFilter,
    }));

    const articles = normalized.articles;

    const total = articles.length;
    setCache(cacheKey, { articles, total });

    const sortedArticles = sortArticles(articles, params.sortBy);
    const { pageArticles: paginatedArticles, hasMore } = paginateArticles(
      sortedArticles,
      params.page,
      params.pageSize
    );

    return apiSuccess({
      articles: paginatedArticles,
      total,
      page: params.page,
      pageSize: params.pageSize,
      hasMore,
      ...(debugRequested
        ? {
            debug: {
              fetchPlan,
              naver: fetchDiagnostics,
              normalization: normalized.stats,
            },
          }
        : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Articles] Naver API error for cortarNo:', cortarNo, '-', message);

    return apiError(
      'NAVER_API_ERROR',
      '매물 정보를 가져오는 데 실패했습니다. 잠시 후 다시 시도해주세요.',
      503
    );
  }
}
