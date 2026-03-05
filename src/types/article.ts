/** 거래 유형 */
export type TradeType = "SALE" | "JEONSE" | "MONTHLY";

/** 건물 유형 */
export type BuildingType = "APT" | "VILLA" | "OFFICETEL";

/** 매물 핵심 정보 */
export interface Article {
  id: string;                    // 네이버 매물 고유 ID (articleNo)
  tradeType: TradeType;          // 거래 유형
  buildingType: BuildingType;    // 건물 유형
  articleName: string;           // 매물명 (단지명 또는 건물명)

  // 위치 정보
  address: string;               // 지번 주소
  roadAddress: string;           // 도로명 주소
  gu: string;                    // 구 (예: "강남구")
  dong: string;                  // 동 (예: "역삼동")
  lat: number;                   // 위도
  lng: number;                   // 경도

  // 가격 정보
  dealPrice: number | null;      // 매매가 (만원 단위)
  deposit: number | null;        // 보증금 (만원 단위)
  monthlyRent: number | null;    // 월세 (만원 단위)
  priceText: string;             // 원본 가격 텍스트 ("3억 5,000")

  // 면적 정보
  supplyArea: number;            // 공급면적 (m2)
  exclusiveArea: number;         // 전용면적 (m2)
  supplyAreaPyeong: number;      // 공급면적 (평)
  exclusiveAreaPyeong: number;   // 전용면적 (평)

  // 건물 정보
  floor: string;                 // 층수 ("3/15")
  totalFloor: number;            // 총 층수
  buildYear: string | null;      // 건축년도
  direction: string | null;      // 방향 ("남향", "동향" 등)
  roomCount: number | null;      // 방 수
  bathroomCount: number | null;  // 욕실 수

  // 메타
  description: string;           // 매물 설명
  confirmDate: string;           // 확인일자
  agentName: string;             // 중개사
  articleUrl: string;            // 네이버부동산 원본 링크

  // 이미지
  thumbnailUrl: string | null;   // 썸네일 이미지 URL

  // 상세 정보 가용 여부
  hasDetailInfo: boolean;        // 상세 API 성공 여부
}
