"use client";

/**
 * PageAgentProvider - AI 에이전트를 웹페이지에 통합
 *
 * 데모 CDN 스크립트를 로드하고, 우리 API 키로 재설정합니다.
 */

import { useEffect } from "react";
import Script from "next/script";

export default function PageAgentProvider() {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      console.warn("[PageAgent] OpenAI API key not found");
    }
  }, [apiKey]);

  // 데모 스크립트 로드 (UI 포함) - crossorigin 필수
  // 문서: https://github.com/alibaba/page-agent
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/page-agent@1.5.6/dist/iife/page-agent.demo.js"
        strategy="afterInteractive"
        crossOrigin="anonymous"
        onLoad={() => {
          console.log("[PageAgent] Demo script loaded successfully");
        }}
        onError={(e) => {
          console.error("[PageAgent] Failed to load demo script:", e);
        }}
      />
    </>
  );
}
