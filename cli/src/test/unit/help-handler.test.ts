import { test } from "node:test";
import * as assert from "node:assert";
import { createRegistry } from "../../commands/registry";
import { handleHelpRequest, resolveHelpRequest } from "../../commands/help-handler";
import { fixtureCatalog } from "./fixture-catalog";

test("resolves general help for empty argv", () => {
  const registry = createRegistry(fixtureCatalog);
  const request = resolveHelpRequest([], registry);

  assert.deepEqual(request, { kind: "general" });
});

test("resolves general help for --help", () => {
  const registry = createRegistry(fixtureCatalog);
  const request = resolveHelpRequest(["--help"], registry);

  assert.deepEqual(request, { kind: "general" });
});

test("resolves auth overview help", () => {
  const registry = createRegistry(fixtureCatalog);

  assert.deepEqual(resolveHelpRequest(["auth"], registry), { kind: "auth-overview" });
  assert.deepEqual(resolveHelpRequest(["help", "auth"], registry), { kind: "auth-overview" });
});

test("resolves auth login help from inline --help", () => {
  const registry = createRegistry(fixtureCatalog);
  const request = resolveHelpRequest(["auth", "login", "--help"], registry);

  assert.deepEqual(request, { kind: "auth-command", action: "login" });
});

test("resolves auth whoami help from inline --help", () => {
  const registry = createRegistry(fixtureCatalog);
  const request = resolveHelpRequest(["auth", "whoami", "--help"], registry);

  assert.deepEqual(request, { kind: "auth-command", action: "whoami" });
});

test("resolves auth create-company help from inline --help", () => {
  const registry = createRegistry(fixtureCatalog);
  const request = resolveHelpRequest(["auth", "create-company", "--help"], registry);

  assert.deepEqual(request, { kind: "auth-command", action: "create-company" });
});

test("resolves auth profiles help from inline --help", () => {
  const registry = createRegistry(fixtureCatalog);
  const request = resolveHelpRequest(["auth", "profiles", "--help"], registry);

  assert.deepEqual(request, { kind: "auth-command", action: "profiles" });
});

test("resolves auth whoami help from help command", () => {
  const registry = createRegistry(fixtureCatalog);
  const request = resolveHelpRequest(["help", "auth", "whoami"], registry);

  assert.deepEqual(request, { kind: "auth-command", action: "whoami" });
});

test("resolves auth create-company help from help command", () => {
  const registry = createRegistry(fixtureCatalog);
  const request = resolveHelpRequest(["help", "auth", "create-company"], registry);

  assert.deepEqual(request, { kind: "auth-command", action: "create-company" });
});

test("resolves auth profiles help from help command", () => {
  const registry = createRegistry(fixtureCatalog);
  const request = resolveHelpRequest(["help", "auth", "profiles"], registry);

  assert.deepEqual(request, { kind: "auth-command", action: "profiles" });
});

test("resolves auth login help from trailing help", () => {
  const registry = createRegistry(fixtureCatalog);
  const request = resolveHelpRequest(["auth", "login", "help"], registry);

  assert.deepEqual(request, { kind: "auth-command", action: "login" });
});

test("resolves namespace help", () => {
  const registry = createRegistry(fixtureCatalog);
  const request = resolveHelpRequest(["goals"], registry);

  assert.deepEqual(request, { kind: "namespace", namespace: "goals" });
});

test("resolves endpoint help", () => {
  const registry = createRegistry(fixtureCatalog);
  const request = resolveHelpRequest(["help", "goals", "update_due_date"], registry);

  assert.ok(request);
  assert.equal(request.kind, "endpoint");
  if (request.kind === "endpoint") {
    assert.equal(request.endpoint.full_name, "goals/update_due_date");
  }
});

test("resolves custom endpoint help from help command", () => {
  const registry = createRegistry(fixtureCatalog);
  const request = resolveHelpRequest(["help", "people", "update_picture"], registry);

  assert.ok(request);
  assert.equal(request.kind, "endpoint");
  if (request.kind === "endpoint") {
    assert.equal(request.endpoint.full_name, "people/update_picture");
  }
});

test("resolves custom endpoint help from trailing help", () => {
  const registry = createRegistry(fixtureCatalog);
  const request = resolveHelpRequest(["people", "update_picture", "help"], registry);

  assert.ok(request);
  assert.equal(request.kind, "endpoint");
  if (request.kind === "endpoint") {
    assert.equal(request.endpoint.full_name, "people/update_picture");
  }
});

test("resolves docs_and_files create_file custom endpoint help", () => {
  const registry = createRegistry(fixtureCatalog);
  const request = resolveHelpRequest(["help", "docs_and_files", "create_file"], registry);

  assert.ok(request);
  assert.equal(request.kind, "endpoint");
  if (request.kind === "endpoint") {
    assert.equal(request.endpoint.full_name, "docs_and_files/create_file");
  }
});

test("returns null for executable commands", () => {
  const registry = createRegistry(fixtureCatalog);
  const request = resolveHelpRequest(["auth", "whoami"], registry);

  assert.equal(request, null);
});

test("returns exit code 2 for unknown help target", () => {
  const registry = createRegistry(fixtureCatalog);
  const originalError = console.error;
  const errors: string[] = [];

  console.error = (message?: unknown) => {
    errors.push(String(message));
  };

  try {
    const exitCode = handleHelpRequest({
      argv: ["help", "auth", "invalid"],
      registry,
      types: fixtureCatalog.types,
      namespaceDescriptions: {},
    });

    assert.equal(exitCode, 2);
    assert.deepEqual(errors, ["Unknown command 'auth invalid'."]);
  } finally {
    console.error = originalError;
  }
});
