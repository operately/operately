import { it } from "node:test";
import * as assert from "node:assert/strict";
import { createServer } from "node:http";
import { ApiError, callEndpoint } from "../../core/http";
import { fixtureCatalog } from "./fixture-catalog";

for (const type of ["query", "mutation"] as const) {
  it(`preserves a ${type} 503 and its error code without retrying`, async () => {
    const endpoint = fixtureCatalog.endpoints.find((entry) => entry.type === type);
    assert.ok(endpoint);
    const payload = {
      error: "Service Unavailable",
      code: "database_connection_queue_timeout",
      message: "Please try again.",
    };
    let requests = 0;
    const server = createServer((_request, response) => {
      requests++;
      response.writeHead(503, { "Content-Type": "application/json" });
      response.end(JSON.stringify(payload));
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    assert.ok(address && typeof address !== "string");

    try {
      await assert.rejects(
        callEndpoint({
          endpoint,
          baseUrl: `http://127.0.0.1:${address.port}`,
          token: "test",
          inputs: {},
          timeoutMs: 2000,
        }),
        (error: unknown) => {
          assert.ok(error instanceof ApiError);
          assert.equal(error.status, 503);
          assert.deepEqual(error.payload, payload);
          return true;
        },
      );
      assert.equal(requests, 1);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
  });
}
