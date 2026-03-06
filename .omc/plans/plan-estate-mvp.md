# 서울 부동산 매물 조회 서비스 MVP 종합 기획안

> 작성일: 2026-03-05
> 수정일: 2026-03-05 (v3 - 에이전트 팀 합의 완료)
> 프로젝트: estate
> 유형: 개인 프로젝트 (비상업적)

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v3.1 | 2026-03-05 | 합의 루프 Iteration 3: cortarNo 구/동 판별 버그 수정 (광진구/강북구/금천구), fallback 데이터 흐름 재정리, totalCount 처리 방식 명시 |
| v3 | 2026-03-05 | 합의 루프 Iteration 2: 캐시 키 전체 필터 포함, 상세 API fallback 데이터 소스 명확화 (SWR fallbackData), 검색 트리거 방식 통일 (버튼 클릭) |
| v2 | 2026-03-05 | Architect/Critic/Analyst 피드백 반영: 서버 캐싱, cortarNo→좌표 변환, 상세 API fallback, 필터 UX 개선, MVP 범위 조정 |
| v1 | 2026-03-05 | 초기 기획안 작성 |

---

## 1. 프로젝트 구조

```
estate/
├── public/
│   ├── favicon.ico
│   └── data/
│       └── seoul-districts.json          # 서울 25개 구, 467개 동 법정동코드 + 좌표 정적 데이터
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # 루트 레이아웃 (카카오맵 Script 로딩)
│   │   ├── page.tsx                      # 메인 페이지 (지도 + 매물 목록)
│   │   ├── globals.css                   # 글로벌 스타일
│   │   └── api/
│   │       ├── articles/
│   │       │   └── route.ts              # GET /api/articles - 매물 목록 조회 (프록시)
│   │       ├── articles/[id]/
│   │       │   └── route.ts              # GET /api/articles/:id - 매물 상세 조회
│   │       └── regions/
│   │           └── route.ts              # GET /api/regions - 구/동 목록 조회
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx                # 상단 헤더 (서비스명, 검색바)
│   │   │   ├── Sidebar.tsx               # 좌측 사이드바 컨테이너
│   │   │   └── MobileBottomSheet.tsx     # [신규] 모바일 하단 시트
│   │   │
│   │   ├── map/
│   │   │   ├── KakaoMap.tsx              # 카카오맵 래퍼 컴포넌트
│   │   │   ├── DistrictMarker.tsx        # [변경] 구 단위 마커 (폴리곤→마커)
│   │   │   ├── DongMarker.tsx            # [변경] 동 단위 마커 (폴리곤→마커)
│   │   │   └── ArticleMarker.tsx         # 매물 마커
│   │   │
│   │   ├── search/
│   │   │   └── RegionSearch.tsx          # [신규] 구/동 검색 자동완성
│   │   │
│   │   ├── filter/
│   │   │   ├── FilterPanel.tsx           # 필터 패널 컨테이너
│   │   │   ├── TradeTypeFilter.tsx       # 매매/전세/월세 필터
│   │   │   ├── BuildingTypeFilter.tsx    # 아파트/빌라/오피스텔 필터
│   │   │   ├── PriceRangeFilter.tsx      # 금액 범위 필터 (슬라이더)
│   │   │   ├── AreaFilter.tsx            # 평수 필터
│   │   │   └── FilterResetButton.tsx     # [신규] 필터 초기화 버튼
│   │   │
│   │   ├── article/
│   │   │   ├── ArticleList.tsx           # 매물 목록 리스트
│   │   │   ├── ArticleCard.tsx           # 매물 카드 (개별 항목)
│   │   │   ├── ArticleDetail.tsx         # 매물 상세 정보 슬라이드 패널
│   │   │   ├── ArticleSkeleton.tsx       # 로딩 스켈레톤
│   │   │   └── ArticleEmpty.tsx          # [신규] 빈 상태 / 초기 가이드
│   │   │
│   │   └── common/
│   │       ├── Badge.tsx                 # 거래유형/건물유형 뱃지
│   │       ├── PriceDisplay.tsx          # 가격 포맷 표시 (억/만원)
│   │       ├── Pagination.tsx            # 페이지네이션
│   │       └── ErrorState.tsx            # [신규] 에러 상태 UI
│   │
│   ├── hooks/
│   │   ├── useArticles.ts               # 매물 목록 조회 훅 (SWR + 디바운스)
│   │   ├── useArticleDetail.ts          # 매물 상세 조회 훅 (fallback 포함)
│   │   ├── useRegions.ts                # 구/동 목록 조회 훅
│   │   ├── useFilters.ts                # 필터 상태 관리 훅
│   │   ├── useRegionSearch.ts           # [신규] 지역 검색 훅
│   │   └── useDebounce.ts               # [신규] 디바운스 유틸 훅
│   │
│   ├── lib/
│   │   ├── naver/
│   │   │   ├── client.ts                # 네이버부동산 API HTTP 클라이언트 (rate-limit, retry)
│   │   │   ├── endpoints.ts             # 엔드포인트 URL 상수 정의
│   │   │   ├── types.ts                 # 네이버 API 응답 타입 정의
│   │   │   └── transform.ts             # 네이버 응답 -> 내부 모델 변환
│   │   │
│   │   ├── kakao/
│   │   │   └── loader.ts                # 카카오맵 SDK 로딩 유틸
│   │   │
│   │   ├── cache/
│   │   │   └── server-cache.ts          # [신규] 서버 사이드 인메모리 캐시
│   │   │
│   │   ├── constants.ts                 # 공통 상수 (코드 매핑, 기본값, 가격 범위)
│   │   ├── format.ts                    # 가격/면적 포맷팅 유틸
│   │   ├── region-lookup.ts             # [신규] cortarNo → 좌표 변환 유틸
│   │   ├── region-codes.ts              # 서울 구/동 법정동코드 매핑
│   │   └── api-response.ts              # [신규] API 응답 헬퍼 함수
│   │
│   ├── store/
│   │   └── filterStore.ts               # Zustand 필터 상태 스토어
│   │
│   └── types/
│       ├── article.ts                   # 매물 도메인 타입
│       ├── filter.ts                    # 필터 타입
│       └── region.ts                    # 지역 타입
│
├── scripts/
│   └── fetch-regions.ts                 # 서울 구/동 데이터 수집 스크립트
│
├── .env.local                            # 환경변수 (KAKAO_APP_KEY 등)
├── .gitignore
├── next.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
└── README.md
```

**총 파일 수:** 약 45개 (+5개 신규)
**핵심 디렉토리:**
- `src/lib/naver/` - 네이버부동산 크롤링 핵심 로직
- `src/lib/cache/` - [신규] 서버 사이드 캐싱
- `src/components/map/` - 카카오맵 지도 UI
- `src/components/search/` - [신규] 지역 검색
- `src/components/filter/` - 필터 시스템
- `src/components/article/` - 매물 표시 UI

---

## 2. 기술 스택 상세

### 프레임워크 및 런타임
| 분류 | 기술 | 버전 | 선정 이유 |
|------|------|------|-----------|
| 프레임워크 | Next.js (App Router) | 14.x | SSR + API Routes 풀스택, Vercel 최적 배포 |
| UI 라이브러리 | React | 18.x | Next.js 14 기본 번들 |
| 언어 | TypeScript | 5.x | 타입 안전성, 네이버 API 응답 타입 정의 필수 |
| 패키지 매니저 | pnpm | 9.x | 빠른 설치, disk 효율적 |

> **Note**: Next.js 15로 업그레이드 시 `react-kakao-maps-sdk`의 React 19 호환성 검증 필요. MVP에서는 14.x 유지 권장.

### 스타일링
| 분류 | 기술 | 선정 이유 |
|------|------|-----------|
| CSS 프레임워크 | Tailwind CSS 3.x | 유틸리티 기반 빠른 UI 개발, Next.js 공식 지원 |
| 아이콘 | lucide-react | 경량, tree-shakeable, MIT 라이선스 |

