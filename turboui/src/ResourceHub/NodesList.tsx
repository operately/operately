import * as React from "react";

import { Input } from "../Forms";
import { IconSearch, IconX } from "../icons";
import type { ResourceHubSearchProps } from "../ResourceHubPage/types";
import { NodeMenu } from "./NodeMenu";
import { useNewFileModalsContext } from "./contexts/NewFileModalsContext";
import { ResourceHubNodesListProvider, type ResourceHubNodesListContextValue } from "./contexts/NodesListContext";
import { FolderZeroNodes, HubZeroNodes } from "./ZeroNodes";
import { ResourceHubNodeRow } from "./ResourceHubNodeRow";
import { SortControl } from "./SortControl";
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
          {search ? <SearchInput search={search} searchState={searchState} /> : <div />}
          <SortControl sortBy={sortBy} onSortChange={onSortChange} />
        </div>
      )}

      {content}
    </ResourceHubNodesListProvider>
  );
}

function SearchInput({
  search,
  searchState,
}: {
  search: ResourceHubSearchProps;
  searchState: ReturnType<typeof useResourceHubSearch>;
}) {
  const placeholder = search.placeholder ?? "Search this resource hub…";
  const testId = search.testId ?? "resource-hub-search";

  return (
    <div className="relative w-full max-w-sm">
      <IconSearch
        size={16}
        aria-hidden="true"
        className="absolute z-10 left-3 top-1/2 -translate-y-1/2 text-content-dimmed pointer-events-none"
      />
      <Input
        type="text"
        role="searchbox"
        aria-label={placeholder}
        placeholder={placeholder}
        value={searchState.query}
        onChange={(event) => searchState.setQuery(event.target.value)}
        className="py-2 pl-9 pr-9 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-accent-base focus:border-accent-base"
        testId={testId}
      />
      {searchState.query && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => searchState.setQuery("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-content-dimmed hover:text-content-accent"
        >
          <IconX size={16} aria-hidden="true" />
        </button>
      )}
    </div>
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
  if (searchState.status === "loading") {
    return <SearchMessage role="status">Searching…</SearchMessage>;
  }

  if (searchState.status === "error") {
    return <SearchMessage role="alert">Search is unavailable. Try again.</SearchMessage>;
  }

  if (searchState.status === "success" && searchState.results.length === 0) {
    return <SearchMessage role="status">No matching items. Try different keywords.</SearchMessage>;
  }

  return (
    <NodeRows
      nodes={searchState.results}
      getNodePath={getNodePath}
      getNodeTestId={(_, index) => `${testId}-result-${index}`}
    />
  );
}

function SearchMessage({ role, children }: { role: "status" | "alert"; children: React.ReactNode }) {
  return (
    <div
      role={role}
      aria-live={role === "alert" ? "assertive" : "polite"}
      className="py-12 text-center text-sm text-content-dimmed"
    >
      {children}
    </div>
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
