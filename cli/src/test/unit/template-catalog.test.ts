import { test } from "node:test";
import * as assert from "node:assert";
import { createRegistry } from "../../commands/registry";
import type { Catalog } from "../../types/catalog";

function loadRealCatalog(): Catalog {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const catalogJson = require("../../generated/api-catalog.json");
  const intEnums: Record<string, number[]> = {};
  for (const [key, values] of Object.entries(catalogJson.types.int_enums || {})) {
    intEnums[key] = (values as string[]).map(Number);
  }

  return {
    ...catalogJson,
    types: {
      ...catalogJson.types,
      int_enums: intEnums,
    },
  } as Catalog;
}

test("generated project_templates catalog includes schemas without raw create_files", () => {
  const catalog = loadRealCatalog();
  const endpoints = catalog.endpoints.filter((endpoint) => endpoint.namespace === "project_templates");

  assert.equal(endpoints.length, 37);
  assert.equal(
    endpoints.some((endpoint) => endpoint.name === "create_files"),
    false,
  );

  const create = endpoints.find((endpoint) => endpoint.name === "create");
  assert.ok(create);
  assert.deepEqual(
    create.inputs.filter((field) => !field.optional).map((field) => field.name).sort(),
    ["name", "space_id"],
  );

  const createProject = endpoints.find((endpoint) => endpoint.name === "create_project");
  assert.ok(createProject);
  for (const required of ["template_id", "space_id", "start_date", "name"]) {
    assert.ok(createProject.inputs.some((field) => field.name === required && !field.optional));
  }

  const updateOrdering = endpoints.find((endpoint) => endpoint.name === "update_milestone_and_ordering");
  assert.ok(updateOrdering);
  assert.ok(updateOrdering.inputs.some((field) => field.name === "index" && !field.optional));

  const registry = createRegistry(catalog);
  assert.ok(registry.find(["project_templates", "create_file"]));
});
