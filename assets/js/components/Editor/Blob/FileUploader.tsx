import axios from "axios";
import csrftoken from "@/utils/csrf_token";
import { CreateBlob } from "@/graphql/Blobs";

type ProgressCallback = (number: number) => any;

export interface FileUploader {
  upload: (file: File, progressCallback: ProgressCallback) => Promise<{ id: string, url: string }>;
}

export class MultipartFileUploader implements FileUploader {
  async upload(file: File, progressCallback: ProgressCallback): Promise<{ id: string, url: string }> {
    try {
      const blob = await CreateBlob({ filename: file.name });

      if (blob.errors) {
        throw new Error(`GraphQL Error: ${blob.errors.map((error: any) => error.message).join(", ")}`);
      }

      const signedUploadUrl = blob.data.createBlob.signedUploadUrl;

      await this.uploadFile(file, signedUploadUrl, progressCallback);

      return {
        id: blob.data.createBlob.id,
        url: blob.data.createBlob.url
      };
    } catch (error) {
      console.error("Error during file upload:", error);
      throw new Error(`File upload failed: ${error.message}`);
    }
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
