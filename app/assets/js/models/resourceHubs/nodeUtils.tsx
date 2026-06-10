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
