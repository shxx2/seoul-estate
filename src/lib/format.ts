/** m2를 평으로 변환 (1평 = 3.3058m2) */
export function m2ToPyeong(m2: number): number {
  return Math.round((m2 / 3.3058) * 10) / 10;
}

/**
 * 만원 단위 금액을 한글 표기로 변환
 * 예: 35000 -> "3억 5,000", 150000 -> "15억", 500 -> "500"
 */
export function formatPrice(priceInManwon: number): string {
  if (priceInManwon <= 0) return "-";

  const eok = Math.floor(priceInManwon / 10000);
  const man = priceInManwon % 10000;

  if (eok > 0 && man > 0) {
    return `${eok}억 ${man.toLocaleString("ko-KR")}`;
  }
  if (eok > 0) {
    return `${eok}억`;
  }
  return priceInManwon.toLocaleString("ko-KR");
}

/**
 * m2 면적을 포맷 (m2 + 평 병기)
 * 예: 85.5 -> "85.5㎡ (25.8평)"
 */
export function formatArea(areaInM2: number): string {
  if (areaInM2 <= 0) return "-";
  const pyeong = m2ToPyeong(areaInM2);
  return `${areaInM2}㎡ (${pyeong}평)`;
}

/**
 * 네이버 층 정보 문자열 파싱
 * 예: "3/15" -> { floor: "3", totalFloor: 15 }
 *      "고/15" -> { floor: "고", totalFloor: 15 }
 *      "" -> { floor: "-", totalFloor: 0 }
 */
export function parseFloorInfo(floorStr: string): {
  floor: string;
  totalFloor: number;
} {
  if (!floorStr) return { floor: "-", totalFloor: 0 };

  const parts = floorStr.split("/");
  const floor = parts[0]?.trim() || "-";
  const totalFloor = parts[1] ? parseInt(parts[1].trim(), 10) || 0 : 0;

  return { floor, totalFloor };
}
