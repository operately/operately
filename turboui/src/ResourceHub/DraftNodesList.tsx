import * as React from "react";

import { ResourceHubNodeRow } from "./ResourceHubNodeRow";
import type { ResourceHubDraftNode } from "./types";

interface DraftNodesListProps {
  nodes: ResourceHubDraftNode[];
}

export function DraftNodesList({ nodes }: DraftNodesListProps) {
  return (
    <div className="md:m-6">
      {nodes.map((node, index) => (
        <ResourceHubNodeRow
          key={node.id}
          node={node}
          testId={`node-${index}`}
          className="first:border-t-0"
        />
      ))}
    </div>
  );
}
