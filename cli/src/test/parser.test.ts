import test from "node:test";
import assert from "node:assert/strict";
import { createRegistry } from "../commands/registry";
import { parseCommand, UsageError } from "../core/parser";
import { fixtureCatalog } from "./fixture-catalog";

test("parses required input flags", () => {
  const registry = createRegistry(fixtureCatalog);
  const parsed = parseCommand(
    ["edit_project_name", "--project-id", "p1", "--name", "Renamed"],
    registry,
    fixtureCatalog.types,
  );

  assert.equal(parsed.kind, "endpoint");
  if (parsed.kind === "endpoint") {
    assert.deepEqual(parsed.endpointInputs, {
      project_id: "p1",
      name: "Renamed",
    });
  }
});

test("supports nested list object flags via dot-index notation", () => {
  const registry = createRegistry(fixtureCatalog);
  const parsed = parseCommand(
    [
      "goals",
      "update_target_value",
      "--goal-id",
      "g1",
      "--target-value",
      "10.5",
      "--task-statuses.0.id",
      "s1",
      "--task-statuses.0.label",
      "Open",
    ],
    registry,
    fixtureCatalog.types,
  );

  assert.equal(parsed.kind, "endpoint");
  if (parsed.kind === "endpoint") {
    assert.deepEqual(parsed.endpointInputs, {
      goal_id: "g1",
      target_value: 10.5,
      task_statuses: [{ id: "s1", label: "Open" }],
    });
  }
});

test("rejects unknown flag names", () => {
  const registry = createRegistry(fixtureCatalog);

  assert.throws(
    () => parseCommand(["edit_project_name", "--unknown", "x"], registry, fixtureCatalog.types),
    (error: unknown) => {
      assert.ok(error instanceof UsageError);
      return true;
    },
  );
});
