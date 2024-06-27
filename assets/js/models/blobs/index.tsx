import axios, { AxiosRequestConfig } from "axios";
import csrftoken from "@/utils/csrf_token";

import { createBlob } from "@/api";

type ProgressCallback = (number: number) => any;
type UploadResult = { id: string; url: string };

export async function uploadFile(file: File, progressCallback: ProgressCallback): Promise<UploadResult> {
  const blob = await createBlob({
    filename: file.name,
    size: file.size,
    contentType: file.type,
  });

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
      "x-csrf-token": csrftoken(),
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
