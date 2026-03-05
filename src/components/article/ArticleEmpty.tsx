"use client";

/**
 * ArticleEmpty - 매물 목록 빈 상태 컴포넌트
 *
 * 세 가지 상태를 표시합니다:
 *   - "initial"  : 아직 지역을 선택하지 않은 초기 상태
 *   - "empty"    : 검색 결과 없음
 *   - "error"    : API 에러
 */

import React from "react";
import { MapPin, SearchX, AlertCircle } from "lucide-react";

// ─────────────────────────────────────────────
// Props 타입
// ─────────────────────────────────────────────

export type ArticleEmptyState = "initial" | "empty" | "error";

export interface ArticleEmptyProps {
  state?: ArticleEmptyState;
  /** 에러 상태일 때 재시도 콜백 */
  onRetry?: () => void;
}

// ─────────────────────────────────────────────
// 상태별 설정
// ─────────────────────────────────────────────

interface StateConfig {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconWrapClass: string;
}

const STATE_CONFIG: Record<ArticleEmptyState, StateConfig> = {
  initial: {
    icon: <MapPin size={22} aria-hidden="true" />,
    title: "지역을 선택하세요",
    description: "왼쪽 필터에서 구 또는 동을 선택하면\n매물 목록이 표시됩니다.",
    iconWrapClass: "text-blue-400 bg-blue-50",
  },
  empty: {
    icon: <SearchX size={22} aria-hidden="true" />,
    title: "검색 결과가 없습니다",
    description: "조건을 변경하거나 다른 지역을\n검색해 보세요.",
    iconWrapClass: "text-gray-400 bg-gray-100",
  },
  error: {
    icon: <AlertCircle size={22} aria-hidden="true" />,
    title: "매물을 불러오지 못했습니다",
    description: "일시적인 오류가 발생했습니다.\n잠시 후 다시 시도해 주세요.",
    iconWrapClass: "text-red-400 bg-red-50",
  },
};

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────

export default function ArticleEmpty({
  state = "initial",
  onRetry,
}: ArticleEmptyProps) {
  const config = STATE_CONFIG[state];

  return (
    <div
      role="status"
      aria-label={config.title}
      className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center"
    >
      {/* 아이콘 */}
      <div
        className={[
          "w-12 h-12 rounded-full flex items-center justify-center",
          config.iconWrapClass,
        ].join(" ")}
      >
        {config.icon}
      </div>

      {/* 텍스트 */}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-gray-700">{config.title}</p>
        <p className="text-xs text-gray-400 whitespace-pre-line leading-relaxed">
          {config.description}
        </p>
      </div>

      {/* 재시도 버튼 (에러 상태에서만) */}
      {state === "error" && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={[
            "mt-1 px-4 py-1.5 rounded-lg",
            "text-xs font-semibold text-white bg-blue-600",
            "hover:bg-blue-700 transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1",
          ].join(" ")}
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
