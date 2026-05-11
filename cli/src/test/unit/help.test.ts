import { test } from "node:test";
import * as assert from "node:assert";
import { printAuthCommandHelp, printEndpointHelp } from "../../commands/help";
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

test("prints hybrid signup help with flag-driven guidance", () => {
  const output = captureHelpOutput(() => {
    printAuthCommandHelp("signup");
  });

  assert.ok(output.includes("operately auth signup [--method <email-password|google>]"));
  assert.ok(output.includes("--next-step <create-company|join|later>"));
  assert.ok(output.includes("Hybrid flow: run 'operately auth signup' with no extra flags"));
  assert.ok(output.includes("Missing values are still asked interactively."));
  assert.ok(output.includes("Google signup always requires browser confirmation."));
  assert.ok(output.includes("Email/password signup always sends a verification code that must be entered manually."));
  assert.ok(output.includes("All other signup prompts can be skipped with flags."));
  assert.ok(output.includes("--password <password>             (email/password signup only; skips password confirmation prompt)"));
  assert.ok(output.includes("operately auth signup --method google --next-step later"));
  assert.ok(output.includes("operately auth signup --method email-password --full-name \"New User\" --email newuser@example.com --password secret123456 --next-step create-company --company-name \"Acme Corp\" --profile team"));
});
