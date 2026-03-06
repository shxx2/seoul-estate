/**
 * 서울 구 경계 GeoJSON 다운로드 및 처리 스크립트
 *
 * 실행 방법: npx tsx scripts/prepare-geojson.ts
 *
 * 소스: https://github.com/southkorea/seoul-maps
 * 출력: public/data/seoul-gu-boundaries.json
 *
 * 형식: { [cortarNo: string]: { lat: number, lng: number }[][] }
 * - 외부 배열: 폴리곤 목록 (MultiPolygon 지원)
 * - 내부 배열: 각 폴리곤의 좌표 목록
 */

import fs from "fs";
import path from "path";

const GEOJSON_URL =
  "https://raw.githubusercontent.com/southkorea/seoul-maps/master/juso/2015/json/seoul_municipalities_geo.json";

const DISTRICTS_PATH = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../public/data/seoul-districts.json"
);

const OUTPUT_PATH = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../public/data/seoul-gu-boundaries.json"
);

/** GeoJSON 타입 정의 */
interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: number[][][];
}

interface GeoJSONMultiPolygon {
  type: "MultiPolygon";
  coordinates: number[][][][];
}

interface GeoJSONFeature {
  type: "Feature";
  properties: {
    SIG_CD: string;
    SIG_ENG_NM: string;
    SIG_KOR_NM: string;
    [key: string]: unknown;
  };
  geometry: GeoJSONPolygon | GeoJSONMultiPolygon;
}

interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

/** seoul-districts.json 타입 */
interface DistrictEntry {
  cortarNo: string;
  name: string;
}

interface SeoulDistrictsData {
  districts: DistrictEntry[];
}

/** 출력 형식 */
interface LatLng {
  lat: number;
  lng: number;
}

type BoundaryMap = Record<string, LatLng[][]>;

/**
 * [lng, lat] 좌표 배열을 { lat, lng } 객체 배열로 변환
 * GeoJSON 표준은 [경도, 위도] 순서
 */
function convertRing(ring: number[][]): LatLng[] {
  return ring.map(([lng, lat]) => ({
    lat: Math.round(lat * 1e6) / 1e6,
    lng: Math.round(lng * 1e6) / 1e6,
  }));
}

/**
 * Polygon geometry -> LatLng[][] (외부 링만 사용, 내부 구멍 제외)
 */
function polygonToRings(geometry: GeoJSONPolygon): LatLng[][] {
  // coordinates[0]이 외부 링, 나머지는 구멍(hole)
  return [convertRing(geometry.coordinates[0])];
}

/**
 * MultiPolygon geometry -> LatLng[][] (각 폴리곤의 외부 링)
 */
function multiPolygonToRings(geometry: GeoJSONMultiPolygon): LatLng[][] {
  return geometry.coordinates.map((polygon) => convertRing(polygon[0]));
}

async function main() {
  console.log("=== 서울 구 경계 GeoJSON 처리 시작 ===\n");

  // 1단계: 기존 seoul-districts.json 로드하여 cortarNo 목록 파악
  console.log("[1/4] seoul-districts.json 로드...");
  if (!fs.existsSync(DISTRICTS_PATH)) {
    console.error(`파일을 찾을 수 없습니다: ${DISTRICTS_PATH}`);
    process.exit(1);
  }

  const districtsRaw = fs.readFileSync(DISTRICTS_PATH, "utf-8");
  const districtsData = JSON.parse(districtsRaw) as SeoulDistrictsData;
  const districts = districtsData.districts;

  // SIG_CD(5자리) -> cortarNo(10자리) 매핑 구성
  // cortarNo 앞 5자리가 SIG_CD와 일치 (예: "1111000000" -> "11110")
  const sigCdToCortarNo = new Map<string, string>();
  for (const d of districts) {
    const sigCd = d.cortarNo.slice(0, 5);
    sigCdToCortarNo.set(sigCd, d.cortarNo);
  }

  console.log(`  -> ${districts.length}개 구 로드됨`);
  console.log(`  -> SIG_CD 매핑 예시:`);
  const exampleEntries = Array.from(sigCdToCortarNo.entries()).slice(0, 3);
  for (const [sig, cortar] of exampleEntries) {
    console.log(`     ${sig} -> ${cortar}`);
  }

  // 2단계: GeoJSON 다운로드
  console.log(`\n[2/4] GeoJSON 다운로드...`);
  console.log(`  URL: ${GEOJSON_URL}`);

  let geojson: GeoJSONFeatureCollection;
  try {
    const res = await fetch(GEOJSON_URL);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    geojson = (await res.json()) as GeoJSONFeatureCollection;
  } catch (err) {
    console.error(`  다운로드 실패: ${err}`);
    process.exit(1);
  }

  if (geojson.type !== "FeatureCollection") {
    console.error(`  예상치 못한 GeoJSON 타입: ${geojson.type}`);
    process.exit(1);
  }

  console.log(`  -> ${geojson.features.length}개 Feature 로드됨`);

  // 3단계: Feature -> 경계 좌표 변환
  console.log("\n[3/4] 좌표 변환 및 cortarNo 매핑...");

  const boundaryMap: BoundaryMap = {};
  const unmapped: string[] = [];

  for (const feature of geojson.features) {
    const { properties, geometry } = feature;
    const sigCd = properties.SIG_CD;
    const name = properties.SIG_KOR_NM;

    const cortarNo = sigCdToCortarNo.get(sigCd);
    if (!cortarNo) {
      unmapped.push(`${sigCd} (${name})`);
      continue;
    }

    let rings: LatLng[][];
    if (geometry.type === "Polygon") {
      rings = polygonToRings(geometry);
    } else if (geometry.type === "MultiPolygon") {
      rings = multiPolygonToRings(geometry);
    } else {
      console.warn(`  알 수 없는 geometry 타입: ${(geometry as { type: string }).type} (${name})`);
      continue;
    }

    boundaryMap[cortarNo] = rings;

    const totalPoints = rings.reduce((sum, r) => sum + r.length, 0);
    console.log(
      `  [${sigCd}] ${name} -> ${cortarNo} | ${rings.length}개 폴리곤, ${totalPoints}개 좌표점`
    );
  }

  if (unmapped.length > 0) {
    console.warn(`\n  매핑 실패한 SIG_CD: ${unmapped.join(", ")}`);
  }

  // 4단계: JSON 저장
  console.log(`\n[4/4] JSON 저장...`);

  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputJson = JSON.stringify(boundaryMap);
  fs.writeFileSync(OUTPUT_PATH, outputJson, "utf-8");

  const fileSizeBytes = fs.statSync(OUTPUT_PATH).size;
  const fileSizeKB = (fileSizeBytes / 1024).toFixed(1);
  const fileSizeMB = (fileSizeBytes / 1024 / 1024).toFixed(2);

  console.log("\n=== 완료 ===");
  console.log(`저장 위치: ${OUTPUT_PATH}`);
  console.log(`처리된 구 수: ${Object.keys(boundaryMap).length}`);
  console.log(`파일 크기: ${fileSizeKB} KB (${fileSizeMB} MB)`);

  if (unmapped.length > 0) {
    console.warn(`주의: ${unmapped.length}개 구가 매핑되지 않았습니다.`);
  }
}

main().catch((err) => {
  console.error("오류 발생:", err);
  process.exit(1);
});
