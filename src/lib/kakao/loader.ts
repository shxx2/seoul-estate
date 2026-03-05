/**
 * 카카오맵 SDK 로딩 유틸리티
 *
 * react-kakao-maps-sdk의 Loader 클래스를 래핑하여
 * SDK 로딩 상태를 관리하고 window.kakao 타입을 선언합니다.
 *
 * 사용처: src/app/layout.tsx에서 Script 태그로 SDK를 로드한 뒤
 * useKakaoLoader 훅 또는 이 유틸을 통해 초기화합니다.
 */

import { Loader } from "react-kakao-maps-sdk";

// ─────────────────────────────────────────────
// window.kakao 전역 타입 선언
// ─────────────────────────────────────────────

declare global {
  interface Window {
    kakao: typeof kakao;
  }
}

// ─────────────────────────────────────────────
// SDK 로딩 상태 타입
// ─────────────────────────────────────────────

export type KakaoSdkStatus = "idle" | "loading" | "ready" | "error";

// ─────────────────────────────────────────────
// SDK 로더 인스턴스 (싱글턴)
// ─────────────────────────────────────────────

let loaderInstance: Loader | null = null;

/**
 * 카카오맵 SDK Loader 싱글턴 인스턴스를 반환합니다.
 * appKey는 환경변수 NEXT_PUBLIC_KAKAO_APP_KEY에서 읽습니다.
 */
export function getKakaoLoader(libraries: ("services" | "clusterer" | "drawing")[] = []): Loader {
  if (!loaderInstance) {
    const appkey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY ?? "";
    loaderInstance = new Loader({ appkey, libraries });
  }
  return loaderInstance;
}

/**
 * 카카오맵 SDK를 비동기적으로 로드합니다.
 * 이미 로드된 경우 캐시된 Promise를 반환합니다.
 *
 * @returns kakao 네임스페이스 객체
 */
export async function loadKakaoSdk(): Promise<typeof kakao> {
  const loader = getKakaoLoader(["clusterer"]);
  return loader.load();
}

/**
 * window.kakao가 이미 준비되었는지 동기적으로 확인합니다.
 * Script afterInteractive 로딩 후 상태 점검에 사용합니다.
 */
export function isKakaoReady(): boolean {
  return typeof window !== "undefined" && typeof window.kakao !== "undefined";
}
