import type { District, Dong } from '@/types/region';
import seoulDistricts from '../../public/data/seoul-districts.json';

/**
 * cortarNo로 구(District) 조회.
 * 해당 코드가 구 목록에 없으면 null 반환.
 */
export function getDistrictByCode(cortarNo: string): District | null {
  const d = seoulDistricts.districts.find(dist => dist.cortarNo === cortarNo);
  if (!d) return null;

  return {
    cortarNo: d.cortarNo,
    name: d.name,
    lat: d.lat,
    lng: d.lng,
    dongCount: d.dongCount,
    bounds: {
      sw: [d.bounds.sw[0], d.bounds.sw[1]],
      ne: [d.bounds.ne[0], d.bounds.ne[1]],
    },
  };
}

/**
 * cortarNo로 동(Dong) 조회.
 * 모든 구의 dongs 배열을 순회하여 찾는다.
 * 해당 코드가 없으면 null 반환.
 */
export function getDongByCode(cortarNo: string): Dong | null {
  for (const dist of seoulDistricts.districts) {
    const d = dist.dongs.find(dong => dong.cortarNo === cortarNo);
    if (d) {
      return {
        cortarNo: d.cortarNo,
        name: d.name,
        lat: d.lat,
        lng: d.lng,
        guCode: d.guCode,
        guName: d.guName,
        bounds: {
          sw: [d.bounds.sw[0], d.bounds.sw[1]],
          ne: [d.bounds.ne[0], d.bounds.ne[1]],
        },
      };
    }
  }
  return null;
}

/**
 * 서울 25개 구 목록 반환.
 */
export function getDistrictList(): District[] {
  return seoulDistricts.districts.map(d => ({
    cortarNo: d.cortarNo,
    name: d.name,
    lat: d.lat,
    lng: d.lng,
    dongCount: d.dongCount,
    bounds: {
      sw: [d.bounds.sw[0], d.bounds.sw[1]],
      ne: [d.bounds.ne[0], d.bounds.ne[1]],
    },
  }));
}
