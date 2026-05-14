import { test } from "node:test";
import * as assert from "node:assert";
import { createRegistry } from "../../commands/registry";
import { parseCommand, UsageError } from "../../core/parser";
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

test("coerces contextual date inputs from ISO date strings", () => {
  const registry = createRegistry(fixtureCatalog);
  const parsed = parseCommand(
    ["goals", "update_due_date", "--goal-id", "g1", "--due-date", "2026-03-20"],
    registry,
    fixtureCatalog.types,
  );

  assert.equal(parsed.kind, "endpoint");
  if (parsed.kind === "endpoint") {
    assert.deepEqual(parsed.endpointInputs, {
      goal_id: "g1",
      due_date: {
        date_type: "day",
        value: "Mar 20, 2026",
        date: "2026-03-20",
      },
    });
  }
});

test("parses auth profiles commands", () => {
  const registry = createRegistry(fixtureCatalog);
  const parsed = parseCommand(["auth", "profiles"], registry, fixtureCatalog.types);

  assert.equal(parsed.kind, "auth");
  if (parsed.kind === "auth") {
    assert.equal(parsed.action, "profiles");
    assert.deepEqual(parsed.flags, new Map());
  }
});

test("coerces bare boolean endpoint flags to true", () => {
  const registry = createRegistry(fixtureCatalog);
  const parsed = parseCommand(
    ["goals", "update_target_value", "--goal-id", "g1", "--target-value", "10.5", "--send-notifications"],
    registry,
    fixtureCatalog.types,
  );

  assert.equal(parsed.kind, "endpoint");
  if (parsed.kind === "endpoint") {
    assert.deepEqual(parsed.endpointInputs, {
      goal_id: "g1",
      target_value: 10.5,
      send_notifications: true,
    });
  }
});

test("coerces explicit false boolean endpoint flags", () => {
  const registry = createRegistry(fixtureCatalog);
  const parsed = parseCommand(
    ["goals", "update_target_value", "--goal-id", "g1", "--target-value", "10.5", "--send-notifications=false"],
    registry,
    fixtureCatalog.types,
  );

  assert.equal(parsed.kind, "endpoint");
  if (parsed.kind === "endpoint") {
    assert.deepEqual(parsed.endpointInputs, {
      goal_id: "g1",
      target_value: 10.5,
      send_notifications: false,
    });
  }
});

test("parses scalar arrays from repeated flags", () => {
  const registry = createRegistry(fixtureCatalog);
  const parsed = parseCommand(
    [
      "goals",
      "update_target_value",
      "--goal-id",
      "g1",
      "--target-value",
      "10.5",
      "--subscriber-ids",
      "u1",
      "--subscriber-ids",
      "u2",
    ],
    registry,
    fixtureCatalog.types,
  );

  assert.equal(parsed.kind, "endpoint");
  if (parsed.kind === "endpoint") {
    assert.deepEqual(parsed.endpointInputs, {
      goal_id: "g1",
      target_value: 10.5,
      subscriber_ids: ["u1", "u2"],
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

test("rejects --*-file flags for non-markdown fields", () => {
  const registry = createRegistry(fixtureCatalog);

  assert.throws(
    () => parseCommand(["edit_project_name", "--project-id", "p1", "--name-file", "./name.md"], registry, fixtureCatalog.types),
    (error: unknown) => {
      assert.ok(error instanceof UsageError);
      assert.ok(error.message.includes("only supported for markdown input fields"));
      return true;
    },
  );
});

test("parses custom path input for people update_picture", () => {
  const registry = createRegistry(fixtureCatalog);
  const parsed = parseCommand(["people", "update_picture", "--avatar-file", "./avatar.png"], registry, fixtureCatalog.types);

  assert.equal(parsed.kind, "endpoint");
  if (parsed.kind === "endpoint") {
    assert.deepEqual(parsed.endpointInputs, {
      avatar_file: "./avatar.png",
    });
  }
});

test("parses bare boolean flags for custom endpoints", () => {
  const registry = createRegistry(fixtureCatalog);
  const parsed = parseCommand(["people", "update_picture", "--clear"], registry, fixtureCatalog.types);

  assert.equal(parsed.kind, "endpoint");
  if (parsed.kind === "endpoint") {
    assert.deepEqual(parsed.endpointInputs, {
      clear: true,
    });
  }
});

test("parses custom file input for files create", () => {
  const registry = createRegistry(fixtureCatalog);
  const parsed = parseCommand(
    ["files", "create", "--resource-hub-id", "rh1", "--file", "./report.png"],
    registry,
    fixtureCatalog.types,
  );

  assert.equal(parsed.kind, "endpoint");
  if (parsed.kind === "endpoint") {
    assert.deepEqual(parsed.endpointInputs, {
      resource_hub_id: "rh1",
      file: "./report.png",
    });
  }
});

test("rejects repeated --file flags for files create", () => {
  const registry = createRegistry(fixtureCatalog);

  assert.throws(
    () =>
      parseCommand(
        ["files", "create", "--resource-hub-id", "rh1", "--file", "./a.png", "--file", "./b.png"],
        registry,
        fixtureCatalog.types,
      ),
    (error: unknown) => {
      assert.ok(error instanceof UsageError);
      assert.equal(error.message, "Expected string for 'file', got object.");
      return true;
    },
  );
});
