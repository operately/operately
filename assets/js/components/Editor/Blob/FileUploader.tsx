import axios from "axios";

import csrftoken from "@/utils/csrf_token";

export type UploadResponse = {
  data: {
    path: string;
  };
};

export interface FileUploader {
  upload: (file: File) => Promise<UploadResponse>;
}

export class MultipartFileUpoader implements FileUploader {
  private form: FormData;
  private axiosInstance: any;

  constructor() {
    this.form = new FormData();
    this.axiosInstance = axios.create();

    this.axiosInstance.defaults.headers.common["Content-Type"] = "multipart/form-data";
    this.axiosInstance.defaults.headers.common["x-csrf-token"] = csrftoken();
  }

  upload(image: File): Promise<UploadResponse> {
    this.form.append("file", image);

    return this.axiosInstance.post("/blobs", this.form);
  }
}
