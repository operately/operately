import { test } from "node:test";
import * as assert from "node:assert";
import { createRegistry } from "../../src/commands/registry";
import { fixtureCatalog } from "./fixture-catalog";

test("root command is exactly endpoint name", () => {
  const registry = createRegistry(fixtureCatalog);
  const endpoint = registry.find(["edit_project_name"]);
  assert.ok(endpoint);
  assert.equal(endpoint?.full_name, "edit_project_name");
});

test("namespaced command is exactly '<namespace> <endpoint_name>'", () => {
  const registry = createRegistry(fixtureCatalog);
  const endpoint = registry.find(["goals", "update_target_value"]);
  assert.ok(endpoint);
  assert.equal(endpoint?.full_name, "goals/update_target_value");
});
