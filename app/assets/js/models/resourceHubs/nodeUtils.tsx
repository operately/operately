import type { ResourceHubNode } from "@/api";
import type { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";

type NodeType = "document" | "folder" | "file" | "link";

export function getNodePath(paths: Paths, node: ResourceHubNode) {
  switch (getNodeType(node)) {
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

export function getDraftEditPath(paths: Paths, node: ResourceHubNode) {
  if (!node.document?.id) {
    return getNodePath(paths, node);
  }

  return paths.resourceHubEditDocumentPath(node.document.id);
}

function getNodeType(node: ResourceHubNode): NodeType {
  if (node.type === "document" || node.type === "folder" || node.type === "file" || node.type === "link") {
    return node.type;
  }

  throw new Error(`Unsupported resource hub node type: ${node.type}`);
}
