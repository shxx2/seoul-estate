import { NextRequest } from 'next/server';
import { z } from 'zod';
import { cortarNoToBounds } from '@/lib/region-lookup';
import { getCached, setCache, buildCacheKey } from '@/lib/cache/server-cache';
import { fetchArticleList } from '@/lib/naver/client';
import { transformNaverArticle } from '@/lib/naver/transform';
import { apiSuccess, apiError } from '@/lib/api-response';
import type { Article } from '@/types/article';

const querySchema = z.object({
  cortarNo: z.string().min(1),
  tradeTypes: z.string().default('A1:B1:B2'),
  buildingTypes: z.string().default('APT:VL:OPST'),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  depositMin: z.coerce.number().optional(),
  depositMax: z.coerce.number().optional(),
  rentMin: z.coerce.number().optional(),
  rentMax: z.coerce.number().optional(),
  areaMin: z.coerce.number().optional(),
  areaMax: z.coerce.number().optional(),
  sort: z.string().default('rank'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(20),
});

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const raw = Object.fromEntries(searchParams.entries());

  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) {
    return apiError('INVALID_PARAMS', parsed.error.issues[0]?.message ?? 'Invalid query parameters', 400);
  }

  const params = parsed.data;

  const bounds = cortarNoToBounds(params.cortarNo);
  if (!bounds) {
    return apiError('INVALID_PARAMS', `cortarNo '${params.cortarNo}' not found in Seoul districts`, 400);
  }

  const cacheKey = buildCacheKey({
    cortarNo: params.cortarNo,
    tradeTypes: params.tradeTypes,
    buildingTypes: params.buildingTypes,
    priceMin: params.priceMin,
    priceMax: params.priceMax,
    depositMin: params.depositMin,
    depositMax: params.depositMax,
    rentMin: params.rentMin,
    rentMax: params.rentMax,
    areaMin: params.areaMin,
    areaMax: params.areaMax,
    sort: params.sort,
    page: params.page,
    pageSize: params.pageSize,
  });

  const cached = getCached<Article[]>(cacheKey);
  if (cached) {
    return apiSuccess(cached);
  }

  try {
    const naverResponse = await fetchArticleList({
      rletTpCd: params.buildingTypes,
      tradTpCd: params.tradeTypes,
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
      wprcMin: params.rentMin,
      wprcMax: params.rentMax,
    });

    const articles = (naverResponse.body ?? []).map(transformNaverArticle);

    setCache(cacheKey, articles);

    return apiSuccess(articles);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return apiError('NAVER_API_ERROR', message, 502);
  }
}
