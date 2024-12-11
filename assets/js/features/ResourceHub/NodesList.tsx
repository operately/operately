import React from "react";

import * as Hub from "@/models/resourceHubs";
import { findFileSize } from "@/models/blobs";

import { IconFolder, IconFile, IconPhoto, IconFileTypePdf, IconMovie, IconMusic } from "@tabler/icons-react";
import classNames from "classnames";
import { Paths } from "@/routes/paths";
import { DivLink } from "@/components/Link";
import { ImageWithPlaceholder } from "@/components/Image";
import { richContentToString } from "@/components/RichContent";
import { truncateString } from "@/utils/strings";
import { assertPresent } from "@/utils/assertions";
import { createTestId } from "@/utils/testid";
import { DocumentMenu, FileMenu, FolderMenu } from "./components";

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
  const path = findPath(node.type as NodeType, node);
  const subtitle = findSubtitle(node.type as NodeType, node);

  return (
    <div className={className} data-test-id={testid}>
      <DivLink to={path} className="flex gap-4 py-4 items-center cursor-pointer">
        <FilePreview node={node} />
        <div>
          <div className="font-bold text-lg">{node.name}</div>
          <div>{subtitle}</div>
        </div>
      </DivLink>

      {node.folder && (
        <div className="flex items-center">
          <FolderMenu folder={node.folder} permissions={permissions} refetch={refetch} />
        </div>
      )}
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

function FilePreview({ node }: { node: Hub.ResourceHubNode }) {
  const Icon = findIcon(node.type as NodeType, node);

  if (node.file?.blob?.contentType?.includes("image")) {
    return <Thumbnail file={node.file} />;
  } else {
    return <Icon size={48} color="#444" />;
  }
}

function Thumbnail({ file }: { file: Hub.ResourceHubFile }) {
  assertPresent(file.blob, "blob must be present in file");

  const imgRatio = file.blob.height! / file.blob.width!;

  return (
    <div style={{ width: 48, height: 48 * imgRatio }}>
      <ImageWithPlaceholder src={file.blob.url!} alt={file.name!} ratio={imgRatio} />
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
      if (node.file.blob.contentType?.includes("audio")) return IconMusic;
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
      assertPresent(node.file?.size, "size must be present in node.file");
      assertPresent(node.file?.description, "description must be present in node.file");

      const size = findFileSize(node.file.size);
      const description = richContentToString(JSON.parse(node.file.description));
      return size + (description ? ` - ${truncateString(description, 50)}` : "");
  }
}
