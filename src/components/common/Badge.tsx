/**
 * Badge - 거래유형 / 건물유형 뱃지
 *
 * variant="trade"    : SALE(매매) → blue-600, JEONSE(전세) → emerald-600, MONTHLY(월세) → amber-600
 * variant="building" : APT(아파트) → slate-700, VILLA(빌라) → violet-700, OFFICETEL(오피스텔) → teal-700
 */

import React from "react";
import { TRADE_TYPE_LABEL, BUILDING_TYPE_LABEL } from "@/lib/constants";
import type { TradeType, BuildingType } from "@/types/article";

// ─────────────────────────────────────────────
// 색상 매핑
// ─────────────────────────────────────────────

const TRADE_COLOR: Record<TradeType, string> = {
  SALE:    "bg-blue-100 text-blue-700 ring-blue-200",
  JEONSE:  "bg-emerald-100 text-emerald-700 ring-emerald-200",
  MONTHLY: "bg-amber-100 text-amber-700 ring-amber-200",
};

const BUILDING_COLOR: Record<BuildingType, string> = {
  APT:       "bg-slate-100 text-slate-700 ring-slate-200",
  VILLA:     "bg-violet-100 text-violet-700 ring-violet-200",
  OFFICETEL: "bg-teal-100 text-teal-700 ring-teal-200",
};

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

type TradeBadgeProps = {
  variant: "trade";
  value: TradeType;
  className?: string;
};

type BuildingBadgeProps = {
  variant: "building";
  value: BuildingType;
  className?: string;
};

type BadgeProps = TradeBadgeProps | BuildingBadgeProps;

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────

export default function Badge({ variant, value, className = "" }: BadgeProps) {
  const label =
    variant === "trade"
      ? TRADE_TYPE_LABEL[value as TradeType]
      : BUILDING_TYPE_LABEL[value as BuildingType];

  const colorClass =
    variant === "trade"
      ? TRADE_COLOR[value as TradeType]
      : BUILDING_COLOR[value as BuildingType];

  return (
    <span
      className={[
        "inline-flex items-center px-1.5 py-0.5",
        "text-[10px] font-semibold leading-none",
        "rounded ring-1 ring-inset",
        colorClass,
        className,
      ]
        .join(" ")
        .trim()}
    >
      {label}
    </span>
  );
}
