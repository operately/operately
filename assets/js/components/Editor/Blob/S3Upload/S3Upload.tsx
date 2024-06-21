import { CreateBlob } from "@/graphql/Blobs";
import axios from "axios";
import { ProgressCallback } from "../FileUploader";

/**
 * @param {File} file
 * @returns {Promise<string>}
 */
export const S3Upload = async (file: File, progressCallback: ProgressCallback) => {
  try {
    const { data } = await CreateBlob({ filename: file.name });
    const signedUploadUrl = data.createBlob.signedUploadUrl;
    const config = {
      headers: {
        "Content-Type": file.type,
        "Access-Control-Allow-Origin": "*",
      },
      onUploadProgress: (progressEvent: any) => {
        progressCallback(Math.round((progressEvent.loaded * 100) / progressEvent.total));
      },
    };

    try {
      await axios.put(signedUploadUrl, file, config);
    }
    catch (error) {
      throw new Error(`Error uploading file: ${error.message}`);
    }
    return {
      id: data.createBlob.id,
      url: data.createBlob.url
    }

  } catch (error) {
    throw new Error("File upload failed");
  }
};
