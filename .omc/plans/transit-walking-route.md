# 매물 선택 시 대중교통 도보 경로 표시

## Context

서울 부동산 매물 조회 서비스에서 매물을 선택하면, 가장 가까운 버스정류장 1개와 지하철역 1개까지의 도보 경로를 지도에 표시하는 기능이다.

**현재 상태:**
- `page.tsx`에서 `selectedArticle` 상태 관리 중 (lat/lng 좌표 포함)
- `KakaoMap`은 children 기반 합성 패턴 사용 (Polygon, Marker, CustomOverlay 등)
- `react-kakao-maps-sdk`에 `Polyline`, `CustomOverlayMap`, `MapMarker` 컴포넌트 사용 가능
- Kakao SDK 현재 `clusterer` 라이브러리만 로드 중 -- `services` 추가 필요 (Places API)
- SWR 기반 데이터 페칭 패턴, Zustand 상태관리

**기술 결정:**
- 주변 대중교통 검색: 카카오 Places API (`kakao.maps.services.Places.categorySearch`) -- 클라이언트에서 직접 호출
- 도보 경로 계산: 카카오 모빌리티 API (도보 길찾기) -- API 키 보호를 위해 Next.js API Route로 프록시
- 경로 렌더링: `react-kakao-maps-sdk`의 `Polyline` + `CustomOverlayMap`

## Work Objectives

매물 선택 시 가장 가까운 버스정류장(1개)과 지하철역(1개)까지의 도보 최단 경로를 색상 구분된 폴리라인과 소요시간 오버레이로 지도에 표시한다.

## Guardrails