### 지도
| 분류 | 기술 | 선정 이유 |
|------|------|-----------|
| 지도 API | Kakao Maps JavaScript SDK | 일 30만회 무료, 한국 주소 체계 최적 |
| React 바인딩 | react-kakao-maps-sdk | 선언적 카카오맵 사용, Next.js App Router 호환 |

### 상태 관리 및 데이터 페칭
| 분류 | 기술 | 선정 이유 |
|------|------|-----------|
| 서버 상태 | SWR 2.x | 경량 데이터 페칭, 캐싱, 자동 재검증, Vercel 제작 |
| 클라이언트 상태 | Zustand 4.x | 필터 상태 관리, 보일러플레이트 최소, 번들 1KB |

### 백엔드 (API Routes)
| 분류 | 기술 | 선정 이유 |
|------|------|-----------|
| HTTP 클라이언트 | 내장 fetch (Node.js 18+) | 외부 의존성 불필요, Next.js 서버 환경 기본 제공 |
| Rate Limiter | p-limit + delay 유틸 | 네이버 API 요청 속도 제어 |
| 검증 | zod | 쿼리 파라미터/응답 검증, 타입 추론 |

### package.json 주요 의존성 요약
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-kakao-maps-sdk": "^1.1.0",
    "swr": "^2.2.0",
    "zustand": "^4.5.0",
    "zod": "^3.23.0",
    "lucide-react": "^0.400.0",
    "p-limit": "^6.0.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "@types/react": "^18.3.0",
    "@types/node": "^20.0.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",
    "prettier": "^3.3.0",
    "tsx": "^4.0.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "fetch-regions": "tsx scripts/fetch-regions.ts"
  }
}
```

---

## 3. 데이터 모델

### 3-1. 매물 정보 스키마 (Article)

내부 도메인 모델. 네이버 API 응답을 정규화하여 사용한다.

```typescript
// src/types/article.ts

/** 거래 유형 */
type TradeType = "SALE" | "JEONSE" | "MONTHLY";

/** 건물 유형 */
type BuildingType = "APT" | "VILLA" | "OFFICETEL";

/** 매물 핵심 정보 */
interface Article {
  id: string;                    // 네이버 매물 고유 ID (articleNo)
  tradeType: TradeType;          // 거래 유형
  buildingType: BuildingType;    // 건물 유형
  articleName: string;           // 매물명 (단지명 또는 건물명)

  // 위치 정보
  address: string;               // 지번 주소
  roadAddress: string;           // 도로명 주소
  gu: string;                    // 구 (예: "강남구")
  dong: string;                  // 동 (예: "역삼동")
  lat: number;                   // 위도
  lng: number;                   // 경도

  // 가격 정보
  dealPrice: number | null;      // 매매가 (만원 단위)
  deposit: number | null;        // 보증금 (만원 단위)
  monthlyRent: number | null;    // 월세 (만원 단위)
  priceText: string;             // 원본 가격 텍스트 ("3억 5,000")

  // 면적 정보
  supplyArea: number;            // 공급면적 (m2)
  exclusiveArea: number;         // 전용면적 (m2)
  supplyAreaPyeong: number;      // 공급면적 (평)
  exclusiveAreaPyeong: number;   // 전용면적 (평)

  // 건물 정보
  floor: string;                 // 층수 ("3/15")
  totalFloor: number;            // 총 층수
  buildYear: string | null;      // 건축년도
  direction: string | null;      // 방향 ("남향", "동향" 등)
  roomCount: number | null;      // 방 수
  bathroomCount: number | null;  // 욕실 수

  // 메타
  description: string;           // 매물 설명
  confirmDate: string;           // 확인일자
  agentName: string;             // 중개사
  articleUrl: string;            // 네이버부동산 원본 링크

  // 이미지
  thumbnailUrl: string | null;   // 썸네일 이미지 URL

  // [신규] 상세 정보 가용 여부
  hasDetailInfo: boolean;        // 상세 API 성공 여부
}
```

### 3-2. 필터 스키마 (Filter)

```typescript
// src/types/filter.ts

interface FilterState {
  // 지역 필터
  guCode: string | null;           // 선택된 구 코드 (cortarNo)
  dongCode: string | null;         // 선택된 동 코드 (cortarNo)

  // 거래 유형 (복수 선택 가능)
  tradeTypes: TradeType[];         // ["SALE", "JEONSE", "MONTHLY"]

  // [신규] 주요 거래 유형 (가격 필터 기준)
  primaryTradeType: TradeType;     // 첫 번째 선택된 거래유형

  // 건물 유형 (복수 선택 가능)
  buildingTypes: BuildingType[];   // ["APT", "VILLA", "OFFICETEL"]

  // 매매가 범위 (만원)
  dealPriceRange: [number, number] | null;

  // 보증금 범위 (만원)
  depositRange: [number, number] | null;

  // 월세 범위 (만원)
  monthlyRentRange: [number, number] | null;

  // 전용면적 범위 (m2)
  areaRange: [number, number] | null;

  // 정렬 (기본값: recent)
  sortBy: "price_asc" | "price_desc" | "area_asc" | "area_desc" | "recent";

  // 페이지네이션
  page: number;

  // [신규] 페이지당 매물 수 (기본값: 20)
  pageSize: number;
}

// [신규] 기본 필터 값
const DEFAULT_FILTER: FilterState = {
  guCode: null,
  dongCode: null,
  tradeTypes: ["SALE"],
  primaryTradeType: "SALE",
  buildingTypes: ["APT"],
  dealPriceRange: null,
  depositRange: null,
  monthlyRentRange: null,
  areaRange: null,
  sortBy: "recent",
  page: 1,
  pageSize: 20,
};
```

### 3-3. 지역 스키마 (Region)

```typescript
// src/types/region.ts

interface Region {
  cortarNo: string;     // 법정동코드 (예: "1168000000")
  name: string;         // 지역명 (예: "강남구")
  lat: number;          // 중심 위도
  lng: number;          // 중심 경도
}

// [신규] Bounds 타입 - 네이버 API 호출용
interface Bounds {
  sw: [number, number]; // [남서 위도, 남서 경도]
  ne: [number, number]; // [북동 위도, 북동 경도]
}

interface District extends Region {
  // 구 단위 - 서울 25개 구
  dongCount: number;    // 소속 동 개수
  bounds: Bounds;       // 구 경계 좌표
}

interface Dong extends Region {
  // 동 단위 - 구 하위 법정동
  guCode: string;       // 상위 구 코드
  guName: string;       // 상위 구 이름
  bounds: Bounds;       // 동 경계 좌표
}
```

### 3-4. 네이버 API 응답 타입 (Raw)

```typescript
// src/lib/naver/types.ts

/** 네이버 m.land.naver.com cluster API 응답 (articleList) */
interface NaverArticleListResponse {
  isMoreData: boolean;
  body: NaverArticleItem[];
}

interface NaverArticleItem {
  atclNo: string;           // 매물번호
  atclNm: string;           // 매물명
  rletTpNm: string;         // 부동산유형명 ("아파트", "오피스텔" 등)
  tradTpNm: string;         // 거래유형명 ("매매", "전세", "월세")
  flrInfo: string;          // 층 정보 ("3/15")
  prc: number;              // 가격 (만원)
  hanPrc: string;           // 한글 가격 ("3억 5,000")
  rentPrc: number;          // 월세 (만원)
  spc1: number;             // 공급면적 (m2)
  spc2: number;             // 전용면적 (m2)
  direction: string;        // 방향
  atclCfmYmd: string;       // 확인일자 (YYYYMMDD)
  lat: number;              // 위도
  lng: number;              // 경도
  atclFetrDesc: string;     // 매물 특징 설명
  tagList: string[];        // 태그 목록
  bildNm: string;           // 건물명
  cpNm: string;             // 중개업소명
  rltrNm: string;           // 중개사명
  imgSrc: string;           // 이미지 URL
  // ... 기타 필드
}
```

---

## 4. API 설계

모든 API는 Next.js App Router의 Route Handlers로 구현한다. 네이버 API를 서버 사이드에서 프록시하여 CORS 문제를 회피하고, 클라이언트에 정규화된 응답을 제공한다.

### 4-0. [신규] API 응답 헬퍼

```typescript
// src/lib/api-response.ts

