"use client";
/**
 * MobileBottomSheet - 모바일 하단 시트
 * 모바일에서 필터와 매물 목록을 표시하는 바텀시트
 */
import React, { useState } from "react";
import type { Article } from "@/types/article";
import { ChevronUp, ChevronDown } from "lucide-react";
import MobileFilterSheet from "@/components/filter/MobileFilterSheet";
import ArticleList from "@/components/article/ArticleList";
import ArticleSkeleton from "@/components/article/ArticleSkeleton";
import { ApiError } from "@/hooks/useArticles";

type SheetState = "minimized" | "collapsed" | "peek" | "half" | "full";

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
  const [state, setState] = useState<SheetState>("minimized");
  const [showFilter, setShowFilter] = useState(false);

  const handleOpenFilter = () => {
    setShowFilter(true);
    setState("full");
  };

  const handleCloseFilter = () => {
    setShowFilter(false);
    setState("minimized");
  };

  // 최소화 (플로팅 버튼만 보이게)
  const handleMinimize = () => {
    setState("minimized");
    setShowFilter(false);
  };

  // 시트 펼치기
  const handleExpand = () => {
    setState("half");
  };

  const emptyState = error ? "error" : articles.length === 0 && !isLoading ? "empty" : "initial";
  const errorCode = error instanceof ApiError ? error.code : undefined;

  const toggleState = () => {
    if (state === "minimized") {
      setState("half");
    } else if (state === "half") {
      setState("full");
    } else {
      setState("minimized");
    }
  };

  const getToggleLabel = () => {
    switch (state) {
      case "minimized":
        return "매물 목록 펼치기";
      case "collapsed":
        return "매물 목록 펼치기";
      case "peek":
        return "매물 목록 절반 보기";
      case "half":
        return "매물 목록 전체 보기";
      case "full":
        return "매물 목록 접기";
    }
  };

  // 최소화 상태: 플로팅 버튼으로 표시
  if (state === "minimized") {
    return (
      <button
        type="button"
        onClick={handleExpand}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 md:hidden
          flex items-center gap-2 px-4 py-3 rounded-full
          bg-[#03C75A] text-white font-semibold text-sm
          shadow-lg shadow-green-500/30
          active:scale-95 transition-transform"
        aria-label="매물 목록 펼치기"
      >
        <ChevronUp size={18} />
        <span>매물 {total.toLocaleString()}개</span>
      </button>
    );
  }

  const heightMap: Record<SheetState, string> = {
    minimized: "h-0",
    collapsed: "h-14",
    peek: "h-24",
    half: "h-[50vh]",
    full: "h-[85vh]",
  };

  return (
    <div
      className={[
        "fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 transition-all duration-300 z-40 md:hidden flex flex-col",
        heightMap[state],
      ].join(" ")}
    >
      {/* 드래그 핸들 */}
      <button
        type="button"
        onClick={toggleState}
        aria-label={getToggleLabel()}
        className="w-full flex items-center justify-center py-2 cursor-pointer bg-transparent border-0"
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full" aria-hidden="true" />
      </button>

      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-1 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">
            매물 {total.toLocaleString()}개
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={showFilter ? handleCloseFilter : handleOpenFilter}
            className={[
              "text-xs px-3 py-1.5 rounded-full transition-colors font-medium",
              showFilter
                ? "bg-[#03C75A] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            ].join(" ")}
          >
            {showFilter ? "목록" : "필터"}
          </button>
          <button
            type="button"
            onClick={handleMinimize}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
            aria-label="최소화"
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 overflow-hidden">
        {showFilter ? (
          <MobileFilterSheet onClose={handleCloseFilter} />
        ) : (
          <div className="h-full overflow-y-auto p-4">
            {isLoading ? (
              <ArticleSkeleton count={3} />
            ) : (
              <ArticleList
                articles={articles}
                selectedId={selectedArticleId}
                emptyState={emptyState}
                errorCode={errorCode}
                onArticleClick={onArticleClick}
                onRetry={onRetry}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
