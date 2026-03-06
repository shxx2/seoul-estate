import { NextRequest } from 'next/server';
import { z } from 'zod';
import { cortarNoToBounds } from '@/lib/region-lookup';
import { getCached, setCache, buildCacheKey } from '@/lib/cache/server-cache';
import { fetchArticleList } from '@/lib/naver/client';
import { transformNaverArticle } from '@/lib/naver/transform';
import { apiSuccess, apiError } from '@/lib/api-response';
import { TRADE_TYPE_TO_NAVER, BUILDING_TYPE_TO_NAVER } from '@/lib/constants';
import type { Article, TradeType, BuildingType } from '@/types/article';

// Edge Runtime 사용 - Cloudflare 네트워크에서 실행되어 다른 IP 대역 사용
export const runtime = 'edge';

// 서울 주요 지역 샘플 매물 데이터 (API 실패 시 fallback)
const SAMPLE_ARTICLES: Article[] = [
  {
    id: 'sample-1',
    articleName: '래미안 퍼스티지',
    buildingType: 'APT',
    tradeType: 'SALE',
    address: '서울시 강남구 개포동 123',
    roadAddress: '서울시 강남구 개포로 123',
    gu: '강남구',
    dong: '개포동',
    lat: 37.5172,
    lng: 127.0473,
    dealPrice: 185000,
    deposit: null,
    monthlyRent: null,
    priceText: '18억 5,000',
    supplyArea: 112.45,
    exclusiveArea: 84.99,
    supplyAreaPyeong: 34,
    exclusiveAreaPyeong: 25.7,
    floor: '15/28',
    totalFloor: 28,
    buildYear: '2018',
    direction: '남향',
    roomCount: 4,
    bathroomCount: 2,
    description: '역세권, 학군우수 단지',
    confirmDate: '2024-01-15',
    agentName: '강남부동산',
    articleUrl: 'https://m.land.naver.com/article/sample-1',
    thumbnailUrl: null,
    hasDetailInfo: false,
  },
  {
    id: 'sample-2',
    articleName: '아크로리버파크',
    buildingType: 'APT',
    tradeType: 'SALE',
    address: '서울시 서초구 반포동 456',
    roadAddress: '서울시 서초구 신반포로 456',
    gu: '서초구',
    dong: '반포동',
    lat: 37.5219,
    lng: 127.0107,
    dealPrice: 420000,
    deposit: null,
    monthlyRent: null,
    priceText: '42억',
    supplyArea: 165.29,
    exclusiveArea: 129.92,
    supplyAreaPyeong: 50,
    exclusiveAreaPyeong: 39.3,
    floor: '25/35',
    totalFloor: 35,
    buildYear: '2016',
    direction: '남동향',
    roomCount: 5,
    bathroomCount: 3,
    description: '한강뷰, 프리미엄 단지',
    confirmDate: '2024-01-14',
    agentName: '반포공인중개사',
    articleUrl: 'https://m.land.naver.com/article/sample-2',
    thumbnailUrl: null,
    hasDetailInfo: false,
  },
  {
    id: 'sample-3',
    articleName: '힐스테이트 청담',
    buildingType: 'APT',
    tradeType: 'JEONSE',
    address: '서울시 강남구 청담동 789',
    roadAddress: '서울시 강남구 청담로 789',
    gu: '강남구',
    dong: '청담동',
    lat: 37.5247,
    lng: 127.0532,
    dealPrice: null,
    deposit: 120000,
    monthlyRent: null,
    priceText: '전세 12억',
    supplyArea: 79.34,
    exclusiveArea: 59.97,
    supplyAreaPyeong: 24,
    exclusiveAreaPyeong: 18.1,
    floor: '8/20',
    totalFloor: 20,
    buildYear: '2022',
    direction: '동향',
    roomCount: 3,
    bathroomCount: 2,
    description: '신축, 역세권 단지',
    confirmDate: '2024-01-13',
    agentName: '청담부동산',
    articleUrl: 'https://m.land.naver.com/article/sample-3',
    thumbnailUrl: null,
    hasDetailInfo: false,
  },
  {
    id: 'sample-4',
    articleName: '자이 타워팰리스',
    buildingType: 'APT',
    tradeType: 'MONTHLY',
    address: '서울시 강남구 도곡동 321',
    roadAddress: '서울시 강남구 도곡로 321',
    gu: '강남구',
    dong: '도곡동',
    lat: 37.5089,
    lng: 127.0628,
    dealPrice: null,
    deposit: 10000,
    monthlyRent: 350,
    priceText: '1억/350만',
    supplyArea: 66.12,
    exclusiveArea: 49.59,
    supplyAreaPyeong: 20,
    exclusiveAreaPyeong: 15,
    floor: '12/45',
    totalFloor: 45,
    buildYear: '2010',
    direction: '남서향',
    roomCount: 2,
    bathroomCount: 1,
    description: '고층뷰, 풀옵션',
    confirmDate: '2024-01-12',
    agentName: '도곡부동산',
    articleUrl: 'https://m.land.naver.com/article/sample-4',
    thumbnailUrl: null,
    hasDetailInfo: false,
  },
  {
    id: 'sample-5',
    articleName: '푸르지오 시티',
    buildingType: 'OFFICETEL',
    tradeType: 'MONTHLY',
    address: '서울시 강남구 역삼동 654',
    roadAddress: '서울시 강남구 테헤란로 654',
    gu: '강남구',
    dong: '역삼동',
    lat: 37.5013,
    lng: 127.0396,
    dealPrice: null,
    deposit: 5000,
    monthlyRent: 150,
    priceText: '5,000/150만',
    supplyArea: 42.98,
    exclusiveArea: 33.06,
    supplyAreaPyeong: 13,
    exclusiveAreaPyeong: 10,
    floor: '7/25',
    totalFloor: 25,
    buildYear: '2019',
    direction: '북향',
    roomCount: 1,
    bathroomCount: 1,
    description: '역세권, 올수리 완료',
    confirmDate: '2024-01-11',
    agentName: '역삼공인중개사',
    articleUrl: 'https://m.land.naver.com/article/sample-5',
    thumbnailUrl: null,
    hasDetailInfo: false,
  },
];

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
    console.error('Naver API error:', message, '- returning sample data');

    // API 실패 시 샘플 데이터 반환 (Vercel에서 네이버 API 차단 대응)
    const filteredSamples = SAMPLE_ARTICLES.filter(article => {
      // 거래 유형 필터
      if (params.tradeTypes) {
        const types = Array.isArray(params.tradeTypes) ? params.tradeTypes : [params.tradeTypes];
        if (!types.includes(article.tradeType)) return false;
      }
      // 건물 유형 필터
      if (params.buildingTypes) {
        const types = Array.isArray(params.buildingTypes) ? params.buildingTypes : [params.buildingTypes];
        if (!types.includes(article.buildingType)) return false;
      }
      return true;
    });

    return apiSuccess({
      articles: filteredSamples,
      total: filteredSamples.length,
      page: params.page,
      pageSize: params.pageSize,
      hasMore: false,
      _isSampleData: true, // 클라이언트에서 샘플 데이터임을 알 수 있도록
    });
  }
}
