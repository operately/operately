import React from "react";

import * as Hub from "@/models/resourceHubs";
import { IconFolder, IconFile, IconPhoto, IconFileTypePdf, IconMovie } from "@tabler/icons-react";
import classNames from "classnames";
import { Paths } from "@/routes/paths";
import { DivLink } from "@/components/Link";
import { Menu, MenuLinkItem, MenuActionItem } from "@/components/Menu";
import { richContentToString } from "@/components/RichContent";
import { truncateString } from "@/utils/strings";
import { assertPresent } from "@/utils/assertions";
import { createTestId } from "@/utils/testid";

type NodeType = "document" | "folder" | "file";

interface Props {
  permissions: Hub.ResourceHubPermissions;
  refetch: () => void;
}

interface NodesListProps extends Props {
  nodes: Hub.ResourceHubNode[];
}

interface NodeItemProps extends Props {
  node: Hub.ResourceHubNode;
  testid: string;
}

interface DocumentMenuProps extends Props {
  document: Hub.ResourceHubDocument;
}

export function NodesList({ nodes, permissions, refetch }: NodesListProps) {
  return (
    <div className="mt-12">
      {nodes.map((node, idx) => (
        <NodeItem
          node={node}
          permissions={permissions}
          refetch={refetch}
          testid={createTestId("node", idx.toString())}
          key={node.id}
        />
      ))}
    </div>
  );
}

function NodeItem({ node, permissions, refetch, testid }: NodeItemProps) {
  const className = classNames(
    "grid grid-cols-[1fr,20px]",
    "border-b border-stroke-base first:border-t last:border-b-0",
  );
  const Icon = findIcon(node.type as NodeType, node);
  const path = findPath(node.type as NodeType, node);
  const subtitle = findSubtitle(node.type as NodeType, node);

  return (
    <div className={className} data-test-id={testid}>
      <DivLink to={path} className="flex gap-4 py-4 cursor-pointer">
        <Icon size={48} />
        <div>
          <div className="font-bold text-lg">{node.name}</div>
          <div>{subtitle}</div>
        </div>
      </DivLink>

      {node.document && (
        <div className="flex items-center">
          <DocumentMenu document={node.document} permissions={permissions} refetch={refetch} />
        </div>
      )}
    </div>
  );
}

function DocumentMenu({ document, permissions, refetch }: DocumentMenuProps) {
  const editPath = Paths.resourceHubEditDocumentPath(document.id!);
  const relevantPermissions = [permissions.canEditDocument, permissions.canDeleteDocument];

  const menuId = createTestId("document-menu", document.id!);
  const editId = createTestId("edit", document.id!);

  if (!relevantPermissions.some(Boolean)) return <></>;

  return (
    <Menu size="medium" testId={menuId}>
      {permissions.canEditDocument && (
        <MenuLinkItem to={editPath} testId={editId}>
          Edit document
        </MenuLinkItem>
      )}

      {permissions.canDeleteDocument && <DeleteDocumentMenuItem document={document} refetch={refetch} />}
    </Menu>
  );
}

function DeleteDocumentMenuItem({ document, refetch }: { document: Hub.ResourceHubDocument; refetch: () => void }) {
  const [remove] = Hub.useDeleteResourceHubDocument();
  const handleDelete = async () => {
    await remove({ documentId: document.id });
    refetch();
  };
  const deleteId = createTestId("delete", document.id!);

  return (
    <MenuActionItem onClick={handleDelete} testId={deleteId} danger>
      Delete document
    </MenuActionItem>
  );
}

function findIcon(nodeType: NodeType, node: Hub.ResourceHubNode) {
  switch (nodeType) {
    case "document":
      return IconFile;
    case "folder":
      return IconFolder;
    case "file":
      if (node.file?.type?.includes("image")) return IconPhoto;
      if (node.file?.type?.includes("pdf")) return IconFileTypePdf;
      if (node.file?.type?.includes("video")) return IconMovie;
      return IconFile;
  }
}

function findPath(nodeType: NodeType, node: Hub.ResourceHubNode) {
  switch (nodeType) {
    case "document":
      return Paths.resourceHubDocumentPath(node.document!.id!);
    case "folder":
      return Paths.resourceHubFolderPath(node.folder!.id!);
    case "file":
      return "";
  }
}

function findSubtitle(nodeType: NodeType, node: Hub.ResourceHubNode) {
  switch (nodeType) {
    case "document":
      assertPresent(node.document?.content, "content must be present in node.document");
      const content = richContentToString(JSON.parse(node.document.content));
      return truncateString(content, 60);
    case "folder":
      assertPresent(node.folder?.childrenCount, "childrenCount must be present in node.folder");
      return node.folder.childrenCount === 1 ? "1 item" : `${node.folder.childrenCount} items`;
    case "file":
      return "";
  }
}
