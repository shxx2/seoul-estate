// Edge Runtime 호환 - fetch API 사용
// Cloudflare Workers 프록시 지원

export interface UpstreamTextRequestOptions {
  headers?: Record<string, string>;
  timeoutMs: number;
}

export interface UpstreamTextResponse {
  status: number;
  statusText: string;
  text: string;
}

// Cloudflare Workers 프록시 URL (환경변수로 설정)
const PROXY_URL = process.env.NAVER_PROXY_URL;

export async function requestUpstreamText(
  url: string,
  options: UpstreamTextRequestOptions
): Promise<UpstreamTextResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    // 프록시가 설정되어 있으면 프록시를 통해 요청
    const targetUrl = PROXY_URL
      ? `${PROXY_URL}/proxy?url=${encodeURIComponent(url)}`
      : url;

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: PROXY_URL ? undefined : options.headers, // 프록시 사용시 헤더는 프록시가 설정
      signal: controller.signal,
    });

    const text = await response.text();

    return {
      status: response.status,
      statusText: response.statusText,
      text,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${options.timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