import { NextResponse } from 'next/server';

type ErrorCode =
  | 'INVALID_PARAMS'
  | 'NAVER_API_ERROR'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'DETAIL_UNAVAILABLE'  // [신규] 상세 API 실패
  | 'INTERNAL_ERROR';

export function apiSuccess<T>(data: T) {
  return NextResponse.json({ success: true, data });
}

export function apiError(code: ErrorCode, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}
```

### 4-1. 매물 목록 조회

```
GET /api/articles
```

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| cortarNo | string | O | 법정동코드 (구 또는 동) | "1168000000" |
| tradeType | string | X | 거래유형 (쉼표 구분) | "SALE,JEONSE" |
| buildingType | string | X | 건물유형 (쉼표 구분) | "APT,OFFICETEL" |
| priceMin | number | X | 최소 가격 (만원) | 10000 |
| priceMax | number | X | 최대 가격 (만원) | 90000 |
| depositMin | number | X | 최소 보증금 (만원) | 5000 |
| depositMax | number | X | 최대 보증금 (만원) | 50000 |
| rentMin | number | X | 최소 월세 (만원) | 30 |
| rentMax | number | X | 최대 월세 (만원) | 150 |
| areaMin | number | X | 최소 전용면적 (m2) | 33 |
| areaMax | number | X | 최대 전용면적 (m2) | 132 |
| sort | string | X | 정렬 기준 (기본: recent) | "price_asc" |
| page | number | X | 페이지 번호 (기본 1) | 1 |
| pageSize | number | X | 페이지당 개수 (기본 20, 최대 50) | 20 |

**내부 처리 흐름** (v3 업데이트):

```
1. zod로 파라미터 검증
2. cortarNo로 seoul-districts.json에서 bounds 조회 (region-lookup.ts)
3. bounds → btm/lft/top/rgt 변환
4. 줌 레벨 결정: 구 단위(cortarNo 끝 5자리가 00000) → z=13, 동 단위 → z=15
5. [v3 수정] 서버 캐시 확인 (캐시 키: 모든 필터 파라미터 포함)
   - 캐시 키 구성: cortarNo:tradeTypes:buildingTypes:priceMin:priceMax:depositMin:depositMax:rentMin:rentMax:areaMin:areaMax:sort:page:pageSize
6. 캐시 miss 시 네이버 API 호출
7. 응답 변환 후 캐시 저장 (TTL: 5분)
8. 클라이언트 응답 반환
```

**응답 (200)**
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": "2429861377",
        "tradeType": "SALE",
        "buildingType": "APT",
        "articleName": "래미안퍼스티지",
        "address": "서울시 서초구 반포동 18-1",
        "gu": "서초구",
        "dong": "반포동",
        "lat": 37.5048,
        "lng": 127.0058,
        "dealPrice": 350000,
        "deposit": null,
        "monthlyRent": null,
        "priceText": "35억",
        "supplyArea": 221.58,
        "exclusiveArea": 175.82,
        "exclusiveAreaPyeong": 53,
        "floor": "15/35",
        "direction": "남향",
        "confirmDate": "2026-03-04",
        "agentName": "반포공인중개사",
        "thumbnailUrl": "https://...",
        "hasDetailInfo": true
      }
    ],
    "totalCount": 142,
    "hasMore": true,
    "page": 1,
    "pageSize": 20,
    "cached": true,
    "cachedAt": "2026-03-05T10:30:00Z"
  }
}
```

> **[v3.1 추가] totalCount 및 Pagination 처리** (Analyst 피드백 반영):
> - 네이버 API는 `totalCount`를 직접 제공하지 않고 `isMoreData` (boolean)만 반환
> - **MVP 접근법**: `isMoreData` 기반 "더보기" 버튼 방식 사용
>   - `hasMore: true`이면 "더보기" 버튼 표시
>   - 전통적인 페이지 번호 네비게이션 대신 "Load More" 패턴
> - **대안** (구현 복잡도 증가): 첫 페이지 로드 시 여러 페이지를 병렬 호출하여 총 개수 추정
> - `totalCount`가 응답에 포함된 경우: 네이버 API가 실제로 제공한다면 그 값 사용

### 4-2. 매물 상세 조회 (Fallback 전략 포함)

```
GET /api/articles/:id
```

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| id (path) | string | O | 매물 ID (articleNo) |
| buildingType | string | O | 건물유형 (상세 API 호출에 필요) |
| tradeType | string | O | 거래유형 |

**[v3.1 수정] Fallback 전략** (Analyst 피드백 반영 - 데이터 흐름 재정리):

> **핵심 결정**: 서버가 HTTP 200으로 기본 데이터를 직접 반환 (Option A 채택)
> - SWR `fallbackData`는 초기 캐시 용도이지 에러 fallback이 아님
> - 서버가 200 응답을 주면 SWR은 그것을 성공으로 처리하므로 fallbackData 무시됨
> - 따라서 서버가 직접 목록 수준 데이터를 포함하여 반환하는 것이 단순하고 명확함

```
서버 측 (API Route) - 단일 책임:
1. fin.land.naver.com/front-api 호출 시도 (타임아웃: 5초)
2. 성공 시: 전체 상세 정보 반환 (hasDetailInfo: true)
3. 실패 시 (4xx/5xx/timeout):
   - HTTP 200으로 응답 (에러 아님)
   - hasDetailInfo: false 플래그 설정
   - 클라이언트가 쿼리 파라미터로 전달한 기본 정보를 그대로 반환
   - fallbackReason: "상세 정보를 불러올 수 없습니다" 메시지 포함

클라이언트 측 (기본 정보 전달):
1. ArticleCard 클릭 시, 목록에서 확보한 Article 객체의 핵심 필드를 쿼리 파라미터로 전달
2. GET /api/articles/:id?fallbackData=<encoded-basic-info>
3. 서버가 상세 API 실패 시 이 기본 정보를 그대로 반환
4. hasDetailInfo: false이면 UI에서 "상세 정보 불가" 안내 + 네이버 원문 링크 제공
```

**API 호출 예시**:
```typescript
// ArticleCard 클릭 핸들러
const handleCardClick = (article: Article) => {
  // 기본 정보를 쿼리 파라미터로 인코딩하여 전달
  const fallbackData = encodeURIComponent(JSON.stringify({
    articleName: article.articleName,
    address: article.address,
    tradeType: article.tradeType,
    buildingType: article.buildingType,
    dealPrice: article.dealPrice,
    deposit: article.deposit,
    monthlyRent: article.monthlyRent,
    exclusiveArea: article.exclusiveArea,
    floor: article.floor,
    thumbnailUrl: article.thumbnailUrl,
    articleUrl: article.articleUrl,
  }));

  // SWR이 이 URL로 fetch
  setSelectedArticleId(article.id);
  setFallbackParam(fallbackData);
  setDetailPanelOpen(true);
};

// src/hooks/useArticleDetail.ts
export function useArticleDetail(id: string | null, fallbackParam?: string) {
  const url = id
    ? `/api/articles/${id}?buildingType=APT&tradeType=SALE${fallbackParam ? `&fallbackData=${fallbackParam}` : ''}`
    : null;

  return useSWR(url, fetcher, { revalidateOnFocus: false });
}
```

