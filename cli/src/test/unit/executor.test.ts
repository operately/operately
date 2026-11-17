import { it, mock } from "node:test";
import * as assert from "node:assert/strict";
import { createServer } from "node:http";
import { executeEndpointCommand } from "../../commands/executor";
import { createRegistry } from "../../commands/registry";
import { fixtureCatalog } from "./fixture-catalog";

it("prints structured hub selection errors without losing candidates", async () => {
  const registry = createRegistry(fixtureCatalog);
  const endpoint = registry.endpoints.find((entry) => entry.type === "query");
  assert.ok(endpoint);
  const details = { code: "default_resource_hub_unavailable", candidates: [{ id: "hub-2", name: "Design" }] };
  const server = createServer((_request, response) => {
    response.writeHead(400, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Bad request", message: "Retry with resource_hub_id", details }));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const output = mock.method(console, "error", () => {});
  try {
    const result = await executeEndpointCommand({
      endpoint,
      registry,
      endpointInputs: {},
      globalFlags: {
        token: "test",
        baseUrl: `http://127.0.0.1:${address.port}`,
        compact: false,
        json: false,
        verbose: false,
      },
    });
    assert.equal(result, 4);
    assert.ok(String(output.mock.calls[0]?.arguments[0]).includes(JSON.stringify(details)));
  } finally {
    output.mock.restore();
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
