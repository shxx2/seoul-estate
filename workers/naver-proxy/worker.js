// Cloudflare Workers - 네이버 부동산 API 프록시

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_4_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1",
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export default {
  async fetch(request, env, ctx) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const url = new URL(request.url);

    // /proxy?url=... 형식으로 요청
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: "Missing url parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 네이버 도메인만 허용
    const targetParsed = new URL(targetUrl);
    if (!targetParsed.hostname.endsWith("naver.com")) {
      return new Response(JSON.stringify({ error: "Only naver.com allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "User-Agent": getRandomUserAgent(),
          "Referer": "https://m.land.naver.com/",
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        },
      });

      const text = await response.text();

      return new Response(text, {
        status: response.status,
        headers: {
          "Content-Type": response.headers.get("Content-Type") || "application/json",
          "Access-Control-Allow-Origin": "*",
          "X-Proxy-Status": response.status.toString(),
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  },
};
