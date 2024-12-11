import { IconFile, IconFileTypePdf, IconFolder, IconMovie, IconMusic, IconPhoto } from "@tabler/icons-react";

import { ResourceHubNode } from "@/models/resourceHubs";
import { findFileSize } from "@/models/blobs";

import { richContentToString } from "@/components/RichContent";
import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { truncateString } from "@/utils/strings";

export type NodeType = "document" | "folder" | "file";

export function findIcon(nodeType: NodeType, node: ResourceHubNode) {
  switch (nodeType) {
    case "document":
      return IconFile;
    case "folder":
      return IconFolder;
    case "file":
      assertPresent(node.file?.blob, "file.blob must be present in node");

      if (node.file.blob.contentType?.includes("image")) return IconPhoto;
      if (node.file.blob.contentType?.includes("pdf")) return IconFileTypePdf;
      if (node.file.blob.contentType?.includes("video")) return IconMovie;
      if (node.file.blob.contentType?.includes("audio")) return IconMusic;
      return IconFile;
  }
}

export function findPath(nodeType: NodeType, node: ResourceHubNode) {
  switch (nodeType) {
    case "document":
      return Paths.resourceHubDocumentPath(node.document!.id!);
    case "folder":
      return Paths.resourceHubFolderPath(node.folder!.id!);
    case "file":
      return Paths.resourceHubFilePath(node.file!.id!);
  }
}

export function findSubtitle(nodeType: NodeType, node: ResourceHubNode) {
  switch (nodeType) {
    case "document":
      assertPresent(node.document?.content, "content must be present in node.document");

      const content = richContentToString(JSON.parse(node.document.content));
      return truncateString(content, 60);
    case "folder":
      assertPresent(node.folder?.childrenCount, "childrenCount must be present in node.folder");

      return node.folder.childrenCount === 1 ? "1 item" : `${node.folder.childrenCount} items`;
    case "file":
      assertPresent(node.file?.size, "size must be present in node.file");
      assertPresent(node.file?.description, "description must be present in node.file");

      const size = findFileSize(node.file.size);
      const description = richContentToString(JSON.parse(node.file.description));
      return size + (description ? ` - ${truncateString(description, 50)}` : "");
  }
}
