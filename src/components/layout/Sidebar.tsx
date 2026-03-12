"use client";
/**
 * Sidebar - 좌측 사이드바
 * FilterPanel과 ArticleList를 포함하는 컨테이너
 * 무한 스크롤 지원
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import type { Article } from "@/types/article";
import FilterPanel from "@/components/filter/FilterPanel";
import ArticleList from "@/components/article/ArticleList";
import ArticleSkeleton from "@/components/article/ArticleSkeleton";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { ApiError } from "@/hooks/useArticles";

interface SidebarProps {
  articles: Article[];
  total: number;
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  error?: Error | null;
  selectedArticleId?: string | null;
  onArticleClick?: (article: Article) => void;
  onLoadMore?: () => void;
  onRetry?: () => void;
}

export default function Sidebar({
  articles,
  total,
  isLoading,
  isLoadingMore,
  hasMore,
  error,
  selectedArticleId,
  onArticleClick,
  onLoadMore,
  onRetry,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const prevIsLoading = useRef(isLoading);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  // 검색 시작(isLoading true로 전환) 시 필터 자동 접기
  useEffect(() => {
    if (!prevIsLoading.current && isLoading) {
      setFilterCollapsed(true);
    }
    prevIsLoading.current = isLoading;
  }, [isLoading]);

  // Intersection Observer로 무한 스크롤 구현
  useEffect(() => {
    const trigger = loadMoreTriggerRef.current;
    if (!trigger || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(trigger);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, onLoadMore]);

  const emptyState = error ? "error" : articles.length === 0 && !isLoading ? "empty" : "initial";
  const errorCode = error instanceof ApiError ? error.code : undefined;

  return (
    // relative: 접기 버튼의 absolute 기준점을 이 요소로 설정
    // overflow-hidden은 isCollapsed 시에만 적용해 버튼이 잘리지 않도록 함
    <aside
      className={[
        "relative h-full bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300",
        isCollapsed ? "w-0 overflow-hidden" : "w-[360px]",
      ].join(" ")}
    >
      {/* 접기 버튼: aside 우측 끝에 붙는 탭 형태 */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={[
          "absolute top-1/2 -translate-y-1/2 z-10",
          "w-5 h-12 bg-white border border-gray-200 rounded-r-md",
          "flex items-center justify-center",
          "hover:bg-gray-50 transition-colors",
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
            <FilterPanel collapsed={filterCollapsed} />
          </div>

          {/* 매물 목록 (무한 스크롤) */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-3">
            <div className="mb-2 text-xs text-gray-500">
              총 <span className="font-semibold text-gray-700">{total.toLocaleString()}</span>개 매물
              {articles.length > 0 && articles.length < total && (
                <span className="text-gray-400"> (현재 {articles.length}개 표시)</span>
              )}
            </div>

            {isLoading ? (
              <ArticleSkeleton count={5} />
            ) : (
              <>
                <ArticleList
                  articles={articles}
                  selectedId={selectedArticleId}
                  emptyState={emptyState}
                  errorCode={errorCode}
                  onArticleClick={onArticleClick}
                  onRetry={onRetry}
                />

                {/* 무한 스크롤 트리거 & 로딩 표시 */}
                {articles.length > 0 && (
                  <div ref={loadMoreTriggerRef} className="py-4 flex justify-center">
                    {isLoadingMore ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 size={16} className="animate-spin" />
                        <span>더 불러오는 중...</span>
                      </div>
                    ) : hasMore ? (
                      <button
                        type="button"
                        onClick={onLoadMore}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        더 보기
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">모든 매물을 불러왔습니다</span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
