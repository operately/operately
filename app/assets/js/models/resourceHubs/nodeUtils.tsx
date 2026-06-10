import type { ResourceHubNode } from "@/api";
import { assertPresent } from "@/utils/assertions";
import type { Paths } from "@/routes/paths";

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

export function findCommentsCount(nodeType: NodeType, node: ResourceHubNode) {
  switch (nodeType) {
    case "document":
      return node.document?.commentsCount ?? 0;

    case "file":
      return node.file?.commentsCount ?? 0;

    case "link":
      return node.link?.commentsCount ?? 0;

    default:
      return 0;
  }
}
