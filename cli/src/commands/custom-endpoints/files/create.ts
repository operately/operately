import path from "node:path";
import { UsageError } from "../../../core/parser-types";
import { generateImagePreview, readImageMetadata } from "../../../core/uploads/image-preview";
import { isImageContentType } from "../../../core/uploads/file-metadata";
import type { CustomEndpointDeps, CustomEndpointExecutor } from "../types";
import { buildStoredFileName, EMPTY_RICH_TEXT } from "./helpers";

const CREATE_BLOB_PATH = "/create_blob";
const MARK_BLOB_UPLOADED_PATH = "/mark_blob_uploaded";

interface BlobCreationOutput {
  id?: string;
  url?: string;
  signed_upload_url?: string;
  upload_strategy?: string;
}

interface UploadableBlob {
  id: string;
  signed_upload_url: string;
  upload_strategy: string;
}

interface CreateBlobResponse {
  blobs?: BlobCreationOutput[];
}

export const executeFilesCreate: CustomEndpointExecutor = async (input, deps) => {
  const resourceHubId = readRequiredString(input.endpointInputs.resource_hub_id, "resource_hub_id");
  const filePath = readRequiredString(input.endpointInputs.file, "file");
  const folderId = readOptionalString(input.endpointInputs.folder_id, "folder_id");
  const name = readOptionalString(input.endpointInputs.name, "name");
  const description = readOptionalJsonString(input.endpointInputs.description, "description");
  const sendNotificationsToEveryone = readOptionalBoolean(
    input.endpointInputs.send_notifications_to_everyone,
    "send_notifications_to_everyone",
  );
  const subscriberIds = readOptionalStringList(input.endpointInputs.subscriber_ids, "subscriber_ids");

  const fileBytes = readLocalFile(filePath, deps);
  const stat = readLocalFileStat(filePath, deps);
  const contentType = deps.inferMimeType(filePath);

  const blobInputs: Array<Record<string, unknown>> = [
    {
      filename: path.basename(filePath),
      size: stat.size,
      content_type: contentType,
    },
  ];

  let previewUpload:
    | {
        fileBytes: Buffer;
        fileName: string;
        contentType: string;
        width: number;
        height: number;
      }
    | null = null;

  if (isImageContentType(contentType)) {
    const dimensions = await readImageMetadata(fileBytes, filePath);
    blobInputs[0] = {
      ...blobInputs[0],
      width: dimensions.width,
      height: dimensions.height,
    };

    previewUpload = await generateImagePreview(fileBytes, filePath);
    blobInputs.push({
      filename: previewUpload.fileName,
      size: previewUpload.fileBytes.byteLength,
      content_type: previewUpload.contentType,
      width: previewUpload.width,
      height: previewUpload.height,
    });
  }

  const blobResponse = (await deps.callExternalMutation({
    baseUrl: input.runtime.baseUrl,
    path: CREATE_BLOB_PATH,
    inputs: { files: blobInputs },
    token: input.runtime.token,
    timeoutMs: input.runtime.timeoutMs,
    verbose: input.globalFlags.verbose,
  })) as CreateBlobResponse;

  const mainBlob = requireBlob(blobResponse.blobs?.[0], "main file");

  let previewBlob: UploadableBlob | undefined;
  if (previewUpload) {
    previewBlob = requireBlob(blobResponse.blobs?.[1], "preview file");
  }

  await deps.uploadToSignedUrl({
    filePath,
    fileBytes,
    signedUploadUrl: mainBlob.signed_upload_url,
    uploadStrategy: mainBlob.upload_strategy,
    contentType,
    timeoutMs: input.runtime.timeoutMs,
    verbose: input.globalFlags.verbose,
  });

  await markBlobUploaded(mainBlob.id, input, deps);

  if (previewUpload && previewBlob) {
    await deps.uploadToSignedUrl({
      filePath: previewUpload.fileName,
      fileBytes: previewUpload.fileBytes,
      signedUploadUrl: previewBlob.signed_upload_url,
      uploadStrategy: previewBlob.upload_strategy,
      contentType: previewUpload.contentType,
      timeoutMs: input.runtime.timeoutMs,
      verbose: input.globalFlags.verbose,
    });

    await markBlobUploaded(previewBlob.id, input, deps);
  }

  const createInputs: Record<string, unknown> = {
    resource_hub_id: resourceHubId,
    files: [
      {
        blob_id: mainBlob.id,
        preview_blob_id: previewBlob?.id ?? null,
        name: buildStoredFileName(filePath, name),
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

async function markBlobUploaded(blobId: string, input: Parameters<CustomEndpointExecutor>[0], deps: CustomEndpointDeps) {
  await deps.callExternalMutation({
    baseUrl: input.runtime.baseUrl,
    path: MARK_BLOB_UPLOADED_PATH,
    inputs: { blob_id: blobId },
    token: input.runtime.token,
    timeoutMs: input.runtime.timeoutMs,
    verbose: input.globalFlags.verbose,
  });
}

function requireBlob(blob: BlobCreationOutput | undefined, label: string): UploadableBlob {
  if (!blob?.id || !blob.signed_upload_url || !blob.upload_strategy) {
    throw new Error(`Failed to create a blob for the ${label}.`);
  }

  return {
    id: blob.id,
    signed_upload_url: blob.signed_upload_url,
    upload_strategy: blob.upload_strategy,
  };
}

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

function readLocalFile(filePath: string, deps: CustomEndpointDeps): Buffer {
  try {
    return deps.readFile(filePath);
  } catch (error) {
    throw new UsageError(`Failed to read file for '--file': ${error instanceof Error ? error.message : String(error)}`);
  }
}

function readLocalFileStat(filePath: string, deps: CustomEndpointDeps) {
  try {
    return deps.statFile(filePath);
  } catch (error) {
    throw new UsageError(`Failed to inspect file for '--file': ${error instanceof Error ? error.message : String(error)}`);
  }
}
