/**
 * ErrorState - API 오류 / 데이터 없음 상태 UI
 *
 * - retry 콜백 제공 시 "다시 시도" 버튼 표시
 * - naverUrl 제공 시 "네이버 부동산에서 직접 보기" 링크 표시
 * - message prop으로 커스텀 오류 메시지 지정 가능
 */

import React from "react";
import { AlertTriangle, RefreshCw, ExternalLink } from "lucide-react";

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface ErrorStateProps {
  /** 오류 메시지 (기본: "데이터를 불러오지 못했습니다.") */
  message?: string;
  /** 재시도 콜백 (없으면 버튼 미표시) */
  onRetry?: () => void;
  /** 네이버 부동산 직접 링크 (없으면 미표시) */
  naverUrl?: string;
  /** 추가 className */
  className?: string;
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────

export default function ErrorState({
  message = "데이터를 불러오지 못했습니다.",
  onRetry,
  naverUrl,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={[
        "flex flex-col items-center justify-center gap-3",
        "py-10 px-6 text-center",
        className,
      ]
        .join(" ")
        .trim()}
    >
      {/* 아이콘 */}
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50">
        <AlertTriangle size={20} className="text-red-400" aria-hidden="true" />
      </div>

      {/* 메시지 */}
      <p className="text-sm text-gray-600 leading-snug max-w-[220px]">
        {message}
      </p>

      {/* 액션 버튼 영역 */}
      <div className="flex flex-col items-center gap-2 mt-1">
        {/* 재시도 버튼 */}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={[
              "inline-flex items-center gap-1.5 px-3 py-1.5",
              "text-xs font-semibold text-white",
              "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
              "rounded-md shadow-sm",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1",
            ]
              .join(" ")
              .trim()}
          >
            <RefreshCw size={12} aria-hidden="true" />
            다시 시도
          </button>
        )}

        {/* 네이버 직접 링크 */}
        {naverUrl && (
          <a
            href={naverUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={[
              "inline-flex items-center gap-1 px-2 py-1",
              "text-xs text-gray-500 hover:text-green-700",
              "rounded transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-1",
            ]
              .join(" ")
              .trim()}
          >
            <ExternalLink size={11} aria-hidden="true" />
            네이버 부동산에서 직접 보기
          </a>
        )}
      </div>
    </div>
  );
}
