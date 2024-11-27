import React from "react";

import * as Hub from "@/models/resourceHubs";
import { IconFolder, IconFile, IconPhoto, IconFileTypePdf, IconMovie } from "@tabler/icons-react";
import classNames from "classnames";
import { Paths } from "@/routes/paths";
import { DivLink } from "@/components/Link";
import { Menu, MenuLinkItem, MenuActionItem } from "@/components/Menu";

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
}

interface DocumentMenuProps extends Props {
  document: Hub.ResourceHubDocument;
}

export function NodesList({ nodes, permissions, refetch }: NodesListProps) {
  return (
    <div className="mt-12">
      {nodes.map((node) => (
        <NodeItem node={node} permissions={permissions} refetch={refetch} key={node.id} />
      ))}
    </div>
  );
}

function NodeItem({ node, permissions, refetch }: NodeItemProps) {
  const className = classNames(
    "grid grid-cols-[1fr,20px]",
    "border-b border-stroke-base first:border-t last:border-b-0",
  );
  const Icon = findIcon(node.type as NodeType, node);
  const path = findPath(node.type as NodeType, node);

  return (
    <div className={className}>
      <DivLink to={path} className="flex gap-4 py-4 cursor-pointer">
        <Icon size={48} />
        <div>
          <div className="font-bold text-lg">{node.name}</div>
          <div>3 items</div>
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

  if (!relevantPermissions.some(Boolean)) return <></>;

  return (
    <Menu size="medium">
      {permissions.canEditDocument && <MenuLinkItem to={editPath}>Edit document</MenuLinkItem>}

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

  return (
    <MenuActionItem onClick={handleDelete} danger>
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