### Must Have
- 버스정류장 경로: 초록색(#22C55E) 폴리라인
- 지하철역 경로: 파란색(#3B82F6) 폴리라인
- 각 경로 끝점에 "도보 N분" 소요시간 오버레이
- 매물 선택 해제 시 경로/오버레이 자동 제거
- API 실패 시 graceful degradation (경로 미표시, 에러 무시)
- 로딩 상태 표시

### Must NOT Have
- 자동차/대중교통 환승 경로 (도보만)
- 2개 이상의 버스정류장/지하철역 표시
- 기존 컴포넌트(KakaoMap, ArticleMarker, ArticleDetail)의 인터페이스 변경
- 새로운 외부 패키지 추가 (카카오 SDK 내 기능만 사용)

---

## Task Flow

```
[selectedArticle 변경]
        |
        v
[Step 1] useNearbyTransit 훅 실행
        |-- kakao.maps.services.Places.categorySearch("BW9" = 지하철역)
        |-- kakao.maps.services.Places.categorySearch("BS2" = 버스정류장)
        |-- 각각 가장 가까운 1개 선택
        v
[Step 2] useWalkingRoute 훅 실행 (버스/지하철 각각)
        |-- POST /api/transit/walking-route (카카오 모빌리티 프록시)
        |-- 응답: 폴리라인 좌표 배열 + 소요시간(초)
        v
[Step 3] TransitRouteOverlay 컴포넌트 렌더링
        |-- Polyline x2 (버스: 초록, 지하철: 파랑)
        |-- CustomOverlayMap x2 (소요시간 라벨)
        |-- MapMarker x2 (정류장/역 위치)
        v
[Step 4] page.tsx에서 KakaoMap children으로 통합
```

---

## Detailed TODOs

### Step 1: 카카오 SDK 라이브러리 확장 + 주변 대중교통 검색 훅

**파일:**
- `src/lib/kakao/loader.ts` -- `services` 라이브러리 추가
- `src/components/map/KakaoMap.tsx` -- SDK 로드 시 `services` 라이브러리 포함
- `src/hooks/useNearbyTransit.ts` (신규)

**주요 내용:**
- `KakaoMap.tsx`의 SDK script src에 `libraries=clusterer,services` 로 변경
- `loader.ts`의 `getKakaoLoader`에도 `services` 추가
- `useNearbyTransit(position: {lat, lng} | null)` 훅 생성
  - `kakao.maps.services.Places` 인스턴스 생성
  - `categorySearch` 호출: 카테고리 코드 `SW8`(지하철역), `BW9`(버스정류장) -- 반경 1000m, 거리순 정렬
  - 각각 첫 번째 결과만 반환
  - 반환 타입: `{ busStop: TransitStation | null, subway: TransitStation | null, isLoading: boolean }`
- `src/types/transit.ts` (신규) -- `TransitStation` 타입 정의: `{ name, lat, lng, distance, categoryCode }`

**Acceptance Criteria:**
- selectedArticle 좌표 전달 시 가장 가까운 버스정류장 1개, 지하철역 1개의 이름/좌표/거리가 반환된다
- position이 null이면 null/null을 반환한다
- Places API 실패 시 null로 graceful fallback 한다

---

### Step 2: 도보 경로 API 라우트 (카카오 모빌리티 프록시)

**파일:**
- `src/app/api/transit/walking-route/route.ts` (신규)

**주요 내용:**
- GET 핸들러: `?originLat=&originLng=&destLat=&destLng=`
- zod 스키마로 파라미터 검증
- 카카오 모빌리티 도보 길찾기 API 호출: `https://apis-navi.kakaomobility.com/v1/directions`
  - `priority=RECOMMEND`, `car_fuel=GASOLINE` 등 -- 도보는 별도 엔드포인트: `https://apis-navi.kakaomobility.com/v1/waypoints/directions` 또는 Tmap 도보 API 활용
  - **대안**: 카카오 모빌리티에 도보 전용 API가 없는 경우, 직선거리 기반 도보시간 추정(80m/분) + 직선 폴리라인으로 대체
- 환경변수: `KAKAO_REST_API_KEY` (서버 전용)
- 응답 형식: `{ path: {lat, lng}[], duration: number (초), distance: number (m) }`
- `apiSuccess`/`apiError` 패턴 준수

**Acceptance Criteria:**
- 출발/도착 좌표 전달 시 도보 경로 좌표 배열과 소요시간(초)이 반환된다
- 잘못된 파라미터에 400 에러를 반환한다
- 외부 API 실패 시 502 에러 또는 직선거리 기반 폴백을 반환한다

---

### Step 3: 도보 경로 계산 훅

**파일:**
- `src/hooks/useWalkingRoute.ts` (신규)

**주요 내용:**
- `useWalkingRoute(origin: {lat,lng} | null, destination: {lat,lng} | null)` 훅
- SWR 기반: key는 `/api/transit/walking-route?originLat=...&destLat=...`
- origin 또는 destination이 null이면 key=null (fetch 안 함)
- 반환: `{ path: {lat,lng}[], duration: number, distance: number, isLoading: boolean, error: Error | null }`
- `revalidateOnFocus: false` 설정

**Acceptance Criteria:**
- 유효한 좌표 2쌍 전달 시 경로 좌표와 소요시간이 반환된다
- 좌표가 null이면 fetch하지 않는다
- API 에러 시 error 상태로 전파된다

---

### Step 4: 경로 표시 컴포넌트 (TransitRouteOverlay)

**파일:**
- `src/components/map/TransitRouteOverlay.tsx` (신규)

**주요 내용:**
- Props: `{ articlePosition: {lat,lng} }`
- 내부에서 `useNearbyTransit` + `useWalkingRoute` x2 (버스, 지하철) 호출
- 렌더링:
  - `Polyline` x2: 버스 경로(strokeColor="#22C55E", strokeWeight=4), 지하철 경로(strokeColor="#3B82F6", strokeWeight=4)
  - `CustomOverlayMap` x2: 각 정류장/역 위치에 "도보 N분" 라벨 (Tailwind 스타일)
  - `MapMarker` x2: 버스정류장/지하철역 마커 (커스텀 아이콘 또는 기본 마커)
- 로딩 중: 아무것도 렌더링하지 않음 (지도 위 로딩 스피너 불필요)
- 에러 시: 해당 경로만 미표시 (다른 경로는 정상 표시)

**Acceptance Criteria:**
- 매물 좌표 전달 시 버스정류장/지하철역까지 각각 색상 구분된 폴리라인이 지도에 표시된다
- 각 경로 끝점에 "도보 N분" 오버레이가 표시된다
- 한쪽 경로 실패 시 다른 쪽은 정상 표시된다
- KakaoMap의 children으로 합성 가능하다

---

### Step 5: page.tsx 통합

**파일:**
- `src/app/page.tsx`

**주요 내용:**
- `selectedArticle`이 존재할 때 `KakaoMap` children에 `<TransitRouteOverlay articlePosition={{lat: selectedArticle.lat, lng: selectedArticle.lng}} />` 추가
- 기존 `ArticleMarker`와 함께 렌더링
- `selectedArticle`이 null이면 TransitRouteOverlay도 렌더링되지 않음 (조건부 렌더링)

**Acceptance Criteria:**
- 매물 클릭 시 마커 + 대중교통 도보 경로가 함께 표시된다
- 매물 선택 해제 시 경로가 완전히 제거된다
- 기존 기능(폴리곤, 마커, 사이드바 등)에 영향 없다

---

## 환경변수 추가

```
KAKAO_REST_API_KEY=  # 카카오 REST API 키 (서버 전용, 모빌리티 API 호출용)
```

## 신규 파일 목록

| 파일 | 유형 | 설명 |
|------|------|------|
| `src/types/transit.ts` | 타입 | TransitStation, WalkingRoute 타입 |
| `src/hooks/useNearbyTransit.ts` | 훅 | 주변 대중교통 검색 |
| `src/hooks/useWalkingRoute.ts` | 훅 | 도보 경로 계산 (SWR) |
| `src/app/api/transit/walking-route/route.ts` | API | 도보 경로 프록시 |
| `src/components/map/TransitRouteOverlay.tsx` | 컴포넌트 | 경로 + 오버레이 표시 |

## 수정 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/kakao/loader.ts` | services 라이브러리 추가 |
| `src/components/map/KakaoMap.tsx` | SDK script에 services 라이브러리 추가 |
| `src/app/page.tsx` | TransitRouteOverlay 통합 |

## Success Criteria

1. 매물 선택 시 가장 가까운 버스정류장(초록 폴리라인)과 지하철역(파란 폴리라인)까지 도보 경로가 지도에 표시된다
2. 각 경로 끝점에 "도보 N분" 오버레이가 표시된다
3. 매물 선택 해제 시 모든 경로/오버레이가 제거된다
4. API 실패 시 에러 없이 graceful하게 동작한다 (해당 경로만 미표시)
5. 기존 기능(필터, 목록, 마커, 폴리곤)에 영향이 없다
6. `pnpm build` 성공
