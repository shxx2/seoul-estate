import type { Region } from '@/types/region';
import seoulDistricts from '../../public/data/seoul-districts.json';

/** 네이버 API 호출에 필요한 좌표 파라미터 */
export interface BoundsParams {
  lat: number;  // 중심 위도
  lon: number;  // 중심 경도
  btm: number;  // 하단 위도
  lft: number;  // 좌측 경도
  top: number;  // 상단 위도
  rgt: number;  // 우측 경도
  z: number;    // 줌 레벨
}

/**
 * cortarNo로 seoul-districts.json에서 해당 지역 조회하여
 * 네이버 API 호출에 필요한 좌표 파라미터를 반환한다.
 *
 * [v3 Critical Fix] districts 배열에서 직접 lookup하여 구/동 판별.
 * 기존 endsWith('00000') 로직은 광진구(1121500000), 강북구(1130500000),
 * 금천구(1154500000) 에서 오분류 버그 발생.
 */
export function cortarNoToBounds(cortarNo: string): BoundsParams | null {
  // 구 단위 좌표 범위 마진 (경계 매물 누락 방지)
  const GU_BOUNDS_MARGIN = 0.005; // 약 550m 확장

  // 구 단위: districts 배열에서 직접 조회
  const district = seoulDistricts.districts.find(d => d.cortarNo === cortarNo);
  if (district) {
    return {
      lat: district.lat,
      lon: district.lng,
      btm: district.bounds.sw[0] - GU_BOUNDS_MARGIN,
      lft: district.bounds.sw[1] - GU_BOUNDS_MARGIN,
      top: district.bounds.ne[0] + GU_BOUNDS_MARGIN,
      rgt: district.bounds.ne[1] + GU_BOUNDS_MARGIN,
      z: 15, // 구 단위 줌 레벨 (15로 높여서 정확도 향상)
    };
  }

  // 동 단위: 모든 구의 dongs 배열에서 검색
  // 동 좌표 범위를 확대하여 경계 매물 누락 방지 (마진 +/-0.007 추가)
  const DONG_BOUNDS_MARGIN = 0.007; // 약 770m 확장
  for (const dist of seoulDistricts.districts) {
    const dong = dist.dongs.find(d => d.cortarNo === cortarNo);
    if (dong) {
      return {
        lat: dong.lat,
        lon: dong.lng,
        btm: dong.bounds.sw[0] - DONG_BOUNDS_MARGIN,
        lft: dong.bounds.sw[1] - DONG_BOUNDS_MARGIN,
        top: dong.bounds.ne[0] + DONG_BOUNDS_MARGIN,
        rgt: dong.bounds.ne[1] + DONG_BOUNDS_MARGIN,
        z: 15, // 동 단위 줌 레벨
      };
    }
  }

  return null;
}

/**
 * cortarNo로 중심 좌표와 줌 레벨 반환 (지도 이동용)
 */
export function getRegionCenter(cortarNo: string): { lat: number; lng: number; zoom: number } | null {
  const bounds = cortarNoToBounds(cortarNo);
  if (!bounds) return null;

  return {
    lat: bounds.lat,
    lng: bounds.lon,
    zoom: 14, // 500m 축척으로 고정
  };
}

/**
 * bounds를 지정된 개수의 타일로 분할하여 반환
 * @param bounds 원본 bounds
 * @param gridSize 그리드 크기 (2 = 2x2 = 4타일, 3 = 3x3 = 9타일)
 */
export function splitBoundsIntoTiles(bounds: BoundsParams, gridSize: number = 2): BoundsParams[] {
  const tiles: BoundsParams[] = [];

  const latStep = (bounds.top - bounds.btm) / gridSize;
  const lonStep = (bounds.rgt - bounds.lft) / gridSize;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const tileBtm = bounds.btm + (row * latStep);
      const tileTop = bounds.btm + ((row + 1) * latStep);
      const tileLft = bounds.lft + (col * lonStep);
      const tileRgt = bounds.lft + ((col + 1) * lonStep);

      tiles.push({
        lat: (tileBtm + tileTop) / 2,
        lon: (tileLft + tileRgt) / 2,
        btm: tileBtm,
        top: tileTop,
        lft: tileLft,
        rgt: tileRgt,
        z: bounds.z + 1, // 타일링시 줌 레벨 증가
      });
    }
  }

  return tiles;
}

/**
 * cortarNo로 폴리곤 좌표 반환 (bounds를 사각형 폴리곤으로 변환) - 폴백용 동기 함수
 */
export function getRegionPolygon(cortarNo: string): { lat: number; lng: number }[] | null {
  const bounds = cortarNoToBounds(cortarNo);
  if (!bounds) return null;

  // bounds를 사각형 폴리곤으로 변환 (시계방향)
  return [
    { lat: bounds.top, lng: bounds.lft },  // 좌상단
    { lat: bounds.top, lng: bounds.rgt },  // 우상단
    { lat: bounds.btm, lng: bounds.rgt },  // 우하단
    { lat: bounds.btm, lng: bounds.lft },  // 좌하단
  ];
}

/**
 * cortarNo로 폴리곤 좌표 반환 (GeoJSON 데이터 우선, 없으면 bounds 기반 사각형 폴백)
 */
export async function getRegionPolygonAsync(cortarNo: string): Promise<{ lat: number; lng: number }[][] | null> {
  const { getPolygonByCortarNo } = await import('./geojson-loader');

  try {
    const geoPolygon = await getPolygonByCortarNo(cortarNo);
    if (geoPolygon) return geoPolygon;
  } catch {
    // GeoJSON 로드 실패 시 폴백으로 진행
  }

  // 폴백: bounds 기반 사각형 폴리곤
  const fallback = getRegionPolygon(cortarNo);
  return fallback ? [fallback] : null;
}

/**
 * 검색어로 구/동 찾기 (자동완성용).
 * 구 이름 먼저, 동 이름 후순위로 결과를 채운다.
 */
export function searchRegions(query: string, limit = 10): Region[] {
  const results: Region[] = [];
  const q = query.toLowerCase();

  for (const district of seoulDistricts.districts) {
    if (results.length >= limit) break;

    if (district.name.toLowerCase().includes(q)) {
      results.push({
        cortarNo: district.cortarNo,
        name: district.name,
        lat: district.lat,
        lng: district.lng,
      });
    }

    for (const dong of district.dongs) {
      if (results.length >= limit) break;
      if (dong.name.toLowerCase().includes(q)) {
        results.push({
          cortarNo: dong.cortarNo,
          name: dong.name,
          lat: dong.lat,
          lng: dong.lng,
        });
      }
    }
  }

  return results.slice(0, limit);
}
