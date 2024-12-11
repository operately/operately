import axios, { AxiosRequestConfig } from "axios";
import csrftoken from "@/utils/csrf_token";

import { createBlob } from "@/api";
import { findImageDimensions } from "./utils";

export { useDownloadFile } from "./useDownloadFile";
export { resizeImage, findFileSize } from "./utils";

type ProgressCallback = (number: number) => any;
type UploadResult = { id: string; url: string };

export async function uploadFile(file: File, progressCallback: ProgressCallback): Promise<UploadResult> {
  let blob;
  const attrs = {
    filename: file.name,
    size: file.size,
    contentType: file.type,
  };

  if (file.type.includes("image")) {
    const dimensions = await findImageDimensions(file);
    blob = await createBlob({ ...attrs, ...dimensions });
  } else {
    blob = await createBlob(attrs);
  }

  const url = blob.signedUploadUrl!;

  if (blob.uploadStrategy === "direct") {
    await directUpload(file, url, progressCallback);
  } else {
    await multipartUpload(file, url, progressCallback);
  }

  return { id: blob.id!, url: blob.url! };
}

async function directUpload(file: File, url: string, progressCallback: ProgressCallback) {
  const client = axios.create();

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
  const client = axios.create();

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
