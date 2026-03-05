"use client";
/**
 * MobileBottomSheet - 모바일 하단 시트
 * 모바일에서 필터와 매물 목록을 표시하는 바텀시트
 */
import React, { useState } from "react";
import type { Article } from "@/types/article";
import { ChevronUp, ChevronDown } from "lucide-react";
import FilterPanel from "@/components/filter/FilterPanel";
import ArticleList from "@/components/article/ArticleList";
import ArticleSkeleton from "@/components/article/ArticleSkeleton";

type SheetState = "collapsed" | "half" | "full";

interface MobileBottomSheetProps {
  articles: Article[];
  total: number;
  isLoading: boolean;
  error?: Error | null;
  selectedArticleId?: string | null;
  onArticleClick?: (article: Article) => void;
  onRetry?: () => void;
}

export default function MobileBottomSheet({
  articles,
  total,
  isLoading,
  error,
  selectedArticleId,
  onArticleClick,
  onRetry,
}: MobileBottomSheetProps) {
  const [state, setState] = useState<SheetState>("half");
  const [showFilter, setShowFilter] = useState(false);

  const emptyState = error ? "error" : articles.length === 0 && !isLoading ? "empty" : "initial";

  const heightMap: Record<SheetState, string> = {
    collapsed: "h-16",
    half: "h-[50vh]",
    full: "h-[85vh]",
  };

  const toggleState = () => {
    const order: SheetState[] = ["collapsed", "half", "full"];
    const currentIndex = order.indexOf(state);
    const nextIndex = (currentIndex + 1) % order.length;
    setState(order[nextIndex]);
  };

  const getToggleLabel = () => {
    switch (state) {
      case "collapsed":
        return "바텀시트 펼치기";
      case "half":
        return "바텀시트 전체 보기";
      case "full":
        return "바텀시트 접기";
    }
  };

  return (
    <div
      className={[
        "fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 transition-all duration-300 z-40 md:hidden flex flex-col",
        heightMap[state],
      ].join(" ")}
    >
      {/* 드래그 핸들 - 접근성 개선 */}
      <button
        type="button"
        onClick={toggleState}
        aria-label={getToggleLabel()}
        className="w-full flex items-center justify-center py-2 cursor-pointer bg-transparent border-0"
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full" aria-hidden="true" />
      </button>

      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-800">
          매물 {total.toLocaleString()}개
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilter(!showFilter)}
            className={[
              "text-xs px-3 py-1.5 rounded-full transition-colors",
              showFilter
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            ].join(" ")}
          >
            {showFilter ? "목록 보기" : "필터"}
          </button>
          <button
            type="button"
            onClick={toggleState}
            className="p-1.5 text-gray-400 hover:text-gray-600"
            aria-label={state === "full" ? "축소" : "확장"}
          >
            {state === "full" ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
      </div>

      {/* 컨텐츠 */}
      {state !== "collapsed" && (
        <div className="flex-1 overflow-y-auto p-4">
          {showFilter ? (
            <FilterPanel className="w-full" />
          ) : isLoading ? (
            <ArticleSkeleton count={3} />
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
      )}
    </div>
  );
}
