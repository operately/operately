import { test } from "node:test";
import * as assert from "node:assert";
import { printEndpointHelp } from "../../commands/help";
import type { CatalogEndpoint } from "../../types/catalog";
import { fixtureCatalog } from "./fixture-catalog";

function findEndpoint(fullName: string): CatalogEndpoint {
  const endpoint = fixtureCatalog.endpoints.find((candidate) => candidate.full_name === fullName);

  assert.ok(endpoint, `Expected fixture endpoint '${fullName}' to exist.`);
  return endpoint;
}

function captureHelpOutput(fn: () => void): string {
  const originalLog = console.log;
  const messages: string[] = [];

  console.log = (message?: unknown) => {
    messages.push(String(message));
  };

  try {
    fn();
  } finally {
    console.log = originalLog;
  }

  return messages.join("\n");
}

test("prints flat input flags and appends include guidance at the end", () => {
  const output = captureHelpOutput(() => {
    printEndpointHelp(findEndpoint("projects/get"), "projects get");
  });

  const inputFlagsIndex = output.indexOf("Input flags:");
  const includeBehaviorIndex = output.indexOf("Include flag behavior:");
  const includedResourcesIndex = output.indexOf("Included resources for this endpoint:");

  assert.ok(inputFlagsIndex >= 0);
  assert.ok(includeBehaviorIndex > inputFlagsIndex);
  assert.ok(includedResourcesIndex > includeBehaviorIndex);
  assert.ok(output.includes("These flags request extra data in the response."));
  assert.ok(output.includes("If omitted, that data is not returned."));
  assert.ok(output.includes("This does not mean the data does not exist; it simply was not preloaded."));
  assert.ok(output.includes("--id <id> (required)"));
  assert.ok(output.includes("--include-milestones <boolean> (optional, nullable)"));
  assert.ok(output.includes("--include-contributors <boolean> (optional, nullable)"));
  assert.ok(output.includes("--include-markdown <boolean> (optional)"));
  assert.ok(output.includes("--preview <boolean> (optional)"));
  assert.ok(output.includes("Included resources for this endpoint:"));
  assert.ok(output.includes("    - milestones"));
  assert.ok(output.includes("    - contributors"));
  assert.ok(output.includes("    - markdown"));
  assert.ok(!output.includes("Required flags:"));
  assert.ok(!output.includes("Optional flags:"));
  assert.ok(!output.includes("Include flags:"));
  assert.ok(output.trim().endsWith("    - markdown"));
});

test("omits include guidance when an endpoint has no include flags", () => {
  const output = captureHelpOutput(() => {
    printEndpointHelp(findEndpoint("edit_project_name"), "edit_project_name");
  });

  assert.ok(output.includes("Input flags:"));
  assert.ok(output.includes("--project-id <id> (required)"));
  assert.ok(!output.includes("Include flag behavior:"));
  assert.ok(!output.includes("Included resources for this endpoint:"));
});

test("prints companion file flags for markdown input fields", () => {
  const output = captureHelpOutput(() => {
    printEndpointHelp(findEndpoint("projects/update_description"), "projects update_description");
  });

  assert.ok(output.includes("--description <markdown> (required)"));
  assert.ok(output.includes("--description-file <path> (optional, alternative to --description)"));
  assert.ok(output.includes("File input: use --<field>-file <path> to load markdown from a file"));
});
