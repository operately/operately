import path from "node:path";
import sharp from "sharp";

export interface ImageMetadata {
  width: number;
  height: number;
}

export interface GeneratedImagePreview {
  fileBytes: Buffer;
  fileName: string;
  contentType: string;
  width: number;
  height: number;
}

export async function readImageMetadata(fileBytes: Buffer, filePath: string): Promise<ImageMetadata> {
  try {
    const metadata = await sharp(fileBytes, { animated: true }).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("Image dimensions are unavailable.");
    }

    return {
      width: metadata.width,
      height: metadata.height,
    };
  } catch (error) {
    throw new Error(
      `Failed to inspect image '${path.basename(filePath)}': ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function generateImagePreview(fileBytes: Buffer, filePath: string): Promise<GeneratedImagePreview> {
  try {
    const { data, info } = await sharp(fileBytes, { animated: true }).resize({ width: 100 }).png().toBuffer({ resolveWithObject: true });

    if (!info.width || !info.height) {
      throw new Error("Preview dimensions are unavailable.");
    }

    return {
      fileBytes: data,
      fileName: buildPreviewFileName(filePath),
      contentType: "image/png",
      width: info.width,
      height: info.height,
    };
  } catch (error) {
    throw new Error(
      `Failed to generate an image preview for '${path.basename(filePath)}': ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function buildPreviewFileName(filePath: string): string {
  const extension = path.extname(filePath);
  const baseName = path.basename(filePath, extension);

  return `${baseName || path.basename(filePath)}.png`;
}
