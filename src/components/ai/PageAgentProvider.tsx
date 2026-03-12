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

  // 데모 스크립트 로드 (UI 포함) - 나중에 API 키로 재설정
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/page-agent@1.5.6/dist/iife/page-agent.demo.js"
        strategy="lazyOnload"
        onLoad={() => {
          console.log("[PageAgent] Demo script loaded");

          // 자체 API 키가 있으면 재설정
          if (apiKey) {
            setTimeout(() => {
              const win = window as Window & { pageAgent?: { setConfig?: (config: object) => void } };
              if (win.pageAgent?.setConfig) {
                win.pageAgent.setConfig({
                  model: "gpt-4o-mini",
                  baseURL: "https://api.openai.com/v1",
                  apiKey,
                });
                console.log("[PageAgent] Reconfigured with custom API key");
              }
            }, 1000);
          }
        }}
        onError={(e) => {
          console.error("[PageAgent] Failed to load demo script:", e);
        }}
      />
    </>
  );
}
