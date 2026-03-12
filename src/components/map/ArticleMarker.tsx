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

  // 선택된 마커: 크고 강조된 스타일
  const markerContent = isSelected
    ? `<div style="
        background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
        color: white;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(59, 130, 246, 0.5), 0 0 0 3px white;
        min-width: 100px;
        text-align: center;
        transform: scale(1.1);
        cursor: pointer;
      ">
        <div style="padding: 4px 8px; font-size: 10px; color: #bfdbfe; border-bottom: 1px solid rgba(255,255,255,0.2);">${dongName}</div>
        <div style="padding: 2px 8px; font-size: 11px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px;">${articleName}</div>
        <div style="padding: 6px 8px; font-size: 14px; font-weight: 700;">${priceText}</div>
        <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 8px solid #3b82f6;"></div>
      </div>`
    : `<div style="
        background: white;
        color: #1e293b;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
        min-width: 70px;
        text-align: center;
        cursor: pointer;
        transition: transform 0.15s, box-shadow 0.15s;
      " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 16px rgba(0, 0, 0, 0.2)';" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.15)';">
        <div style="padding: 3px 6px; font-size: 9px; color: #64748b; border-bottom: 1px solid #f1f5f9; background: #f8fafc; border-radius: 8px 8px 0 0;">${dongName}</div>
        <div style="padding: 2px 6px; font-size: 10px; font-weight: 500; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px;">${articleName}</div>
        <div style="padding: 4px 6px; font-size: 12px; font-weight: 700; color: #2563eb;">${priceText}</div>
        <div style="position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid white; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));"></div>
      </div>`;

  return (
    <Marker
      position={new navermaps.LatLng(article.lat, article.lng)}
      icon={{
        content: markerContent,
        anchor: new navermaps.Point(50, 70),
      }}
      onClick={onClick}
      zIndex={isSelected ? 1000 : 1}
    />
  );
}
