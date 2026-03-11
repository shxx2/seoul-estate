import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

import { requestUpstreamText } from "./upstream-request";

async function withServer(
  handler: http.RequestListener,
  run: (url: string) => Promise<void>
): Promise<void> {
  const server = http.createServer(handler);

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

test("requestUpstreamText returns status text and body", async () => {
  await withServer((req, res) => {
    res.writeHead(200, "OK", {
      "content-type": "text/plain",
      "x-echo-header": String(req.headers["x-test-header"] ?? ""),
    });
    res.end("hello");
  }, async (url) => {
    const response = await requestUpstreamText(`${url}/articles`, {
      headers: {
        "x-test-header": "transport-check",
      },
      timeoutMs: 1000,
    });

    assert.equal(response.status, 200);
    assert.equal(response.statusText, "OK");
    assert.equal(response.text, "hello");
  });
});

test("requestUpstreamText throws a timeout error when the upstream stalls", async () => {
  await withServer((_req, res) => {
    setTimeout(() => {
      res.writeHead(200, "OK", {
        "content-type": "text/plain",
      });
      res.end("late");
    }, 100);
  }, async (url) => {
    await assert.rejects(
      () =>
        requestUpstreamText(`${url}/slow`, {
          timeoutMs: 10,
        }),
      /Request timeout after 10ms/
    );
  });
});
