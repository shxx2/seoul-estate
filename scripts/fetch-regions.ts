/**
 * 서울 구/동 데이터 수집 스크립트
 *
 * 실행 방법: pnpm fetch-regions 또는 npx tsx scripts/fetch-regions.ts
 *
 * 호출 순서:
 * 1. cortarNo=1100000000 (서울) -> 25개 구 목록 (1회)
 * 2. 각 구의 cortarNo -> 해당 구의 동 목록 (25회)
 * 총 26회 API 호출
 *
 * Rate Limiting: 각 호출 간 1초 대기
 *
 * 출력: public/data/seoul-districts.json
 */

import fs from "fs";
import path from "path";

const SEOUL_CORTAR_NO = "1100000000";
const OUTPUT_PATH = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../public/data/seoul-districts.json"
);
const DELAY_MS = 1000;

const NAVER_REGIONS_URL =
  "https://new.land.naver.com/api/regions/list?cortarNo=";

const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Referer: "https://new.land.naver.com/",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "ko-KR,ko;q=0.9",
};

/** 네이버 지역 API 응답 타입 */
interface NaverRegionItem {
  cortarNo: string;
  cortarNm: string;
  centerLat?: number;
  centerLon?: number;
  cortarType?: string;
}

interface NaverRegionResponse {
  regionList?: NaverRegionItem[];
}

/** 출력 JSON 구조 */
interface DongEntry {
  cortarNo: string;
  name: string;
  lat: number;
  lng: number;
  bounds: {
    sw: [number, number];
    ne: [number, number];
  };
}

interface DistrictEntry {
  cortarNo: string;
  name: string;
  lat: number;
  lng: number;
  bounds: {
    sw: [number, number];
    ne: [number, number];
  };
  dongs: DongEntry[];
}

interface OutputData {
  generatedAt: string;
  districts: DistrictEntry[];
}

/** 지연 함수 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 네이버 지역 API 호출 */
async function fetchRegions(cortarNo: string): Promise<NaverRegionItem[]> {
  const url = `${NAVER_REGIONS_URL}${cortarNo}`;
  console.log(`  Fetching: ${url}`);

  const res = await fetch(url, { headers: HEADERS });

  if (!res.ok) {
    console.warn(
      `  Warning: HTTP ${res.status} for cortarNo=${cortarNo}. Skipping.`
    );
    return [];
  }

  let json: NaverRegionResponse;
  try {
    json = (await res.json()) as NaverRegionResponse;
  } catch {
    console.warn(`  Warning: Failed to parse JSON for cortarNo=${cortarNo}`);
    return [];
  }

  return json.regionList ?? [];
}

/**
 * centerLat/centerLon이 없을 때 bounds를 추정하는 fallback.
 * bounds가 있으면 중심값을 계산하고, 없으면 기본값 0,0 반환.
 */
function estimateBounds(
  lat: number,
  lng: number,
  isDistrict: boolean
): { sw: [number, number]; ne: [number, number] } {
  // 구 단위: 약 ±0.03도 (약 3km), 동 단위: 약 ±0.01도 (약 1km)
  const delta = isDistrict ? 0.03 : 0.01;
  return {
    sw: [
      Math.round((lat - delta) * 10000) / 10000,
      Math.round((lng - delta) * 10000) / 10000,
    ],
    ne: [
      Math.round((lat + delta) * 10000) / 10000,
      Math.round((lng + delta) * 10000) / 10000,
    ],
  };
}

async function main() {
  console.log("=== 서울 구/동 데이터 수집 시작 ===");
  console.log(`출력 경로: ${OUTPUT_PATH}`);
  console.log(`Rate limit: ${DELAY_MS}ms 간격\n`);

  // 1단계: 서울 25개 구 목록 조회
  console.log("[1/2] 서울 25개 구 목록 조회...");
  const guList = await fetchRegions(SEOUL_CORTAR_NO);

  if (guList.length === 0) {
    console.error(
      "구 목록을 가져오지 못했습니다. 네이버 API 응답을 확인하세요."
    );
    process.exit(1);
  }

  console.log(`  -> ${guList.length}개 구 발견\n`);

  // 2단계: 각 구의 동 목록 조회
  console.log("[2/2] 각 구의 동 목록 조회...");
  const districts: DistrictEntry[] = [];

  for (let i = 0; i < guList.length; i++) {
    const gu = guList[i];
    console.log(`  [${i + 1}/${guList.length}] ${gu.cortarNm} (${gu.cortarNo})`);

    const guLat = gu.centerLat ?? 37.5665;
    const guLng = gu.centerLon ?? 126.978;
    const guBounds = estimateBounds(guLat, guLng, true);

    // 동 목록 조회
    await delay(DELAY_MS);
    const dongList = await fetchRegions(gu.cortarNo);
    console.log(`    -> ${dongList.length}개 동 발견`);

    const dongs: DongEntry[] = dongList.map((dong) => {
      const dongLat = dong.centerLat ?? guLat;
      const dongLng = dong.centerLon ?? guLng;
      const dongBounds = estimateBounds(dongLat, dongLng, false);

      return {
        cortarNo: dong.cortarNo,
        name: dong.cortarNm,
        lat: dongLat,
        lng: dongLng,
        bounds: dongBounds,
      };
    });

    districts.push({
      cortarNo: gu.cortarNo,
      name: gu.cortarNm,
      lat: guLat,
      lng: guLng,
      bounds: guBounds,
      dongs,
    });
  }

  // 3단계: JSON 저장
  const output: OutputData = {
    generatedAt: new Date().toISOString(),
    districts,
  };

  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf-8");

  console.log("\n=== 완료 ===");
  console.log(`구 수: ${districts.length}`);
  console.log(
    `총 동 수: ${districts.reduce((acc, d) => acc + d.dongs.length, 0)}`
  );
  console.log(`저장 위치: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("오류 발생:", err);
  process.exit(1);
});
