import type { Article, TradeType, BuildingType } from "@/types/article";
import { NAVER_TRADE_TYPE_MAP, NAVER_BUILDING_TYPE_MAP } from "@/lib/constants";
import { m2ToPyeong, parseFloorInfo } from "@/lib/format";
import type { NaverArticleItem } from "./types";

/** 네이버 응답 필드를 내부 Article 모델로 변환 */
export function transformNaverArticle(raw: NaverArticleItem): Article {
  // 거래 유형 매핑
  const tradeType: TradeType = NAVER_TRADE_TYPE_MAP[raw.tradTpNm] ?? "SALE";

  // 건물 유형 매핑
  const buildingType: BuildingType =
    NAVER_BUILDING_TYPE_MAP[raw.rletTpNm] ?? "APT";

  // 가격 처리 (거래 유형에 따라 분기)
  let dealPrice: number | null = null;
  let deposit: number | null = null;
  let monthlyRent: number | null = null;

  if (tradeType === "SALE") {
    dealPrice = raw.prc > 0 ? raw.prc : null;
  } else if (tradeType === "JEONSE") {
    deposit = raw.prc > 0 ? raw.prc : null;
  } else if (tradeType === "MONTHLY") {
    deposit = raw.prc > 0 ? raw.prc : null;
    monthlyRent = raw.rentPrc > 0 ? raw.rentPrc : null;
  }

  // 면적 처리
  const supplyArea = Number(raw.spc1) || 0;
  const exclusiveArea = Number(raw.spc2) || 0;

  // 층 정보 파싱
  const { floor, totalFloor } = parseFloorInfo(raw.flrInfo ?? "");

  // tagList에서 구/동 추출 시도, 없으면 빈 문자열
  const gu = "";
  const dong = "";

  // 중개사명 (우선순위: cpNm -> rltrNm)
  const agentName = raw.cpNm || raw.rltrNm || "";

  return {
    id: raw.atclNo,
    tradeType,
    buildingType,
    articleName: raw.atclNm || raw.bildNm || "",

    // 위치 (상세 API로 보완 필요)
    address: "",
    roadAddress: "",
    gu,
    dong,
    lat: Number(raw.lat) || 0,
    lng: Number(raw.lng) || 0,

    // 가격
    dealPrice,
    deposit,
    monthlyRent,
    priceText: raw.hanPrc ?? "",

    // 면적
    supplyArea,
    exclusiveArea,
    supplyAreaPyeong: m2ToPyeong(supplyArea),
    exclusiveAreaPyeong: m2ToPyeong(exclusiveArea),

    // 건물 정보
    floor,
    totalFloor,
    buildYear: null,
    direction: raw.direction || null,
    roomCount: null,
    bathroomCount: null,

    // 메타
    description: raw.atclFetrDesc ?? "",
    confirmDate: raw.atclCfmYmd ?? "",
    agentName,
    articleUrl: `https://m.land.naver.com/article/${raw.atclNo}`,

    // 이미지 (네이버 CDN 전체 URL 생성)
    thumbnailUrl: raw.repImgUrl
      ? `https://landthumb-phinf.pstatic.net${raw.repImgUrl}?type=${raw.repImgThumb || "f130_98"}`
      : null,

    // 상세 정보 가용 여부 (기본 false, 상세 API 호출 후 업데이트)
    hasDetailInfo: false,
  };
}
