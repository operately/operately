import { CreateBlob } from "@/graphql/Blobs";
import axios from "axios";

/**
 * @param {File} file
 * @returns {Promise<string>}
 */
export const S3Upload = async (file) => {
  try {
    const { data } = await CreateBlob({ filename: file.name });
    const signedUploadUrl = data.createBlob.signedUploadUrl;
    const config = {
      headers: {
        "Content-Type": file.type,
        "Access-Control-Allow-Origin": "*",
      },
    };

    const response = await axios.put(signedUploadUrl, file, config);
    if (response.status === 200) {
      return {
        id: data.createBlob.id,
        url: data.createBlob.url,
      };
    } else {
      throw new Error(`Upload failed with status ${response.status}`);
    }
  } catch (error) {
    console.error(error);
    throw new Error("File upload failed");
  }
};
