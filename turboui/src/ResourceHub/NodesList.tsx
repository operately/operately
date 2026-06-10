import * as React from "react";

import { NodeMenu } from "./NodeMenu";
import { ResourceHubNodesListProvider, type ResourceHubNodesListContextValue } from "./contexts/NodesListContext";
import { FolderZeroNodes, HubZeroNodes } from "./ZeroNodes";
import { ResourceHubNodeRow } from "./ResourceHubNodeRow";
import { SortControl } from "./SortControl";
import type { ResourceHubNode, ResourceHubSortBy } from "./types";

interface NodesListProps {
  nodes: ResourceHubNode[];
  sortBy: ResourceHubSortBy;
  onSortChange: (sortBy: ResourceHubSortBy) => void;
  emptyVariant: "hub" | "folder";
  hideWhenEmpty?: boolean;
  listContext: ResourceHubNodesListContextValue;
  getNodeTestId?: (node: ResourceHubNode, index: number) => string;
}

export function NodesList({
  nodes,
  sortBy,
  onSortChange,
  emptyVariant,
  hideWhenEmpty,
  listContext,
  getNodeTestId,
}: NodesListProps) {
  if (nodes.length < 1) {
    if (hideWhenEmpty) return null;
    if (emptyVariant === "hub") return <HubZeroNodes />;
    return <FolderZeroNodes />;
  }

  return (
    <ResourceHubNodesListProvider value={listContext}>
      <div className="flex justify-end mb-4">
        <SortControl sortBy={sortBy} onSortChange={onSortChange} />
      </div>

      <div>
        {nodes.map((node, index) => (
          <ResourceHubNodeRow
            key={node.id}
            node={node}
            testId={getNodeTestId ? getNodeTestId(node, index) : `node-${index}`}
            className="first:border-t"
            actions={<NodeMenu node={node} />}
          />
        ))}
      </div>
    </ResourceHubNodesListProvider>
  );
}
