"use client";

import { Marker, useNavermaps } from "react-naver-maps";
import type { Article } from "@/types/article";

interface ArticleMarkerProps {
  article: Article | null;
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

export default function ArticleMarker({ article, onClick }: ArticleMarkerProps) {
  const navermaps = useNavermaps();

  if (!article) return null;

  const priceText = article.priceText || formatPrice(article.dealPrice ?? article.deposit ?? 0);

  return (
    <Marker
      position={new navermaps.LatLng(article.lat, article.lng)}
      icon={{
        content: `<div class="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded shadow-lg cursor-pointer hover:bg-blue-700">${priceText}</div>`,
        anchor: new navermaps.Point(30, 40),
      }}
      onClick={onClick}
    />
  );
}
