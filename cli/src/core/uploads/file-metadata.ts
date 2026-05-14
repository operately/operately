import path from "node:path";

export function inferMimeType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();

  return (
    {
      ".avif": "image/avif",
      ".gif": "image/gif",
      ".heic": "image/heic",
      ".jpeg": "image/jpeg",
      ".jpg": "image/jpeg",
      ".pdf": "application/pdf",
      ".png": "image/png",
      ".svg": "image/svg+xml",
      ".txt": "text/plain",
      ".webp": "image/webp",
    }[extension] || "application/octet-stream"
  );
}

export function isImageContentType(contentType: string): boolean {
  return contentType.startsWith("image/");
}
