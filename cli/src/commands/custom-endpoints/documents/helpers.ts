import { UsageError } from "../../../core/parser-types";

export const EMPTY_RICH_TEXT = JSON.stringify({
  type: "doc",
  content: [],
});

export function readHubScopeInputs(endpointInputs: Record<string, unknown>): Record<string, string> {
  const inputs: Record<string, string> = {};
  for (const key of ["space_id", "project_id", "goal_id", "resource_hub_id", "folder_id"]) {
    const value = readOptionalString(endpointInputs[key], key);
    if (value) inputs[key] = value;
  }

  if ([inputs.space_id, inputs.project_id, inputs.goal_id].filter(Boolean).length > 1) {
    throw new UsageError("Provide exactly one of --space-id, --project-id, or --goal-id.");
  }
  if (Object.keys(inputs).length === 0) {
    throw new UsageError("One of --space-id, --project-id, --goal-id, --resource-hub-id, or --folder-id is required.");
  }
  return inputs;
}

function readOptionalString(value: unknown, fieldName: string): string | null {
  if (value === undefined) return null;
  if (typeof value === "string") return value;
  throw new UsageError(`Field '${fieldName}' must be a string.`);
}
