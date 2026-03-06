<!-- Generated: 2026-03-05 -->

# estate

## Purpose
서울 지역 부동산 매물을 지도 기반으로 조회하는 웹 서비스. 네이버부동산 데이터를 실시간 프록시로 제공.

## Key Files
| File | Description |
|------|-------------|
| `CLAUDE.md` | 프로젝트 컨텍스트 및 개발 규칙 |
| `package.json` | 의존성 및 스크립트 |
| `next.config.ts` | Next.js 설정 |
| `tailwind.config.ts` | Tailwind CSS 설정 |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `src/` | 애플리케이션 소스 코드 |
| `public/` | 정적 자산 (서울 구/동 데이터 포함) |
| `scripts/` | 유틸리티 스크립트 (지역 데이터 수집 등) |
| `.omc/` | OMC 설정 및 기획 문서 |

## For AI Agents

### Working In This Directory
- **기획서 필독**: `.omc/plans/plan-estate-mvp.md`에 상세 설계 포함
- **CLAUDE.md 참조**: 기술 스택, 컨벤션, 프로젝트 구조 확인
- 네이버 크롤링 코드 수정 시 Rate Limiting 규칙 준수

### Testing Requirements
- `pnpm lint` 통과 필수
- API Routes는 실제 네이버 API 호출하므로 주의

### Common Patterns
- App Router 사용 (pages/ 아님)
- `"use client"` 최소화, 필요한 컴포넌트에만
- 타입 정의는 `src/types/`에 집중

## Dependencies

### Internal
- 기획서: `.omc/plans/plan-estate-mvp.md`
- 환경변수: `.env.local` (KAKAO_APP_KEY)

### External
- 네이버부동산 내부 API (비공식)
- 카카오맵 JavaScript SDK

<!-- MANUAL: -->
