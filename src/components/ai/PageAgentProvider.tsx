"use client";

/**
 * PageAgentProvider - AI 에이전트를 웹페이지에 통합
 *
 * 자연어 명령으로 UI를 조작할 수 있게 해줍니다.
 * 예: "강남구 아파트 전세 보여줘", "가격 3억 이하로 필터링해"
 */

import { useEffect, useState } from "react";

export default function PageAgentProvider() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 클라이언트 사이드에서만 로드
    if (typeof window === "undefined") return;

    const initPageAgent = async () => {
      try {
        const { PageAgent } = await import("page-agent");

        const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
        if (!apiKey) {
          console.warn("[PageAgent] OpenAI API key not found");
          return;
        }

        const agent = new PageAgent({
          model: "gpt-4o-mini",
          baseURL: "https://api.openai.com/v1",
          apiKey,
        });

        // 전역에서 접근 가능하도록 설정 (디버깅용)
        (window as Window & { pageAgent?: typeof agent }).pageAgent = agent;

        setIsLoaded(true);
        console.log("[PageAgent] Initialized successfully");
      } catch (error) {
        console.error("[PageAgent] Failed to initialize:", error);
      }
    };

    initPageAgent();
  }, []);

  // 렌더링할 UI 없음 - PageAgent가 자체 UI를 생성함
  return null;
}
