import { test } from "node:test";
import * as assert from "node:assert";
import { createRegistry } from "../../commands/registry";
import { parseCommand, UsageError } from "../../core/parser";
import { fixtureCatalog } from "./fixture-catalog";

const registry = createRegistry(fixtureCatalog);

test("parses ISO date format (YYYY-MM-DD) as day type", () => {
  const parsed = parseCommand(
    ["goals", "update_due_date", "--goal-id", "g1", "--due-date", "2025-03-20"],
    registry,
    fixtureCatalog.types,
  );

  assert.equal(parsed.kind, "endpoint");
  if (parsed.kind === "endpoint") {
    assert.deepEqual((parsed.endpointInputs as any).due_date, {
      date_type: "day",
      value: "Mar 20, 2025",
      date: "2025-03-20",
    });
  }
});

test("parses year format (YYYY) as year type with end of year date", () => {
  const parsed = parseCommand(
    ["goals", "update_due_date", "--goal-id", "g1", "--due-date", "2025"],
    registry,
    fixtureCatalog.types,
  );

  assert.equal(parsed.kind, "endpoint");
  if (parsed.kind === "endpoint") {
    assert.deepEqual((parsed.endpointInputs as any).due_date, {
      date_type: "year",
      value: "2025",
      date: "2025-12-31",
    });
  }
});

test("parses year format with caret (YYYY^) as year type with start of year date", () => {
  const parsed = parseCommand(
    ["goals", "update_due_date", "--goal-id", "g1", "--due-date", "2025^"],
    registry,
    fixtureCatalog.types,
  );

  assert.equal(parsed.kind, "endpoint");
  if (parsed.kind === "endpoint") {
    assert.deepEqual((parsed.endpointInputs as any).due_date, {
      date_type: "year",
      value: "2025",
      date: "2025-01-01",
    });
  }
});

test("parses quarter format (YYYY/q#) as quarter type with end of quarter date", () => {
  const parsed = parseCommand(
    ["goals", "update_due_date", "--goal-id", "g1", "--due-date", "2025/q1"],
    registry,
    fixtureCatalog.types,
  );

  assert.equal(parsed.kind, "endpoint");
  if (parsed.kind === "endpoint") {
    assert.deepEqual((parsed.endpointInputs as any).due_date, {
      date_type: "quarter",
      value: "Q1 2025",
      date: "2025-03-31",
    });
  }
});

test("parses quarter format with caret (YYYY/q#^) as quarter type with start of quarter date", () => {
  const parsed = parseCommand(
    ["goals", "update_due_date", "--goal-id", "g1", "--due-date", "2025/q1^"],
    registry,
    fixtureCatalog.types,
  );

  assert.equal(parsed.kind, "endpoint");
  if (parsed.kind === "endpoint") {
    assert.deepEqual((parsed.endpointInputs as any).due_date, {
      date_type: "quarter",
      value: "Q1 2025",
      date: "2025-01-01",
    });
  }
});

test("parses all quarters correctly with end dates", () => {
  const quarters = [
    { input: "2025/q1", expected: "2025-03-31" },
    { input: "2025/q2", expected: "2025-06-30" },
    { input: "2025/q3", expected: "2025-09-30" },
    { input: "2025/q4", expected: "2025-12-31" },
  ];

  for (const { input, expected } of quarters) {
    const parsed = parseCommand(
      ["goals", "update_due_date", "--goal-id", "g1", "--due-date", input],
      registry,
      fixtureCatalog.types,
    );

    assert.equal(parsed.kind, "endpoint");
    if (parsed.kind === "endpoint") {
      assert.equal((parsed.endpointInputs as any).due_date.date, expected, `Failed for ${input}`);
    }
  }
});

test("parses all quarters correctly with start dates", () => {
  const quarters = [
    { input: "2025/q1^", expected: "2025-01-01" },
    { input: "2025/q2^", expected: "2025-04-01" },
    { input: "2025/q3^", expected: "2025-07-01" },
    { input: "2025/q4^", expected: "2025-10-01" },
  ];

  for (const { input, expected } of quarters) {
    const parsed = parseCommand(
      ["goals", "update_due_date", "--goal-id", "g1", "--due-date", input],
      registry,
      fixtureCatalog.types,
    );

    assert.equal(parsed.kind, "endpoint");
    if (parsed.kind === "endpoint") {
      assert.equal((parsed.endpointInputs as any).due_date.date, expected, `Failed for ${input}`);
    }
  }
});

test("parses month format (YYYY/MM) as month type with end of month date", () => {
  const parsed = parseCommand(
    ["goals", "update_due_date", "--goal-id", "g1", "--due-date", "2025/01"],
    registry,
    fixtureCatalog.types,
  );

  assert.equal(parsed.kind, "endpoint");
  if (parsed.kind === "endpoint") {
    assert.deepEqual((parsed.endpointInputs as any).due_date, {
      date_type: "month",
      value: "Jan 2025",
      date: "2025-01-31",
    });
  }
});

test("parses month format with caret (YYYY/MM^) as month type with start of month date", () => {
  const parsed = parseCommand(
    ["goals", "update_due_date", "--goal-id", "g1", "--due-date", "2025/01^"],
    registry,
    fixtureCatalog.types,
  );

  assert.equal(parsed.kind, "endpoint");
  if (parsed.kind === "endpoint") {
    assert.deepEqual((parsed.endpointInputs as any).due_date, {
      date_type: "month",
      value: "Jan 2025",
      date: "2025-01-01",
    });
  }
});

