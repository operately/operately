import * as Pages from "@/components/Pages";
import * as Hub from "@/models/resourceHubs";

import { useDownloadFile } from "@/models/blobs";
import { assertPresent } from "@/utils/assertions";

type NodeType = "file" | "folder" | "document" | "link";
type Resource = Hub.ResourceHubFolder | Hub.ResourceHubFile | Hub.ResourceHubDocument | Hub.ResourceHubLink;

export interface Node {
  id: string;
  name: string;
  type: NodeType;
  resource: Resource;

  testId: string;
  menuTestId: string;
  editMenuTestId: string;
  copyMenuTestId: string;
  moveMenuTestId: string;
  deleteMenuTestId: string;
  renameMenuTestId: string;

  viewPath: string; // link to the view page of this node
  editPath: string; // link to the edit page of this node
  copyPath: string; // link to the copy page of this node

  commentsCount: number;

  // Permissions
  canEdit: boolean;
  canDelete: boolean;
  canMove: boolean;
  canCopy: boolean;
  canDownload: boolean;
  canRename: boolean;
}

// const menuId = createTestId("document-menu", document.id!);

// createTestId("node", idx.toString())

// const resource = props.type === "resource_hub" ? props.resourceHub : props.folder;

// assertPresent(resource.nodes, `nodes must be present in ${props.type}`);
// const nodes = useMemo(() => sortNodesWithFoldersFirst(resource.nodes!), [resource.nodes]);

export function useDeleteNode(node: Node) {
  const refresh = Pages.useRefresh();
  const [remove] = Hub.useDeleteResourceHubDocument();

  return async () => {
    await remove({ documentId: node.resource.id });
    refresh();
  };
}

export function useDownloadNode(node: Node) {
  const file = node.resource as Hub.ResourceHubFile;

  assertPresent(file.blob?.url, "blob.url must be present in file");
  assertPresent(file.blob.filename, "blob.filename must be present in file");

  const [download] = useDownloadFile(file.blob.url, file.blob.filename);
  return download;
}

export function useRenameNode(node: Node) {
  const refresh = Pages.useRefresh();
  const [rename] = Hub.useRenameResourceHubFolder();

  return async (name: string) => {
    await rename({ folderId: node.resource.id, newName: name });
    refresh();
  };
}
