# Kakao Map -> Naver Map 전환 계획

## Context

현재 프로젝트는 `react-kakao-maps-sdk`를 사용하여 지도 기능을 구현하고 있다.
이를 `react-naver-maps` 라이브러리로 전면 교체(Big Bang)한다.

### 현재 사용 중인 Kakao 컴포넌트 매핑

| Kakao (현재)         | Naver (목표)                    | 사용 파일                              |
| -------------------- | ------------------------------- | -------------------------------------- |
| `Map`                | `NaverMap` + `Container`        | KakaoMap.tsx                           |
| `MapMarker`          | `Marker`                        | ArticleMarker.tsx, TransitRouteOverlay |
| `CustomOverlayMap`   | `Marker` (htmlIcon) 또는 커스텀 div + `useMap()` | ArticleMarker.tsx, TransitRouteOverlay |
| `Polygon`            | `Polygon`                       | RegionPolygon.tsx                      |
| `Polyline`           | `Polyline`                      | TransitRouteOverlay.tsx                |
| `Loader` (싱글턴)    | `NavermapsProvider`             | loader.ts -> layout.tsx                |

### 환경변수 매핑

| 현재                           | 변경 후                        |
| ------------------------------ | ------------------------------ |
| `NEXT_PUBLIC_KAKAO_APP_KEY`    | `NEXT_PUBLIC_NCP_CLIENT_ID` (이미 존재) |
| `KAKAO_REST_API_KEY`           | 유지 (transit API의 카카오 로컬 검색에서 계속 사용) |

> 주의: `KAKAO_REST_API_KEY`는 서버사이드 `src/lib/kakao/local.ts`에서 카카오 로컬 검색 API(지하철/버스 검색)에 사용 중이므로 제거하면 안 된다. 지도 SDK만 네이버로 전환하고, 로컬 검색 API는 카카오를 계속 사용한다.

---

## Work Objectives

1. 카카오맵 SDK 의존성을 네이버맵으로 교체한다
2. 모든 지도 컴포넌트를 react-naver-maps API로 마이그레이션한다
3. 줌 레벨 변환 로직을 중앙화한다
4. 기존 기능(매물 마커, 폴리곤, 대중교통 경로)이 동일하게 작동하도록 보장한다

---

## Guardrails

### Must Have
- 모든 기존 기능이 네이버맵에서 동일하게 동작해야 한다
- 환경변수 `NEXT_PUBLIC_NCP_CLIENT_ID`가 NavermapsProvider에 올바르게 전달되어야 한다
- 줌 레벨 변환 공식이 `getRegionCenter`와 `page.tsx`에 일관되게 적용되어야 한다
- Lucide 아이콘(Train, Bus)이 네이버맵 오버레이에서도 정상 렌더링되어야 한다
- `src/lib/kakao/local.ts`는 변경하지 않는다 (서버사이드 API, 지도와 무관)

### Must NOT Have
- 카카오맵 관련 코드가 남아있으면 안 된다 (local.ts 제외)
- 지도 기능 외의 코드를 변경하면 안 된다
- `@types/navermaps`를 별도로 설치하지 않는다 (react-naver-maps에 타입 포함)

---

## Task Flow

```
[Step 1: 의존성 교체]
    |
    v
[Step 2: Provider 설정 + NaverMap 래퍼 컴포넌트]
    |
    v
[Step 3: 줌 레벨 변환 중앙화 + 오버레이 컴포넌트 전환]
    |
    v
[Step 4: page.tsx 통합 + loader.ts 제거 + 환경변수 정리]
    |
    v
[Step 5: 빌드 검증 + 수동 테스트]
```

---

## Detailed TODOs

### Step 1: 의존성 교체

**파일:** `package.json`

**작업:**
- `react-kakao-maps-sdk` 제거
- `react-naver-maps` 추가 (최신 버전 `^0.1.4`)

**명령어:**
```bash
npm uninstall react-kakao-maps-sdk
npm install react-naver-maps
```

**Acceptance Criteria:**
- `package.json`에서 `react-kakao-maps-sdk`가 사라지고 `react-naver-maps`가 추가된다
- `npm install`이 에러 없이 완료된다

---

### Step 2: Provider 설정 + NaverMap 래퍼 컴포넌트

**파일:** `src/app/layout.tsx`, `src/components/map/KakaoMap.tsx`

**작업 2-1: layout.tsx에 NavermapsProvider 래핑**
- `NavermapsProvider`를 import하여 `<body>` 안에서 children을 감싼다
- `ncpClientId`에 `process.env.NEXT_PUBLIC_NCP_CLIENT_ID`를 전달한다
- layout.tsx는 서버 컴포넌트이므로 NavermapsProvider를 별도 클라이언트 컴포넌트로 래핑하거나, layout.tsx 자체를 "use client"로 변경하지 않고 클라이언트 래퍼 컴포넌트를 만든다

