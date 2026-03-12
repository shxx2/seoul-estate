"use client";

/**
 * PageAgentProvider - AI 에이전트를 웹페이지에 통합
 *
 * CDN 스크립트 방식으로 page-agent를 로드합니다.
 * 자연어 명령으로 UI를 조작할 수 있게 해줍니다.
 */

import { useEffect } from "react";
import Script from "next/script";

export default function PageAgentProvider() {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      console.warn("[PageAgent] OpenAI API key not found");
      return;
    }

    // 전역 설정 객체 생성 (스크립트 로드 전에 설정)
    (window as Window & { PAGE_AGENT_CONFIG?: object }).PAGE_AGENT_CONFIG = {
      model: "gpt-4o-mini",
      baseURL: "https://api.openai.com/v1",
      apiKey,
    };
  }, [apiKey]);

  if (!apiKey) return null;

  return (
    <Script
      src="https://cdn.jsdelivr.net/npm/page-agent@1.5.6/dist/iife/page-agent.js"
      strategy="lazyOnload"
      onLoad={() => {
        console.log("[PageAgent] Script loaded");
        // 스크립트 로드 후 초기화
        const PageAgentClass = (window as Window & { PageAgent?: new (config: object) => { panel?: { show?: () => void } } }).PageAgent;
        if (PageAgentClass && apiKey) {
          const agent = new PageAgentClass({
            model: "gpt-4o-mini",
            baseURL: "https://api.openai.com/v1",
            apiKey,
          });
          (window as Window & { pageAgent?: object }).pageAgent = agent;
          console.log("[PageAgent] Initialized successfully");

          // Panel 명시적으로 표시
          if (agent.panel && typeof agent.panel.show === "function") {
            agent.panel.show();
            console.log("[PageAgent] Panel shown");
          }
        }
      }}
      onError={(e) => {
        console.error("[PageAgent] Failed to load script:", e);
      }}
    />
  );
}
