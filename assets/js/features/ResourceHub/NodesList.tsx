import React from "react";

import * as Hub from "@/models/resourceHubs";
import { IconFolder, IconFile, IconPhoto, IconFileTypePdf, IconMovie } from "@tabler/icons-react";
import classNames from "classnames";
import { Paths } from "@/routes/paths";
import { DivLink } from "@/components/Link";
import { richContentToString } from "@/components/RichContent";
import { truncateString } from "@/utils/strings";
import { assertPresent } from "@/utils/assertions";
import { createTestId } from "@/utils/testid";
import { DocumentMenu, FileMenu } from "./components";

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
      {node.file && (
        <div className="flex items-center">
          <FileMenu file={node.file} permissions={permissions} refetch={refetch} />
        </div>
      )}
    </div>
  );
}

function findIcon(nodeType: NodeType, node: Hub.ResourceHubNode) {
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
      return Paths.resourceHubFilePath(node.file!.id!);
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
