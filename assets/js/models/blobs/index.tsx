import axios, { AxiosRequestConfig } from "axios";
import csrftoken from "@/utils/csrf_token";

import { createBlob } from "@/api";

type ProgressCallback = (number: number) => any;
type UploadResult = { id: string; url: string };

export async function uploadFile(file: File, progressCallback: ProgressCallback): Promise<UploadResult> {
  try {
    const blob = await createBlob({ filename: file.name });

    const client = axios.create();
    const config = axiosConfig(progressCallback);

    const form = new FormData();
    form.append("file", file);

    await client.post(blob.signedUploadUrl!, form, config);
    return { id: blob.id!, url: blob.url! };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error(`Error uploading file: ${error.message}`);
  }
}

function axiosConfig(progressCallback: ProgressCallback): AxiosRequestConfig {
  return {
    headers: {
      "Content-Type": "multipart/form-data",
      "x-csrf-token": csrftoken(),
    },
    onUploadProgress: (progressEvent: any) => {
      progressCallback(Math.round((progressEvent.loaded * 100) / progressEvent.total));
    },
  };
}
