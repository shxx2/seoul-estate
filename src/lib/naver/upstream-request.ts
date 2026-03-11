import http from "node:http";
import https from "node:https";

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

    const req = transport.request(
      targetUrl,
      {
        method: "GET",
        agent: false,
        headers: {
          Connection: "close",
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
