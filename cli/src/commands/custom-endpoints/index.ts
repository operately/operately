import fs from "node:fs";
import { callExternalMutation } from "../../core/external-http";
import { callEndpoint } from "../../core/http";
import { uploadToSignedUrl } from "../../core/uploads/signed-url";
import type { CatalogEndpoint } from "../../types/catalog";
import { executePeopleUpdatePicture, inferMimeType } from "./people/update-picture";
import type { CustomEndpointDeps, CustomEndpointExecutionInput, CustomEndpointExecutor } from "./types";

const CUSTOM_ENDPOINT_EXECUTORS: Record<string, CustomEndpointExecutor> = {
  "people/update_picture": executePeopleUpdatePicture,
};

const CUSTOM_ENDPOINTS: CatalogEndpoint[] = [
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
