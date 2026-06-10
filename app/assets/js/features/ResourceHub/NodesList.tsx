import React, { useMemo } from "react";

import { useStateWithLocalStorage } from "@/hooks/useStateWithLocalStorage";
import { createTestId } from "@/utils/testid";
import { nodeToUiNode } from "@/models/resourceHubs";
import { NodesList as TurboNodesList, ResourceHubSortBy, sortNodesWithFoldersFirst } from "turboui";
import { usePaths } from "../../routes/paths";
import { useResourceHubNodesListContext, type NodesProps } from "./useResourceHubNodesListContext";

export function NodesList(props: NodesProps) {
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

  return (
    <TurboNodesList
      nodes={uiNodes}
      sortBy={sortBy}
      onSortChange={setSortBy}
      emptyVariant={props.type === "resource_hub" ? "hub" : "folder"}
      listContext={listContext}
      getNodeTestId={(_, index) => createTestId("node", index.toString())}
    />
  );
}

export type { NodesProps } from "./useResourceHubNodesListContext";
