import test from "node:test";
import assert from "node:assert/strict";

import { searchRegions } from "@/lib/region-lookup";
import {
  resolveRegionSearchSubmission,
  shouldClearRegionSelection,
} from "./region-search-submit";

test("search button resolves a typed district query to a district selection", () => {
  const selection = resolveRegionSearchSubmission({
    query: "강남구",
    visibleResults: searchRegions("강남구", 10),
    selectedLabel: null,
    currentGuCode: null,
    currentDongCode: null,
  });

  assert.deepEqual(selection, {
    label: "강남구",
    guCode: "1168000000",
    dongCode: null,
  });
});

test("dong selections clear any stale district code before submitting a search", () => {
  const [yeoksamDong] = searchRegions("역삼동", 10);

  assert.ok(yeoksamDong);
  assert.deepEqual(
    resolveRegionSearchSubmission({
      query: "역삼동",
      visibleResults: [yeoksamDong],
      selectedLabel: null,
      currentGuCode: "1168000000",
      currentDongCode: null,
    }),
    {
      label: yeoksamDong.name,
      guCode: null,
      dongCode: yeoksamDong.cortarNo,
    }
  );
});

test("search button preserves the current selected region when the input label is unchanged", () => {
  assert.deepEqual(
    resolveRegionSearchSubmission({
      query: "강남구",
      visibleResults: [],
      selectedLabel: "강남구",
      currentGuCode: "1168000000",
      currentDongCode: null,
    }),
    {
      label: "강남구",
      guCode: "1168000000",
      dongCode: null,
    }
  );
});

test("editing a selected region label clears the stale region codes from draft state", () => {
  assert.equal(shouldClearRegionSelection("강남", "강남구"), true);
  assert.equal(shouldClearRegionSelection("   ", "강남구"), true);
  assert.equal(shouldClearRegionSelection("강남구", "강남구"), false);
});

test("blank region queries do not override the current applied filters", () => {
  assert.equal(
    resolveRegionSearchSubmission({
      query: "   ",
      visibleResults: [],
      selectedLabel: null,
      currentGuCode: "1168000000",
      currentDongCode: null,
    }),
    null
  );
});