**응답 (200) - 상세 정보 가용**
```json
{
  "success": true,
  "data": {
    "id": "2429861377",
    "articleName": "래미안퍼스티지",
    "address": "서울시 서초구 반포동 18-1",
    "roadAddress": "서울시 서초구 반포대로 10길 20",
    "tradeType": "SALE",
    "buildingType": "APT",
    "dealPrice": 350000,
    "supplyArea": 221.58,
    "exclusiveArea": 175.82,
    "floor": "15/35",
    "totalFloor": 35,
    "direction": "남향",
    "roomCount": 4,
    "bathroomCount": 2,
    "buildYear": "2009",
    "description": "한강조망 가능, 풀리모델링",
    "agentName": "반포공인중개사",
    "articleUrl": "https://new.land.naver.com/...",
    "thumbnailUrl": "https://...",
    "hasDetailInfo": true
  }
}
```

**응답 (200) - 상세 정보 불가 (Fallback)**
```json
{
  "success": true,
  "data": {
    "id": "2429861377",
    "articleName": "래미안퍼스티지",
    "address": "서울시 서초구 반포동 18-1",
    "tradeType": "SALE",
    "buildingType": "APT",
    "dealPrice": 350000,
    "exclusiveArea": 175.82,
    "floor": "15/35",
    "direction": "남향",
    "confirmDate": "2026-03-04",
    "agentName": "반포공인중개사",
    "articleUrl": "https://new.land.naver.com/...",
    "thumbnailUrl": "https://...",
    "hasDetailInfo": false,
    "fallbackReason": "상세 정보를 불러올 수 없습니다"
  }
}
```

### 4-3. 지역 목록 조회

```
GET /api/regions
```

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| type | string | O | "gu" 또는 "dong" | "gu" |
| guCode | string | 조건부 | type=dong일 때 필수 | "1168000000" |

**응답 (200) - 구 목록**
```json
{
  "success": true,
  "data": [
    { "cortarNo": "1168000000", "name": "강남구", "lat": 37.5172, "lng": 127.0473, "dongCount": 22 },
    { "cortarNo": "1171000000", "name": "송파구", "lat": 37.5145, "lng": 127.1059, "dongCount": 27 }
  ]
}
```

### 4-4. 에러 응답 규격

```json
{
  "success": false,
  "error": {
    "code": "NAVER_API_ERROR",
    "message": "네이버부동산 API 요청에 실패했습니다. 잠시 후 다시 시도해주세요."
  }
}
```

에러 코드 목록:
- `INVALID_PARAMS` (400) - 잘못된 파라미터
- `NAVER_API_ERROR` (502) - 네이버 API 호출 실패
- `RATE_LIMITED` (429) - 요청 빈도 초과
- `NOT_FOUND` (404) - 매물 없음
- `DETAIL_UNAVAILABLE` (200) - [신규] 상세 API 실패 (목록 데이터로 fallback)
- `INTERNAL_ERROR` (500) - 서버 내부 오류

---

## 5. UI/UX 설계

### 5-1. 전체 레이아웃

```
+------------------------------------------------------------------+
|  [Header] 서울 부동산 매물  [🔍 검색창: 구/동 검색]                    |
+------------------------------------------------------------------+
|           |                                                       |
| [Sidebar] |  [KakaoMap - 지도 영역]                                 |
|           |                                                       |
| - 구 선택  |   서울 전체 지도                                        |
| - 동 선택  |   구 마커 클릭 -> 확대 -> 동 마커 표시                      |
|           |   동 마커 클릭 -> 매물 마커 표시                            |
| [Filters] |                                                       |
| - 거래유형 |                                                       |
| - 건물유형 |                                                       |
| - 가격대  |                                                       |
| - 평수    |                                                       |
|           |                                                       |
| [검색]    |                                                       |
| [초기화]  |                                                       |
+-----------+-------------------------------------------------------+
|                                                                   |
|  [ArticleList - 매물 목록] (또는 빈 상태 가이드)                       |
|  +-------------+ +-------------+ +-------------+ +-------------+  |
|  | ArticleCard | | ArticleCard | | ArticleCard | | ArticleCard |  |
|  +-------------+ +-------------+ +-------------+ +-------------+  |
|                                                                   |
|  [Pagination - 1 2 3 ... 10]                                     |
+-------------------------------------------------------------------+
```

### 5-2. [수정] 반응형 브레이크포인트

> MVP 범위 조정: 태블릿 전용 레이아웃 제외, 데스크톱/모바일 2단계만 지원

| 브레이크포인트 | 레이아웃 |
|----------------|----------|
| Desktop (768px+) | 사이드바 좌측 고정 + 지도 우측 + 하단 매물 목록 |
| Mobile (< 768px) | [변경] 지도 전체 화면 + 하단 시트(Bottom Sheet)로 필터/목록 접근 |

**[신규] 모바일 Bottom Sheet 패턴** (Analyst 피드백 반영):
- 지도가 전체 화면을 차지
- 하단 시트를 위로 드래그하여 필터/매물 목록 표시
- 3단계 높이: 미니(핸들만), 중간(필터 + 매물 2개), 전체(스크롤 가능 목록)
- 참고: 직방/다방 모바일 UX

### 5-3. [수정] 컴포넌트별 상세

#### Header
- 서비스명 "서울 부동산 매물"
- **[신규] 검색바**: 구/동 이름 자동완성 검색 (`RegionSearch.tsx`)
- 현재 선택된 지역 표시 (예: "강남구 > 역삼동")

#### [신규] RegionSearch (구/동 검색)
- `public/data/seoul-districts.json` 기반 클라이언트 사이드 검색
- API 호출 없이 로컬 필터링
- 입력 시 자동완성 드롭다운 (최대 10개)
- 선택 시 해당 구/동으로 지도 이동 + 필터 갱신

#### Sidebar (필터 + 지역 선택)
- **지역 선택**: 드롭다운 2단계 (구 -> 동)
  - 구 선택 시 지도 해당 구로 이동
  - 동 선택 시 지도 해당 동으로 이동
- **거래유형 필터**: 토글 버튼 그룹 (매매 / 전세 / 월세) - 복수 선택 가능
- **건물유형 필터**: 토글 버튼 그룹 (아파트 / 빌라 / 오피스텔) - 복수 선택 가능
- **[수정] 가격 필터**:
  - **주요 거래유형 기준으로 표시** (첫 번째 선택된 유형)
  - 매매 선택 시: 매매가 범위 슬라이더
  - 전세 선택 시: 보증금 범위 슬라이더
  - 월세 선택 시: 보증금 + 월세 범위 슬라이더
  - 복수 거래유형 선택 시: "매매 기준" 또는 "전세 기준" 등 라벨 표시
- **평수 필터**: 범위 슬라이더 또는 프리셋 버튼
- **[수정] 검색 버튼**: 필터 적용하여 매물 조회 실행 (자동 재조회 아님)
- **[신규] 초기화 버튼**: 모든 필터를 기본값으로 리셋

#### [신규] 가격 슬라이더 범위 정의 (Analyst 피드백 반영)

| 거래유형 | 범위 | 스텝 | 비고 |
|----------|------|------|------|
| 매매가 | 0 ~ 50억 | 1000만원 (10억 미만), 5000만원 (10억 이상) | 비선형 스케일 |
| 보증금 | 0 ~ 20억 | 500만원 | |
| 월세 | 0 ~ 500만원 | 10만원 | |

- 슬라이더 양 끝에 직접 입력 가능한 텍스트 필드 병행
- "제한 없음" 선택 시 파라미터 생략 (API에 max 값 미전송)

#### KakaoMap (지도)
- **초기 상태**: 서울 전체 중심 (level 8, 37.5665, 126.9780)
- **[변경] 구 단위**: 마커 + 라벨로 구 이름 표시 (폴리곤 제외)
- **[변경] 동 단위**: 마커 + 라벨로 동 이름 표시 (폴리곤 제외)
- **매물 마커**: 동 선택 후 개별 매물 위치에 마커 표시
- **마커 클릭**: 매물 간단 정보 인포윈도우 표시
- **지도 클릭과 사이드바 연동**: 지도에서 구/동 마커 클릭 시 사이드바 드롭다운도 갱신
- **[신규] 매물 카드 연동**: 매물 카드 호버 시 해당 마커 하이라이트 (데스크톱)
- **[신규] 마커 클러스터링**: 동일 위치 매물이 3개 이상일 때 클러스터 표시

