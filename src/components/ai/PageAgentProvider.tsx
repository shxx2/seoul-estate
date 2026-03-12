"use client";

/**
 * PageAgentProvider - AI 에이전트를 웹페이지에 통합
 *
 * npm 패키지 방식으로 page-agent를 로드합니다.
 * 자연어 명령으로 UI를 조작할 수 있게 해줍니다.
 */

import { useEffect, useState } from "react";

export default function PageAgentProvider() {
  const [isReady, setIsReady] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  useEffect(() => {
    if (typeof window === "undefined" || !apiKey) {
      if (!apiKey) console.warn("[PageAgent] OpenAI API key not found");
      return;
    }

    const initPageAgent = async () => {
      try {
        const { PageAgent } = await import("page-agent");

        const agent = new PageAgent({
          model: "gpt-4o-mini",
          baseURL: "https://api.openai.com/v1",
          apiKey,
        });

        // 전역에서 접근 가능하도록 설정
        (window as Window & { pageAgent?: typeof agent }).pageAgent = agent;

        setIsReady(true);
        console.log("[PageAgent] Initialized successfully");
        console.log("[PageAgent] Panel:", agent.panel);

        // Panel이 있으면 표시 시도
        if (agent.panel) {
          console.log("[PageAgent] Panel methods:", Object.keys(agent.panel));
        }
      } catch (error) {
        console.error("[PageAgent] Failed to initialize:", error);
      }
    };

    initPageAgent();
  }, [apiKey]);

  return null;
}
