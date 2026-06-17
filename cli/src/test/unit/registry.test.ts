import { test } from "node:test";
import * as assert from "node:assert";
import { createRegistry } from "../../commands/registry";
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

test("custom catalog commands are still normal registry endpoints", () => {
  const registry = createRegistry(fixtureCatalog);
  const pictureEndpoint = registry.find(["people", "update_picture"]);
  const fileEndpoint = registry.find(["docs_and_files", "create_file"]);

  assert.ok(pictureEndpoint);
  assert.ok(fileEndpoint);
  assert.equal(pictureEndpoint?.full_name, "people/update_picture");
  assert.equal(fileEndpoint?.full_name, "docs_and_files/create_file");
});

test("throws when generated catalog and custom endpoints share a command", () => {
  const catalogWithDuplicate = {
    ...fixtureCatalog,
    endpoints: [
      ...fixtureCatalog.endpoints,
      {
        full_name: "docs_and_files/create_file",
        namespace: "docs_and_files",
        name: "create_file",
        type: "mutation" as const,
        method: "POST" as const,
        path: "/api/external/v1/docs_and_files/create_file",
        handler: "OperatelyWeb.Api.Wrappers.DocsAndFiles.CreateFile",
        inputs: [],
        outputs: [],
        docstring: "Generated catalog entry",
      },
    ],
  };

  assert.throws(
    () => createRegistry(catalogWithDuplicate),
    /Duplicate command mapping detected for 'docs_and_files create_file'/,
  );
});
