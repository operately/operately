import { UsageError } from "../../../core/parser-types";
import type { CustomEndpointExecutor } from "../types";
import { uploadCompanyFile } from "../uploads/company-file";
import { EMPTY_RICH_TEXT, readHubScopeInputs } from "./helpers";

export const executeDocumentsCreateFile: CustomEndpointExecutor = async (input, deps) => {
  const hubScope = readHubScopeInputs(input.endpointInputs);
  const filePath = readRequiredString(input.endpointInputs.file, "file");
  const folderId = readOptionalString(input.endpointInputs.folder_id, "folder_id");
  const name = readOptionalString(input.endpointInputs.name, "name");
  const description = readOptionalJsonString(input.endpointInputs.description, "description");
  const sendNotificationsToEveryone = readOptionalBoolean(
    input.endpointInputs.send_notifications_to_everyone,
    "send_notifications_to_everyone",
  );
  const subscriberIds = readOptionalStringList(input.endpointInputs.subscriber_ids, "subscriber_ids");

  const uploadedFile = await uploadCompanyFile(filePath, name, input, deps);

  const createInputs: Record<string, unknown> = {
    ...hubScope,
    files: [
      {
        blob_id: uploadedFile.blobId,
        preview_blob_id: uploadedFile.previewBlobId,
        name: uploadedFile.name,
        description: description ?? EMPTY_RICH_TEXT,
      },
    ],
  };

  if (folderId) {
    createInputs.folder_id = folderId;
  }

  if (sendNotificationsToEveryone !== undefined) {
    createInputs.send_notifications_to_everyone = sendNotificationsToEveryone;
  }

  if (subscriberIds) {
    createInputs.subscriber_ids = subscriberIds;
  }

  return deps.callExternalMutation({
    baseUrl: input.runtime.baseUrl,
    path: input.endpoint.path,
    inputs: createInputs,
    token: input.runtime.token,
    timeoutMs: input.runtime.timeoutMs,
    verbose: input.globalFlags.verbose,
  });
};

function readRequiredString(value: unknown, fieldName: string): string {
  if (typeof value === "string") return value;
  throw new UsageError(`Field '${fieldName}' must be a string.`);
}

function readOptionalString(value: unknown, fieldName: string): string | null {
  if (value === undefined) return null;
  if (typeof value === "string") return value;
  throw new UsageError(`Field '${fieldName}' must be a string.`);
}

function readOptionalJsonString(value: unknown, fieldName: string): string | null {
  if (value === undefined) return null;
  if (typeof value === "string") return value;
  throw new UsageError(`Field '${fieldName}' must be a string.`);
}

function readOptionalBoolean(value: unknown, fieldName: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  throw new UsageError(`Field '${fieldName}' must be a boolean.`);
}

function readOptionalStringList(value: unknown, fieldName: string): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new UsageError(`Field '${fieldName}' must be a list of strings.`);
  }

  return value;
}
