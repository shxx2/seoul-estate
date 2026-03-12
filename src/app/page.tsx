"use client";

import { useState, useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useFilterStore } from "@/store/filterStore";
import { useInfiniteArticles } from "@/hooks/useInfiniteArticles";
import { useRegionPolygon } from "@/hooks/useRegionPolygon";
import { getRegionCenter } from "@/lib/region-lookup";
import { clusterArticles } from "@/lib/cluster-articles";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileBottomSheet from "@/components/layout/MobileBottomSheet";
import NaverMap from "@/components/map/NaverMap";
import RegionPolygon from "@/components/map/RegionPolygon";
import ClusterMarker, { type ArticleCluster } from "@/components/map/ClusterMarker";
import TransitRouteOverlay from "@/components/map/TransitRouteOverlay";
import ArticleDetail from "@/components/article/ArticleDetail";
import ClusterArticleList from "@/components/article/ClusterArticleList";
import type { Article } from "@/types/article";
import type { ArticleFilters } from "@/types/filter";

export default function Home() {
  // 필터 스토어 - useShallow로 얕은 비교 수행
  const filters = useFilterStore(
    useShallow((s) => ({
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
      appliedFilters: s.appliedFilters,
      refreshTrigger: s.refreshTrigger,
    }))
  );
  // 매물 조회 (무한 스크롤)
  const {
    articles,
    total,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    mutate,
  } = useInfiniteArticles(filters.appliedFilters, filters.refreshTrigger);

  // 선택된 매물
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  // 선택된 클러스터 (여러 매물이 같은 위치에 있을 때)
  const [selectedCluster, setSelectedCluster] = useState<ArticleCluster | null>(null);

  // 매물을 클러스터로 그룹화
  const clusters = useMemo(() => clusterArticles(articles), [articles]);

  // 클러스터 클릭 핸들러
  const handleClusterClick = useCallback((cluster: ArticleCluster) => {
    if (cluster.articles.length === 1) {
      // 단일 매물이면 바로 상세 보기
      setSelectedArticle(cluster.articles[0]);
      setSelectedCluster(null);
    } else {
      // 여러 매물이면 클러스터 목록 보기
      setSelectedCluster(cluster);
      setSelectedArticle(null);
    }
  }, []);

  // 매물 클릭 핸들러 (목록 or 클러스터 목록에서)
  const handleArticleClick = useCallback((article: Article) => {
    setSelectedArticle(article);
  }, []);

  // 클러스터 목록으로 돌아가기
  const handleBackToCluster = useCallback(() => {
    setSelectedArticle(null);
  }, []);

  // 상세 패널 닫기
  const handleCloseDetail = useCallback(() => {
    setSelectedArticle(null);
    setSelectedCluster(null);
  }, []);

  // 클러스터 목록 닫기
  const handleCloseCluster = useCallback(() => {
    setSelectedCluster(null);
  }, []);

  // 재시도
  const handleRetry = useCallback(() => {
    mutate();
  }, [mutate]);

  const activeFilters: Pick<ArticleFilters, "guCode" | "dongCode"> =
    filters.appliedFilters ?? {
      guCode: null,
      dongCode: null,
    };

  // 선택된 지역의 중심 좌표 계산
  const mapCenter = useMemo(() => {
    // 매물 선택 시 해당 매물 위치로 이동
    if (selectedArticle) {
      return { lat: selectedArticle.lat, lng: selectedArticle.lng };
    }

    const cortarNo = activeFilters.dongCode || activeFilters.guCode;
    if (!cortarNo) return undefined;
    const center = getRegionCenter(cortarNo);
    return center ? { lat: center.lat, lng: center.lng } : undefined;
  }, [selectedArticle, activeFilters.dongCode, activeFilters.guCode]);

  // 선택된 지역의 줌 레벨 (네이버맵: 숫자 클수록 확대)
  const mapZoom = useMemo(() => {
    // 매물 선택 시 더 확대 (카카오 level 3 → 네이버 zoom 18)
    if (selectedArticle) return 18;

    const cortarNo = activeFilters.dongCode || activeFilters.guCode;
    if (!cortarNo) return 11; // 카카오 level 8 → 네이버 zoom 11
    const center = getRegionCenter(cortarNo);
    return center?.zoom ?? 11;
  }, [selectedArticle, activeFilters.dongCode, activeFilters.guCode]);

  // 선택된 지역의 폴리곤 경로
  const cortarNo = activeFilters.dongCode || activeFilters.guCode;
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
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            error={error}
            selectedArticleId={selectedArticle?.id ?? null}
            onArticleClick={handleArticleClick}
            onLoadMore={loadMore}
            onRetry={handleRetry}
          />
        </div>

        {/* 지도 */}
        <div className="flex-1 relative">
          <NaverMap center={mapCenter} zoom={mapZoom}>
            {/* 구/동 폴리곤 */}
            {regionPolygonPaths && regionPolygonPaths.length > 0 && (
              <RegionPolygon paths={regionPolygonPaths} />
            )}

            {/* 클러스터 마커 (같은 위치 매물 그룹화) */}
            {clusters.map((cluster) => (
              <ClusterMarker
                key={cluster.key}
                cluster={cluster}
                isSelected={
                  selectedCluster?.key === cluster.key ||
                  cluster.articles.some((a) => a.id === selectedArticle?.id)
                }
                onClick={() => handleClusterClick(cluster)}
              />
            ))}

            {/* 선택된 매물의 대중교통 정보 */}
            {selectedArticle && (
              <TransitRouteOverlay lat={selectedArticle.lat} lng={selectedArticle.lng} />
            )}
          </NaverMap>

          {/* 클러스터 매물 목록 */}
          {selectedCluster && selectedCluster.articles.length > 1 && !selectedArticle && (
            <ClusterArticleList
              cluster={selectedCluster}
              onArticleClick={handleArticleClick}
              onBack={handleCloseCluster}
            />
          )}

          {/* 매물 상세 슬라이드 패널 */}
          {selectedArticle && (
            <ArticleDetail
              article={selectedArticle}
              onClose={handleCloseDetail}
              onBack={selectedCluster ? handleBackToCluster : undefined}
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
