import { nodeToUiNode, ResourceHub, ResourceHubNode } from "@/models/resourceHubs";
import { usePaths } from "@/routes/paths";
import classNames from "classnames";
import React, { useMemo } from "react";
import { CommentCountIndicator, NodeDescription, NodeIcon, ResourceHubSortBy, sortNodesWithFoldersFirst } from "turboui";
import { Title } from "../components";
import { useStateWithLocalStorage } from "@/hooks/useStateWithLocalStorage";

interface Props {
  resourceHub: ResourceHub;
}

export function RegularState(props: Props) {
  return (
    <div className="flex flex-col h-full">
      <Title title={props.resourceHub.name!} />

      <div className="bg-surface-dimmed rounded mx-2 flex-1">
        <NodesList nodes={props.resourceHub.nodes!} />
      </div>
    </div>
  );
}

function NodesList({ nodes }: { nodes: ResourceHubNode[] }) {
  const [sortBy] = useStateWithLocalStorage<ResourceHubSortBy>("resourceHub", "sortBy", "name");

  const sortOrder = sortBy === "name" ? "asc" : "desc";
  const sortedNodes = useMemo(() => sortNodesWithFoldersFirst(nodes, sortBy, sortOrder), [nodes, sortBy, sortOrder]);

  return (
    <div>
      {sortedNodes.map((node) => (
        <NodeItem key={node.id} node={node} />
      ))}
    </div>
  );
}

function NodeItem({ node }: { node: ResourceHubNode }) {
  const className = classNames("px-2 py-1.5", "border-b border-stroke-base last:border-b-0", "flex items-center gap-2");

  const paths = usePaths();
  const uiNode = nodeToUiNode(paths, node);

  return (
    <div key={node.id} className={className}>
      <div>
        <NodeIcon node={uiNode} size={32} />
      </div>
      <div className="overflow-hidden leading-snug flex-1">
        <div className="font-bold truncate">{node.name}</div>
        <NodeDescription node={uiNode} fontSize="text-[10px] truncate" />
      </div>
      <CommentCountIndicator count={uiNode.commentsCount} size={16} />
    </div>
  );
}