#### [신규] ArticleEmpty (빈 상태 / 초기 가이드) (Analyst 피드백 반영)

3가지 상태:

1. **초기 진입 상태** (지역 미선택):
   ```
   지역을 선택하면 매물을 확인할 수 있습니다.

   [인기 지역 바로가기]
   강남구 | 서초구 | 마포구 | 송파구 | 용산구
   ```

2. **검색 결과 없음** (필터 조건에 맞는 매물 없음):
   ```
   조건에 맞는 매물이 없습니다.

   필터 조건을 완화해보세요.
   [필터 초기화]
   ```

3. **API 에러 상태**:
   ```
   매물 정보를 불러올 수 없습니다.

   잠시 후 다시 시도해주세요.
   [네이버부동산에서 직접 확인하기 →]
   [다시 시도]
   ```

#### ArticleCard (매물 카드)
```
+-----------------------------------------------+
| [썸네일]  래미안퍼스티지              [매매] [APT] |
|           서초구 반포동                          |
|           35억                                 |
|           전용 175.82m2 (53평) | 15층/35층       |
|           남향 | 2009년                         |
+-----------------------------------------------+
```

- 필드가 null인 경우 해당 항목 생략 (예: 방향 없으면 표시 안 함)
- 호버 시 지도 마커 하이라이트 (데스크톱)

#### [수정] ArticleDetail (매물 상세 - 슬라이드 패널)

> 결정: 모달이 아닌 **우측 슬라이드 패널** 방식 사용

- 데스크톱: 우측에서 슬라이드 인 (너비 400px)
- 모바일: 전체 화면 슬라이드

**hasDetailInfo: true 인 경우** (상세 정보 가용):
- 상세 정보: 주소, 가격, 면적, 층수, 방향, 방/욕실 수, 건축년도
- 매물 설명
- 중개사 정보
- 네이버부동산 원문 링크

**hasDetailInfo: false 인 경우** (Fallback):
- 목록에서 확보한 기본 정보만 표시
- "상세 정보를 불러올 수 없습니다" 안내 메시지
- 네이버부동산 원문 링크 (필수 제공)

---

## 6. 네이버부동산 크롤링 전략

### 6-1. 사용 API 엔드포인트

네이버부동산은 공식 API를 제공하지 않으므로, 내부 API를 리버스 엔지니어링하여 사용한다.

#### (1) 지역 코드 조회 API
```
GET https://new.land.naver.com/api/regions/list?cortarNo={cortarNo}
```
- `cortarNo=0000000000` -> 시/도 목록 반환
- `cortarNo=1100000000` (서울) -> 서울 25개 구 반환
- `cortarNo=1168000000` (강남구) -> 강남구 내 동 반환
- **활용**: 서울 구/동 코드 데이터를 사전 수집하여 `public/data/seoul-districts.json`에 정적 저장. 런타임에는 호출하지 않음.

#### (2) 매물 목록 조회 API (Cluster)
```
GET https://m.land.naver.com/cluster/ajax/articleList
```
| 파라미터 | 설명 | 예시 값 |
|----------|------|---------|
| rletTpCd | 부동산유형 (콜론 구분) | APT:VL:OPST |
| tradTpCd | 거래유형 (콜론 구분) | A1:B1:B2 |
| z | 줌 레벨 | 15 |
| lat | 중심 위도 | 37.5007 |
| lon | 중심 경도 | 127.0365 |
| btm | 하단 위도 | 37.4950 |
| lft | 좌측 경도 | 127.0300 |
| top | 상단 위도 | 37.5064 |
| rgt | 우측 경도 | 127.0430 |
| spcMin | 최소 면적 (m2) | 33 |
| spcMax | 최대 면적 (m2) | 300 |
| dprcMin | 최소 매매가/보증금 (만원) | 10000 |
| dprcMax | 최대 매매가/보증금 (만원) | 90000 |
| wprcMin | 최소 월세 (만원) | 0 |
| wprcMax | 최대 월세 (만원) | 150 |
| page | 페이지 번호 | 1 |

#### (3) 매물 상세 조회 API (Front API) - 불안정
```
GET https://fin.land.naver.com/front-api/v1/article/basicInfo?articleId={id}&realEstateType={type}&tradeType={tradeType}
```
- `realEstateType`: A01(아파트), A02(오피스텔), B01(빌라) 등
- `tradeType`: A1(매매), B1(전세), B2(월세)
- **주의**: 이 API는 추가 인증을 요구할 수 있음. 실패 시 목록 데이터로 fallback.

### 6-2. [신규] cortarNo → 좌표 변환 (region-lookup.ts)

```typescript
// src/lib/region-lookup.ts

import seoulDistricts from '@/public/data/seoul-districts.json';

interface BoundsParams {
  lat: number;   // 중심 위도
  lon: number;   // 중심 경도
  btm: number;   // 하단 위도
  lft: number;   // 좌측 경도
  top: number;   // 상단 위도
  rgt: number;   // 우측 경도
  z: number;     // 줌 레벨
}

/**
 * cortarNo로 seoul-districts.json에서 해당 지역 조회
 * @returns 네이버 API 호출에 필요한 좌표 파라미터
 *
 * [v3 Critical Fix] Analyst 피드백:
 * - 기존 로직: cortarNo.endsWith('00000')으로 구/동 판별
 * - 문제: 광진구(1121500000), 강북구(1130500000), 금천구(1154500000)는
 *         끝 5자리가 '00000'이 아니므로 동 단위로 오분류됨
 * - 수정: districts 배열에서 직접 lookup하여 구/동 판별
 */
export function cortarNoToBounds(cortarNo: string): BoundsParams | null {
  // [v3 수정] districts 배열에서 직접 lookup하여 구/동 판별
  // (기존 endsWith('00000') 로직은 광진구/강북구/금천구에서 버그 발생)
  const district = seoulDistricts.districts.find(d => d.cortarNo === cortarNo);

  if (district) {
    // 구 단위
    return {
      lat: district.lat,
      lon: district.lng,
      btm: district.bounds.sw[0],
      lft: district.bounds.sw[1],
      top: district.bounds.ne[0],
      rgt: district.bounds.ne[1],
      z: 13,  // 구 단위 줌 레벨
    };
  }

  // 동 단위 - 모든 구의 dongs 배열에서 검색
  for (const dist of seoulDistricts.districts) {
    const dong = dist.dongs.find(d => d.cortarNo === cortarNo);
    if (dong) {
      return {
        lat: dong.lat,
        lon: dong.lng,
        btm: dong.bounds.sw[0],
        lft: dong.bounds.sw[1],
        top: dong.bounds.ne[0],
        rgt: dong.bounds.ne[1],
        z: 15,  // 동 단위 줌 레벨
      };
    }
  }

  return null;
}

/**
 * 검색어로 구/동 찾기 (자동완성용)
 */
export function searchRegions(query: string, limit = 10): Region[] {
  const results: Region[] = [];
  const q = query.toLowerCase();

  for (const district of seoulDistricts.districts) {
    if (district.name.toLowerCase().includes(q)) {
      results.push(district);
    }
    for (const dong of district.dongs) {
      if (dong.name.toLowerCase().includes(q)) {
        results.push({ ...dong, guName: district.name });
      }
    }
    if (results.length >= limit) break;
  }

  return results.slice(0, limit);
}
```

### 6-3. [신규] 서버 사이드 캐싱 (server-cache.ts)

