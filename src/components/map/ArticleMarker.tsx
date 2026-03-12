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

  // 선택된 마커는 더 크고 눈에 띄는 스타일
  const markerStyle = isSelected
    ? "bg-blue-700 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-xl cursor-pointer ring-2 ring-white ring-offset-2 ring-offset-blue-700 scale-110"
    : "bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded shadow-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-transform";

  return (
    <Marker
      position={new navermaps.LatLng(article.lat, article.lng)}
      icon={{
        content: `<div class="${markerStyle}">${priceText}</div>`,
        anchor: new navermaps.Point(30, 40),
      }}
      onClick={onClick}
      zIndex={isSelected ? 1000 : 1}
    />
  );
}
