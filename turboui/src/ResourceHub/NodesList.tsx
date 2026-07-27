import * as React from "react";

import type { ResourceHubSearchProps } from "../ResourceHubPage/types";
import { SortControl } from "../SortControl";
import { NodeMenu } from "./NodeMenu";
import { useNewFileModalsContext } from "./contexts/NewFileModalsContext";
import { ResourceHubNodesListProvider, type ResourceHubNodesListContextValue } from "./contexts/NodesListContext";
import { FolderZeroNodes, HubZeroNodes } from "./ZeroNodes";
import { ResourceHubNodeRow } from "./ResourceHubNodeRow";
import { ResourceHubSearchInput, ResourceHubSearchMessage } from "./Search";
import { getNodeId } from "./selectors";
import type { ResourceHubNode, ResourceHubSortBy } from "./types";
import { useResourceHubSearch } from "./useResourceHubSearch";

interface NodesListProps {
  nodes: ResourceHubNode[];
  getNodePath: (node: ResourceHubNode) => string;
  sortBy: ResourceHubSortBy;
  onSortChange: (sortBy: ResourceHubSortBy) => void;
  emptyVariant: "hub" | "folder";
  listContext: ResourceHubNodesListContextValue;
  getNodeTestId?: (node: ResourceHubNode, index: number) => string;
  search?: ResourceHubSearchProps;
}

export function NodesList({
  nodes,
  getNodePath,
  sortBy,
  onSortChange,
  emptyVariant,
  listContext,
  getNodeTestId,
  search,
}: NodesListProps) {
  const { filesSelected } = useNewFileModalsContext();
  const searchState = useResourceHubSearch(search);

  const content = searchState.isActive ? (
    <SearchContent
      searchState={searchState}
      getNodePath={getNodePath}
      testId={search?.testId ?? "resource-hub-search"}
    />
  ) : (
    <RegularContent
      nodes={nodes}
      getNodePath={getNodePath}
      emptyVariant={emptyVariant}
      filesSelected={filesSelected}
      getNodeTestId={getNodeTestId}
    />
  );

  return (
    <ResourceHubNodesListProvider value={listContext}>
      {(search || nodes.length > 0) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {search ? <ResourceHubSearchInput search={search} searchState={searchState} /> : <div />}
          <SortControl sortBy={sortBy} onSortChange={onSortChange} disabled={searchState.isActive} />
        </div>
      )}

      {content}
    </ResourceHubNodesListProvider>
  );
}

function SearchContent({
  searchState,
  getNodePath,
  testId,
}: {
  searchState: ReturnType<typeof useResourceHubSearch>;
  getNodePath: NodesListProps["getNodePath"];
  testId: string;
}) {
  const message = <ResourceHubSearchMessage searchState={searchState} />;

  if (searchState.status !== "success" || searchState.results.length === 0) return message;

  return (
    <NodeRows
      nodes={searchState.results}
      getNodePath={getNodePath}
      getNodeTestId={(_, index) => `${testId}-result-${index}`}
    />
  );
}

function RegularContent({
  nodes,
  getNodePath,
  emptyVariant,
  filesSelected,
  getNodeTestId,
}: Pick<NodesListProps, "nodes" | "getNodePath" | "emptyVariant" | "getNodeTestId"> & { filesSelected: boolean }) {
  if (nodes.length < 1) {
    if (filesSelected) return null;
    if (emptyVariant === "hub") return <HubZeroNodes />;
    return <FolderZeroNodes />;
  }

  return <NodeRows nodes={nodes} getNodePath={getNodePath} getNodeTestId={getNodeTestId} />;
}

function NodeRows({
  nodes,
  getNodePath,
  getNodeTestId,
}: Pick<NodesListProps, "nodes" | "getNodePath" | "getNodeTestId">) {
  return (
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
  );
}