```typescript
// src/lib/cache/server-cache.ts

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const DEFAULT_TTL = 5 * 60 * 1000; // 5분

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  if (Date.now() - entry.timestamp > DEFAULT_TTL) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

export function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * [v3 수정] 캐시 키에 모든 필터 파라미터 포함
 * - Architect/Critic 피드백: 가격/면적/정렬 필터 누락 시 잘못된 캐시 반환 위험
 */
export function buildCacheKey(params: {
  cortarNo: string;
  tradeTypes: string;
  buildingTypes: string;
  priceMin?: number;
  priceMax?: number;
  depositMin?: number;
  depositMax?: number;
  rentMin?: number;
  rentMax?: number;
  areaMin?: number;
  areaMax?: number;
  sort: string;
  page: number;
  pageSize: number;
}): string {
  // undefined 값은 빈 문자열로 정규화하여 일관된 키 생성
  const normalize = (v: number | undefined) => v ?? '';
  return [
    'articles',
    params.cortarNo,
    params.tradeTypes,
    params.buildingTypes,
    normalize(params.priceMin),
    normalize(params.priceMax),
    normalize(params.depositMin),
    normalize(params.depositMax),
    normalize(params.rentMin),
    normalize(params.rentMax),
    normalize(params.areaMin),
    normalize(params.areaMax),
    params.sort,
    params.page,
    params.pageSize,
  ].join(':');
}

// 캐시 정리 (선택적)
export function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > DEFAULT_TTL) {
      cache.delete(key);
    }
  }
}
```

### 6-4. [v3 수정] 데이터 흐름

> **검색 트리거 방식 통일** (Analyst 피드백 반영):
> - MVP에서는 "검색 버튼 클릭" 방식만 사용 (자동 재조회 아님)
> - 사용자가 필터를 변경해도 즉시 API 호출 안 함
> - "검색" 버튼 클릭 시에만 API 호출 발생
> - 이유: API 호출 최소화, 예측 가능한 UX, 서버 부하 감소

```
[사용자 필터 설정]
    |
    v
[사용자 "검색" 버튼 클릭]  ← 트리거 시점 (필터 변경만으로 자동 호출 안 함)
    |
    v
[프론트: useArticles 훅 - 검색 트리거 시 API 호출]
    |
    v
[API Route: 파라미터 검증 (zod)]
    |
    v
[API Route: cortarNo → seoul-districts.json에서 bounds 조회]  ← [신규]
    |
    v
[API Route: bounds → btm/lft/top/rgt 매핑, z 값 결정]  ← [신규]
    |
    v
[API Route: 서버 캐시 확인 (키: cortarNo:tradeTypes:buildingTypes:page)]  ← [신규]
    |
    +-- [캐시 HIT] --> [캐시된 데이터 반환, cached: true]
    |
    +-- [캐시 MISS] --> [NaverLandClient: m.land.naver.com/cluster/ajax/articleList 호출]
                              |  (rate-limited, retry 포함)
                              v
                        [API Route: 네이버 응답 -> 내부 Article 모델 변환 (transform.ts)]
                              |
                              v
                        [API Route: 캐시 저장 (TTL 5분)]  ← [신규]
                              |
                              v
                        [API Route: 정규화된 JSON 응답 반환]
    |
    v
[프론트: SWR 캐싱 + UI 렌더링]
```

### 6-5. Rate Limiting 전략

| 항목 | 설정 |
|------|------|
| 요청 간 최소 간격 | 500ms (개발 중 1000ms) |
| 동시 요청 수 | 1개 (p-limit concurrency=1) |
| 재시도 횟수 | 최대 3회 |
| 재시도 간격 | 지수 백오프 (1s, 2s, 4s) |
| 차단 감지 | HTTP 403/429 응답 시 30초 대기 후 재시도 |
| User-Agent | 브라우저 User-Agent 문자열 사용 |
| Referer | `https://m.land.naver.com/` 헤더 포함 |

### 6-6. 정적 데이터 사전 수집

서울 25개 구, 467개 동의 법정동코드 + 중심좌표 + 경계좌표를 **빌드 타임에 1회** 수집하여 정적 JSON으로 저장한다.

```json
// public/data/seoul-districts.json (예시 구조)
{
  "generatedAt": "2026-03-05T00:00:00Z",
  "districts": [
    {
      "cortarNo": "1168000000",
      "name": "강남구",
      "lat": 37.5172,
      "lng": 127.0473,
      "bounds": { "sw": [37.4909, 127.0175], "ne": [37.5434, 127.0773] },
      "dongs": [
        {
          "cortarNo": "1168010100",
          "name": "역삼동",
          "lat": 37.5007,
          "lng": 127.0365,
          "bounds": { "sw": [37.4950, 127.0300], "ne": [37.5064, 127.0430] }
        }
      ]
    }
  ]
}
```

### 6-7. [신규] scripts/fetch-regions.ts 구현 스펙

```typescript
// scripts/fetch-regions.ts

/**
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

const SEOUL_CORTAR_NO = '1100000000';
const OUTPUT_PATH = 'public/data/seoul-districts.json';
const DELAY_MS = 1000;

// 네이버 지역 API가 좌표를 반환하지 않는 경우:
// 대안 1: 카카오 Geocoding API로 "강남구" -> 좌표 변환
// 대안 2: 공공데이터포털 법정동 중심좌표 데이터 활용
// https://www.data.go.kr/data/15123287/fileData.do
```

---

## 7. 구현 단계

### Phase 1: 프로젝트 초기 세팅 및 정적 데이터

**목표**: 프로젝트 골격 생성, 서울 구/동 데이터 확보

| 순서 | 작업 | 파일 | 완료 기준 |
|------|------|------|-----------|
| 1-1 | Next.js 프로젝트 생성 (App Router, TypeScript, Tailwind) | `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts` | `pnpm dev` 정상 실행 |
| 1-2 | 디렉토리 구조 생성 | `src/` 하위 폴더 전체 | 빈 디렉토리 구조 완성 |
| 1-3 | 타입 정의 | `src/types/article.ts`, `filter.ts`, `region.ts` | 모든 도메인 타입 정의 완료 |
| 1-4 | 상수 및 코드 매핑 | `src/lib/constants.ts` | 네이버 코드 매핑 + 가격 슬라이더 범위 상수 |
| 1-5 | [수정] 서울 구/동 데이터 수집 스크립트 | `scripts/fetch-regions.ts` | `pnpm fetch-regions` 실행 시 `seoul-districts.json` 생성. 좌표 미제공 시 대안 데이터 소스 사용 |
| 1-6 | [신규] cortarNo → 좌표 변환 유틸 | `src/lib/region-lookup.ts` | cortarNoToBounds() 함수 동작 확인 |
| 1-7 | 법정동코드 유틸 | `src/lib/region-codes.ts` | 코드로 구/동 조회 함수 |
| 1-8 | .env.local 템플릿 | `.env.local.example` | KAKAO_APP_KEY 항목 |

### Phase 2: 네이버부동산 크롤링 백엔드

**목표**: API Routes를 통한 매물 데이터 조회 파이프라인 구축

| 순서 | 작업 | 파일 | 완료 기준 |
|------|------|------|-----------|
| 2-0 | [신규] API 응답 헬퍼 | `src/lib/api-response.ts` | apiSuccess(), apiError() 함수 |
| 2-1 | 네이버 API 엔드포인트 상수 | `src/lib/naver/endpoints.ts` | URL 상수 정의 |
| 2-2 | 네이버 응답 타입 정의 | `src/lib/naver/types.ts` | Raw 응답 타입 완성 |
| 2-3 | HTTP 클라이언트 (rate-limit, retry) | `src/lib/naver/client.ts` | 네이버 API 호출 + 속도 제어 |
| 2-4 | 응답 변환기 | `src/lib/naver/transform.ts` | 네이버 응답 -> Article 변환 |
| 2-5 | 가격/면적 포맷팅 유틸 | `src/lib/format.ts` | 만원->억 변환, m2->평 변환 |
| 2-6 | [신규] 서버 캐시 | `src/lib/cache/server-cache.ts` | getCached(), setCache() 동작 확인 |
| 2-7 | 파라미터 검증 스키마 | `src/app/api/articles/route.ts` 내 zod | 유효하지 않은 파라미터 400 반환 |
| 2-8 | [수정] 매물 목록 API Route | `src/app/api/articles/route.ts` | cortarNo→bounds 변환 + 캐싱 적용. cortarNo=1168000000으로 호출 시 매물 목록 반환 |
| 2-9 | [수정] 매물 상세 API Route | `src/app/api/articles/[id]/route.ts` | fin.land 실패 시 hasDetailInfo=false와 함께 목록 데이터 반환 |
| 2-10 | 지역 목록 API Route | `src/app/api/regions/route.ts` | GET /api/regions 정상 응답 |

