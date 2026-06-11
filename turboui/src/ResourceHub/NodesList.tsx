import * as React from "react";

import { NodeMenu } from "./NodeMenu";
import { useNewFileModalsContext } from "./contexts/NewFileModalsContext";
import { ResourceHubNodesListProvider, type ResourceHubNodesListContextValue } from "./contexts/NodesListContext";
import { FolderZeroNodes, HubZeroNodes } from "./ZeroNodes";
import { ResourceHubNodeRow } from "./ResourceHubNodeRow";
import { SortControl } from "./SortControl";
import { getNodeId } from "./selectors";
import type { ResourceHubNode, ResourceHubSortBy } from "./types";

interface NodesListProps {
  nodes: ResourceHubNode[];
  getNodePath: (node: ResourceHubNode) => string;
  sortBy: ResourceHubSortBy;
  onSortChange: (sortBy: ResourceHubSortBy) => void;
  emptyVariant: "hub" | "folder";
  listContext: ResourceHubNodesListContextValue;
  getNodeTestId?: (node: ResourceHubNode, index: number) => string;
}

export function NodesList({ nodes, getNodePath, sortBy, onSortChange, emptyVariant, listContext, getNodeTestId }: NodesListProps) {
  const { filesSelected } = useNewFileModalsContext();

  if (nodes.length < 1) {
    if (filesSelected) return null;
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
            key={getNodeId(node) ?? index}
            node={node}
            path={getNodePath(node)}
            testId={getNodeTestId ? getNodeTestId(node, index) : `node-${index}`}
            className="first:border-t"
            actions={<NodeMenu node={node} />}
          />
        ))}
      </div>
    </ResourceHubNodesListProvider>
  );
}
