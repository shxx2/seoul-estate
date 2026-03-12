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

type SheetState = "collapsed" | "peek" | "half" | "full";

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
  const [state, setState] = useState<SheetState>("peek");
  const [showFilter, setShowFilter] = useState(false);

  const handleOpenFilter = () => {
    setShowFilter(true);
    setState("full");
  };

  const handleCloseFilter = () => {
    setShowFilter(false);
    setState("peek");
  };

  // 시트 접기 (지도 버튼 클릭 가능하게)
  const handleCollapse = () => {
    setState("collapsed");
    setShowFilter(false);
  };

  // 시트 펼치기
  const handleExpand = () => {
    setState("half");
  };

  const emptyState = error ? "error" : articles.length === 0 && !isLoading ? "empty" : "initial";
  const errorCode = error instanceof ApiError ? error.code : undefined;

  const heightMap: Record<SheetState, string> = {
    collapsed: "h-12",
    peek: "h-24",
    half: "h-[50vh]",
    full: "h-[85vh]",
  };

  const toggleState = () => {
    const order: SheetState[] = ["collapsed", "peek", "half", "full"];
    const currentIndex = order.indexOf(state);
    const nextIndex = (currentIndex + 1) % order.length;
    setState(order[nextIndex]);
  };

  const getToggleLabel = () => {
    switch (state) {
      case "collapsed":
        return "바텀시트 살짝 보기";
      case "peek":
        return "바텀시트 절반 보기";
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
        <div className="flex items-center gap-2">
          {/* 접기/펴기 버튼 */}
          <button
            type="button"
            onClick={state === "collapsed" ? handleExpand : handleCollapse}
            className={[
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors",
              state === "collapsed"
                ? "bg-[#03C75A] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            ].join(" ")}
            aria-label={state === "collapsed" ? "목록 펼치기" : "목록 접기"}
          >
            {state === "collapsed" ? (
              <>
                <ChevronUp size={14} />
                <span>목록</span>
              </>
            ) : (
              <>
                <ChevronDown size={14} />
                <span>접기</span>
              </>
            )}
          </button>
          <span className="text-sm font-semibold text-gray-800">
            매물 {total.toLocaleString()}개
          </span>
        </div>
        <div className="flex items-center gap-2">
          {state !== "collapsed" && (
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
              {showFilter ? "목록 보기" : "필터"}
            </button>
          )}
          <button
            type="button"
            onClick={toggleState}
            className="p-1.5 text-gray-400 hover:text-gray-600"
            aria-label={getToggleLabel()}
          >
            {state === "full" || state === "half" ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
      </div>

      {/* 컨텐츠 */}
      {state !== "collapsed" && state !== "peek" && (
        <>
          {showFilter ? (
            <div className="flex-1 overflow-hidden">
              <MobileFilterSheet onClose={handleCloseFilter} />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
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
        </>
      )}

      {/* Peek 상태: 간략한 안내 */}
      {state === "peek" && (
        <div
          className="flex-1 flex items-center justify-center cursor-pointer"
          onClick={handleExpand}
        >
          <span className="text-xs text-gray-400">
            탭하여 매물 목록 보기
          </span>
        </div>
      )}
    </div>
  );
}
