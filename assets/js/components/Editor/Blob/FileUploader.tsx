import axios from "axios";
import csrftoken from "@/utils/csrf_token";
import * as Blobs from "@/models/blobs";

type ProgressCallback = (number: number) => any;

export interface FileUploader {
  upload: (file: File, progressCallback: ProgressCallback) => Promise<{ id: string; url: string }>;
}

export class MultipartFileUploader implements FileUploader {
  async upload(file: File, progressCallback: ProgressCallback): Promise<{ id: string; url: string }> {
    const blob = await Blobs.createBlob({ filename: file.name });
    await this.uploadFile(file, blob.signedUploadUrl!, progressCallback);

    return { id: blob.id!, url: blob.url! };
  }

  private async uploadFile(file: File, signedUploadUrl: string, progressCallback: ProgressCallback): Promise<void> {
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

    try {
      await client.post(signedUploadUrl, form, config);
    } catch (error) {
      console.error("Error uploading file:", error);
      throw new Error(`Error uploading file: ${error.message}`);
    }
  }
}
