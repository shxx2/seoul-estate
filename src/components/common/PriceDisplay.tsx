/**
 * PriceDisplay - 만원 단위 가격을 한글 포맷으로 표시
 *
 * 사용 예:
 *   <PriceDisplay value={35000} suffix="만" />          → "3억 5,000만"
 *   <PriceDisplay value={150000} />                     → "15억"
 *   <PriceDisplay value={null} fallback="가격 미정" />  → "가격 미정"
 */

import React from "react";
import { formatPrice } from "@/lib/format";

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface PriceDisplayProps {
  /** 만원 단위 금액 (null이면 fallback 표시) */
  value: number | null | undefined;
  /** 금액 뒤에 붙는 단위 텍스트 (예: "만원", "만") */
  suffix?: string;
  /** value가 없을 때 표시할 텍스트 (기본: "-") */
  fallback?: string;
  /** 금액 텍스트 크기 클래스 (기본: "text-sm") */
  sizeClass?: string;
  /** 추가 className */
  className?: string;
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────

export default function PriceDisplay({
  value,
  suffix,
  fallback = "-",
  sizeClass = "text-sm",
  className = "",
}: PriceDisplayProps) {
  if (value == null || value <= 0) {
    return (
      <span className={["text-gray-400", sizeClass, className].join(" ").trim()}>
        {fallback}
      </span>
    );
  }

  const formatted = formatPrice(value);

  return (
    <span
      className={["font-semibold tabular-nums", sizeClass, className]
        .join(" ")
        .trim()}
    >
      {formatted}
      {suffix && (
        <span className="ml-0.5 text-[0.8em] font-normal text-gray-500">
          {suffix}
        </span>
      )}
    </span>
  );
}
