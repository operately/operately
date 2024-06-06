import axios from "axios";

/**
 * @param {File} file
 * @returns {Promise<string>}
 */
export const S3Upload = async (file: File): Promise<string> => {
  const bucketUrl = "http://localhost:9090/avatars-bucket/";
  const signedUploadUrl = `${bucketUrl}/${file.name}`;

  try {
    const config : any = {
        headers: {
          "Content-Type": file.type,
          "Access-Control-Allow-Origin": "*",
        }
      };

    const response = await axios.put(signedUploadUrl, file, config);

    if (response.status === 200) {
      return signedUploadUrl;
    } else {
      throw new Error(`Upload failed with status ${response.status}`);
    }
  } catch (error: any) {
    throw new Error("File upload failed");
  }
};
