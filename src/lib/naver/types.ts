/** 네이버 m.land.naver.com cluster API 응답 (articleList) */
export interface NaverArticleListResponse {
  code?: string;
  isMoreData?: boolean;
  more?: boolean;  // 네이버 API가 두 필드 중 하나를 사용
  page?: number;
  z?: number;
  TIME?: boolean;
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
  cortarNo?: string;         // 법정동코드 (e.g. "1126010100" = 중랑구 면목동)
  address?: string;          // 지번 주소
  roadAddress?: string;      // 도로명 주소
  buildYear?: string;        // 건축년도
  roomCnt?: number;          // 방 수
  bathroomCnt?: number;      // 욕실 수
  cpPcArticleUrl?: string;   // 중개사 PC 매물 URL
}

/** 네이버 new.land.naver.com Region API 응답 (cortarNo 기반) */
export interface NaverRegionArticleListResponse {
  isMoreData: boolean;
  articleList: NaverRegionArticleItem[];
}

export interface NaverRegionArticleItem {
  articleNo: string;           // 매물번호
  articleName: string;         // 매물명 (건물명)
  realEstateTypeName: string;  // 부동산유형명 ("아파트", "오피스텔" 등)
  tradeTypeName: string;       // 거래유형명 ("매매", "전세", "월세")
  floorInfo: string;           // 층 정보 ("3/15")
  dealOrWarrantPrc: string;    // 가격 문자열 (매매가 또는 보증금, e.g. "3억 5,000")
  rentPrc: string;             // 월세 문자열 (e.g. "50")
  areaName: string;            // 면적 표시 (e.g. "84/59")
  area1: number;               // 공급면적 (m2)
  area2: number;               // 전용면적 (m2)
  direction: string;           // 방향
  articleConfirmYmd: string;   // 확인일자 (YYYYMMDD 또는 YY.MM.DD)
  latitude: number;            // 위도
  longitude: number;           // 경도
  articleFeatureDesc: string;  // 매물 특징 설명
  tagList: string[];           // 태그 목록
  buildingName: string;        // 건물명
  cpName: string;              // 중개업소명
  realtorName: string;         // 중개사명
  representativeImgUrl: string; // 대표 이미지 URL (전체 URL)
  cpid: string;                // 중개사 ID
  sameAddrCnt: number;         // 같은 주소 매물 수
  sameAddrDirectCnt: number;   // 같은 주소 직거래 매물 수
  cortarNo?: string;           // 법정동코드
}

/** 네이버 complexList API 응답 아이템 */
export interface NaverComplexItem {
  hscpNo: string;          // 단지번호
  hscpNm: string;          // 단지명
  cortarNo: string;        // 법정동코드
  totAtclCnt: number;      // 총 매물 수
  lat: number;             // 위도
  lng: number;             // 경도
}

/** 네이버 complexList API 응답 */
export interface NaverComplexListResponse {
  result: NaverComplexItem[];
}

/** 네이버 getComplexArticleList API 응답 */
export interface NaverComplexArticleListResponse {
  result: {
    list: NaverComplexArticleItem[];
    moreDataYn: string;    // "Y" or "N"
  };
}

/** 네이버 단지별 매물 아이템 */
export interface NaverComplexArticleItem {
  atclNo: string;          // 매물번호
  atclNm: string;          // 매물명
  rletTpNm: string;        // 부동산유형명
  tradTpNm: string;        // 거래유형명
  flrInfo: string;         // 층 정보
  prc: number;             // 가격 (만원)
  hanPrc: string;          // 한글 가격
  rentPrc: number;         // 월세 (만원)
  spc1: number;            // 공급면적
  spc2: number;            // 전용면적
  direction: string;       // 방향
  atclCfmYmd: string;      // 확인일자
  lat: number;             // 위도
  lng: number;             // 경도
  atclFetrDesc: string;    // 매물 특징
  tagList: string[];       // 태그 목록
  bildNm: string;          // 건물명
  cpNm: string;            // 중개업소명
  rltrNm: string;          // 중개사명
  repImgUrl: string;       // 대표 이미지
  repImgThumb: string;     // 썸네일 타입
  cortarNo?: string;       // 법정동코드
}
