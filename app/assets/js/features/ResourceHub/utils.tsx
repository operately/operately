import { ResourceHubNode } from "@/models/resourceHubs";

import { assertPresent } from "@/utils/assertions";

import { Paths } from "@/routes/paths";
export type NodeType = "document" | "folder" | "file" | "link";

export function findPath(paths: Paths, nodeType: NodeType, node: ResourceHubNode) {
  switch (nodeType) {
    case "document":
      assertPresent(node.document?.id, "document must be present in node");
      return paths.resourceHubDocumentPath(node.document.id);
    case "folder":
      assertPresent(node.folder?.id, "folder must be present in node");
      return paths.resourceHubFolderPath(node.folder.id);
    case "link":
      assertPresent(node.link?.id, "link must be present in node");
      return paths.resourceHubLinkPath(node.link.id);
    case "file":
      assertPresent(node.file?.id, "file must be present in node");
      return paths.resourceHubFilePath(node.file.id);
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
  others.sort((a, b) => a.name!.localeCompare(b.name!));

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

    case "link":
      assertPresent(node.link?.commentsCount, "commentsCount must be present in link");
      return node.link.commentsCount;

    default:
      return 0;
  }
}

export function findNameAndExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return {
      name: fileName,
      extension: "",
    };
  }

  return {
    name: fileName.slice(0, lastDotIndex),
    extension: fileName.slice(lastDotIndex + 1),
  };
}
