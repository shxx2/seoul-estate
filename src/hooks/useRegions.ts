import useSWR from "swr";
import type { District, Dong } from "@/types/region";

interface DistrictsResponse {
  success: boolean;
  data: District[];
}

interface DongsResponse {
  success: boolean;
  data: Dong[];
}

const fetcher = <T>(url: string): Promise<T> =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
  });

/**
 * 서울 25개 구 목록 조회 훅
 */
export function useDistricts() {
  const { data, error, isLoading } = useSWR<DistrictsResponse, Error>(
    "/api/regions/districts",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  );

  return {
    districts: data?.data ?? [],
    isLoading,
    error,
  };
}

/**
 * 특정 구의 동 목록 조회 훅
 * @param guCode - 조회할 구 코드 (null이면 fetch 안 함)
 */
export function useDongs(guCode: string | null) {
  const key = guCode ? `/api/regions/dongs?guCode=${guCode}` : null;

  const { data, error, isLoading } = useSWR<DongsResponse, Error>(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  );

  return {
    dongs: data?.data ?? [],
    isLoading,
    error,
  };
}

/**
 * 구/동 목록을 함께 조회하는 훅
 * @param guCode - 선택된 구 코드 (null이면 동 목록 비어있음)
 */
export function useRegions(guCode: string | null) {
  const districts = useDistricts();
  const dongs = useDongs(guCode);

  return {
    districts: districts.districts,
    dongs: dongs.dongs,
    isLoadingDistricts: districts.isLoading,
    isLoadingDongs: dongs.isLoading,
    districtsError: districts.error,
    dongsError: dongs.error,
  };
}
