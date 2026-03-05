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
  // 구 단위: districts 배열에서 직접 조회
  const district = seoulDistricts.districts.find(d => d.cortarNo === cortarNo);
  if (district) {
    return {
      lat: district.lat,
      lon: district.lng,
      btm: district.bounds.sw[0],
      lft: district.bounds.sw[1],
      top: district.bounds.ne[0],
      rgt: district.bounds.ne[1],
      z: 13, // 구 단위 줌 레벨
    };
  }

  // 동 단위: 모든 구의 dongs 배열에서 검색
  for (const dist of seoulDistricts.districts) {
    const dong = dist.dongs.find(d => d.cortarNo === cortarNo);
    if (dong) {
      return {
        lat: dong.lat,
        lon: dong.lng,
        btm: dong.bounds.sw[0],
        lft: dong.bounds.sw[1],
        top: dong.bounds.ne[0],
        rgt: dong.bounds.ne[1],
        z: 15, // 동 단위 줌 레벨
      };
    }
  }

  return null;
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
