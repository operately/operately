import { useMemo } from "react";

import { useStateWithLocalStorage } from "@/hooks/useStateWithLocalStorage";
import { createTestId } from "@/utils/testid";
import { nodeToUiNode } from "@/models/resourceHubs";
import { usePaths } from "@/routes/paths";
import { ResourceHubSortBy, sortNodesWithFoldersFirst } from "turboui";

import { useResourceHubNodesListContext, type NodesProps } from "./useResourceHubNodesListContext";

export function useResourceHubNodesListProps(props: NodesProps) {
  const paths = usePaths();
  const listContext = useResourceHubNodesListContext(props);
  const [sortBy, setSortBy] = useStateWithLocalStorage<ResourceHubSortBy>("resourceHub", "sortBy", "name");

  const sortOrder = sortBy === "name" ? "asc" : "desc";
  const sortedApiNodes = useMemo(
    () => sortNodesWithFoldersFirst(props.nodes, sortBy, sortOrder),
    [props.nodes, sortBy, sortOrder],
  );

  const uiNodes = useMemo(
    () => sortedApiNodes.map((node) => nodeToUiNode(paths, node)),
    [sortedApiNodes, paths],
  );

  return {
    nodes: uiNodes,
    sortBy,
    onSortChange: setSortBy,
    emptyVariant: props.type === "resource_hub" ? ("hub" as const) : ("folder" as const),
    listContext,
    getNodeTestId: (_: unknown, index: number) => createTestId("node", index.toString()),
  };
}

export type { NodesProps };
