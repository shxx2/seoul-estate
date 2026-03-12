"use client";

import { useEffect } from "react";
import { useFilterStore } from "@/store/filterStore";

/**
 * FilterHydration - localStorage에서 필터 상태 복원
 *
 * SSR 호환을 위해 클라이언트에서만 하이드레이션 실행
 */
export default function FilterHydration() {
  useEffect(() => {
    // 클라이언트에서 localStorage 필터 복원
    useFilterStore.persist.rehydrate();
  }, []);

  return null;
}
