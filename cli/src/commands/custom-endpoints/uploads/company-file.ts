import path from "node:path";
import { UsageError } from "../../../core/parser-types";
import { generateImagePreview, readImageMetadata } from "../../../core/uploads/image-preview";
import { isImageContentType } from "../../../core/uploads/file-metadata";
import type { CustomEndpointDeps, CustomEndpointExecutionInput } from "../types";

const CREATE_BLOB_PATH = "/create_blob";
const MARK_BLOB_UPLOADED_PATH = "/mark_blob_uploaded";

interface BlobCreationOutput {
  id?: string;
  signed_upload_url?: string;
  upload_strategy?: string;
}

interface UploadableBlob {
  id: string;
  signedUploadUrl: string;
  uploadStrategy: string;
}

interface CreateBlobResponse {
  blobs?: BlobCreationOutput[];
}

export interface UploadedCompanyFile {
  blobId: string;
  previewBlobId: string | null;
  name: string;
}

export async function uploadCompanyFile(
  filePath: string,
  nameOverride: string | null,
  input: CustomEndpointExecutionInput,
  deps: CustomEndpointDeps,
): Promise<UploadedCompanyFile> {
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

  const previewUpload = await prepareImagePreview(filePath, fileBytes, contentType, blobInputs);
  const blobs = await createBlobs(blobInputs, input, deps);
  const mainBlob = requireBlob(blobs[0], "main file");
  const previewBlob = previewUpload ? requireBlob(blobs[1], "preview file") : null;

  await uploadBlob(mainBlob, filePath, fileBytes, contentType, input, deps);

  if (previewUpload && previewBlob) {
    await uploadBlob(
      previewBlob,
      previewUpload.fileName,
      previewUpload.fileBytes,
      previewUpload.contentType,
      input,
      deps,
    );
  }

  await markBlobUploaded(mainBlob.id, input, deps);

  if (previewBlob) {
    await markBlobUploaded(previewBlob.id, input, deps);
  }

  return {
    blobId: mainBlob.id,
    previewBlobId: previewBlob?.id ?? null,
    name: buildStoredFileName(filePath, nameOverride),
  };
}

async function prepareImagePreview(
  filePath: string,
  fileBytes: Buffer,
  contentType: string,
  blobInputs: Array<Record<string, unknown>>,
) {
  if (!isImageContentType(contentType)) {
    return null;
  }

  const dimensions = await readImageMetadata(fileBytes, filePath);
  blobInputs[0] = {
    ...blobInputs[0],
    width: dimensions.width,
    height: dimensions.height,
  };

  const preview = await generateImagePreview(fileBytes, filePath);
  blobInputs.push({
    filename: preview.fileName,
    size: preview.fileBytes.byteLength,
    content_type: preview.contentType,
    width: preview.width,
    height: preview.height,
  });

  return preview;
}

async function createBlobs(
  blobInputs: Array<Record<string, unknown>>,
  input: CustomEndpointExecutionInput,
  deps: CustomEndpointDeps,
): Promise<BlobCreationOutput[]> {
  const response = (await deps.callExternalMutation({
    baseUrl: input.runtime.baseUrl,
    path: CREATE_BLOB_PATH,
    inputs: { files: blobInputs },
    token: input.runtime.token,
    timeoutMs: input.runtime.timeoutMs,
    verbose: input.globalFlags.verbose,
  })) as CreateBlobResponse;

  return response.blobs ?? [];
}

async function uploadBlob(
  blob: UploadableBlob,
  filePath: string,
  fileBytes: Buffer,
  contentType: string,
  input: CustomEndpointExecutionInput,
  deps: CustomEndpointDeps,
) {
  await deps.uploadToSignedUrl({
    filePath,
    fileBytes,
    signedUploadUrl: blob.signedUploadUrl,
    uploadStrategy: blob.uploadStrategy,
    contentType,
    timeoutMs: input.runtime.timeoutMs,
    verbose: input.globalFlags.verbose,
  });
}

async function markBlobUploaded(blobId: string, input: CustomEndpointExecutionInput, deps: CustomEndpointDeps) {
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
    signedUploadUrl: blob.signed_upload_url,
    uploadStrategy: blob.upload_strategy,
  };
}

function buildStoredFileName(filePath: string, overrideName: string | null): string {
  const fileName = path.basename(filePath);

  if (!overrideName) {
    return fileName;
  }

  const extension = path.extname(fileName);
  return extension ? `${overrideName}${extension}` : overrideName;
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