### Phase 3: 카카오맵 지도 UI

**목표**: 지도 기반으로 서울 구/동을 선택할 수 있는 인터랙티브 맵

| 순서 | 작업 | 파일 | 완료 기준 |
|------|------|------|-----------|
| 3-1 | 카카오맵 SDK 로더 | `src/lib/kakao/loader.ts`, `src/app/layout.tsx` | Script 태그 로딩, window.kakao 사용 가능 |
| 3-2 | 카카오맵 래퍼 컴포넌트 | `src/components/map/KakaoMap.tsx` | 서울 중심 지도 렌더링 |
| 3-3 | [변경] 구 단위 마커 | `src/components/map/DistrictMarker.tsx` | 구 이름 마커 (폴리곤 아님), 클릭 시 확대 |
| 3-4 | [변경] 동 단위 마커 | `src/components/map/DongMarker.tsx` | 동 이름 마커 (폴리곤 아님), 클릭 시 필터 갱신 |
| 3-5 | 매물 마커 | `src/components/map/ArticleMarker.tsx` | 매물 위치 마커, 클러스터링 적용 |
| 3-6 | 지도-사이드바 연동 | `src/store/filterStore.ts` | 지도 클릭 -> 필터 상태 갱신 (300ms 이내) |

### Phase 4: 필터 및 사이드바 UI

**목표**: 사용자가 조건을 설정하여 매물을 필터링할 수 있는 UI

| 순서 | 작업 | 파일 | 완료 기준 |
|------|------|------|-----------|
| 4-1 | [v3 수정] Zustand 필터 스토어 | `src/store/filterStore.ts` | 필터 상태 CRUD + 초기화 함수 + `searchTrigger` 카운터 (버튼 클릭 시 증가하여 useArticles 트리거) |
| 4-2 | 필터 패널 컨테이너 | `src/components/filter/FilterPanel.tsx` | 사이드바 내 필터 영역 |
| 4-3 | 거래유형 필터 | `src/components/filter/TradeTypeFilter.tsx` | 매매/전세/월세 토글, primaryTradeType 연동 |
| 4-4 | 건물유형 필터 | `src/components/filter/BuildingTypeFilter.tsx` | APT/빌라/오피스텔 토글 |
| 4-5 | [수정] 가격 범위 필터 | `src/components/filter/PriceRangeFilter.tsx` | primaryTradeType에 따라 슬라이더 동적 전환. 범위 상수 적용 |
| 4-6 | 평수 필터 | `src/components/filter/AreaFilter.tsx` | 면적 범위 선택 |
| 4-7 | [신규] 필터 초기화 버튼 | `src/components/filter/FilterResetButton.tsx` | 클릭 시 모든 필터 DEFAULT_FILTER로 리셋 |
| 4-8 | 지역 선택 드롭다운 | `src/components/layout/Sidebar.tsx` | 구/동 2단계 선택 |
| 4-9 | [신규] 지역 검색 자동완성 | `src/components/search/RegionSearch.tsx` | 입력 시 구/동 자동완성, 선택 시 필터 갱신 |

### Phase 5: 매물 목록 및 상세 UI

**목표**: 조회된 매물을 카드 형태로 표시하고 상세 정보 확인

| 순서 | 작업 | 파일 | 완료 기준 |
|------|------|------|-----------|
| 5-1 | [v3 변경] 디바운스 훅 | `src/hooks/useDebounce.ts` | 지역 검색 자동완성용 (300ms). 매물 조회에는 미사용 |
| 5-2 | [v3 수정] SWR 매물 조회 훅 | `src/hooks/useArticles.ts` | 버튼 클릭 트리거 방식. `enabled` 플래그로 조회 시점 제어. revalidateOnFocus: false |
| 5-3 | [v3 수정] SWR 매물 상세 훅 | `src/hooks/useArticleDetail.ts` | fallbackData 옵션 지원. 목록에서 확보한 Article 객체를 fallback으로 사용 |
| 5-4 | 공통 UI 컴포넌트 | `src/components/common/Badge.tsx`, `PriceDisplay.tsx`, `Pagination.tsx` | 뱃지, 가격 표시, 페이지네이션 (페이지당 20개) |
| 5-5 | [신규] 에러 상태 컴포넌트 | `src/components/common/ErrorState.tsx` | API 에러 + 네이버 직접 링크 제공 |
| 5-6 | [신규] 빈 상태 컴포넌트 | `src/components/article/ArticleEmpty.tsx` | 초기 가이드, 검색 결과 없음, 에러 3가지 상태 |
| 5-7 | 매물 카드 | `src/components/article/ArticleCard.tsx` | 개별 매물 카드 렌더링, null 필드 생략 |
| 5-8 | 매물 목록 | `src/components/article/ArticleList.tsx` | 카드 그리드 + 빈 상태 처리 |
| 5-9 | 로딩 스켈레톤 | `src/components/article/ArticleSkeleton.tsx` | 데이터 로딩 중 UI |
| 5-10 | [수정] 매물 상세 패널 | `src/components/article/ArticleDetail.tsx` | 우측 슬라이드 패널, hasDetailInfo 분기 처리 |

### Phase 6: 페이지 통합 및 레이아웃

**목표**: 전체 컴포넌트를 하나의 페이지로 조합

| 순서 | 작업 | 파일 | 완료 기준 |
|------|------|------|-----------|
| 6-1 | 루트 레이아웃 | `src/app/layout.tsx` | HTML 메타, 폰트, 카카오 스크립트, SWR 글로벌 설정 |
| 6-2 | 헤더 + 검색바 | `src/components/layout/Header.tsx` | 상단 네비게이션 + RegionSearch 통합 |
| 6-3 | 메인 페이지 조합 | `src/app/page.tsx` | Server Component 셸 + Client 영역 분리 |
| 6-4 | 글로벌 스타일 | `src/app/globals.css` | Tailwind base + 커스텀 스타일 |
| 6-5 | [신규] 모바일 하단 시트 | `src/components/layout/MobileBottomSheet.tsx` | 드래그 가능한 3단계 높이 |
| 6-6 | [수정] 반응형 대응 | 전체 컴포넌트 | 데스크톱/모바일 2단계만 지원 |

### Phase 7: 배포 및 마무리

**목표**: Vercel 배포, 환경변수 설정, 최종 검증

| 순서 | 작업 | 파일 | 완료 기준 |
|------|------|------|-----------|
| 7-1 | 환경변수 정리 | `.env.local`, `next.config.ts` | 카카오 API 키 환경변수화 |
| 7-2 | Vercel 배포 설정 | `vercel.json` (필요 시) | Vercel 무료 플랜 배포 성공 |
| 7-3 | 에러 바운더리 | `src/app/error.tsx`, `src/app/not-found.tsx` | 에러/404 페이지 |
| 7-4 | 메타데이터 (SEO) | `src/app/layout.tsx` metadata | title, description, og tags |
| 7-5 | README 작성 | `README.md` | 실행 방법, 환경변수 가이드 |
| 7-6 | [신규] Graceful Degradation UI 검증 | 전체 | 네이버 API 차단 시 에러 메시지 + 직접 링크 작동 확인 |

---

## 8. 리스크 및 대응

### 8-1. 네이버부동산 API 차단 (높음)

**리스크**: 네이버는 비공식 API 사용을 감지하여 IP를 차단할 수 있다. 짧은 시간 대량 요청 시 403/429 응답 반환.

