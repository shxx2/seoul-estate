import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getCached, setCache } from '@/lib/cache/server-cache';
import { apiSuccess, apiError } from '@/lib/api-response';
import { findNearestSubway, findNearestBusStop, findNearestMart, findNearestDaycare } from '@/lib/kakao/local';
import { findNearestBusStopSeoul } from '@/lib/seoul-bus/station';
import { getPedestrianRoute } from '@/lib/tmap/pedestrian';
import type { TransitStation, TransitRoute } from '@/types/transit';

/** 24시간 TTL (ms) - 도보 경로는 자주 변하지 않음 */
const TRANSIT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** 좌표 버킷 정밀도 (소수점 4자리 ≈ 11m) */
const COORD_PRECISION = 4;

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
  // 좌표 버킷팅으로 캐시 효율 향상 (~11m 정밀도)
  const bucketLat = lat.toFixed(COORD_PRECISION);
  const bucketLng = lng.toFixed(COORD_PRECISION);
  const cacheKey = `transit:${bucketLat}:${bucketLng}`;

  const cached = getTransitCached(cacheKey);
  if (cached) {
    return apiSuccess(cached);
  }

  try {
    // 지하철/마트/어린이집: 카카오 Local API
    // 버스정류장: 서울시 공공 API 우선, 실패 시 카카오 fallback
    const [subwayStation, martStation, daycareStation] = await Promise.all([
      findNearestSubway(lat, lng),
      findNearestMart(lat, lng),
      findNearestDaycare(lat, lng),
    ]);

    // 버스정류장: 서울시 API → 카카오 fallback
    let busStopStation = await findNearestBusStopSeoul(lat, lng);
    if (!busStopStation) {
      busStopStation = await findNearestBusStop(lat, lng);
    }

    // 직선 거리 기반 도보 시간 추정 (fallback용, 80m/분)
    const estimateWalkingRouteFallback = (
      startLat: number,
      startLng: number,
      endLat: number,
      endLng: number
    ): TransitRoute => {
      const R = 6371000;
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
      const duration = Math.round(distance / 1.33);
      return {
        path: [
          { lat: startLat, lng: startLng },
          { lat: endLat, lng: endLng },
        ],
        distance: Math.round(distance),
        duration,
      };
    };

    // T-map 도보 경로 조회 (실패 시 직선거리 fallback)
    const getWalkingRoute = async (
      startLat: number,
      startLng: number,
      endLat: number,
      endLng: number
    ): Promise<TransitRoute> => {
      try {
        return await getPedestrianRoute(
          { lat: startLat, lng: startLng },
          { lat: endLat, lng: endLng }
        );
      } catch (err) {
        console.warn('T-map API 실패, 직선거리 fallback 사용:', err);
        return estimateWalkingRouteFallback(startLat, startLng, endLat, endLng);
      }
    };

    // 4개 시설에 대한 도보 경로 병렬 조회
    const [subwayRoute, busStopRoute, martRoute, daycareRoute] = await Promise.all([
      subwayStation ? getWalkingRoute(lat, lng, subwayStation.lat, subwayStation.lng) : null,
      busStopStation ? getWalkingRoute(lat, lng, busStopStation.lat, busStopStation.lng) : null,
      martStation ? getWalkingRoute(lat, lng, martStation.lat, martStation.lng) : null,
      daycareStation ? getWalkingRoute(lat, lng, daycareStation.lat, daycareStation.lng) : null,
    ]);

    const result: TransitData = {
      subway: subwayStation && subwayRoute
        ? { station: subwayStation, route: subwayRoute }
        : null,
      busStop: busStopStation && busStopRoute
        ? { station: busStopStation, route: busStopRoute }
        : null,
      mart: martStation && martRoute
        ? { station: martStation, route: martRoute }
        : null,
      daycare: daycareStation && daycareRoute
        ? { station: daycareStation, route: daycareRoute }
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