```tsx
// src/components/map/NaverMapProvider.tsx (신규 생성)
"use client";
import { NavermapsProvider } from "react-naver-maps";

export default function NaverMapProvider({ children }: { children: React.ReactNode }) {
  return (
    <NavermapsProvider ncpClientId={process.env.NEXT_PUBLIC_NCP_CLIENT_ID!}>
      {children}
    </NavermapsProvider>
  );
}
```

layout.tsx에서 이 컴포넌트로 children을 감싼다.

**작업 2-2: KakaoMap.tsx -> NaverMapWrapper.tsx로 전환**
- 파일명을 `NaverMapWrapper.tsx`로 변경 (또는 내용만 교체)
- `Map` -> `Container` + `NaverMap` 으로 교체
- 카카오 SDK 수동 로딩 로직(useEffect, script 태그) 제거 (Provider가 처리)
- props 인터페이스 변경:
  - `level` -> `zoom` (변환 공식 적용)
  - `center` -> `defaultCenter` 또는 `center`
  - `onCreate` -> `onInit` 또는 ref 기반
  - `onCenterChanged`, `onZoomChanged` -> 네이버맵 이벤트 리스너
- 콜백 시그니처 변경: `kakao.maps.Map` -> `naver.maps.Map`

**핵심 변환:**
```tsx
// Before (Kakao)
<Map center={center} level={level} onCreate={onLoad} ... >

// After (Naver)
<Container style={{ width: "100%", height: "100%" }}>
  <NaverMap defaultCenter={new naver.maps.LatLng(center.lat, center.lng)}
            defaultZoom={zoom} ... >
    {children}
  </NaverMap>
</Container>
```

**Acceptance Criteria:**
- NavermapsProvider가 앱 전체를 감싸고 있다
- NaverMap이 서울 중심 좌표(37.5665, 126.978)로 렌더링된다
- 로딩 상태("지도 로딩 중...")가 정상 표시된다
- layout.tsx가 서버 컴포넌트를 유지한다 (NaverMapProvider는 별도 클라이언트 컴포넌트)

---

### Step 3: 줌 레벨 변환 중앙화 + 오버레이 컴포넌트 전환

**파일:** `src/lib/region-lookup.ts`, `src/components/map/ArticleMarker.tsx`, `src/components/map/RegionPolygon.tsx`, `src/components/map/TransitRouteOverlay.tsx`

**작업 3-1: 줌 레벨 변환 함수 (region-lookup.ts)**

카카오맵 level과 네이버맵 zoom은 반비례 관계:
- 카카오 level 높을수록 축소, 네이버 zoom 높을수록 확대
- 변환 공식: `naverZoom = 21 - kakaoLevel`

| 용도        | 카카오 level | 네이버 zoom (21 - level) |
| ----------- | ------------ | ------------------------ |
| 서울 전체   | 8            | 13                       |
| 구 단위     | 7            | 14                       |
| 동 단위     | 5            | 16                       |
| 매물 확대   | 3            | 18                       |

`getRegionCenter()` 함수의 반환값에서 `level` 필드를 네이버 zoom으로 변경:
- 동: `5` -> `16`
- 구: `7` -> `14`

> 중요: 이 변환이 `getRegionCenter`에서 한 번만 일어나도록 한다. page.tsx에서 추가 변환하지 않는다.

**작업 3-2: ArticleMarker.tsx 전환**

- `MapMarker` -> `Marker` (from react-naver-maps)
- `CustomOverlayMap` -> `Marker`의 `icon` prop에 HTML 커스텀 아이콘 사용

```tsx
// Before (Kakao)
<MapMarker position={{ lat, lng }} onClick={onClick} />
<CustomOverlayMap position={{ lat, lng }} yAnchor={2.2}>
  <div className="bg-blue-600 ...">가격</div>
</CustomOverlayMap>

// After (Naver) - Marker의 icon prop 활용
<Marker
  position={new naver.maps.LatLng(lat, lng)}
  onClick={onClick}
  icon={{
    content: `<div class="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded shadow-lg cursor-pointer">${priceText}</div>`,
    anchor: new naver.maps.Point(0, 0),
  }}
/>
```

> CustomOverlayMap 대체 방식: react-naver-maps에는 직접적인 CustomOverlayMap 동치가 없으므로, `Marker`의 `icon.content`에 HTML 문자열을 넘기는 방식을 사용한다. 이 방식이 네이버맵에서 가장 일반적인 커스텀 오버레이 패턴이다.

**작업 3-3: RegionPolygon.tsx 전환**

