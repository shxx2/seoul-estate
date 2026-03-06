/** 네이버 m.land.naver.com cluster API 응답 (articleList) */
export interface NaverArticleListResponse {
  isMoreData: boolean;
  body: NaverArticleItem[];
}

export interface NaverArticleItem {
  atclNo: string;        // 매물번호
  atclNm: string;        // 매물명
  rletTpNm: string;      // 부동산유형명 ("아파트", "오피스텔" 등)
  tradTpNm: string;      // 거래유형명 ("매매", "전세", "월세")
  flrInfo: string;       // 층 정보 ("3/15")
  prc: number;           // 가격 (만원)
  hanPrc: string;        // 한글 가격 ("3억 5,000")
  rentPrc: number;       // 월세 (만원)
  spc1: number;          // 공급면적 (m2)
  spc2: number;          // 전용면적 (m2)
  direction: string;     // 방향
  atclCfmYmd: string;    // 확인일자 (YYYYMMDD)
  lat: number;           // 위도
  lng: number;           // 경도
  atclFetrDesc: string;  // 매물 특징 설명
  tagList: string[];     // 태그 목록
  bildNm: string;        // 건물명
  cpNm: string;          // 중개업소명
  rltrNm: string;        // 중개사명
  repImgUrl: string;     // 대표 이미지 경로 (상대 경로)
  repImgThumb: string;   // 썸네일 크기 타입 (e.g. "f130_98")

  // 선택적 필드 (상세 API 또는 일부 응답에서만 존재)
  address?: string;          // 지번 주소
  roadAddress?: string;      // 도로명 주소
  buildYear?: string;        // 건축년도
  roomCnt?: number;          // 방 수
  bathroomCnt?: number;      // 욕실 수
  cpPcArticleUrl?: string;   // 중개사 PC 매물 URL
}
