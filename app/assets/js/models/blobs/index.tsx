import { AxiosRequestConfig } from "axios";
import csrftoken from "@/utils/csrf_token";
import { createSentryAxiosClient } from "@/utils/axiosErrorReporting";
import { showErrorToast } from "turboui";

import Api, { BlobCreationInput, BlobCreationOutput, createBlob, createAvatarBlob, markBlobUploaded } from "@/api";
import { extractLimitError } from "@/models/billing/limitError";
import { findImageDimensions, findVideoDimensions } from "./utils";

export { useDownloadFile } from "./useDownloadFile";
export { resizeImage, findFileSize } from "./utils";

type ProgressCallback = (number: number) => any;
type UploadResult = { id: string; url: string };

export async function uploadFile(file: File, progressCallback: ProgressCallback): Promise<UploadResult> {
  return uploadWithCreator(file, progressCallback, createBlob);
}

export async function uploadAvatarFile(file: File, progressCallback: ProgressCallback): Promise<UploadResult> {
  return uploadWithCreator(file, progressCallback, createAvatarBlob);
}

export async function uploadImportArtifactFile(file: File, progressCallback: ProgressCallback): Promise<UploadResult> {
  return uploadWithCreator(file, progressCallback, Api.company_transfers.createImportArtifactBlobs);
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
      showErrorToast("Storage limit reached", message || "This company has reached its storage limit. Upgrade the plan to add more files.");
    }

    throw error;
  }

  if (!res.blobs || res.blobs!.length === 0) {
    throw Error("Failed to create blobs");
  }

  const blob = res.blobs[0]!;
  const url = blob.signedUploadUrl!;

  if (blob.uploadStrategy === "direct") {
    await directUpload(file, url, progressCallback);
  } else {
    await multipartUpload(file, url, progressCallback);
  }

  await markBlobUploaded({ blobId: blob.id! });

  return { id: blob.id!, url: blob.url! };
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
