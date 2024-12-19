import React from "react";

import * as Hub from "@/models/resourceHubs";

import classNames from "classnames";
import { DivLink } from "@/components/Link";
import { ImageWithPlaceholder } from "@/components/Image";
import { CommentsCountIndicator } from "@/features/Comments";
import { assertPresent } from "@/utils/assertions";
import { createTestId } from "@/utils/testid";
import { findCommentsCount, findIcon, findPath, findSubtitle, NodeType } from "./utils";
import { DocumentMenu, FileMenu, FolderMenu, ZeroNodes } from "./components";
import { NodesProps, NodesProvider } from "./contexts/NodesContext";

export function NodesList(props: NodesProps) {
  const resource = props.type === "resource_hub" ? props.resourceHub : props.folder;

  assertPresent(resource.nodes, `nodes must be present in ${props.type}`);

  if (resource.nodes.length < 1) return <ZeroNodes />;

  return (
    <NodesProvider {...props}>
      <div className="mt-12">
        {resource.nodes.map((node, idx) => (
          <NodeItem node={node} testid={createTestId("node", idx.toString())} key={node.id} />
        ))}
      </div>
    </NodesProvider>
  );
}

interface NodeItemProps {
  node: Hub.ResourceHubNode;
  testid: string;
}

function NodeItem({ node, testid }: NodeItemProps) {
  const className = classNames(
    "grid grid-cols-[1fr,20px]",
    "border-b border-stroke-base first:border-t last:border-b-0",
  );
  const path = findPath(node.type as NodeType, node);
  const subtitle = findSubtitle(node.type as NodeType, node);
  const commentsCount = findCommentsCount(node.type as NodeType, node);

  return (
    <div className={className} data-test-id={testid}>
      <DivLink to={path} className="flex gap-4 py-4 items-center cursor-pointer">
        <FilePreview node={node} />
        <div>
          <div className="font-bold text-lg">{node.name}</div>
          <div className="flex items-center gap-4">
            <div>{subtitle}</div>
            <CommentsCountIndicator count={commentsCount} />
          </div>
        </div>
      </DivLink>

      {node.folder && (
        <div className="flex items-center">
          <FolderMenu folder={node.folder} />
        </div>
      )}
      {node.document && (
        <div className="flex items-center">
          <DocumentMenu document={node.document} />
        </div>
      )}
      {node.file && (
        <div className="flex items-center">
          <FileMenu file={node.file} />
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
