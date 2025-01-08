import React, { useMemo } from "react";

import * as Hub from "@/models/resourceHubs";

import classNames from "classnames";
import { DivLink } from "@/components/Link";
import { CommentsCountIndicator } from "@/features/Comments";
import { assertPresent } from "@/utils/assertions";
import { createTestId } from "@/utils/testid";
import { findCommentsCount, findPath, NodeType, sortNodesWithFoldersFirst } from "./utils";
import { DocumentMenu, FileMenu, FolderMenu, LinkMenu, FolderZeroNodes, HubZeroNodes } from "./components";
import { NodesProps, NodesProvider } from "./contexts/NodesContext";
import { NodeIcon } from "./NodeIcon";
import { NodeDescription } from "./NodeDescription";

export function NodesList(props: NodesProps) {
  const resource = props.type === "resource_hub" ? props.resourceHub : props.folder;

  assertPresent(resource.nodes, `nodes must be present in ${props.type}`);
  const nodes = useMemo(() => sortNodesWithFoldersFirst(resource.nodes!), [resource.nodes]);

  if (resource.nodes.length < 1) {
    if (props.type === "resource_hub") return <HubZeroNodes />;
    else return <FolderZeroNodes />;
  }

  return (
    <NodesProvider {...props}>
      <div className="md:m-6">
        {nodes.map((node, idx) => (
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
    "flex justify-between gap-2 py-4 px-2 items-center",
    "border-b border-stroke-base first:border-t-0",
  );

  const path = findPath(node.type as NodeType, node);
  const commentsCount = findCommentsCount(node.type as NodeType, node);

  return (
    <div className={className} data-test-id={testid}>
      <DivLink to={path} className="flex gap-4 items-center cursor-pointer flex-1">
        <NodeIcon node={node} size={48} />

        <div>
          <NodeName node={node} />
          <NodeDescription node={node} />
        </div>
      </DivLink>

      <CommentsCountIndicator count={commentsCount} size={24} />
      <NodeMenu node={node} />
    </div>
  );
}

function NodeName({ node }: { node: Hub.ResourceHubNode }) {
  return <div className="font-bold text-base">{node.name}</div>;
}

function NodeMenu({ node }: { node: Hub.ResourceHubNode }) {
  if (node.folder) {
    return (
      <div className="flex items-center">
        <FolderMenu folder={node.folder} />
      </div>
    );
  }

  if (node.document) {
    return (
      <div className="flex items-center">
        <DocumentMenu document={node.document} />
      </div>
    );
  }

  if (node.file) {
    return (
      <div className="flex items-center">
        <FileMenu file={node.file} />
      </div>
    );
  }

  if (node.link) {
    return (
      <div className="flex items-center">
        <LinkMenu link={node.link} />
      </div>
    );
  }

  return null;
}
