import path from "node:path";
import { UsageError } from "../../../core/parser-types";

export const EMPTY_RICH_TEXT = JSON.stringify({
  type: "doc",
  content: [],
});

export function buildStoredFileName(filePath: string, overrideName: string | null): string {
  const fileName = path.basename(filePath);

  if (!overrideName) {
    return fileName;
  }

  const extension = path.extname(fileName);
  if (!extension) {
    return overrideName;
  }

  return `${overrideName}${extension}`;
}

export function readHubScopeInputs(endpointInputs: Record<string, unknown>): Record<string, string> {
  const spaceId = readOptionalString(endpointInputs.space_id, "space_id");
  const projectId = readOptionalString(endpointInputs.project_id, "project_id");

  if (spaceId && projectId) {
    throw new UsageError("Provide either --space-id or --project-id, not both.");
  }

  if (!spaceId && !projectId) {
    throw new UsageError("Either --space-id or --project-id is required.");
  }

  if (spaceId) {
    return { space_id: spaceId };
  }

  return { project_id: projectId! };
}

function readOptionalString(value: unknown, fieldName: string): string | null {
  if (value === undefined) return null;
  if (typeof value === "string") return value;
  throw new UsageError(`Field '${fieldName}' must be a string.`);
}
