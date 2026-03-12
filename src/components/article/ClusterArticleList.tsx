"use client";

import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import type { Article } from "@/types/article";
import type { ArticleCluster } from "@/components/map/ClusterMarker";

interface ClusterArticleListProps {
  cluster: ArticleCluster;
  onArticleClick: (article: Article) => void;
  onBack: () => void;
}

function formatPrice(price: number): string {
  if (price >= 10000) {
    const uk = Math.floor(price / 10000);
    const rest = price % 10000;
    return rest > 0 ? `${uk}억 ${rest.toLocaleString()}만` : `${uk}억`;
  }
  return `${price.toLocaleString()}만`;
}

export default function ClusterArticleList({
  cluster,
  onArticleClick,
  onBack,
}: ClusterArticleListProps) {
  const dongName = cluster.articles[0]?.dong || "";

  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 md:left-auto md:w-96 bg-white z-50 flex flex-col shadow-xl">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-purple-100">
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-purple-200 rounded-full transition-colors"
          aria-label="뒤로 가기"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-gray-900">{dongName}</h2>
          <p className="text-xs text-purple-600 font-medium">
            동일 위치 매물 {cluster.articles.length}개
          </p>
        </div>
      </div>

      {/* 매물 목록 */}
      <div className="flex-1 overflow-y-auto">
        {cluster.articles.map((article, index) => {
          const price = article.dealPrice ?? article.deposit ?? 0;
          const priceText = article.priceText || formatPrice(price);

          return (
            <button
              key={article.id}
              type="button"
              onClick={() => onArticleClick(article)}
              className="w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3"
            >
              {/* 썸네일 */}
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                {article.thumbnailUrl ? (
                  <Image
                    src={article.thumbnailUrl}
                    alt={article.articleName || "매물 이미지"}
                    fill
                    sizes="80px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  </div>
                )}
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-purple-600 font-medium">
                    #{index + 1}
                  </span>
                  <span className="text-xs text-gray-400">
                    {article.tradeType === "SALE" ? "매매" : article.tradeType === "JEONSE" ? "전세" : "월세"}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mt-0.5 truncate">
                  {article.articleName || "매물"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {article.buildingType === "APT" ? "아파트" : article.buildingType === "VILLA" ? "빌라" : "오피스텔"}
                  {article.exclusiveArea && ` · ${article.exclusiveArea}㎡`}
                  {article.floor && ` · ${article.floor}`}
                </p>
                <p className="text-base font-bold text-blue-600 mt-1">
                  {priceText}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
