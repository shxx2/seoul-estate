import { getPolygonByCortarNo } from "@/lib/geojson-loader";
import { getRegionPolygon as getFallbackPolygon } from "@/lib/region-lookup";

export type RegionPolygon = { lat: number; lng: number }[][];

type PolygonLoader = (cortarNo: string) => Promise<RegionPolygon | null>;

export async function resolveRegionPolygon(
  cortarNo: string,
  loadPolygon: PolygonLoader = getPolygonByCortarNo
): Promise<RegionPolygon | null> {
  try {
    const polygon = await loadPolygon(cortarNo);
    if (polygon) {
      return polygon;
    }
  } catch (error) {
    console.error("[RegionPolygon] Failed to load geojson polygon:", cortarNo, error);
  }

  const fallback = getFallbackPolygon(cortarNo);
  return fallback ? [fallback] : null;
}
