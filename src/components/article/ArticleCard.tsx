"use client";

/**
 * ArticleCard - 매물 카드 컴포넌트
 *
 * 썸네일, 매물명, 주소, 가격, 면적, 층수를 표시합니다.
 * null 필드는 생략합니다.
 * onClick 핸들러로 카드 선택 이벤트를 처리합니다.
 */

import React from "react";
import Image from "next/image";
import { Building2, MapPin, Layers, Maximize2 } from "lucide-react";
import type { Article } from "@/types/article";
import { TRADE_TYPE_LABEL, BUILDING_TYPE_LABEL } from "@/lib/constants";
import { formatPrice, parseFloorInfo } from "@/lib/format";

// ─────────────────────────────────────────────
// Props 타입
// ─────────────────────────────────────────────

export interface ArticleCardProps {
  article: Article;
  isSelected?: boolean;
  onClick?: (article: Article) => void;
}

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────

/** 거래 유형별 배지 색상 */
function getTradeTypeBadgeClass(tradeType: Article["tradeType"]): string {
  switch (tradeType) {
    case "SALE":
      return "bg-blue-600 text-white";
    case "JEONSE":
      return "bg-emerald-600 text-white";
    case "MONTHLY":
      return "bg-orange-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

/** 가격 표시 텍스트 생성 */
function getPriceDisplay(article: Article): string {
  if (article.priceText) return article.priceText;
  if (article.tradeType === "SALE" && article.dealPrice !== null) {
    return formatPrice(article.dealPrice);
  }
  if (article.tradeType === "JEONSE" && article.deposit !== null) {
    return formatPrice(article.deposit);
  }
  if (article.tradeType === "MONTHLY") {
    const depositStr =
      article.deposit !== null ? formatPrice(article.deposit) : "0";
    const rentStr =
      article.monthlyRent !== null ? `${article.monthlyRent}만` : "-";
    return `${depositStr} / ${rentStr}`;
  }
  return "-";
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────

export default function ArticleCard({
  article,
  isSelected = false,
  onClick,
}: ArticleCardProps) {
  const { floor } = parseFloorInfo(article.floor);
  const priceDisplay = getPriceDisplay(article);

  const handleClick = () => {
    onClick?.(article);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(article);
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`${article.articleName}, ${priceDisplay}`}
      aria-pressed={isSelected}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={[
        "flex gap-3 p-3 rounded-xl",
        "border transition-all duration-150 cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1",
        isSelected
          ? "border-blue-400 bg-blue-50 shadow-sm"
          : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm",
      ]
        .join(" ")
        .trim()}
    >
      {/* 썸네일 */}
      <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100">
        {article.thumbnailUrl ? (
          <Image
            src={article.thumbnailUrl}
            alt={`${article.articleName} 썸네일`}
            fill
            sizes="80px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 size={24} className="text-gray-300" aria-hidden="true" />
          </div>
        )}

        {/* 거래 유형 배지 */}
        <span
          className={[
            "absolute top-1 left-1",
            "text-[9px] font-bold px-1 py-0.5 rounded",
            getTradeTypeBadgeClass(article.tradeType),
          ].join(" ")}
        >
          {TRADE_TYPE_LABEL[article.tradeType]}
        </span>
      </div>

      {/* 본문 */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* 매물명 + 건물 유형 */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-gray-900 truncate leading-tight">
            {article.articleName}
          </span>
          <span className="shrink-0 text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            {BUILDING_TYPE_LABEL[article.buildingType]}
          </span>
        </div>

        {/* 주소 */}
        <div className="flex items-center gap-1">
          <MapPin size={10} className="shrink-0 text-gray-400" aria-hidden="true" />
          <span className="text-[11px] text-gray-500 truncate">
            {article.dong
              ? `${article.gu} ${article.dong}`
              : article.gu || article.address}
          </span>
        </div>

        {/* 가격 */}
        <div className="mt-0.5">
          <span className="text-sm font-bold text-gray-900 tracking-tight">
            {priceDisplay}
          </span>
        </div>

        {/* 면적 + 층수 */}
        <div className="flex items-center gap-2.5 mt-auto">
          {article.exclusiveArea > 0 && (
            <div className="flex items-center gap-0.5">
              <Maximize2 size={9} className="text-gray-400" aria-hidden="true" />
              <span className="text-[10px] text-gray-500">
                {article.exclusiveAreaPyeong}평
              </span>
            </div>
          )}
          {floor && floor !== "-" && (
            <div className="flex items-center gap-0.5">
              <Layers size={9} className="text-gray-400" aria-hidden="true" />
              <span className="text-[10px] text-gray-500">{floor}층</span>
            </div>
          )}
          {article.buildYear && (
            <span className="text-[10px] text-gray-400">{article.buildYear}년</span>
          )}
          {article.direction && (
            <span className="text-[10px] text-gray-400">{article.direction}</span>
          )}
        </div>
      </div>
    </article>
  );
}
