"use client";

/**
 * ArticleSkeleton - 매물 카드 로딩 스켈레톤
 *
 * ArticleCard의 레이아웃을 모방한 pulse 애니메이션 플레이스홀더입니다.
 * count prop으로 표시할 스켈레톤 개수를 조절합니다.
 */

import React from "react";

// ─────────────────────────────────────────────
// Props 타입
// ─────────────────────────────────────────────

export interface ArticleSkeletonProps {
  /** 표시할 스켈레톤 카드 수 (기본값: 6) */
  count?: number;
}

// ─────────────────────────────────────────────
// 단일 스켈레톤 카드
// ─────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="flex gap-3 p-3 rounded-xl border border-gray-100 bg-white"
    >
      {/* 썸네일 */}
      <div className="w-20 h-20 shrink-0 rounded-lg bg-gray-200 animate-pulse" />

      {/* 본문 */}
      <div className="flex-1 flex flex-col gap-2 py-0.5">
        {/* 매물명 */}
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-28 bg-gray-200 rounded animate-pulse" />
          <div className="h-3.5 w-10 bg-gray-100 rounded animate-pulse" />
        </div>
        {/* 주소 */}
        <div className="h-2.5 w-20 bg-gray-100 rounded animate-pulse" />
        {/* 가격 */}
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        {/* 면적 + 층수 */}
        <div className="flex items-center gap-2 mt-auto">
          <div className="h-2.5 w-10 bg-gray-100 rounded animate-pulse" />
          <div className="h-2.5 w-8 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────

export default function ArticleSkeleton({ count = 6 }: ArticleSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="매물 목록 로딩 중"
      className="flex flex-col gap-2"
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
      <span className="sr-only">매물 목록을 불러오는 중입니다...</span>
    </div>
  );
}
