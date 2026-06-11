import * as React from "react";

import { ResourceHubNodeRow } from "./ResourceHubNodeRow";
import { getNodeId } from "./selectors";
import type { ResourceHubNode } from "./types";

interface DraftNodesListProps {
  nodes: ResourceHubNode[];
  getNodePath: (node: ResourceHubNode) => string;
}

export function DraftNodesList({ nodes, getNodePath }: DraftNodesListProps) {
  return (
    <div className="md:m-6">
      {nodes.map((node, index) => (
        <ResourceHubNodeRow
          key={getNodeId(node) ?? index}
          node={node}
          path={getNodePath(node)}
          testId={`node-${index}`}
          className="first:border-t-0"
        />
      ))}
    </div>
  );
}
