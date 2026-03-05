import type { TradeType, BuildingType } from "@/types/article";

// ===== 네이버 API 코드 매핑 =====

/** 부동산 유형 코드 (rletTpCd) - 내부 BuildingType -> 네이버 코드 */
export const BUILDING_TYPE_TO_NAVER: Record<BuildingType, string> = {
  APT: "APT",
  VILLA: "VL",
  OFFICETEL: "OPST",
};

/** 네이버 부동산 유형명 -> 내부 BuildingType */
export const NAVER_BUILDING_TYPE_MAP: Record<string, BuildingType> = {
  아파트: "APT",
  빌라: "VILLA",
  연립: "VILLA",
  다세대: "VILLA",
  오피스텔: "OFFICETEL",
};

/** 거래 유형 코드 (tradTpCd) - 내부 TradeType -> 네이버 코드 */
export const TRADE_TYPE_TO_NAVER: Record<TradeType, string> = {
  SALE: "A1",
  JEONSE: "B1",
  MONTHLY: "B2",
};

/** 네이버 거래 유형명 -> 내부 TradeType */
export const NAVER_TRADE_TYPE_MAP: Record<string, TradeType> = {
  매매: "SALE",
  전세: "JEONSE",
  월세: "MONTHLY",
};

/** 내부 TradeType -> 표시 레이블 */
export const TRADE_TYPE_LABEL: Record<TradeType, string> = {
  SALE: "매매",
  JEONSE: "전세",
  MONTHLY: "월세",
};

/** 내부 BuildingType -> 표시 레이블 */
export const BUILDING_TYPE_LABEL: Record<BuildingType, string> = {
  APT: "아파트",
  VILLA: "빌라",
  OFFICETEL: "오피스텔",
};

// ===== 가격 슬라이더 범위 정의 =====

/** 매매가 슬라이더 설정 (만원 단위) */
export const DEAL_PRICE_RANGE = {
  min: 0,
  max: 500000,        // 50억
  step: 1000,         // 기본 1000만원 스텝
  stepHighThreshold: 100000, // 10억 이상부터 스텝 변경
  stepHigh: 5000,     // 10억 이상 5000만원 스텝
} as const;

/** 보증금 슬라이더 설정 (만원 단위) */
export const DEPOSIT_RANGE = {
  min: 0,
  max: 200000,        // 20억
  step: 500,          // 500만원 스텝
} as const;

/** 월세 슬라이더 설정 (만원 단위) */
export const MONTHLY_RENT_RANGE = {
  min: 0,
  max: 500,           // 500만원
  step: 10,           // 10만원 스텝
} as const;

/** 전용면적 슬라이더 설정 (m2 단위) */
export const AREA_RANGE = {
  min: 0,
  max: 330,           // 약 100평
  step: 3.3,          // 1평 단위
} as const;

// ===== 서울시 구 cortarNo 목록 =====

/** 서울 25개 구의 법정동코드 */
export const SEOUL_DISTRICT_CODES: Record<string, string> = {
  "1111000000": "종로구",
  "1114000000": "중구",
  "1117000000": "용산구",
  "1120000000": "성동구",
  "1121500000": "광진구",
  "1123000000": "동대문구",
  "1126000000": "중랑구",
  "1129000000": "성북구",
  "1130500000": "강북구",
  "1132000000": "도봉구",
  "1135000000": "노원구",
  "1138000000": "은평구",
  "1141000000": "서대문구",
  "1144000000": "마포구",
  "1147000000": "양천구",
  "1150000000": "강서구",
  "1153000000": "구로구",
  "1154500000": "금천구",
  "1156000000": "영등포구",
  "1159000000": "동작구",
  "1162000000": "관악구",
  "1165000000": "서초구",
  "1168000000": "강남구",
  "1171000000": "송파구",
  "1174000000": "강동구",
};

// ===== 네이버 API 관련 상수 =====

/** 구 단위 조회 시 줌 레벨 */
export const ZOOM_LEVEL_GU = 13;

/** 동 단위 조회 시 줌 레벨 */
export const ZOOM_LEVEL_DONG = 15;

/** 서버 사이드 캐시 TTL (밀리초) - 5분 */
export const CACHE_TTL_MS = 5 * 60 * 1000;

/** 네이버 API 요청 간 최소 간격 (밀리초) */
export const NAVER_REQUEST_DELAY_MS = 500;

/** 네이버 API 최대 재시도 횟수 */
export const NAVER_MAX_RETRIES = 3;

/** 매물 상세 API 타임아웃 (밀리초) */
export const DETAIL_API_TIMEOUT_MS = 5000;
