import { AxiosRequestConfig } from "axios";
import csrftoken from "@/utils/csrf_token";
import { createSentryAxiosClient } from "@/utils/axiosErrorReporting";
import { showErrorToast } from "turboui";
import { formatStorageBytes } from "turboui/CompanyBilling";

import type { BlobCreationInput, BlobCreationOutput } from "@/api";
import { createFileBlobs, createAvatarBlobs, createImportArtifactBlobs, confirmBlobUpload } from "./blobLifecycle";
import { extractLimitError } from "@/models/billing/limitError";
import { findImageDimensions, findVideoDimensions } from "./utils";

type ProgressCallback = (number: number) => any;
type UploadResult = { id: string; url: string };

export async function uploadFile(file: File, progressCallback: ProgressCallback): Promise<UploadResult> {
  return uploadWithCreator(file, progressCallback, createFileBlobs);
}

export async function uploadAvatarFile(file: File, progressCallback: ProgressCallback): Promise<UploadResult> {
  return uploadWithCreator(file, progressCallback, createAvatarBlobs);
}

export async function uploadImportArtifactFile(file: File, progressCallback: ProgressCallback): Promise<UploadResult> {
  return uploadWithCreator(file, progressCallback, createImportArtifactBlobs);
}

async function uploadWithCreator(
  file: File,
  progressCallback: ProgressCallback,
  createFn: (input: { files: BlobCreationInput[] }) => Promise<{ blobs?: BlobCreationOutput[] | null }>,
): Promise<UploadResult> {
  let dimensions = {};
  const attrs = {
    filename: file.name,
    size: file.size,
    contentType: file.type,
  };

  if (file.type.includes("image")) {
    dimensions = await findImageDimensions(file);
  } else if (file.type.includes("video")) {
    dimensions = await findVideoDimensions(file);
  }

  let res: { blobs?: BlobCreationOutput[] | null };

  try {
    res = await createFn({ files: [{ ...attrs, ...dimensions }] });
  } catch (error) {
    const limitError = extractLimitError(error);
    const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;

    if (limitError?.code === "storage_limit_exceeded") {
      showErrorToast(
        "Storage limit reached",
        message ||
          `This company has reached its storage limit: ${formatStorageBytes(limitError.currentUsage)} of ${formatStorageBytes(limitError.limit)} used. Uploading files is blocked until this company is back within its plan limits.`,
      );
    }

    throw error;
  }

  const blob = res.blobs?.[0];
  if (!blob?.id || !blob.signedUploadUrl || !blob.url) {
    throw new Error("Created blob is missing its id or upload URLs");
  }
  const url = blob.signedUploadUrl;

  if (blob.uploadStrategy === "direct") {
    await directUpload(file, url, progressCallback);
  } else {
    await multipartUpload(file, url, progressCallback);
  }

  const confirmation = await confirmBlobUpload({ blobId: blob.id });
  if (!confirmation.blob?.id) throw new Error("Failed to confirm blob upload");

  return { id: blob.id, url: blob.url };
}

async function directUpload(file: File, url: string, progressCallback: ProgressCallback) {
  const client = createSentryAxiosClient();

  const config = {
    headers: {
      "Content-Type": file.type,
      "Content-Length": file.size,
    },
    onUploadProgress: (progressEvent: any) => {
      progressCallback(Math.round((progressEvent.loaded * 100) / progressEvent.total));
    },
  };

  await client.put(url, file, config);
}

async function multipartUpload(file: File, url: string, progressCallback: ProgressCallback) {
  const client = createSentryAxiosClient();

  const config: AxiosRequestConfig = {
    headers: {
      "Content-Type": "multipart/form-data",
      "x-csrf-token": csrftoken(),
    },
    onUploadProgress: (progressEvent: any) => {
      progressCallback(Math.round((progressEvent.loaded * 100) / progressEvent.total));
    },
  };

  const formData = new FormData();
  formData.append("file", file);

  await client.put(url, formData, config);
}
