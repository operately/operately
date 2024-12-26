import { IconFile, IconFileTypePdf, IconFolder, IconLink, IconMovie, IconMusic, IconPhoto } from "@tabler/icons-react";
import { ResourceHubNode } from "@/models/resourceHubs";

import { richContentToString } from "@/components/RichContent";
import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { truncateString } from "@/utils/strings";

export type NodeType = "document" | "folder" | "file" | "link";

export function findIcon(nodeType: NodeType, node: ResourceHubNode) {
  switch (nodeType) {
    case "document":
      return IconFile;
    case "folder":
      return IconFolder;
    case "link":
      return IconLink;
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
    case "link":
      return "";
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

    case "link":
      return "";

    case "file":
      assertPresent(node.file?.description, "description must be present in node.file");
      const description = richContentToString(JSON.parse(node.file.description));
      return truncateString(description, 50);
  }
}

export function sortNodesWithFoldersFirst(nodes: ResourceHubNode[]) {
  const folders: ResourceHubNode[] = [];
  const others: ResourceHubNode[] = [];

  nodes.forEach((node) => {
    if (node.type === "folder") {
      folders.push(node);
    } else {
      others.push(node);
    }
  });

  folders.sort((a, b) => a.name!.localeCompare(b.name!));

  return [...folders, ...others];
}

export function findCommentsCount(nodeType: NodeType, node: ResourceHubNode) {
  switch (nodeType) {
    case "document":
      assertPresent(node.document?.commentsCount, "commentsCount must be present in document");
      return node.document.commentsCount;

    case "file":
      assertPresent(node.file?.commentsCount, "commentsCount must be present in file");
      return node.file.commentsCount;

    default:
      return 0;
  }
}
