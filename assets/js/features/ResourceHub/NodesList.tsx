import React from "react";

import * as Hub from "@/models/resourceHubs";

import classNames from "classnames";
import { DivLink } from "@/components/Link";
import { ImageWithPlaceholder } from "@/components/Image";
import { assertPresent } from "@/utils/assertions";
import { createTestId } from "@/utils/testid";
import { DocumentMenu, FileMenu, FolderMenu } from "./components";
import { findIcon, findPath, findSubtitle, NodeType } from "./utils";

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
