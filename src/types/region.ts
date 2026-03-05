/** 지역 경계 좌표 - 네이버 API 호출용 */
export interface Bounds {
  sw: [number, number]; // [남서 위도, 남서 경도]
  ne: [number, number]; // [북동 위도, 북동 경도]
}

export interface Region {
  cortarNo: string;     // 법정동코드 (예: "1168000000")
  name: string;         // 지역명 (예: "강남구")
  lat: number;          // 중심 위도
  lng: number;          // 중심 경도
}

/** 구 단위 - 서울 25개 구 */
export interface District extends Region {
  dongCount: number;    // 소속 동 개수
  bounds: Bounds;       // 구 경계 좌표
}

/** 동 단위 - 구 하위 법정동 */
export interface Dong extends Region {
  guCode: string;       // 상위 구 코드
  guName: string;       // 상위 구 이름
  bounds: Bounds;       // 동 경계 좌표
}
