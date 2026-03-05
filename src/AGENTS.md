<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-05 -->

# src

## Purpose
애플리케이션 핵심 소스 코드. Next.js App Router 기반.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `app/` | 페이지, 레이아웃, API Routes |
| `components/` | 재사용 가능한 React 컴포넌트 |
| `hooks/` | 커스텀 React 훅 (SWR 데이터 페칭) |
| `lib/` | 유틸리티 함수 및 외부 API 클라이언트 |
| `store/` | Zustand 상태 관리 |
| `types/` | TypeScript 타입 정의 |

## For AI Agents

### Working In This Directory
- 컴포넌트는 기능별로 서브디렉토리 구분 (`map/`, `filter/`, `article/`, `layout/`, `common/`)
- 네이버 API 관련 코드는 반드시 `lib/naver/`에만 작성
- 타입은 `types/`에 정의하고 각 파일에서 import

### Common Patterns
```typescript
// 클라이언트 컴포넌트
"use client";

// SWR 훅 사용
const { data, error, isLoading } = useArticles(filters);

// Zustand 스토어
const { filters, setFilter } = useFilterStore();
```

<!-- MANUAL: -->
