"use client";

import { Marker, useNavermaps } from "react-naver-maps";
import type { Article } from "@/types/article";

export interface ArticleCluster {
  key: string;
  lat: number;
  lng: number;
  articles: Article[];
  minPrice: number;
  maxPrice: number;
}

interface ClusterMarkerProps {
  cluster: ArticleCluster;
  isSelected?: boolean;
  onClick?: () => void;
  /** 줌 레벨에 따른 컴팩트 모드 (true면 작은 마커) */
  compact?: boolean;
}

function formatPrice(price: number): string {
  if (price >= 10000) {
    const uk = Math.floor(price / 10000);
    const rest = price % 10000;
    return rest > 0 ? `${uk}.${Math.round(rest / 1000)}억` : `${uk}억`;
  }
  if (price >= 1000) {
    return `${(price / 1000).toFixed(1)}천`;
  }
  return `${price}만`;
}

export default function ClusterMarker({ cluster, isSelected, onClick, compact }: ClusterMarkerProps) {
  const navermaps = useNavermaps();
  const count = cluster.articles.length;
  const articleName = cluster.articles[0]?.articleName || "";

  // 컴팩트 모드: 가격만 표시하는 작은 마커
  if (compact && !isSelected) {
    const priceText = formatPrice(cluster.minPrice);
    const isCluster = count > 1;

    const compactContent = isCluster
      ? `<div style="
          background: #9333ea;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          cursor: pointer;
        ">${count}개 ${priceText}~</div>`
      : `<div style="
          background: #2563eb;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          cursor: pointer;
        ">${priceText}</div>`;

    return (
      <Marker
        position={new navermaps.LatLng(cluster.lat, cluster.lng)}
        icon={{
          content: compactContent,
          anchor: new navermaps.Point(30, 15),
        }}
        onClick={onClick}
        zIndex={isCluster ? count : 1}
      />
    );
  }

  // 단일 매물이면 일반 마커 스타일
  if (count === 1) {
    const article = cluster.articles[0];
    const priceText = article.priceText || formatPrice(article.dealPrice ?? article.deposit ?? 0);

    const markerContent = isSelected
      ? `<div style="
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.5), 0 0 0 3px white;
          min-width: 80px;
          text-align: center;
          cursor: pointer;
        ">
          <div style="padding: 4px 8px; font-size: 10px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; border-bottom: 1px solid rgba(255,255,255,0.2);">${articleName}</div>
          <div style="padding: 6px 8px; font-size: 14px; font-weight: 700;">${priceText}</div>
          <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 8px solid #3b82f6;"></div>
        </div>`
      : `<div style="
          background: white;
          color: #1e293b;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          min-width: 60px;
          text-align: center;
          cursor: pointer;
        ">
          <div style="padding: 2px 6px; font-size: 9px; font-weight: 500; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90px; border-bottom: 1px solid #f1f5f9;">${articleName}</div>
          <div style="padding: 4px 6px; font-size: 12px; font-weight: 700; color: #2563eb;">${priceText}</div>
          <div style="position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid white;"></div>
        </div>`;

    return (
      <Marker
        position={new navermaps.LatLng(cluster.lat, cluster.lng)}
        icon={{
          content: markerContent,
          anchor: new navermaps.Point(40, 55),
        }}
        onClick={onClick}
        zIndex={isSelected ? 1000 : 1}
      />
    );
  }

  // 클러스터 마커 (여러 매물)
  const priceRange = cluster.minPrice === cluster.maxPrice
    ? formatPrice(cluster.minPrice)
    : `${formatPrice(cluster.minPrice)}~${formatPrice(cluster.maxPrice)}`;

  const clusterContent = isSelected
    ? `<div style="
        background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
        color: white;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(139, 92, 246, 0.5), 0 0 0 3px white;
        min-width: 80px;
        text-align: center;
        cursor: pointer;
      ">
        <div style="padding: 4px 8px; font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; border-bottom: 1px solid rgba(255,255,255,0.2);">${articleName}</div>
        <div style="padding: 4px 8px;">
          <span style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 10px; font-size: 11px; font-weight: 700;">${count}개</span>
        </div>
        <div style="padding: 4px 8px; font-size: 12px; font-weight: 600;">${priceRange}</div>
        <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 8px solid #a855f7;"></div>
      </div>`
    : `<div style="
        background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
        color: #6b21a8;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(139, 92, 246, 0.25), 0 0 0 2px #c084fc;
        min-width: 60px;
        text-align: center;
        cursor: pointer;
      ">
        <div style="padding: 3px 6px; font-size: 9px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90px; border-bottom: 1px solid #d8b4fe;">${articleName}</div>
        <div style="padding: 2px 6px;">
          <span style="background: #9333ea; color: white; padding: 1px 5px; border-radius: 8px; font-size: 10px; font-weight: 700;">${count}개</span>
        </div>
        <div style="padding: 3px 6px; font-size: 11px; font-weight: 600;">${priceRange}</div>
        <div style="position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #e9d5ff;"></div>
      </div>`;

  return (
    <Marker
      position={new navermaps.LatLng(cluster.lat, cluster.lng)}
      icon={{
        content: clusterContent,
        anchor: new navermaps.Point(40, 70),
      }}
      onClick={onClick}
      zIndex={isSelected ? 1000 : count}
    />
  );
}
