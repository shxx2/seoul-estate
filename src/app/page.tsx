"use client";

import { useState, useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useFilterStore } from "@/store/filterStore";
import { useArticles } from "@/hooks/useArticles";
import { useRegionPolygon } from "@/hooks/useRegionPolygon";
import { getRegionCenter } from "@/lib/region-lookup";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileBottomSheet from "@/components/layout/MobileBottomSheet";
import NaverMap from "@/components/map/NaverMap";
import RegionPolygon from "@/components/map/RegionPolygon";
import ArticleMarker from "@/components/map/ArticleMarker";
import TransitRouteOverlay from "@/components/map/TransitRouteOverlay";
import ArticleDetail from "@/components/article/ArticleDetail";
import type { Article } from "@/types/article";
import type { FilterState } from "@/types/filter";

export default function Home() {
  // 필터 스토어 - useShallow로 얕은 비교 수행
  const filters = useFilterStore(
    useShallow((s): FilterState => ({
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
    }))
  );
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

  // 선택된 지역의 중심 좌표 계산
  const mapCenter = useMemo(() => {
    // 매물 선택 시 해당 매물 위치로 이동
    if (selectedArticle) {
      return { lat: selectedArticle.lat, lng: selectedArticle.lng };
    }

    const cortarNo = filters.dongCode || filters.guCode;
    if (!cortarNo) return undefined;
    const center = getRegionCenter(cortarNo);
    return center ? { lat: center.lat, lng: center.lng } : undefined;
  }, [selectedArticle, filters.dongCode, filters.guCode]);

  // 선택된 지역의 줌 레벨 (네이버맵: 숫자 클수록 확대)
  const mapZoom = useMemo(() => {
    // 매물 선택 시 더 확대 (카카오 level 3 → 네이버 zoom 18)
    if (selectedArticle) return 18;

    const cortarNo = filters.dongCode || filters.guCode;
    if (!cortarNo) return 11; // 카카오 level 8 → 네이버 zoom 11
    const center = getRegionCenter(cortarNo);
    return center?.zoom ?? 11;
  }, [selectedArticle, filters.dongCode, filters.guCode]);

  // 선택된 지역의 폴리곤 경로
  const cortarNo = filters.dongCode || filters.guCode;
  const { polygon: regionPolygonPaths } = useRegionPolygon(cortarNo);

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
          <NaverMap center={mapCenter} zoom={mapZoom}>
            {/* 구/동 폴리곤 (매물 미선택 시) */}
            {!selectedArticle && regionPolygonPaths && regionPolygonPaths.length > 0 && (
              <RegionPolygon paths={regionPolygonPaths} />
            )}

            {/* 선택된 매물 마커 */}
            {selectedArticle && (
              <>
                <ArticleMarker article={selectedArticle} onClick={() => {}} />
                <TransitRouteOverlay lat={selectedArticle.lat} lng={selectedArticle.lng} />
              </>
            )}
          </NaverMap>

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
