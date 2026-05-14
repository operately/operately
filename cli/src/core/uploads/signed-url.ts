import path from "node:path";
import axios from "axios";
import { ApiError } from "../http";

export interface SignedUploadArgs {
  filePath: string;
  fileBytes: Buffer;
  signedUploadUrl: string;
  uploadStrategy: string;
  contentType: string;
  timeoutMs: number;
  verbose?: boolean;
}

export async function uploadToSignedUrl(args: SignedUploadArgs): Promise<void> {
  if (args.verbose) {
    console.error(`[operately] UPLOAD ${args.signedUploadUrl}`);
  }

  try {
    if (args.uploadStrategy === "multipart") {
      const formData = new FormData();
      const bytes = Uint8Array.from(args.fileBytes);
      formData.append("file", new Blob([bytes], { type: args.contentType }), path.basename(args.filePath));

      await axios.put(args.signedUploadUrl, formData, {
        timeout: args.timeoutMs,
      });

      return;
    }

    await axios.put(args.signedUploadUrl, args.fileBytes, {
      timeout: args.timeoutMs,
      headers: {
        "Content-Type": args.contentType,
        "Content-Length": String(args.fileBytes.byteLength),
      },
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        throw new ApiError(`Avatar upload timed out after ${args.timeoutMs}ms`, 0, null);
      }

      if (error.response) {
        throw new ApiError(`Avatar upload failed with status ${error.response.status}`, error.response.status, error.response.data ?? null);
      }

      throw new ApiError("Network error while uploading avatar image", 0, null);
    }

    throw error;
  }
}
