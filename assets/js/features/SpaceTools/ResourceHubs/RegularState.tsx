import React from "react";
import classNames from "classnames";
import { ResourceHub, ResourceHubNode } from "@/models/resourceHubs";
import { Title } from "../components";
import { findSubtitle, NodeType } from "@/features/ResourceHub";
import { NodeIcon } from "@/features/ResourceHub/NodeIcon";

interface Props {
  resourceHub: ResourceHub;
}

export function RegularState(props: Props) {
  return (
    <div>
      <Title title={props.resourceHub.name!} />
      <NodesList nodes={props.resourceHub.nodes!} />
    </div>
  );
}

function NodesList({ nodes }: { nodes: ResourceHubNode[] }) {
  return (
    <div>
      {nodes.map((node) => (
        <NodeItem key={node.id} node={node} />
      ))}
    </div>
  );
}

function NodeItem({ node }: { node: ResourceHubNode }) {
  const className = classNames("flex gap-2 p-2", "border-b border-stroke-base last:border-b-0");
  const subtitle = findSubtitle(node.type as NodeType, node);

  return (
    <div key={node.id} className={className}>
      <div>
        <NodeIcon node={node} size={32} />
      </div>
      <div className="overflow-hidden">
        <div className="font-bold truncate">{node.name}</div>
        <div className="truncate">{subtitle}</div>
      </div>
    </div>
  );
}
