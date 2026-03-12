import type { TransitStation } from "@/types/transit";

const SEOUL_BUS_API_BASE = "http://ws.bus.go.kr/api/rest/stationinfo";

function getApiKey(): string | null {
  return process.env.SEOUL_BUS_API_KEY || null;
}

interface SeoulBusStation {
  stationNm: string;   // 정류소명
  stationId: string;   // 정류소 ID
  gpsX: string;        // 경도 (WGS84)
  gpsY: string;        // 위도 (WGS84)
  dist: string;        // 거리 (미터)
}

interface SeoulBusApiResponse {
  msgHeader: {
    headerCd: string;
    headerMsg: string;
  };
  msgBody: {
    itemList?: SeoulBusStation[];
  };
}

/**
 * 서울시 공공 API - 좌표기반 근접정류소 목록 조회
 * http://ws.bus.go.kr/api/rest/stationinfo/getStationByPos
 */
export async function findNearestBusStopSeoul(
  lat: number,
  lng: number,
  radius = 500
): Promise<TransitStation | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return null; // API 키 없으면 null 반환 (fallback 사용)
  }

  try {
    const url = new URL(`${SEOUL_BUS_API_BASE}/getStationByPos`);
    url.searchParams.set("serviceKey", apiKey);
    url.searchParams.set("tmX", String(lng));  // 경도
    url.searchParams.set("tmY", String(lat));  // 위도
    url.searchParams.set("radius", String(radius));
    url.searchParams.set("resultType", "json");

    const res = await fetch(url.toString(), {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`서울시 버스 API 요청 실패: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as SeoulBusApiResponse;

    // API 에러 체크
    if (data.msgHeader.headerCd !== "0") {
      console.warn("서울시 버스 API 응답 에러:", data.msgHeader.headerMsg);
      return null;
    }

    const stations = data.msgBody.itemList;
    if (!stations || stations.length === 0) {
      return null;
    }

    // 가장 가까운 정류소 (이미 거리순 정렬됨)
    const nearest = stations[0];

    return {
      type: "bus",
      name: nearest.stationNm,
      lat: parseFloat(nearest.gpsY),
      lng: parseFloat(nearest.gpsX),
      distance: parseFloat(nearest.dist),
    };
  } catch (err) {
    console.error("서울시 버스정류장 API 에러:", err);
    return null;
  }
}
