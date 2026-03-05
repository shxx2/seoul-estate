"use client";

import { useState, useCallback, useMemo } from "react";
import { useFilterStore } from "@/store/filterStore";
import { useArticles } from "@/hooks/useArticles";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileBottomSheet from "@/components/layout/MobileBottomSheet";
import KakaoMap from "@/components/map/KakaoMap";
import ArticleDetail from "@/components/article/ArticleDetail";
import type { Article } from "@/types/article";
import type { FilterState } from "@/types/filter";

export default function Home() {
  // 필터 스토어 - 선택적으로 필요한 필드만 구독
  const filters = useFilterStore((s): FilterState => ({
    guCode: s.guCode,
    dongCode: s.dongCode,
    tradeTypes: s.tradeTypes,
    primaryTradeType: s.primaryTradeType,
    buildingTypes: s.buildingTypes,
    dealPriceRange: s.dealPriceRange,
    depositRange: s.depositRange,
    monthlyRentRange: s.monthlyRentRange,
    areaRange: s.areaRange,
    sortBy: s.sortBy,
    page: s.page,
    pageSize: s.pageSize,
    searchTrigger: s.searchTrigger,
  }));
  const setFilter = useFilterStore((s) => s.setFilter);
  const triggerSearch = useFilterStore((s) => s.triggerSearch);

  // 매물 조회
  const {
    articles,
    total,
    page,
    pageSize,
    isLoading,
    error,
    mutate,
  } = useArticles(filters, { searchTrigger: filters.searchTrigger });

  // 선택된 매물
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // 매물 클릭 핸들러
  const handleArticleClick = useCallback((article: Article) => {
    setSelectedArticle(article);
  }, []);

  // 상세 패널 닫기
  const handleCloseDetail = useCallback(() => {
    setSelectedArticle(null);
  }, []);

  // 페이지 변경 (페이지 변경 시 검색 트리거)
  const handlePageChange = useCallback(
    (newPage: number) => {
      setFilter("page", newPage);
      triggerSearch();
    },
    [setFilter, triggerSearch]
  );

  // 재시도
  const handleRetry = useCallback(() => {
    mutate();
  }, [mutate]);

  // totalPages 계산
  const totalPages = useMemo(() => Math.ceil(total / pageSize), [total, pageSize]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* 헤더 */}
      <Header />

      {/* 메인 컨텐츠 */}
      <main id="main-content" className="flex-1 flex relative overflow-hidden">
        {/* 데스크톱: 사이드바 */}
        <div className="hidden md:block relative">
          <Sidebar
            articles={articles}
            total={total}
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            isLoading={isLoading}
            error={error}
            selectedArticleId={selectedArticle?.id ?? null}
            onArticleClick={handleArticleClick}
            onPageChange={handlePageChange}
            onRetry={handleRetry}
          />
        </div>

        {/* 지도 */}
        <div className="flex-1 relative">
          <KakaoMap />

          {/* 매물 상세 슬라이드 패널 */}
          {selectedArticle && (
            <ArticleDetail
              article={selectedArticle}
              onClose={handleCloseDetail}
            />
          )}
        </div>

        {/* 모바일: 바텀시트 */}
        <MobileBottomSheet
          articles={articles}
          total={total}
          isLoading={isLoading}
          error={error}
          selectedArticleId={selectedArticle?.id ?? null}
          onArticleClick={handleArticleClick}
          onRetry={handleRetry}
        />
      </main>
    </div>
  );
}
