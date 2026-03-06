# Seoul Administrative Boundary Polygon Implementation

**Created:** 2026-03-06
**Status:** Draft
**Scope:** Replace bounds-based rectangle polygons with real GeoJSON administrative boundary polygons

---

## Context

Currently, `getRegionPolygon()` in `/Users/sehyunshin/play/estate/src/lib/region-lookup.ts` converts bounding box (sw/ne) coordinates into a simple rectangle polygon. This produces visually inaccurate boundaries on the Kakao map. The goal is to display actual administrative boundary shapes (구/동 level) using GeoJSON polygon data.

### Current Architecture
- **Data source:** `public/data/seoul-districts.json` -- contains 25 districts with bounds (sw/ne) only, no polygon coordinates
- **Polygon generator:** `getRegionPolygon()` in `src/lib/region-lookup.ts` -- returns 4-point rectangle from bounds
- **Rendering:** `RegionPolygon` component in `src/components/map/RegionPolygon.tsx` -- wraps `react-kakao-maps-sdk` `<Polygon>`
- **Consumer:** `page.tsx` -- computes `regionPolygonPath` via `useMemo` and passes to `<RegionPolygon>`
- **Lookup key:** `cortarNo` (법정동코드, e.g., `"1168000000"` for 강남구)

### Key Constraints
- Next.js 14 with `react-kakao-maps-sdk ^1.2.1`
- `<Polygon>` accepts `path: { lat: number; lng: number }[]` or nested arrays for multi-polygon
- GeoJSON coordinates are `[longitude, latitude]` (reversed from Kakao's `{ lat, lng }`)
- Total Seoul GeoJSON (25 districts + ~400 dongs) can be 5-15MB uncompressed

---

## Work Objectives

1. Obtain and integrate real Seoul administrative boundary GeoJSON data (구 + 동 level)
2. Implement efficient data loading strategy appropriate for file sizes
3. Update `getRegionPolygon()` to return actual boundary coordinates
4. Ensure `RegionPolygon` component handles multi-polygon geometries
5. Optimize polygon rendering performance

---

## Guardrails

### Must Have
- Real boundary shapes for all 25 Seoul 구 (districts)
- Real boundary shapes for 동 (dong) level where data is available
- Coordinate conversion from GeoJSON `[lng, lat]` to Kakao `{ lat, lng }`
- No regression in existing bounds-based API calls (`cortarNoToBounds` must remain functional)
- Graceful fallback to rectangle if GeoJSON data is missing for a region

### Must NOT Have
- Server-side polygon rendering or SSR dependency for polygon data
- External runtime API calls for boundary data (data must be static/bundled)
- Breaking changes to `RegionPolygon` props interface without updating all consumers
- Removal of existing `BoundsParams` / `cortarNoToBounds` functionality

---

## Task Flow

```
[Step 1: GeoJSON Data] --> [Step 2: Data Loading] --> [Step 3: region-lookup.ts] --> [Step 4: RegionPolygon] --> [Step 5: Optimization]
```

---

## Step 1: Prepare GeoJSON Data Files

**Objective:** Obtain and structure Seoul administrative boundary GeoJSON data for both 구 and 동 levels.

**Data Source Options (pick one):**
- Korea Statistical Geographic Information Service (SGIS) - 통계지리정보서비스
- Korea Open Data Portal (data.go.kr) - 행정구역 경계 데이터
- GitHub community repositories (e.g., `southkorea/seoul-maps`, `vuski/admdongkor`)

**File structure:**
```
public/data/
  seoul-gu-boundaries.json       # 25 districts (~500KB-1MB simplified)
  seoul-dong-boundaries.json     # ~400 dongs (~3-5MB simplified)
```

**GeoJSON format per file:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "cortarNo": "1168000000",
        "name": "강남구"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lng, lat], [lng, lat], ...]]
      }
    }
  ]
}
```

**Tasks:**
1. Create a script `scripts/prepare-geojson.ts` that:
   - Downloads or reads raw boundary data
   - Maps each feature's administrative code to the `cortarNo` format used in `seoul-districts.json`
   - Outputs two JSON files: `seoul-gu-boundaries.json` and `seoul-dong-boundaries.json`
   - Applies Douglas-Peucker simplification (tolerance ~0.0005 for 구, ~0.0003 for 동) to reduce file sizes
2. Add `"prepare-geojson": "tsx scripts/prepare-geojson.ts"` to `package.json` scripts
3. Validate that every `cortarNo` in `seoul-districts.json` has a matching polygon in the boundary files

**Acceptance Criteria:**
- [ ] `public/data/seoul-gu-boundaries.json` exists with 25 features, each having a valid `cortarNo` and `Polygon`/`MultiPolygon` geometry
- [ ] `public/data/seoul-dong-boundaries.json` exists with polygon data keyed by `cortarNo`
- [ ] Combined file size under 5MB (simplified)
- [ ] All `cortarNo` values in `seoul-districts.json` have matching entries in boundary files

---

## Step 2: Implement Data Loading Strategy

**Objective:** Load GeoJSON boundary data efficiently without blocking initial page render.

**Strategy:** Dynamic `fetch()` from `public/data/` with in-memory cache.

**New file:** `src/lib/geojson-loader.ts`

```
Key exports:
- loadGuBoundaries(): Promise<Map<string, LatLng[][]>>
- loadDongBoundaries(): Promise<Map<string, LatLng[][]>>
- getPolygonPath(cortarNo: string): Promise<{ lat: number; lng: number }[][] | null>
```

**Design decisions:**
- Fetch `seoul-gu-boundaries.json` eagerly on first region selection (구 data is small ~500KB)
- Fetch `seoul-dong-boundaries.json` lazily only when a 동 is selected (larger file)
- Cache parsed data in module-level `Map<string, LatLng[][]>` -- survives across component re-renders
- Convert GeoJSON `[lng, lat]` to `{ lat, lng }` during parsing, not at render time
- Handle `MultiPolygon` by flattening to `LatLng[][]` (array of rings)

**Tasks:**
1. Create `src/lib/geojson-loader.ts` with the exports described above
2. Implement coordinate conversion: `[lng, lat]` -> `{ lat, lng }`
3. Implement module-level caching (`Map` objects initialized to `null`, populated on first fetch)
4. Handle both `Polygon` and `MultiPolygon` geometry types

**Acceptance Criteria:**
- [ ] `getPolygonPath("1168000000")` resolves to an array of coordinate rings for 강남구
- [ ] Second call to same cortarNo returns cached result without re-fetching
- [ ] `MultiPolygon` geometries (islands, exclaves) are correctly converted to nested arrays
- [ ] Fetch errors return `null` gracefully (no thrown exceptions)

---

## Step 3: Update `region-lookup.ts`

**Objective:** Replace the rectangle-based `getRegionPolygon()` with real boundary polygon lookup.

**File:** `/Users/sehyunshin/play/estate/src/lib/region-lookup.ts`

**Changes:**
1. Change `getRegionPolygon` from synchronous to asynchronous (returns `Promise`)
2. Import and delegate to `getPolygonPath()` from `geojson-loader.ts`
3. Keep rectangle fallback if GeoJSON data is not yet loaded or missing

**Updated signature:**
```typescript
export async function getRegionPolygon(
  cortarNo: string
): Promise<{ lat: number; lng: number }[][] | null>
```

**Fallback behavior:**
- If GeoJSON fetch is pending or failed, fall back to existing bounds-based rectangle
- This ensures the polygon is always displayed, even before GeoJSON loads

**Tasks:**
1. Update `getRegionPolygon` to be async, calling `getPolygonPath` from `geojson-loader.ts`
2. Implement fallback: if `getPolygonPath` returns `null`, generate rectangle from `cortarNoToBounds`
3. Update return type to `{ lat: number; lng: number }[][]` (array of rings) to support multi-polygon

**Acceptance Criteria:**
- [ ] `getRegionPolygon` returns real polygon coordinates when GeoJSON is available
- [ ] `getRegionPolygon` returns rectangle fallback when GeoJSON is not loaded
- [ ] `cortarNoToBounds`, `getRegionCenter`, `searchRegions` remain unchanged and functional
- [ ] No TypeScript errors after signature change

---

## Step 4: Update `RegionPolygon` Component and Consumer

**Objective:** Update the component to handle multi-polygon paths and the async data flow.

### 4a. Update `RegionPolygon` component

**File:** `/Users/sehyunshin/play/estate/src/components/map/RegionPolygon.tsx`

**Changes:**
1. Update `path` prop type to `{ lat: number; lng: number }[][]` (array of rings/polygons)
2. Render multiple `<Polygon>` elements if the path contains multiple rings
3. Alternatively, use `react-kakao-maps-sdk`'s support for nested path arrays (check SDK docs)

### 4b. Update `page.tsx` consumer

**File:** `/Users/sehyunshin/play/estate/src/app/page.tsx`

**Changes:**
1. Replace `useMemo` with `useState` + `useEffect` for async polygon loading
2. Call `getRegionPolygon(cortarNo)` in the effect and set state on resolve
3. Pass the updated path format to `<RegionPolygon>`

**Updated pattern in page.tsx:**
```typescript
const [regionPolygonPath, setRegionPolygonPath] = useState<{ lat: number; lng: number }[][]>([]);

