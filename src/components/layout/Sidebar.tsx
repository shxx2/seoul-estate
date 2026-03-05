"use client";
/**
 * Sidebar - 좌측 사이드바
 * FilterPanel과 ArticleList를 포함하는 컨테이너
 */
import React, { useState } from "react";
import type { Article } from "@/types/article";
import FilterPanel from "@/components/filter/FilterPanel";
import ArticleList from "@/components/article/ArticleList";
import ArticleSkeleton from "@/components/article/ArticleSkeleton";
import Pagination from "@/components/common/Pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";

// 안정적인 no-op 함수 (매 렌더 시 새 함수 생성 방지)
const noop = () => {};

interface SidebarProps {
  articles: Article[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error?: Error | null;
  selectedArticleId?: string | null;
  onArticleClick?: (article: Article) => void;
  onPageChange?: (page: number) => void;
  onRetry?: () => void;
}

export default function Sidebar({
  articles,
  total,
  page,
  totalPages,
  isLoading,
  error,
  selectedArticleId,
  onArticleClick,
  onPageChange,
  onRetry,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const emptyState = error ? "error" : articles.length === 0 && !isLoading ? "empty" : "initial";

  return (
    <aside
      className={[
        "h-full bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300",
        isCollapsed ? "w-0 overflow-hidden" : "w-[360px]",
      ].join(" ")}
    >
      {/* 접기 버튼 */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={[
          "absolute top-1/2 -translate-y-1/2 z-10 w-5 h-12 bg-white border border-gray-200 rounded-r-md flex items-center justify-center hover:bg-gray-50 transition-colors",
          isCollapsed ? "left-0" : "left-[360px]",
        ].join(" ")}
        aria-label={isCollapsed ? "사이드바 열기" : "사이드바 닫기"}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {!isCollapsed && (
        <>
          {/* 필터 패널 */}
          <div className="p-3 border-b border-gray-200">
            <FilterPanel />
          </div>

          {/* 매물 목록 */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="mb-2 text-xs text-gray-500">
              총 <span className="font-semibold text-gray-700">{total.toLocaleString()}</span>개 매물
            </div>

            {isLoading ? (
              <ArticleSkeleton count={5} />
            ) : (
              <ArticleList
                articles={articles}
                selectedId={selectedArticleId}
                emptyState={emptyState}
                onArticleClick={onArticleClick}
                onRetry={onRetry}
              />
            )}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && !isLoading && (
            <div className="p-3 border-t border-gray-200 bg-white">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={onPageChange || noop}
              />
            </div>
          )}
        </>
      )}
    </aside>
  );
}
