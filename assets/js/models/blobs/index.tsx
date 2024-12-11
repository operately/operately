import axios, { AxiosRequestConfig } from "axios";
import csrftoken from "@/utils/csrf_token";

import { createBlob } from "@/api";

export { useDownloadFile } from "./useDownloadFile";

type ProgressCallback = (number: number) => any;
type UploadResult = { id: string; url: string };
interface FileDimensions {
  width: number;
  height: number;
}

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

function findImageDimensions(imgFile: File): Promise<FileDimensions> {
  return new Promise((resolve, _) => {
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const image = new Image();
      image.onload = () => {
        resolve({ width: image.width, height: image.height });
      };
      image.src = readerEvent.target?.result as string;
    };

    reader.readAsDataURL(imgFile);
  });
}
