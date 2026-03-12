"use client";

import { Marker, useNavermaps } from "react-naver-maps";
import type { Article } from "@/types/article";

interface ArticleMarkerProps {
  article: Article | null;
  isSelected?: boolean;
  onClick?: () => void;
}

function formatPrice(price: number): string {
  if (price >= 10000) {
    const uk = Math.floor(price / 10000);
    const rest = price % 10000;
    return rest > 0 ? `${uk}억 ${rest.toLocaleString()}` : `${uk}억`;
  }
  return price.toLocaleString();
}

export default function ArticleMarker({ article, isSelected, onClick }: ArticleMarkerProps) {
  const navermaps = useNavermaps();

  if (!article) return null;

  const priceText = article.priceText || formatPrice(article.dealPrice ?? article.deposit ?? 0);
  const articleName = article.articleName || "";
  const dongName = article.dong || "";

  // 선택된 마커는 더 크고 눈에 띄는 스타일
  const markerContent = isSelected
    ? `<div class="bg-blue-700 text-white rounded-lg shadow-xl cursor-pointer ring-2 ring-white ring-offset-2 ring-offset-blue-700 scale-110 min-w-[80px] text-center">
        <div class="px-2 py-1 text-[10px] text-blue-200 border-b border-blue-600">${dongName}</div>
        <div class="px-2 py-0.5 text-xs font-medium truncate max-w-[120px]">${articleName}</div>
        <div class="px-2 py-1 text-sm font-bold">${priceText}</div>
      </div>`
    : `<div class="bg-blue-600 text-white rounded shadow-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-transform min-w-[60px] text-center">
        <div class="px-1.5 py-0.5 text-[9px] text-blue-200 border-b border-blue-500">${dongName}</div>
        <div class="px-1.5 py-0.5 text-[10px] truncate max-w-[100px]">${articleName}</div>
        <div class="px-1.5 py-0.5 text-xs font-semibold">${priceText}</div>
      </div>`;

  return (
    <Marker
      position={new navermaps.LatLng(article.lat, article.lng)}
      icon={{
        content: markerContent,
        anchor: new navermaps.Point(40, 60),
      }}
      onClick={onClick}
      zIndex={isSelected ? 1000 : 1}
    />
  );
}
