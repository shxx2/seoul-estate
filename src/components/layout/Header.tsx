"use client";
/**
 * Header - 상단 헤더 컴포넌트
 * 로고, 서비스명 표시
 */
import React from "react";
import { Home } from "lucide-react";

export default function Header() {
  return (
    <header className="h-14 bg-white border-b border-gray-100 px-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
        <Home size={20} className="text-blue-600" aria-hidden="true" />
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">
          서울부동산
        </h1>
      </div>
      <span className="text-xs text-gray-400">MVP v0.1</span>
    </header>
  );
}
