"use client";

/**
 * ArticleDetail - 매물 상세 정보 슬라이드 패널
 *
 * 선택된 매물의 상세 정보를 우측에서 슬라이드인하여 표시합니다.
 * hasDetailInfo 필드에 따라 제한된 정보를 안내합니다.
 * article이 null이면 패널이 닫힙니다.
 */

import React, { useState } from "react";
import Image from "next/image";
import {
  X,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Building2,
  MapPin,
  Layers,
  Maximize2,
  CalendarDays,
  User,
  ExternalLink,
  AlertTriangle,
  Home,
  Bath,
  Compass,
} from "lucide-react";
import type { Article } from "@/types/article";
import { TRADE_TYPE_LABEL, BUILDING_TYPE_LABEL } from "@/lib/constants";
import { formatPrice, formatArea, parseFloorInfo } from "@/lib/format";

// ─────────────────────────────────────────────
// Props 타입
// ─────────────────────────────────────────────

export interface ArticleDetailProps {
  article: Article | null;
  onClose: () => void;
  /** 클러스터에서 진입한 경우 뒤로가기 콜백 */
  onBack?: () => void;
}

// ─────────────────────────────────────────────
// 서브 컴포넌트: 정보 행
// ─────────────────────────────────────────────

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 shrink-0">{icon}</span>
      <span className="text-xs text-gray-500 w-16 shrink-0">{label}</span>
      <span className="text-xs font-medium text-gray-800 flex-1 text-right">
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// 거래 유형별 가격 표시
// ─────────────────────────────────────────────

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
      article.monthlyRent !== null ? `${article.monthlyRent}만원` : "-";
    return `보증 ${depositStr} / 월 ${rentStr}`;
  }
  return "-";
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────

type MobileDetailState = "minimized" | "peek" | "full";