**대응**:
- Rate Limiting 적용: 요청 간 최소 500ms 간격, 동시 요청 1개 제한
- 지수 백오프 재시도: 차단 감지 시 30초 대기
- User-Agent + Referer 헤더 설정으로 브라우저 요청처럼 위장
- **핵심 전략**: 사용자 요청 시에만 실시간 조회 (배치 크롤링 금지)
- **[신규] 서버 사이드 캐싱**: 동일 조건 재요청 시 네이버 API 미호출 (TTL 5분)
- **[신규] Graceful Degradation**: 차단 시 "네이버부동산에서 직접 확인하기" 링크 제공

### 8-2. 네이버 API 구조 변경 (중간)

**리스크**: 비공식 API이므로 예고 없이 엔드포인트, 파라미터, 응답 구조가 변경될 수 있다.

**대응**:
- 네이버 API 관련 코드를 `src/lib/naver/`에 완전 격리 (변경 영향 최소화)
- `transform.ts`에서 응답을 내부 모델로 변환하므로, API 변경 시 이 파일만 수정
- zod 스키마로 응답 구조 검증 -> 구조 변경 시 즉시 에러 감지
- 에러 발생 시 사용자에게 "데이터를 불러올 수 없습니다" 안내 (크래시 방지)

### 8-3. [신규] 매물 상세 API 불안정 (중간)

**리스크**: `fin.land.naver.com/front-api` 엔드포인트가 추가 인증을 요구하거나 응답하지 않을 수 있다.

**대응**:
- 상세 API 호출 타임아웃: 5초
- 실패 시 `hasDetailInfo: false`와 함께 목록 데이터만 반환
- UI에서 "상세 정보를 불러올 수 없습니다" 안내 + 네이버 원문 링크 제공

### 8-4. 카카오맵 API 일일 호출량 초과 (낮음)

**리스크**: 무료 플랜 일 30만회 제한. 지도 타일 로딩, 좌표 변환 등이 모두 카운트됨.

**대응**:
- 개인 프로젝트 + 초기 사용자 소수이므로 현실적 초과 가능성 극히 낮음
- 지도 이동/줌 이벤트에 debounce 적용 (300ms)
- 구/동 좌표 데이터는 정적 JSON에서 로딩 (API 호출 불필요)
- 초과 시 카카오 개발자 콘솔에서 무료 한도 증가 신청 가능

### 8-5. Vercel 무료 플랜 제약 (낮음)

**리스크**: Serverless Function 실행 시간 10초 제한, 월 100GB 대역폭.

**대응**:
- 네이버 API 호출이 느릴 경우 10초 초과 가능 -> 타임아웃 설정 (8초)으로 네이버 응답 미수신 시 조기 에러 반환
- 이미지는 네이버 CDN 직접 링크 사용 (Vercel 대역폭 절약)
- 정적 데이터(구/동 JSON)는 CDN 캐싱됨
- **[신규]** 서버 캐싱으로 네이버 API 호출 빈도 감소 → 타임아웃 위험 감소

### 8-6. 법적 리스크 (참고)

**리스크**: 네이버 이용약관상 자동화된 수단의 데이터 수집이 금지되어 있음.

**대응**:
- 비상업적 개인 프로젝트로 한정 (수익화 금지)
- 대량 배치 크롤링 금지, 사용자 요청 시 실시간 프록시 방식만 사용
- 네이버부동산 원본 링크를 항상 제공하여 원본 출처 명시
- 공개 배포 시 Vercel Password Protection 또는 비공개 유지 권장

### 8-7. SSR/클라이언트 하이드레이션 이슈 (낮음)

**리스크**: 카카오맵 SDK가 window 객체에 의존하여 SSR 시 에러 발생 가능.

**대응**:
- 카카오맵 컴포넌트에 `"use client"` 지시어 사용
- `react-kakao-maps-sdk`가 내부적으로 SSR 호환 처리
- Script 컴포넌트 `strategy="afterInteractive"`로 클라이언트에서만 로딩
- 지도 컴포넌트 `dynamic import`와 `ssr: false` 적용
- **[신규]** 메인 페이지 SSR 경계: Header는 Server Component, 지도/필터/목록은 Client Component로 분리

### 8-8. [신규] 지역 좌표 데이터 확보 실패 (중간)

**리스크**: 네이버 지역 API가 좌표(lat/lng)를 반환하지 않을 수 있음.

**대응**:
- 1차: 네이버 지역 API 응답에서 centerLat/centerLon 확인
- 2차: 공공데이터포털 법정동 중심좌표 데이터 활용 (https://www.data.go.kr/data/15123287/fileData.do)
- 3차: 카카오 Geocoding API로 "강남구" → 좌표 변환 (일 30만회 내)
- bounds 미확보 시: 중심좌표 + 고정 반경 방식으로 대체 검토

---

## 9. [신규] SWR 글로벌 설정

```typescript
// src/app/layout.tsx 또는 src/app/providers.tsx

import { SWRConfig } from 'swr';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,      // 탭 포커스 시 재조회 안 함
        revalidateOnReconnect: false,  // 네트워크 재연결 시 재조회 안 함
        dedupingInterval: 300000,      // 5분 내 동일 요청 중복 방지
        errorRetryCount: 2,            // 에러 시 최대 2회 재시도
      }}
    >
      {children}
    </SWRConfig>
  );
}
```

---

## 10. [신규] MVP 범위 조정 요약

| 항목 | v1 상태 | v2 결정 | 이유 |
|------|---------|---------|------|
| 구/동 경계 폴리곤 | 포함 | **제외** | 데이터 확보 불확실, 마커+라벨로 충분 |
| 태블릿 전용 레이아웃 | 포함 | **제외** | 데스크톱/모바일 2단계로 충분 |
| 구/동 텍스트 검색 | 미포함 | **추가** | 핵심 UX, 정적 데이터 기반 구현 용이 |
| 빈 상태/에러 UI | 미명시 | **추가** | 기본 UX 품질 |
| 필터 초기화 버튼 | 미포함 | **추가** | 구현 비용 최소 |
| 서버 사이드 캐싱 | 미포함 | **추가** | 네이버 API 차단 방어 핵심 |
| 상세 API Fallback | 미포함 | **추가** | API 불안정 대응 |
| 모바일 Bottom Sheet | 탭 전환 | **변경** | 직방/다방 수준 UX |

---

## 부록: 네이버 부동산 API 파라미터 코드 전체 매핑

### rletTpCd (부동산 유형 코드)
| 코드 | 설명 | MVP 사용 |
|------|------|----------|
| APT | 아파트 | O |
| VL | 빌라/연립/다세대 | O |
| OPST | 오피스텔 | O |
| JGC | 재건축 | X |
| ABYG | 아파트분양권 | X |
| OR | 원룸 | X |

### tradTpCd (거래 유형 코드)
| 코드 | 설명 | MVP 사용 |
|------|------|----------|
| A1 | 매매 | O |
| B1 | 전세 | O |
| B2 | 월세 | O |
| B3 | 단기임대 | X |

### 서울시 cortarNo (법정동코드) - 구 단위
| 코드 | 구 |
|------|-----|
| 1111000000 | 종로구 |
| 1114000000 | 중구 |
| 1117000000 | 용산구 |
| 1120000000 | 성동구 |
| 1121500000 | 광진구 |
| 1123000000 | 동대문구 |
| 1126000000 | 중랑구 |
| 1129000000 | 성북구 |
| 1130500000 | 강북구 |
| 1132000000 | 도봉구 |
| 1135000000 | 노원구 |
| 1138000000 | 은평구 |
| 1141000000 | 서대문구 |
| 1144000000 | 마포구 |
| 1147000000 | 양천구 |
| 1150000000 | 강서구 |
| 1153000000 | 구로구 |
| 1154500000 | 금천구 |
| 1156000000 | 영등포구 |
| 1159000000 | 동작구 |
| 1162000000 | 관악구 |
| 1165000000 | 서초구 |
| 1168000000 | 강남구 |
| 1171000000 | 송파구 |
| 1174000000 | 강동구 |
