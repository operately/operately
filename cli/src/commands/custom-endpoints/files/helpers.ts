import path from "node:path";

export const EMPTY_RICH_TEXT = JSON.stringify({
  type: "doc",
  content: [],
});

export function buildStoredFileName(filePath: string, overrideName: string | null): string {
  const fileName = path.basename(filePath);

  if (!overrideName) {
    return fileName;
  }

  const extension = path.extname(fileName);
  if (!extension) {
    return overrideName;
  }

  return `${overrideName}${extension}`;
}
