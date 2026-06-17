import fs from "node:fs";
import { callExternalMutation } from "../../core/external-http";
import { callEndpoint } from "../../core/http";
import { inferMimeType } from "../../core/uploads/file-metadata";
import { uploadToSignedUrl } from "../../core/uploads/signed-url";
import type { CatalogEndpoint } from "../../types/catalog";
import { executeDocsAndFilesCreateFile } from "./docs_and_files/create_file";
import { executePeopleUpdatePicture } from "./people/update-picture";
import type { CustomEndpointDeps, CustomEndpointExecutionInput, CustomEndpointExecutor } from "./types";

const CUSTOM_ENDPOINT_EXECUTORS: Record<string, CustomEndpointExecutor> = {
  "docs_and_files/create_file": executeDocsAndFilesCreateFile,
  "people/update_picture": executePeopleUpdatePicture,
};

const CUSTOM_ENDPOINTS: CatalogEndpoint[] = [
  {
    full_name: "docs_and_files/create_file",
    namespace: "docs_and_files",
    name: "create_file",
    type: "mutation",
    method: "POST",
    path: "/api/external/v1/docs_and_files/create_file",
    handler: "OperatelyWeb.Api.Wrappers.DocsAndFiles.CreateFile",
    inputs: [
      {
        name: "resource_hub_id",
        type: { kind: "named", name: "id" },
        optional: false,
        nullable: false,
        has_default: false,
        default: null,
      },
      {
        name: "file",
        type: { kind: "named", name: "path" },
        optional: false,
        nullable: false,
        has_default: false,
        default: null,
      },
      {
        name: "folder_id",
        type: { kind: "named", name: "id" },
        optional: true,
        nullable: false,
        has_default: false,
        default: null,
      },
      {
        name: "name",
        type: { kind: "named", name: "string" },
        optional: true,
        nullable: false,
        has_default: false,
        default: null,
      },
      {
        name: "description",
        type: { kind: "named", name: "json" },
        optional: true,
        nullable: false,
        has_default: false,
        default: null,
      },
      {
        name: "send_notifications_to_everyone",
        type: { kind: "named", name: "boolean" },
        optional: true,
        nullable: false,
        has_default: false,
        default: null,
      },
      {
        name: "subscriber_ids",
        type: { kind: "list", item: { kind: "named", name: "id" } },
        optional: true,
        nullable: false,
        has_default: false,
        default: null,
      },
    ],
    outputs: [],
    docstring: "Uploads one local file into a resource hub and creates the corresponding file record.",
    execution_mode: "custom",
    example_mode: "cli",
    cli_examples: [
      "operately docs_and_files create_file --resource-hub-id rh_123 --file ./report.png",
      "operately docs_and_files create_file --resource-hub-id rh_123 --file ./report.png --name Q2-report --description-file ./notes.md",
    ],
  },
  {
    full_name: "people/update_picture",
    namespace: "people",
    name: "update_picture",
    type: "mutation",
    method: "POST",
    path: "/api/external/v1/people/update_picture",
    handler: "OperatelyWeb.Api.People.UpdatePicture",
    inputs: [
      {
        name: "avatar_file",
        type: { kind: "named", name: "path" },
        optional: true,
        nullable: false,
        has_default: false,
        default: null,
      },
      {
        name: "clear",
        type: { kind: "named", name: "boolean" },
        optional: true,
        nullable: false,
        has_default: false,
        default: null,
      },
    ],
    outputs: [],
    docstring: "Updates the authenticated user's profile picture using a local file path or clears the current picture.",
    execution_mode: "custom",
    example_mode: "cli",
    cli_examples: [
      "operately people update_picture --avatar-file ./avatar.png",
      "operately people update_picture --clear",
    ],
  },
];

const DEFAULT_DEPS: CustomEndpointDeps = {
  callEndpoint,
  callExternalMutation: ({ baseUrl, path, inputs, token, timeoutMs, verbose }) =>
    callExternalMutation(baseUrl, path, inputs, token, timeoutMs, verbose),
  uploadToSignedUrl,
  readFile: (filePath) => fs.readFileSync(filePath),
  statFile: (filePath) => fs.statSync(filePath),
  inferMimeType,
};

export function getCustomCatalogEndpoints(): CatalogEndpoint[] {
  return CUSTOM_ENDPOINTS.map((endpoint) => ({
    ...endpoint,
    inputs: endpoint.inputs.map((field) => ({ ...field })),
    outputs: endpoint.outputs.map((field) => ({ ...field })),
    cli_examples: endpoint.cli_examples ? [...endpoint.cli_examples] : [],
  }));
}

export function validateCustomEndpointImplementations(endpoints: CatalogEndpoint[] = CUSTOM_ENDPOINTS): void {
  const missing = endpoints
    .filter((endpoint) => endpoint.execution_mode === "custom")
    .filter((endpoint) => !CUSTOM_ENDPOINT_EXECUTORS[endpoint.full_name])
    .map((endpoint) => endpoint.full_name);

  if (missing.length > 0) {
    throw new Error(`Missing custom CLI implementation for endpoint(s): ${missing.join(", ")}`);
  }
}

export async function executeCustomEndpointCommand(
  input: CustomEndpointExecutionInput,
  deps: Partial<CustomEndpointDeps> = {},
): Promise<unknown> {
  const executor = CUSTOM_ENDPOINT_EXECUTORS[input.endpoint.full_name];

  if (!executor) {
    throw new Error(`No custom CLI implementation registered for endpoint '${input.endpoint.full_name}'.`);
  }

  return executor(input, { ...DEFAULT_DEPS, ...deps });
}
