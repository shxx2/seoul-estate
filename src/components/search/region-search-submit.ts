import { searchRegions } from "@/lib/region-lookup";
import type { Region } from "@/types/region";
import seoulDistricts from "../../../public/data/seoul-districts.json";

export interface RegionSearchSubmission {
  label: string;
  guCode: string | null;
  dongCode: string | null;
}

export interface ResolveRegionSearchSubmissionOptions {
  query: string;
  visibleResults: Region[];
  selectedLabel: string | null;
  currentGuCode: string | null;
  currentDongCode: string | null;
}

export function isDistrictCode(cortarNo: string): boolean {
  return seoulDistricts.districts.some((district) => district.cortarNo === cortarNo);
}

export function shouldClearRegionSelection(
  query: string,
  selectedLabel: string | null
): boolean {
  const trimmed = query.trim();
  if (!selectedLabel) {
    return trimmed.length === 0;
  }

  return trimmed.length === 0 || trimmed !== selectedLabel;
}

export function resolveRegionSearchSubmission({
  query,
  visibleResults,
  selectedLabel,
  currentGuCode,
  currentDongCode,
}: ResolveRegionSearchSubmissionOptions): RegionSearchSubmission | null {
  const trimmed = query.trim();
  if (!trimmed) {
    return null;
  }

  if (
    selectedLabel &&
    trimmed === selectedLabel &&
    (currentGuCode || currentDongCode)
  ) {
    return {
      label: selectedLabel,
      guCode: currentGuCode,
      dongCode: currentDongCode,
    };
  }

  const exactMatch = visibleResults.find((region) => region.name === trimmed);
  const candidate = exactMatch ?? visibleResults[0] ?? searchRegions(trimmed, 1)[0];
  if (!candidate) {
    return null;
  }

  const district = isDistrictCode(candidate.cortarNo);
  return {
    label: candidate.name,
    guCode: district ? candidate.cortarNo : null,
    dongCode: district ? null : candidate.cortarNo,
  };
}