- `Polygon` (kakao) -> `Polygon` (naver)
- `path` prop 형식 변경: `{ lat, lng }[]` -> `naver.maps.LatLng[]`
- 스타일 props 매핑:
  - `strokeWeight` -> `strokeWeight` (동일)
  - `strokeColor` -> `strokeColor` (동일)
  - `strokeOpacity` -> `strokeOpacity` (동일)
  - `fillColor` -> `fillColor` (동일)
  - `fillOpacity` -> `fillOpacity` (동일)

```tsx
// Before (Kakao)
<Polygon path={path} strokeWeight={2} strokeColor="#3B82F6" ... />

// After (Naver)
<Polygon
  paths={[path.map(p => new naver.maps.LatLng(p.lat, p.lng))]}
  strokeWeight={2} strokeColor="#3B82F6" ...
/>
```

> 주의: 네이버맵 Polygon의 prop 이름은 `paths` (복수형)이며, `naver.maps.LatLng[][]` 형태이다.

**작업 3-4: TransitRouteOverlay.tsx 전환**

- `Polyline` (kakao) -> `Polyline` (naver)
- `MapMarker` -> `Marker`
- `CustomOverlayMap` -> `Marker`의 `icon.content` (HTML 문자열)
- Lucide 아이콘 (`Train`, `Bus`): CustomOverlayMap에서는 React 컴포넌트로 렌더링 가능했으나, Marker의 icon.content는 HTML 문자열이므로 SVG 인라인으로 변환 필요

```tsx
// Lucide 아이콘 대체 방안
// 방법 1: Lucide SVG를 인라인 문자열로 포함
const trainSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" ...>...</svg>`;

// 방법 2: useMap() 훅으로 naver.maps.Map 인스턴스를 얻어 OverlayView를 직접 구현
// (복잡도가 높으므로 방법 1 권장)
```

Polyline path 변환:
```tsx
// Before
<Polyline path={subway.route.path} strokeWeight={4} ... />

// After
<Polyline
  path={subway.route.path.map(p => new naver.maps.LatLng(p.lat, p.lng))}
  strokeWeight={4} ...
