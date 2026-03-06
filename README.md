# 심바네 똘똘한 한채 🏠

서울 지역 부동산 매물을 지도에서 쉽게 검색하는 웹 서비스입니다.

## 주요 기능

- **지도 기반 UI**: 카카오맵을 활용한 서울 전역 매물 탐색
- **다양한 필터**: 거래유형(매매/전세/월세), 건물유형(아파트/빌라/오피스텔), 가격, 면적
- **실시간 데이터**: 네이버부동산 데이터 실시간 조회
- **반응형 디자인**: 데스크톱/모바일 최적화

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS |
| 상태관리 | Zustand |
| 데이터 페칭 | SWR |
| 지도 | react-kakao-maps-sdk |
| 유효성 검사 | Zod |

## 시작하기

### 사전 요구사항

- Node.js 18.x 이상
- pnpm (권장) 또는 npm

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd estate

# 의존성 설치
pnpm install

# 환경변수 설정
cp .env.local.example .env.local
# .env.local 파일에 NEXT_PUBLIC_KAKAO_APP_KEY 입력
```

### 카카오맵 API 키 발급

1. [Kakao Developers](https://developers.kakao.com) 접속
2. 애플리케이션 생성
3. JavaScript 키 복사
4. `.env.local`에 `NEXT_PUBLIC_KAKAO_APP_KEY` 설정

### 개발 서버 실행

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000)에서 확인

### 프로덕션 빌드

```bash
pnpm build
pnpm start
```

## 프로젝트 구조

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API Routes
│   │   ├── articles/   # 매물 조회 API
│   │   └── regions/    # 지역 조회 API
│   ├── fonts/          # 웹 폰트
│   ├── layout.tsx      # 루트 레이아웃
│   └── page.tsx        # 메인 페이지
├── components/         # React 컴포넌트
│   ├── article/        # 매물 관련
│   ├── common/         # 공통 UI
│   ├── filter/         # 필터 UI
│   ├── layout/         # 레이아웃
│   ├── map/            # 지도
│   └── search/         # 검색
├── hooks/              # 커스텀 훅
├── lib/                # 유틸리티
│   ├── cache/          # 서버 캐시
│   ├── kakao/          # 카카오 SDK
│   └── naver/          # 네이버 API 클라이언트
├── store/              # Zustand 스토어
└── types/              # TypeScript 타입
```

## 환경 변수

| 변수명 | 설명 | 필수 |
|--------|------|------|
| `NEXT_PUBLIC_KAKAO_APP_KEY` | 카카오맵 JavaScript SDK 앱 키 | ✅ |

## 스크립트

```bash
pnpm dev          # 개발 서버
pnpm build        # 프로덕션 빌드
pnpm start        # 프로덕션 서버
pnpm lint         # ESLint 검사
pnpm fetch-regions # 서울 지역 데이터 수집
```

## 라이선스

MIT

---

> 이 프로젝트는 MVP 단계입니다. 프로덕션 배포 전 추가 테스트와 최적화가 필요합니다.
