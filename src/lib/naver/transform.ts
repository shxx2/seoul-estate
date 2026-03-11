import type { Article, TradeType, BuildingType } from "@/types/article";
import { NAVER_TRADE_TYPE_MAP, NAVER_BUILDING_TYPE_MAP } from "@/lib/constants";
import { m2ToPyeong, parseFloorInfo } from "@/lib/format";
import type { NaverArticleItem } from "./types";
import seoulDistricts from "../../../public/data/seoul-districts.json";

/** cortarNo 앞 4자리 → 구 코드 매핑 (불완전한 동 데이터 fallback) */
const CORTAR_PREFIX_TO_GU: Record<string, string> = {
  "1111": "종로구",
  "1114": "중구",
  "1117": "용산구",
  "1120": "성동구",
  "1121": "광진구",
  "1123": "동대문구",
  "1126": "중랑구",
  "1129": "성북구",
  "1130": "강북구",
  "1132": "도봉구",
  "1135": "노원구",
  "1138": "은평구",
  "1141": "서대문구",
  "1144": "마포구",
  "1147": "양천구",
  "1150": "강서구",
  "1153": "구로구",
  "1154": "금천구",
  "1156": "영등포구",
  "1159": "동작구",
  "1162": "관악구",
  "1165": "서초구",
  "1168": "강남구",
  "1171": "송파구",
  "1174": "강동구",
};

/** cortarNo로 구/동 이름 조회 */
function getGuDongFromCortarNo(cortarNo: string): { gu: string; dong: string } {
  if (!cortarNo) return { gu: "", dong: "" };

  // 1. 구 코드로 직접 조회
  for (const district of seoulDistricts.districts) {
    if (district.cortarNo === cortarNo) {
      return { gu: district.name, dong: "" };
    }
    // 동 코드로 조회
    const dong = district.dongs.find((d) => d.cortarNo === cortarNo);
    if (dong) {
      return { gu: district.name, dong: dong.name };
    }
  }

  // 2. Fallback: cortarNo 앞 4자리로 구 매핑
  const prefix = cortarNo.slice(0, 4);
  const guName = CORTAR_PREFIX_TO_GU[prefix];
  if (guName) {
    return { gu: guName, dong: "" };
  }

  return { gu: "", dong: "" };
}

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

  // cortarNo로 구/동 정보 추출
  const { gu, dong } = getGuDongFromCortarNo(raw.cortarNo || "");

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
    articleUrl: `https://m.land.naver.com/article/info/${raw.atclNo}`,

    // 이미지 (네이버 CDN 전체 URL 생성)
    thumbnailUrl: raw.repImgUrl
      ? `https://landthumb-phinf.pstatic.net${raw.repImgUrl}?type=${raw.repImgThumb || "f130_98"}`
      : null,

    // 상세 정보 가용 여부 (기본 false, 상세 API 호출 후 업데이트)
    hasDetailInfo: false,
  };
}