/>
```

**Acceptance Criteria:**
- 줌 레벨 변환이 `getRegionCenter()` 함수 한 곳에서만 이루어진다
- 매물 마커가 가격 라벨과 함께 표시된다
- 구/동 폴리곤이 파란색 반투명으로 표시된다
- 대중교통 경로가 지하철(파란), 버스(초록) 색상으로 표시된다
- Train, Bus 아이콘이 오버레이에 표시된다 (SVG 인라인)

---

### Step 4: page.tsx 통합 + 불필요 파일 정리 + 환경변수

**파일:** `src/app/page.tsx`, `src/lib/kakao/loader.ts`, `.env.local.example`

**작업 4-1: page.tsx 수정**
- `KakaoMap` import를 새 컴포넌트명으로 변경 (파일명 변경한 경우)
- `level` prop -> `zoom` prop으로 변경
- `mapLevel` 계산 로직:
  - 매물 선택 시: `3` -> `18` (21 - 3)
  - 기본값: `8` -> `13` (21 - 8)
  - `getRegionCenter().level`은 이미 Step 3에서 네이버 zoom 값으로 변환됨

**작업 4-2: 불필요 파일 삭제**
- `src/lib/kakao/loader.ts` 삭제 (NavermapsProvider가 SDK 로딩 담당)
- `src/lib/kakao/` 디렉토리는 유지 (`local.ts`가 카카오 로컬 검색 API에서 사용 중)

**작업 4-3: 환경변수 정리**
- `.env.local.example` 업데이트:
  - `NEXT_PUBLIC_KAKAO_APP_KEY` 항목 제거
  - `NEXT_PUBLIC_NCP_CLIENT_ID` 항목 추가 (이미 .env.local에 값 존재)
- `.env.local`:
  - `NEXT_PUBLIC_KAKAO_APP_KEY` 라인 제거 (더 이상 클라이언트에서 사용 안 함)
  - `KAKAO_REST_API_KEY` 유지 (서버사이드 로컬 검색 API용)
  - `NEXT_PUBLIC_NCP_CLIENT_ID` 유지

**Acceptance Criteria:**
- page.tsx에서 지도가 올바른 줌 레벨로 렌더링된다
- `src/lib/kakao/loader.ts`가 삭제된다
- `src/lib/kakao/local.ts`는 그대로 존재한다
- `.env.local.example`에 네이버맵 관련 환경변수만 안내된다
- 프로젝트에서 `react-kakao-maps-sdk` import가 하나도 남아있지 않다

---

### Step 5: 빌드 검증 + 수동 테스트

**작업:**
1. `npm run build` 실행하여 타입 에러 및 빌드 에러 없는지 확인
2. `npm run dev`로 로컬 실행 후 수동 테스트:
   - 지도가 서울 중심으로 정상 로드되는가
   - 구/동 선택 시 폴리곤이 표시되는가
   - 구/동 선택 시 줌 레벨이 적절히 변경되는가
   - 매물 클릭 시 마커와 가격 라벨이 표시되는가
   - 매물 선택 시 대중교통 경로(지하철/버스)가 표시되는가
   - Train/Bus 아이콘이 오버레이에 보이는가
3. `grep -r "react-kakao-maps-sdk" src/` 실행하여 잔여 import 확인

**Acceptance Criteria:**
- `npm run build` 성공 (exit code 0)
- 위 수동 테스트 항목 모두 통과
- 카카오맵 SDK 관련 import가 프로젝트에 남아있지 않다 (local.ts 제외, local.ts는 SDK가 아닌 REST API 사용)

---

## 영향 받는 파일 목록 (총 10개)

| 파일                                         | 변경 유형        |
| -------------------------------------------- | ---------------- |
| `package.json`                               | 의존성 교체      |
| `.env.local`                                 | 환경변수 정리    |
| `.env.local.example`                         | 환경변수 안내 수정 |
| `src/app/layout.tsx`                         | Provider 래핑    |
| `src/components/map/NaverMapProvider.tsx`     | **신규 생성**    |
| `src/components/map/KakaoMap.tsx`            | 전면 재작성      |
| `src/components/map/ArticleMarker.tsx`       | 컴포넌트 전환    |
| `src/components/map/RegionPolygon.tsx`       | 컴포넌트 전환    |
| `src/components/map/TransitRouteOverlay.tsx` | 컴포넌트 전환    |
| `src/lib/region-lookup.ts`                   | 줌 레벨 변환     |
| `src/app/page.tsx`                           | import + zoom prop |
| `src/lib/kakao/loader.ts`                    | **삭제**         |

## 변경하지 않는 파일

| 파일                           | 이유                                       |
| ------------------------------ | ------------------------------------------ |
| `src/lib/kakao/local.ts`       | 카카오 로컬 검색 REST API (지도 SDK 아님)  |
| `src/hooks/useTransitRoute.ts` | API 호출 훅, 지도 컴포넌트 의존성 없음     |
| `src/hooks/useRegionPolygon.ts`| 좌표 데이터 로딩만 담당, 지도 SDK 무관     |
| `src/store/filterStore.ts`     | 필터 상태 관리, 지도 무관                  |

---

## 위험 완화 방안

1. **CustomOverlayMap 대체**: Marker의 `icon.content` HTML 문자열 방식이 가장 안정적. 만약 이벤트 바인딩 이슈 발생 시 `useMap()` 훅으로 네이티브 OverlayView 사용 가능
2. **Lucide 아이콘**: HTML 문자열로 변환 시 SVG를 인라인으로 포함. Lucide의 SVG 소스를 직접 문자열로 변환하거나 `renderToStaticMarkup` 사용
3. **줌 레벨 경계값**: 네이버맵 zoom 범위는 1~21. 변환 공식 `21 - kakaoLevel`의 유효 범위 검증 필요 (kakaoLevel 1~14 -> naverZoom 7~20)
4. **naver.maps.LatLng 인스턴스화**: 네이버맵 컴포넌트들은 `{ lat, lng }` 객체 대신 `naver.maps.LatLng` 인스턴스를 요구할 수 있다. react-naver-maps가 자동 변환하는지 확인 후, 필요하면 유틸 함수 작성

## 롤백 전략

전면 교체 방식이므로 롤백은 git 기반으로 수행:
1. 마이그레이션 시작 전 현재 상태를 별도 브랜치로 보존: `git checkout -b backup/kakao-map`
2. 마이그레이션 작업은 `feat/naver-map-migration` 브랜치에서 진행
3. 문제 발생 시 `main` 브랜치로 복귀하면 카카오맵 상태로 즉시 롤백 가능
4. `npm install`로 이전 의존성 복원

---

## Success Criteria

- [ ] `npm run build` 성공
- [ ] 지도가 네이버맵으로 렌더링된다
- [ ] 매물 마커 + 가격 라벨이 표시된다
- [ ] 구/동 폴리곤이 표시된다
- [ ] 대중교통 경로(지하철/버스)가 표시된다
- [ ] Lucide 아이콘이 오버레이에 렌더링된다
- [ ] `react-kakao-maps-sdk` import가 프로젝트에 남아있지 않다
- [ ] 카카오 로컬 검색 API(`local.ts`)는 정상 동작한다
