import React, { useMemo } from "react";
import classNames from "classnames";
import { ResourceHub, ResourceHubNode } from "@/models/resourceHubs";
import { Title } from "../components";
import { NodeType } from "@/features/ResourceHub";
import { NodeIcon } from "@/features/ResourceHub/NodeIcon";
import { NodeDescription } from "@/features/ResourceHub";
import { CommentsCountIndicator } from "@/features/Comments";
import { findCommentsCount, sortNodesWithFoldersFirst } from "@/features/ResourceHub/utils";

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
  const sortedNodes = useMemo(() => sortNodesWithFoldersFirst(nodes), [nodes]);

  return (
    <div>
      {sortedNodes.map((node) => (
        <NodeItem key={node.id} node={node} />
      ))}
    </div>
  );
}

function NodeItem({ node }: { node: ResourceHubNode }) {
  const className = classNames(
    "flex gap-2 px-2 py-1.5",
    "border-b border-stroke-base last:border-b-0 flex items-center",
  );

  const commentsCount = findCommentsCount(node.type as NodeType, node);

  return (
    <div key={node.id} className={className}>
      <div>
        <NodeIcon node={node} size={32} />
      </div>
      <div className="overflow-hidden leading-snug">
        <div className="font-bold truncate">{node.name}</div>
        <NodeDescription node={node} fontSize="text-[10px] truncate" />
      </div>
      <CommentsCountIndicator count={commentsCount} size={16} />
    </div>
  );
}
