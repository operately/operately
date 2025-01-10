import React, { useMemo } from "react";
import classNames from "classnames";
import { Space } from "@/models/spaces";
import { ResourceHub } from "@/models/resourceHubs";
import { Title } from "../components";
import { NodeIcon } from "@/features/ResourceHub/NodeIcon";
import { NodeDescription } from "@/features/ResourceHub";
import { CommentsCountIndicator } from "@/features/Comments";
import { sortNodesWithFoldersFirst } from "@/features/ResourceHub/utils";
import { DecoratedNode, decorateNodes } from "@/features/ResourceHub/DecoratedNode";

interface Props {
  space: Space;
  resourceHub: ResourceHub;
}

export function RegularState(props: Props) {
  let nodes = decorateNodes(props.space!, props.resourceHub, props.resourceHub.nodes!);

  return (
    <div className="flex flex-col h-full">
      <Title title={props.resourceHub.name!} />

      <div className="bg-surface-dimmed rounded mx-2 flex-1">
        <NodesList nodes={nodes!} />
      </div>
    </div>
  );
}

function NodesList({ nodes }: { nodes: DecoratedNode[] }) {
  const sortedNodes = useMemo(() => sortNodesWithFoldersFirst(nodes), [nodes]);

  return (
    <div>
      {sortedNodes.map((node) => (
        <NodeItem key={node.rawNode.id} node={node} />
      ))}
    </div>
  );
}

function NodeItem({ node }: { node: DecoratedNode }) {
  const className = classNames(
    "flex gap-2 px-2 py-1.5",
    "border-b border-stroke-base last:border-b-0 flex items-center",
  );

  return (
    <div key={node.resource.id} className={className}>
      <div>
        <NodeIcon node={node.rawNode} size={32} />
      </div>
      <div className="overflow-hidden leading-snug">
        <div className="font-bold truncate">{node.name}</div>
        <NodeDescription node={node} fontSize="text-[10px] truncate" />
      </div>
      <CommentsCountIndicator count={node.commentsCount!} size={16} />
    </div>
  );
}
