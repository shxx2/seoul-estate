import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getCached, setCache } from '@/lib/cache/server-cache';
import { apiSuccess, apiError } from '@/lib/api-response';
import { findNearestSubway, findNearestBusStop, findNearestMart, findNearestDaycare } from '@/lib/kakao/local';
import type { TransitStation, TransitRoute } from '@/types/transit';

/** 30분 TTL (ms) */
const TRANSIT_CACHE_TTL_MS = 30 * 60 * 1000;

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

interface TransitInfo {
  station: TransitStation;
  route: TransitRoute;
}

interface TransitData {
  subway: TransitInfo | null;
  busStop: TransitInfo | null;
  mart: TransitInfo | null;
  daycare: TransitInfo | null;
}

/** server-cache의 기본 TTL(5분)을 우회하기 위해 만료 시각을 함께 저장 */
interface TransitCacheEntry {
  data: TransitData;
  expiresAt: number;
}

function getTransitCached(key: string): TransitData | null {
  const entry = getCached<TransitCacheEntry>(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) return null;
  return entry.data;
}

function setTransitCache(key: string, data: TransitData): void {
  const entry: TransitCacheEntry = {
    data,
    expiresAt: Date.now() + TRANSIT_CACHE_TTL_MS,
  };
  // server-cache의 기본 TTL(5분)보다 길게 유지하기 위해
  // 내부적으로 expiresAt으로 30분 만료를 직접 관리
  setCache(key, entry);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const parsed = querySchema.safeParse({
    lat: searchParams.get('lat'),
    lng: searchParams.get('lng'),
  });

  if (!parsed.success) {
    return apiError(
      'INVALID_PARAMS',
      parsed.error.issues[0]?.message ?? 'lat, lng 파라미터가 필요합니다',
      400
    );
  }

  const { lat, lng } = parsed.data;
  const cacheKey = `transit:${lat}:${lng}`;

  const cached = getTransitCached(cacheKey);
  if (cached) {
    return apiSuccess(cached);
  }

  try {
    // 카카오 Local API로 가장 가까운 지하철역, 버스정류장, 마트, 어린이집 병렬 조회
    const [subwayStation, busStopStation, martStation, daycareStation] = await Promise.all([
      findNearestSubway(lat, lng),
      findNearestBusStop(lat, lng),
      findNearestMart(lat, lng),
      findNearestDaycare(lat, lng),
    ]);

    // 직선 거리 기반 도보 시간 추정 (80m/분)
    const estimateWalkingRoute = (
      startLat: number,
      startLng: number,
      endLat: number,
      endLng: number
    ): TransitRoute => {
      // Haversine 공식으로 직선 거리 계산
      const R = 6371000; // 지구 반지름 (미터)
      const dLat = ((endLat - startLat) * Math.PI) / 180;
      const dLng = ((endLng - startLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((startLat * Math.PI) / 180) *
          Math.cos((endLat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      // 도보 시간 추정 (80m/분 = 1.33m/초)
      const duration = Math.round(distance / 1.33);

      // 직선 경로 (시작점 → 끝점)
      return {
        path: [
          { lat: startLat, lng: startLng },
          { lat: endLat, lng: endLng },
        ],
        distance: Math.round(distance),
        duration,
      };
    };

    const result: TransitData = {
      subway: subwayStation
        ? {
            station: subwayStation,
            route: estimateWalkingRoute(lat, lng, subwayStation.lat, subwayStation.lng),
          }
        : null,
      busStop: busStopStation
        ? {
            station: busStopStation,
            route: estimateWalkingRoute(lat, lng, busStopStation.lat, busStopStation.lng),
          }
        : null,
      mart: martStation
        ? {
            station: martStation,
            route: estimateWalkingRoute(lat, lng, martStation.lat, martStation.lng),
          }
        : null,
      daycare: daycareStation
        ? {
            station: daycareStation,
            route: estimateWalkingRoute(lat, lng, daycareStation.lat, daycareStation.lng),
          }
        : null,
    };

    setTransitCache(cacheKey, result);

    return apiSuccess(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Transit API error:', message);
    return apiError('INTERNAL_ERROR', message, 502);
  }
}
