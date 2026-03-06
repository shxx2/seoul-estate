# Estate - 서울 부동산 매물 조회 서비스

## 프로젝트 개요
서울 지역 부동산 매물을 지도 기반으로 조회할 수 있는 웹 서비스 (개인 프로젝트)

## 기술 스택
- **프레임워크**: Next.js 14+ (App Router)
- **언어**: TypeScript 5.x
- **스타일링**: Tailwind CSS 3.x
- **지도**: 카카오맵 API (react-kakao-maps-sdk)
- **상태 관리**: Zustand (클라이언트), SWR (서버)
- **데이터 소스**: 네이버부동산 내부 API (크롤링)
- **배포**: Vercel

## 핵심 기능
1. 카카오맵 기반 서울 구/동 선택
2. 건물유형 필터 (아파트/빌라/오피스텔)
3. 거래유형 필터 (매매/전세/월세)
4. 가격/면적 범위 필터
5. 매물 목록 및 상세 정보 표시

## 프로젝트 구조
```
src/
├── app/           # Next.js App Router 페이지 및 API Routes
├── components/    # React 컴포넌트 (map, filter, article, layout, common)
├── hooks/         # 커스텀 훅 (SWR 데이터 페칭)
├── lib/           # 유틸리티 (naver 크롤링, kakao 로더, format)
├── store/         # Zustand 상태 스토어
└── types/         # TypeScript 타입 정의
```

## 개발 규칙

### 네이버 크롤링 (중요)
- `src/lib/naver/`에 모든 크롤링 로직 격리
- Rate Limiting 필수: 요청 간 500ms 간격, 동시 1개
- User-Agent + Referer 헤더 포함
- 배치 크롤링 금지, 사용자 요청 시 실시간 프록시만

### 컴포넌트
- `"use client"` 지시어 필요한 컴포넌트에만 사용
- 카카오맵 컴포넌트는 dynamic import + ssr: false

### API Routes
- zod로 파라미터 검증
- 에러 응답 규격 준수: `{ success: false, error: { code, message } }`

## 자주 사용하는 명령어
```bash
pnpm dev          # 개발 서버
pnpm build        # 프로덕션 빌드
pnpm lint         # ESLint 검사
```

## 환경 변수
```
NEXT_PUBLIC_KAKAO_APP_KEY=  # 카카오맵 JavaScript 키
```

## 참고 자료
- 기획서: `.omc/plans/plan-estate-mvp.md`
- 네이버 API 분석: `src/lib/naver/endpoints.ts`
- 서울 구/동 데이터: `public/data/seoul-districts.json`
