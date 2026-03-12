import http from "node:http";
import https from "node:https";

// HTTP Keep-Alive 에이전트 (연결 재사용으로 TLS 핸드셰이크 오버헤드 감소)
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 4,
  timeout: 5000,
});

const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 4,
  timeout: 5000,
});

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
  const targetUrl = new URL(url);
  const transport = targetUrl.protocol === "https:" ? https : http;

  return new Promise<UpstreamTextResponse>((resolve, reject) => {
    let settled = false;
    let timeoutError: Error | null = null;

    const agent = targetUrl.protocol === "https:" ? httpsAgent : httpAgent;

    const req = transport.request(
      targetUrl,
      {
        method: "GET",
        agent,
        headers: {
          ...options.headers,
        },
      },
      (res) => {
        let text = "";
        res.setEncoding("utf8");

        res.on("data", (chunk) => {
          text += chunk;
        });

        res.on("end", () => {
          if (settled) {
            return;
          }
          settled = true;
          clearTimeout(timeoutId);
          resolve({
            status: res.statusCode ?? 0,
            statusText: res.statusMessage ?? "",
            text,
          });
        });

        res.on("error", (error) => {
          if (settled) {
            return;
          }
          settled = true;
          clearTimeout(timeoutId);
          reject(error);
        });
      }
    );

    const timeoutId = setTimeout(() => {
      timeoutError = new Error(`Request timeout after ${options.timeoutMs}ms`);
      req.destroy(timeoutError);
    }, options.timeoutMs);

    req.on("error", (error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutId);
      reject(timeoutError ?? error);
    });

    req.end();
  });
}
