import axios from "axios";

import csrftoken from "@/utils/csrf_token";
import { CreateBlob } from "@/graphql/Blobs";

export type UploadResponse = {
  data: {
    path: string;
  };
};

export interface FileUploader {
  upload: (file: File) => Promise<UploadResponse>;
}

export class MultipartFileUpoader implements FileUploader {
  async upload(file: File): Promise<UploadResponse> {
    const blob = await CreateBlob({ filename: file.name });
    const signedUploadUrl = blob.data.createBlob.signedUploadUrl;

    return this.uploadFile(file, signedUploadUrl);
  }

  private uploadFile(file: File, signedUploadUrl: string): Promise<UploadResponse> {
    const form = new FormData();
    const client = axios.create();

    form.append("file", file);

    client.defaults.headers.common["Content-Type"] = "multipart/form-data";
    client.defaults.headers.common["x-csrf-token"] = csrftoken();

    return client.post(signedUploadUrl, form);
  }
}
