"use client";

/**
 * ArticleList - 매물 목록 그리드 컴포넌트
 *
 * articles 배열을 받아 ArticleCard 목록을 렌더링합니다.
 * 빈 배열이면 ArticleEmpty를 표시합니다.
 */

import React from "react";
import type { Article } from "@/types/article";
import ArticleCard from "./ArticleCard";
import ArticleEmpty, { type ArticleEmptyState } from "./ArticleEmpty";

// ─────────────────────────────────────────────
// Props 타입
// ─────────────────────────────────────────────

export interface ArticleListProps {
  articles: Article[];
  /** 선택된 매물 ID */
  selectedId?: string | null;
  /** 빈 상태 종류 */
  emptyState?: ArticleEmptyState;
  /** 에러 시 재시도 콜백 */
  onRetry?: () => void;
  /** 카드 클릭 핸들러 */
  onArticleClick?: (article: Article) => void;
  /** 추가 CSS 클래스 */
  className?: string;
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────

export default function ArticleList({
  articles,
  selectedId,
  emptyState = "initial",
  onRetry,
  onArticleClick,
  className = "",
}: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <ArticleEmpty
        state={emptyState}
        onRetry={onRetry}
      />
    );
  }

  return (
    <div
      role="list"
      aria-label={`매물 ${articles.length}개`}
      className={["flex flex-col gap-2", className].join(" ").trim()}
    >
      {articles.map((article) => (
        <div key={article.id} role="listitem">
          <ArticleCard
            article={article}
            isSelected={selectedId === article.id}
            onClick={onArticleClick}
          />
        </div>
      ))}
    </div>
  );
}
