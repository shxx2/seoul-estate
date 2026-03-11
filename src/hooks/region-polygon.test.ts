import test from "node:test";
import assert from "node:assert/strict";

import { resolveRegionPolygon } from "./region-polygon";

test("falls back to a rectangle polygon when geojson loading fails", async () => {
  const polygon = await resolveRegionPolygon(
    "1168000000",
    async () => {
      throw new TypeError("Failed to fetch");
    }
  );

  assert.ok(polygon);
  assert.equal(polygon?.length, 1);
  assert.equal(polygon?.[0]?.length, 4);
});

test("returns the geojson polygon when loading succeeds", async () => {
  const polygon = await resolveRegionPolygon("1168000000", async () => [
    [
      { lat: 37.1, lng: 127.1 },
      { lat: 37.2, lng: 127.2 },
      { lat: 37.3, lng: 127.3 },
    ],
  ]);

  assert.deepEqual(polygon, [
    [
      { lat: 37.1, lng: 127.1 },
      { lat: 37.2, lng: 127.2 },
      { lat: 37.3, lng: 127.3 },
    ],
  ]);
});
