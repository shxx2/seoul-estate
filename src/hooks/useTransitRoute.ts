import useSWR from "swr";

interface LatLng {
  lat: number;
  lng: number;
}

interface TransitStation {
  type: "subway" | "bus";
  name: string;
  lat: number;
  lng: number;
  distance: number;
}

interface TransitRoute {
  path: LatLng[];
  distance: number;
  duration: number; // seconds
}

interface TransitInfo {
  station: TransitStation;
  route: TransitRoute;
}

interface TransitResponse {
  success: boolean;
  data: {
    subway: TransitInfo;
    busStop: TransitInfo;
    mart: TransitInfo;
    daycare: TransitInfo;
  };
}

interface UseTransitRouteResult {
  subway: TransitInfo | null;
  busStop: TransitInfo | null;
  mart: TransitInfo | null;
  daycare: TransitInfo | null;
  isLoading: boolean;
  error: Error | null;
}

const fetcher = (url: string): Promise<TransitResponse> =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<TransitResponse>;
  });

/**
 * 대중교통 경로 훅
 * 주어진 좌표를 기준으로 가장 가까운 지하철역/버스정류장과 도보 경로를 반환합니다.
 */
export function useTransitRoute(lat: number | null, lng: number | null): UseTransitRouteResult {
  const key = lat && lng ? `/api/transit?lat=${lat}&lng=${lng}` : null;

  const { data, error, isLoading } = useSWR<TransitResponse, Error>(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5분
  });

  return {
    subway: data?.data?.subway ?? null,
    busStop: data?.data?.busStop ?? null,
    mart: data?.data?.mart ?? null,
    daycare: data?.data?.daycare ?? null,
    isLoading,
    error: error ?? null,
  };
}
