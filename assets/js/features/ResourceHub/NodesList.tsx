import React from "react";

import { ResourceHubDocument, ResourceHubNode, ResourceHubPermissions } from "@/models/resourceHubs";
import { IconFolder, IconFile, IconPhoto, IconFileTypePdf, IconMovie } from "@tabler/icons-react";
import classNames from "classnames";
import { Paths } from "@/routes/paths";
import { DivLink } from "@/components/Link";
import { Menu, MenuLinkItem, MenuActionItem } from "@/components/Menu";

type NodeType = "document" | "folder" | "file";

interface ListProps {
  nodes: ResourceHubNode[];
  permissions: ResourceHubPermissions;
}

export function NodesList({ nodes, permissions }: ListProps) {
  return (
    <div className="mt-12">
      {nodes.map((node) => (
        <NodeItem node={node} permissions={permissions} key={node.id} />
      ))}
    </div>
  );
}

interface ItemProps {
  node: ResourceHubNode;
  permissions: ResourceHubPermissions;
}

function NodeItem({ node, permissions }: ItemProps) {
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

      {node.document && permissions.canEditDocument && (
        <div className="flex items-center">
          <DocumentMenu document={node.document} />
        </div>
      )}
    </div>
  );
}

function DocumentMenu({ document }: { document: ResourceHubDocument }) {
  const editPath = Paths.resourceHubEditDocumentPath(document.id!);

  return (
    <Menu size="medium">
      <MenuLinkItem to={editPath}>Edit document</MenuLinkItem>
      <MenuActionItem onClick={() => {}} danger>
        Delete document
      </MenuActionItem>
    </Menu>
  );
}

function findIcon(nodeType: NodeType, node: ResourceHubNode) {
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

function findPath(nodeType: NodeType, node: ResourceHubNode) {
  switch (nodeType) {
    case "document":
      return Paths.resourceHubDocumentPath(node.document!.id!);
    case "folder":
      return Paths.resourceHubFolderPath(node.folder!.id!);
    case "file":
      return "";
  }
}
