import { UsageError } from "../../../core/parser-types";
import type { CustomEndpointExecutor } from "../types";
import { uploadCompanyFile } from "../uploads/company-file";

const EMPTY_RICH_TEXT = JSON.stringify({
  type: "doc",
  content: [],
});

export const executeProjectTemplatesCreateFile: CustomEndpointExecutor = async (input, deps) => {
  const templateId = readRequiredString(input.endpointInputs.template_id, "template_id");
  const parentFolderId = readOptionalString(input.endpointInputs.parent_folder_id, "parent_folder_id");
  const filePath = readRequiredString(input.endpointInputs.file, "file");
  const name = readOptionalString(input.endpointInputs.name, "name");
  const description = readOptionalString(input.endpointInputs.description, "description");

  const uploadedFile = await uploadCompanyFile(filePath, name, input, deps);
  const createInputs: Record<string, unknown> = {
    template_id: templateId,
    files: [
      {
        blob_id: uploadedFile.blobId,
        preview_blob_id: uploadedFile.previewBlobId,
        name: uploadedFile.name,
        description: description ?? EMPTY_RICH_TEXT,
      },
    ],
  };

  if (parentFolderId) {
    createInputs.parent_folder_id = parentFolderId;
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
