import React, { useMemo } from "react";

import * as Hub from "@/models/resourceHubs";

import { useStateWithLocalStorage } from "@/hooks/useStateWithLocalStorage";
import { createTestId } from "@/utils/testid";
import classNames from "classnames";
import {
  CommentCountIndicator,
  DivLink,
  FolderZeroNodes,
  HubZeroNodes,
  NodeDescription,
  NodeIcon,
  ResourceHubSortBy,
  sortNodesWithFoldersFirst,
  SortControl,
} from "turboui";
import { usePaths } from "../../routes/paths";
import { DocumentMenu, FileMenu, FolderMenu, LinkMenu } from "./components";
import { useNewFileModalsContext } from "./contexts/NewFileModalsContext";
import { NodesProps, NodesProvider } from "./contexts/NodesContext";
import { nodeToUiNode } from "@/models/resourceHubs";

export function NodesList(props: NodesProps) {
  const { filesSelected } = useNewFileModalsContext();
  const [sortBy, setSortBy] = useStateWithLocalStorage<ResourceHubSortBy>("resourceHub", "sortBy", "name");

  const sortOrder = sortBy === "name" ? "asc" : "desc";
  const nodes = useMemo(
    () => sortNodesWithFoldersFirst(props.nodes!, sortBy, sortOrder),
    [props.nodes, sortBy, sortOrder],
  );

  if (props.nodes.length < 1) {
    if (filesSelected) return <></>;
    if (props.type === "resource_hub") return <HubZeroNodes />;
    else return <FolderZeroNodes />;
  }

  return (
    <NodesProvider {...props}>
      <div className="flex justify-end mb-4">
        <SortControl sortBy={sortBy} onSortChange={setSortBy} />
      </div>

      <div>
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
  const paths = usePaths();
  const className = classNames(
    "flex justify-between gap-2 py-4 px-2 items-center",
    "border-b border-stroke-base first:border-t",
  );

  const uiNode = nodeToUiNode(paths, node);

  return (
    <div className={className} data-test-id={testid}>
      <DivLink to={uiNode.path} className="flex gap-4 items-center cursor-pointer flex-1">
        <NodeIcon node={uiNode} size={48} />

        <div>
          <NodeName node={uiNode} />
          <NodeDescription node={uiNode} />
        </div>
      </DivLink>

      <CommentCountIndicator count={uiNode.commentsCount} size={24} />
      <NodeMenu node={node} />
    </div>
  );
}

function NodeName({ node }: { node: { name: string } }) {
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