useEffect(() => {
  const cortarNo = filters.dongCode || filters.guCode;
  if (!cortarNo) {
    setRegionPolygonPath([]);
    return;
  }
  getRegionPolygon(cortarNo).then((path) => {
    setRegionPolygonPath(path ?? []);
  });
}, [filters.dongCode, filters.guCode]);
```

**Tasks:**
1. Update `RegionPolygonProps` interface to accept `path: { lat: number; lng: number }[][]`
2. Update `RegionPolygon` rendering logic for multi-ring support
3. Convert `page.tsx` from sync `useMemo` to async `useState` + `useEffect` pattern
4. Verify polygon renders correctly on Kakao map for both 구 and 동 selections

**Acceptance Criteria:**
- [ ] Selecting a 구 shows the real district boundary shape on the map
- [ ] Selecting a 동 shows the real dong boundary shape on the map
- [ ] Multi-polygon geometries render all parts correctly
- [ ] No flash of empty state -- rectangle fallback shows while GeoJSON loads
- [ ] Component unmount during fetch does not cause state update warnings

---

## Step 5: Performance Optimization

**Objective:** Ensure smooth rendering and minimal bundle/network impact.

**Tasks:**
1. **Polygon simplification at build time** (already in Step 1):
   - Douglas-Peucker with appropriate tolerance per zoom level
   - Target: 구 polygons < 200 points each, 동 polygons < 100 points each

2. **File size optimization:**
   - Truncate coordinates to 4 decimal places (~11m precision, sufficient for map display)
   - Consider using a compact format (array of `[lat, lng]` tuples instead of objects) internally
   - Gzip compression via Next.js static file serving (automatic for `public/` if hosting supports it)

3. **Rendering optimization:**
   - Memoize `RegionPolygon` with `React.memo` to prevent re-renders when path hasn't changed
   - Use `useMemo` for coordinate transformation if any runtime conversion remains

4. **Optional -- Level-of-detail (LOD):**
   - At city-wide zoom (level 8+), show simplified 구 boundaries
   - At district zoom (level 5-7), show detailed 구 boundary
   - At dong zoom (level 3-5), show detailed 동 boundary
   - This is a nice-to-have and can be deferred

**Acceptance Criteria:**
- [ ] No perceptible lag when selecting a region and rendering its polygon
- [ ] GeoJSON files are served with gzip compression (verify with DevTools Network tab)
- [ ] `RegionPolygon` does not re-render unnecessarily (verify with React DevTools)
- [ ] Total additional JavaScript bundle size increase < 50KB (data is fetched separately)

---

## Success Criteria

1. All 25 Seoul 구 display real administrative boundary shapes when selected
2. 동-level polygons display real boundaries when a 동 is selected
3. Polygon loading is non-blocking with rectangle fallback during fetch
4. No regression in existing functionality (search, bounds API calls, marker display)
5. Combined GeoJSON data size under 5MB, with efficient caching
6. Smooth rendering performance with no visible lag on region switch

---

## Files to Create
| File | Purpose |
|------|---------|
| `scripts/prepare-geojson.ts` | Script to download, process, and simplify GeoJSON data |
| `src/lib/geojson-loader.ts` | Async GeoJSON loading with caching and coordinate conversion |
| `public/data/seoul-gu-boundaries.json` | 25 district boundary polygons |
| `public/data/seoul-dong-boundaries.json` | ~400 dong boundary polygons |

## Files to Modify
| File | Changes |
|------|---------|
| `src/lib/region-lookup.ts` | `getRegionPolygon` -> async, delegate to geojson-loader, keep rectangle fallback |
| `src/components/map/RegionPolygon.tsx` | Support `path: LatLng[][]`, multi-polygon rendering |
| `src/app/page.tsx` | `useMemo` -> `useState` + `useEffect` for async polygon, updated path type |
| `package.json` | Add `prepare-geojson` script |
