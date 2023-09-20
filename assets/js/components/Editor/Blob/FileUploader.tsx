import axios from "axios";

import csrftoken from "@/utils/csrf_token";
import { CreateBlob } from "@/graphql/Blobs";

type ProgressCallback = (number: number) => any;

export interface FileUploader {
  upload: (file: File, progressCallback: ProgressCallback) => Promise<string>;
}

export class MultipartFileUpoader implements FileUploader {
  async upload(file: File, progressCallback: ProgressCallback): Promise<string> {
    const blob = await CreateBlob({ filename: file.name });
    const signedUploadUrl = blob.data.createBlob.signedUploadUrl;

    await this.uploadFile(file, signedUploadUrl, progressCallback);

    return blob.data.createBlob.url;
  }

  private uploadFile(file: File, signedUploadUrl: string, progressCallback: ProgressCallback): Promise<string> {
    const form = new FormData();
    const client = axios.create();

    form.append("file", file);

    client.defaults.headers.common["Content-Type"] = "multipart/form-data";
    client.defaults.headers.common["x-csrf-token"] = csrftoken();

    const config = {
      onUploadProgress: (progressEvent: any) => {
        progressCallback(Math.round((progressEvent.loaded * 100) / progressEvent.total));
      },
    };

    return client.post(signedUploadUrl, form, config);
  }
}
