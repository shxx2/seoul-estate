// 모듈 레벨 캐시
let guBoundariesCache: Record<string, { lat: number; lng: number }[][]> | null = null;

// 구 경계 데이터 로드 (캐싱)
export async function loadGuBoundaries(): Promise<Record<string, { lat: number; lng: number }[][]>> {
  if (guBoundariesCache) return guBoundariesCache;

  const response = await fetch('/data/seoul-gu-boundaries.json');
  guBoundariesCache = await response.json();
  return guBoundariesCache!;
}

// cortarNo로 폴리곤 좌표 조회
export async function getPolygonByCortarNo(cortarNo: string): Promise<{ lat: number; lng: number }[][] | null> {
  const boundaries = await loadGuBoundaries();

  // 구 코드인 경우 직접 조회
  if (boundaries[cortarNo]) {
    return boundaries[cortarNo];
  }

  // 동 코드인 경우 해당 구의 폴리곤 반환 (임시 - 동 레벨 데이터 추가 시 수정)
  const guCode = cortarNo.slice(0, 5) + '00000';
  return boundaries[guCode] || null;
}
