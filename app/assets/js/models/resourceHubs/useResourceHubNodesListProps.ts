import { useMemo } from "react";

import { useStateWithLocalStorage } from "@/hooks/useStateWithLocalStorage";
import { createTestId } from "@/utils/testid";
import { usePaths } from "@/routes/paths";
import { ResourceHubSortBy, sortNodesWithFoldersFirst } from "turboui";

import { getNodePath } from "./nodeUtils";
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

  return {
    nodes: sortedApiNodes,
    getNodePath: (node: NodesProps["nodes"][number]) => getNodePath(paths, node),
    sortBy,
    onSortChange: setSortBy,
    emptyVariant: props.type === "resource_hub" ? ("hub" as const) : ("folder" as const),
    listContext,
    getNodeTestId: (_node: NodesProps["nodes"][number], index: number) => createTestId("node", index.toString()),
  };
}
