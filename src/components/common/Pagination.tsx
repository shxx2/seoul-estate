/**
 * Pagination - 페이지네이션 UI
 *
 * - 최대 표시 페이지 번호: 5개 (현재 페이지 기준 앞뒤 2개)
 * - 첫/마지막 페이지 점프 버튼 포함
 * - 접근성: aria-label, aria-current 지원
 */

"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

// ─────────────────────────────────────────────
// 헬퍼: 표시할 페이지 번호 배열 계산
// ─────────────────────────────────────────────

function getPageRange(current: number, total: number, windowSize = 5): number[] {
  if (total <= 0) return [];

  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, current - half);
  const end = Math.min(total, start + windowSize - 1);

  // end가 total에 닿으면 start를 당김
  if (end - start + 1 < windowSize) {
    start = Math.max(1, end - windowSize + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

// ─────────────────────────────────────────────
// 공통 버튼 스타일
// ─────────────────────────────────────────────

const BASE_BTN =
  "inline-flex items-center justify-center w-7 h-7 rounded text-xs font-medium " +
  "transition-colors duration-100 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1 " +
  "disabled:opacity-30 disabled:cursor-not-allowed";

const NAV_BTN = `${BASE_BTN} text-gray-500 hover:bg-gray-100 hover:text-gray-700`;

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageRange(currentPage, totalPages);

  const go = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  return (
    <nav
      role="navigation"
      aria-label="페이지 탐색"
      className={["flex items-center justify-center gap-0.5", className]
        .join(" ")
        .trim()}
    >
      {/* 첫 페이지 */}
      <button
        type="button"
        onClick={() => go(1)}
        disabled={currentPage === 1}
        aria-label="첫 페이지"
        className={NAV_BTN}
      >
        <ChevronsLeft size={13} />
      </button>

      {/* 이전 페이지 */}
      <button
        type="button"
        onClick={() => go(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="이전 페이지"
        className={NAV_BTN}
      >
        <ChevronLeft size={13} />
      </button>

      {/* 페이지 번호들 */}
      {pages.map((page) => {
        const isActive = page === currentPage;
        return (
          <button
            key={page}
            type="button"
            onClick={() => go(page)}
            aria-label={`${page}페이지`}
            aria-current={isActive ? "page" : undefined}
            className={[
              BASE_BTN,
              isActive
                ? "bg-blue-600 text-white shadow-sm cursor-default"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800",
            ]
              .join(" ")
              .trim()}
          >
            {page}
          </button>
        );
      })}

      {/* 다음 페이지 */}
      <button
        type="button"
        onClick={() => go(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="다음 페이지"
        className={NAV_BTN}
      >
        <ChevronRight size={13} />
      </button>

      {/* 마지막 페이지 */}
      <button
        type="button"
        onClick={() => go(totalPages)}
        disabled={currentPage === totalPages}
        aria-label="마지막 페이지"
        className={NAV_BTN}
      >
        <ChevronsRight size={13} />
      </button>
    </nav>
  );
}
