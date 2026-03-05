import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { fetchArticleDetail } from '@/lib/naver/client';
import type { BuildingType, TradeType } from '@/types/article';

const VALID_BUILDING_TYPES: BuildingType[] = ['APT', 'VILLA', 'OFFICETEL'];
const VALID_TRADE_TYPES: TradeType[] = ['SALE', 'JEONSE', 'MONTHLY'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = request.nextUrl;

  const buildingTypeParam = searchParams.get('buildingType');
  const tradeTypeParam = searchParams.get('tradeType');
  const fallbackDataParam = searchParams.get('fallbackData');

  // Validate required params
  if (!buildingTypeParam || !tradeTypeParam) {
    return apiError(
      'INVALID_PARAMS',
      'buildingType and tradeType query parameters are required',
      400
    );
  }

  if (!VALID_BUILDING_TYPES.includes(buildingTypeParam as BuildingType)) {
    return apiError(
      'INVALID_PARAMS',
      `buildingType must be one of: ${VALID_BUILDING_TYPES.join(', ')}`,
      400
    );
  }

  if (!VALID_TRADE_TYPES.includes(tradeTypeParam as TradeType)) {
    return apiError(
      'INVALID_PARAMS',
      `tradeType must be one of: ${VALID_TRADE_TYPES.join(', ')}`,
      400
    );
  }

  const buildingType = buildingTypeParam as BuildingType;
  const tradeType = tradeTypeParam as TradeType;

  // Parse fallback data if provided
  let fallback: Record<string, unknown> | null = null;
  if (fallbackDataParam) {
    try {
      fallback = JSON.parse(fallbackDataParam) as Record<string, unknown>;
    } catch {
      // Ignore parse errors, fallback remains null
    }
  }

  try {
    const detail = await fetchArticleDetail(id, buildingType, tradeType);
    return apiSuccess({ ...detail, hasDetailInfo: true });
  } catch (err) {
    // Detail API failed — return fallback with hasDetailInfo: false
    console.error(`fetchArticleDetail failed for id=${id}:`, err);

    if (fallback !== null) {
      return apiSuccess({ ...fallback, hasDetailInfo: false });
    }

    return apiError(
      'DETAIL_UNAVAILABLE',
      'Article detail is not available',
      502
    );
  }
}
