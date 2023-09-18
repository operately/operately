import axios from "axios";

import csrftoken from "@/utils/csrf_token";
import { CreateBlob } from "@/graphql/Blobs";

export interface FileUploader {
  upload: (file: File) => Promise<string>;
}

export class MultipartFileUpoader implements FileUploader {
  async upload(file: File): Promise<string> {
    const blob = await CreateBlob({ filename: file.name });
    const signedUploadUrl = blob.data.createBlob.signedUploadUrl;

    await this.uploadFile(file, signedUploadUrl);

    return blob.data.createBlob.url;
  }

  private uploadFile(file: File, signedUploadUrl: string): Promise<string> {
    const form = new FormData();
    const client = axios.create();

    form.append("file", file);

    client.defaults.headers.common["Content-Type"] = "multipart/form-data";
    client.defaults.headers.common["x-csrf-token"] = csrftoken();

    return client.post(signedUploadUrl, form);
  }
}