test("parses all months correctly with end dates", () => {
  const months = [
    { input: "2025/01", expected: "2025-01-31" },
    { input: "2025/02", expected: "2025-02-28" },
    { input: "2025/03", expected: "2025-03-31" },
    { input: "2025/04", expected: "2025-04-30" },
    { input: "2025/05", expected: "2025-05-31" },
    { input: "2025/06", expected: "2025-06-30" },
    { input: "2025/07", expected: "2025-07-31" },
    { input: "2025/08", expected: "2025-08-31" },
    { input: "2025/09", expected: "2025-09-30" },
    { input: "2025/10", expected: "2025-10-31" },
    { input: "2025/11", expected: "2025-11-30" },
    { input: "2025/12", expected: "2025-12-31" },
  ];

  for (const { input, expected } of months) {
    const parsed = parseCommand(
      ["goals", "update_due_date", "--goal-id", "g1", "--due-date", input],
      registry,
      fixtureCatalog.types,
    );

    assert.equal(parsed.kind, "endpoint");
    if (parsed.kind === "endpoint") {
      assert.equal((parsed.endpointInputs as any).due_date.date, expected, `Failed for ${input}`);
    }
  }
});

test("handles leap year February correctly", () => {
  const parsed = parseCommand(
    ["goals", "update_due_date", "--goal-id", "g1", "--due-date", "2024/02"],
    registry,
    fixtureCatalog.types,
  );

  assert.equal(parsed.kind, "endpoint");
  if (parsed.kind === "endpoint") {
    assert.equal((parsed.endpointInputs as any).due_date.date, "2024-02-29");
  }
});

test("handles non-leap year February correctly", () => {
  const parsed = parseCommand(
    ["goals", "update_due_date", "--goal-id", "g1", "--due-date", "2025/02"],
    registry,
    fixtureCatalog.types,
  );

  assert.equal(parsed.kind, "endpoint");
  if (parsed.kind === "endpoint") {
    assert.equal((parsed.endpointInputs as any).due_date.date, "2025-02-28");
  }
});

test("parses null value for nullable fields", () => {
  const parsed = parseCommand(
    ["goals", "update_due_date", "--goal-id", "g1", "--due-date", "null"],
    registry,
    fixtureCatalog.types,
  );

  assert.equal(parsed.kind, "endpoint");
  if (parsed.kind === "endpoint") {
    assert.strictEqual((parsed.endpointInputs as any).due_date, null);
  }
});

test("rejects null value for non-nullable fields", () => {
  assert.throws(
    () => {
      parseCommand(
        ["edit_project_name", "--project-id", "p1", "--name", "null"],
        registry,
        fixtureCatalog.types,
      );
    },
    (err: any) => err instanceof UsageError,
  );
});

test("rejects invalid year format", () => {
  assert.throws(
    () => {
      parseCommand(
        ["goals", "update_due_date", "--goal-id", "g1", "--due-date", "202a"],
        registry,
        fixtureCatalog.types,
      );
    },
    (err: any) => err instanceof UsageError && err.message.includes("contextual date"),
  );
});

test("rejects invalid quarter number", () => {
  assert.throws(
    () => {
      parseCommand(
        ["goals", "update_due_date", "--goal-id", "g1", "--due-date", "2025/q5"],
        registry,
        fixtureCatalog.types,
      );
    },
    (err: any) => err instanceof UsageError && err.message.includes("contextual date"),
  );
});

test("rejects invalid month number", () => {
  assert.throws(
    () => {
      parseCommand(
        ["goals", "update_due_date", "--goal-id", "g1", "--due-date", "2025/13"],
        registry,
        fixtureCatalog.types,
      );
    },
    (err: any) => err instanceof UsageError && err.message.includes("contextual date"),
  );
});

test("rejects invalid month format", () => {
  assert.throws(
    () => {
      parseCommand(
        ["goals", "update_due_date", "--goal-id", "g1", "--due-date", "2025/ab"],
        registry,
        fixtureCatalog.types,
      );
    },
    (err: any) => err instanceof UsageError && err.message.includes("contextual date"),
  );
});

test("rejects malformed quarter format", () => {
  assert.throws(
    () => {
      parseCommand(
        ["goals", "update_due_date", "--goal-id", "g1", "--due-date", "2025/q"],
        registry,
        fixtureCatalog.types,
      );
    },
    (err: any) => err instanceof UsageError && err.message.includes("contextual date"),
  );
});

test("rejects invalid ISO date", () => {
  assert.throws(
    () => {
      parseCommand(
        ["goals", "update_due_date", "--goal-id", "g1", "--due-date", "2025-13-01"],
        registry,
        fixtureCatalog.types,
      );
    },
    (err: any) => err instanceof UsageError && err.message.includes("contextual date"),
  );
});

test("rejects completely invalid format", () => {
  assert.throws(
    () => {
      parseCommand(
        ["goals", "update_due_date", "--goal-id", "g1", "--due-date", "invalid"],
        registry,
        fixtureCatalog.types,
      );
    },
    (err: any) => err instanceof UsageError && err.message.includes("contextual date"),
  );
});

test("case-insensitive quarter parsing", () => {
  const parsed = parseCommand(
    ["goals", "update_due_date", "--goal-id", "g1", "--due-date", "2025/Q1"],
    registry,
    fixtureCatalog.types,
  );

  assert.equal(parsed.kind, "endpoint");
  if (parsed.kind === "endpoint") {
    assert.equal((parsed.endpointInputs as any).due_date.date, "2025-03-31");
  }
});

test("case-insensitive caret in quarter format", () => {
  const parsed = parseCommand(
    ["goals", "update_due_date", "--goal-id", "g1", "--due-date", "2025/Q1^"],
    registry,
    fixtureCatalog.types,
  );

  assert.equal(parsed.kind, "endpoint");
  if (parsed.kind === "endpoint") {
    assert.equal((parsed.endpointInputs as any).due_date.date, "2025-01-01");
  }
});