export default function ArticleDetail({ article, onClose, onBack }: ArticleDetailProps) {
  const isOpen = article !== null;
  const [mobileState, setMobileState] = useState<MobileDetailState>("peek");

  const handleMobileExpand = () => setMobileState("full");
  const handleMobileMinimize = () => setMobileState("minimized");
  const handleMobilePeek = () => setMobileState("peek");

  // 모바일 최소화 상태: 플로팅 버튼
  if (isOpen && mobileState === "minimized") {
    return (
      <>
        {/* 데스크톱: 기존 사이드 패널 */}
        <aside
          aria-label="매물 상세 정보"
          className="hidden md:flex fixed top-0 right-0 h-full z-40 w-80 bg-white border-l border-gray-100 shadow-xl flex-col"
        >
          {article && <PanelContent article={article} onClose={onClose} onBack={onBack} />}
        </aside>

        {/* 모바일: 플로팅 버튼 */}
        <button
          type="button"
          onClick={handleMobilePeek}
          className="fixed bottom-4 right-4 z-50 md:hidden
            flex items-center gap-2 px-4 py-3 rounded-full
            bg-blue-600 text-white font-semibold text-sm
            shadow-lg shadow-blue-500/30
            active:scale-95 transition-transform"
          aria-label="매물 상세 보기"
        >
          <ChevronUp size={18} />
          <span>상세정보</span>
        </button>
      </>
    );
  }

  const mobileHeightMap: Record<MobileDetailState, string> = {
    minimized: "h-0",
    peek: "h-[40vh]",
    full: "h-[85vh]",
  };

  return (
    <>
      {/* 데스크톱: 사이드 패널 */}
      <aside
        aria-label="매물 상세 정보"
        aria-hidden={!isOpen}
        className={[
          "hidden md:flex fixed top-0 right-0 h-full z-40",
          "w-80 bg-white border-l border-gray-100 shadow-xl",
          "flex-col",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        {article && <PanelContent article={article} onClose={onClose} onBack={onBack} />}
      </aside>

      {/* 모바일: 바텀 시트 */}
      {isOpen && (
        <div
          className={[
            "fixed bottom-0 left-0 right-0 z-50 md:hidden",
            "bg-white rounded-t-2xl shadow-2xl border-t border-gray-200",
            "flex flex-col transition-all duration-300",
            mobileHeightMap[mobileState],
          ].join(" ")}
        >
          {/* 드래그 핸들 */}
          <button
            type="button"
            onClick={() => mobileState === "full" ? handleMobilePeek() : handleMobileExpand()}
            className="w-full flex items-center justify-center py-2 cursor-pointer bg-transparent border-0"
            aria-label={mobileState === "full" ? "줄이기" : "펼치기"}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </button>

          {/* 헤더 */}
          {article && (
            <div className="flex items-center justify-between px-4 py-1 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="p-1 text-gray-500 hover:text-gray-700"
                    aria-label="뒤로가기"
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}
                <span className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">
                  {article.articleName}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={mobileState === "full" ? handleMobilePeek : handleMobileExpand}
                  className="p-1.5 text-gray-400 hover:text-gray-600"
                  aria-label={mobileState === "full" ? "줄이기" : "펼치기"}
                >
                  {mobileState === "full" ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </button>
                <button
                  type="button"
                  onClick={handleMobileMinimize}
                  className="p-1.5 text-gray-400 hover:text-gray-600"
                  aria-label="최소화"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}

          {/* 콘텐츠 */}
          {article && (
            <MobilePanelContent
              article={article}
              isExpanded={mobileState === "full"}
            />
          )}
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// 모바일 패널 콘텐츠
// ─────────────────────────────────────────────

interface MobilePanelContentProps {
  article: Article;
  isExpanded: boolean;
}

function MobilePanelContent({ article, isExpanded }: MobilePanelContentProps) {
  const priceDisplay = getPriceDisplay(article);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* 간략 정보 (항상 표시) */}
      <div className="px-4 py-3 flex items-center gap-3">
        {/* 썸네일 */}
        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0 relative">
          {article.thumbnailUrl ? (
            <Image
              src={article.thumbnailUrl}
              alt={article.articleName}
              fill
              sizes="64px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 size={24} className="text-gray-300" />
            </div>
          )}
        </div>
        {/* 기본 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={[
              "text-[10px] font-bold px-1.5 py-0.5 rounded",
              article.tradeType === "SALE" ? "bg-blue-600 text-white" :
              article.tradeType === "JEONSE" ? "bg-emerald-600 text-white" : "bg-orange-500 text-white"
            ].join(" ")}>
              {TRADE_TYPE_LABEL[article.tradeType]}
            </span>
            <span className="text-[10px] text-gray-500">
              {BUILDING_TYPE_LABEL[article.buildingType]}
            </span>
          </div>
          <p className="text-lg font-bold text-gray-900">{priceDisplay}</p>
          <p className="text-xs text-gray-500 truncate">{article.dong} · {formatArea(article.exclusiveArea)}</p>
        </div>
      </div>

      {/* 네이버 부동산 바로가기 (항상 표시) */}
      <div className="px-4 pb-3">
        <a
          href={article.articleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl
            text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <ExternalLink size={14} />
          네이버 부동산에서 보기
        </a>
      </div>

      {/* 상세 정보 (펼쳤을 때만) */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <DetailedInfo article={article} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 상세 정보 섹션
// ─────────────────────────────────────────────

function DetailedInfo({ article }: { article: Article }) {
  const { floor } = parseFloorInfo(article.floor);

  return (
    <div className="flex flex-col gap-3">
      {/* 주소 */}
      <div className="flex items-center gap-1.5">
        <MapPin size={12} className="text-gray-400" />
        <span className="text-xs text-gray-600">{article.roadAddress || article.address}</span>
      </div>

      {/* 기본 정보 그리드 */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 rounded-lg p-2">
          <span className="text-gray-400">전용면적</span>
          <p className="font-medium text-gray-800">{formatArea(article.exclusiveArea)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <span className="text-gray-400">층수</span>
          <p className="font-medium text-gray-800">{floor !== "-" ? `${floor}/${article.totalFloor}층` : "-"}</p>
        </div>
        {article.direction && (
          <div className="bg-gray-50 rounded-lg p-2">
            <span className="text-gray-400">방향</span>
            <p className="font-medium text-gray-800">{article.direction}</p>
          </div>
        )}
        {article.buildYear && (
          <div className="bg-gray-50 rounded-lg p-2">
            <span className="text-gray-400">건축년도</span>
            <p className="font-medium text-gray-800">{article.buildYear}년</p>
          </div>
        )}
      </div>

      {/* 매물 설명 */}
      {article.description && (
        <div>
          <span className="text-[10px] font-semibold text-gray-400 uppercase">매물 설명</span>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">{article.description}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 패널 내용 (article이 있을 때만 렌더링)
// ─────────────────────────────────────────────

interface PanelContentProps {
  article: Article;
  onClose: () => void;
  onBack?: () => void;
}

function PanelContent({ article, onClose, onBack }: PanelContentProps) {
  const { floor } = parseFloorInfo(article.floor);
  const priceDisplay = getPriceDisplay(article);

  return (
    <>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-1.5">
          {/* 뒤로가기 버튼 (클러스터에서 진입 시) */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="목록으로 돌아가기"
              className="p-1.5 -ml-1.5 mr-1 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </button>
          )}
          <span
            className={[
              "text-[10px] font-bold px-2 py-0.5 rounded",
              article.tradeType === "SALE"
                ? "bg-blue-600 text-white"
                : article.tradeType === "JEONSE"
                ? "bg-emerald-600 text-white"
                : "bg-orange-500 text-white",
            ].join(" ")}
          >
            {TRADE_TYPE_LABEL[article.tradeType]}
          </span>
          <span className="text-xs font-medium text-gray-500">
            {BUILDING_TYPE_LABEL[article.buildingType]}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="상세 패널 닫기"
          className={[
            "p-1.5 rounded-lg text-gray-400",
            "hover:text-gray-700 hover:bg-gray-100",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
          ].join(" ")}
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {/* 스크롤 가능한 본문 */}
      <div className="flex-1 overflow-y-auto">
        {/* 썸네일 */}
        <div className="relative w-full h-44 bg-gray-100">
          {article.thumbnailUrl ? (
            <Image
              src={article.thumbnailUrl}
              alt={`${article.articleName} 이미지`}
              fill
              sizes="320px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 size={40} className="text-gray-300" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="px-4 py-4 flex flex-col gap-4">
          {/* 매물명 + 주소 */}
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-bold text-gray-900 leading-snug">
              {article.articleName}
            </h2>
            <div className="flex items-center gap-1">
              <MapPin size={11} className="text-gray-400 shrink-0" aria-hidden="true" />
              <span className="text-xs text-gray-500 truncate">
                {article.roadAddress || article.address}
              </span>
            </div>
          </div>

          {/* 가격 */}
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              {TRADE_TYPE_LABEL[article.tradeType]}가
            </span>
            <p className="text-xl font-bold text-gray-900 mt-0.5 tracking-tight">
              {priceDisplay}
            </p>
          </div>

          {/* 기본 정보 */}
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
              기본 정보
            </span>
            <div className="rounded-xl border border-gray-100 px-3 py-1">
              <InfoRow
                icon={<Maximize2 size={13} />}
                label="전용면적"
                value={formatArea(article.exclusiveArea)}
              />
              <InfoRow
                icon={<Maximize2 size={13} />}
                label="공급면적"
                value={formatArea(article.supplyArea)}
              />
              <InfoRow
                icon={<Layers size={13} />}
                label="층수"
                value={
                  floor !== "-"
                    ? `${floor}층 / 총 ${article.totalFloor}층`
                    : "-"
                }
              />
              {article.buildYear && (
                <InfoRow
                  icon={<CalendarDays size={13} />}
                  label="건축년도"
                  value={`${article.buildYear}년`}
                />
              )}
              {article.direction && (
                <InfoRow
                  icon={<Compass size={13} />}
                  label="방향"
                  value={article.direction}
                />
              )}
              {article.roomCount !== null && (
                <InfoRow
                  icon={<Home size={13} />}
                  label="방 수"
                  value={`${article.roomCount}개`}
                />
              )}
              {article.bathroomCount !== null && (
                <InfoRow
                  icon={<Bath size={13} />}
                  label="욕실 수"
                  value={`${article.bathroomCount}개`}
                />
              )}
            </div>
          </div>

          {/* 상세 정보 미제공 안내 */}
          {!article.hasDetailInfo && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
              <AlertTriangle
                size={14}
                className="text-amber-500 mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <p className="text-xs text-amber-700 leading-relaxed">
                상세 정보를 불러오지 못했습니다. 네이버 부동산에서 전체 정보를 확인하세요.
              </p>
            </div>
          )}

          {/* 매물 설명 */}
          {article.description && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                매물 설명
              </span>
              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 rounded-xl px-3 py-2.5">
                {article.description}
              </p>
            </div>
          )}

          {/* 중개사 + 확인일자 */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              중개 정보
            </span>
            <div className="rounded-xl border border-gray-100 px-3 py-1">
              {article.agentName && (
                <InfoRow
                  icon={<User size={13} />}
                  label="중개사"
                  value={article.agentName}
                />
              )}
              <InfoRow
                icon={<CalendarDays size={13} />}
                label="확인일자"
                value={article.confirmDate}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 푸터: 네이버 부동산 링크 */}
      <div className="shrink-0 px-4 py-3 border-t border-gray-100">
        <a
          href={article.articleUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="네이버 부동산에서 보기 (새 탭)"
          className={[
            "flex items-center justify-center gap-1.5",
            "w-full py-2.5 rounded-xl",
            "text-sm font-semibold text-white bg-blue-600",
            "hover:bg-blue-700 transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1",
          ].join(" ")}
        >
          <ExternalLink size={14} aria-hidden="true" />
          네이버 부동산에서 보기
        </a>
      </div>
    </>
  );
}
