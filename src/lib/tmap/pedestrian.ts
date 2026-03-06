import type { TransitRoute } from "@/types/transit";

const TMAP_PEDESTRIAN_URL =
  "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1";

function getAppKey(): string {
  const key = process.env.TMAP_APP_KEY;
  if (!key) {
    throw new Error("TMAP_APP_KEY 환경변수가 설정되지 않았습니다.");
  }
  return key;
}

interface LatLng {
  lat: number;
  lng: number;
}

interface TmapFeature {
  type: "Feature";
  geometry: {
    type: "LineString" | "Point";
    coordinates: number[] | number[][];
  };
  properties: {
    totalDistance?: number; // meters
    totalTime?: number;     // seconds
    [key: string]: unknown;
  };
}

interface TmapPedestrianResponse {
  type: "FeatureCollection";
  features: TmapFeature[];
}

/** 도보 경로 조회 */
export async function getPedestrianRoute(
  start: LatLng,
  end: LatLng
): Promise<TransitRoute> {
  const body = {
    startX: String(start.lng),
    startY: String(start.lat),
    endX: String(end.lng),
    endY: String(end.lat),
    reqCoordType: "WGS84GEO",
    resCoordType: "WGS84GEO",
    startName: "출발지",
    endName: "도착지",
  };

  const res = await fetch(TMAP_PEDESTRIAN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      appKey: getAppKey(),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Tmap 도보 경로 API 요청 실패: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as TmapPedestrianResponse;

  // 첫 번째 Feature의 properties에서 총 거리/시간 추출
  const summary = data.features[0]?.properties ?? {};
  const totalDistance = (summary.totalDistance as number) ?? 0;
  const totalTime = (summary.totalTime as number) ?? 0;

  // LineString features에서 경로 좌표 추출 ([lng, lat] -> { lat, lng })
  const path: { lat: number; lng: number }[] = [];
  for (const feature of data.features) {
    if (feature.geometry.type === "LineString") {
      const coords = feature.geometry.coordinates as number[][];
      for (const coord of coords) {
        path.push({ lat: coord[1], lng: coord[0] });
      }
    }
  }

  return {
    path,
    distance: totalDistance,
    duration: totalTime,
  };
}
