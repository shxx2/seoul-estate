import type { TransitStation } from "@/types/transit";

const KAKAO_LOCAL_BASE_URL = "https://dapi.kakao.com/v2/local";

function getApiKey(): string {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) {
    throw new Error("KAKAO_REST_API_KEY 환경변수가 설정되지 않았습니다.");
  }
  return key;
}

interface KakaoLocalDocument {
  place_name: string;
  category_name: string;
  x: string; // longitude
  y: string; // latitude
  distance: string; // meters (string)
}

interface KakaoLocalResponse {
  documents: KakaoLocalDocument[];
}

async function fetchKakaoLocal(
  endpoint: string,
  params: Record<string, string>
): Promise<KakaoLocalResponse> {
  const url = new URL(`${KAKAO_LOCAL_BASE_URL}${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `KakaoAK ${getApiKey()}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Kakao Local API 요청 실패: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<KakaoLocalResponse>;
}

/** 가장 가까운 지하철역 1개 조회 (SW8 카테고리, 반경 2km) */
export async function findNearestSubway(
  lat: number,
  lng: number,
  radius = 2000
): Promise<TransitStation | null> {
  try {
    const data = await fetchKakaoLocal("/search/category.json", {
      category_group_code: "SW8",
      x: String(lng),
      y: String(lat),
      radius: String(radius),
      size: "1",
      sort: "distance",
    });

    const doc = data.documents[0];
    if (!doc) return null;

    return {
      type: "subway",
      name: doc.place_name,
      lat: parseFloat(doc.y),
      lng: parseFloat(doc.x),
      distance: parseFloat(doc.distance),
    };
  } catch {
    return null;
  }
}

/** 버스정류장 문서 필터링: category_name 기반으로 버스정류장 판별 */
function isBusStopDocument(doc: KakaoLocalDocument): boolean {
  // 버스정류장 카테고리 패턴: "교통,수송 > 교통시설 > 고속,시외버스정류장" 등
  const isBusCategory =
    doc.category_name.includes("버스정류") ||
    doc.category_name.includes("시외버스") ||
    doc.category_name.includes("정류소") ||
    doc.category_name.includes("정류장");
  // 지하철역은 category_name에 "지하철,전철" 포함
  const isSubwayCategory = doc.category_name.includes("지하철,전철");
  return isBusCategory && !isSubwayCategory;
}

/** 가장 가까운 버스정류장 1개 조회 (키워드 검색, 반경 2km) */
export async function findNearestBusStop(
  lat: number,
  lng: number,
  radius = 2000
): Promise<TransitStation | null> {
  const baseParams = {
    x: String(lng),
    y: String(lat),
    radius: String(radius),
    size: "10",
    sort: "distance",
  };

  try {
    // 1차 시도: "정류소" 키워드로 검색
    const data = await fetchKakaoLocal("/search/keyword.json", {
      query: "정류소",
      ...baseParams,
    });

    const busStop = data.documents.find(isBusStopDocument);

    if (busStop) {
      return {
        type: "bus",
        name: busStop.place_name,
        lat: parseFloat(busStop.y),
        lng: parseFloat(busStop.x),
        distance: parseFloat(busStop.distance),
      };
    }

    // 2차 시도 (폴백): "버스정류장" 키워드로 재시도
    const fallbackData = await fetchKakaoLocal("/search/keyword.json", {
      query: "버스정류장",
      ...baseParams,
    });

    const fallbackStop = fallbackData.documents.find(isBusStopDocument);

    if (!fallbackStop) return null;

    return {
      type: "bus",
      name: fallbackStop.place_name,
      lat: parseFloat(fallbackStop.y),
      lng: parseFloat(fallbackStop.x),
      distance: parseFloat(fallbackStop.distance),
    };
  } catch {
    return null;
  }
}

/** 가장 가까운 마트 1개 조회 (MT1=대형마트 카테고리, 반경 2km) */
export async function findNearestMart(
  lat: number,
  lng: number,
  radius = 2000
): Promise<TransitStation | null> {
  try {
    // MT1: 대형마트 카테고리
    const data = await fetchKakaoLocal("/search/category.json", {
      category_group_code: "MT1",
      x: String(lng),
      y: String(lat),
      radius: String(radius),
      size: "1",
      sort: "distance",
    });

    const doc = data.documents[0];
    if (!doc) return null;

    return {
      type: "mart",
      name: doc.place_name,
      lat: parseFloat(doc.y),
      lng: parseFloat(doc.x),
      distance: parseFloat(doc.distance),
    };
  } catch {
    return null;
  }
}

/** 가장 가까운 어린이집 1개 조회 (키워드 검색, 반경 2km) */
export async function findNearestDaycare(
  lat: number,
  lng: number,
  radius = 2000
): Promise<TransitStation | null> {
  try {
    const data = await fetchKakaoLocal("/search/keyword.json", {
      query: "어린이집",
      x: String(lng),
      y: String(lat),
      radius: String(radius),
      size: "1",
      sort: "distance",
    });

    const doc = data.documents[0];
    if (!doc) return null;

    return {
      type: "daycare",
      name: doc.place_name,
      lat: parseFloat(doc.y),
      lng: parseFloat(doc.x),
      distance: parseFloat(doc.distance),
    };
  } catch {
    return null;
  }
}
