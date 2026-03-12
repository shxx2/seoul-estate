// Edge Runtime 호환 - fetch API 사용

export interface UpstreamTextRequestOptions {
  headers?: Record<string, string>;
  timeoutMs: number;
}

export interface UpstreamTextResponse {
  status: number;
  statusText: string;
  text: string;
}

export async function requestUpstreamText(
  url: string,
  options: UpstreamTextRequestOptions
): Promise<UpstreamTextResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: options.headers,
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
